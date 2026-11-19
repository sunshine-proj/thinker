import {
  SOLAR_EFFECTIVE_TEMPERATURE,
  SOLAR_LUMINOSITY,
  SOLAR_RADIUS,
  STEFAN_BOLTZMANN_CONSTANT,
  WIEN_DISPLACEMENT_CONSTANT,
  assertPositive,
} from "../core";

/**
 * Stars as black bodies.
 *
 * Wien's law: the spectrum peaks at λ_max = b / T. Stefan–Boltzmann: a star of radius R
 * and surface (effective) temperature T radiates L = 4π R² σ T⁴. In solar units,
 * L/L☉ = (R/R☉)² (T/T☉)⁴. The Harvard spectral classes O B A F G K M run from hot to cool.
 *
 * Inputs SI (K, m, W) or solar units where named. Assumptions: a star radiates like a
 * black body at its effective temperature. Limitations: real spectra have absorption
 * lines, so colour temperatures differ slightly from effective temperatures.
 */

/** Peak wavelength (m) of thermal radiation at temperature T. */
export function calculatePeakWavelength(temperatureKelvin: number): number {
  assertPositive(temperatureKelvin, "temperatureKelvin");
  return WIEN_DISPLACEMENT_CONSTANT / temperatureKelvin;
}

/** Temperature (K) from a peak wavelength (m). */
export function calculateTemperatureFromPeak(peakWavelengthMeters: number): number {
  assertPositive(peakWavelengthMeters, "peakWavelengthMeters");
  return WIEN_DISPLACEMENT_CONSTANT / peakWavelengthMeters;
}

/** Luminosity (W) of a star of radius R (m) and temperature T (K). */
export function calculateLuminosity(radiusMeters: number, temperatureKelvin: number): number {
  assertPositive(radiusMeters, "radiusMeters");
  assertPositive(temperatureKelvin, "temperatureKelvin");
  return 4 * Math.PI * radiusMeters ** 2 * STEFAN_BOLTZMANN_CONSTANT * temperatureKelvin ** 4;
}

/** Luminosity in solar units from radius (R☉) and temperature (K). */
export function calculateSolarLuminosity(radiusSolar: number, temperatureKelvin: number): number {
  assertPositive(radiusSolar, "radiusSolar");
  assertPositive(temperatureKelvin, "temperatureKelvin");
  return radiusSolar ** 2 * (temperatureKelvin / SOLAR_EFFECTIVE_TEMPERATURE) ** 4;
}

/** Radius in solar units from luminosity (L☉) and temperature (K). */
export function calculateSolarRadius(luminositySolar: number, temperatureKelvin: number): number {
  assertPositive(luminositySolar, "luminositySolar");
  assertPositive(temperatureKelvin, "temperatureKelvin");
  return Math.sqrt(luminositySolar) * (SOLAR_EFFECTIVE_TEMPERATURE / temperatureKelvin) ** 2;
}

/** Harvard spectral class for an effective temperature (approximate boundaries). */
export function classifySpectralType(temperatureKelvin: number): "O" | "B" | "A" | "F" | "G" | "K" | "M" {
  assertPositive(temperatureKelvin, "temperatureKelvin");
  if (temperatureKelvin >= 30_000) return "O";
  if (temperatureKelvin >= 10_000) return "B";
  if (temperatureKelvin >= 7_500) return "A";
  if (temperatureKelvin >= 6_000) return "F";
  if (temperatureKelvin >= 5_200) return "G";
  if (temperatureKelvin >= 3_700) return "K";
  return "M";
}

/** The Sun's luminosity from its nominal radius and temperature, W (a consistency check). */
export const SUN_LUMINOSITY_FROM_STEFAN_BOLTZMANN = calculateLuminosity(SOLAR_RADIUS, SOLAR_EFFECTIVE_TEMPERATURE);
export { SOLAR_LUMINOSITY };
