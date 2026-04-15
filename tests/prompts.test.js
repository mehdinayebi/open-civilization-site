// Tests for lib/framing-engine/prompts.js — prompt construction, schema
// round-tripping, and follow-up action coverage.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAIN_SYSTEM_PROMPT,
  OUTPUT_SCHEMA_DESCRIPTION,
  FOLLOWUP_ACTIONS,
  buildEvaluationUserPrompt,
  buildRepairUserPrompt,
  buildFollowupUserPrompt,
} from '../lib/framing-engine/prompts.js';
import { DIMENSIONS } from '../lib/framing-engine/schema.js';

// ── System prompt ──────────────────────────────────────────────────────────

test('MAIN_SYSTEM_PROMPT: mentions all 9 scoring dimensions by name', () => {
  for (const dim of DIMENSIONS) {
    assert.ok(
      MAIN_SYSTEM_PROMPT.includes(dim),
      `system prompt missing dimension ${dim}`
    );
  }
});

test('MAIN_SYSTEM_PROMPT: describes all four band thresholds', () => {
  // The system prompt describes bands in natural language; enum tokens live
  // in OUTPUT_SCHEMA_DESCRIPTION. We verify the prompt names the bands.
  assert.ok(MAIN_SYSTEM_PROMPT.includes('strong dedicated episode'));
  assert.ok(MAIN_SYSTEM_PROMPT.includes('viable episode but needs sharper framing'));
  assert.ok(MAIN_SYSTEM_PROMPT.includes('maybe a segment'));
  assert.ok(MAIN_SYSTEM_PROMPT.includes('reject'));
});

test('OUTPUT_SCHEMA_DESCRIPTION: lists every verdict and recommended_use enum value', () => {
  for (const token of ['strong_fit', 'reframe', 'segment_only', 'reject', 'full_episode', 'segment', 'supporting_evidence']) {
    assert.ok(OUTPUT_SCHEMA_DESCRIPTION.includes(token), `schema desc missing ${token}`);
  }
});

test('MAIN_SYSTEM_PROMPT: enforces voice rules (no em-dashes, no emojis, anti-tribal)', () => {
  assert.ok(MAIN_SYSTEM_PROMPT.includes('No em-dashes'));
  assert.ok(MAIN_SYSTEM_PROMPT.includes('No emojis'));
  assert.ok(MAIN_SYSTEM_PROMPT.toLowerCase().includes('anti-tribal'));
});

test('MAIN_SYSTEM_PROMPT: treats innovation as a first-order pillar', () => {
  assert.ok(MAIN_SYSTEM_PROMPT.toLowerCase().includes('scientific and technological dynamism'));
});

test('MAIN_SYSTEM_PROMPT: demands JSON-only output', () => {
  assert.ok(/json/i.test(MAIN_SYSTEM_PROMPT));
  assert.ok(MAIN_SYSTEM_PROMPT.includes('No markdown') || MAIN_SYSTEM_PROMPT.includes('no markdown'));
});

// ── Output schema description ──────────────────────────────────────────────

test('OUTPUT_SCHEMA_DESCRIPTION: lists every required field', () => {
  const required = [
    'verdict', 'fit_score', 'dimension_scores', 'fit_explanation',
    'episode_title', 'episode_thesis', 'belongs_to_open_civilization_because',
    'core_themes', 'key_questions', 'tensions', 'opposing_views',
    'guest_profiles', 'audience_payoff', 'opening_monologue_angle',
    'innovation_lens', 'editorial_triad', 'recommended_use',
    'what_is_happening', 'why_it_matters_for_open_civilization',
    'what_follows_if_we_get_this_wrong',
  ];
  for (const field of required) {
    assert.ok(OUTPUT_SCHEMA_DESCRIPTION.includes(field), `schema desc missing ${field}`);
  }
});

test('OUTPUT_SCHEMA_DESCRIPTION: lists every dimension', () => {
  for (const d of DIMENSIONS) {
    assert.ok(OUTPUT_SCHEMA_DESCRIPTION.includes(d));
  }
});

// ── Evaluation user prompt ─────────────────────────────────────────────────

test('buildEvaluationUserPrompt: embeds input_type, desired_lens, and input text', () => {
  const prompt = buildEvaluationUserPrompt({
    input_text: 'Birth-rate collapse in South Korea',
    input_type: 'theme',
    desired_lens: 'civilizational',
  });
  assert.ok(prompt.includes('Input type: theme'));
  assert.ok(prompt.includes('Desired lens: civilizational'));
  assert.ok(prompt.includes('Birth-rate collapse in South Korea'));
});

