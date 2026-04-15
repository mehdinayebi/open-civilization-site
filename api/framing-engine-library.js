// GET    /api/framing-engine-library              → list all (trimmed rows)
// GET    /api/framing-engine-library?id=42        → fetch one (full row)
// DELETE /api/framing-engine-library?id=42        → remove one
//
// Open endpoint on this origin (URL-obscurity posture, matches the rest of
// the framing engine surface). Don't link it from the public site.

import {
  listEvaluations,
  getEvaluation,
  deleteEvaluation,
} from '../lib/framing-engine/db.js';

export default async function handler(req, res) {
  // Auth gate: FRAMING_ENGINE_PASSWORD via Authorization: Bearer header.
  // Applied to every method (including the verify ping the UI uses on load).
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!process.env.FRAMING_ENGINE_PASSWORD || token !== process.env.FRAMING_ENGINE_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const id = req.query && req.query.id;
      if (id) {
        const n = Number(id);
        if (!Number.isFinite(n) || n <= 0) {
          return res.status(400).json({ ok: false, error: 'id must be a positive integer' });
        }
        const row = await getEvaluation(n);
        if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
        return res.status(200).json({ ok: true, evaluation: row });
      }
      const rows = await listEvaluations(200);
      return res.status(200).json({ ok: true, evaluations: rows });
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ ok: false, error: 'id is required' });
      const n = Number(id);
      if (!Number.isFinite(n) || n <= 0) {
        return res.status(400).json({ ok: false, error: 'id must be a positive integer' });
      }
      const deleted = await deleteEvaluation(n);
      if (!deleted) return res.status(404).json({ ok: false, error: 'Not found' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Framing engine library error:', err);
    return res.status(500).json({
      ok: false,
      error: (err && err.message) || 'Server error',
    });
  }
}
