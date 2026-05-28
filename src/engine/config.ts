import { ANGLE_NAMES, SPIRAL_NAMES, STROKE_NAMES } from './constants';
import { PALETTES, weightedChoice } from './palettes';
import { createRNG } from './rng';
import type { Config } from './types';

/** Thickness presets the seed lottery draws from, with selection weights. */
const THICK_PRESETS = [
  { center: 6, spread: 3, w: 0.08 },
  { center: 16, spread: 8, w: 0.15 },
  { center: 35, spread: 15, w: 0.3 },
  { center: 50, spread: 20, w: 0.32 },
  { center: 75, spread: 25, w: 0.1 },
  { center: 20, spread: 1, w: 0.05 },
];

/** Turbulence presets the seed lottery draws from, with selection weights. */
const TURB_PRESETS = [
  { v: 0, w: 0.08 },
  { v: 0.6, w: 0.25 },
  { v: 1.2, w: 0.35 },
  { v: 2.5, w: 0.22 },
  { v: 4, w: 0.1 },
];

/**
 * Derive a full default Config from a seed. This is the "seed lottery": the
 * same seed always yields the same starting parameters, which the user can
 * then tweak. The RNG consumption order here is part of the contract — it
 * determines which art a bare seed maps to.
 */
export function seedDefaults(seed: number): Config {
  const r = createRNG(seed);
  const tp = weightedChoice(THICK_PRESETS, r);
  const tb = weightedChoice(TURB_PRESETS, r);
  return {
    palette: Math.floor(r() * PALETTES.length),
    thickCenter: tp.center,
    thickSpread: tp.spread,
    thickVariation: 0.6 + r() * 0.3,
    thickFloor: 3,
    thickMult: 1.0,
    turbulence: tb.v,
    stroke: STROKE_NAMES[Math.floor(r() * 5)],
    angle: ANGLE_NAMES[Math.floor(r() * 4)],
    spiral: SPIRAL_NAMES[Math.floor(r() * 4)],
    gap: 0.8 + r() * 2.5,
    density: 0.5 + r() * 1.5,
    curveLen: 20 + Math.floor(r() * 70),
    fillPasses: 1 + Math.floor(r() * 2),
    segProb: 0.75 + r() * 0.2,
    segMin: 2,
    segMax: 2 + Math.floor(r() * 3),
    segEndBias: 0.6 + r() * 0.3,
    segCoherence: 0.3 + r() * 0.4,
    segOutline: 1.0 + r() * 1.5,
    octaves: 2 + Math.floor(r() * 3),
    persistence: 0.35 + r() * 0.35,
  };
}
