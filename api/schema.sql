-- Run this once in the Neon SQL Editor to create the subscribers table.
-- https://console.neon.tech → your project → SQL Editor

CREATE TABLE IF NOT EXISTS subscribers (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
