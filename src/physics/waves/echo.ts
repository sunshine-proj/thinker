import {
  AIR_ADIABATIC_INDEX,
  AIR_MOLAR_MASS,
  MOLAR_GAS_CONSTANT,
  assertFiniteNumber,
  assertPositive,
  celsiusToKelvin,
} from "../core";

/** Shortest delay the ear can separate an echo from the original sound, s (the "Haas" limit). */
export const DISTINCT_ECHO_DELAY_SECONDS = 0.1;

/**
 * Sound in air: v = √(γ R T / M) for an ideal gas, about 331 m/s at 0 °C and 343 m/s at 20 °C. An echo from a
 * wall at distance d returns after t = 2d/v.
 *
 * Limitations: dry air treated as an ideal gas (humidity raises the speed by up to about 0.5 %), no wind, a single
 * flat reflecting wall, and no absorption of the sound along the way.
 */
export function calculateSpeedOfSound(temperatureCelsius: number): number {
  assertFiniteNumber(temperatureCelsius, "temperatureCelsius");
  const kelvin = celsiusToKelvin(temperatureCelsius);
  assertPositive(kelvin, "temperature (K)");
  return Math.sqrt((AIR_ADIABATIC_INDEX * MOLAR_GAS_CONSTANT * kelvin) / AIR_MOLAR_MASS);
}

/** Temperature (°C) at which the speed of sound in air is `speed`. */
export function calculateTemperatureFromSpeed(speedMetersPerSecond: number): number {
  assertPositive(speedMetersPerSecond, "speedMetersPerSecond");
  const kelvin = (speedMetersPerSecond ** 2 * AIR_MOLAR_MASS) / (AIR_ADIABATIC_INDEX * MOLAR_GAS_CONSTANT);
  return kelvin - celsiusToKelvin(0);
}

export function calculateEchoDelay(distanceMeters: number, speedMetersPerSecond: number): number {
  assertPositive(distanceMeters, "distanceMeters");
  assertPositive(speedMetersPerSecond, "speedMetersPerSecond");
  return (2 * distanceMeters) / speedMetersPerSecond;
}

export function calculateEchoDistance(delaySeconds: number, speedMetersPerSecond: number): number {
  assertPositive(delaySeconds, "delaySeconds");
  assertPositive(speedMetersPerSecond, "speedMetersPerSecond");
  return (speedMetersPerSecond * delaySeconds) / 2;
}

/** Smallest wall distance for which the echo is heard as separate from the sound. */
export function calculateMinimumEchoDistance(speedMetersPerSecond: number): number {
  return calculateEchoDistance(DISTINCT_ECHO_DELAY_SECONDS, speedMetersPerSecond);
}
