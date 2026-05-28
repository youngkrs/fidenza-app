/**
 * Server-side seed curation. Calls the Anthropic Messages API to pick a seed
 * and an evocative title/mood, holding the API key on the server where it
 * belongs. Shared by the production serverless function (curate-seed.js) and
 * the Vite dev middleware, so the logic lives in exactly one place.
 *
 * The original app fetched api.anthropic.com directly from the browser with no
 * key — that can never authenticate and always failed CORS. This module is the
 * fix: the secret never reaches the client.
 */

const MODEL = 'claude-sonnet-4-6';

const PROMPT =
  'Pick a random seed between 1 and 999999999 for a piece of generative ' +
  'flow-field art. Give it a poetic 2-4 word title and a one-sentence mood. ' +
  'Respond with ONLY JSON: {"seed":NUMBER,"title":"STRING","mood":"STRING"}';

/**
 * @param {string | undefined} apiKey
 * @returns {Promise<{ seed: number, title: string, mood: string }>}
 */
export async function curateSeed(apiKey) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server');
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: PROMPT }],
    }),
  });

  if (!resp.ok) {
    throw new Error(`Anthropic API error ${resp.status}`);
  }

  const data = await resp.json();
  const text = data?.content?.[0]?.text ?? '';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

  const seed = Math.max(1, Math.min(999999999, Math.floor(Number(parsed.seed))));
  if (!Number.isFinite(seed)) {
    throw new Error('Model returned an invalid seed');
  }

  return {
    seed,
    title: String(parsed.title ?? 'Untitled'),
    mood: String(parsed.mood ?? ''),
  };
}
