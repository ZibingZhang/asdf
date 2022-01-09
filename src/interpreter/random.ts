// https://stackoverflow.com/a/47593316

export {
  RNG
};

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

class RandomNumberGenerator {
  private seed: () => number;
  private rng: () => number;

  constructor() {
    this.seed = xmur3((new Date()).toString());
    this.rng = mulberry32(this.seed());
  }

  reset(seed: string = this.rng().toString()) {
    this.seed = xmur3(seed);
    this.rng = mulberry32(this.seed());
  }

  next(): number {
    return this.rng();
  }
}

const RNG = new RandomNumberGenerator();
