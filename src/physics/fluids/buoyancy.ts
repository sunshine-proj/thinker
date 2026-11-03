import { assertPositive } from "../core";

/**
 * Floating and sinking by density (Archimedes' principle).
 *
 * An object floats when its average density is below the fluid's, and then the submerged fraction of its volume
 * equals ρ_object/ρ_fluid; if its density is higher it sinks. A hollow object is described by its average density
 * = total mass / total volume, so a thin steel shell can float. For a hollow sphere of outer radius R and wall
 * thickness t, the material fills the fraction 1 − (1 − t/R)³ of the outer volume.
 *
 * Limitations: homogeneous fluid, objects that stay level (a sphere has no stability problem, a box could tip), no
 * surface tension, and a sealed shell that does not leak.
 */
export function calculateSubmergedFraction(objectDensity: number, fluidDensity: number): number {
  assertPositive(objectDensity, "objectDensity");
  assertPositive(fluidDensity, "fluidDensity");
  return Math.min(1, objectDensity / fluidDensity);
}

export function floats(objectDensity: number, fluidDensity: number): boolean {
  return objectDensity < fluidDensity;
}

export function calculateHollowSphereAverageDensity(materialDensity: number, outerRadius: number, wallThickness: number): number {
  assertPositive(materialDensity, "materialDensity");
  assertPositive(outerRadius, "outerRadius");
  assertPositive(wallThickness, "wallThickness");
  if (wallThickness > outerRadius) {
    throw new RangeError("The wall cannot be thicker than the radius.");
  }
  return materialDensity * (1 - (1 - wallThickness / outerRadius) ** 3);
}

/** Wall thickness giving the requested average density. */
export function calculateWallThicknessForDensity(materialDensity: number, outerRadius: number, targetDensity: number): number {
  assertPositive(materialDensity, "materialDensity");
  assertPositive(outerRadius, "outerRadius");
  assertPositive(targetDensity, "targetDensity");
  if (targetDensity > materialDensity) {
    throw new RangeError("The average density cannot exceed the material's density.");
  }
  return outerRadius * (1 - (1 - targetDensity / materialDensity) ** (1 / 3));
}

/** Fluid density at which an object floats with the given submerged fraction. */
export function calculateFluidDensityForFraction(objectDensity: number, submergedFraction: number): number {
  assertPositive(objectDensity, "objectDensity");
  if (!(submergedFraction > 0 && submergedFraction <= 1)) {
    throw new RangeError("The submerged fraction must be in (0, 1].");
  }
  return objectDensity / submergedFraction;
}
