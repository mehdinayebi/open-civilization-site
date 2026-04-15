// Tests for lib/framing-engine/anthropic.js — JSON extraction, evaluate-with-
// repair success/retry paths, and follow-up call handling. Network is mocked
// via an injected fetchImpl — no real API calls.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractJson,
  evaluateWithRepair,
  callAnthropic,
  callForFollowup,
} from '../lib/framing-engine/anthropic.js';
import { DIMENSIONS } from '../lib/framing-engine/schema.js';

// ── Test helpers ───────────────────────────────────────────────────────────

function validResultObject() {
  const dimension_scores = {};
  for (const d of DIMENSIONS) dimension_scores[d] = 4;
  return {
    verdict: 'strong_fit',
    fit_score: 36,
    dimension_scores,
    fit_explanation: 'Explanation.',
    episode_title: 'Title',
    episode_thesis: 'Thesis.',
    belongs_to_open_civilization_because: 'Because.',
    core_themes: ['Theme A'],
    key_questions: ['Question?'],
    tensions: ['Tension'],
    opposing_views: ['View'],
    guest_profiles: ['Profile'],
    audience_payoff: 'Payoff.',
    opening_monologue_angle: 'Angle.',
    innovation_lens: 'Lens.',
    editorial_triad: {
      what_is_happening: 'Happening.',
      why_it_matters_for_open_civilization: 'Matters.',
      what_follows_if_we_get_this_wrong: 'Follows.',
    },
    recommended_use: 'full_episode',
  };
}

function mockApiResponse(text) {
  return {
    ok: true,
    status: 200,
    async json() {
      return { content: [{ type: 'text', text }] };
    },
    async text() {
      return text;
    },
  };
}

function makeSequentialFetch(responses) {
  let i = 0;
  const calls = [];
  async function f(url, init) {
    calls.push({ url, init });
    const r = responses[i];
    i += 1;
    if (!r) throw new Error('fetch called more times than expected');
    return r;
  }
  return { fetchImpl: f, calls };
}

// ── extractJson ────────────────────────────────────────────────────────────

test('extractJson: parses a clean JSON object', () => {
  const result = extractJson('{"a":1}');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { a: 1 });
});

test('extractJson: strips ```json fences', () => {
  const result = extractJson('```json\n{"a":1}\n```');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { a: 1 });
});

test('extractJson: strips generic ``` fences', () => {
  const result = extractJson('```\n{"a":1}\n```');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { a: 1 });
});

test('extractJson: finds JSON after a preamble', () => {
  const result = extractJson('Here you go: {"a":1} that is all.');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { a: 1 });
});

test('extractJson: reports failure on invalid JSON', () => {
  const result = extractJson('not json at all');
  assert.equal(result.ok, false);
  assert.ok(result.error);
});

test('extractJson: reports failure on non-string input', () => {
  const result = extractJson(null);
  assert.equal(result.ok, false);
});

// ── callAnthropic ──────────────────────────────────────────────────────────

test('callAnthropic: throws when API key is missing', async () => {
  await assert.rejects(
    () => callAnthropic({
      apiKey: '',
      system: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
      fetchImpl: async () => { throw new Error('should not be called'); },
    }),
    /ANTHROPIC_API_KEY/
  );
});

test('callAnthropic: passes headers and body to fetch', async () => {
  const { fetchImpl, calls } = makeSequentialFetch([mockApiResponse('{"a":1}')]);
  const text = await callAnthropic({
    apiKey: 'test-key',
    model: 'claude-opus-4-6',
    system: 'sys',
    messages: [{ role: 'user', content: 'hi' }],
    fetchImpl,
  });
  assert.equal(text, '{"a":1}');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['x-api-key'], 'test-key');
  assert.equal(calls[0].init.headers['anthropic-version'], '2023-06-01');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.model, 'claude-opus-4-6');
  assert.equal(body.system, 'sys');
  assert.deepEqual(body.messages, [{ role: 'user', content: 'hi' }]);
});

test('callAnthropic: surfaces non-2xx errors', async () => {
  const { fetchImpl } = makeSequentialFetch([
    { ok: false, status: 429, async text() { return 'rate limited'; } },
  ]);
  await assert.rejects(
    () => callAnthropic({
      apiKey: 'k',
      system: 's',
      messages: [{ role: 'user', content: 'm' }],
      fetchImpl,
    }),
    /429/
  );
});

