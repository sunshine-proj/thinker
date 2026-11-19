import { assertPositive } from "../core";

/**
 * Diffraction by gratings, single slits and thin obstacles.
 *
 * Grating of spacing d: bright orders at d sinθ = m λ. Single slit of width a: dark
 * minima at a sinθ = m λ (m = 1, 2…), and Babinet's principle gives the same pattern for
 * a thin obstacle such as a hair of width a. On a screen at distance L the first minimum
 * is at y = L tanθ.
 *
 * Inputs SI. Assumptions: monochromatic plane waves, far-field (Fraunhofer) diffraction.
 */

function assertSine(value: number): void {
  if (!(value >= -1 && value <= 1)) {
    throw new RangeError("No diffracted beam exists at that order.");
  }
}

/** Angle (degrees) of grating order m. */
export function calculateGratingAngle(spacingMeters: number, wavelengthMeters: number, order = 1): number {
  assertPositive(spacingMeters, "spacingMeters");
  assertPositive(wavelengthMeters, "wavelengthMeters");
  const sine = (order * wavelengthMeters) / spacingMeters;
  assertSine(sine);
  return (Math.asin(sine) * 180) / Math.PI;
}

/** Wavelength (m) from a measured grating angle. */
export function calculateWavelengthFromGrating(spacingMeters: number, angleDegrees: number, order = 1): number {
  assertPositive(spacingMeters, "spacingMeters");
  return (spacingMeters * Math.sin((angleDegrees * Math.PI) / 180)) / order;
}

/** Grating spacing (m) from a wavelength and its first-order angle. */
export function calculateSpacingFromAngle(wavelengthMeters: number, angleDegrees: number, order = 1): number {
  assertPositive(wavelengthMeters, "wavelengthMeters");
  return (order * wavelengthMeters) / Math.sin((angleDegrees * Math.PI) / 180);
}

/** Distance (m) on a screen from the centre to the m-th dark minimum of a slit or hair. */
export function calculateMinimumPosition(widthMeters: number, wavelengthMeters: number, screenDistanceMeters: number, order = 1): number {
  assertPositive(widthMeters, "widthMeters");
  assertPositive(wavelengthMeters, "wavelengthMeters");
  assertPositive(screenDistanceMeters, "screenDistanceMeters");
  const sine = (order * wavelengthMeters) / widthMeters;
  assertSine(sine);
  return screenDistanceMeters * Math.tan(Math.asin(sine));
}

/** Single-slit intensity (sinβ/β)², β = π a sinθ / λ, at screen position y. */
export function calculateSingleSlitIntensity(widthMeters: number, wavelengthMeters: number, screenDistanceMeters: number, y: number): number {
  const sine = y / Math.hypot(y, screenDistanceMeters);
  const beta = (Math.PI * widthMeters * sine) / wavelengthMeters;
  return beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2;
}
