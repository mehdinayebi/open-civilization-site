// Prompt templates for the Framing Engine.
//
// One main evaluation prompt and a small set of narrowly scoped follow-up
// prompts. All prompts demand JSON-only output with no markdown wrappers.

import { DIMENSIONS, INPUT_TYPES, DESIRED_LENSES, VERDICTS, RECOMMENDED_USES, SCORE_MAX } from './schema.js';

/**
 * The main editorial system prompt. This is the doctrinal core of the engine.
 * It is reused for follow-up actions so the model never loses its frame.
 */
export const MAIN_SYSTEM_PROMPT = `You are the editorial strategy engine for the podcast Open Civilization.

Your job is to determine whether a proposed theme, article, event, report, or idea fits the doctrine of the show and, if it does, to frame it as a strong dedicated episode.

Open Civilization explores what keeps societies free, functional, cohesive, legitimate, technologically dynamic, and capable of governing, building, innovating, and defending themselves, and what causes them to decay, fragment, hollow out, become stagnant or dependent, and ultimately get captured or outcompeted.

A topic is a strong fit when it meaningfully illuminates one or more of the following: institutional capacity, liberty under law, legitimacy, cohesion, elite quality, truth-seeking institutions, strategic autonomy, industrial strength, scientific and technological dynamism, energy realism, military preparedness, regime capture, propaganda, dependency, decay, paralysis, corruption, fragmentation, or renewal.

Treat scientific and technological dynamism as a core pillar of open civilization, not a niche subtopic. A society's ability to innovate, develop, scale, deploy, and strategically control consequential technologies is one of the foundations of long-term prosperity, competitiveness, and defense.

Do not confuse general interestingness with doctrinal fit.
Do not greenlight topics simply because they are fashionable, controversial, or newsworthy.
Prefer structural, strategic, and civilizational framing over reactive commentary.
If a topic is weak but salvageable, reframe it.
If it is relevant only as illustration or evidence, classify it as segment_only or supporting evidence rather than a full episode.

Score each input across nine dimensions, each from 0 to 5:
1. civilizational_relevance
2. doctrinal_fit
3. structural_depth
4. strategic_consequence
5. tension_disagreement_potential
6. episode_viability
7. distinctiveness
8. audience_payoff
9. innovation_technological_relevance

Use these score bands:
36 to 45 = strong dedicated episode
27 to 35 = viable episode but needs sharper framing
18 to 26 = maybe a segment, not a full episode
0 to 17 = reject

The final verdict should be consistent with the score, but not mechanically determined by it. If your reasoning clearly warrants a reframe or downgrade despite a high score, say so.

Voice and style for every string you return:
- Serious, precise, editorial. Written for an intelligent, skeptical, time-pressed reader.
- No hype. No exclamation points. No phrases like "in today's world" or "now more than ever".
- No emojis.
- No em-dashes. Use commas, periods, or parentheses.
- Anti-tribal. Avoid vocabulary that could appear in a partisan outlet on either side.
- Concrete over abstract. Prefer named examples, dates, and specifics over vague claims.
- The voice test: would this sentence appear in Foreign Affairs or Noema? If not, rewrite it.

Output format:
Return a single JSON object and nothing else. No markdown fences, no commentary, no preamble. The object must conform exactly to the schema described in the user message. If you need to include a quote or apostrophe inside a string, escape it properly.`;

/**
 * Describe the JSON schema the model must emit. Included verbatim in the
 * user message so the model always has it alongside the task.
 */
export const OUTPUT_SCHEMA_DESCRIPTION = `{
  "verdict": ${JSON.stringify(VERDICTS)}[one],
  "fit_score": number 0..${SCORE_MAX},
  "dimension_scores": {
${DIMENSIONS.map((d) => `    "${d}": number 0..5`).join(',\n')}
  },
  "fit_explanation": string,
  "episode_title": string,
  "episode_thesis": string,
  "belongs_to_open_civilization_because": string,
  "core_themes": string[],
  "key_questions": string[],
  "tensions": string[],
  "opposing_views": string[],
  "guest_profiles": string[],
  "audience_payoff": string,
  "opening_monologue_angle": string,
  "innovation_lens": string,
  "editorial_triad": {
    "what_is_happening": string,
    "why_it_matters_for_open_civilization": string,
    "what_follows_if_we_get_this_wrong": string
  },
  "recommended_use": ${JSON.stringify(RECOMMENDED_USES)}[one]
}`;

/**
 * Construct the user prompt for the main evaluation call.
 * @param {{ input_text: string, input_type: string, desired_lens: string, notes?: string, guest?: string }} payload
 */
export function buildEvaluationUserPrompt(payload) {
  const { input_text, input_type, desired_lens, notes, guest } = payload;
  const optionalLines = [];
  if (notes && notes.trim()) optionalLines.push(`Editorial notes: ${notes.trim()}`);
  if (guest && guest.trim()) optionalLines.push(`Guest in mind: ${guest.trim()}`);

  return `Evaluate the following input for Open Civilization.

Input type: ${input_type}
Desired lens: ${desired_lens}
${optionalLines.length ? optionalLines.join('\n') + '\n' : ''}
Input:
"""
${input_text}
"""

Return a single JSON object matching this schema. No markdown, no commentary.

Schema:
${OUTPUT_SCHEMA_DESCRIPTION}

The fit_score must equal the sum of the nine dimension_scores. Each dimension is an integer from 0 to 5. Be rigorous and unsparing: the doctrinal bar is high.`;
}