test('callAnthropic: throws when response has no text block', async () => {
  const { fetchImpl } = makeSequentialFetch([
    { ok: true, status: 200, async json() { return { content: [] }; }, async text() { return ''; } },
  ]);
  await assert.rejects(
    () => callAnthropic({
      apiKey: 'k',
      system: 's',
      messages: [{ role: 'user', content: 'm' }],
      fetchImpl,
    }),
    /no text content/
  );
});

// ── evaluateWithRepair ─────────────────────────────────────────────────────

test('evaluateWithRepair: happy path returns validated result', async () => {
  const valid = validResultObject();
  const { fetchImpl, calls } = makeSequentialFetch([
    mockApiResponse(JSON.stringify(valid)),
  ]);
  const res = await evaluateWithRepair({
    apiKey: 'k',
    system: 'sys',
    userPrompt: 'eval this',
    fetchImpl,
  });
  assert.equal(res.ok, true);
  assert.equal(res.value.verdict, 'strong_fit');
  assert.equal(calls.length, 1); // no repair needed
});

test('evaluateWithRepair: retries once when first response is malformed JSON', async () => {
  const valid = validResultObject();
  const { fetchImpl, calls } = makeSequentialFetch([
    mockApiResponse('not json at all'),
    mockApiResponse(JSON.stringify(valid)),
  ]);
  const res = await evaluateWithRepair({
    apiKey: 'k',
    system: 'sys',
    userPrompt: 'eval this',
    fetchImpl,
  });
  assert.equal(res.ok, true);
  assert.equal(res.value.episode_title, 'Title');
  assert.equal(calls.length, 2); // one original + one repair

  // The repair call must include the assistant's failed message and a user
  // repair message, so the model has the error context.
  const repairBody = JSON.parse(calls[1].init.body);
  assert.equal(repairBody.messages.length, 3);
  assert.equal(repairBody.messages[1].role, 'assistant');
  assert.equal(repairBody.messages[2].role, 'user');
});

test('evaluateWithRepair: retries once when first response parses but fails schema', async () => {
  const valid = validResultObject();
  const invalid = { verdict: 'not a real verdict' };
  const { fetchImpl, calls } = makeSequentialFetch([
    mockApiResponse(JSON.stringify(invalid)),
    mockApiResponse(JSON.stringify(valid)),
  ]);
  const res = await evaluateWithRepair({
    apiKey: 'k',
    system: 'sys',
    userPrompt: 'eval this',
    fetchImpl,
  });
  assert.equal(res.ok, true);
  assert.equal(calls.length, 2);
});

test('evaluateWithRepair: returns ok:false if repair still fails', async () => {
  const { fetchImpl } = makeSequentialFetch([
    mockApiResponse('still not json'),
    mockApiResponse('still not json either'),
  ]);
  const res = await evaluateWithRepair({
    apiKey: 'k',
    system: 'sys',
    userPrompt: 'x',
    fetchImpl,
  });
  assert.equal(res.ok, false);
  assert.match(res.error, /Repair failed/);
});

// ── callForFollowup ────────────────────────────────────────────────────────

test('callForFollowup: returns parsed JSON on first success', async () => {
  const { fetchImpl, calls } = makeSequentialFetch([
    mockApiResponse('{"titles":[{"title":"X","rationale":"Y"}]}'),
  ]);
  const data = await callForFollowup({
    apiKey: 'k',
    system: 'sys',
    userPrompt: 'x',
    fetchImpl,
  });
  assert.equal(data.titles[0].title, 'X');
  assert.equal(calls.length, 1);
});

test('callForFollowup: retries once on malformed JSON', async () => {
  const { fetchImpl, calls } = makeSequentialFetch([
    mockApiResponse('nope'),
    mockApiResponse('{"titles":[]}'),
  ]);
  const data = await callForFollowup({
    apiKey: 'k',
    system: 'sys',
    userPrompt: 'x',
    fetchImpl,
  });
  assert.deepEqual(data, { titles: [] });
  assert.equal(calls.length, 2);
});

test('callForFollowup: throws if retry also fails', async () => {
  const { fetchImpl } = makeSequentialFetch([
    mockApiResponse('nope'),
    mockApiResponse('still nope'),
  ]);
  await assert.rejects(
    () => callForFollowup({
      apiKey: 'k',
      system: 'sys',
      userPrompt: 'x',
      fetchImpl,
    }),
    /not valid JSON/
  );
});
