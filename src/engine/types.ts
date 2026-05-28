/**
 * Core domain types for the flow-field generative art engine.
 *
 * The engine is fully deterministic: a given (seed, Config) pair always
 * produces the same scene. Nothing here depends on React or the DOM.
 */

export interface Point {
  x: number;
  y: number;
}

/** A stroke expanded to its left/right offset polylines (a ribbon). */
export interface Geometry {
  left: Point[];
  right: Point[];
}

/** How a single traced curve is cut into colored segments. */
export interface Segmentation {
  /** Indices into a curve's point list marking segment boundaries. */
  splits: number[];
  /** One fill color per segment. */
  colors: string[];
}

/** A single placed stroke: its centerline, thickness, and segmentation. */
export interface Shape {
  pts: Point[];
  th: number;
  seg: Segmentation;
}

export interface PaletteColor {
  /** Hex color, e.g. "#D1292F". */
  c: string;
  /** Selection weight (weights within a palette need not sum to 1). */
  w: number;
}

export interface Palette {
  name: string;
  /** Background hex color. */
  bg: string;
  colors: PaletteColor[];
}

export type StrokeName =
  | 'Filled'
  | 'Super Blocks'
  | 'Outlined'
  | 'Soft Shapes'
  | 'Hatched';

export type AngleName = 'Smooth' | 'Sharp' | 'Angular' | 'Rigid';

export type SpiralName = 'None' | 'Gentle' | 'Strong' | 'Vortex';

/** Every tunable parameter of the algorithm. */
export interface Config {
  palette: number;
  thickCenter: number;
  thickSpread: number;
  thickVariation: number;
  thickFloor: number;
  thickMult: number;
  turbulence: number;
  stroke: StrokeName;
  angle: AngleName;
  spiral: SpiralName;
  gap: number;
  density: number;
  curveLen: number;
  fillPasses: number;
  segProb: number;
  segMin: number;
  segMax: number;
  segEndBias: number;
  segCoherence: number;
  segOutline: number;
  octaves: number;
  persistence: number;
}

/** Pixel dimensions of a render target. */
export interface CanvasSize {
  w: number;
  h: number;
}

/** A seeded pseudo-random number generator returning floats in [0, 1). */
export type RNG = () => number;

/** Fractal value-noise sampler. */
export type NoiseFn = (
  x: number,
  y: number,
  octaves?: number,
  persistence?: number,
) => number;

/**
 * The fully computed scene, ready to render.
 *
 * `rng` is the *live* generator the shape phase left off on — the canvas
 * renderer continues this sequence for its draw-phase effects (Super Blocks,
 * Soft Shapes, Hatched, grain), exactly as the original monolith did. The SVG
 * renderer never touches it, which is why SVG output is independent of stroke
 * style.
 */
export interface Scene {
  shapes: Shape[];
  pal: Palette;
  rng: RNG;
}
