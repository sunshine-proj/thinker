import { BOHR_RADIUS, ELEMENTARY_CHARGE, PLANCK_CONSTANT, RYDBERG_ENERGY_EV, SPEED_OF_LIGHT, assertPositive } from "../core";

/** Ground-state binding energy of hydrogen, eV (Rydberg energy, infinite nuclear mass). */
export { RYDBERG_ENERGY_EV };
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
  return (BOHR_RADIUS * level ** 2) / atomicNumber;
}

export type SpectralRegion = "ultraviolet" | "visible" | "infrared";

export function classifyWavelength(nm: number): SpectralRegion {
  assertPositive(nm, "nm");
  return nm < 380 ? "ultraviolet" : nm <= 750 ? "visible" : "infrared";
}

/**
 * The level an atom in level n jumps to when it absorbs a photon of the given energy
 * (eV), or null if no transition matches within the relative tolerance. Energies at or
 * above the ionisation energy return "ionised". The tolerance stands in for the finite
 * width of real spectral lines.
 */
export function findAbsorption(atomicNumber: number, level: number, photonEv: number, tolerance = 0.005, maximumLevel = 8): number | "ionised" | null {
  assertPositive(photonEv, "photonEv");
  if (photonEv >= calculateIonizationEnergy(atomicNumber, level)) {
    return "ionised";
  }
  for (let upper = level + 1; upper <= maximumLevel; upper += 1) {
    const gap = calculateTransitionEnergy(atomicNumber, upper, level);
    if (Math.abs(photonEv - gap) <= tolerance * gap) {
      return upper;
    }
  }
  return null;
}
