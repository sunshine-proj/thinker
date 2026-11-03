import { ELEMENTARY_CHARGE, PLANCK_CONSTANT, SPEED_OF_LIGHT, assertPositive } from "../core";

/** Ground-state binding energy of hydrogen, eV (Rydberg energy, infinite nuclear mass). */
export const RYDBERG_ENERGY_EV = 13.605693;
/** hc in eV·nm. */
export const HC_EV_NM = (PLANCK_CONSTANT * SPEED_OF_LIGHT) / ELEMENTARY_CHARGE * 1e9;

/**
 * The Bohr model of hydrogen-like atoms (one electron around a nucleus of charge Z).
 *
 * Energy levels Eₙ = −13.6 eV · Z²/n². A photon emitted in the jump n_i → n_f has energy ΔE = Eᵢ − E_f and
 * wavelength λ = hc/ΔE. Ionizing the atom from level n takes 13.6 eV · Z²/n².
 *
 * Limitations: valid only for one-electron atoms, treats the nucleus as infinitely heavy (hydrogen lines are about
 * 0.05 % off), and ignores electron spin, fine structure, orbital shapes and the wave nature of the electron.
 * Real electrons occupy probability clouds, not planetary orbits.
 */
export function calculateBohrEnergy(atomicNumber: number, level: number): number {
  validate(atomicNumber, level);
  return (-RYDBERG_ENERGY_EV * atomicNumber ** 2) / level ** 2;
}

function validate(atomicNumber: number, level: number): void {
  if (!Number.isInteger(atomicNumber) || atomicNumber < 1) {
    throw new RangeError("The atomic number must be a positive integer.");
  }
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError("The energy level must be a positive integer.");
  }
}

export function calculateIonizationEnergy(atomicNumber: number, level: number): number {
  return -calculateBohrEnergy(atomicNumber, level);
}

/** Energy of the photon emitted when the electron drops from `upper` to `lower`, eV. */
export function calculateTransitionEnergy(atomicNumber: number, upper: number, lower: number): number {
  if (upper <= lower) {
    throw new RangeError("Emission needs the upper level to be above the lower level.");
  }
  return calculateBohrEnergy(atomicNumber, upper) - calculateBohrEnergy(atomicNumber, lower);
}

export function calculateTransitionWavelengthNm(atomicNumber: number, upper: number, lower: number): number {
  return HC_EV_NM / calculateTransitionEnergy(atomicNumber, upper, lower);
}

/** Radius of the n-th Bohr orbit, in meters: n² a₀ / Z. */
export function calculateBohrRadius(atomicNumber: number, level: number): number {
  validate(atomicNumber, level);
  assertPositive(atomicNumber, "atomicNumber");
  return (5.29177210903e-11 * level ** 2) / atomicNumber;
}

export type SpectralRegion = "ultraviolet" | "visible" | "infrared";

export function classifyWavelength(nm: number): SpectralRegion {
  assertPositive(nm, "nm");
  return nm < 380 ? "ultraviolet" : nm <= 750 ? "visible" : "infrared";
}
