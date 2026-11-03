import { STANDARD_GRAVITY, assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * Momentum, impulse and crash safety.
 *
 * The impulse delivered to a body equals its change in momentum, F_avg Δt = m Δv. Stopping a car from speed v over a
 * crumple distance s at constant deceleration takes a = v²/(2s) and a time Δt = 2s/v, so the average force on a
 * passenger of mass m is m v²/(2s): doubling the crumple distance halves the force. In a perfectly inelastic collision
 * the vehicles stick together and move with v = (m₁v₁ + m₂v₂)/(m₁ + m₂) (momentum is conserved) while kinetic energy is
 * lost to deformation.
 *
 * Limitations: constant deceleration (real crashes have force peaks), one-dimensional motion, rigid occupants
 * restrained to the car, and no rebound.
 */
export function calculateAverageCrashForce(massKg: number, speed: number, stoppingDistance: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(speed, "speed");
  assertPositive(stoppingDistance, "stoppingDistance");
  return (massKg * speed ** 2) / (2 * stoppingDistance);
}

/** Average deceleration in multiples of g. */
export function calculateCrashGForce(speed: number, stoppingDistance: number): number {
  assertPositive(speed, "speed");
  assertPositive(stoppingDistance, "stoppingDistance");
  return speed ** 2 / (2 * stoppingDistance * STANDARD_GRAVITY);
}

export function calculateStoppingDistanceForGForce(speed: number, gForce: number): number {
  assertPositive(speed, "speed");
  assertPositive(gForce, "gForce");
  return speed ** 2 / (2 * gForce * STANDARD_GRAVITY);
}

export function calculateStoppingTime(speed: number, stoppingDistance: number): number {
  assertPositive(speed, "speed");
  assertPositive(stoppingDistance, "stoppingDistance");
  return (2 * stoppingDistance) / speed;
}

/** Average force from the impulse: F = m Δv / Δt. */
export function calculateImpulseForce(massKg: number, speedChange: number, durationSeconds: number): number {
  assertPositive(massKg, "massKg");
  assertNonNegative(speedChange, "speedChange");
  assertPositive(durationSeconds, "durationSeconds");
  return (massKg * speedChange) / durationSeconds;
}

export function calculateInelasticVelocity(m1: number, v1: number, m2: number, v2: number): number {
  assertPositive(m1, "m1");
  assertPositive(m2, "m2");
  assertFiniteNumber(v1, "v1");
  assertFiniteNumber(v2, "v2");
  return (m1 * v1 + m2 * v2) / (m1 + m2);
}

export function calculateKineticEnergyLoss(m1: number, v1: number, m2: number, v2: number): number {
  const v = calculateInelasticVelocity(m1, v1, m2, v2);
  return 0.5 * m1 * v1 ** 2 + 0.5 * m2 * v2 ** 2 - 0.5 * (m1 + m2) * v ** 2;
}
