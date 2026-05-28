import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateSVG } from './svgRenderer';
import {
  GOLDEN_CONFIG,
  GOLDEN_SEED,
  GOLDEN_SIZE,
} from '../test/fixtures';

/**
 * Golden-master regression. The committed SVG is the source of truth: if the
 * engine ever stops reproducing it byte-for-byte, the generative output has
 * silently changed and every user's saved seed now renders different art.
 */
describe('generateSVG golden master', () => {
  const goldenPath = fileURLToPath(
    new URL('../../fidenza-223741039.svg', import.meta.url),
  );
  // Normalize CRLF→LF: the engine emits \n; the working-copy file may have
  // CRLF line endings on Windows checkouts.
  const golden = readFileSync(goldenPath, 'utf8').replace(/\r\n/g, '\n');

  it('reproduces fidenza-223741039.svg exactly', () => {
    const produced = generateSVG(
      GOLDEN_SEED,
      GOLDEN_CONFIG,
      GOLDEN_SIZE.w,
      GOLDEN_SIZE.h,
    );
    expect(produced).toBe(golden);
  });

  it('is deterministic across repeated calls', () => {
    const a = generateSVG(GOLDEN_SEED, GOLDEN_CONFIG, GOLDEN_SIZE.w, GOLDEN_SIZE.h);
    const b = generateSVG(GOLDEN_SEED, GOLDEN_CONFIG, GOLDEN_SIZE.w, GOLDEN_SIZE.h);
    expect(a).toBe(b);
  });
});
