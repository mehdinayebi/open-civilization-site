// Deterministic guest strategy generator.
//
// Takes a FramingHandoffPayload (the snapshot stored at handoff) and produces
// a GuestStrategy: ideal/weak archetypes, target mix, best angles, missing
// perspectives, scoring weights, and outreach framing.
//
// Pure function. Same input → same output. No LLM calls, no randomness.
// The output should feel editorially sharp via lexical heuristics tied to
// what the framing actually says, not via canned platitudes.

import { DEFAULT_SCORING_WEIGHTS } from './schema.js';

/**
 * @param {object} snapshot a FramingHandoffPayload
 * @returns {object} a GuestStrategy payload
 */
export function generateStrategy(snapshot) {
  const f = snapshot.framing || {};
  const e = snapshot.episode || {};
  const text = collectText(snapshot);
  const lensSignals = detectLensSignals(text);

  return {
    idealGuestArchetypes: deriveIdealArchetypes(f, lensSignals),
    weakGuestArchetypes: deriveWeakArchetypes(lensSignals),
    targetMix: {
      primaryTargets: 5,
      secondaryTargets: 4,
      wildcardTargets: 2,
      backupTargets: 3,
    },
    bestAngles: deriveBestAngles(f),
    missingPerspectives: deriveMissingPerspectives(lensSignals),
    scoringWeights: adjustWeights(lensSignals),
    outreachFraming: deriveOutreachFraming(e, lensSignals),
  };
}

// ── Lens detection ─────────────────────────────────────────────────────────

const LENS_KEYWORDS = {
  geopolitical: ['geopolit', 'sovereign', 'china', 'russia', 'iran', 'nato', 'alliance', 'border', 'strategic', 'great power'],
  institutional: ['institution', 'state capacity', 'bureaucra', 'governance', 'regulator', 'court', 'agency'],
  economic: ['econom', 'market', 'fiscal', 'monetary', 'industrial', 'trade', 'tariff', 'manufactur', 'supply chain'],
  technological: ['technolog', 'ai ', 'compute', 'chip', 'semiconductor', 'innovat', 'engineer', 'biotech', 'energy'],
  cultural: ['cultur', 'religion', 'identity', 'tribe', 'ritual', 'media', 'literacy', 'narrative'],
  defense: ['defense', 'defence', 'military', 'army', 'navy', 'war', 'deterrence', 'weapon', 'security'],
  civilizational: ['civiliz', 'demograph', 'fertility', 'birth', 'collapse', 'decay', 'renewal', 'cohesion'],
  scientific: ['scien', 'research', 'discover', 'physics', 'biology'],
  historical: ['history', 'historic', 'precedent', 'centur', 'empire', 'rome', 'imperial'],
  legal: ['law ', 'legal', 'rule of law', 'constitut', 'judicia'],
  philosophical: ['philosoph', 'ethic', 'moral', 'ideolog', 'theor'],
};

function detectLensSignals(text) {
  const found = {};
  for (const [lens, words] of Object.entries(LENS_KEYWORDS)) {
    let hits = 0;
    for (const w of words) if (text.includes(w)) hits++;
    if (hits > 0) found[lens] = hits;
  }
  return found;
}

function collectText(snapshot) {
  const parts = [];
  const e = snapshot.episode || {};
  const f = snapshot.framing || {};
  parts.push(e.title || '', e.shortDescription || '', e.mission || '', e.whyNow || '', e.listenerPayoff || '');
  for (const k of ['coreThemes', 'keyQuestions', 'tensions', 'opposingViews', 'idealGuestArchetypesRaw']) {
    if (Array.isArray(f[k])) parts.push(f[k].join(' '));
  }
  if (f.innovationLens) parts.push(f.innovationLens);
  if (f.openingMonologueAngle) parts.push(f.openingMonologueAngle);
  return parts.join(' ').toLowerCase();
}

// ── Archetypes ─────────────────────────────────────────────────────────────

