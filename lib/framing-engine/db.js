// Neon Postgres client + query helpers for the Framing Engine library.
//
// The framing_evaluations table is created on demand (CREATE TABLE IF NOT
// EXISTS), so the tool works immediately without a manual migration step.
// ensureTable is memoised per serverless instance to avoid the round-trip on
// every call.

import { neon } from '@neondatabase/serverless';

let _sql = null;
let _tableEnsured = false;

function getSql() {
  if (_sql) return _sql;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

export async function ensureTable() {
  if (_tableEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS framing_evaluations (
      id             SERIAL PRIMARY KEY,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      input_type     TEXT NOT NULL,
      input_text     TEXT NOT NULL,
      desired_lens   TEXT NOT NULL,
      notes          TEXT,
      guest          TEXT,
      verdict        TEXT NOT NULL,
      fit_score      INTEGER NOT NULL,
      episode_title  TEXT NOT NULL,
      result         JSONB NOT NULL,
      followups      JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_framing_evaluations_created_at
      ON framing_evaluations (created_at DESC)
  `;
  _tableEnsured = true;
}

/**
 * Insert a new evaluation row. Returns { id, created_at }.
 * @param {{ input_text: string, input_type: string, desired_lens: string, notes?: string, guest?: string }} input
 * @param {import('./schema.js').FramingEngineResult} result
 */
export async function saveEvaluation(input, result) {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO framing_evaluations
      (input_type, input_text, desired_lens, notes, guest,
       verdict, fit_score, episode_title, result)
    VALUES
      (${input.input_type},
       ${input.input_text},
       ${input.desired_lens},
       ${input.notes || null},
       ${input.guest || null},
       ${result.verdict},
       ${result.fit_score},
       ${result.episode_title},
       ${JSON.stringify(result)}::jsonb)
    RETURNING id, created_at
  `;
  return rows[0];
}

/**
 * List evaluations for the library sidebar. Returns trimmed rows (no full
 * result JSON) suitable for index display.
 */
export async function listEvaluations(limit = 100) {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT
      id,
      created_at,
      updated_at,
      input_type,
      desired_lens,
      substring(input_text, 1, 140) AS input_preview,
      verdict,
      fit_score,
      episode_title,
      jsonb_array_length(followups) AS followup_count
    FROM framing_evaluations
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}

/**
 * Fetch a single evaluation with its full result and followup history.
 * Returns null if not found.
 * @param {number} id
 */
export async function getEvaluation(id) {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT
      id, created_at, updated_at,
      input_type, input_text, desired_lens, notes, guest,
      verdict, fit_score, episode_title, result, followups
    FROM framing_evaluations
    WHERE id = ${id}
  `;
  return rows[0] || null;
}

/**
 * Delete an evaluation row. Returns true if a row was deleted.
 * @param {number} id
 */
export async function deleteEvaluation(id) {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM framing_evaluations WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Append a follow-up entry to an evaluation's followups array.
 * Returns true if the row was found and updated.
 * @param {number} id
 * @param {string} action
 * @param {any} data
 */
export async function appendFollowup(id, action, data) {
  await ensureTable();
  const sql = getSql();
  const entry = [{ action, data, created_at: new Date().toISOString() }];
  const rows = await sql`
    UPDATE framing_evaluations
    SET followups  = followups || ${JSON.stringify(entry)}::jsonb,
        updated_at = now()
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Test-only reset for the memoised state. Not used in production code.
 */
export function _resetForTests() {
  _sql = null;
  _tableEnsured = false;
}
