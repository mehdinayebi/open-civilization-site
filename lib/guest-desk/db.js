// Neon Postgres client + queries for Guest Desk.
//
// Tables are auto-created on first write (idempotent CREATE TABLE IF NOT
// EXISTS), so the feature works immediately without a manual migration step.

import { neon } from '@neondatabase/serverless';

let _sql = null;
let _tablesEnsured = false;

function getSql() {
  if (_sql) return _sql;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

export async function ensureTables() {
  if (_tablesEnsured) return;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS framing_snapshots (
      id                              SERIAL PRIMARY KEY,
      framing_evaluation_id           INTEGER NOT NULL,
      framing_evaluation_updated_at   TIMESTAMPTZ NOT NULL,
      payload                         JSONB NOT NULL,
      created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_framing_snapshots_eval
      ON framing_snapshots (framing_evaluation_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS episodes (
      id                          SERIAL PRIMARY KEY,
      title                       TEXT NOT NULL,
      stage                       TEXT NOT NULL DEFAULT 'guest_planning',
      framing_evaluation_id       INTEGER NOT NULL,
      framing_snapshot_id         INTEGER,
      framing_handoff_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_framing_evaluation
      ON episodes (framing_evaluation_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS guest_strategies (
      id                          SERIAL PRIMARY KEY,
      episode_id                  INTEGER NOT NULL UNIQUE,
      framing_snapshot_id         INTEGER NOT NULL,
      payload                     JSONB NOT NULL,
      created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id                  SERIAL PRIMARY KEY,
      full_name           TEXT NOT NULL,
      title               TEXT,
      organization        TEXT,
      short_bio           TEXT,
      tags                TEXT[] DEFAULT '{}',
      source_url          TEXT,
      contact_email       TEXT,
      contact_linkedin    TEXT,
      contact_x           TEXT,
      contact_other       TEXT,
      notes               TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS episode_candidates (
      id                  SERIAL PRIMARY KEY,
      episode_id          INTEGER NOT NULL,
      candidate_id        INTEGER NOT NULL,
      scores              JSONB NOT NULL DEFAULT '{}'::jsonb,
      overall_score       INTEGER NOT NULL DEFAULT 0,
      best_angle          TEXT,
      fit_reason          TEXT,
      recommended_role    TEXT,
      risks               TEXT,
      recommendation      TEXT,
      status              TEXT NOT NULL DEFAULT 'new',
      priority            INTEGER NOT NULL DEFAULT 0,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (episode_id, candidate_id)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_episode_candidates_episode
      ON episode_candidates (episode_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS outreach_drafts (
      id                          SERIAL PRIMARY KEY,
      episode_candidate_id        INTEGER NOT NULL,
      channel                     TEXT NOT NULL,
      variant                     TEXT NOT NULL,
      subject                     TEXT,
      body                        TEXT NOT NULL,
      status                      TEXT NOT NULL DEFAULT 'draft',
      created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_outreach_drafts_episode_candidate
      ON outreach_drafts (episode_candidate_id)
  `;

  _tablesEnsured = true;
}

// ── Snapshot ───────────────────────────────────────────────────────────────

export async function createSnapshot(framingEvaluationId, framingUpdatedAt, payload) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO framing_snapshots
      (framing_evaluation_id, framing_evaluation_updated_at, payload)
    VALUES
      (${framingEvaluationId}, ${framingUpdatedAt}, ${JSON.stringify(payload)}::jsonb)
    RETURNING id, framing_evaluation_id, framing_evaluation_updated_at, payload, created_at
  `;
  return rows[0];
}

export async function getSnapshot(id) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT id, framing_evaluation_id, framing_evaluation_updated_at, payload, created_at
    FROM framing_snapshots WHERE id = ${id}
  `;
  return rows[0] || null;
}

// ── Episode ────────────────────────────────────────────────────────────────

export async function findEpisodeByFramingEvaluation(framingEvaluationId) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, stage, framing_evaluation_id, framing_snapshot_id,
           framing_handoff_at, created_at, updated_at
    FROM episodes
    WHERE framing_evaluation_id = ${framingEvaluationId}
  `;
  return rows[0] || null;
}

export async function createEpisode(title, framingEvaluationId, framingSnapshotId) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO episodes
      (title, stage, framing_evaluation_id, framing_snapshot_id)
    VALUES
      (${title}, 'guest_planning', ${framingEvaluationId}, ${framingSnapshotId})
    RETURNING id, title, stage, framing_evaluation_id, framing_snapshot_id,
              framing_handoff_at, created_at, updated_at
  `;
  return rows[0];
}

export async function getEpisode(id) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, stage, framing_evaluation_id, framing_snapshot_id,
           framing_handoff_at, created_at, updated_at
    FROM episodes WHERE id = ${id}
  `;
  return rows[0] || null;
}

// ── Strategy ───────────────────────────────────────────────────────────────

export async function upsertStrategy(episodeId, framingSnapshotId, payload) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO guest_strategies (episode_id, framing_snapshot_id, payload)
    VALUES (${episodeId}, ${framingSnapshotId}, ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (episode_id) DO UPDATE
      SET framing_snapshot_id = EXCLUDED.framing_snapshot_id,
          payload             = EXCLUDED.payload,
          updated_at          = now()
    RETURNING id, episode_id, framing_snapshot_id, payload, created_at, updated_at
  `;
  return rows[0];
}

export async function getStrategy(episodeId) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT id, episode_id, framing_snapshot_id, payload, created_at, updated_at
    FROM guest_strategies WHERE episode_id = ${episodeId}
  `;
  return rows[0] || null;
}

// ── Candidates ─────────────────────────────────────────────────────────────

export async function createCandidate(input) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO candidates
      (full_name, title, organization, short_bio, tags, source_url,
       contact_email, contact_linkedin, contact_x, contact_other, notes)
    VALUES
      (${input.full_name},
       ${input.title || null},
       ${input.organization || null},
       ${input.short_bio || null},
       ${input.tags || []},
       ${input.source_url || null},
       ${input.contact_email || null},
       ${input.contact_linkedin || null},
       ${input.contact_x || null},
       ${input.contact_other || null},
       ${input.notes || null})
    RETURNING *
  `;
  return rows[0];
}

export async function attachCandidateToEpisode(episodeId, candidateId, analysis) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO episode_candidates
      (episode_id, candidate_id, scores, overall_score,
       best_angle, fit_reason, recommended_role, risks, recommendation)
    VALUES
      (${episodeId}, ${candidateId},
       ${JSON.stringify(analysis.scores)}::jsonb,
       ${analysis.overall},
       ${analysis.best_angle || null},
       ${analysis.fit_reason || null},
       ${analysis.recommended_role || null},
       ${analysis.risks || null},
       ${analysis.recommendation || null})
    RETURNING *
  `;
  return rows[0];
}

export async function listEpisodeCandidates(episodeId) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT
      ec.id            AS episode_candidate_id,
      ec.episode_id,
      ec.candidate_id,
      ec.scores,
      ec.overall_score,
      ec.best_angle,
      ec.fit_reason,
      ec.recommended_role,
      ec.risks,
      ec.recommendation,
      ec.status,
      ec.priority,
      ec.created_at    AS attached_at,
      ec.updated_at    AS ec_updated_at,
      c.id             AS candidate_id,
      c.full_name,
      c.title,
      c.organization,
      c.short_bio,
      c.tags,
      c.source_url,
      c.contact_email,
      c.contact_linkedin,
      c.contact_x,
      c.contact_other,
      c.notes
    FROM episode_candidates ec
    JOIN candidates c ON c.id = ec.candidate_id
    WHERE ec.episode_id = ${episodeId}
    ORDER BY ec.overall_score DESC, ec.created_at DESC
  `;
  return rows;
}

export async function getEpisodeCandidate(episodeCandidateId) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT
      ec.id            AS episode_candidate_id,
      ec.episode_id,
      ec.candidate_id,
      ec.scores,
      ec.overall_score,
      ec.best_angle,
      ec.fit_reason,
      ec.recommended_role,
      ec.risks,
      ec.recommendation,
      ec.status,
      ec.priority,
      ec.created_at    AS attached_at,
      ec.updated_at    AS ec_updated_at,
      c.full_name, c.title, c.organization, c.short_bio, c.tags,
      c.source_url, c.contact_email, c.contact_linkedin, c.contact_x,
      c.contact_other, c.notes
    FROM episode_candidates ec
    JOIN candidates c ON c.id = ec.candidate_id
    WHERE ec.id = ${episodeCandidateId}
  `;
  return rows[0] || null;
}

export async function updateEpisodeCandidateStatus(episodeCandidateId, status) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    UPDATE episode_candidates
    SET status = ${status}, updated_at = now()
    WHERE id = ${episodeCandidateId}
    RETURNING id, status
  `;
  return rows[0] || null;
}

export async function deleteEpisodeCandidate(episodeCandidateId) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM episode_candidates WHERE id = ${episodeCandidateId} RETURNING id
  `;
  return rows.length > 0;
}

// ── Outreach drafts ────────────────────────────────────────────────────────

export async function createOutreachDrafts(episodeCandidateId, drafts) {
  await ensureTables();
  const sql = getSql();
  // Wipe any existing drafts for this candidate first — we only keep the
  // latest generated set in v1. Manual edits should be made through a future
  // edit endpoint (deferred).
  await sql`DELETE FROM outreach_drafts WHERE episode_candidate_id = ${episodeCandidateId}`;
  const inserted = [];
  for (const d of drafts) {
    const rows = await sql`
      INSERT INTO outreach_drafts
        (episode_candidate_id, channel, variant, subject, body, status)
      VALUES
        (${episodeCandidateId}, ${d.channel}, ${d.variant},
         ${d.subject || null}, ${d.body}, 'draft')
      RETURNING id, episode_candidate_id, channel, variant, subject, body, status, created_at
    `;
    inserted.push(rows[0]);
  }
  return inserted;
}

export async function listOutreachDrafts(episodeCandidateId) {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT id, episode_candidate_id, channel, variant, subject, body, status, created_at, updated_at
    FROM outreach_drafts
    WHERE episode_candidate_id = ${episodeCandidateId}
    ORDER BY id ASC
  `;
  return rows;
}

export async function _resetForTests() {
  _sql = null;
  _tablesEnsured = false;
}
