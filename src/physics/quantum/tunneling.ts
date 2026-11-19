import { ELECTRON_VOLT, PLANCK_CONSTANT, SPEED_OF_LIGHT, assertPositive } from "../core";

/**
 * Quantisation and tunnelling in one dimension.
 *
 * Particle in an infinitely deep box of width L: Eₙ = n² h² / (8 m L²). A jump from n₂ to
 * n₁ emits a photon of wavelength λ = h c / (E_{n₂} − E_{n₁}).
 *
 * Rectangular barrier of height V and width a, particle energy E (exact, non-relativistic):
 * for E < V, T = 1 / (1 + V² sinh²(κa) / (4E(V − E))), κ = √(2m(V − E))/ħ;
 * for E > V, T = 1 / (1 + V² sin²(ka) / (4E(E − V))), k = √(2m(E − V))/ħ.
 *
 * Inputs SI (J, kg, m). Assumptions: one dimension, a perfectly rectangular barrier or
 * infinitely deep well, no interactions. Quantum dots and STM gaps are only roughly boxes
 * and barriers, so the numbers show trends rather than device data.
 */

const HBAR = PLANCK_CONSTANT / (2 * Math.PI);

/** Energy (J) of level n in an infinite square well. */
export function calculateBoxEnergy(level: number, massKg: number, widthMeters: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError("The level must be a whole number of at least 1.");
  }
  assertPositive(massKg, "massKg");
  assertPositive(widthMeters, "widthMeters");
  return (level ** 2 * PLANCK_CONSTANT ** 2) / (8 * massKg * widthMeters ** 2);
}

/** Wavelength (m) of the photon from the jump upper → lower in a box. */
export function calculateBoxTransitionWavelength(upper: number, lower: number, massKg: number, widthMeters: number): number {
  if (upper <= lower) {
    throw new RangeError("The upper level must be above the lower level.");
  }
  const energy = calculateBoxEnergy(upper, massKg, widthMeters) - calculateBoxEnergy(lower, massKg, widthMeters);
  return (PLANCK_CONSTANT * SPEED_OF_LIGHT) / energy;
}

/** Box width (m) whose upper → lower jump emits a given wavelength (m). */
export function calculateBoxWidthForWavelength(upper: number, lower: number, massKg: number, wavelengthMeters: number): number {
  assertPositive(wavelengthMeters, "wavelengthMeters");
  const factor = upper ** 2 - lower ** 2;
  return Math.sqrt((factor * PLANCK_CONSTANT * wavelengthMeters) / (8 * massKg * SPEED_OF_LIGHT));
}

/** Exact transmission probability through a rectangular barrier. */
export function calculateBarrierTransmission(energyJoules: number, barrierJoules: number, widthMeters: number, massKg: number): number {
  assertPositive(energyJoules, "energyJoules");
  assertPositive(barrierJoules, "barrierJoules");
  assertPositive(widthMeters, "widthMeters");
  assertPositive(massKg, "massKg");
  const difference = barrierJoules - energyJoules;
  if (Math.abs(difference) < 1e-12 * barrierJoules) {
    // Limit E → V: T = 1 / (1 + m V a² / (2ħ²)).
    return 1 / (1 + (massKg * barrierJoules * widthMeters ** 2) / (2 * HBAR ** 2));
  }
  const wave = Math.sqrt(2 * massKg * Math.abs(difference)) / HBAR;
  const term = difference > 0 ? Math.sinh(wave * widthMeters) ** 2 : Math.sin(wave * widthMeters) ** 2;
  if (!Number.isFinite(term)) {
    return 0;
  }
  return 1 / (1 + (barrierJoules ** 2 * term) / (4 * energyJoules * Math.abs(difference)));
}

/** Convenience: transmission with energies in electron-volts and width in nanometres. */
export function calculateBarrierTransmissionEv(energyEv: number, barrierEv: number, widthNm: number, massKg: number): number {
  return calculateBarrierTransmission(energyEv * ELECTRON_VOLT, barrierEv * ELECTRON_VOLT, widthNm * 1e-9, massKg);
}

/** Barrier width (m) at which the transmission equals a target, found by bisection (E < V). */
export function calculateWidthForTransmission(energyJoules: number, barrierJoules: number, massKg: number, target: number): number {
  if (!(target > 0 && target < 1)) {
    throw new RangeError("The target transmission must be between 0 and 1.");
  }
  if (energyJoules >= barrierJoules) {
    throw new RangeError("This search needs a barrier higher than the energy.");
  }
  let low = 1e-13;
  let high = 1e-8;
  for (let i = 0; i < 200; i += 1) {
    const middle = (low + high) / 2;
    if (calculateBarrierTransmission(energyJoules, barrierJoules, middle, massKg) > target) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}
