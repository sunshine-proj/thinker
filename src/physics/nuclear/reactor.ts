import { assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * A simplified model of a fission reactor's neutron population (point kinetics with one
 * group of delayed neutrons). It describes how a reactor is controlled, not weapons.
 *
 * The multiplication factor k is the average number of next-generation fissions per
 * fission; reactivity ρ = (k − 1)/k. A small fraction β ≈ 0.0065 (uranium-235) of fission
 * neutrons are delayed by seconds. For 0 < ρ < β the power grows as e^(t/T) with a stable
 * period T ≈ (β − ρ)/(λ ρ), where λ ≈ 0.08 s⁻¹ is the effective decay constant of the
 * delayed-neutron precursors. At ρ ≥ β the reactor is prompt critical and the period
 * collapses to milliseconds, which reactor design and operating rules prevent.
 * Control rods absorb neutrons: here k falls linearly with insertion.
 *
 * Assumptions: one delayed group, small reactivity, no temperature feedback or poisons.
 * The real behaviour is more complex; the numbers illustrate the principles.
 */

export const DELAYED_NEUTRON_FRACTION = 0.0065;
export const DELAYED_DECAY_CONSTANT = 0.08;

export function calculateReactivity(multiplicationFactor: number): number {
  assertPositive(multiplicationFactor, "multiplicationFactor");
  return (multiplicationFactor - 1) / multiplicationFactor;
}

export function calculateMultiplicationFromReactivity(reactivity: number): number {
  assertFiniteNumber(reactivity, "reactivity");
  if (reactivity >= 1) {
    throw new RangeError("Reactivity must be below 1.");
  }
  return 1 / (1 - reactivity);
}

/** Multiplication factor with control rods inserted a fraction (0–1) of their travel. */
export function calculateRodMultiplication(fullyWithdrawnK: number, totalRodWorth: number, insertionFraction: number): number {
  assertPositive(fullyWithdrawnK, "fullyWithdrawnK");
  assertNonNegative(totalRodWorth, "totalRodWorth");
  if (!(insertionFraction >= 0 && insertionFraction <= 1)) {
    throw new RangeError("Insertion must be between 0 and 1.");
  }
  return fullyWithdrawnK - totalRodWorth * insertionFraction;
}

/** Stable reactor period (s) for a small positive reactivity below β; Infinity at ρ = 0; negative when shrinking. */
export function calculateReactorPeriod(reactivity: number, beta = DELAYED_NEUTRON_FRACTION, lambda = DELAYED_DECAY_CONSTANT): number {
  assertFiniteNumber(reactivity, "reactivity");
  if (reactivity === 0) {
    return Number.POSITIVE_INFINITY;
  }
  if (reactivity >= beta) {
    throw new RangeError("At or above prompt critical (ρ ≥ β) this slow-period formula does not apply.");
  }
  return (beta - reactivity) / (lambda * reactivity);
}

/** Reactivity giving a stable period T (s). */
export function calculateReactivityForPeriod(periodSeconds: number, beta = DELAYED_NEUTRON_FRACTION, lambda = DELAYED_DECAY_CONSTANT): number {
  assertPositive(periodSeconds, "periodSeconds");
  return beta / (1 + lambda * periodSeconds);
}

/** Time (s) for the power to double with a stable period T. */
export function calculateDoublingTime(periodSeconds: number): number {
  assertPositive(periodSeconds, "periodSeconds");
  return periodSeconds * Math.LN2;
}

/** Relative power after time t with a stable period (1 at t = 0). */
export function calculateRelativePower(periodSeconds: number, timeSeconds: number): number {
  assertNonNegative(timeSeconds, "timeSeconds");
  return Number.isFinite(periodSeconds) ? Math.exp(timeSeconds / periodSeconds) : 1;
}

export function isPromptCritical(multiplicationFactor: number, beta = DELAYED_NEUTRON_FRACTION): boolean {
  return calculateReactivity(multiplicationFactor) >= beta;
}

/** Neutron generation time Λ (s) of a thermal reactor, used by the point-kinetics step. */
export const PROMPT_GENERATION_TIME = 1e-4;

export interface KineticsState {
  /** Power relative to a reference (proportional to the neutron population). */
  readonly power: number;
  /** Delayed-neutron precursors in the same units. */
  readonly precursors: number;
}

/** Equilibrium precursor level for a steady power: C = β n / (λ Λ). */
export function steadyKineticsState(power: number, beta = DELAYED_NEUTRON_FRACTION, lambda = DELAYED_DECAY_CONSTANT, generationTime = PROMPT_GENERATION_TIME): KineticsState {
  assertNonNegative(power, "power");
  return { power, precursors: (beta * power) / (lambda * generationTime) };
}

/**
 * One RK4 step of the point-kinetics equations with one delayed group:
 * dn/dt = (ρ − β)/Λ n + λ C,  dC/dt = β/Λ n − λ C.
 * Keep dt ≲ Λ/|ρ − β| × 0.5 for stability (about 5 ms here).
 */
export function advancePointKinetics(
  state: KineticsState,
  reactivity: number,
  dt: number,
  beta = DELAYED_NEUTRON_FRACTION,
  lambda = DELAYED_DECAY_CONSTANT,
  generationTime = PROMPT_GENERATION_TIME,
): KineticsState {
  assertPositive(dt, "dt");
  assertFiniteNumber(reactivity, "reactivity");
  const derivative = (n: number, c: number) => [((reactivity - beta) / generationTime) * n + lambda * c, (beta / generationTime) * n - lambda * c] as const;
  const { power: n, precursors: c } = state;
  const [a1, b1] = derivative(n, c);
  const [a2, b2] = derivative(n + (dt / 2) * a1, c + (dt / 2) * b1);
  const [a3, b3] = derivative(n + (dt / 2) * a2, c + (dt / 2) * b2);
  const [a4, b4] = derivative(n + dt * a3, c + dt * b3);
  return {
    power: Math.max(0, n + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4)),
    precursors: Math.max(0, c + (dt / 6) * (b1 + 2 * b2 + 2 * b3 + b4)),
  };
}
