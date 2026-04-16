// Tests for outreach prompt construction + response validation.
// Anthropic calls are NOT made (mocked via fetchImpl).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  OUTREACH_SYSTEM_PROMPT,
  buildOutreachUserPrompt,
  validateOutreachOutput,
  generateOutreachDrafts,
} from '../lib/guest-desk/outreach.js';
import { OUTREACH_CHANNELS, OUTREACH_VARIANTS } from '../lib/guest-desk/schema.js';

const snapshot = {
  episode: {
    title: 'China and the New Age of Dependence',
    mission: 'Examine how strategic dependence corrodes civilizational autonomy.',
    whyNow: 'Industrial capacity has concentrated for thirty years.',
    listenerPayoff: 'A clearer map of where real power sits.',
  },
  framing: {
    coreThemes: ['Industrial hollowing'],
    keyQuestions: ['What does dependence cost?'],
    tensions: ['Consumer prices vs resilience'],
    opposingViews: ['Free-trade optimism'],
  },
};

const strategy = {
  bestAngles: ['Consumer prices vs resilience'],
  outreachFraming: {
    showDescription: 'Open Civilization is a podcast about open societies.',
    episodeAngle: 'How dependence distorts strategy.',
    whyThisGuestType: 'We need an operator-thinker.',
    toneGuidance: ['Serious.', 'Concise.', 'Editorial.', 'No hype.'],
  },
};

const candidate = {
  full_name: 'Dr Jane Industrial',
  title: 'Professor of Industrial Policy',
  organization: 'Stanford',
  short_bio: 'Researches industrial policy and manufacturing capacity.',
  tags: ['industrial policy'],
};

const analysis = {
  overall: 78,
  fit_reason: 'Direct topical authority on manufacturing capacity.',
  best_angle: 'Consumer prices vs resilience',
  recommended_role: 'Primary voice',
  risks: '',
  recommendation: 'Pursue actively. Strong primary candidate.',
};

// ── System prompt ──────────────────────────────────────────────────────────

test('OUTREACH_SYSTEM_PROMPT: enforces voice rules (no hype, no sales, no em-dashes)', () => {
  for (const phrase of ['No sales language', 'No fake familiarity', 'No hype', 'no em-dashes', 'No emojis', 'anti-tribal']) {
    assert.ok(
      OUTREACH_SYSTEM_PROMPT.toLowerCase().includes(phrase.toLowerCase()),
      `system prompt missing: ${phrase}`
    );
  }
});

test('OUTREACH_SYSTEM_PROMPT: demands JSON-only output', () => {
  assert.match(OUTREACH_SYSTEM_PROMPT, /JSON object/i);
});

// ── User prompt ────────────────────────────────────────────────────────────

test('buildOutreachUserPrompt: embeds episode, candidate, and analysis fields', () => {
  const prompt = buildOutreachUserPrompt({ snapshot, strategy, candidate, analysis });
  assert.ok(prompt.includes('China and the New Age of Dependence'));
  assert.ok(prompt.includes('Dr Jane Industrial'));
  assert.ok(prompt.includes('Stanford'));
  assert.ok(prompt.includes('78/100'));
  assert.ok(prompt.includes('Primary voice'));
});

test('buildOutreachUserPrompt: lists every channel/variant pair', () => {
  const prompt = buildOutreachUserPrompt({ snapshot, strategy, candidate, analysis });
  assert.ok(prompt.includes('"channel": "email"'));
  assert.ok(prompt.includes('"channel": "linkedin_dm"'));
  assert.ok(prompt.includes('"channel": "x_dm"'));
  for (const v of ['formal','warmer','elite_short','linkedin','x','follow_up_1','follow_up_2']) {
    assert.ok(prompt.includes('"' + v + '"'), `missing variant ${v}`);
  }
});

test('buildOutreachUserPrompt: gives length guidance for each variant', () => {
  const prompt = buildOutreachUserPrompt({ snapshot, strategy, candidate, analysis });
  assert.ok(/Length guidance/i.test(prompt));
});

