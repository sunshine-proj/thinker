import {
  VACUUM_PERMEABILITY,
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
} from "../core";

/**
 * A lifting electromagnet: a solenoid wound on an iron core.
 *
 * Field in the core: B = μ₀ μᵣ N I / L, limited by magnetic saturation (about 1.6 T for iron).
 * Pull force of a magnetic circuit across its pole faces: F = n B² A / (2 μ₀), with n the
 * number of pole faces in contact (two for a horseshoe magnet). Coil resistance R = ρ ℓ / a with
 * ℓ the wire length, a the wire cross-section, and heating power P = I² R.
 *
 * Limitations: a uniform field, an effective constant relative permeability (real iron varies and
 * gaps reduce it), a hard saturation limit, no leakage flux, and steady currents.
 */
export const IRON_SATURATION_TESLA = 1.6;
export const COPPER_RESISTIVITY = 1.68e-8;

export function calculateSolenoidField(
  turns: number,
  currentAmperes: number,
  lengthMeters: number,
  relativePermeability: number,
  saturationTesla = IRON_SATURATION_TESLA,
): number {
  assertPositive(turns, "turns");
  assertNonNegative(currentAmperes, "currentAmperes");
  assertPositive(lengthMeters, "lengthMeters");
  assertPositive(relativePermeability, "relativePermeability");
  assertPositive(saturationTesla, "saturationTesla");
  const field = (VACUUM_PERMEABILITY * relativePermeability * turns * currentAmperes) / lengthMeters;
  return Math.min(field, saturationTesla);
}

export function calculateMagneticPullForce(fieldTesla: number, poleAreaSquareMeters: number, poleFaces = 2): number {
  assertNonNegative(fieldTesla, "fieldTesla");
  assertPositive(poleAreaSquareMeters, "poleAreaSquareMeters");
  assertPositive(poleFaces, "poleFaces");
  return (poleFaces * fieldTesla ** 2 * poleAreaSquareMeters) / (2 * VACUUM_PERMEABILITY);
}

export function calculateCoilResistance(
  turns: number,
  meanTurnLengthMeters: number,
  wireAreaSquareMeters: number,
  resistivity = COPPER_RESISTIVITY,
): number {
  assertPositive(turns, "turns");
  assertPositive(meanTurnLengthMeters, "meanTurnLengthMeters");
  assertPositive(wireAreaSquareMeters, "wireAreaSquareMeters");
  assertPositive(resistivity, "resistivity");
  return (resistivity * turns * meanTurnLengthMeters) / wireAreaSquareMeters;
}

export function calculateHeatingPower(currentAmperes: number, resistanceOhms: number): number {
  assertFiniteNumber(currentAmperes, "currentAmperes");
  assertNonNegative(resistanceOhms, "resistanceOhms");
  return currentAmperes ** 2 * resistanceOhms;
}
