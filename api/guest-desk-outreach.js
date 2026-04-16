// POST /api/guest-desk-outreach
//   body: { episode_candidate_id: number }
//
// Generates the full outreach draft set for one episode-candidate via
// Anthropic, persists the drafts (replacing any previous set), and returns
// them.

import {
  getEpisode,
  getSnapshot,
  getStrategy,
  getEpisodeCandidate,
  createOutreachDrafts,
} from '../lib/guest-desk/db.js';
import { generateOutreachDrafts } from '../lib/guest-desk/outreach.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

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
  const id = Number(body && body.episode_candidate_id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'episode_candidate_id must be a positive integer' });
  }

  try {
    const ec = await getEpisodeCandidate(id);
    if (!ec) return res.status(404).json({ ok: false, error: 'Episode candidate not found' });

    const episode = await getEpisode(ec.episode_id);
    if (!episode) return res.status(404).json({ ok: false, error: 'Episode not found' });
    const snapshotRow = episode.framing_snapshot_id ? await getSnapshot(episode.framing_snapshot_id) : null;
    const strategyRow = await getStrategy(episode.id);

    if (!snapshotRow || !strategyRow) {
      return res.status(500).json({
        ok: false,
        error: 'Episode is missing framing snapshot or guest strategy',
      });
    }

    const candidate = {
      full_name: ec.full_name,
      title: ec.title,
      organization: ec.organization,
      short_bio: ec.short_bio,
      tags: ec.tags || [],
    };
    const analysis = {
      scores: ec.scores,
      overall: ec.overall_score,
      fit_reason: ec.fit_reason,
      best_angle: ec.best_angle,
      recommended_role: ec.recommended_role,
      risks: ec.risks,
      recommendation: ec.recommendation,
    };

    const { drafts } = await generateOutreachDrafts({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || undefined,
      snapshot: snapshotRow.payload,
      strategy: strategyRow.payload,
      candidate,
      analysis,
    });

    const persisted = await createOutreachDrafts(id, drafts);
    return res.status(200).json({ ok: true, drafts: persisted });
  } catch (err) {
    console.error('Outreach generation error:', err);
    return res.status(500).json({
      ok: false,
      error: (err && err.message) || 'Server error',
    });
  }
}
