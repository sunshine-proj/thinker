import { assertPositive } from "../core";

/** Conventional near point of the eye, m, used to quote eyepiece magnification. */
export const NEAR_POINT_METERS = 0.25;

/**
 * Compound microscope in the thin-lens approximation.
 *
 * The objective (focal length fₒ) forms a real, inverted, enlarged intermediate image; the tube length L is the
 * distance from the objective's rear focal point to that image's position (the eyepiece's front focal point).
 * Objective magnification mₒ = −L/fₒ, with the specimen at dₒ = fₒ(fₒ + L)/L. The eyepiece acts as a magnifier
 * with the final image at infinity: Mₑ = 25 cm / fₑ. The total magnification is the product.
 *
 * Resolution (Abbe): the smallest separation that can be told apart is d = 0.61 λ / NA. Magnification beyond about
 * 1000 × NA ("empty magnification") only enlarges blur.
 *
 * Limitations: thin lenses, no aberrations, paraxial rays, and a relaxed eye.
 */
export function calculateObjectiveMagnification(tubeLengthMeters: number, objectiveFocalLengthMeters: number): number {
  assertPositive(tubeLengthMeters, "tubeLengthMeters");
  assertPositive(objectiveFocalLengthMeters, "objectiveFocalLengthMeters");
  return tubeLengthMeters / objectiveFocalLengthMeters;
}

export function calculateEyepieceMagnification(eyepieceFocalLengthMeters: number): number {
  assertPositive(eyepieceFocalLengthMeters, "eyepieceFocalLengthMeters");
  return NEAR_POINT_METERS / eyepieceFocalLengthMeters;
}

export function calculateMicroscopeMagnification(
  tubeLengthMeters: number,
  objectiveFocalLengthMeters: number,
  eyepieceFocalLengthMeters: number,
): number {
  return (
    calculateObjectiveMagnification(tubeLengthMeters, objectiveFocalLengthMeters) *
    calculateEyepieceMagnification(eyepieceFocalLengthMeters)
  );
}

/** Distance from the objective to the specimen: dₒ = fₒ(fₒ + L)/L, always just beyond fₒ. */
export function calculateSpecimenDistance(tubeLengthMeters: number, objectiveFocalLengthMeters: number): number {
  assertPositive(tubeLengthMeters, "tubeLengthMeters");
  assertPositive(objectiveFocalLengthMeters, "objectiveFocalLengthMeters");
  return (objectiveFocalLengthMeters * (objectiveFocalLengthMeters + tubeLengthMeters)) / tubeLengthMeters;
}

/** Abbe diffraction limit d = 0.61 λ / NA, m. */
export function calculateResolutionLimit(wavelengthMeters: number, numericalAperture: number): number {
  assertPositive(wavelengthMeters, "wavelengthMeters");
  assertPositive(numericalAperture, "numericalAperture");
  if (numericalAperture > 1.6) {
    throw new RangeError("Numerical aperture above 1.6 is not achievable with ordinary immersion oils.");
  }
  return (0.61 * wavelengthMeters) / numericalAperture;
}

/** Largest magnification that still reveals new detail, about 1000 × NA. */
export function calculateUsefulMagnificationLimit(numericalAperture: number): number {
  assertPositive(numericalAperture, "numericalAperture");
  return 1000 * numericalAperture;
}
