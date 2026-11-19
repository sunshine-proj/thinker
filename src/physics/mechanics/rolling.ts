import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * Rolling without slipping, and conservation of angular momentum.
 *
 * A body of mass m and radius r with moment of inertia I = k m r² rolling down a slope
 * of angle θ accelerates at a = g sinθ / (1 + k): part of the energy goes into spinning,
 * so bodies with mass far from the axis (larger k) are slower, whatever their mass or
 * size. Shape factors: hoop 1, hollow sphere 2/3, solid disc 1/2, solid sphere 2/5.
 * With no outside torque, angular momentum I ω is conserved.
 *
 * Assumptions: rigid bodies, rolling without slipping (enough friction, which does no
 * work), no rolling resistance or air drag.
 */

export type RollingShape = "hoop" | "hollow-sphere" | "disc" | "solid-sphere";

export const SHAPE_FACTORS: Readonly<Record<RollingShape, number>> = Object.freeze({
  hoop: 1,
  "hollow-sphere": 2 / 3,
  disc: 1 / 2,
  "solid-sphere": 2 / 5,
});

export const SHAPE_NAMES: Readonly<Record<RollingShape, string>> = Object.freeze({
  hoop: "Hoop",
  "hollow-sphere": "Hollow sphere",
  disc: "Solid disc",
  "solid-sphere": "Solid sphere",
});

/** Acceleration (m/s²) of a body rolling without slipping down a slope. */
export function calculateRollingAcceleration(shapeFactor: number, slopeDegrees: number, gravity = STANDARD_GRAVITY): number {
  assertNonNegative(shapeFactor, "shapeFactor");
  if (!(slopeDegrees > 0 && slopeDegrees < 90)) {
    throw new RangeError("The slope must be between 0 and 90 degrees.");
  }
  return (gravity * Math.sin((slopeDegrees * Math.PI) / 180)) / (1 + shapeFactor);
}

/** Time (s) to roll a distance from rest. */
export function calculateRollingTime(distanceMeters: number, shapeFactor: number, slopeDegrees: number): number {
  assertPositive(distanceMeters, "distanceMeters");
  return Math.sqrt((2 * distanceMeters) / calculateRollingAcceleration(shapeFactor, slopeDegrees));
}

/** Slope angle (degrees) that makes a shape roll a distance in a given time. */
export function calculateSlopeForRollingTime(distanceMeters: number, timeSeconds: number, shapeFactor: number, gravity = STANDARD_GRAVITY): number {
  assertPositive(distanceMeters, "distanceMeters");
  assertPositive(timeSeconds, "timeSeconds");
  const sine = ((2 * distanceMeters) / timeSeconds ** 2) * (1 + shapeFactor) / gravity;
  if (sine >= 1) {
    throw new RangeError("No slope is steep enough for that time.");
  }
  return (Math.asin(sine) * 180) / Math.PI;
}

/** New spin rate after the moment of inertia changes with no outside torque: ω₂ = I₁ω₁/I₂. */
export function calculateSpinAfterChange(initialInertia: number, initialSpin: number, finalInertia: number): number {
  assertPositive(initialInertia, "initialInertia");
  assertNonNegative(initialSpin, "initialSpin");
  assertPositive(finalInertia, "finalInertia");
  return (initialInertia * initialSpin) / finalInertia;
}

/** Rotational kinetic energy ½ I ω² (J), with ω in rad/s. */
export function calculateRotationalEnergy(inertia: number, angularSpeed: number): number {
  assertNonNegative(inertia, "inertia");
  return 0.5 * inertia * angularSpeed ** 2;
}
