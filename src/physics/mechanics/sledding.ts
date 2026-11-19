import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";
import type { Surface } from "./friction";

/**
 * Sliding down a slope and gliding to a stop.
 *
 * On a slope of angle θ with kinetic friction μ_k, a sliding body accelerates at
 * a = g (sinθ − μ_k cosθ); on the flat it decelerates at μ_k g. Energy (or v² = 2as)
 * gives the speed at the bottom of a slope of length L and the run-out distance on the
 * flat, v²/(2 μ_k g). A nudged body slides at constant speed when tanθ = μ_k.
 *
 * Assumptions: dry Coulomb friction, constant coefficients, a sharp change from slope to
 * flat with no speed loss at the corner, no air resistance. Snow friction varies a lot
 * with temperature and wax; the value here is typical.
 */

/** Waxed sled runners on cold, packed snow (typical values). */
export const SLED_ON_SNOW: Surface = Object.freeze({
  id: "sled-snow",
  name: "Waxed runners on packed snow",
  staticCoefficient: 0.14,
  kineticCoefficient: 0.05,
});

/** Acceleration (m/s²) of a body sliding down a slope; negative means it decelerates. */
export function calculateSlopeAcceleration(slopeDegrees: number, kineticCoefficient: number, gravity = STANDARD_GRAVITY): number {
  if (!(slopeDegrees >= 0 && slopeDegrees < 90)) {
    throw new RangeError("The slope must be between 0 and 90 degrees.");
  }
  assertNonNegative(kineticCoefficient, "kineticCoefficient");
  const angle = (slopeDegrees * Math.PI) / 180;
  return gravity * (Math.sin(angle) - kineticCoefficient * Math.cos(angle));
}

/** Speed (m/s) at the bottom of a slope of the given length, starting from rest. 0 if it would not accelerate. */
export function calculateSpeedAtBottom(slopeLengthMeters: number, slopeDegrees: number, kineticCoefficient: number): number {
  assertNonNegative(slopeLengthMeters, "slopeLengthMeters");
  const a = calculateSlopeAcceleration(slopeDegrees, kineticCoefficient);
  return a > 0 ? Math.sqrt(2 * a * slopeLengthMeters) : 0;
}

/** Distance (m) a body glides on flat ground from a speed until friction stops it. */
export function calculateRunOutDistance(speed: number, kineticCoefficient: number, gravity = STANDARD_GRAVITY): number {
  assertNonNegative(speed, "speed");
  assertPositive(kineticCoefficient, "kineticCoefficient");
  return speed ** 2 / (2 * kineticCoefficient * gravity);
}

/** Slope angle (degrees) at which a nudged body slides at constant speed: tanθ = μ_k. */
export function calculateConstantSpeedAngle(kineticCoefficient: number): number {
  assertNonNegative(kineticCoefficient, "kineticCoefficient");
  return (Math.atan(kineticCoefficient) * 180) / Math.PI;
}
