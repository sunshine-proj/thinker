import { assertFiniteNumber, assertPositive } from "../core";

/**
 * Thin lenses in the paraxial approximation.
 *
 * Lensmaker's equation: 1/f = (n − 1)(1/R₁ − 1/R₂), with R₁ > 0 when the first
 * surface bulges toward the incoming light and R₂ < 0 for a biconvex lens
 * (a flat surface has R = ∞). Thin-lens equation: 1/f = 1/dₒ + 1/dᵢ, with
 * dᵢ > 0 for a real image (on the far side of the lens) and dᵢ < 0 for a virtual
 * image (same side as the object). Magnification m = −dᵢ/dₒ (negative = inverted).
 *
 * Limitations: thin lens and small angles only: no spherical or chromatic
 * aberration, a single refractive index, and no diffraction. Distances in
 * centimeters (any consistent length unit works).
 */

function curvature(radius: number, name: string): number {
  if (radius === Number.POSITIVE_INFINITY || radius === Number.NEGATIVE_INFINITY) {
    return 0;
  }
  assertFiniteNumber(radius, name);
  if (radius === 0) {
    throw new RangeError(`${name} must not be zero (use Infinity for a flat surface).`);
  }
  return 1 / radius;
}

/** Focal length from the lens material and its two surface radii. Positive = converging. */
export function calculateFocalLength(
  refractiveIndex: number,
  firstRadius: number,
  secondRadius: number,
): number {
  assertPositive(refractiveIndex, "refractiveIndex");
  const power =
    (refractiveIndex - 1) *
    (curvature(firstRadius, "firstRadius") - curvature(secondRadius, "secondRadius"));
  if (power === 0) {
    throw new RangeError("These surfaces give a lens with no focusing power.");
  }
  return 1 / power;
}

/** Image distance from 1/dᵢ = 1/f − 1/dₒ. Returns null when the object is at the focal point (no image). */
export function calculateImageDistance(
  focalLength: number,
  objectDistance: number,
): number | null {
  assertFiniteNumber(focalLength, "focalLength");
  if (focalLength === 0) {
    throw new RangeError("focalLength must not be zero.");
  }
  assertPositive(objectDistance, "objectDistance");
  const inverse = 1 / focalLength - 1 / objectDistance;
  return Math.abs(inverse) < 1e-12 ? null : 1 / inverse;
}

/** Lateral magnification m = −dᵢ/dₒ. */
export function calculateMagnification(
  objectDistance: number,
  imageDistance: number,
): number {
  assertPositive(objectDistance, "objectDistance");
  assertFiniteNumber(imageDistance, "imageDistance");
  const magnification = -imageDistance / objectDistance;
  return magnification === 0 ? 0 : magnification;
}

/**
 * Lens positions (distance from the object) that put a sharp real image on a
 * screen a total distance `separation` from the object. Needs separation ≥ 4f;
 * returns an empty list otherwise, and one position at exactly 4f.
 */
export function calculateConjugatePositions(
  focalLength: number,
  separation: number,
): number[] {
  assertPositive(focalLength, "focalLength");
  assertPositive(separation, "separation");
  const discriminant = separation * (separation - 4 * focalLength);
  if (discriminant < -1e-9) {
    return [];
  }
  const root = Math.sqrt(Math.max(0, discriminant));
  const positions = [(separation - root) / 2, (separation + root) / 2];
  return root === 0 ? [positions[0] as number] : positions;
}

/**
 * Diameter of the blur circle on a screen that is not at the image plane,
 * from similar triangles: b = A |s − dᵢ| / dᵢ, with s the lens-to-screen distance.
 */
export function calculateBlurDiameter(
  apertureDiameter: number,
  imageDistance: number,
  screenDistance: number,
): number {
  assertPositive(apertureDiameter, "apertureDiameter");
  assertPositive(imageDistance, "imageDistance");
  assertPositive(screenDistance, "screenDistance");
  return (apertureDiameter * Math.abs(screenDistance - imageDistance)) / imageDistance;
}
