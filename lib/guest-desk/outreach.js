// Outreach draft generation. Uses the existing Anthropic client (no new
// dependencies). Drafts are grounded in the framing snapshot, the strategy,
// and the episode-candidate analysis.
//
// We ask the model for ALL variants in one structured JSON response to keep
// latency / cost reasonable.

import { callAnthropic, extractJson } from '../framing-engine/anthropic.js';
import { OUTREACH_CHANNELS, OUTREACH_VARIANTS } from './schema.js';

const MAX_TOKENS = 4096;

export const OUTREACH_SYSTEM_PROMPT = `You are the editorial outreach assistant for the podcast Open Civilization.

You write guest-outreach drafts for a serious, restrained, editorial show. The drafts must read like they were written by a senior editor, not a marketer.

Hard rules for every draft you produce:
- No sales language. No phrases like "I know you're busy", "huge fan", "loved your work", "would be amazing", "honored", "thrilled".
- No fake familiarity. Do not pretend to a personal relationship that does not exist.
- No hype, no exclamation points, no emojis, no em-dashes (use commas, periods, or parentheses).
- No partisan vocabulary. The show is anti-tribal.
- Every email must contain: one concrete reason this person fits THIS episode (named), one clear articulation of the episode angle (specific), one concise description of the show, one clear next step.
- Subject lines are short, declarative, no clickbait, no questions like "Quick chat?".
- LinkedIn DMs and X DMs are tighter still; no signature, no links unless essential.
- Tone is collegial and serious. The recipient is a peer, not a target.

Output a single JSON object. No markdown wrappers, no commentary outside the JSON.`;

/**
 * Build the user prompt for outreach drafts.
 * @param {object} args
 * @param {object} args.snapshot   FramingHandoffPayload (snapshot.payload)
 * @param {object} args.strategy   GuestStrategy (strategy.payload)
 * @param {object} args.candidate  Candidate row joined with episode_candidate analysis
 * @param {object} args.analysis   { scores, overall, fit_reason, best_angle, recommended_role, risks, recommendation }
 */
export function buildOutreachUserPrompt({ snapshot, strategy, candidate, analysis }) {
  const e = snapshot.episode || {};
  const f = snapshot.framing || {};
  const o = (strategy && strategy.outreachFraming) || {};

  return `Write a complete outreach package for this candidate, grounded in the framing below.

EPISODE
Title: ${e.title || ''}
Mission: ${e.mission || ''}
Why now: ${e.whyNow || ''}
Listener payoff: ${e.listenerPayoff || ''}
Best angles to surface in conversation:
${arrayLines(strategy.bestAngles, '- ')}

FRAMING SNAPSHOT
Core themes:
${arrayLines(f.coreThemes, '- ')}
Key questions:
${arrayLines(f.keyQuestions, '- ')}
Tensions:
${arrayLines(f.tensions, '- ')}
Opposing views:
${arrayLines(f.opposingViews, '- ')}

OUTREACH FRAMING (use this verbatim where relevant)
Show description: ${o.showDescription || ''}
Episode angle: ${o.episodeAngle || ''}
Why this guest type: ${o.whyThisGuestType || ''}
Tone guidance: ${(o.toneGuidance || []).join(' ')}

CANDIDATE
Name: ${candidate.full_name}
Title: ${candidate.title || '(unknown)'}
Organization: ${candidate.organization || '(unknown)'}
Bio: ${candidate.short_bio || '(none provided)'}
Tags: ${(candidate.tags || []).join(', ') || '(none)'}

EPISODE-SPECIFIC ANALYSIS
Overall score: ${analysis.overall}/100
Fit reason: ${analysis.fit_reason}
Best angle for this candidate: ${analysis.best_angle}
Recommended role: ${analysis.recommended_role}
Risks: ${analysis.risks || '(none surfaced)'}
Recommendation: ${analysis.recommendation}

PRODUCE
Return a single JSON object with this exact shape. No markdown, no commentary.
{
  "subjects": [string, string, string],
  "drafts": [
    { "channel": "email",       "variant": "formal",      "subject": string, "body": string },
    { "channel": "email",       "variant": "warmer",      "subject": string, "body": string },
    { "channel": "email",       "variant": "elite_short", "subject": string, "body": string },
    { "channel": "linkedin_dm", "variant": "linkedin",    "subject": "",     "body": string },
    { "channel": "x_dm",        "variant": "x",           "subject": "",     "body": string },
    { "channel": "email",       "variant": "follow_up_1", "subject": string, "body": string },
    { "channel": "email",       "variant": "follow_up_2", "subject": string, "body": string }
  ]
}

Length guidance:
- "formal": ~140-180 words.
- "warmer": ~120-150 words, slightly more personal but still restrained.
- "elite_short": 50-80 words; one paragraph; for senior recipients who do not read long emails.
- "linkedin": 60-90 words.
- "x": under 280 characters total.
- "follow_up_1": 60-90 words; sent ~7 days after no reply.
- "follow_up_2": 40-60 words; final, brief, low-pressure.`;
}

function arrayLines(arr, prefix) {
  if (!Array.isArray(arr) || arr.length === 0) return '(none)';
  return arr.map((s) => prefix + s).join('\n');
}

/**
 * Validate a parsed outreach response. Returns { ok, drafts } or { ok: false, errors }.
 */
export function validateOutreachOutput(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['Response must be an object'] };
  if (!Array.isArray(raw.drafts) || raw.drafts.length === 0) {
    return { ok: false, errors: ['drafts must be a non-empty array'] };
  }
  const drafts = [];
  for (const d of raw.drafts) {
    if (!d || typeof d !== 'object') { errors.push('draft entry is not an object'); continue; }
    const channel = String(d.channel || '');
    const variant = String(d.variant || '');
    const subject = d.subject == null ? '' : String(d.subject);
    const body    = d.body == null ? '' : String(d.body);
    if (!OUTREACH_CHANNELS.includes(channel)) errors.push(`unknown channel: ${channel}`);
    if (!OUTREACH_VARIANTS.includes(variant)) errors.push(`unknown variant: ${variant}`);
    if (!body.trim()) errors.push(`draft ${channel}/${variant} has empty body`);
    drafts.push({ channel, variant, subject, body });
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, drafts, subjects: Array.isArray(raw.subjects) ? raw.subjects : [] };
}

/**
 * Generate outreach drafts via Anthropic. Returns the validated draft list
 * (without persisting). Persistence happens in the API endpoint.
 *
 * @param {object} args
 * @param {string} args.apiKey
 * @param {string} [args.model]
 * @param {object} args.snapshot
 * @param {object} args.strategy
 * @param {object} args.candidate
 * @param {object} args.analysis
 * @param {typeof fetch} [args.fetchImpl]
 */
export async function generateOutreachDrafts(args) {
  const userPrompt = buildOutreachUserPrompt(args);
  const text = await callAnthropic({
    apiKey: args.apiKey,
    model: args.model,
    maxTokens: MAX_TOKENS,
    system: OUTREACH_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    fetchImpl: args.fetchImpl,
  });
  const extracted = extractJson(text);
  if (!extracted.ok) throw new Error(`Outreach response was not valid JSON: ${extracted.error}`);
  const validated = validateOutreachOutput(extracted.value);
  if (!validated.ok) throw new Error(`Outreach response failed validation: ${validated.errors.join('; ')}`);
  return { drafts: validated.drafts, subjects: validated.subjects };
}
