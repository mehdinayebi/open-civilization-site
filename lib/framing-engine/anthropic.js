// Anthropic API client for the Framing Engine.
//
// Intentionally dependency-free: uses Node 24's native fetch. The repo has no
// AI SDK installed and the project rules forbid adding dependencies without
// approval. This client is a thin wrapper over POST /v1/messages with:
//
//   - system + messages inputs
//   - JSON-only text extraction
//   - one automatic repair retry when the model's text is not parseable
//   - a pluggable fetch for testing (do not touch network in unit tests)

import { validateResult } from './schema.js';
import { buildRepairUserPrompt } from './prompts.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-opus-4-6';
const DEFAULT_MAX_TOKENS = 4096;

/**
 * Call the Anthropic Messages API and return the assistant's raw text.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} [opts.model]
 * @param {number} [opts.maxTokens]
 * @param {string} opts.system
 * @param {{ role: 'user'|'assistant', content: string }[]} opts.messages
 * @param {typeof fetch} [opts.fetchImpl] injected for tests
 * @returns {Promise<string>}
 */
export async function callAnthropic({ apiKey, model, maxTokens, system, messages, fetchImpl }) {
  const f = fetchImpl || fetch;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
    system,
    messages,
  };

  const res = await f(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const content = Array.isArray(data.content) ? data.content : [];
  const textBlock = content.find((b) => b && b.type === 'text');
  if (!textBlock || typeof textBlock.text !== 'string') {
    throw new Error('Anthropic response had no text content');
  }
  return textBlock.text;
}

/**
 * Best-effort JSON extraction. The main prompt asks for JSON-only output but
 * models sometimes wrap output in markdown fences or add a stray preamble.
 * We strip both and try to parse. Returns { ok, value, error }.
 *
 * @param {string} text
 */
export function extractJson(text) {
  if (typeof text !== 'string') {
    return { ok: false, error: 'response is not a string' };
  }
  let trimmed = text.trim();

  // Strip ```json ... ``` fences if present.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
  if (fenceMatch) trimmed = fenceMatch[1].trim();

  // If the response is a JSON object but has a preamble, find the first { and
  // matching last }. This is deliberately naive — a proper parser is overkill
  // for a well-behaved model.
  if (trimmed[0] !== '{') {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) trimmed = trimmed.slice(start, end + 1);
  }

  try {
    const parsed = JSON.parse(trimmed);
    return { ok: true, value: parsed };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'JSON parse failed' };
  }
}

/**
 * Call Anthropic and return a parsed + validated Framing Engine result.
 * One retry with a repair prompt on invalid JSON or invalid schema.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} [opts.model]
 * @param {string} opts.system
 * @param {string} opts.userPrompt
 * @param {typeof fetch} [opts.fetchImpl]
 */
export async function evaluateWithRepair({ apiKey, model, system, userPrompt, fetchImpl }) {
  const first = await callAnthropic({
    apiKey,
    model,
    system,
    messages: [{ role: 'user', content: userPrompt }],
    fetchImpl,
  });

  const extracted = extractJson(first);
  if (extracted.ok) {
    const validated = validateResult(extracted.value);
    if (validated.ok) return { ok: true, value: validated.value, raw: first };
    // Schema-valid JSON but wrong shape. Retry once with explicit errors.
    const repaired = await callAnthropic({
      apiKey,
      model,
      system,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: first },
        { role: 'user', content: buildRepairUserPrompt(first, validated.errors) },
      ],
      fetchImpl,
    });
    const extracted2 = extractJson(repaired);
    if (!extracted2.ok) {
      return { ok: false, error: `Repair failed to parse: ${extracted2.error}`, raw: repaired };
    }
    const validated2 = validateResult(extracted2.value);
    if (!validated2.ok) {
      return { ok: false, error: `Repair failed validation: ${validated2.errors.join('; ')}`, raw: repaired };
    }
    return { ok: true, value: validated2.value, raw: repaired };
  }

  // First attempt was not parseable JSON. Repair with parse error.
  const repaired = await callAnthropic({
    apiKey,
    model,
    system,
    messages: [
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: first },
      { role: 'user', content: buildRepairUserPrompt(first, [extracted.error]) },
    ],
    fetchImpl,
  });
  const extracted2 = extractJson(repaired);
  if (!extracted2.ok) {
    return { ok: false, error: `Repair failed to parse: ${extracted2.error}`, raw: repaired };
  }
  const validated2 = validateResult(extracted2.value);
  if (!validated2.ok) {
    return { ok: false, error: `Repair failed validation: ${validated2.errors.join('; ')}`, raw: repaired };
  }
  return { ok: true, value: validated2.value, raw: repaired };
}

/**
 * Call Anthropic for a follow-up action. Returns raw JSON (already parsed)
 * without schema validation — the action-specific schemas are small and the
 * UI handles them as plain records.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} [opts.model]
 * @param {string} opts.system
 * @param {string} opts.userPrompt
 * @param {typeof fetch} [opts.fetchImpl]
 */
export async function callForFollowup({ apiKey, model, system, userPrompt, fetchImpl }) {
  const text = await callAnthropic({
    apiKey,
    model,
    system,
    messages: [{ role: 'user', content: userPrompt }],
    fetchImpl,
  });
  const extracted = extractJson(text);
  if (!extracted.ok) {
    // One cheap retry for malformed JSON on follow-ups.
    const text2 = await callAnthropic({
      apiKey,
      model,
      system,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: text },
        { role: 'user', content: `That was not valid JSON (${extracted.error}). Return ONLY the JSON object.` },
      ],
      fetchImpl,
    });
    const extracted2 = extractJson(text2);
    if (!extracted2.ok) {
      throw new Error(`Follow-up response was not valid JSON: ${extracted2.error}`);
    }
    return extracted2.value;
  }
  return extracted.value;
}

export { DEFAULT_MODEL };
