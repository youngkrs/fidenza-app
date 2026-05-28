/**
 * Client-side contract for AI-assisted seed selection. The UI depends on the
 * {@link SeedCurator} interface, not on any particular transport, so the
 * backend (or a future local/mock implementation) can change without touching
 * components.
 */

export interface CuratedSeed {
  seed: number;
  title: string;
  mood: string;
}

export interface SeedCurator {
  /** Ask the curator for a seed and its title/mood. May reject. */
  curate(signal?: AbortSignal): Promise<CuratedSeed>;
}

function normalize(data: unknown): CuratedSeed {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Malformed curation response');
  }
  const record = data as Record<string, unknown>;
  const seed = Math.floor(Number(record.seed));
  if (!Number.isFinite(seed) || seed < 1) {
    throw new Error('Curation response had no valid seed');
  }
  return {
    seed,
    title: typeof record.title === 'string' ? record.title : 'Untitled',
    mood: typeof record.mood === 'string' ? record.mood : '',
  };
}

/**
 * SeedCurator backed by the `/api/curate-seed` endpoint (the serverless
 * function in `api/`). The Anthropic key stays server-side; the browser only
 * ever talks to our own origin.
 */
export function createApiSeedCurator(
  endpoint = '/api/curate-seed',
): SeedCurator {
  return {
    async curate(signal) {
      const resp = await fetch(endpoint, { method: 'POST', signal });
      if (!resp.ok) {
        throw new Error(`Seed curation failed (${resp.status})`);
      }
      return normalize(await resp.json());
    },
  };
}