test('buildEvaluationUserPrompt: includes notes and guest when provided', () => {
  const prompt = buildEvaluationUserPrompt({
    input_text: 'AI and white-collar work',
    input_type: 'theme',
    desired_lens: 'technological',
    notes: 'focus on apprenticeship ladder',
    guest: 'David Autor archetype',
  });
  assert.ok(prompt.includes('focus on apprenticeship ladder'));
  assert.ok(prompt.includes('David Autor archetype'));
});

test('buildEvaluationUserPrompt: omits notes and guest sections when empty', () => {
  const prompt = buildEvaluationUserPrompt({
    input_text: 'x',
    input_type: 'theme',
    desired_lens: 'general',
  });
  assert.ok(!prompt.includes('Editorial notes:'));
  assert.ok(!prompt.includes('Guest in mind:'));
});

test('buildEvaluationUserPrompt: embeds the full output schema', () => {
  const prompt = buildEvaluationUserPrompt({
    input_text: 'x',
    input_type: 'theme',
    desired_lens: 'general',
  });
  assert.ok(prompt.includes('editorial_triad'));
  assert.ok(prompt.includes('dimension_scores'));
});

test('buildEvaluationUserPrompt: insists that fit_score equals sum of dimensions', () => {
  const prompt = buildEvaluationUserPrompt({
    input_text: 'x',
    input_type: 'theme',
    desired_lens: 'general',
  });
  assert.ok(prompt.toLowerCase().includes('sum of the nine dimension'));
});

// ── Repair prompt ──────────────────────────────────────────────────────────

test('buildRepairUserPrompt: includes errors and previous output', () => {
  const prompt = buildRepairUserPrompt('not json', ['JSON parse failed']);
  assert.ok(prompt.includes('not json'));
  assert.ok(prompt.includes('JSON parse failed'));
  assert.ok(prompt.includes('editorial_triad'));
});

test('buildRepairUserPrompt: demands JSON-only response', () => {
  const prompt = buildRepairUserPrompt('bad', ['oops']);
  assert.ok(prompt.toLowerCase().includes('only'));
});

// ── Follow-up prompts ──────────────────────────────────────────────────────

test('FOLLOWUP_ACTIONS: includes all seven expected actions', () => {
  const expected = [
    'reframe_title',
    'sharpen_doctrine',
    'make_more_controversial',
    'make_more_guest_friendly',
    'downgrade_to_segment',
    'compare_three_framings',
    'generate_outreach_angle',
  ];
  for (const action of expected) {
    assert.ok(FOLLOWUP_ACTIONS.includes(action), `missing action ${action}`);
  }
  assert.equal(FOLLOWUP_ACTIONS.length, 7);
});

test('buildFollowupUserPrompt: produces a prompt for every supported action', () => {
  const currentResult = { episode_title: 'T', episode_thesis: 'Th', verdict: 'strong_fit', fit_score: 40, belongs_to_open_civilization_because: 'B' };
  const originalInput = { input_text: 'x', input_type: 'theme', desired_lens: 'general' };
  for (const action of FOLLOWUP_ACTIONS) {
    const prompt = buildFollowupUserPrompt(action, currentResult, originalInput);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.length > 100);
    assert.ok(prompt.includes('Current episode title: T'));
    assert.ok(prompt.includes('Original input type: theme'));
  }
});

test('buildFollowupUserPrompt: reframe_title asks for 3 titles', () => {
  const currentResult = { episode_title: 'T', episode_thesis: 'Th', verdict: 'strong_fit', fit_score: 40, belongs_to_open_civilization_because: 'B' };
  const originalInput = { input_text: 'x', input_type: 'theme', desired_lens: 'general' };
  const prompt = buildFollowupUserPrompt('reframe_title', currentResult, originalInput);
  assert.ok(prompt.toLowerCase().includes('three'));
  assert.ok(prompt.includes('titles'));
});

test('buildFollowupUserPrompt: compare_three_framings lists safest, sharpest, most_elegant', () => {
  const currentResult = { episode_title: 'T', episode_thesis: 'Th', verdict: 'strong_fit', fit_score: 40, belongs_to_open_civilization_because: 'B' };
  const originalInput = { input_text: 'x', input_type: 'theme', desired_lens: 'general' };
  const prompt = buildFollowupUserPrompt('compare_three_framings', currentResult, originalInput);
  assert.ok(prompt.includes('safest'));
  assert.ok(prompt.includes('sharpest'));
  assert.ok(prompt.includes('most_elegant'));
});

test('buildFollowupUserPrompt: unknown action throws', () => {
  const currentResult = { episode_title: 'T', episode_thesis: 'Th', verdict: 'strong_fit', fit_score: 40, belongs_to_open_civilization_because: 'B' };
  const originalInput = { input_text: 'x', input_type: 'theme', desired_lens: 'general' };
  assert.throws(() => buildFollowupUserPrompt('teleport', currentResult, originalInput), /Unknown/);
});
