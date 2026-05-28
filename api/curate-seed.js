import { curateSeed } from './_curate.js';

/**
 * Serverless endpoint (Vercel/Netlify-style `req`/`res` handler) for seed
 * curation. Deploy with ANTHROPIC_API_KEY set in the platform's environment.
 *
 * POST /api/curate-seed  ->  { seed, title, mood }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }
  try {
    const result = await curateSeed(process.env.ANTHROPIC_API_KEY);
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: String(err?.message ?? err) }));
  }
}
