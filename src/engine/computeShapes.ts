import { buildFlowField } from './flowField';
import { SpatialHash } from './geometry';
import { createNoise } from './noise';
import { PALETTES, pickColor } from './palettes';
import { createRNG, makeGauss } from './rng';
import type { Config, Point, Scene, Segmentation } from './types';

/**
 * Run the generative pipeline and return the placed shapes.
 *
 * Determinism contract: the shape RNG is seeded at `seed + 7` and is consumed
 * in a fixed order — per placement attempt: start x, start y, gaussian
 * thickness, trace length, then segmentation/color draws. The live RNG is
 * returned in the Scene so the canvas renderer can continue the same sequence
 * for its draw-phase effects. Reordering any draw changes everyone's art.
 */
export function computeShapes(
  seed: number,
  cfg: Config,
  W: number,
  H: number,
): Scene {
  const rng = createRNG(seed + 7);
  const gauss = makeGauss(rng);
  const noise = createNoise(seed);
  const pal = PALETTES[cfg.palette];

  const field = buildFlowField(seed, cfg, W, H, noise);
  const mgn = W * 0.5;
  const stepLen = Math.max(1, W * 0.002);

  /** Trace a streamline through the field from (sx, sy), stopping at bounds. */
  function trace(sx: number, sy: number, maxSteps: number): Point[] {
    const pts: Point[] = [];
    let x = sx;
    let y = sy;
    for (let i = 0; i < maxSteps; i++) {
      pts.push({ x, y });
      const a = field.sample(x, y);
      x += Math.cos(a) * stepLen;
      y += Math.sin(a) * stepLen;
      if (x < -mgn || x > W + mgn || y < -mgn || y > H + mgn) break;
    }
    return pts;
  }

  const cellSize = Math.max(3, Math.floor(2 + cfg.gap * 1.5));
  const hash = new SpatialHash(W, H, cellSize);
  const gap = cfg.gap;
  const gapRadius = (hw: number) => hw + 1 + gap * 2;
  const collisionRadius = (hw: number) => hw + 0.5 + gap * 1.2;

  /** Decide how (or whether) to cut a curve into colored segments. */
  function segmentShape(pts: Point[]): Segmentation | null {
    if (rng() > cfg.segProb) return null;
    const nSegs = cfg.segMin + Math.floor(rng() * (cfg.segMax - cfg.segMin + 1));
    if (nSegs < 2 || pts.length < nSegs * 3) return null;
    const len = pts.length;
    const splits = [0];
    for (let i = 1; i < nSegs; i++) {
      const even = (i / nSegs) * len;
      let biased: number;
      if (i <= nSegs / 2) {
        biased =
          even * (1 - cfg.segEndBias) +
          len * 0.15 * (i / (nSegs / 2)) * cfg.segEndBias;
      } else {
        biased =
          even * (1 - cfg.segEndBias) +
          (len - (len * 0.15 * (nSegs - i)) / (nSegs / 2)) * cfg.segEndBias;
      }
      splits.push(
        Math.max(2, Math.min(len - 2, Math.floor(biased + (rng() - 0.5) * len * 0.1))),
      );
    }
    splits.push(len);
    splits.sort((a, b) => a - b);

    const colors: string[] = [];
    let pair: [string, string] | null = null;
    if (cfg.segCoherence > 0.5 && rng() < cfg.segCoherence) {
      pair = [pickColor(pal, rng), pickColor(pal, rng)];
    }
    for (let i = 0; i < nSegs; i++) {
      colors.push(
        pair && rng() < cfg.segCoherence
          ? pair[Math.floor(rng() * 2)]
          : pickColor(pal, rng),
      );
    }
    return { splits, colors };
  }

  const shapes: Scene['shapes'] = [];
  const baseAttempts = Math.floor(W * H * cfg.density * 0.002);
  for (let pass = 0; pass < cfg.fillPasses; pass++) {
    const attempts = pass === 0 ? baseAttempts : Math.floor(baseAttempts * 0.6);
    for (let a = 0; a < attempts; a++) {
      const sx = rng() * W;
      const sy = rng() * H;
      const rawTh = Math.max(
        cfg.thickFloor,
        cfg.thickCenter + gauss() * cfg.thickSpread * cfg.thickVariation,
      );
      const th = rawTh * cfg.thickMult;
      const hw = th / 2;
      if (hash.query(sx, sy, collisionRadius(hw))) continue;

      const pts = trace(sx, sy, cfg.curveLen + Math.floor(rng() * 30));
      if (pts.length < 3) continue;

      const visible: Point[] = [];
      for (const pt of pts) {
        const on = pt.x >= 0 && pt.x <= W && pt.y >= 0 && pt.y <= H;
        if (on && hash.query(pt.x, pt.y, collisionRadius(hw))) break;
        visible.push(pt);
      }
      if (visible.length < 3) continue;

      for (const pt of visible) {
        if (pt.x >= -10 && pt.x <= W + 10 && pt.y >= -10 && pt.y <= H + 10) {
          hash.mark(pt.x, pt.y, gapRadius(hw));
        }
      }

      const seg = segmentShape(visible);
      shapes.push({
        pts: visible,
        th,
        seg: seg || { splits: [0, visible.length], colors: [pickColor(pal, rng)] },
      });
    }
  }

  return { shapes, pal, rng };
}
