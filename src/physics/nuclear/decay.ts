import { AVOGADRO_CONSTANT, assertNonNegative, assertPositive } from "../core";

/**
 * Radioactive decay.
 *
 * Each nucleus has the same constant chance per second λ of decaying, regardless of its age, so the number left
 * follows N(t) = N₀ e^(−λt) = N₀ 2^(−t/T½) with λ = ln 2 / T½. The activity (decays per second, in becquerels) is
 * A = λN. Individual decays are random: for N₀ nuclei each surviving to time t with probability p = e^(−λt), the
 * count left is binomial with mean N₀p and standard deviation √(N₀p(1−p)), so small samples scatter around the
 * smooth curve.
 *
 * Limitations: a single isotope with no daughter decays, and the stochastic simulation tests every nucleus
 * separately so it is meant for samples of at most a few thousand nuclei.
 */
export function calculateDecayConstant(halfLife: number): number {
  assertPositive(halfLife, "halfLife");
  return Math.LN2 / halfLife;
}

export function calculateRemainingFraction(halfLife: number, elapsed: number): number {
  assertPositive(halfLife, "halfLife");
  assertNonNegative(elapsed, "elapsed");
  return 2 ** (-elapsed / halfLife);
}

export function calculateTimeForFraction(halfLife: number, fraction: number): number {
  assertPositive(halfLife, "halfLife");
  if (!(fraction > 0 && fraction <= 1)) {
    throw new RangeError("The fraction must be in (0, 1].");
  }
  return Math.abs(halfLife * Math.log2(fraction));
}

export function calculateActivity(decayConstantPerSecond: number, nuclei: number): number {
  assertPositive(decayConstantPerSecond, "decayConstantPerSecond");
  assertNonNegative(nuclei, "nuclei");
  return decayConstantPerSecond * nuclei;
}

export function calculateNucleiInMass(massKg: number, molarMassKgPerMol: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(molarMassKgPerMol, "molarMassKgPerMol");
  return (massKg / molarMassKgPerMol) * AVOGADRO_CONSTANT;
}

export function calculateStandardDeviation(nuclei: number, survivalProbability: number): number {
  assertNonNegative(nuclei, "nuclei");
  if (!(survivalProbability >= 0 && survivalProbability <= 1)) {
    throw new RangeError("The probability must be between 0 and 1.");
  }
  return Math.sqrt(nuclei * survivalProbability * (1 - survivalProbability));
}

/** Simulates each nucleus surviving to `elapsed` with probability 2^(−t/T½); returns how many are left. */
export function simulateDecay(nuclei: number, halfLife: number, elapsed: number, random: () => number): number {
  if (!Number.isInteger(nuclei) || nuclei < 0 || nuclei > 100_000) {
    throw new RangeError("nuclei must be an integer between 0 and 100000.");
  }
  const p = calculateRemainingFraction(halfLife, elapsed);
  let left = 0;
  for (let i = 0; i < nuclei; i += 1) {
    if (random() < p) left += 1;
  }
  return left;
}

/** Small deterministic generator (mulberry32) so simulations in the game are repeatable. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
