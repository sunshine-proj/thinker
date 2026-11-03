import { assertPositive } from "../core";

/**
 * Escape velocity from energy conservation.
 *
 * A projectile of speed v at distance r from a body with gravitational parameter μ = GM has specific energy
 * ε = v²/2 − μ/r. It escapes (reaches infinity with speed ≥ 0) exactly when ε ≥ 0, so v_esc = √(2μ/r). With
 * ε < 0 a vertical launch rises to r_max = 2r / (2 − v²r/μ) (where −μ/r_max = ε) and falls back. A craft leaving with excess speed
 * v∞ at infinity must have been launched at v = √(v∞² + v_esc²), and to leave the Sun's pull from a planet's orbit
 * it needs v∞ = √2 v_orbit − v_orbit = (√2 − 1) v_orbit relative to that planet when launched along its motion.
 *
 * Limitations: point-mass sources, no atmospheric drag, no rotation of the body, and one body's pull at a time
 * (the patched-conic approximation for the Sun–Earth case).
 */
export function calculateSpecificEnergy(speed: number, mu: number, radius: number): number {
  assertPositive(mu, "mu");
  assertPositive(radius, "radius");
  if (!Number.isFinite(speed) || speed < 0) {
    throw new RangeError("speed must be a non-negative number.");
  }
  return speed ** 2 / 2 - mu / radius;
}

export function calculateEscapeSpeedAt(mu: number, radius: number): number {
  assertPositive(mu, "mu");
  assertPositive(radius, "radius");
  return Math.sqrt((2 * mu) / radius);
}

/** True if a body launched at `speed` from `radius` reaches infinity. */
export function doesEscape(speed: number, mu: number, radius: number): boolean {
  return calculateSpecificEnergy(speed, mu, radius) >= 0;
}

/** Greatest distance from the center of a body launched straight up at `speed`, or null if it escapes. */
export function calculateMaximumRadius(speed: number, mu: number, radius: number): number | null {
  if (doesEscape(speed, mu, radius)) {
    return null;
  }
  return (2 * radius) / (2 - (speed ** 2 * radius) / mu);
}

/** Launch speed from `radius` that leaves with excess speed `hyperbolicExcess` at infinity. */
export function calculateLaunchSpeedForExcess(hyperbolicExcess: number, mu: number, radius: number): number {
  if (!Number.isFinite(hyperbolicExcess) || hyperbolicExcess < 0) {
    throw new RangeError("hyperbolicExcess must be a non-negative number.");
  }
  return Math.sqrt(hyperbolicExcess ** 2 + calculateEscapeSpeedAt(mu, radius) ** 2);
}

/** Speed needed relative to a planet on a circular orbit of speed v to escape its star, launching along its motion. */
export function calculateExcessToLeaveStar(planetOrbitalSpeed: number): number {
  assertPositive(planetOrbitalSpeed, "planetOrbitalSpeed");
  return (Math.SQRT2 - 1) * planetOrbitalSpeed;
}
