// Tests for the deterministic guest strategy generator.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateStrategy } from '../lib/guest-desk/strategy.js';
import { DEFAULT_SCORING_WEIGHTS } from '../lib/guest-desk/schema.js';

function snapshot(overrides = {}) {
  return {
    framingId: '1',
    framingVersion: 1,
    status: 'ready',
    episode: {
      title: 'China and the New Age of Dependence',
      shortDescription: 'Western dependence on Chinese manufacturing capacity.',
      mission: 'Examine how strategic dependence corrodes civilizational autonomy.',
      whyNow: 'Industrial capacity has concentrated in China for thirty years.',
      listenerPayoff: 'A clearer map of where real power now sits.',
    },
    framing: {
      coreThemes: ['Industrial hollowing', 'Strategic autonomy', 'Supply chain concentration'],
      keyQuestions: ['What does this dependence cost?', 'What would reshoring require?'],
      tensions: ['Consumer prices vs resilience', 'Speed of decoupling vs cost'],
      opposingViews: ['Free-trade optimism'],
      idealGuestArchetypesRaw: ['Industrial economist with manufacturing experience'],
      suggestedGuestNames: [],
      innovationLens: 'Control over consequential technologies defines modern sovereignty.',
      openingMonologueAngle: 'Start from the machine tool.',
      editorialTriad: null,
      notes: '',
    },
    metadata: { sourceWidget: 'framing', sourceFramingEvaluationId: 1 },
    ...overrides,
  };
}

test('generateStrategy: returns all required top-level fields', () => {
  const s = generateStrategy(snapshot());
  for (const k of ['idealGuestArchetypes','weakGuestArchetypes','targetMix','bestAngles','missingPerspectives','scoringWeights','outreachFraming']) {
    assert.ok(s[k] != null, `missing ${k}`);
  }
});

test('generateStrategy: targetMix matches spec defaults', () => {
  const s = generateStrategy(snapshot());
  assert.deepEqual(s.targetMix, {
    primaryTargets: 5, secondaryTargets: 4, wildcardTargets: 2, backupTargets: 3,
  });
});

test('generateStrategy: deterministic — same input twice yields identical output', () => {
  const a = generateStrategy(snapshot());
  const b = generateStrategy(snapshot());
  assert.deepEqual(a, b);
});

test('generateStrategy: scoring weights sum to 1', () => {
  const s = generateStrategy(snapshot());
  const sum = Object.values(s.scoringWeights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 0.005, `weights sum=${sum}`);
});

test('generateStrategy: ideal archetypes include the framing\'s own guest profile (condensed)', () => {
  const s = generateStrategy(snapshot());
  assert.ok(s.idealGuestArchetypes.length > 0);
  // The original profile should appear in some condensed form (its
  // distinctive words should survive).
  const joined = s.idealGuestArchetypes.join(' ').toLowerCase();
  assert.ok(joined.includes('industrial') || joined.includes('manufactur') || joined.includes('econom'));
});

test('generateStrategy: weak archetypes always include the generic-pundit warning', () => {
  const s = generateStrategy(snapshot());
  const joined = s.weakGuestArchetypes.join(' ').toLowerCase();
  assert.ok(joined.includes('generic pundit'));
});

test('generateStrategy: best angles are drawn from tensions and key questions', () => {
  const s = generateStrategy(snapshot());
  const joined = s.bestAngles.join(' ');
  assert.ok(joined.includes('Consumer prices') || joined.includes('Speed of decoupling'));
});

test('generateStrategy: outreachFraming includes show description, episode angle, and tone guidance', () => {
  const s = generateStrategy(snapshot());
  const o = s.outreachFraming;
  assert.equal(typeof o.showDescription, 'string');
  assert.ok(o.showDescription.length > 30);
  assert.equal(typeof o.episodeAngle, 'string');
  assert.ok(o.episodeAngle.length > 0);
  assert.equal(typeof o.whyThisGuestType, 'string');
  assert.ok(Array.isArray(o.toneGuidance));
  assert.ok(o.toneGuidance.length >= 4);
});

test('generateStrategy: tech-heavy framing nudges weights toward authority + conversation value', () => {
  const techSnap = snapshot({
    framing: {
      coreThemes: ['AI compute', 'Semiconductor capacity', 'Engineering supply'],
      keyQuestions: ['What does AI replace?', 'Who controls compute?'],
      tensions: ['Innovation vs national security'],
      opposingViews: ['Tech accelerationism'],
      idealGuestArchetypesRaw: ['Researcher engaged with policy'],
      suggestedGuestNames: [],
      innovationLens: 'AI defines competitive advantage.',
      openingMonologueAngle: 'Start from the chip.',
      editorialTriad: null,
      notes: '',
    },
    episode: {
      title: 'AI and the Next Industrial Revolution',
      shortDescription: 'How artificial intelligence reshapes economic structure.',
      mission: 'Examine the technological shift transforming production.',
      whyNow: 'Compute has become a strategic resource.',
      listenerPayoff: 'A grounded view of the AI inflection.',
    },
  });
  const s = generateStrategy(techSnap);
  // Tech path overrides defaults: authority=0.25, conversationValue=0.25.
  assert.equal(s.scoringWeights.authority, 0.25);
  assert.equal(s.scoringWeights.conversationValue, 0.25);
});

test('generateStrategy: empty framing falls back to default archetypes', () => {
  const empty = snapshot({
    framing: { coreThemes: [], keyQuestions: [], tensions: [], opposingViews: [], idealGuestArchetypesRaw: [], suggestedGuestNames: [], notes: '' },
    episode: { title: '', shortDescription: '', mission: '', whyNow: '', listenerPayoff: '' },
  });
  const s = generateStrategy(empty);
  assert.ok(s.idealGuestArchetypes.length > 0);
  // Default scoring weights when no lens detected.
  assert.deepEqual(s.scoringWeights, DEFAULT_SCORING_WEIGHTS);
});
