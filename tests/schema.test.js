// Tests for lib/framing-engine/schema.js — validation, score bands, formatting.
// Run with: npm test  (or: node --test tests/*.test.js)

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DIMENSIONS,
  SCORE_MAX,
  DIMENSION_MAX,
  scoreBand,
  validateResult,
  validateInput,
  computeScore,
  formatBriefingText,
  labelVerdict,
  labelRecommendedUse,
} from '../lib/framing-engine/schema.js';

/** A minimal but valid FramingEngineResult for reuse across tests. */
function validResult(overrides = {}) {
  const dimensionScores = {};
  for (const d of DIMENSIONS) dimensionScores[d] = 4;
  const total = 4 * DIMENSIONS.length; // 36

  return {
    verdict: 'strong_fit',
    fit_score: total,
    dimension_scores: dimensionScores,
    fit_explanation: 'This topic cuts to the heart of institutional capacity.',
    episode_title: 'The Age of Dependence',
    episode_thesis: 'Free societies that no longer make anything cannot stay free.',
    belongs_to_open_civilization_because: 'It tests strategic autonomy and industrial strength directly.',
    core_themes: ['Industrial hollowing', 'Strategic autonomy'],
    key_questions: ['What does dependence cost?', 'What does it take to reverse?'],
    tensions: ['Consumer prices vs resilience'],
    opposing_views: ['Free-trade optimism', 'Autarky maximalism'],
    guest_profiles: ['Industrial economist'],
    audience_payoff: 'A clearer map of where real power sits.',
    opening_monologue_angle: 'Start from the machine tool.',
    innovation_lens: 'Control over consequential technologies defines modern sovereignty.',
    editorial_triad: {
      what_is_happening: 'Three decades of outsourcing have concentrated industrial capacity.',
      why_it_matters_for_open_civilization: 'Civilizations that cannot build cannot defend.',
      what_follows_if_we_get_this_wrong: 'Strategic dependence becomes strategic subordination.',
    },
    recommended_use: 'full_episode',
    ...overrides,
  };
}

// ── Score bands ────────────────────────────────────────────────────────────

test('scoreBand: 36–45 maps to strong band', () => {
  assert.equal(scoreBand(36).key, 'strong');
  assert.equal(scoreBand(40).key, 'strong');
  assert.equal(scoreBand(45).key, 'strong');
});

test('scoreBand: 27–35 maps to viable band', () => {
  assert.equal(scoreBand(27).key, 'viable');
  assert.equal(scoreBand(30).key, 'viable');
  assert.equal(scoreBand(35).key, 'viable');
});

test('scoreBand: 18–26 maps to segment band', () => {
  assert.equal(scoreBand(18).key, 'segment');
  assert.equal(scoreBand(22).key, 'segment');
  assert.equal(scoreBand(26).key, 'segment');
});

test('scoreBand: 0–17 maps to reject band', () => {
  assert.equal(scoreBand(0).key, 'reject');
  assert.equal(scoreBand(10).key, 'reject');
  assert.equal(scoreBand(17).key, 'reject');
});

test('scoreBand: non-numeric input falls back to reject', () => {
  assert.equal(scoreBand(NaN).key, 'reject');
  assert.equal(scoreBand('not a number').key, 'reject');
  assert.equal(scoreBand(undefined).key, 'reject');
});

test('scoreBand: returns a human label for each band', () => {
  const bands = [0, 20, 30, 40].map((n) => scoreBand(n).label);
  for (const label of bands) {
    assert.equal(typeof label, 'string');
    assert.ok(label.length > 0);
  }
});

// ── computeScore ───────────────────────────────────────────────────────────

test('computeScore: sums all nine dimensions', () => {
  const scores = {};
  for (const d of DIMENSIONS) scores[d] = 3;
  assert.equal(computeScore(scores), 27);
});

test('computeScore: tolerates missing or non-numeric fields', () => {
  assert.equal(computeScore({}), 0);
  assert.equal(computeScore(null), 0);
  assert.equal(computeScore({ foo: 'bar' }), 0);
});

test('computeScore: matches SCORE_MAX when every dimension is max', () => {
  const scores = {};
  for (const d of DIMENSIONS) scores[d] = DIMENSION_MAX;
  assert.equal(computeScore(scores), SCORE_MAX);
  assert.equal(SCORE_MAX, 45);
});

// ── validateResult ─────────────────────────────────────────────────────────

test('validateResult: accepts a correct result', () => {
  const res = validateResult(validResult());
  assert.equal(res.ok, true);
});

test('validateResult: ensures all 9 dimension fields exist', () => {
  const bad = validResult();
  delete bad.dimension_scores.distinctiveness;
  const res = validateResult(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('distinctiveness')));
});

test('validateResult: rejects dimension scores out of range', () => {
  const bad = validResult();
  bad.dimension_scores.doctrinal_fit = 12; // >5
  const res = validateResult(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('doctrinal_fit')));
});

