// Deterministic candidate-scoring algorithm.
//
// Every dimension yields 0..100. Weighted sum (using strategy.scoringWeights)
// produces the overall score, also 0..100. Pure function, no LLM, no I/O.
//
// The intent is signal-rich, NOT magical. A perfect score is unrealistic.
// Most realistic candidates will land in the 50–80 range.

import { DEFAULT_SCORING_WEIGHTS } from './schema.js';

/**
 * @param {object} candidate the Candidate row (validated input shape)
 * @param {object} snapshot  FramingHandoffPayload (snapshot.payload)
 * @param {object} [strategy] GuestStrategy (uses scoringWeights, ideal/weak archetypes)
 * @returns {{ scores: object, overall: number, fit_reason: string, best_angle: string, recommended_role: string, risks: string, recommendation: string }}
 */
export function scoreCandidate(candidate, snapshot, strategy) {
  const weights = (strategy && strategy.scoringWeights) || DEFAULT_SCORING_WEIGHTS;
  const candText = candidateText(candidate);
  const themeText = themeTextFromSnapshot(snapshot);

  const scores = {
    topicalFit: scoreTopicalFit(candText, themeText),
    authority: scoreAuthority(candidate),
    conversationValue: scoreConversationValue(candidate, candText),
    attainability: scoreAttainability(candidate),
    freshness: scoreFreshness(candidate),
    reach: scoreReach(candidate, candText),
  };

  // Weighted sum.
  let overall = 0;
  for (const k of Object.keys(weights)) {
    overall += (scores[k] || 0) * (weights[k] || 0);
  }
  overall = Math.round(overall);

  const archetypeMatch = matchArchetypes(candText, strategy);
  const angles = (strategy && strategy.bestAngles) || [];
  const best_angle = pickBestAngle(candText, themeText, angles);

  return {
    scores,
    overall,
    fit_reason: composeFitReason(candidate, scores, archetypeMatch),
    best_angle,
    recommended_role: composeRecommendedRole(scores, archetypeMatch),
    risks: composeRisks(candidate, scores, archetypeMatch),
    recommendation: composeRecommendation(overall, scores),
  };
}

// ── Inputs ─────────────────────────────────────────────────────────────────

function candidateText(c) {
  return [
    c.full_name, c.title, c.organization, c.short_bio,
    Array.isArray(c.tags) ? c.tags.join(' ') : '',
    c.notes,
  ].filter(Boolean).join(' ').toLowerCase();
}

function themeTextFromSnapshot(snapshot) {
  if (!snapshot) return '';
  const f = snapshot.framing || {};
  const e = snapshot.episode || {};
  // Use STRUCTURED fields only — mission and whyNow are long prose that
  // bloats the keyword set with stopwords and dilutes signal. Title, themes,
  // questions, tensions, opposing views, and the innovation lens are tight
  // editorial picks; they're the right basis for topical-fit matching.
  const parts = [
    e.title, e.shortDescription,
    Array.isArray(f.coreThemes) ? f.coreThemes.join(' ') : '',
    Array.isArray(f.keyQuestions) ? f.keyQuestions.join(' ') : '',
    Array.isArray(f.tensions) ? f.tensions.join(' ') : '',
    Array.isArray(f.opposingViews) ? f.opposingViews.join(' ') : '',
    f.innovationLens,
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

// ── Dimensions ─────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the','a','an','of','to','and','or','for','in','on','at','by','with','as','is','are','be','this','that','it','its','their','our','we','you','they','them','from','about','into','what','how','why','when','where','which','who','whom','will','would','can','could','should','have','has','had','do','does','did','not','but','if','then','than','so','too','also','very','more','most','one','two','three','years','year',
]);

