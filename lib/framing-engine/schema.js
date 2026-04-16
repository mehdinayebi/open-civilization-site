// Schema, validation, and derived helpers for the Framing Engine.
//
// The data contract is expressed in plain JS (no TypeScript in this repo).
// Every function here is pure and synchronous so it is trivial to unit test.

/** @typedef {'theme'|'article'|'report'|'event'|'draft_episode'} InputType */
/** @typedef {'general'|'geopolitical'|'institutional'|'economic'|'technological'|'cultural'|'defense'|'civilizational'} DesiredLens */
/** @typedef {'strong_fit'|'reframe'|'segment_only'|'reject'} FramingVerdict */
/** @typedef {'full_episode'|'segment'|'supporting_evidence'|'reject'} RecommendedUse */

/** All valid input types, in display order. */
export const INPUT_TYPES = ['theme', 'article', 'report', 'event', 'draft_episode'];

/** All valid desired lenses, in display order. */
export const DESIRED_LENSES = [
  'general',
  'geopolitical',
  'institutional',
  'economic',
  'technological',
  'cultural',
  'defense',
  'civilizational',
];

/** All valid verdicts. */
export const VERDICTS = ['strong_fit', 'reframe', 'segment_only', 'reject'];

/** All valid recommended uses. */
export const RECOMMENDED_USES = ['full_episode', 'segment', 'supporting_evidence', 'reject'];

/** The 9 scoring dimensions, in canonical order. Each is scored 0..5. */
export const DIMENSIONS = [
  'civilizational_relevance',
  'doctrinal_fit',
  'structural_depth',
  'strategic_consequence',
  'tension_disagreement_potential',
  'episode_viability',
  'distinctiveness',
  'audience_payoff',
  'innovation_technological_relevance',
];

/** Human-readable labels for each dimension. */
export const DIMENSION_LABELS = {
  civilizational_relevance: 'Civilizational relevance',
  doctrinal_fit: 'Doctrinal fit',
  structural_depth: 'Structural depth',
  strategic_consequence: 'Strategic consequence',
  tension_disagreement_potential: 'Tension / disagreement potential',
  episode_viability: 'Episode viability',
  distinctiveness: 'Distinctiveness',
  audience_payoff: 'Audience payoff',
  innovation_technological_relevance: 'Innovation and technological relevance',
};

/** Per-dimension maximum. */
export const DIMENSION_MAX = 5;

/** Total score maximum (9 dimensions × 5). */
export const SCORE_MAX = DIMENSIONS.length * DIMENSION_MAX; // 45

/**
 * Map a total score to a band. Bands are display labels — they describe how
 * the score "feels" but they do NOT mechanically determine the verdict, per
 * the editorial spec.
 *
 * @param {number} score
 * @returns {{ key: 'strong'|'viable'|'segment'|'reject', label: string, range: [number, number] }}
 */
export function scoreBand(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return BANDS.reject;
  if (n >= 36) return BANDS.strong;
  if (n >= 27) return BANDS.viable;
  if (n >= 18) return BANDS.segment;
  return BANDS.reject;
}

const BANDS = {
  strong: { key: 'strong', label: 'Strong dedicated episode', range: [36, 45] },
  viable: { key: 'viable', label: 'Viable, needs sharper framing', range: [27, 35] },
  segment: { key: 'segment', label: 'Segment, not a full episode', range: [18, 26] },
  reject: { key: 'reject', label: 'Reject', range: [0, 17] },
};

/**
 * Validate a parsed FramingEngineResult object. Returns { ok: true, value }
 * on success, or { ok: false, errors: string[] } on failure. The validator is
 * deliberately strict: it rejects missing fields, wrong types, and dimension
 * scores outside [0, DIMENSION_MAX].
 *
 * @param {unknown} raw
 */
