import { VACUUM_PERMEABILITY, assertNonNegative, assertPositive } from "../core";

/**
 * Magnetic fields of a long straight wire and of a long solenoid.
 *
 * A long straight wire carrying current I produces a field that circles it with magnitude B = μ₀ I / (2π r) at
 * distance r, falling off as 1/r. Inside a long solenoid with n turns per meter the field is nearly uniform with
 * B = μ₀ n I. With an iron core the field is multiplied by the relative permeability μ_r (up to saturation).
 * For scale, Earth's field at the surface is about 25–65 µT.
 *
 * Limitations: infinitely long wire and solenoid (valid when the distance is much less than the length), a vacuum or
 * air core unless a relative permeability is given, no saturation in these helper functions, and steady currents.
 */
export const EARTH_FIELD_TESLA = 50e-6;

export function calculateWireField(currentAmperes: number, distanceMeters: number): number {
  assertNonNegative(currentAmperes, "currentAmperes");
  assertPositive(distanceMeters, "distanceMeters");
  return (VACUUM_PERMEABILITY * currentAmperes) / (2 * Math.PI * distanceMeters);
}

export function calculateLongSolenoidField(turnsPerMeter: number, currentAmperes: number, relativePermeability = 1): number {
  assertPositive(turnsPerMeter, "turnsPerMeter");
  assertNonNegative(currentAmperes, "currentAmperes");
  assertPositive(relativePermeability, "relativePermeability");
  return VACUUM_PERMEABILITY * relativePermeability * turnsPerMeter * currentAmperes;
}

/** Distance at which a wire's field falls to `fieldTesla`. */
export function calculateWireDistanceForField(currentAmperes: number, fieldTesla: number): number {
  assertPositive(currentAmperes, "currentAmperes");
  assertPositive(fieldTesla, "fieldTesla");
  return (VACUUM_PERMEABILITY * currentAmperes) / (2 * Math.PI * fieldTesla);
}
