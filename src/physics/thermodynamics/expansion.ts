import { assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * Thermal expansion of solids.
 *
 * Linear expansion: ΔL = α L ΔT. A bimetallic strip of two bonded layers of equal
 * thickness and similar stiffness bends with curvature κ = 3 Δα ΔT / (2 h) (Timoshenko,
 * for equal thickness and Young's modulus), where h is the total thickness; a strip of
 * length ℓ clamped at one end deflects at its tip by about κ ℓ² / 2.
 *
 * Inputs SI (m, K, 1/K). Assumptions: α constant over the range, free expansion (no
 * restraint), small deflections. Coefficients are typical room-temperature values.
 */

export interface ExpansionMaterial {
  readonly id: string;
  readonly name: string;
  /** Coefficient of linear expansion, 1/K. */
  readonly alpha: number;
}

export const EXPANSION_MATERIALS: readonly ExpansionMaterial[] = Object.freeze([
  { id: "steel", name: "Steel", alpha: 12e-6 },
  { id: "concrete", name: "Concrete", alpha: 12e-6 },
  { id: "aluminium", name: "Aluminium", alpha: 23e-6 },
  { id: "brass", name: "Brass", alpha: 19e-6 },
  { id: "invar", name: "Invar (nickel–iron)", alpha: 1.2e-6 },
]);

export function findExpansionMaterial(id: string): ExpansionMaterial {
  const found = EXPANSION_MATERIALS.find((material) => material.id === id);
  if (!found) {
    throw new RangeError(`Unknown material ${id}.`);
  }
  return found;
}

/** Change in length (m) for a temperature change (K); negative when it cools. */
export function calculateLinearExpansion(lengthMeters: number, alphaPerKelvin: number, temperatureChangeKelvin: number): number {
  assertPositive(lengthMeters, "lengthMeters");
  assertNonNegative(alphaPerKelvin, "alphaPerKelvin");
  assertFiniteNumber(temperatureChangeKelvin, "temperatureChangeKelvin");
  return alphaPerKelvin * lengthMeters * temperatureChangeKelvin;
}

/** Gap (m) to leave when laying a rail or deck so it just closes at the hottest temperature. */
export function calculateExpansionGap(lengthMeters: number, alphaPerKelvin: number, layingCelsius: number, hottestCelsius: number): number {
  return Math.max(0, calculateLinearExpansion(lengthMeters, alphaPerKelvin, hottestCelsius - layingCelsius));
}

/** Tip deflection (m) of a clamped bimetallic strip of equal-thickness layers. */
export function calculateBimetalDeflection(
  lengthMeters: number,
  totalThicknessMeters: number,
  alphaDifference: number,
  temperatureChangeKelvin: number,
): number {
  assertPositive(lengthMeters, "lengthMeters");
  assertPositive(totalThicknessMeters, "totalThicknessMeters");
  assertNonNegative(alphaDifference, "alphaDifference");
  assertFiniteNumber(temperatureChangeKelvin, "temperatureChangeKelvin");
  const curvature = (3 * alphaDifference * temperatureChangeKelvin) / (2 * totalThicknessMeters);
  return (curvature * lengthMeters ** 2) / 2;
}
