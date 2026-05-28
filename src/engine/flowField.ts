import { ANGLE_SNAPS, SPIRAL_STR } from './constants';
import { lerpAngle } from './geometry';
import { createRNG } from './rng';
import type { Config, NoiseFn } from './types';

export interface FlowField {
  /** Bilinearly-interpolated flow angle (radians) at world point (x, y). */
  sample(x: number, y: number): number;
  /** The dominant base angle; also returned for out-of-grid queries. */
  domAngle: number;
}

/**
 * Build the angle grid that defines the flow field, then return a sampler over
 * it. The field is a dominant direction perturbed by two octaves of noise,
 * optionally bent into a spiral and quantized to an angle snap.
 *
 * Uses an RNG seeded at `seed + 99` purely for the dominant angle — this is
 * deliberately separate from the shape RNG (`seed + 7`), so changing field
 * parameters never shifts the shape-placement sequence.
 */
export function buildFlowField(
  seed: number,
  cfg: Config,
  W: number,
  H: number,
  noise: NoiseFn,
): FlowField {
  const res = Math.max(3, Math.floor(W * 0.004));
  const mgn = W * 0.5;
  const gL = -mgn;
  const gT = -mgn;
  const cols = Math.ceil((W + mgn * 2) / res) + 1;
  const rows = Math.ceil((H + mgn * 2) / res) + 1;
  const grid = new Float32Array(cols * rows);
  const spiralStr = SPIRAL_STR[cfg.spiral] || 0;
  const snap = ANGLE_SNAPS[cfg.angle] || 0;
  const sCx = W / 2;
  const sCy = H / 2;

  const baseRng = createRNG(seed + 99);
  const domAngle = baseRng() * Math.PI * 2;
  const nFreq = 0.0008 + cfg.turbulence * 0.0003;
  const nAmp = cfg.turbulence === 0 ? 0.15 : 0.3 + cfg.turbulence * 0.35;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const wx = gL + c * res;
      const wy = gT + r * res;
      const nx = wx * nFreq;
      const ny = wy * nFreq;
      const n1 = noise(nx, ny, cfg.octaves, cfg.persistence);
      const n2 = noise(nx * 0.3 + 100, ny * 0.3 + 100, 2, 0.5);
      let a = domAngle + n1 * Math.PI * nAmp + n2 * Math.PI * nAmp * 0.4;
      if (spiralStr > 0) {
        const sa = Math.atan2(wy - sCy, wx - sCx) + Math.PI / 2;
        a = a * (1 - spiralStr) + sa * spiralStr;
      }
      if (snap > 0) a = Math.round(a / snap) * snap;
      grid[c * rows + r] = a;
    }
  }

  function sample(x: number, y: number): number {
    const fx = (x - gL) / res;
    const fy = (y - gT) / res;
    const c0 = Math.floor(fx);
    const r0 = Math.floor(fy);
    if (c0 < 0 || c0 >= cols - 1 || r0 < 0 || r0 >= rows - 1) return domAngle;
    const tx = fx - c0;
    const ty = fy - r0;
    const top = lerpAngle(grid[c0 * rows + r0], grid[(c0 + 1) * rows + r0], tx);
    const bot = lerpAngle(
      grid[c0 * rows + r0 + 1],
      grid[(c0 + 1) * rows + r0 + 1],
      tx,
    );
    return lerpAngle(top, bot, ty);
  }

  return { sample, domAngle };
}
