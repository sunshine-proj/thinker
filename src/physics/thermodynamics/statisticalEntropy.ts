import { BOLTZMANN_CONSTANT, assertNonNegative } from "../core";

/**
 * Statistical entropy of particles shared between two halves of a box.
 *
 * With N distinguishable particles, each equally likely to be in either half, the number
 * of arrangements (microstates) with n on the left is Ω = C(N, n) and its probability is
 * C(N, n) / 2^N. Boltzmann's entropy is S = k ln Ω. The even split has by far the most
 * microstates, which is the statistical reason why entropy increases. The Ehrenfest urn
 * model moves one randomly chosen particle to the other half each step.
 *
 * Assumptions: ideal, non-interacting particles; equal a-priori probability for every
 * microstate. The interpretation of the second law as overwhelming probability is the
 * standard statistical-mechanics view (Boltzmann).
 */

function assertCount(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a whole number of at least 0.`);
  }
}

/** ln C(N, n), computed with logarithms so it works for large N. */
export function lnBinomial(total: number, chosen: number): number {
  assertCount(total, "total");
  assertCount(chosen, "chosen");
  if (chosen > total) {
    throw new RangeError("Cannot choose more particles than there are.");
  }
  let sum = 0;
  const k = Math.min(chosen, total - chosen);
  for (let i = 1; i <= k; i += 1) {
    sum += Math.log(total - k + i) - Math.log(i);
  }
  return sum;
}

/** Number of microstates with n of N particles on the left. */
export function countMicrostates(total: number, onLeft: number): number {
  return Math.round(Math.exp(lnBinomial(total, onLeft)));
}

/** Probability that exactly n of N particles are on the left. */
export function calculateSplitProbability(total: number, onLeft: number): number {
  return Math.exp(lnBinomial(total, onLeft) - total * Math.LN2);
}

/** Probability that all N particles are found in one chosen half: (1/2)^N. */
export function calculateAllOnOneSideProbability(total: number): number {
  assertCount(total, "total");
  return 2 ** -total;
}

/** Entropy change (in units of k) from a split with Ω₁ microstates to one with Ω₂. */
export function calculateEntropyChangeInK(total: number, fromLeft: number, toLeft: number): number {
  return lnBinomial(total, toLeft) - lnBinomial(total, fromLeft);
}

/** Entropy in J/K for a number of microstates given as its natural logarithm. */
export function calculateBoltzmannEntropy(lnMicrostates: number): number {
  assertNonNegative(lnMicrostates, "lnMicrostates");
  return BOLTZMANN_CONSTANT * lnMicrostates;
}

/** Ehrenfest urn model: number on the left after each step, starting with all on the left. */
export function simulateEhrenfest(total: number, steps: number, random: () => number): number[] {
  assertCount(total, "total");
  assertCount(steps, "steps");
  let left = total;
  const history = [left];
  for (let step = 0; step < steps; step += 1) {
    // A randomly chosen particle is on the left with probability left/total.
    if (random() < left / total) {
      left -= 1;
    } else {
      left += 1;
    }
    history.push(left);
  }
  return history;
}
