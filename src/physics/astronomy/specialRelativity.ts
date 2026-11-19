import { SPEED_OF_LIGHT, assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * Special relativity for uniform motion (inertial frames).
 *
 * Lorentz factor γ = 1/√(1 − β²) with β = v/c. A moving clock runs slow: proper time
 * τ = t/γ. A moving ruler is shortened along its motion: L = L₀/γ. Kinetic energy is
 * (γ − 1) m c². Velocities add as w = (u + v)/(1 + uv/c²), so nothing reaches c.
 *
 * Inputs are SI, or β (dimensionless) where noted. Assumptions: flat spacetime (no
 * gravity), constant velocities; for the twin trip, instantaneous turnaround (the
 * accelerating twin is the one who ages less). Limitations: no acceleration phases,
 * no Doppler or light-travel-time effects on what is *seen*.
 */

function assertSubluminal(beta: number): void {
  assertFiniteNumber(beta, "beta");
  if (beta < 0 || beta >= 1) {
    throw new RangeError("The speed must be at least 0 and below the speed of light (0 ≤ β < 1).");
  }
}

/** γ = 1/√(1 − β²). */
export function calculateLorentzFactor(beta: number): number {
  assertSubluminal(beta);
  return 1 / Math.sqrt(1 - beta * beta);
}

/** Speed fraction β for a given Lorentz factor γ ≥ 1. */
export function calculateBetaForLorentzFactor(gamma: number): number {
  assertFiniteNumber(gamma, "gamma");
  if (gamma < 1) {
    throw new RangeError("The Lorentz factor is at least 1.");
  }
  return Math.sqrt(1 - 1 / (gamma * gamma));
}

/** Time τ (s) that passes on a clock moving at β while time t passes in the rest frame. */
export function calculateProperTime(coordinateTimeSeconds: number, beta: number): number {
  assertNonNegative(coordinateTimeSeconds, "coordinateTimeSeconds");
  return coordinateTimeSeconds / calculateLorentzFactor(beta);
}

/** Length (m) of an object of rest length L₀ measured while it moves at β along its length. */
export function calculateContractedLength(properLengthMeters: number, beta: number): number {
  assertNonNegative(properLengthMeters, "properLengthMeters");
  return properLengthMeters / calculateLorentzFactor(beta);
}

/** Relativistic kinetic energy (J): (γ − 1) m c². */
export function calculateRelativisticKineticEnergy(massKg: number, beta: number): number {
  assertPositive(massKg, "massKg");
  return (calculateLorentzFactor(beta) - 1) * massKg * SPEED_OF_LIGHT ** 2;
}

/** Relativistic addition of two collinear speed fractions: (β₁ + β₂)/(1 + β₁β₂). */
export function addVelocities(beta1: number, beta2: number): number {
  assertFiniteNumber(beta1, "beta1");
  assertFiniteNumber(beta2, "beta2");
  if (Math.abs(beta1) >= 1 || Math.abs(beta2) >= 1) {
    throw new RangeError("Each speed must be below the speed of light.");
  }
  return (beta1 + beta2) / (1 + beta1 * beta2);
}

/** Time (s) for light, or a signal of the given speed, to cover a distance. */
export function calculateLightTravelTime(distanceMeters: number, signalSpeed = SPEED_OF_LIGHT): number {
  assertNonNegative(distanceMeters, "distanceMeters");
  assertPositive(signalSpeed, "signalSpeed");
  return distanceMeters / signalSpeed;
}

export interface TwinTrip {
  /** Years that pass for the twin who stays at home. */
  readonly homeYears: number;
  /** Years that pass for the travelling twin. */
  readonly travellerYears: number;
  /** Distance to the turnaround point as measured by the traveller, light-years. */
  readonly contractedDistanceLightYears: number;
  readonly lorentzFactor: number;
}

/** Out-and-back trip at constant speed β to a star distanceLightYears away (home frame). */
export function calculateTwinTrip(distanceLightYears: number, beta: number): TwinTrip {
  assertPositive(distanceLightYears, "distanceLightYears");
  assertSubluminal(beta);
  if (beta === 0) {
    throw new RangeError("The traveller must move to make the trip.");
  }
  const gamma = calculateLorentzFactor(beta);
  const homeYears = (2 * distanceLightYears) / beta;
  return {
    homeYears,
    travellerYears: homeYears / gamma,
    contractedDistanceLightYears: distanceLightYears / gamma,
    lorentzFactor: gamma,
  };
}

/**
 * Fraction of particles with mean lifetime τ₀ that survive a trip of the given length at β:
 * exp(−t/(γτ₀)) with t = L/(βc). The classical (no time dilation) answer uses γ = 1.
 */
export function calculateSurvivingFraction(
  pathLengthMeters: number,
  beta: number,
  meanLifetimeSeconds: number,
  relativistic = true,
): number {
  assertNonNegative(pathLengthMeters, "pathLengthMeters");
  assertPositive(meanLifetimeSeconds, "meanLifetimeSeconds");
  assertSubluminal(beta);
  if (beta === 0) {
    throw new RangeError("A particle at rest never covers the distance.");
  }
  const labTime = pathLengthMeters / (beta * SPEED_OF_LIGHT);
  const lifetime = relativistic ? calculateLorentzFactor(beta) * meanLifetimeSeconds : meanLifetimeSeconds;
  return Math.exp(-labTime / lifetime);
}
