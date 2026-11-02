import { describe, expect, it } from "vitest";
import {
  calculateCurrent,
  calculateParallelResistance,
  calculatePower,
  calculateResistance,
  calculateSeriesResistance,
  calculateVoltage,
  solveSeriesParallelCircuit,
} from "../../src/physics/electromagnetism";

describe("Ohm's law and power", () => {
  it("relates voltage, current and resistance consistently", () => {
    expect(calculateCurrent(9, 300)).toBeCloseTo(0.03, 12);
    expect(calculateVoltage(0.03, 300)).toBeCloseTo(9, 12);
    expect(calculateResistance(9, 0.03)).toBeCloseTo(300, 10);
    expect(calculatePower(9, 0.03)).toBeCloseTo(0.27, 12);
  });

  it("rejects non-physical inputs", () => {
    expect(() => calculateCurrent(9, 0)).toThrow(RangeError);
    expect(() => calculateCurrent(9, -5)).toThrow(RangeError);
    expect(() => calculateCurrent(Number.NaN, 5)).toThrow(RangeError);
    expect(() => calculateResistance(9, 0)).toThrow(RangeError);
  });
});

describe("combining resistors", () => {
  it("adds series resistances", () => {
    expect(calculateSeriesResistance([100, 200, 300])).toBe(600);
  });

  it("combines parallel resistances by reciprocals", () => {
    expect(calculateParallelResistance([100, 300])).toBeCloseTo(75, 10);
    expect(calculateParallelResistance([200, 200])).toBeCloseTo(100, 10);
    expect(calculateParallelResistance([50])).toBe(50);
  });

  it("makes a parallel bank smaller than its smallest resistor", () => {
    expect(calculateParallelResistance([100, 1_000_000])).toBeLessThan(100);
  });

  it("requires at least one positive resistor", () => {
    expect(() => calculateSeriesResistance([])).toThrow(RangeError);
    expect(() => calculateParallelResistance([100, 0])).toThrow(RangeError);
  });
});

describe("series-parallel solutions", () => {
  it("shares current in series and voltage in parallel", () => {
    const solution = solveSeriesParallelCircuit(12, [[100, 100], [100, 100]]);

    expect(solution.equivalentResistanceOhms).toBeCloseTo(100, 10);
    expect(solution.totalCurrentAmperes).toBeCloseTo(0.12, 12);
    expect(solution.stageVoltagesVolts[0]).toBeCloseTo(6, 10);
    expect(solution.resistors.every((r) => Math.abs(r.currentAmperes - 0.06) < 1e-12))
      .toBe(true);
    expect(solution.resistors[0]?.powerWatts).toBeCloseTo(0.36, 10);
  });

  it("conserves energy: source power equals total resistor power", () => {
    const solution = solveSeriesParallelCircuit(9.7, [[220, 470], [330], [100, 150, 680]]);
    const dissipated = solution.resistors.reduce((t, r) => t + r.powerWatts, 0);

    expect(dissipated).toBeCloseTo(solution.totalPowerWatts, 10);
  });

  it("obeys Kirchhoff's laws", () => {
    const solution = solveSeriesParallelCircuit(10, [[100, 300], [50]]);
    const stage0 = solution.resistors.filter((r) => r.stageIndex === 0);

    // Junction rule: branch currents add to the total.
    expect(stage0.reduce((t, r) => t + r.currentAmperes, 0)).toBeCloseTo(
      solution.totalCurrentAmperes,
      12,
    );
    // Loop rule: stage voltages add to the source voltage.
    expect(solution.stageVoltagesVolts.reduce((t, v) => t + v, 0)).toBeCloseTo(
      10,
      10,
    );
  });

  it("matches a single resistor", () => {
    const solution = solveSeriesParallelCircuit(5, [[250]]);
    expect(solution.totalCurrentAmperes).toBeCloseTo(0.02, 12);
  });

  it("validates the source and the stages", () => {
    expect(() => solveSeriesParallelCircuit(0, [[100]])).toThrow(RangeError);
    expect(() => solveSeriesParallelCircuit(5, [])).toThrow(RangeError);
    expect(() => solveSeriesParallelCircuit(5, [[]])).toThrow(RangeError);
  });
});