export function validateResult(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['Result must be an object'] };
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);

  // Verdict
  if (!VERDICTS.includes(/** @type {any} */ (obj.verdict))) {
    errors.push(`verdict must be one of ${VERDICTS.join(', ')}`);
  }

  // Recommended use
  if (!RECOMMENDED_USES.includes(/** @type {any} */ (obj.recommended_use))) {
    errors.push(`recommended_use must be one of ${RECOMMENDED_USES.join(', ')}`);
  }

  // Fit score
  if (typeof obj.fit_score !== 'number' || !Number.isFinite(obj.fit_score)) {
    errors.push('fit_score must be a finite number');
  } else if (obj.fit_score < 0 || obj.fit_score > SCORE_MAX) {
    errors.push(`fit_score must be between 0 and ${SCORE_MAX}`);
  }

  // Dimension scores
  const ds = obj.dimension_scores;
  if (!ds || typeof ds !== 'object') {
    errors.push('dimension_scores must be an object');
  } else {
    for (const dim of DIMENSIONS) {
      const v = /** @type {Record<string, unknown>} */ (ds)[dim];
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        errors.push(`dimension_scores.${dim} must be a finite number`);
      } else if (v < 0 || v > DIMENSION_MAX) {
        errors.push(`dimension_scores.${dim} must be between 0 and ${DIMENSION_MAX}`);
      }
    }
  }

  // String fields
  const stringFields = [
    'fit_explanation',
    'episode_title',
    'episode_thesis',
    'belongs_to_open_civilization_because',
    'audience_payoff',
    'opening_monologue_angle',
    'innovation_lens',
  ];
  for (const field of stringFields) {
    if (typeof obj[field] !== 'string' || !obj[field]) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  // Array-of-string fields
  const arrayFields = ['core_themes', 'key_questions', 'tensions', 'opposing_views', 'guest_profiles'];
  for (const field of arrayFields) {
    const arr = obj[field];
    if (!Array.isArray(arr) || arr.length === 0) {
      errors.push(`${field} must be a non-empty array of strings`);
    } else if (!arr.every((v) => typeof v === 'string' && v.length > 0)) {
      errors.push(`${field} must contain only non-empty strings`);
    }
  }

  // Editorial triad
  const triad = obj.editorial_triad;
  if (!triad || typeof triad !== 'object') {
    errors.push('editorial_triad must be an object');
  } else {
    const t = /** @type {Record<string, unknown>} */ (triad);
    for (const key of ['what_is_happening', 'why_it_matters_for_open_civilization', 'what_follows_if_we_get_this_wrong']) {
      if (typeof t[key] !== 'string' || !t[key]) {
        errors.push(`editorial_triad.${key} must be a non-empty string`);
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: /** @type {import('./schema.js').FramingEngineResult} */ (obj) };
}

/**
 * Compute the sum of dimension scores. Does not mutate.
 * @param {Record<string, number>} dimensionScores
 */
export function computeScore(dimensionScores) {
  let sum = 0;
  for (const dim of DIMENSIONS) {
    const v = dimensionScores && dimensionScores[dim];
    if (typeof v === 'number' && Number.isFinite(v)) sum += v;
  }
  return sum;
}

/**
 * Validate the input payload the UI sends to the evaluate endpoint.
 * Returns a sanitized form or an error list.
 * @param {unknown} raw
 */
export function validateInput(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['Input must be an object'] };
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);

  const input_text = typeof obj.input_text === 'string' ? obj.input_text.trim() : '';
  if (!input_text) errors.push('input_text is required');
  if (input_text.length > 20000) errors.push('input_text is too long (max 20,000 chars)');

  const input_type = typeof obj.input_type === 'string' ? obj.input_type : '';
  if (!INPUT_TYPES.includes(input_type)) {
    errors.push(`input_type must be one of ${INPUT_TYPES.join(', ')}`);
  }

  const desired_lens = typeof obj.desired_lens === 'string' ? obj.desired_lens : 'general';
  if (!DESIRED_LENSES.includes(desired_lens)) {
    errors.push(`desired_lens must be one of ${DESIRED_LENSES.join(', ')}`);
  }

  const notes = typeof obj.notes === 'string' ? obj.notes.trim() : '';
  const guest = typeof obj.guest === 'string' ? obj.guest.trim() : '';

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { input_text, input_type, desired_lens, notes, guest },
  };
}

/**
 * Render a FramingEngineResult as clean plain-text briefing, suitable for
 * the "Copy briefing" button. No markdown wrappers, no hype, no emojis.
 * @param {import('./schema.js').FramingEngineResult} r
 */
