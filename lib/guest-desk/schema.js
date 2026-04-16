// Guest Desk types, constants, and validators.
// Pure JS, dependency-free, fully unit-testable.

/** Episode workflow stages. */
export const EPISODE_STAGES = [
  'framing_draft',
  'framing_ready',
  'guest_planning',
  'outreach_active',
  'booked',
  'recorded',
  'published',
];

/** Candidate status enum (per the Guest Desk spec). */
export const CANDIDATE_STATUSES = [
  'new',
  'reviewed',
  'strong_fit',
  'ready_to_contact',
  'contacted',
  'follow_up_due',
  'replied',
  'intro_call',
  'booked',
  'passed',
  'archive',
];

export const CANDIDATE_STATUS_LABELS = {
  new: 'New',
  reviewed: 'Reviewed',
  strong_fit: 'Strong fit',
  ready_to_contact: 'Ready to contact',
  contacted: 'Contacted',
  follow_up_due: 'Follow-up due',
  replied: 'Replied',
  intro_call: 'Intro call',
  booked: 'Booked',
  passed: 'Passed',
  archive: 'Archive',
};

/** Outreach draft channels and variants. */
export const OUTREACH_CHANNELS = ['email', 'linkedin_dm', 'x_dm'];
export const OUTREACH_VARIANTS = [
  'formal',
  'warmer',
  'elite_short',
  'linkedin',
  'x',
  'follow_up_1',
  'follow_up_2',
];

/** Default scoring weights — sum to 1.0. */
export const DEFAULT_SCORING_WEIGHTS = Object.freeze({
  topicalFit: 0.30,
  authority: 0.20,
  conversationValue: 0.20,
  attainability: 0.15,
  freshness: 0.10,
  reach: 0.05,
});

/** Validate the candidate input the UI sends to the candidate endpoint. */
export function validateCandidateInput(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['Body must be an object'] };

  const obj = /** @type {Record<string, any>} */ (raw);
  const full_name = typeof obj.full_name === 'string' ? obj.full_name.trim() : '';
  if (!full_name) errors.push('full_name is required');
  if (full_name.length > 200) errors.push('full_name is too long');

  const optStr = (k, max = 500) => {
    const v = typeof obj[k] === 'string' ? obj[k].trim() : '';
    if (v.length > max) errors.push(`${k} is too long`);
    return v;
  };

  const value = {
    full_name,
    title: optStr('title', 300),
    organization: optStr('organization', 300),
    short_bio: optStr('short_bio', 4000),
    source_url: optStr('source_url', 1000),
    contact_email: optStr('contact_email', 300),
    contact_linkedin: optStr('contact_linkedin', 500),
    contact_x: optStr('contact_x', 200),
    contact_other: optStr('contact_other', 500),
    notes: optStr('notes', 4000),
    tags: Array.isArray(obj.tags)
      ? obj.tags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim().slice(0, 60))
      : [],
  };

  if (errors.length) return { ok: false, errors };
  return { ok: true, value };
}

/**
 * Validate a candidate status update.
 */
export function validateStatus(raw) {
  if (typeof raw !== 'string' || !CANDIDATE_STATUSES.includes(raw)) {
    return { ok: false, error: `status must be one of ${CANDIDATE_STATUSES.join(', ')}` };
  }
  return { ok: true, value: raw };
}

/**
 * Build a FramingHandoffPayload (the immutable snapshot stored at handoff)
 * from a FramingEngineResult and its source row metadata.
 *
 * @param {{ id: number, updated_at: string }} framingRow
 * @param {import('../framing-engine/schema.js').FramingEngineResult} result
 */
export function buildHandoffPayload(framingRow, result) {
  return {
    framingId: String(framingRow.id),
    framingVersion: 1, // we don't currently version-edit a row; re-runs create new rows
    framingUpdatedAt: framingRow.updated_at,
    status: 'ready',
    createdAt: new Date().toISOString(),
    episode: {
      title: result.episode_title,
      shortDescription: shortDescription(result),
      mission: result.episode_thesis,
      whyNow: result.belongs_to_open_civilization_because,
      listenerPayoff: result.audience_payoff || '',
    },
    framing: {
      coreThemes: result.core_themes || [],
      keyQuestions: result.key_questions || [],
      tensions: result.tensions || [],
      opposingViews: result.opposing_views || [],
      idealGuestArchetypesRaw: result.guest_profiles || [],
      suggestedGuestNames: extractCandidateNames(result.guest_profiles || []),
      innovationLens: result.innovation_lens || '',
      openingMonologueAngle: result.opening_monologue_angle || '',
      editorialTriad: result.editorial_triad || null,
      notes: '',
    },
    metadata: {
      sourceWidget: 'framing',
      sourceFramingEvaluationId: framingRow.id,
    },
  };
}

function shortDescription(result) {
  // First sentence of thesis, capped at 240 chars.
  const t = (result.episode_thesis || '').trim();
  const m = t.match(/^([^.!?]+[.!?])/);
  const out = (m ? m[1] : t).trim();
  return out.length > 240 ? out.slice(0, 237) + '…' : out;
}

function extractCandidateNames(profiles) {
  // Profiles like "Dr. Jane Smith, professor of …" → extract leading proper-name token.
  // Conservative: only return when the profile clearly starts with a Name.
  const names = [];
  for (const p of profiles) {
    if (typeof p !== 'string') continue;
    const m = p.match(/^([A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3})/);
    if (m) names.push(m[1]);
  }
  return names;
}
