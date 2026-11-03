import { assertNonNegative, assertPositive } from "../core";

/**
 * Decay chains and mixed samples.
 *
 * For a parent with decay constant λ₁ feeding a daughter with λ₂ ≠ λ₁ (Bateman solution), the daughter population
 * is N₂(t) = N₁(0) λ₁/(λ₂ − λ₁) (e^(−λ₁t) − e^(−λ₂t)), which rises from zero, peaks at
 * t_max = ln(λ₂/λ₁)/(λ₂ − λ₁) and then falls. A sample of several independent isotopes has a total activity equal
 * to the sum of their individual activities, each decaying with its own half-life, so the short-lived ones fade
 * first and the long-lived ones dominate later.
 *
 * Limitations: a two-step chain with a stable final product, unequal half-lives, no feeding back from other
 * branches and no chemical separation of the daughter.
 */
export function calculateDaughterAmount(parentInitial: number, parentHalfLife: number, daughterHalfLife: number, time: number): number {
  assertNonNegative(parentInitial, "parentInitial");
  assertPositive(parentHalfLife, "parentHalfLife");
  assertPositive(daughterHalfLife, "daughterHalfLife");
  assertNonNegative(time, "time");
  if (parentHalfLife === daughterHalfLife) {
    throw new RangeError("The half-lives must differ.");
  }
  const l1 = Math.LN2 / parentHalfLife;
  const l2 = Math.LN2 / daughterHalfLife;
  return (parentInitial * l1 * (Math.exp(-l1 * time) - Math.exp(-l2 * time))) / (l2 - l1);
}

export function calculateDaughterPeakTime(parentHalfLife: number, daughterHalfLife: number): number {
  assertPositive(parentHalfLife, "parentHalfLife");
  assertPositive(daughterHalfLife, "daughterHalfLife");
  if (parentHalfLife === daughterHalfLife) {
    throw new RangeError("The half-lives must differ.");
  }
  const l1 = Math.LN2 / parentHalfLife;
  const l2 = Math.LN2 / daughterHalfLife;
  return Math.log(l2 / l1) / (l2 - l1);
}

export interface ActivityComponent {
  /** Share of the initial activity. */
  readonly initialShare: number;
  readonly halfLife: number;
}

export function calculateMixedActivityFraction(components: readonly ActivityComponent[], time: number): number {
  assertNonNegative(time, "time");
  const total = components.reduce((sum, c) => sum + c.initialShare, 0);
  assertPositive(total, "total share");
  return components.reduce((sum, c) => sum + (c.initialShare / total) * 2 ** (-time / c.halfLife), 0);
}

/** Time at which the activity of a mixture falls to `fraction` of its start, by bisection. */
export function calculateTimeForMixedActivity(components: readonly ActivityComponent[], fraction: number): number {
  if (!(fraction > 0 && fraction < 1)) {
    throw new RangeError("The fraction must be between 0 and 1.");
  }
  let low = 0;
  let high = Math.max(...components.map((c) => c.halfLife)) * 60;
  for (let i = 0; i < 200; i += 1) {
    const middle = (low + high) / 2;
    if (calculateMixedActivityFraction(components, middle) > fraction) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

/** Half-life from an initial and a later activity: T½ = t ln2 / ln(A₀/A). */
export function calculateHalfLifeFromActivities(initial: number, later: number, elapsed: number): number {
  assertPositive(initial, "initial");
  assertPositive(later, "later");
  assertPositive(elapsed, "elapsed");
  if (later >= initial) {
    throw new RangeError("The activity must fall over time.");
  }
  return (elapsed * Math.LN2) / Math.log(initial / later);
}
