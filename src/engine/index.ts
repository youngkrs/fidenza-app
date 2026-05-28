/** Public surface of the deterministic generative-art engine. */
export * from './types';
export { createRNG, makeGauss } from './rng';
export { createNoise } from './noise';
export {
  PALETTES,
  pickColor,
  weightedChoice,
  outlineColor,
} from './palettes';
export {
  STROKE_NAMES,
  ANGLE_NAMES,
  ANGLE_SNAPS,
  SPIRAL_NAMES,
  SPIRAL_STR,
  STEPS,
} from './constants';
export { seedDefaults } from './config';
export { makeGeo, lerpAngle, SpatialHash } from './geometry';
export { buildFlowField } from './flowField';
export { computeShapes } from './computeShapes';
