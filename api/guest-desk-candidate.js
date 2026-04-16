// POST   /api/guest-desk-candidate
//   body: { episode_id, candidate: { full_name, title, organization, ... } }
//   creates a Candidate, attaches it to the episode with computed scoring.
//
// PATCH  /api/guest-desk-candidate?episode_candidate_id=N
//   body: { status }
//   updates candidate status only.
//
// DELETE /api/guest-desk-candidate?episode_candidate_id=N
//   removes the episode_candidate join row (the underlying candidate row
//   is preserved so it can be re-used across episodes).

import {
  ensureTables,
  getEpisode,
  getSnapshot,
  getStrategy,
  createCandidate,
  attachCandidateToEpisode,
  updateEpisodeCandidateStatus,
  deleteEpisodeCandidate,
} from '../lib/guest-desk/db.js';
import { validateCandidateInput, validateStatus } from '../lib/guest-desk/schema.js';
import { scoreCandidate } from '../lib/guest-desk/scoring.js';

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!process.env.FRAMING_ENGINE_PASSWORD || token !== process.env.FRAMING_ENGINE_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  let body = req.body;
  // Only attempt JSON parse on non-empty string bodies. DELETE often has no body.
  if (typeof body === 'string' && body.trim().length > 0) {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ ok: false, error: 'Invalid JSON body' }); }
  }

  try {
    if (req.method === 'POST') return handlePost(body, res);
    if (req.method === 'PATCH') return handlePatch(req, body, res);
    if (req.method === 'DELETE') return handleDelete(req, res);
    res.setHeader('Allow', 'POST, PATCH, DELETE');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Guest desk candidate error:', err);
    return res.status(500).json({
      ok: false,
      error: (err && err.message) || 'Server error',
    });
  }
}

async function handlePost(body, res) {
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Body must be an object' });
  }
  const episodeId = Number(body.episode_id);
  if (!Number.isFinite(episodeId) || episodeId <= 0) {
    return res.status(400).json({ ok: false, error: 'episode_id must be a positive integer' });
  }
  const validated = validateCandidateInput(body.candidate);
  if (!validated.ok) {
    return res.status(400).json({ ok: false, error: 'Invalid candidate input', details: validated.errors });
  }

  await ensureTables();
  const episode = await getEpisode(episodeId);
  if (!episode) return res.status(404).json({ ok: false, error: 'Episode not found' });

  const snapshotRow = episode.framing_snapshot_id ? await getSnapshot(episode.framing_snapshot_id) : null;
  const snapshot = snapshotRow && snapshotRow.payload;
  const strategyRow = await getStrategy(episode.id);
  const strategy = strategyRow && strategyRow.payload;

  const candidate = await createCandidate(validated.value);
  const analysis = scoreCandidate(candidate, snapshot, strategy);
  const ec = await attachCandidateToEpisode(episode.id, candidate.id, analysis);

  return res.status(201).json({
    ok: true,
    candidate,
    episode_candidate: ec,
    analysis,
  });
}

async function handlePatch(req, body, res) {
  const id = Number(req.query && req.query.episode_candidate_id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'episode_candidate_id is required' });
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Body must be an object' });
  }
  const validated = validateStatus(body.status);
  if (!validated.ok) return res.status(400).json({ ok: false, error: validated.error });

  const updated = await updateEpisodeCandidateStatus(id, validated.value);
  if (!updated) return res.status(404).json({ ok: false, error: 'Episode candidate not found' });
  return res.status(200).json({ ok: true, episode_candidate_id: updated.id, status: updated.status });
}

async function handleDelete(req, res) {
  const id = Number(req.query && req.query.episode_candidate_id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'episode_candidate_id is required' });
  }
  const deleted = await deleteEpisodeCandidate(id);
  if (!deleted) return res.status(404).json({ ok: false, error: 'Episode candidate not found' });
  return res.status(200).json({ ok: true });
}