const ARCHETYPE_BANK = {
  geopolitical: [
    'regional strategist with first-hand exposure',
    'former diplomat or national-security operator',
    'serious foreign-affairs historian',
  ],
  institutional: [
    'institutional reformer with operational scars',
    'state-capacity scholar with field experience',
    'former senior civil servant who has shipped',
  ],
  economic: [
    'industrial-policy practitioner, not a pundit',
    'macro analyst with real-money credibility',
    'manufacturing or supply-chain operator-thinker',
  ],
  technological: [
    'technologist who has built and shipped at scale',
    'researcher engaged with policy, not abstracted from it',
    'investor with technical literacy, not just narratives',
  ],
  cultural: [
    'cultural critic with reading depth, not rhetoric',
    'religious or moral thinker willing to cross tribes',
    'editor or essayist known for restraint, not heat',
  ],
  defense: [
    'defense planner with operational background',
    'former officer comfortable with technology',
    'historian of strategy who can speak to the present',
  ],
  civilizational: [
    'serious historian of the long arc',
    'demographer with policy fluency',
    'civilizational analyst who is empirically grounded',
  ],
  scientific: [
    'practising scientist who can teach without flattening',
    'research leader with institutional perspective',
  ],
  historical: [
    'professional historian who writes for general readers',
    'classicist with comfort drawing modern parallels',
  ],
  legal: [
    'constitutional thinker who sees structure, not slogans',
    'legal scholar with real courtroom or drafting experience',
  ],
  philosophical: [
    'philosopher engaged with empirical reality',
    'theorist who treats counter-arguments fairly',
  ],
  default: [
    'operator-thinker who has actually shipped',
    'serious specialist who can translate without flattening',
    'contrarian practitioner with respect for evidence',
  ],
};

function deriveIdealArchetypes(framing, lensSignals) {
  const arch = new Set();
  // From the framing's own guest profiles (extract intent words).
  for (const raw of (framing.idealGuestArchetypesRaw || [])) {
    if (typeof raw === 'string' && raw.trim()) {
      arch.add(condenseProfileToArchetype(raw));
    }
  }
  // Layer in archetypes for each detected lens (top 3 lenses by signal).
  const sortedLenses = Object.entries(lensSignals).sort((a, b) => b[1] - a[1]).slice(0, 3);
  for (const [lens] of sortedLenses) {
    for (const a of (ARCHETYPE_BANK[lens] || [])) arch.add(a);
  }
  // Defaults if we have nothing.
  if (arch.size === 0) {
    for (const a of ARCHETYPE_BANK.default) arch.add(a);
  }
  return Array.from(arch).slice(0, 8);
}

function condenseProfileToArchetype(raw) {
  // Strip leading proper names (people get listed individually elsewhere) and
  // condense the role description. Cap at 120 chars.
  const noName = raw.replace(/^[A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3}[\s,.:;-]+/, '');
  const trimmed = noName.trim().replace(/\s+/g, ' ');
  return trimmed.length > 120 ? trimmed.slice(0, 117) + '…' : trimmed;
}

function deriveWeakArchetypes(lensSignals) {
  const base = [
    'generic pundit who recycles takes',
    'famous-but-shallow commentator',
    'partisan voice who flattens nuance for attention',
    'professional-explainer with no operational experience',
  ];
  // Add lens-specific weak archetypes for the top detected lens.
  const top = Object.entries(lensSignals).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const [lens] = top;
    if (lens === 'technological') base.push('AI hype trader with no engineering depth');
    if (lens === 'geopolitical') base.push('cable-news geostrategist with no regional fluency');
    if (lens === 'economic') base.push('macro influencer trading on doom rather than data');
    if (lens === 'defense') base.push('armchair strategist who has never coordinated anything');
    if (lens === 'cultural') base.push('culture-war combatant looking for an audience');
  }
  return Array.from(new Set(base));
}

// ── Best angles & missing perspectives ─────────────────────────────────────

function deriveBestAngles(framing) {
  const out = [];
  for (const t of (framing.tensions || [])) {
    if (typeof t === 'string' && t.trim()) out.push(t.trim());
  }
  for (const q of (framing.keyQuestions || [])) {
    if (typeof q === 'string' && q.trim() && out.length < 5) out.push(q.trim());
  }
  return out.slice(0, 5);
}

