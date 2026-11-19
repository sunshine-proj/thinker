import { assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * Newton's three laws for a body moving in a straight line.
 *
 * First law: with no net force the velocity stays constant. Second law: a = F/m, so a
 * force F acting for time t changes the speed by F t / m. Third law: when two bodies
 * push on each other they feel equal and opposite forces, so from rest they leave with
 * speeds F t / m₁ and F t / m₂ in opposite directions.
 *
 * Inputs are SI (N, kg, s, m, m/s). Assumptions: frictionless motion along one line and a
 * constant force while it acts. Limitations: no rotation, no air resistance.
 */

/** Acceleration (m/s²) produced by a net force on a mass. */
export function calculateAccelerationFromForce(forceNewtons: number, massKg: number): number {
  assertFiniteNumber(forceNewtons, "forceNewtons");
  assertPositive(massKg, "massKg");
  return forceNewtons / massKg;
}

/** Speed (m/s) after a constant force acts for a time, starting from v₀. */
export function calculateSpeedAfterPush(massKg: number, forceNewtons: number, durationSeconds: number, initialSpeed = 0): number {
  assertNonNegative(durationSeconds, "durationSeconds");
  assertFiniteNumber(initialSpeed, "initialSpeed");
  return initialSpeed + calculateAccelerationFromForce(forceNewtons, massKg) * durationSeconds;
}

/** Distance (m) needed to stop from a speed under a constant opposing force: v² m / (2F). */
export function calculateBrakingDistance(massKg: number, speed: number, brakingForceNewtons: number): number {
  assertPositive(massKg, "massKg");
  assertNonNegative(speed, "speed");
  assertPositive(brakingForceNewtons, "brakingForceNewtons");
  return (massKg * speed ** 2) / (2 * brakingForceNewtons);
}

/** Speeds (m/s) of two bodies pushed apart from rest by equal and opposite forces (third law). */
export function calculatePushOffSpeeds(
  forceNewtons: number,
  durationSeconds: number,
  massA: number,
  massB: number,
): { readonly speedA: number; readonly speedB: number } {
  assertPositive(forceNewtons, "forceNewtons");
  assertPositive(durationSeconds, "durationSeconds");
  assertPositive(massA, "massA");
  assertPositive(massB, "massB");
  return { speedA: (forceNewtons * durationSeconds) / massA, speedB: (forceNewtons * durationSeconds) / massB };
}