export function formatBriefingText(r) {
  const L = (label, body) => `${label.toUpperCase()}\n${body}\n`;
  const bullets = (arr) => arr.map((s) => `  - ${s}`).join('\n');

  const triad = r.editorial_triad;
  const lines = [
    `OPEN CIVILIZATION · EPISODE BRIEFING`,
    ``,
    `EPISODE TITLE`,
    r.episode_title,
    ``,
    `EPISODE THESIS`,
    r.episode_thesis,
    ``,
    L('WHY THIS BELONGS IN OPEN CIVILIZATION', r.belongs_to_open_civilization_because),
    `CORE THEMES`,
    bullets(r.core_themes),
    ``,
    `KEY QUESTIONS`,
    bullets(r.key_questions),
    ``,
    `CHALLENGES AND TENSIONS`,
    bullets(r.tensions),
    ``,
    `OPPOSING AND COMPETING VIEWS`,
    bullets(r.opposing_views),
    ``,
    `GUEST PROFILES`,
    bullets(r.guest_profiles),
    ``,
    L('AUDIENCE PAYOFF', r.audience_payoff),
    L('OPENING MONOLOGUE ANGLE', r.opening_monologue_angle),
    L('INNOVATION LENS', r.innovation_lens),
    `EDITORIAL TRIAD`,
    `  What is happening:`,
    `    ${triad.what_is_happening}`,
    `  Why it matters for open civilization:`,
    `    ${triad.why_it_matters_for_open_civilization}`,
    `  What follows if we get this wrong:`,
    `    ${triad.what_follows_if_we_get_this_wrong}`,
    ``,
    `VERDICT: ${labelVerdict(r.verdict)}   SCORE: ${r.fit_score}/${SCORE_MAX}   RECOMMENDED USE: ${labelRecommendedUse(r.recommended_use)}`,
  ];
  return lines.join('\n');
}

/**
 * Decide whether a framing result is ready to hand off to Guest Desk.
 * Used by both the client (to enable/disable the "Build Guest List" CTA)
 * and the server (defence in depth on the handoff endpoint).
 *
 * Rules:
 *   - episode_title, episode_thesis, belongs_to_open_civilization_because
 *     must be present and substantive
 *   - core_themes + key_questions + tensions must contain at least 3 items
 *     combined, with reasonable substance (>= 6 chars each on average)
 *   - verdict must not be 'reject' (not suitable) or 'segment_only'
 *     (not a full episode)
 *
 * @param {Partial<import('./schema.js').FramingEngineResult> | null | undefined} result
 * @returns {{ ready: true } | { ready: false, reason: string }}
 */
export function isFramingReady(result) {
  if (!result || typeof result !== 'object') {
    return { ready: false, reason: 'No framing result available' };
  }
  if (!result.episode_title || String(result.episode_title).trim().length < 6) {
    return { ready: false, reason: 'Missing or weak episode title' };
  }
  if (!result.episode_thesis || String(result.episode_thesis).trim().length < 12) {
    return { ready: false, reason: 'Missing or weak episode thesis' };
  }
  if (!result.belongs_to_open_civilization_because ||
      String(result.belongs_to_open_civilization_because).trim().length < 12) {
    return { ready: false, reason: 'Missing the doctrinal "why this belongs" paragraph' };
  }
  const themes = Array.isArray(result.core_themes) ? result.core_themes : [];
  const questions = Array.isArray(result.key_questions) ? result.key_questions : [];
  const tensions = Array.isArray(result.tensions) ? result.tensions : [];
  const all = themes.concat(questions, tensions).filter((s) => typeof s === 'string' && s.trim().length >= 6);
  if (all.length < 3) {
    return { ready: false, reason: 'Need at least 3 substantive themes, questions, or tensions' };
  }
  if (result.verdict === 'reject') {
    return { ready: false, reason: 'Verdict is reject — not suitable for an episode' };
  }
  if (result.verdict === 'segment_only') {
    return { ready: false, reason: 'Verdict is segment_only — not a full episode' };
  }
  return { ready: true };
}

/**
 * Human-readable verdict label. Used in both the UI and the copy briefing.
 * @param {FramingVerdict} v
 */
export function labelVerdict(v) {
  switch (v) {
    case 'strong_fit': return 'Strong fit';
    case 'reframe': return 'Reframe';
    case 'segment_only': return 'Segment only';
    case 'reject': return 'Reject';
    default: return String(v);
  }
}

/**
 * Human-readable recommended-use label.
 * @param {RecommendedUse} v
 */
export function labelRecommendedUse(v) {
  switch (v) {
    case 'full_episode': return 'Full episode';
    case 'segment': return 'Segment';
    case 'supporting_evidence': return 'Supporting evidence';
    case 'reject': return 'Reject';
    default: return String(v);
  }
}
