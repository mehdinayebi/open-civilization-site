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
