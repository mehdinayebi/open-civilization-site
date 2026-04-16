// Tests for handoff payload construction.
// (The full handoff orchestration with DB persistence is exercised via the
//  API smoke test; here we test the pure helper that maps a FramingEngineResult
//  to a FramingHandoffPayload.)

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildHandoffPayload, validateCandidateInput, validateStatus } from '../lib/guest-desk/schema.js';
import { CANDIDATE_STATUSES } from '../lib/guest-desk/schema.js';

const framingRow = { id: 42, updated_at: '2026-04-15T20:00:00Z' };

const result = {
  verdict: 'strong_fit',
  fit_score: 38,
  episode_title: 'China and the New Age of Dependence',
  episode_thesis: 'Free societies that no longer make anything cannot stay free. The first sentence ends here. The second sentence is here.',
  belongs_to_open_civilization_because: 'It tests strategic autonomy and industrial strength.',
  core_themes: ['Industrial hollowing', 'Strategic autonomy'],
  key_questions: ['What does dependence cost?'],
  tensions: ['Consumer prices vs resilience'],
  opposing_views: ['Free-trade optimism'],
  guest_profiles: [
    'Dr Jane Doe, professor of industrial policy at Stanford',
    'an industrial economist with manufacturing background',
  ],
  audience_payoff: 'A clearer map of where real power sits.',
  opening_monologue_angle: 'Start from the machine tool.',
  innovation_lens: 'Tech control defines modern sovereignty.',
  editorial_triad: {
    what_is_happening: 'Outsourcing concentrated capacity.',
    why_it_matters_for_open_civilization: 'Building defines defence.',
    what_follows_if_we_get_this_wrong: 'Subordination.',
  },
};

// ── buildHandoffPayload ────────────────────────────────────────────────────

test('buildHandoffPayload: maps episode title/mission/whyNow correctly', () => {
  const p = buildHandoffPayload(framingRow, result);
  assert.equal(p.episode.title, 'China and the New Age of Dependence');
  assert.equal(p.episode.mission, result.episode_thesis);
  assert.equal(p.episode.whyNow, result.belongs_to_open_civilization_because);
});

test('buildHandoffPayload: shortDescription is the first sentence of the thesis', () => {
  const p = buildHandoffPayload(framingRow, result);
  assert.ok(p.episode.shortDescription.startsWith('Free societies that no longer make anything cannot stay free.'));
  assert.ok(!p.episode.shortDescription.includes('The second sentence'));
});

test('buildHandoffPayload: copies all framing arrays', () => {
  const p = buildHandoffPayload(framingRow, result);
  assert.deepEqual(p.framing.coreThemes, result.core_themes);
  assert.deepEqual(p.framing.keyQuestions, result.key_questions);
  assert.deepEqual(p.framing.tensions, result.tensions);
  assert.deepEqual(p.framing.opposingViews, result.opposing_views);
  assert.deepEqual(p.framing.idealGuestArchetypesRaw, result.guest_profiles);
});

test('buildHandoffPayload: extracts proper-name guests from guest_profiles', () => {
  const p = buildHandoffPayload(framingRow, result);
  assert.ok(p.framing.suggestedGuestNames.includes('Jane Doe') || p.framing.suggestedGuestNames.includes('Dr Jane Doe'));
});

test('buildHandoffPayload: includes framingId, version, status, and metadata', () => {
  const p = buildHandoffPayload(framingRow, result);
  assert.equal(p.framingId, '42');
  assert.equal(p.framingVersion, 1);
  assert.equal(p.status, 'ready');
  assert.equal(p.metadata.sourceWidget, 'framing');
  assert.equal(p.metadata.sourceFramingEvaluationId, 42);
});

test('buildHandoffPayload: preserves the framing row updated_at', () => {
  const p = buildHandoffPayload(framingRow, result);
  assert.equal(p.framingUpdatedAt, framingRow.updated_at);
});

// ── validateCandidateInput ─────────────────────────────────────────────────

test('validateCandidateInput: requires full_name', () => {
  const r = validateCandidateInput({ full_name: '' });
  assert.equal(r.ok, false);
});

test('validateCandidateInput: trims fields and accepts a minimal record', () => {
  const r = validateCandidateInput({ full_name: '  Jane  ', short_bio: ' Bio ' });
  assert.equal(r.ok, true);
  assert.equal(r.value.full_name, 'Jane');
  assert.equal(r.value.short_bio, 'Bio');
});

test('validateCandidateInput: filters non-string tags and trims', () => {
  const r = validateCandidateInput({ full_name: 'Jane', tags: ['  policy  ', 0, '', 'science'] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value.tags, ['policy', 'science']);
});

test('validateCandidateInput: rejects too-long fields', () => {
  const r = validateCandidateInput({ full_name: 'Jane', short_bio: 'x'.repeat(5000) });
  assert.equal(r.ok, false);
});

// ── validateStatus ─────────────────────────────────────────────────────────

test('validateStatus: accepts every CANDIDATE_STATUSES entry', () => {
  for (const s of CANDIDATE_STATUSES) {
    const r = validateStatus(s);
    assert.equal(r.ok, true, `expected ${s} to be valid`);
  }
});

test('validateStatus: rejects unknown values', () => {
  assert.equal(validateStatus('emperor').ok, false);
  assert.equal(validateStatus(42).ok, false);
  assert.equal(validateStatus(null).ok, false);
});
