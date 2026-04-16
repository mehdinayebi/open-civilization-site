// Tests for the deterministic candidate scoring algorithm.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scoreCandidate } from '../lib/guest-desk/scoring.js';
import { generateStrategy } from '../lib/guest-desk/strategy.js';
import { DEFAULT_SCORING_WEIGHTS } from '../lib/guest-desk/schema.js';

function snapshot() {
  return {
    episode: {
      title: 'China and the New Age of Dependence',
      shortDescription: 'Western dependence on Chinese manufacturing capacity.',
      mission: 'Examine how strategic dependence corrodes civilizational autonomy.',
      whyNow: 'Industrial capacity has concentrated in China for thirty years.',
      listenerPayoff: '',
    },
    framing: {
      coreThemes: ['Industrial hollowing', 'Strategic autonomy', 'Supply chain concentration', 'Manufacturing capacity'],
      keyQuestions: ['What does dependence cost?', 'What would reshoring require?'],
      tensions: ['Consumer prices vs resilience', 'Speed of decoupling vs cost'],
      opposingViews: ['Free-trade optimism'],
      idealGuestArchetypesRaw: ['Industrial economist with manufacturing experience'],
      suggestedGuestNames: [],
      innovationLens: '',
      openingMonologueAngle: '',
      editorialTriad: null,
      notes: '',
    },
  };
}

const sn = snapshot();
const strat = generateStrategy(sn);

const strongCandidate = {
  full_name: 'Dr Jane Industrial',
  title: 'Professor of Industrial Policy',
  organization: 'Stanford',
  short_bio: 'Researcher on industrial policy, manufacturing capacity, supply chain resilience, and strategic autonomy. Author of recent book on reshoring (2025).',
  tags: ['industrial policy', 'manufacturing', 'supply chain'],
  contact_email: 'jane@example.com',
  contact_linkedin: 'https://linkedin.com/in/jane',
};

const weakCandidate = {
  full_name: 'Random Person',
  title: '',
  organization: '',
  short_bio: 'Tweets sometimes about culture-war topics.',
  tags: [],
};

test('scoreCandidate: returns all six dimensions plus overall', () => {
  const r = scoreCandidate(strongCandidate, sn, strat);
  for (const k of ['topicalFit','authority','conversationValue','attainability','freshness','reach']) {
    assert.ok(typeof r.scores[k] === 'number', `missing ${k}`);
    assert.ok(r.scores[k] >= 0 && r.scores[k] <= 100, `${k} out of range`);
  }
  assert.ok(typeof r.overall === 'number');
  assert.ok(r.overall >= 0 && r.overall <= 100);
});

test('scoreCandidate: strong candidate scores meaningfully higher than weak candidate', () => {
  const a = scoreCandidate(strongCandidate, sn, strat);
  const b = scoreCandidate(weakCandidate, sn, strat);
  assert.ok(a.overall > b.overall + 25, `strong=${a.overall} weak=${b.overall}`);
});

test('scoreCandidate: deterministic — same inputs yield same outputs', () => {
  const a = scoreCandidate(strongCandidate, sn, strat);
  const b = scoreCandidate(strongCandidate, sn, strat);
  assert.deepEqual(a, b);
});

test('scoreCandidate: composes a fit_reason, best_angle, recommended_role, risks, recommendation', () => {
  const r = scoreCandidate(strongCandidate, sn, strat);
  assert.ok(r.fit_reason && r.fit_reason.length > 10);
  assert.ok(r.best_angle && r.best_angle.length > 0);
  assert.ok(r.recommended_role && r.recommended_role.length > 0);
  assert.ok(typeof r.risks === 'string');
  assert.ok(r.recommendation && r.recommendation.length > 0);
});

test('scoreCandidate: weights affect overall — different weights produce different overalls', () => {
  const heavyAuth = {
    ...DEFAULT_SCORING_WEIGHTS,
    topicalFit: 0.05, authority: 0.55, conversationValue: 0.10,
    attainability: 0.10, freshness: 0.10, reach: 0.10,
  };
  const heavyTopic = {
    ...DEFAULT_SCORING_WEIGHTS,
    topicalFit: 0.55, authority: 0.10, conversationValue: 0.10,
    attainability: 0.10, freshness: 0.10, reach: 0.05,
  };
  const a = scoreCandidate(strongCandidate, sn, { scoringWeights: heavyAuth });
  const b = scoreCandidate(strongCandidate, sn, { scoringWeights: heavyTopic });
  assert.notEqual(a.overall, b.overall);
});

test('scoreCandidate: missing strategy uses default weights', () => {
  const r = scoreCandidate(strongCandidate, sn);
  assert.ok(r.overall > 0);
});

test('scoreCandidate: scores topicalFit higher when candidate words overlap with framing words', () => {
  const adjacent = { ...strongCandidate, short_bio: 'Researcher on coffee culture and food trends.', tags: ['coffee', 'food'] };
  const a = scoreCandidate(strongCandidate, sn, strat);
  const b = scoreCandidate(adjacent, sn, strat);
  assert.ok(a.scores.topicalFit > b.scores.topicalFit);
});

test('scoreCandidate: high-authority titles boost authority dimension', () => {
  const lowAuth = { ...strongCandidate, title: '' };
  const a = scoreCandidate(strongCandidate, sn, strat).scores.authority;
  const b = scoreCandidate(lowAuth, sn, strat).scores.authority;
  assert.ok(a > b);
});

test('scoreCandidate: visible contact channels boost attainability', () => {
  const noContact = { ...strongCandidate, contact_email: '', contact_linkedin: '' };
  const a = scoreCandidate(strongCandidate, sn, strat).scores.attainability;
  const b = scoreCandidate(noContact, sn, strat).scores.attainability;
  assert.ok(a > b);
});

test('scoreCandidate: recommendation reflects overall band', () => {
  const r = scoreCandidate(strongCandidate, sn, strat);
  if (r.overall >= 75) assert.match(r.recommendation, /Pursue actively/);
  else if (r.overall >= 60) assert.match(r.recommendation, /Worth pursuing/);
  else if (r.overall >= 45) assert.match(r.recommendation, /backup|wildcard/i);
  else assert.match(r.recommendation, /Pass/);
});
