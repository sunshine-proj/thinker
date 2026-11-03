import { ELEMENTARY_CHARGE, ELECTRON_MASS, PROTON_MASS, SPEED_OF_LIGHT, assertPositive } from "../core";

/**
 * Charged particles in a uniform magnetic field perpendicular to their velocity.
 *
 * The magnetic force qvB bends the path into a circle of radius r = p/(qB), where p = γmv is the relativistic
 * momentum. So a measured radius gives the momentum, p = qBr, and the kinetic energy follows from
 * E² = (pc)² + (mc²)²: T = √((pc)² + (mc²)²) − mc². Particles with larger charge-to-mass ratio bend more tightly.
 *
 * Limitations: uniform field, no energy loss to the medium (real tracks spiral inward), and no electric field.
 */
export function calculateGyroradius(massKg: number, chargeCoulombs: number, speed: number, fieldTesla: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(Math.abs(chargeCoulombs), "chargeCoulombs");
  assertPositive(speed, "speed");
  assertPositive(fieldTesla, "fieldTesla");
  if (speed >= SPEED_OF_LIGHT) {
    throw new RangeError("The speed must be below the speed of light.");
  }
  const gamma = 1 / Math.sqrt(1 - (speed / SPEED_OF_LIGHT) ** 2);
  return (gamma * massKg * speed) / (Math.abs(chargeCoulombs) * fieldTesla);
}

export function calculateMomentumFromRadius(chargeCoulombs: number, fieldTesla: number, radiusMeters: number): number {
  assertPositive(Math.abs(chargeCoulombs), "chargeCoulombs");
  assertPositive(fieldTesla, "fieldTesla");
  assertPositive(radiusMeters, "radiusMeters");
  return Math.abs(chargeCoulombs) * fieldTesla * radiusMeters;
}

/** Kinetic energy in MeV from momentum in kg·m/s and rest energy in MeV (relativistic). */
export function calculateKineticEnergyMeV(momentum: number, restEnergyMeV: number): number {
  assertPositive(momentum, "momentum");
  assertPositive(restEnergyMeV, "restEnergyMeV");
  const pcMeV = (momentum * SPEED_OF_LIGHT) / ELEMENTARY_CHARGE / 1e6;
  return Math.sqrt(pcMeV ** 2 + restEnergyMeV ** 2) - restEnergyMeV;
}

/** Classical ½mv² = p²/2m kinetic energy in MeV, valid only for speeds far below c. */
export function calculateClassicalKineticEnergyMeV(momentum: number, massKg: number): number {
  assertPositive(momentum, "momentum");
  assertPositive(massKg, "massKg");
  return momentum ** 2 / (2 * massKg) / ELEMENTARY_CHARGE / 1e6;
}

export const ELECTRON_REST_ENERGY_MEV = (ELECTRON_MASS * SPEED_OF_LIGHT ** 2) / ELEMENTARY_CHARGE / 1e6;
export const PROTON_REST_ENERGY_MEV = (PROTON_MASS * SPEED_OF_LIGHT ** 2) / ELEMENTARY_CHARGE / 1e6;

/** Momentum in kg·m/s of a particle with kinetic energy `kineticEnergyMeV` and rest energy `restEnergyMeV`. */
export function calculateMomentumFromKineticEnergy(kineticEnergyMeV: number, restEnergyMeV: number): number {
  assertPositive(kineticEnergyMeV, "kineticEnergyMeV");
  assertPositive(restEnergyMeV, "restEnergyMeV");
  const total = kineticEnergyMeV + restEnergyMeV;
  const pcMeV = Math.sqrt(total ** 2 - restEnergyMeV ** 2);
  return (pcMeV * 1e6 * ELEMENTARY_CHARGE) / SPEED_OF_LIGHT;
}
