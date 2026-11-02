import { assertPositive } from "../core";
import { calculateImageDistance, calculateMagnification } from "./thinLens";

/**
 * Plane and spherical mirrors in the paraxial approximation.
 *
 * Plane mirror: the image is as far behind the mirror as the object is in front, upright and the same size; a
 * person sees their whole body in a mirror at least half as tall as they are, positioned so its lower edge is
 * no higher than half the eye height and its upper edge no lower than halfway between the eyes and the top of
 * the head. Spherical mirror: focal length f = R/2 (positive for concave, negative for convex) and the same
 * equation as a thin lens, 1/f = 1/dₒ + 1/dᵢ, with dᵢ > 0 a real image in front of the mirror and dᵢ < 0 a virtual
 * image behind it; magnification m = −dᵢ/dₒ.
 *
 * Limitations: small angles and apertures only (no spherical aberration) and perfectly reflecting surfaces.
 */
export function calculateMirrorFocalLength(radiusOfCurvatureMeters: number, convex = false): number {
  assertPositive(radiusOfCurvatureMeters, "radiusOfCurvatureMeters");
  const f = radiusOfCurvatureMeters / 2;
  return convex ? -f : f;
}

export function calculateMirrorImage(focalLengthMeters: number, objectDistanceMeters: number): {
  imageDistance: number | null;
  magnification: number | null;
} {
  const imageDistance = calculateImageDistance(focalLengthMeters, objectDistanceMeters);
  return {
    imageDistance,
    magnification: imageDistance === null ? null : calculateMagnification(objectDistanceMeters, imageDistance),
  };
}

/** Lowest and highest points a plane mirror must cover for a person to see head to toe. */
export function calculatePlaneMirrorCoverage(eyeHeightMeters: number, bodyHeightMeters: number): { lowest: number; highest: number } {
  assertPositive(eyeHeightMeters, "eyeHeightMeters");
  assertPositive(bodyHeightMeters, "bodyHeightMeters");
  if (eyeHeightMeters > bodyHeightMeters) {
    throw new RangeError("The eyes cannot be higher than the top of the head.");
  }
  return { lowest: eyeHeightMeters / 2, highest: (eyeHeightMeters + bodyHeightMeters) / 2 };
}
