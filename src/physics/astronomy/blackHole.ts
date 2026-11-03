import { GRAVITATIONAL_CONSTANT, SPEED_OF_LIGHT, assertPositive } from "../core";

/** Mass of the Sun, kg (GM☉ / G). */
export const SOLAR_MASS = 1.98847e30;

/**
 * Non-rotating (Schwarzschild) black holes.
 *
 * The Schwarzschild radius is r_s = 2GM/c². A clock held at rest at radius r > r_s runs slow relative to one far
 * away by √(1 − r_s/r). Circular orbits exist for r > 1.5 r_s (the photon sphere, where light itself can orbit),
 * but are stable only for r ≥ 3 r_s, the innermost stable circular orbit (ISCO).
 *
 * Limitations: no spin, no charge, no accretion disk or other matter, observers far from any other masses. The
 * formulas are exact for the Schwarzschild solution, but quantities such as "radius" are the Schwarzschild
 * coordinate, not a ruler distance. Newtonian expressions are not valid near r_s.
 */
export function calculateSchwarzschildRadius(massKg: number): number {
  assertPositive(massKg, "massKg");
  return (2 * GRAVITATIONAL_CONSTANT * massKg) / SPEED_OF_LIGHT ** 2;
}

export function calculateMassFromSchwarzschildRadius(radiusMeters: number): number {
  assertPositive(radiusMeters, "radiusMeters");
  return (radiusMeters * SPEED_OF_LIGHT ** 2) / (2 * GRAVITATIONAL_CONSTANT);
}

/** Rate of a static clock at radius r relative to a distant clock: √(1 − r_s/r). */
export function calculateTimeDilationFactor(radiusMeters: number, schwarzschildRadiusMeters: number): number {
  assertPositive(radiusMeters, "radiusMeters");
  assertPositive(schwarzschildRadiusMeters, "schwarzschildRadiusMeters");
  if (radiusMeters <= schwarzschildRadiusMeters) {
    throw new RangeError("A static clock cannot exist at or inside the event horizon.");
  }
  return Math.sqrt(1 - schwarzschildRadiusMeters / radiusMeters);
}

/** Radius of the photon sphere, 1.5 r_s. */
export function calculatePhotonSphereRadius(schwarzschildRadiusMeters: number): number {
  assertPositive(schwarzschildRadiusMeters, "schwarzschildRadiusMeters");
  return 1.5 * schwarzschildRadiusMeters;
}

/** Innermost stable circular orbit, 3 r_s. */
export function calculateIscoRadius(schwarzschildRadiusMeters: number): number {
  assertPositive(schwarzschildRadiusMeters, "schwarzschildRadiusMeters");
  return 3 * schwarzschildRadiusMeters;
}

export type OrbitClass = "inside-horizon" | "no-orbit" | "unstable" | "stable";

/** What kind of circular orbit, if any, exists at radius r. */
export function classifyCircularOrbit(radiusMeters: number, schwarzschildRadiusMeters: number): OrbitClass {
  assertPositive(radiusMeters, "radiusMeters");
  assertPositive(schwarzschildRadiusMeters, "schwarzschildRadiusMeters");
  if (radiusMeters <= schwarzschildRadiusMeters) return "inside-horizon";
  if (radiusMeters < 1.5 * schwarzschildRadiusMeters) return "no-orbit";
  return radiusMeters < 3 * schwarzschildRadiusMeters ? "unstable" : "stable";
}
