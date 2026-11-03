import { EARTH_MASS, EARTH_MEAN_RADIUS, GRAVITATIONAL_CONSTANT, assertPositive } from "../core";

/**
 * Properties of a spherical, uniform-composition body of mass M and radius R.
 *
 * Surface gravity g = GM/R², mean density ρ = M / (4/3 π R³), escape speed v = √(2GM/R) and the speed of a
 * grazing circular orbit √(GM/R). Inputs and outputs are SI; Earth-relative helpers are provided for the game.
 *
 * Limitations: spherical, non-rotating body (no centrifugal reduction of g at the equator), a point-mass
 * gravitational field outside the planet, and no atmosphere.
 */
export interface PlanetProperties {
  readonly surfaceGravity: number;
  readonly meanDensity: number;
  readonly escapeSpeed: number;
  readonly orbitalSpeedAtSurface: number;
  readonly orbitalPeriodAtSurface: number;
}

export function calculateSurfaceGravity(massKg: number, radiusMeters: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(radiusMeters, "radiusMeters");
  return (GRAVITATIONAL_CONSTANT * massKg) / radiusMeters ** 2;
}

export function calculateMeanDensity(massKg: number, radiusMeters: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(radiusMeters, "radiusMeters");
  return massKg / ((4 / 3) * Math.PI * radiusMeters ** 3);
}

export function calculatePlanetEscapeSpeed(massKg: number, radiusMeters: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(radiusMeters, "radiusMeters");
  return Math.sqrt((2 * GRAVITATIONAL_CONSTANT * massKg) / radiusMeters);
}

export function calculatePlanetProperties(massKg: number, radiusMeters: number): PlanetProperties {
  const mu = GRAVITATIONAL_CONSTANT * massKg;
  assertPositive(mu, "mass");
  assertPositive(radiusMeters, "radiusMeters");
  const orbitalSpeed = Math.sqrt(mu / radiusMeters);
  return {
    surfaceGravity: calculateSurfaceGravity(massKg, radiusMeters),
    meanDensity: calculateMeanDensity(massKg, radiusMeters),
    escapeSpeed: calculatePlanetEscapeSpeed(massKg, radiusMeters),
    orbitalSpeedAtSurface: orbitalSpeed,
    orbitalPeriodAtSurface: (2 * Math.PI * radiusMeters) / orbitalSpeed,
  };
}

/** Properties of a planet given in Earth masses and Earth radii. */
export function calculatePlanetPropertiesFromEarthUnits(earthMasses: number, earthRadii: number): PlanetProperties {
  assertPositive(earthMasses, "earthMasses");
  assertPositive(earthRadii, "earthRadii");
  return calculatePlanetProperties(earthMasses * EARTH_MASS, earthRadii * EARTH_MEAN_RADIUS);
}
