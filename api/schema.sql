-- Reference schema for the Neon Postgres database.
-- https://console.neon.tech → your project → SQL Editor
--
-- subscribers is created manually (run this file once in Neon SQL Editor).
-- framing_evaluations is auto-created on first write by lib/framing-engine/db.js
-- (ensureTable), so running it here is optional but useful for visibility.

CREATE TABLE IF NOT EXISTS subscribers (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

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
);

CREATE INDEX IF NOT EXISTS idx_framing_evaluations_created_at
  ON framing_evaluations (created_at DESC);

-- Guest Desk tables — auto-created by lib/guest-desk/db.js#ensureTables.

CREATE TABLE IF NOT EXISTS framing_snapshots (
  id                              SERIAL PRIMARY KEY,
  framing_evaluation_id           INTEGER NOT NULL,
  framing_evaluation_updated_at   TIMESTAMPTZ NOT NULL,
  payload                         JSONB NOT NULL,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_framing_snapshots_eval
  ON framing_snapshots (framing_evaluation_id);

CREATE TABLE IF NOT EXISTS episodes (
  id                          SERIAL PRIMARY KEY,
  title                       TEXT NOT NULL,
  stage                       TEXT NOT NULL DEFAULT 'guest_planning',
  framing_evaluation_id       INTEGER NOT NULL,
  framing_snapshot_id         INTEGER,
  framing_handoff_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_framing_evaluation
  ON episodes (framing_evaluation_id);

CREATE TABLE IF NOT EXISTS guest_strategies (
  id                          SERIAL PRIMARY KEY,
  episode_id                  INTEGER NOT NULL UNIQUE,
  framing_snapshot_id         INTEGER NOT NULL,
  payload                     JSONB NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
);

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
);
CREATE INDEX IF NOT EXISTS idx_episode_candidates_episode
  ON episode_candidates (episode_id);

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
);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_episode_candidate
  ON outreach_drafts (episode_candidate_id);
