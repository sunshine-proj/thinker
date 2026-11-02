import {
  assertFiniteNumber,
  assertPositive,
} from "../core";

/**
 * Steady-state DC analysis of series-parallel resistor networks.
 *
 * Model: an ideal voltage source (no internal resistance) drives a chain of
 * stages connected in series; each stage is a bank of resistors connected in
 * parallel. Wires have zero resistance and resistors are ohmic (V = I R,
 * independent of temperature). Units: volts (V), amperes (A), ohms (Ω),
 * watts (W).
 *
 * Limitations: no capacitors/inductors (no transients), no non-ohmic parts,
 * no internal source resistance, and resistor heating is reported but does not
 * change resistance.
 */

/** Resistances (Ω) of the resistors in each series stage; a stage's resistors are in parallel. */
export type SeriesParallelCircuit = readonly (readonly number[])[];

export interface ResistorReading {
  readonly stageIndex: number;
  readonly resistanceOhms: number;
  readonly voltageVolts: number;
  readonly currentAmperes: number;
  readonly powerWatts: number;
}

export interface CircuitSolution {
  readonly sourceVoltageVolts: number;
  readonly equivalentResistanceOhms: number;
  readonly totalCurrentAmperes: number;
  readonly totalPowerWatts: number;
  /** Voltage across each stage, in order. */
  readonly stageVoltagesVolts: readonly number[];
  readonly resistors: readonly ResistorReading[];
}

/** Ohm's law: I = V / R. */
export function calculateCurrent(
  voltageVolts: number,
  resistanceOhms: number,
): number {
  assertFiniteNumber(voltageVolts, "voltageVolts");
  assertPositive(resistanceOhms, "resistanceOhms");
  return voltageVolts / resistanceOhms;
}

/** Ohm's law: V = I R. */
export function calculateVoltage(
  currentAmperes: number,
  resistanceOhms: number,
): number {
  assertFiniteNumber(currentAmperes, "currentAmperes");
  assertPositive(resistanceOhms, "resistanceOhms");
  return currentAmperes * resistanceOhms;
}

/** Ohm's law: R = V / I. */
export function calculateResistance(
  voltageVolts: number,
  currentAmperes: number,
): number {
  assertFiniteNumber(voltageVolts, "voltageVolts");
  assertPositive(currentAmperes, "currentAmperes");
  return voltageVolts / currentAmperes;
}

/** Electrical power: P = V I. */
export function calculatePower(
  voltageVolts: number,
  currentAmperes: number,
): number {
  assertFiniteNumber(voltageVolts, "voltageVolts");
  assertFiniteNumber(currentAmperes, "currentAmperes");
  return voltageVolts * currentAmperes;
}

function assertResistances(resistances: readonly number[]): void {
  if (resistances.length === 0) {
    throw new RangeError("At least one resistor is required.");
  }
  resistances.forEach((resistance) =>
    assertPositive(resistance, "resistanceOhms"),
  );
}

/** Resistors in series: R = R₁ + R₂ + … */
export function calculateSeriesResistance(
  resistancesOhms: readonly number[],
): number {
  assertResistances(resistancesOhms);
  return resistancesOhms.reduce((total, resistance) => total + resistance, 0);
}

/** Resistors in parallel: 1/R = 1/R₁ + 1/R₂ + … */
export function calculateParallelResistance(
  resistancesOhms: readonly number[],
): number {
  assertResistances(resistancesOhms);
  return (
    1 /
    resistancesOhms.reduce((total, resistance) => total + 1 / resistance, 0)
  );
}

/**
 * Solves currents, voltages, and power for a series chain of parallel banks.
 * The same current flows through every stage; within a stage every resistor
 * sees the stage voltage.
 */
export function solveSeriesParallelCircuit(
  sourceVoltageVolts: number,
  stages: SeriesParallelCircuit,
): CircuitSolution {
  assertPositive(sourceVoltageVolts, "sourceVoltageVolts");
  if (stages.length === 0) {
    throw new RangeError("At least one stage is required.");
  }

  const stageResistances = stages.map((stage) =>
    calculateParallelResistance(stage),
  );
  const equivalentResistanceOhms = calculateSeriesResistance(stageResistances);
  const totalCurrentAmperes = calculateCurrent(
    sourceVoltageVolts,
    equivalentResistanceOhms,
  );
  const stageVoltagesVolts = stageResistances.map((resistance) =>
    calculateVoltage(totalCurrentAmperes, resistance),
  );
  const resistors = stages.flatMap((stage, stageIndex) =>
    stage.map((resistanceOhms) => {
      const voltageVolts = stageVoltagesVolts[stageIndex] as number;
      const currentAmperes = calculateCurrent(voltageVolts, resistanceOhms);
      return {
        stageIndex,
        resistanceOhms,
        voltageVolts,
        currentAmperes,
        powerWatts: calculatePower(voltageVolts, currentAmperes),
      };
    }),
  );

  return {
    sourceVoltageVolts,
    equivalentResistanceOhms,
    totalCurrentAmperes,
    totalPowerWatts: calculatePower(sourceVoltageVolts, totalCurrentAmperes),
    stageVoltagesVolts,
    resistors,
  };
}
