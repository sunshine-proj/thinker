import { ELECTRON_MASS, ELEMENTARY_CHARGE, PLANCK_CONSTANT, assertPositive } from "../core";

/**
 * Matter waves and the double slit.
 *
 * Every particle has a de Broglie wavelength λ = h/p. An electron accelerated from rest through a potential
 * difference V has kinetic energy eV, so p = √(2 m e V) and λ = h/√(2 m e V) (non-relativistic, good below about
 * 10 kV). For a double slit of separation d at distance L, bright fringes are Δy = λL/d apart, for electrons just as
 * for light, even if they arrive one at a time.
 *
 * Limitations: non-relativistic momentum, point-like slits much narrower than d, and screen distance L ≫ d.
 */
export function calculateDeBroglieWavelength(momentum: number): number {
  assertPositive(momentum, "momentum");
  return PLANCK_CONSTANT / momentum;
}

export function calculateWavelengthFromSpeed(massKg: number, speed: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(speed, "speed");
  return calculateDeBroglieWavelength(massKg * speed);
}

export function calculateElectronWavelengthFromVoltage(volts: number): number {
  assertPositive(volts, "volts");
  if (volts > 10_000) {
    throw new RangeError("The non-relativistic formula is not valid above about 10 kV.");
  }
  return calculateDeBroglieWavelength(Math.sqrt(2 * ELECTRON_MASS * ELEMENTARY_CHARGE * volts));
}

export function calculateVoltageForWavelength(wavelengthMeters: number): number {
  assertPositive(wavelengthMeters, "wavelengthMeters");
  return PLANCK_CONSTANT ** 2 / (2 * ELECTRON_MASS * ELEMENTARY_CHARGE * wavelengthMeters ** 2);
}

export function calculateSpeedForWavelength(massKg: number, wavelengthMeters: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(wavelengthMeters, "wavelengthMeters");
  return PLANCK_CONSTANT / (massKg * wavelengthMeters);
}

export function calculateMatterFringeSpacing(wavelengthMeters: number, screenDistanceMeters: number, slitSeparationMeters: number): number {
  assertPositive(wavelengthMeters, "wavelengthMeters");
  assertPositive(screenDistanceMeters, "screenDistanceMeters");
  assertPositive(slitSeparationMeters, "slitSeparationMeters");
  return (wavelengthMeters * screenDistanceMeters) / slitSeparationMeters;
}
