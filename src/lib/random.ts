// Deterministic, seedable randomness. Makes "today's creature" reproducible:
// the same day produces the same starting conditions and parameters.

/** Fast, well-distributed seeded PRNG. Returns a function yielding [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a hash of a string to a 32-bit unsigned int — for turning text into seeds. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** A seed that changes once per calendar day — "today's organism." */
export function dailySeed(date = new Date()): number {
  return hashSeed(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
}
