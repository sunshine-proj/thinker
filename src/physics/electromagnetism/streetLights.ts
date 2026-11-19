import { assertPositive } from "../core";
import { calculateCurrent, calculateSeriesResistance } from "./circuit";

/**
 * Identical bulbs wired into streets: bulbs on one street are in series, and every street
 * is connected straight across the battery (the streets are in parallel). Each street
 * carries I = V / (n R); each bulb on it gets power P = I² R; the battery supplies the sum
 * of the street currents, which a fuse must allow.
 *
 * Assumptions: an ideal battery and wires, bulbs with a constant resistance (real
 * filaments change resistance as they heat up).
 */

export interface StreetReading {
  readonly bulbs: number;
  readonly currentAmperes: number;
  readonly bulbPowerWatts: number;
}

export interface CityReading {
  readonly streets: readonly StreetReading[];
  readonly totalCurrentAmperes: number;
}

/** Splits the bulbs into streets of `perStreet` bulbs (the last street takes what is left). */
export function wireCity(voltageVolts: number, bulbResistanceOhms: number, bulbCount: number, perStreet: number): CityReading {
  assertPositive(voltageVolts, "voltageVolts");
  assertPositive(bulbResistanceOhms, "bulbResistanceOhms");
  if (!Number.isInteger(bulbCount) || bulbCount < 1 || !Number.isInteger(perStreet) || perStreet < 1) {
    throw new RangeError("Use whole numbers of bulbs.");
  }
  const streets: StreetReading[] = [];
  for (let remaining = bulbCount; remaining > 0; remaining -= perStreet) {
    const bulbs = Math.min(perStreet, remaining);
    const current = calculateCurrent(voltageVolts, calculateSeriesResistance(Array.from({ length: bulbs }, () => bulbResistanceOhms)));
    streets.push({ bulbs, currentAmperes: current, bulbPowerWatts: current * current * bulbResistanceOhms });
  }
  return { streets, totalCurrentAmperes: streets.reduce((sum, street) => sum + street.currentAmperes, 0) };
}
