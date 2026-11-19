import { assertNonNegative, assertPositive } from "../core";

/**
 * Tides and rotation.
 *
 * Tidal acceleration: the difference in a body's pull across a planet of radius R at
 * distance d is a ≈ 2GMR/d³ (valid for d ≫ R). Rotation: a point on the equator moves at
 * v = 2πR/T. If gravity vanished, that point would continue in a straight line, so its
 * height above the (still) sphere after time t is √(R² + (vt)²) − R.
 *
 * Assumptions: point-mass bodies, circular rotation; the straight-line drift ignores air
 * and any remaining forces. Limitations: no ocean dynamics or resonances, so the tidal
 * acceleration is the forcing, not the height of real tides.
 */

/** Tidal acceleration (m/s²) from a body with gravitational parameter μ = GM at distance d across radius R. */
export function calculateTidalAcceleration(mu: number, distanceMeters: number, planetRadiusMeters: number): number {
  assertPositive(mu, "mu");
  assertPositive(distanceMeters, "distanceMeters");
  assertPositive(planetRadiusMeters, "planetRadiusMeters");
  if (distanceMeters <= planetRadiusMeters) {
    throw new RangeError("The body must be outside the planet.");
  }
  return (2 * mu * planetRadiusMeters) / distanceMeters ** 3;
}

/** Speed (m/s) of a point on the equator of a body rotating once per period. */
export function calculateEquatorialSpeed(radiusMeters: number, rotationPeriodSeconds: number): number {
  assertPositive(radiusMeters, "radiusMeters");
  assertPositive(rotationPeriodSeconds, "rotationPeriodSeconds");
  return (2 * Math.PI * radiusMeters) / rotationPeriodSeconds;
}

/** Height (m) above a sphere of a point that leaves its surface tangentially at the given speed, after t seconds. */
export function calculateTangentialDriftHeight(radiusMeters: number, speed: number, timeSeconds: number): number {
  assertPositive(radiusMeters, "radiusMeters");
  assertNonNegative(speed, "speed");
  assertNonNegative(timeSeconds, "timeSeconds");
  const travelled = speed * timeSeconds;
  // √(R² + s²) − R written to stay accurate when s ≪ R.
  return (travelled * travelled) / (Math.sqrt(radiusMeters ** 2 + travelled ** 2) + radiusMeters);
}
