// Sizzle & Serve — a tiny seeded RNG (mulberry32) so screenshot scenes and
// playtests can be reproduced exactly from a seed.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one item from an array with a seeded RNG.
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

// Shuffle a copy of an array with a seeded RNG (Fisher-Yates).
export function shuffle(rng, items) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
