import type { RNG } from './types';

/**
 * Lehmer / Park-Miller LCG (minimal standard, multiplier 16807, modulus
 * 2^31 - 1). Returns floats in [0, 1). The entire engine's determinism rests
 * on this generator and the *order* in which it is consumed — do not reorder
 * callers.
 */
export function createRNG(seed: number): RNG {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Standard-normal sampler (mean 0, variance 1) via the Box-Muller transform.
 * Each call consumes two or more values from the underlying RNG (it rejects
 * exact zeros), so it advances the shared sequence — keep call order stable.
 */
export function makeGauss(rng: RNG): () => number {
  return () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}
