import type { AngleName, SpiralName, StrokeName } from './types';

export const STROKE_NAMES: StrokeName[] = [
  'Filled',
  'Super Blocks',
  'Outlined',
  'Soft Shapes',
  'Hatched',
];

export const ANGLE_NAMES: AngleName[] = ['Smooth', 'Sharp', 'Angular', 'Rigid'];

/** Angle quantization step (radians) per angle mode; 0 means no snapping. */
export const ANGLE_SNAPS: Record<AngleName, number> = {
  Smooth: 0,
  Sharp: Math.PI * 0.2,
  Angular: Math.PI * 0.25,
  Rigid: Math.PI * 0.5,
};

export const SPIRAL_NAMES: SpiralName[] = ['None', 'Gentle', 'Strong', 'Vortex'];

/** How strongly the field bends toward a center spiral, per spiral mode. */
export const SPIRAL_STR: Record<SpiralName, number> = {
  None: 0,
  Gentle: 0.3,
  Strong: 0.7,
  Vortex: 1.2,
};

/** The 16 conceptual pipeline steps, surfaced in the UI for explanation. */
export const STEPS = [
  'Flow field',
  'Noise distortion',
  'Curve tracing',
  'Shape geometry',
  'Spatial hashing',
  'Collision placement',
  'Gap control',
  'Variable scale',
  'Palettes',
  'Segmentation',
  'Stroke variants',
  'Field modifiers',
  'Grain',
  'Feature distribution',
  'Density & fill',
  'User overrides',
];
