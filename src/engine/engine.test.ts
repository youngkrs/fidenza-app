import { describe, expect, it } from 'vitest';
import { computeShapes } from './computeShapes';
import { seedDefaults } from './config';
import { createNoise } from './noise';
import { outlineColor, PALETTES, pickColor } from './palettes';
import { createRNG, makeGauss } from './rng';
import { GOLDEN_CONFIG, GOLDEN_SEED } from '../test/fixtures';

describe('createRNG', () => {
  it('is deterministic for a given seed', () => {
    const a = createRNG(42);
    const b = createRNG(42);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces values in [0, 1)', () => {
    const r = createRNG(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('normalizes non-positive seeds instead of collapsing to zero', () => {
    const r = createRNG(0);
    expect(r()).toBeGreaterThan(0);
  });
});

describe('makeGauss', () => {
  it('is deterministic and roughly standard-normal', () => {
    const g1 = makeGauss(createRNG(1));
    const g2 = makeGauss(createRNG(1));
    expect(g1()).toBe(g2());

    const g = makeGauss(createRNG(123));
    const n = 20000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += g();
    expect(Math.abs(sum / n)).toBeLessThan(0.05); // mean ≈ 0
  });
});

describe('createNoise', () => {
  it('is deterministic and bounded', () => {
    const a = createNoise(99);
    const b = createNoise(99);
    expect(a(1.5, 2.5)).toBe(b(1.5, 2.5));
    expect(Math.abs(a(0.3, 0.7, 4, 0.5))).toBeLessThanOrEqual(1);
  });
});

describe('palettes', () => {
  it('exposes 16 palettes whose weights are positive', () => {
    expect(PALETTES).toHaveLength(16);
    for (const p of PALETTES) {
      expect(p.colors.length).toBeGreaterThan(0);
      for (const c of p.colors) expect(c.w).toBeGreaterThan(0);
    }
  });

  it('pickColor always returns a color from the palette', () => {
    const pal = PALETTES[14];
    const valid = new Set(pal.colors.map((c) => c.c));
    const r = createRNG(5);
    for (let i = 0; i < 200; i++) expect(valid.has(pickColor(pal, r))).toBe(true);
  });

  it('chooses light ink on dark backgrounds', () => {
    expect(outlineColor(PALETTES[5])).toBe('#E8E4DD'); // Midnight (dark)
    expect(outlineColor(PALETTES[14])).toBe('#1A1A1A'); // Luxe (light)
  });
});

describe('seedDefaults', () => {
  it('is stable for a given seed', () => {
    expect(seedDefaults(223741039)).toEqual(seedDefaults(223741039));
  });

  it('produces in-range parameters', () => {
    const cfg = seedDefaults(12345);
    expect(cfg.palette).toBeGreaterThanOrEqual(0);
    expect(cfg.palette).toBeLessThan(PALETTES.length);
    expect(cfg.persistence).toBeGreaterThanOrEqual(0.35);
    expect(cfg.persistence).toBeLessThanOrEqual(0.7);
  });
});

describe('computeShapes', () => {
  it('returns a non-empty, deterministic shape set for the golden seed', () => {
    const s1 = computeShapes(GOLDEN_SEED, GOLDEN_CONFIG, 800, 1000);
    const s2 = computeShapes(GOLDEN_SEED, GOLDEN_CONFIG, 800, 1000);
    expect(s1.shapes.length).toBeGreaterThan(0);
    expect(s1.shapes.length).toBe(s2.shapes.length);
    expect(s1.pal.name).toBe('Luxe');
  });

  it('every shape has matching split/color structure', () => {
    const { shapes } = computeShapes(GOLDEN_SEED, GOLDEN_CONFIG, 800, 1000);
    for (const sh of shapes) {
      expect(sh.pts.length).toBeGreaterThanOrEqual(3);
      expect(sh.seg.splits.length).toBe(sh.seg.colors.length + 1);
    }
  });
});
