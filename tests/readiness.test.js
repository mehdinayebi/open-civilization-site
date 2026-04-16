// Tests for the framing-ready check used by the Build Guest List CTA gate
// and the build-guest-list endpoint.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isFramingReady, DIMENSIONS } from '../lib/framing-engine/schema.js';

function validResult(overrides = {}) {
  const dimensionScores = {};
  for (const d of DIMENSIONS) dimensionScores[d] = 4;
  return {
    verdict: 'strong_fit',
    fit_score: 36,
    dimension_scores: dimensionScores,
    fit_explanation: 'Strong direct fit.',
    episode_title: 'The Age of Dependence',
    episode_thesis: 'Free societies that do not build cannot stay free.',
    belongs_to_open_civilization_because: 'It tests strategic autonomy and industrial strength directly.',
    core_themes: ['Industrial hollowing', 'Strategic autonomy'],
    key_questions: ['What does dependence cost?'],
    tensions: ['Consumer prices vs resilience'],
    opposing_views: ['Free-trade optimism'],
    guest_profiles: ['Industrial economist'],
    audience_payoff: 'A clearer map of where real power sits.',
    opening_monologue_angle: 'Start from the machine tool.',
    innovation_lens: 'Tech control defines modern sovereignty.',
    editorial_triad: {
      what_is_happening: 'Outsourcing has concentrated capacity.',
      why_it_matters_for_open_civilization: 'Civilizations that cannot build cannot defend.',
      what_follows_if_we_get_this_wrong: 'Strategic dependence becomes subordination.',
    },
    recommended_use: 'full_episode',
    ...overrides,
  };
}

test('isFramingReady: accepts a strong_fit, well-formed result', () => {
  assert.equal(isFramingReady(validResult()).ready, true);
});

test('isFramingReady: rejects when episode_title is missing', () => {
  const r = isFramingReady(validResult({ episode_title: '' }));
  assert.equal(r.ready, false);
  assert.match(r.reason, /title/i);
});

test('isFramingReady: rejects when episode_thesis is too short', () => {
  const r = isFramingReady(validResult({ episode_thesis: 'short' }));
  assert.equal(r.ready, false);
  assert.match(r.reason, /thesis/i);
});

test('isFramingReady: rejects when belongs_to_open_civilization_because is missing', () => {
  const r = isFramingReady(validResult({ belongs_to_open_civilization_because: '' }));
  assert.equal(r.ready, false);
  assert.match(r.reason, /doctrinal/i);
});

test('isFramingReady: rejects when fewer than 3 substantive items across themes/questions/tensions', () => {
  const r = isFramingReady(validResult({
    core_themes: ['x'],         // too short
    key_questions: ['y'],
    tensions: [],
  }));
  assert.equal(r.ready, false);
  assert.match(r.reason, /3 substantive/);
});

test('isFramingReady: rejects when verdict is reject', () => {
  const r = isFramingReady(validResult({ verdict: 'reject' }));
  assert.equal(r.ready, false);
  assert.match(r.reason, /reject/);
});

test('isFramingReady: rejects when verdict is segment_only', () => {
  const r = isFramingReady(validResult({ verdict: 'segment_only' }));
  assert.equal(r.ready, false);
  assert.match(r.reason, /segment_only/);
});

test('isFramingReady: rejects null / undefined / non-objects', () => {
  assert.equal(isFramingReady(null).ready, false);
  assert.equal(isFramingReady(undefined).ready, false);
  assert.equal(isFramingReady('string').ready, false);
  assert.equal(isFramingReady(42).ready, false);
});

test('isFramingReady: counts items only when they are at least 6 chars long', () => {
  // 3 items but two of them are too short — should fail.
  const r = isFramingReady(validResult({
    core_themes: ['ok long enough'],
    key_questions: ['x'],
    tensions: ['y'],
  }));
  assert.equal(r.ready, false);
});

test('isFramingReady: accepts when verdict is reframe and other fields are present', () => {
  // Reframe is acceptable for handoff — the user has chosen to push it forward.
  const r = isFramingReady(validResult({ verdict: 'reframe' }));
  assert.equal(r.ready, true);
});