function deriveMissingPerspectives(lensSignals) {
  const present = new Set(Object.keys(lensSignals));
  const universe = ['geopolitical', 'institutional', 'economic', 'technological', 'defense', 'civilizational', 'historical', 'cultural', 'legal'];
  const missing = universe.filter((l) => !present.has(l));
  // Translate to perspective phrasings.
  const phrasings = {
    geopolitical: 'A non-Western, regional perspective from inside a relevant state',
    institutional: 'A view from an operator who has built or reformed an institution',
    economic: 'A serious economic-historical lens on the same dynamic',
    technological: 'A technologist who can speak to feasibility and constraints',
    defense: 'A defense or strategic-planning perspective on the consequences',
    civilizational: 'A long-arc civilizational lens beyond the news cycle',
    historical: 'A historian who can place this against past precedents',
    cultural: 'A cultural or moral critic who can speak to legitimacy',
    legal: 'A legal-structural perspective on what is permitted and what is not',
  };
  return missing.slice(0, 4).map((l) => phrasings[l]);
}

// ── Scoring weights ────────────────────────────────────────────────────────

function adjustWeights(lensSignals) {
  // Slight, deterministic adjustments based on lens emphasis. Always sums to 1.
  const w = { ...DEFAULT_SCORING_WEIGHTS };
  const top = Object.entries(lensSignals).sort((a, b) => b[1] - a[1])[0];
  if (!top) return w;
  const [lens] = top;
  if (lens === 'technological' || lens === 'scientific') {
    // Reward authority and conversation value over reach.
    w.authority = 0.25; w.conversationValue = 0.25; w.reach = 0.00; w.topicalFit = 0.30; w.attainability = 0.10; w.freshness = 0.10;
  } else if (lens === 'geopolitical' || lens === 'defense') {
    // Authority and topical fit dominate; freshness less critical.
    w.topicalFit = 0.35; w.authority = 0.25; w.conversationValue = 0.15; w.attainability = 0.15; w.freshness = 0.05; w.reach = 0.05;
  } else if (lens === 'cultural' || lens === 'philosophical') {
    // Conversation value and freshness matter more.
    w.topicalFit = 0.25; w.authority = 0.15; w.conversationValue = 0.30; w.attainability = 0.15; w.freshness = 0.10; w.reach = 0.05;
  }
  return normalizeWeights(w);
}

function normalizeWeights(w) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) < 0.001) return w;
  const out = {};
  for (const k of Object.keys(w)) out[k] = +(w[k] / sum).toFixed(3);
  return out;
}

// ── Outreach framing ───────────────────────────────────────────────────────

function deriveOutreachFraming(episode, lensSignals) {
  const showDescription =
    'Open Civilization is a podcast about what keeps free societies functional, ' +
    'cohesive, and capable of building, innovating, and defending themselves — ' +
    'and what causes them to decay, fragment, or get outcompeted.';
  const episodeAngle = (episode.shortDescription || episode.mission || '').trim() ||
    'A serious examination of the structural forces at work and what they mean.';

  const topLens = Object.entries(lensSignals).sort((a, b) => b[1] - a[1])[0];
  const lensName = topLens ? topLens[0] : 'general';

  const whyThisGuestType =
    'We want a guest with operational or scholarly depth, not a generalist commentator. ' +
    'The conversation is structured around real disagreements and concrete consequences, not opinion exchange.';

  const toneGuidance = [
    'Serious, concise, editorial.',
    'No hype, no flattery, no fake familiarity.',
    'One concrete reason this guest fits the episode.',
    'A clear next step.',
  ];
  if (lensName === 'geopolitical' || lensName === 'defense') {
    toneGuidance.push('Treat the guest as a strategic peer, not a thought-leader.');
  }
  if (lensName === 'technological' || lensName === 'scientific') {
    toneGuidance.push('Demonstrate that we understand the technical substance, not just the narrative.');
  }

  return { showDescription, episodeAngle, whyThisGuestType, toneGuidance };
}
