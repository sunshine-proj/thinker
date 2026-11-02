import { assertNonNegative, assertPositive } from "../core";

/**
 * Heat engines and refrigerators between two reservoirs (absolute temperatures in kelvin).
 *
 * First law: Q_h = W + Q_c for an engine. Second law: no engine can exceed the Carnot efficiency
 * η_C = 1 − T_c/T_h, and the total entropy change ΔS = Q_c/T_c − Q_h/T_h is never negative
 * (zero only for a reversible engine). A refrigerator moves heat Q_c out of the cold space using work W:
 * COP = Q_c/W, at most Carnot's COP_C = T_c/(T_h − T_c).
 * Real machines are modelled as a fixed fraction of the Carnot limit.
 *
 * Limitations: steady operation between two constant-temperature reservoirs, no heat leaks inside the
 * machine, and a constant fraction of Carnot performance.
 */
export function calculateCarnotEfficiency(hotKelvin: number, coldKelvin: number): number {
  assertPositive(coldKelvin, "coldKelvin");
  if (hotKelvin <= coldKelvin) {
    throw new RangeError("The hot reservoir must be hotter than the cold reservoir.");
  }
  return 1 - coldKelvin / hotKelvin;
}

export interface EngineState {
  readonly carnotEfficiency: number;
  readonly efficiency: number;
  readonly workWatts: number;
  readonly rejectedHeatWatts: number;
  /** Entropy produced per second, W/K (≥ 0). */
  readonly entropyProductionWattsPerKelvin: number;
}

export function calculateEngine(hotKelvin: number, coldKelvin: number, heatInputWatts: number, carnotFraction: number): EngineState {
  assertPositive(heatInputWatts, "heatInputWatts");
  if (carnotFraction <= 0 || carnotFraction > 1) {
    throw new RangeError("carnotFraction must be greater than 0 and at most 1.");
  }
  const carnot = calculateCarnotEfficiency(hotKelvin, coldKelvin);
  const efficiency = carnotFraction * carnot;
  const work = efficiency * heatInputWatts;
  const rejected = heatInputWatts - work;
  return {
    carnotEfficiency: carnot, efficiency, workWatts: work, rejectedHeatWatts: rejected,
    entropyProductionWattsPerKelvin: rejected / coldKelvin - heatInputWatts / hotKelvin,
  };
}

export function calculateCarnotCop(coldKelvin: number, hotKelvin: number): number {
  assertPositive(coldKelvin, "coldKelvin");
  if (hotKelvin <= coldKelvin) {
    throw new RangeError("The hot side must be warmer than the cold space.");
  }
  return coldKelvin / (hotKelvin - coldKelvin);
}

export interface FridgeSteadyState {
  readonly coldKelvin: number;
  readonly cop: number;
  readonly carnotCop: number;
  readonly coolingWatts: number;
  readonly heatRejectedWatts: number;
}

/**
 * Temperature the cold space settles at. Heat leaks in at U (T_h − T_c); the machine removes
 * f · COP_C · W = f W T_c/(T_h − T_c). Equating gives the quadratic
 * U x² − (2U T_h + f W) x + U T_h² = 0, whose root below T_h is returned.
 */
export function calculateFridgeSteadyState(
  roomKelvin: number, leakWattsPerKelvin: number, carnotFraction: number, compressorWatts: number,
): FridgeSteadyState {
  assertPositive(roomKelvin, "roomKelvin");
  assertPositive(leakWattsPerKelvin, "leakWattsPerKelvin");
  assertNonNegative(compressorWatts, "compressorWatts");
  if (carnotFraction <= 0 || carnotFraction > 1) {
    throw new RangeError("carnotFraction must be greater than 0 and at most 1.");
  }
  const U = leakWattsPerKelvin;
  const b = 2 * U * roomKelvin + carnotFraction * compressorWatts;
  const discriminant = b * b - 4 * U * U * roomKelvin ** 2;
  const cold = (b - Math.sqrt(Math.max(0, discriminant))) / (2 * U);
  if (roomKelvin - cold < 1e-9) {
    // No compressor power: the space stays at room temperature and nothing is moved.
    return { coldKelvin: roomKelvin, cop: 0, carnotCop: Number.POSITIVE_INFINITY, coolingWatts: 0, heatRejectedWatts: 0 };
  }
  const carnotCop = calculateCarnotCop(cold, roomKelvin);
  const cooling = U * (roomKelvin - cold);
  return {
    coldKelvin: cold, cop: carnotFraction * carnotCop, carnotCop, coolingWatts: cooling,
    heatRejectedWatts: cooling + compressorWatts,
  };
}