test('validateResult: rejects unknown verdicts', () => {
  const bad = validResult({ verdict: 'maybe' });
  const res = validateResult(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('verdict')));
});

test('validateResult: rejects unknown recommended_use', () => {
  const bad = validResult({ recommended_use: 'podcast' });
  const res = validateResult(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('recommended_use')));
});

test('validateResult: rejects missing string fields', () => {
  const bad = validResult();
  bad.episode_title = '';
  const res = validateResult(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('episode_title')));
});

test('validateResult: rejects empty array fields', () => {
  const bad = validResult();
  bad.core_themes = [];
  const res = validateResult(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('core_themes')));
});

test('validateResult: rejects missing editorial_triad entries', () => {
  const bad = validResult();
  bad.editorial_triad = { what_is_happening: 'x', why_it_matters_for_open_civilization: '', what_follows_if_we_get_this_wrong: 'y' };
  const res = validateResult(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('why_it_matters_for_open_civilization')));
});

test('validateResult: rejects fit_score outside 0..45', () => {
  const bad1 = validResult({ fit_score: -1 });
  const bad2 = validResult({ fit_score: 99 });
  assert.equal(validateResult(bad1).ok, false);
  assert.equal(validateResult(bad2).ok, false);
});

test('validateResult: rejects completely malformed input', () => {
  assert.equal(validateResult(null).ok, false);
  assert.equal(validateResult('oops').ok, false);
  assert.equal(validateResult(42).ok, false);
});

// ── validateInput ──────────────────────────────────────────────────────────

test('validateInput: accepts a minimal valid input', () => {
  const res = validateInput({
    input_text: 'Western dependence on Chinese manufacturing',
    input_type: 'theme',
    desired_lens: 'geopolitical',
  });
  assert.equal(res.ok, true);
  assert.equal(res.value.input_text.startsWith('Western'), true);
  assert.equal(res.value.notes, '');
  assert.equal(res.value.guest, '');
});

test('validateInput: rejects empty input_text', () => {
  const res = validateInput({
    input_text: '   ',
    input_type: 'theme',
    desired_lens: 'general',
  });
  assert.equal(res.ok, false);
});

test('validateInput: rejects unknown input_type', () => {
  const res = validateInput({
    input_text: 'valid',
    input_type: 'tweet',
    desired_lens: 'general',
  });
  assert.equal(res.ok, false);
});

test('validateInput: rejects unknown desired_lens', () => {
  const res = validateInput({
    input_text: 'valid',
    input_type: 'theme',
    desired_lens: 'astrological',
  });
  assert.equal(res.ok, false);
});

test('validateInput: trims notes and guest', () => {
  const res = validateInput({
    input_text: 'valid',
    input_type: 'theme',
    desired_lens: 'general',
    notes: '   extra   ',
    guest: '  Someone  ',
  });
  assert.equal(res.value.notes, 'extra');
  assert.equal(res.value.guest, 'Someone');
});

test('validateInput: rejects oversized input_text', () => {
  const res = validateInput({
    input_text: 'x'.repeat(25000),
    input_type: 'theme',
    desired_lens: 'general',
  });
  assert.equal(res.ok, false);
});

// ── Labels ─────────────────────────────────────────────────────────────────

test('labelVerdict: returns a human label for each verdict', () => {
  assert.equal(labelVerdict('strong_fit'), 'Strong fit');
  assert.equal(labelVerdict('reframe'), 'Reframe');
  assert.equal(labelVerdict('segment_only'), 'Segment only');
  assert.equal(labelVerdict('reject'), 'Reject');
});

test('labelRecommendedUse: returns a human label for each recommended use', () => {
  assert.equal(labelRecommendedUse('full_episode'), 'Full episode');
  assert.equal(labelRecommendedUse('segment'), 'Segment');
  assert.equal(labelRecommendedUse('supporting_evidence'), 'Supporting evidence');
  assert.equal(labelRecommendedUse('reject'), 'Reject');
});

// ── Briefing formatting ────────────────────────────────────────────────────

test('formatBriefingText: produces a text briefing with expected sections', () => {
  const text = formatBriefingText(validResult());
  for (const header of [
    'EPISODE TITLE',
    'EPISODE THESIS',
    'WHY THIS BELONGS IN OPEN CIVILIZATION',
    'CORE THEMES',
    'KEY QUESTIONS',
    'OPENING MONOLOGUE ANGLE',
    'INNOVATION LENS',
    'EDITORIAL TRIAD',
    'VERDICT:',
  ]) {
    assert.ok(text.includes(header), `missing section: ${header}`);
  }
});

test('formatBriefingText: includes the score and score max', () => {
  const text = formatBriefingText(validResult({ fit_score: 38 }));
  assert.ok(text.includes('38/45'));
});
