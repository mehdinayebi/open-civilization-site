// POST /api/framing-engine-action
//
// Runs a narrowly scoped follow-up transformation on an existing result.
// Protected by ADMIN_TOKEN.

import { validateInput, validateResult } from '../lib/framing-engine/schema.js';
import { MAIN_SYSTEM_PROMPT, FOLLOWUP_ACTIONS, buildFollowupUserPrompt } from '../lib/framing-engine/prompts.js';
import { callForFollowup } from '../lib/framing-engine/anthropic.js';
import { appendFollowup } from '../lib/framing-engine/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Auth gate
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!process.env.FRAMING_ENGINE_PASSWORD || token !== process.env.FRAMING_ENGINE_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'ANTHROPIC_API_KEY is not configured on the server',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ ok: false, error: 'Invalid JSON body' }); }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Body must be an object' });
  }

  const action = body.action;
  if (!FOLLOWUP_ACTIONS.includes(action)) {
    return res.status(400).json({
      ok: false,
      error: `action must be one of ${FOLLOWUP_ACTIONS.join(', ')}`,
    });
  }

  const inputCheck = validateInput(body.original_input);
  if (!inputCheck.ok) {
    return res.status(400).json({ ok: false, error: 'Invalid original_input', details: inputCheck.errors });
  }

  const resultCheck = validateResult(body.current_result);
  if (!resultCheck.ok) {
    return res.status(400).json({ ok: false, error: 'Invalid current_result', details: resultCheck.errors });
  }

  const userPrompt = buildFollowupUserPrompt(action, resultCheck.value, inputCheck.value);

  try {
    const data = await callForFollowup({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || undefined,
      system: MAIN_SYSTEM_PROMPT,
      userPrompt,
    });

    // If the caller passed a saved_id, append this follow-up to that row's
    // followups history. Best-effort: we still return data on save failure.
    if (body.saved_id) {
      const n = Number(body.saved_id);
      if (Number.isFinite(n) && n > 0) {
        try {
          await appendFollowup(n, action, data);
        } catch (err) {
          console.error('Append followup error:', err);
        }
      }
    }

    return res.status(200).json({ ok: true, action, data });
  } catch (err) {
    console.error('Framing engine action error:', err);
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : 'Server error',
    });
  }
}
