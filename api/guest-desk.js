// GET /api/guest-desk?episode=N
//
// Returns the full Guest Desk state for an episode:
//   - episode metadata
//   - framing snapshot (immutable source of truth)
//   - guest strategy (derived planning layer)
//   - candidates with episode-specific scoring + outreach drafts
//   - framing_updated_since_handoff flag (drives the version banner)

import {
  getEpisode,
  getSnapshot,
  getStrategy,
  listEpisodeCandidates,
  listOutreachDrafts,
} from '../lib/guest-desk/db.js';
import { getEvaluation } from '../lib/framing-engine/db.js';

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!process.env.FRAMING_ENGINE_PASSWORD || token !== process.env.FRAMING_ENGINE_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const id = Number(req.query && req.query.episode);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'episode query param is required (positive integer)' });
  }

  try {
    const episode = await getEpisode(id);
    if (!episode) return res.status(404).json({ ok: false, error: 'Episode not found' });

    const snapshot = episode.framing_snapshot_id ? await getSnapshot(episode.framing_snapshot_id) : null;
    const strategy = await getStrategy(episode.id);

    // Detect whether the source framing has been updated since the snapshot.
    let framing_updated_since_handoff = false;
    let current_framing_updated_at = null;
    try {
      const currentFraming = await getEvaluation(episode.framing_evaluation_id);
      if (currentFraming && snapshot) {
        current_framing_updated_at = currentFraming.updated_at;
        if (new Date(currentFraming.updated_at) > new Date(snapshot.framing_evaluation_updated_at)) {
          framing_updated_since_handoff = true;
        }
      }
    } catch (e) {
      console.error('current framing lookup error:', e);
    }

    const candidates = await listEpisodeCandidates(episode.id);
    // Attach drafts per candidate (best-effort; small N).
    for (const c of candidates) {
      try {
        c.drafts = await listOutreachDrafts(c.episode_candidate_id);
      } catch (e) {
        c.drafts = [];
      }
    }

    return res.status(200).json({
      ok: true,
      episode,
      snapshot,
      strategy,
      candidates,
      framing_updated_since_handoff,
      current_framing_updated_at,
    });
  } catch (err) {
    console.error('Guest desk fetch error:', err);
    return res.status(500).json({
      ok: false,
      error: (err && err.message) || 'Server error',
    });
  }
}
