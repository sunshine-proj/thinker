import { AIR_MOLAR_MASS, ATMOSPHERIC_PRESSURE, MOLAR_GAS_CONSTANT, STANDARD_GRAVITY, assertPositive } from "../core";

/**
 * A hot-air balloon floats because warm air is less dense than cold air. For an ideal
 * gas ρ = P M / (R T), so at the same pressure the hot air inside is lighter. The upward
 * buoyant force on the envelope is V g ρ_out (Archimedes) and the weight of the air inside
 * is V g ρ_in, so the net lift of the hot air is V g (ρ_out − ρ_in).
 *
 * Assumptions: ideal gas, the same pressure inside and outside, uniform temperatures,
 * and no change of air density with height over the course.
 */

export function calculateAirDensity(temperatureKelvin: number, pressurePa = ATMOSPHERIC_PRESSURE): number {
  assertPositive(temperatureKelvin, "temperatureKelvin");
  assertPositive(pressurePa, "pressurePa");
  return (pressurePa * AIR_MOLAR_MASS) / (MOLAR_GAS_CONSTANT * temperatureKelvin);
}

/** Net lift (N) of an envelope of volume V filled with air at T_in in air at T_out. */
export function calculateHotAirLift(volumeCubicMeters: number, insideKelvin: number, outsideKelvin: number): number {
  assertPositive(volumeCubicMeters, "volumeCubicMeters");
  return volumeCubicMeters * STANDARD_GRAVITY * (calculateAirDensity(outsideKelvin) - calculateAirDensity(insideKelvin));
}

/** Inside temperature (K) at which the hot air just lifts a load of mass m (kg). */
export function calculateFloatTemperature(volumeCubicMeters: number, loadKg: number, outsideKelvin: number): number {
  const needed = calculateAirDensity(outsideKelvin) - loadKg / volumeCubicMeters;
  if (needed <= 0) {
    throw new RangeError("No temperature can lift that load with this envelope.");
  }
  return (ATMOSPHERIC_PRESSURE * AIR_MOLAR_MASS) / (MOLAR_GAS_CONSTANT * needed);
}
