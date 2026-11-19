import { BOLTZMANN_CONSTANT, MOLAR_GAS_CONSTANT, PLANCK_CONSTANT, assertPositive } from "../core";

/**
 * Kinetic theory of an ideal gas.
 *
 * Mean translational kinetic energy per particle ⟨E⟩ = (3/2) k T; root-mean-square speed
 * v_rms = √(3RT/M). At constant volume the pressure is proportional to absolute
 * temperature, P₂ = P₁ T₂/T₁ (Gay-Lussac). The thermal de Broglie wavelength
 * λ = h/√(2π m k T) shows when quantum effects matter: once it approaches the spacing
 * between particles, the classical ideal gas no longer describes the matter.
 *
 * Inputs: kelvin, kg/mol, kg. Limitations: ideal, classical, monatomic translation only;
 * real gases liquefy before reaching absolute zero, which these formulas do not show.
 */

/** Mean translational kinetic energy per particle, J. */
export function calculateMeanKineticEnergy(temperatureKelvin: number): number {
  assertPositive(temperatureKelvin, "temperatureKelvin");
  return 1.5 * BOLTZMANN_CONSTANT * temperatureKelvin;
}

/** Root-mean-square speed, m/s, for a gas of the given molar mass (kg/mol). */
export function calculateRmsSpeed(temperatureKelvin: number, molarMassKgPerMol: number): number {
  assertPositive(temperatureKelvin, "temperatureKelvin");
  assertPositive(molarMassKgPerMol, "molarMassKgPerMol");
  return Math.sqrt((3 * MOLAR_GAS_CONSTANT * temperatureKelvin) / molarMassKgPerMol);
}

/** Pressure (Pa) after a constant-volume temperature change of an ideal gas. */
export function calculatePressureAtConstantVolume(
  initialPressurePa: number,
  initialKelvin: number,
  finalKelvin: number,
): number {
  assertPositive(initialPressurePa, "initialPressurePa");
  assertPositive(initialKelvin, "initialKelvin");
  assertPositive(finalKelvin, "finalKelvin");
  return (initialPressurePa * finalKelvin) / initialKelvin;
}

/** Thermal de Broglie wavelength (m) of a particle of mass m at temperature T. */
export function calculateThermalWavelength(temperatureKelvin: number, particleMassKg: number): number {
  assertPositive(temperatureKelvin, "temperatureKelvin");
  assertPositive(particleMassKg, "particleMassKg");
  return PLANCK_CONSTANT / Math.sqrt(2 * Math.PI * particleMassKg * BOLTZMANN_CONSTANT * temperatureKelvin);
}
