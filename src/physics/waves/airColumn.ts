import { assertNonNegative, assertPositive } from "../core";

/**
 * A jar or tall bottle with straight sides, blown across the top, behaves like a pipe
 * closed at the water surface and open at the top. Its lowest note has a quarter
 * wavelength in the air column: f = v / (4 L_eff), with L_eff = L + 0.6 r (the open-end
 * correction for a pipe of radius r). More water means a shorter column and a higher note.
 *
 * Inputs SI. Assumptions: straight sides (real bottles with narrow necks behave as
 * Helmholtz resonators and sound lower), the fundamental only, still air.
 */

/** Fundamental frequency (Hz) of a closed pipe with an air column of the given length. */
export function calculateClosedPipeFrequency(airColumnMeters: number, radiusMeters: number, soundSpeed: number): number {
  assertPositive(airColumnMeters, "airColumnMeters");
  assertNonNegative(radiusMeters, "radiusMeters");
  assertPositive(soundSpeed, "soundSpeed");
  return soundSpeed / (4 * (airColumnMeters + 0.6 * radiusMeters));
}

/** Water depth (m) that tunes a jar of the given height to a frequency. */
export function calculateWaterDepthForFrequency(jarHeightMeters: number, radiusMeters: number, soundSpeed: number, frequencyHz: number): number {
  assertPositive(jarHeightMeters, "jarHeightMeters");
  assertPositive(frequencyHz, "frequencyHz");
  const column = soundSpeed / (4 * frequencyHz) - 0.6 * radiusMeters;
  return jarHeightMeters - column;
}

/** Frequency (Hz) of a jar with the given water depth. */
export function calculateJarFrequency(jarHeightMeters: number, waterDepthMeters: number, radiusMeters: number, soundSpeed: number): number {
  assertNonNegative(waterDepthMeters, "waterDepthMeters");
  if (waterDepthMeters >= jarHeightMeters) {
    throw new RangeError("The water must leave some air in the jar.");
  }
  return calculateClosedPipeFrequency(jarHeightMeters - waterDepthMeters, radiusMeters, soundSpeed);
}