// ── Output validation ──────────────────────────────────────────────────────

function fullOutput() {
  return {
    subjects: ['A', 'B', 'C'],
    drafts: [
      { channel: 'email',       variant: 'formal',      subject: 'A', body: 'Body 1.' },
      { channel: 'email',       variant: 'warmer',      subject: 'B', body: 'Body 2.' },
      { channel: 'email',       variant: 'elite_short', subject: 'C', body: 'Body 3.' },
      { channel: 'linkedin_dm', variant: 'linkedin',    subject: '',  body: 'LI body.' },
      { channel: 'x_dm',        variant: 'x',           subject: '',  body: 'X body.' },
      { channel: 'email',       variant: 'follow_up_1', subject: 'D', body: 'Follow 1.' },
      { channel: 'email',       variant: 'follow_up_2', subject: 'E', body: 'Follow 2.' },
    ],
  };
}

test('validateOutreachOutput: accepts a full valid response', () => {
  const r = validateOutreachOutput(fullOutput());
  assert.equal(r.ok, true);
  assert.equal(r.drafts.length, 7);
});

test('validateOutreachOutput: rejects unknown channel', () => {
  const bad = fullOutput();
  bad.drafts[0].channel = 'tiktok';
  const r = validateOutreachOutput(bad);
  assert.equal(r.ok, false);
});

test('validateOutreachOutput: rejects unknown variant', () => {
  const bad = fullOutput();
  bad.drafts[0].variant = 'mystery';
  const r = validateOutreachOutput(bad);
  assert.equal(r.ok, false);
});

test('validateOutreachOutput: rejects empty body', () => {
  const bad = fullOutput();
  bad.drafts[1].body = '   ';
  const r = validateOutreachOutput(bad);
  assert.equal(r.ok, false);
});

test('validateOutreachOutput: rejects empty drafts list', () => {
  const r = validateOutreachOutput({ drafts: [] });
  assert.equal(r.ok, false);
});

test('validateOutreachOutput: rejects null', () => {
  assert.equal(validateOutreachOutput(null).ok, false);
});

// ── End-to-end with mocked fetch ───────────────────────────────────────────

function mockApi(text) {
  return {
    ok: true, status: 200,
    async json() { return { content: [{ type: 'text', text }] }; },
    async text() { return text; },
  };
}

test('generateOutreachDrafts: parses + validates a clean LLM response', async () => {
  const text = JSON.stringify(fullOutput());
  const calls = [];
  async function fetchImpl(url, init) { calls.push({ url, init }); return mockApi(text); }

  const out = await generateOutreachDrafts({
    apiKey: 'k',
    snapshot, strategy, candidate, analysis,
    fetchImpl,
  });
  assert.equal(out.drafts.length, 7);
  assert.equal(calls.length, 1);
});

test('generateOutreachDrafts: throws on invalid JSON', async () => {
  async function fetchImpl() { return mockApi('not json'); }
  await assert.rejects(
    () => generateOutreachDrafts({ apiKey: 'k', snapshot, strategy, candidate, analysis, fetchImpl }),
    /not valid JSON/
  );
});

test('generateOutreachDrafts: throws on schema-invalid response', async () => {
  const bad = fullOutput();
  bad.drafts[0].channel = 'tiktok';
  async function fetchImpl() { return mockApi(JSON.stringify(bad)); }
  await assert.rejects(
    () => generateOutreachDrafts({ apiKey: 'k', snapshot, strategy, candidate, analysis, fetchImpl }),
    /failed validation/
  );
});

// ── Channel/variant constants ──────────────────────────────────────────────

test('OUTREACH_CHANNELS contains the expected three channels', () => {
  assert.deepEqual(OUTREACH_CHANNELS.slice().sort(), ['email','linkedin_dm','x_dm']);
});

test('OUTREACH_VARIANTS contains seven variants', () => {
  assert.equal(OUTREACH_VARIANTS.length, 7);
});
