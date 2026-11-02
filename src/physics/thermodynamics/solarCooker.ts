import { assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * A solar cooker: a reflector concentrates sunlight onto a pot.
 *
 * Collected power P = I A ρ cos θ, with I the solar irradiance (≈ 1000 W/m² at noon on a clear day),
 * A the reflector's aperture area (π D²/4 for a round dish), ρ its reflectivity, and θ the angle between the
 * dish axis and the sun (misalignment). The pot loses heat to the air at Q = h S (T − T_a); with no losses
 * it heats m c ΔT in t = m c ΔT/P, and in steady state it reaches T = T_a + P/(h S).
 *
 * Limitations: a fixed irradiance, a single effective loss coefficient (combining convection and radiation),
 * a perfectly focused reflector, and a uniform pot temperature.
 */
export function calculateDishArea(diameterMeters: number): number {
  assertPositive(diameterMeters, "diameterMeters");
  return (Math.PI * diameterMeters ** 2) / 4;
}

export function calculateCollectedPower(
  irradianceWattsPerSquareMeter: number,
  apertureAreaSquareMeters: number,
  reflectivity: number,
  misalignmentDegrees: number,
): number {
  assertNonNegative(irradianceWattsPerSquareMeter, "irradiance");
  assertPositive(apertureAreaSquareMeters, "apertureArea");
  if (reflectivity < 0 || reflectivity > 1) {
    throw new RangeError("reflectivity must be between 0 and 1.");
  }
  assertFiniteNumber(misalignmentDegrees, "misalignmentDegrees");
  const cosine = Math.cos((misalignmentDegrees * Math.PI) / 180);
  return irradianceWattsPerSquareMeter * apertureAreaSquareMeters * reflectivity * Math.max(0, cosine);
}

/** Time (s) to add `energy` joules at net power P; null if the power is not positive. */
export function calculateHeatingTime(energyJoules: number, netPowerWatts: number): number | null {
  assertNonNegative(energyJoules, "energyJoules");
  assertFiniteNumber(netPowerWatts, "netPowerWatts");
  return netPowerWatts > 0 ? energyJoules / netPowerWatts : null;
}

/** Steady pot temperature T = T_a + P/(h S). */
export function calculateSteadyPotTemperature(
  powerWatts: number,
  lossCoefficientWattsPerSquareMeterKelvin: number,
  potAreaSquareMeters: number,
  ambientCelsius: number,
): number {
  assertNonNegative(powerWatts, "powerWatts");
  assertPositive(lossCoefficientWattsPerSquareMeterKelvin, "lossCoefficient");
  assertPositive(potAreaSquareMeters, "potArea");
  assertFiniteNumber(ambientCelsius, "ambientCelsius");
  return ambientCelsius + powerWatts / (lossCoefficientWattsPerSquareMeterKelvin * potAreaSquareMeters);
}

/** Concentration ratio: aperture area over receiver area. */
export function calculateConcentrationRatio(apertureAreaSquareMeters: number, receiverAreaSquareMeters: number): number {
  assertPositive(apertureAreaSquareMeters, "apertureArea");
  assertPositive(receiverAreaSquareMeters, "receiverArea");
  return apertureAreaSquareMeters / receiverAreaSquareMeters;
}
