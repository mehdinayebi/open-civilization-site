// POST /api/framing-engine
//
// Protected by ADMIN_TOKEN (same pattern as /api/subscribers).
// Accepts an evaluation input, calls Anthropic, returns a validated result.

import { validateInput } from '../lib/framing-engine/schema.js';
import { MAIN_SYSTEM_PROMPT, buildEvaluationUserPrompt } from '../lib/framing-engine/prompts.js';
import { evaluateWithRepair } from '../lib/framing-engine/anthropic.js';
import { saveEvaluation } from '../lib/framing-engine/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Auth gate: FRAMING_ENGINE_PASSWORD via Authorization: Bearer header.
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

  // Parse body — Vercel parses JSON automatically if Content-Type is set,
  // but be defensive.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ ok: false, error: 'Invalid JSON body' }); }
  }

  const validated = validateInput(body);
  if (!validated.ok) {
    return res.status(400).json({ ok: false, error: 'Invalid input', details: validated.errors });
  }

  const userPrompt = buildEvaluationUserPrompt(validated.value);

  try {
    const result = await evaluateWithRepair({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || undefined,
      system: MAIN_SYSTEM_PROMPT,
      userPrompt,
    });
    if (!result.ok) {
      return res.status(502).json({ ok: false, error: result.error });
    }

    // Auto-save every successful evaluation. Best-effort: if save fails we
    // still return the result with saved_id: null so the UI can warn.
    let saved_id = null;
    let save_error = null;
    try {
      const saved = await saveEvaluation(validated.value, result.value);
      saved_id = saved.id;
    } catch (err) {
      save_error = (err && err.message) || 'Save failed';
      console.error('Framing engine save error:', err);
    }

    return res.status(200).json({
      ok: true,
      result: result.value,
      saved_id,
      save_error,
    });
  } catch (err) {
    console.error('Framing engine evaluation error:', err);
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : 'Server error',
    });
  }
}
