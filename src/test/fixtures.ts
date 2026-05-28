import type { Config } from '../engine/types';

/**
 * The exact (seed, Config) that produced the committed golden artwork
 * `fidenza-223741039.svg`, transcribed from the README "Your Saved Settings"
 * table. The golden-master test asserts the engine reproduces that SVG
 * byte-for-byte, which is our guarantee that the refactor preserved the
 * generative algorithm's determinism.
 */
export const GOLDEN_SEED = 223741039;

export const GOLDEN_CONFIG: Config = {
  palette: 14, // Luxe
  thickCenter: 6,
  thickSpread: 3,
  thickVariation: 0.62,
  thickFloor: 3,
  thickMult: 1.0,
  turbulence: 1.2,
  stroke: 'Filled',
  angle: 'Smooth',
  spiral: 'None',
  gap: 1.03,
  density: 1.45,
  curveLen: 67,
  fillPasses: 1,
  segProb: 0.9,
  segMin: 2,
  segMax: 4,
  segEndBias: 0.88,
  segCoherence: 0.61,
  segOutline: 1.9,
  octaves: 3,
  persistence: 0.41,
};

export const GOLDEN_SIZE = { w: 800, h: 1000 } as const;
