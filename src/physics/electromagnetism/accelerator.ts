import {
  ELECTRON_VOLT,
  SPEED_OF_LIGHT,
  assertNonNegative,
  assertPositive,
} from "../core";

/**
 * Charged particles in a cyclotron.
 *
 * In a uniform field B a particle of charge q and mass m circles with radius r = m v / (q B)
 * and (classically) frequency f = q B / (2π m), independent of speed, so an alternating electric
 * field at that frequency can accelerate it every half turn. At the largest radius R the particle
 * has momentum p = q B R and, classically, kinetic energy E = (q B R)² / (2m).
 *
 * Relativistic (advanced) mode: E_k = √((pc)² + (mc²)²) − mc² with p = q B R, and the true
 * frequency falls as the particle gains energy, f = q B / (2π γ m), which is why simple
 * cyclotrons fall out of step at high energy. The classical model is only valid for E_k ≪ mc².
 *
 * Limitations: a uniform field, no space-charge effects, ideal RF timing, and a single particle.
 */
export function calculateCyclotronFrequencyHz(chargeCoulombs: number, massKilograms: number, fieldTesla: number): number {
  assertPositive(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  assertPositive(fieldTesla, "fieldTesla");
  return (chargeCoulombs * fieldTesla) / (2 * Math.PI * massKilograms);
}

/** Field (T) that makes the cyclotron frequency equal `frequencyHz`. */
export function calculateResonantField(chargeCoulombs: number, massKilograms: number, frequencyHz: number): number {
  assertPositive(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  assertPositive(frequencyHz, "frequencyHz");
  return (2 * Math.PI * massKilograms * frequencyHz) / chargeCoulombs;
}

/** Classical kinetic energy (J) at the extraction radius. */
export function calculateClassicalExtractionEnergy(
  chargeCoulombs: number, massKilograms: number, fieldTesla: number, radiusMeters: number,
): number {
  assertPositive(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  assertNonNegative(fieldTesla, "fieldTesla");
  assertPositive(radiusMeters, "radiusMeters");
  return (chargeCoulombs * fieldTesla * radiusMeters) ** 2 / (2 * massKilograms);
}

/** Relativistic kinetic energy (J) at the extraction radius, from p = qBR. */
export function calculateRelativisticExtractionEnergy(
  chargeCoulombs: number, massKilograms: number, fieldTesla: number, radiusMeters: number,
): number {
  assertPositive(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  assertNonNegative(fieldTesla, "fieldTesla");
  assertPositive(radiusMeters, "radiusMeters");
  const momentum = chargeCoulombs * fieldTesla * radiusMeters;
  const restEnergy = massKilograms * SPEED_OF_LIGHT ** 2;
  return Math.sqrt((momentum * SPEED_OF_LIGHT) ** 2 + restEnergy ** 2) - restEnergy;
}

/** Radius (m) at which a particle of kinetic energy E_k (J) circles in field B, relativistically. */
export function calculateRadiusForEnergy(
  chargeCoulombs: number, massKilograms: number, fieldTesla: number, kineticEnergyJoules: number,
): number {
  assertPositive(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  assertPositive(fieldTesla, "fieldTesla");
  assertPositive(kineticEnergyJoules, "kineticEnergyJoules");
  const restEnergy = massKilograms * SPEED_OF_LIGHT ** 2;
  const momentumTimesC = Math.sqrt(kineticEnergyJoules ** 2 + 2 * kineticEnergyJoules * restEnergy);
  return momentumTimesC / (SPEED_OF_LIGHT * chargeCoulombs * fieldTesla);
}

/** Lorentz factor for a particle of kinetic energy E_k. */
export function calculateLorentzFactor(massKilograms: number, kineticEnergyJoules: number): number {
  assertPositive(massKilograms, "massKilograms");
  assertNonNegative(kineticEnergyJoules, "kineticEnergyJoules");
  return 1 + kineticEnergyJoules / (massKilograms * SPEED_OF_LIGHT ** 2);
}

export const joulesToMegaelectronvolts = (joules: number) => joules / ELECTRON_VOLT / 1e6;
