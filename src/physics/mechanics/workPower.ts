import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * Work, power and efficiency for lifting.
 *
 * Lifting mass m by height h takes work W = m g h; at steady speed v the power is
 * P = F v = m g v. A motor of efficiency η draws P/η. A counterweight of mass m_c on
 * the other side of the pulley reduces the net mass the motor must lift to m − m_c
 * (or the motor must hold it back when the counterweight is heavier).
 *
 * Inputs SI. Assumptions: steady speed (acceleration phases ignored), ideal pulleys and
 * cables, constant efficiency. Limitations: no friction in guides, no regenerative braking.
 */

/** Work (J) to lift a mass through a height. */
export function calculateLiftingWork(massKg: number, heightMeters: number, gravity = STANDARD_GRAVITY): number {
  assertNonNegative(massKg, "massKg");
  assertNonNegative(heightMeters, "heightMeters");
  return massKg * gravity * heightMeters;
}

/** Mechanical power (W) to lift a net mass at a steady speed. */
export function calculateLiftingPower(netMassKg: number, speed: number, gravity = STANDARD_GRAVITY): number {
  assertNonNegative(speed, "speed");
  return Math.abs(netMassKg) * gravity * speed;
}

/** Electrical power (W) a motor of efficiency η draws for a mechanical output. */
export function calculateInputPower(outputWatts: number, efficiency: number): number {
  assertNonNegative(outputWatts, "outputWatts");
  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new RangeError("The efficiency must be in (0, 1].");
  }
  return outputWatts / efficiency;
}

/** Time (s) to do an amount of work at a given power. */
export function calculateTimeForWork(workJoules: number, powerWatts: number): number {
  assertNonNegative(workJoules, "workJoules");
  assertPositive(powerWatts, "powerWatts");
  return workJoules / powerWatts;
}
