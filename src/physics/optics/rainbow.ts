import { assertFiniteNumber, assertPositive } from "../core";

/**
 * Rainbows from refraction, internal reflection, and dispersion in a spherical water drop.
 *
 * A ray hitting a drop at angle of incidence θᵢ refracts (Snell: sin θᵢ = n sin θᵣ), reflects k times inside,
 * and refracts out. Its total deviation is D = 180°·k + 2θᵢ − 2(k + 1)θᵣ (mod 360°). Rays near the angle of
 * minimum deviation pile up, because D changes slowly there, which makes the bright rainbow. Minimum
 * deviation occurs at cos²θᵢ = (n² − 1)/(k(k + 2)). Water's refractive index varies with wavelength, so each
 * colour has its own rainbow angle (dispersion): n(λ) = A + B/λ² (Cauchy's formula, fitted to water).
 *
 * Limitations: geometric optics for a single spherical drop (no diffraction, so no supernumerary bows),
 * no polarisation or intensity, and a Cauchy fit valid for visible light.
 */
const CAUCHY_A = 1.3236;
const CAUCHY_B = 3260; // nm²

export function calculateWaterRefractiveIndex(wavelengthNanometers: number): number {
  assertPositive(wavelengthNanometers, "wavelengthNanometers");
  if (wavelengthNanometers < 300 || wavelengthNanometers > 1000) {
    throw new RangeError("The model is valid for wavelengths between 300 and 1000 nm.");
  }
  return CAUCHY_A + CAUCHY_B / wavelengthNanometers ** 2;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/** Angle of refraction (°) inside the drop for incidence θᵢ (°). */
export function calculateRefractionAngle(incidenceDegrees: number, refractiveIndex: number): number {
  assertPositive(refractiveIndex, "refractiveIndex");
  assertFiniteNumber(incidenceDegrees, "incidenceDegrees");
  if (incidenceDegrees < 0 || incidenceDegrees > 90) {
    throw new RangeError("incidenceDegrees must be between 0 and 90.");
  }
  return toDegrees(Math.asin(Math.sin(toRadians(incidenceDegrees)) / refractiveIndex));
}

/** Total deviation (°) after k internal reflections, between 0 and 360. */
export function calculateDeviation(incidenceDegrees: number, refractiveIndex: number, reflections: number): number {
  if (!Number.isInteger(reflections) || reflections < 1 || reflections > 2) {
    throw new RangeError("reflections must be 1 (primary) or 2 (secondary).");
  }
  const refraction = calculateRefractionAngle(incidenceDegrees, refractiveIndex);
  const deviation = 180 * reflections + 2 * incidenceDegrees - 2 * (reflections + 1) * refraction;
  return ((deviation % 360) + 360) % 360;
}

/** Incidence angle (°) of minimum deviation: cos²θᵢ = (n² − 1)/(k(k + 2)). */
export function calculateMinimumDeviationIncidence(refractiveIndex: number, reflections: number): number {
  if (!Number.isInteger(reflections) || reflections < 1 || reflections > 2) {
    throw new RangeError("reflections must be 1 (primary) or 2 (secondary).");
  }
  assertPositive(refractiveIndex, "refractiveIndex");
  const cosSquared = (refractiveIndex ** 2 - 1) / (reflections * (reflections + 2));
  if (cosSquared <= 0 || cosSquared >= 1) {
    throw new RangeError("No minimum-deviation ray exists for this index.");
  }
  return toDegrees(Math.acos(Math.sqrt(cosSquared)));
}

/**
 * Angle of the bow from the antisolar point (°): 180° − D for the primary bow and D − 180° for the
 * secondary, evaluated at minimum deviation.
 */
export function calculateRainbowAngle(refractiveIndex: number, reflections: number): number {
  const incidence = calculateMinimumDeviationIncidence(refractiveIndex, reflections);
  const deviation = calculateDeviation(incidence, refractiveIndex, reflections);
  return reflections === 1 ? 180 - deviation : deviation - 180;
}
