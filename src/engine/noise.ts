import type { NoiseFn } from './types';

/**
 * Perlin-style gradient noise with fractal (fBm) summation.
 *
 * The permutation table is shuffled by a Lehmer LCG seeded independently of the
 * main shape RNG, so noise is reproducible per seed without perturbing the
 * shape sequence. Kept numerically identical to the original implementation.
 */
export function createNoise(seed: number): NoiseFn {
  const p = new Uint8Array(512);
  let s = seed;
  const rn = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const pm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rn() * (i + 1));
    [pm[i], pm[j]] = [pm[j], pm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = pm[i & 255];

  const g2 = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const dot = (g: number[], x: number, y: number) => g[0] * x + g[1] * y;

  function base(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    return lerp(
      lerp(
        dot(g2[p[p[X] + Y] & 7], xf, yf),
        dot(g2[p[p[X + 1] + Y] & 7], xf - 1, yf),
        u,
      ),
      lerp(
        dot(g2[p[p[X] + Y + 1] & 7], xf, yf - 1),
        dot(g2[p[p[X + 1] + Y + 1] & 7], xf - 1, yf - 1),
        u,
      ),
      v,
    );
  }

  return (x, y, oct = 3, per = 0.5) => {
    let t = 0;
    let f = 1;
    let a = 1;
    let m = 0;
    for (let o = 0; o < oct; o++) {
      t += base(x * f, y * f) * a;
      m += a;
      a *= per;
      f *= 2;
    }
    return t / m;
  };
}