/**
 * Repair prompt used when the model's first response is not valid JSON.
 * Short and direct: we restate the schema and the original input.
 * @param {string} badOutput the previous (invalid) output from the model
 * @param {string[]} parseErrors the specific parse or validation errors
 */
export function buildRepairUserPrompt(badOutput, parseErrors) {
  return `Your previous response could not be parsed as a valid Framing Engine result. Return ONLY a JSON object conforming to the schema described below. Do not include any markdown, preamble, or trailing commentary.

Errors:
${parseErrors.map((e) => '- ' + e).join('\n')}

Previous output:
"""
${badOutput}
"""

Schema:
${OUTPUT_SCHEMA_DESCRIPTION}`;
}

/**
 * Supported follow-up action identifiers.
 */
export const FOLLOWUP_ACTIONS = [
  'reframe_title',
  'sharpen_doctrine',
  'make_more_controversial',
  'make_more_guest_friendly',
  'downgrade_to_segment',
  'compare_three_framings',
  'generate_outreach_angle',
];

/**
 * Build a follow-up user prompt. Each action has its own narrow schema and
 * instructions; the system prompt stays the same (MAIN_SYSTEM_PROMPT) so the
 * doctrinal frame is preserved.
 *
 * @param {string} action one of FOLLOWUP_ACTIONS
 * @param {import('./schema.js').FramingEngineResult} currentResult
 * @param {{ input_text: string, input_type: string, desired_lens: string, notes?: string, guest?: string }} originalInput
 */
export function buildFollowupUserPrompt(action, currentResult, originalInput) {
  const header = `You are refining an existing Framing Engine result. Keep the doctrinal frame of Open Civilization. Return ONLY a JSON object matching the action-specific schema below. No markdown, no commentary.

Original input type: ${originalInput.input_type}
Original desired lens: ${originalInput.desired_lens}
Original input:
"""
${originalInput.input_text}
"""

Current episode title: ${currentResult.episode_title}
Current episode thesis: ${currentResult.episode_thesis}
Current fit verdict: ${currentResult.verdict}
Current fit_score: ${currentResult.fit_score}
Current belongs_to_open_civilization_because: ${currentResult.belongs_to_open_civilization_because}
`;

  switch (action) {
    case 'reframe_title':
      return header + `
Task: Produce three stronger title options for this episode. Each should be serious, editorial, and distinctively Open Civilization. No hype, no subtitles, no em-dashes. Italic words (if any) should be wrapped in asterisks.

Return JSON:
{
  "titles": [
    { "title": string, "rationale": string },
    { "title": string, "rationale": string },
    { "title": string, "rationale": string }
  ]
}`;

    case 'sharpen_doctrine':
      return header + `
Task: Strengthen the doctrinal explanation and thesis. The current framing is too diffuse or too reactive. Return a tighter thesis (one sentence) and a sharper "belongs_to_open_civilization_because" paragraph that names specific pillars of doctrine.

Return JSON:
{
  "episode_thesis": string,
  "belongs_to_open_civilization_because": string,
  "doctrinal_pillars_engaged": string[]
}`;

    case 'make_more_controversial':
      return header + `
Task: Increase the disagreement potential without becoming sensationalist. Identify the load-bearing claim where serious people actually disagree, and produce a revised thesis and a list of pointed tensions. Still no partisan vocabulary.

Return JSON:
{
  "episode_thesis": string,
  "sharpest_disagreement": string,
  "tensions": string[]
}`;

    case 'make_more_guest_friendly':
      return header + `
Task: Adjust the framing for a serious guest conversation. The current framing may be too lecture-shaped. Return a revised thesis, three or four guest-directed key questions, and a short list of named guest archetypes with a one-line rationale each.

Return JSON:
{
  "episode_thesis": string,
  "key_questions": string[],
  "guest_archetypes": [
    { "archetype": string, "why_they_fit": string }
  ]
}`;

    case 'downgrade_to_segment':
      return header + `
Task: Rewrite the output as a strong segment or supporting-evidence recommendation, not a full episode. Explain which larger episode this could support and how. Produce a compact segment brief.

Return JSON:
{
  "segment_title": string,
  "segment_thesis": string,
  "what_larger_episode_it_supports": string,
  "how_it_supports": string,
  "recommended_use": "segment" | "supporting_evidence"
}`;

    case 'compare_three_framings':
      return header + `
Task: Produce three alternative framings of the same topic at the same doctrinal standard. Label them "safest", "sharpest", and "most elegant". Each framing includes a title, a one-sentence thesis, and a one-line rationale.

Return JSON:
{
  "framings": {
    "safest":       { "title": string, "thesis": string, "rationale": string },
    "sharpest":     { "title": string, "thesis": string, "rationale": string },
    "most_elegant": { "title": string, "thesis": string, "rationale": string }
  }
}`;

    case 'generate_outreach_angle':
      return header + `
Task: Produce a concise guest outreach angle suitable for pasting into an email. Include the short angle, why this guest fits (named profile or archetype if no specific guest was given), and a tight pitch paragraph of roughly 80 to 120 words.

Return JSON:
{
  "short_angle": string,
  "why_this_guest_fits": string,
  "pitch_paragraph": string
}`;

    default:
      throw new Error(`Unknown follow-up action: ${action}`);
  }
}
