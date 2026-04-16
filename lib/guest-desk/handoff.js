// Build-Guest-List orchestration.
//
// One entry point that the API endpoint calls. Idempotent: clicking "Build
// Guest List" twice on the same framing_evaluation_id returns the existing
// downstream Episode rather than creating a duplicate.

import { isFramingReady } from '../framing-engine/schema.js';
import { getEvaluation } from '../framing-engine/db.js';
import {
  findEpisodeByFramingEvaluation,
  createEpisode,
  createSnapshot,
  getSnapshot,
  upsertStrategy,
} from './db.js';
import { buildHandoffPayload } from './schema.js';
import { generateStrategy } from './strategy.js';

/**
 * Run the handoff. Returns:
 *   { ok: true, episode, created, framing_updated_since_handoff }
 *
 * @param {number} framingEvaluationId
 */
export async function buildGuestListFromFraming(framingEvaluationId) {
  // 1. Load the framing evaluation row.
  const framingRow = await getEvaluation(framingEvaluationId);
  if (!framingRow) {
    return { ok: false, status: 404, error: 'Framing evaluation not found' };
  }

  // 2. Validate readiness.
  const result = framingRow.result;
  const readiness = isFramingReady(result);
  if (!readiness.ready) {
    return { ok: false, status: 422, error: `Framing not ready: ${readiness.reason}` };
  }

  // 3. Idempotency check: existing episode for this framing_evaluation_id.
  const existing = await findEpisodeByFramingEvaluation(framingEvaluationId);
  if (existing) {
    // Detect whether the framing has been updated since the snapshot was
    // taken (e.g. follow-ups appended).
    let framing_updated_since_handoff = false;
    if (existing.framing_snapshot_id) {
      const snap = await getSnapshot(existing.framing_snapshot_id);
      if (snap && new Date(framingRow.updated_at) > new Date(snap.framing_evaluation_updated_at)) {
        framing_updated_since_handoff = true;
      }
    }
    return {
      ok: true,
      status: 200,
      episode: existing,
      created: false,
      framing_updated_since_handoff,
    };
  }

  // 4. Build snapshot payload from the result.
  const payload = buildHandoffPayload(framingRow, result);

  // 5. Persist snapshot.
  const snapshot = await createSnapshot(framingRow.id, framingRow.updated_at, payload);

  // 6. Create episode.
  const episode = await createEpisode(payload.episode.title, framingRow.id, snapshot.id);

  // 7. Generate strategy and persist.
  const strategy = generateStrategy(payload);
  await upsertStrategy(episode.id, snapshot.id, strategy);

  return {
    ok: true,
    status: 201,
    episode: { ...episode, framing_snapshot_id: snapshot.id },
    created: true,
    framing_updated_since_handoff: false,
  };
}
