import { assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * One-dimensional motion with constant acceleration, optionally capped at a top speed.
 * x = x₀ + v₀t + ½at², v = v₀ + at, v² = v₀² + 2a(x − x₀). SI units.
 * Limitations: constant acceleration only (no drag or changing traction) and motion in a straight line.
 */
function assertTopSpeed(value: number): void {
  if (value !== Number.POSITIVE_INFINITY) {
    assertPositive(value, "topSpeed");
  }
}

export function calculateDistanceAtTime(
  accelerationMetersPerSecondSquared: number,
  timeSeconds: number,
  topSpeedMetersPerSecond = Number.POSITIVE_INFINITY,
): number {
  assertPositive(accelerationMetersPerSecondSquared, "acceleration");
  assertNonNegative(timeSeconds, "timeSeconds");
  assertTopSpeed(topSpeedMetersPerSecond);
  const timeToTop = topSpeedMetersPerSecond / accelerationMetersPerSecondSquared;
  if (timeSeconds <= timeToTop) {
    return 0.5 * accelerationMetersPerSecondSquared * timeSeconds ** 2;
  }
  return 0.5 * topSpeedMetersPerSecond * timeToTop + topSpeedMetersPerSecond * (timeSeconds - timeToTop);
}

/** Speed at time t, starting from rest. */
export function calculateSpeedAtTime(
  accelerationMetersPerSecondSquared: number,
  timeSeconds: number,
  topSpeedMetersPerSecond = Number.POSITIVE_INFINITY,
): number {
  assertPositive(accelerationMetersPerSecondSquared, "acceleration");
  assertNonNegative(timeSeconds, "timeSeconds");
  return Math.min(accelerationMetersPerSecondSquared * timeSeconds, topSpeedMetersPerSecond);
}

/** Time to cover a distance from rest: t = √(2d/a), or d/v_top + v_top/(2a) once the top speed is reached. */
export function calculateTimeToCoverDistance(
  distanceMeters: number,
  accelerationMetersPerSecondSquared: number,
  topSpeedMetersPerSecond = Number.POSITIVE_INFINITY,
): number {
  assertPositive(distanceMeters, "distanceMeters");
  assertPositive(accelerationMetersPerSecondSquared, "acceleration");
  assertTopSpeed(topSpeedMetersPerSecond);
  const distanceToTop = topSpeedMetersPerSecond ** 2 / (2 * accelerationMetersPerSecondSquared);
  return distanceMeters <= distanceToTop
    ? Math.sqrt((2 * distanceMeters) / accelerationMetersPerSecondSquared)
    : distanceMeters / topSpeedMetersPerSecond + topSpeedMetersPerSecond / (2 * accelerationMetersPerSecondSquared);
}

/** Distance to stop from speed v with deceleration a: d = v² / (2a). */
export function calculateStoppingDistance(
  speedMetersPerSecond: number,
  decelerationMetersPerSecondSquared: number,
): number {
  assertNonNegative(speedMetersPerSecond, "speed");
  assertPositive(decelerationMetersPerSecondSquared, "deceleration");
  assertFiniteNumber(speedMetersPerSecond, "speed");
  return speedMetersPerSecond ** 2 / (2 * decelerationMetersPerSecondSquared);
}
