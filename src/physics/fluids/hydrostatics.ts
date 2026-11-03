import { ATMOSPHERIC_PRESSURE, STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * Hydrostatic pressure and the buoyancy of floating bodies.
 *
 * In a fluid at rest of density ρ the pressure increases with depth h as P = P₀ + ρgh. The force on a flat
 * submerged surface of area A is the gauge pressure at its centroid times A, F = ρ g h_c A. A body floats when the
 * weight of fluid it displaces equals its own weight (Archimedes): for a box hull of length l and beam w, the draft
 * is d = m/(ρ l w). Its stability depends on the metacentric height GM = KB + BM − KG, where KB = d/2 is the
 * height of the center of buoyancy above the keel, BM = I/V = w²/(12 d) for a rectangular waterplane (I = l w³/12,
 * V = l w d), and KG is the height of the center of gravity; the ship rights itself after a small tilt if GM > 0.
 *
 * Limitations: incompressible fluid of uniform density, still water, a box-shaped hull, small tilt angles, and a
 * flat submerged surface much smaller than its depth when using the centroid pressure.
 */
export function calculatePressure(depthMeters: number, densityKgPerM3: number, surfacePressurePa = ATMOSPHERIC_PRESSURE): number {
  assertNonNegative(depthMeters, "depthMeters");
  assertPositive(densityKgPerM3, "densityKgPerM3");
  assertNonNegative(surfacePressurePa, "surfacePressurePa");
  return surfacePressurePa + densityKgPerM3 * STANDARD_GRAVITY * depthMeters;
}

export function calculateGaugePressure(depthMeters: number, densityKgPerM3: number): number {
  return calculatePressure(depthMeters, densityKgPerM3, 0);
}

export function calculateDepthForGaugePressure(gaugePa: number, densityKgPerM3: number): number {
  assertNonNegative(gaugePa, "gaugePa");
  assertPositive(densityKgPerM3, "densityKgPerM3");
  return gaugePa / (densityKgPerM3 * STANDARD_GRAVITY);
}

/** Net hydrostatic force on a flat surface of given area whose centroid is at `centroidDepthMeters`. */
export function calculateForceOnSurface(centroidDepthMeters: number, areaSquareMeters: number, densityKgPerM3: number): number {
  assertPositive(areaSquareMeters, "areaSquareMeters");
  return calculateGaugePressure(centroidDepthMeters, densityKgPerM3) * areaSquareMeters;
}

export function calculateDraft(massKg: number, lengthMeters: number, beamMeters: number, densityKgPerM3: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(lengthMeters, "lengthMeters");
  assertPositive(beamMeters, "beamMeters");
  assertPositive(densityKgPerM3, "densityKgPerM3");
  return massKg / (densityKgPerM3 * lengthMeters * beamMeters);
}

/** Metacentric height GM of a box hull, in meters. */
export function calculateMetacentricHeight(draftMeters: number, beamMeters: number, centerOfGravityMeters: number): number {
  assertPositive(draftMeters, "draftMeters");
  assertPositive(beamMeters, "beamMeters");
  assertNonNegative(centerOfGravityMeters, "centerOfGravityMeters");
  return draftMeters / 2 + beamMeters ** 2 / (12 * draftMeters) - centerOfGravityMeters;
}
