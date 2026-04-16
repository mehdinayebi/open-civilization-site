// POST /api/build-guest-list
//
// Body: { framing_evaluation_id: number }
//
// Idempotent: returns the existing Episode if one already exists for this
// framing_evaluation_id; otherwise creates the snapshot, episode, and
// strategy in one transaction-like sequence.

import { buildGuestListFromFraming } from '../lib/guest-desk/handoff.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!process.env.FRAMING_ENGINE_PASSWORD || token !== process.env.FRAMING_ENGINE_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ ok: false, error: 'Invalid JSON body' }); }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Body must be an object' });
  }

  const id = Number(body.framing_evaluation_id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'framing_evaluation_id must be a positive integer' });
  }

  try {
    const result = await buildGuestListFromFraming(id);
    if (!result.ok) {
      return res.status(result.status || 500).json({ ok: false, error: result.error });
    }
    return res.status(result.status || 200).json({
      ok: true,
      episode: result.episode,
      created: result.created,
      framing_updated_since_handoff: result.framing_updated_since_handoff,
    });
  } catch (err) {
    console.error('Build guest list error:', err);
    return res.status(500).json({
      ok: false,
      error: (err && err.message) || 'Server error',
    });
  }
}