function tokens(text) {
  return text
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function scoreTopicalFit(candText, themeText) {
  if (!candText || !themeText) return 0;
  const candSet = new Set(tokens(candText));
  const themeSet = new Set(tokens(themeText));
  if (themeSet.size === 0 || candSet.size === 0) return 0;
  let matches = 0;
  for (const w of themeSet) if (candSet.has(w)) matches++;
  // Use the smaller set as the denominator so candidates with short bios
  // are not penalised against long framings (and vice versa). Stretch so
  // even ~25% overlap reads as strong on a candidate.
  const denominator = Math.max(1, Math.min(themeSet.size, candSet.size));
  const ratio = matches / denominator;
  return Math.min(100, Math.round(ratio * 200));
}

const HIGH_AUTHORITY = ['professor', 'chair', 'fellow', 'director', 'president', 'chief', 'minister', 'senator', 'former', 'editor-in-chief', 'founder', 'ceo', 'co-founder', 'principal investigator', 'commander', 'general', 'admiral', 'ambassador', 'dean'];
const MID_AUTHORITY  = ['analyst', 'researcher', 'lecturer', 'associate', 'partner', 'manager', 'editor', 'columnist', 'journalist', 'engineer', 'scientist'];

function scoreAuthority(c) {
  let score = 30;
  const t = (c.title || '').toLowerCase();
  const o = (c.organization || '').toLowerCase();
  for (const w of HIGH_AUTHORITY) if (t.includes(w)) score += 22;
  for (const w of MID_AUTHORITY)  if (t.includes(w)) score += 12;
  // Notable orgs bump.
  const notableOrgs = ['stanford', 'harvard', 'mit', 'oxford', 'cambridge', 'princeton', 'yale', 'chicago', 'columbia', 'rand', 'brookings', 'aei', 'cato', 'cfr', 'iiss', 'iisi', 'nber', 'imf', 'world bank', 'goldman', 'jp morgan', 'apollo', 'blackrock', 'open philanthropy', 'darpa'];
  for (const w of notableOrgs) if (o.includes(w)) { score += 10; break; }
  return clamp(score);
}

const CONVERSATION_POSITIVES = ['author', 'book', 'wrote', 'essay', 'lectur', 'podcast', 'speaker', 'debat', 'interview'];
const CONVERSATION_NEGATIVES = ['twitter influencer', 'tiktok', 'thread guy', 'spokesperson'];

function scoreConversationValue(c, candText) {
  let score = 45;
  for (const w of CONVERSATION_POSITIVES) if (candText.includes(w)) score += 8;
  for (const w of CONVERSATION_NEGATIVES) if (candText.includes(w)) score -= 15;
  // Long bios suggest multidimensional perspective.
  const bioLen = (c.short_bio || '').length;
  if (bioLen > 400) score += 8;
  if (bioLen > 800) score += 6;
  return clamp(score);
}

function scoreAttainability(c) {
  let score = 60;
  // Visible contact channels increase attainability.
  if (c.contact_email) score += 18;
  if (c.contact_linkedin) score += 7;
  if (c.contact_x) score += 5;
  if (c.contact_other) score += 4;
  // Very high authority slightly reduces attainability.
  const t = (c.title || '').toLowerCase();
  if (t.includes('president') || t.includes('ceo') || t.includes('minister') || t.includes('senator')) score -= 18;
  return clamp(score);
}

function scoreFreshness(c) {
  // Without recent-publication metadata we use a mild prior. Fresh tags
  // ('recent', '2025', '2026', 'new book') bump it.
  let score = 50;
  const text = candidateText(c);
  if (/\b(2025|2026)\b/.test(text)) score += 25;
  if (/\bnew (book|paper|essay)\b/.test(text)) score += 15;
  if (/\brecent\b/.test(text)) score += 8;
  if (/\bemerit\w*\b/.test(text)) score -= 15; // emeritus suggests slower output
  return clamp(score);
}

function scoreReach(c, candText) {
  let score = 30;
  if (candText.includes('podcast')) score += 8;
  if (candText.includes('newsletter') || candText.includes('substack')) score += 12;
  if (candText.includes('book')) score += 12;
  if (candText.includes('viral')) score += 6;
  if ((c.contact_x || '').length > 0) score += 6;
  return clamp(score);
}

function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

// ── Memo composition ───────────────────────────────────────────────────────

function matchArchetypes(candText, strategy) {
  if (!strategy) return { matches: [], weakHits: [] };
  const matches = [];
  const weakHits = [];
  for (const a of (strategy.idealGuestArchetypes || [])) {
    const keys = keywordsFor(a);
    if (keys.some((k) => candText.includes(k))) matches.push(a);
  }
  for (const w of (strategy.weakGuestArchetypes || [])) {
    const keys = keywordsFor(w);
    if (keys.some((k) => candText.includes(k))) weakHits.push(w);
  }
  return { matches, weakHits };
}

function keywordsFor(phrase) {
  return tokens(phrase.toLowerCase()).slice(0, 5);
}

function pickBestAngle(candText, themeText, angles) {
  if (!Array.isArray(angles) || angles.length === 0) return '';
  // Pick the angle that overlaps most with the candidate's text.
  let best = angles[0];
  let bestScore = -1;
  for (const a of angles) {
    const aTokens = new Set(tokens(a.toLowerCase()));
    let s = 0;
    for (const t of aTokens) if (candText.includes(t)) s++;
    if (s > bestScore) { bestScore = s; best = a; }
  }
  return best;
}

function composeFitReason(c, scores, archetypeMatch) {
  const parts = [];
  if (archetypeMatch.matches.length) {
    parts.push(`Reads as ${archetypeMatch.matches[0]}.`);
  }
  if (scores.topicalFit >= 60) {
    parts.push('Direct topical overlap with the framing.');
  } else if (scores.topicalFit >= 35) {
    parts.push('Adjacent expertise that could illuminate the framing from a useful angle.');
  } else {
    parts.push('Topical fit is thin on the surface; the case will need to be made explicitly.');
  }
  if (scores.authority >= 70) parts.push('Authority is well established.');
  else if (scores.authority < 40) parts.push('Authority signal is modest; weigh accordingly.');
  return parts.join(' ');
}

function composeRecommendedRole(scores, archetypeMatch) {
  if (scores.topicalFit >= 70 && scores.authority >= 60) return 'Primary voice';
  if (scores.conversationValue >= 70) return 'Counter-voice or sparring partner';
  if (archetypeMatch.matches.length) return 'Illustrative perspective';
  return 'Backup or wildcard';
}

function composeRisks(c, scores, archetypeMatch) {
  const r = [];
  if (archetypeMatch.weakHits.length) r.push(`Risks the ${archetypeMatch.weakHits[0]} pattern.`);
  if (scores.attainability < 40) r.push('Hard to reach; expect long cycle times.');
  if (scores.conversationValue < 35) r.push('May be a one-note guest in long-form.');
  if (scores.freshness < 30) r.push('Not currently active; recency may be limited.');
  return r.join(' ');
}

function composeRecommendation(overall, scores) {
  if (overall >= 75) return 'Pursue actively. Strong primary candidate.';
  if (overall >= 60) return 'Worth pursuing; sharpen the angle before outreach.';
  if (overall >= 45) return 'Hold as backup or wildcard; not a top-of-list invite.';
  return 'Pass unless a specific gap requires this voice.';
}
