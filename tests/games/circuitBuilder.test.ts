import { describe, expect, it } from "vitest";
import {
  CIRCUIT_BUILDER_ROUNDS,
  type CircuitRound,
} from "../../src/features/games/circuit-builder/circuitBuilderData";
import {
  addResistorToStage,
  evaluateCircuitAttempt,
  getTargetResistanceOhms,
  removeResistor,
  solveLayout,
  validateLayout,
} from "../../src/features/games/circuit-builder/circuitBuilderModel";

const [single, parallel, share] = CIRCUIT_BUILDER_ROUNDS as [
  CircuitRound,
  CircuitRound,
  CircuitRound,
];

describe("Circuit Builder rounds", () => {
  it("derive target resistance from the target current", () => {
    expect(getTargetResistanceOhms(single)).toBeCloseTo(300, 10);
    expect(getTargetResistanceOhms(parallel)).toBe(75);
  });

  it("have a reference solution that succeeds with full marks", () => {
    // Round 1: 100 Ω + 200 Ω in series. Inventory indexes 0 and 3.
    const first = evaluateCircuitAttempt(single, [[0], [3]], 0.03, 1);
    // Round 2: 100 Ω ∥ 300 Ω.
    const second = evaluateCircuitAttempt(parallel, [[0, 2]], 0.16, 1);
    // Round 3: (100 ∥ 100) + (100 ∥ 100).
    const third = evaluateCircuitAttempt(share, [[0, 1], [2, 3]], 0.12, 1);

    for (const result of [first, second, third]) {
      expect(result.outcome).toBe("success");
      expect(result.score).toBe(100);
    }
  });

  it("make the advanced round require power sharing", () => {
    const naive = evaluateCircuitAttempt(share, [[4, 5]], 0.12, 1); // 200 ∥ 200 = 100 Ω

    expect(naive.solution.equivalentResistanceOhms).toBeCloseTo(100, 10);
    expect(naive.outcome).toBe("overloaded");
    expect([...naive.overloadedResistors].sort()).toEqual([4, 5]);
    expect(naive.score).toBe(0);
  });
});

describe("evaluating a circuit", () => {
  it("reports an off-target circuit with no points", () => {
    const result = evaluateCircuitAttempt(single, [[0], [1]], 0.045, 1); // 200 Ω

    expect(result.outcome).toBe("off-target");
    expect(result.resistanceError).toBeCloseTo(1 / 3, 10);
    expect(result.solution.totalCurrentAmperes).toBeCloseTo(0.045, 12);
    expect(result.score).toBe(0);
  });

  it("scores the prediction against the measured current", () => {
    const close = evaluateCircuitAttempt(single, [[0], [3]], 0.033, 1);
    const wild = evaluateCircuitAttempt(single, [[0], [3]], 0.3, 1);

    expect(close.predictionPoints).toBeGreaterThan(0);
    expect(close.predictionPoints).toBeLessThan(20);
    expect(wild.predictionPoints).toBe(0);
    expect(wild.outcome).toBe("success");
  });

  it("awards fewer attempt points on later tries", () => {
    const points = [1, 2, 3].map(
      (attempt) =>
        evaluateCircuitAttempt(single, [[0], [3]], 0.03, attempt).attemptPoints,
    );
    expect(points).toEqual([20, 10, 0]);
  });

  it("accepts a resistor running exactly at its rating", () => {
    const edge: CircuitRound = {
      ...single,
      sourceVoltageVolts: 10,
      inventoryOhms: [100],
      powerRatingWatts: 1,
      target: { kind: "resistance", ohms: 100 },
    };
    expect(evaluateCircuitAttempt(edge, [[0]], 0.1, 1).outcome).toBe("success");
  });

  it("rejects invalid inputs", () => {
    expect(() => evaluateCircuitAttempt(single, [[0]], -1, 1)).toThrow(RangeError);
    expect(() => evaluateCircuitAttempt(single, [[0]], 0.03, 0)).toThrow(RangeError);
  });
});

describe("layout validation", () => {
  it("requires resistors, non-empty stages and known indexes", () => {
    expect(() => validateLayout(single, [])).toThrow(/at least one/);
    expect(() => validateLayout(single, [[0], []])).toThrow(/empty stages/);
    expect(() => validateLayout(single, [[9]])).toThrow(/not in the box/);
    expect(() => validateLayout(single, [[-1]])).toThrow(/not in the box/);
  });

  it("allows each resistor only once", () => {
    expect(() => validateLayout(single, [[0], [0]])).toThrow(/only once/);
  });

  it("limits stage and branch counts", () => {
    expect(() =>
      validateLayout(share, [[0], [1], [2], [3], [4]]),
    ).toThrow(/at most 4 stages/);
    expect(() =>
      validateLayout(share, [[0, 1, 2, 3, 4]]),
    ).toThrow(/at most 4 resistors/);
  });

  it("solves a valid layout", () => {
    expect(solveLayout(parallel, [[0, 2]]).equivalentResistanceOhms).toBeCloseTo(75, 10);
  });
});

describe("layout editing helpers", () => {
  it("adds to an existing stage without mutating the layout", () => {
    const layout = [[0]];
    const next = addResistorToStage(layout, 0, 2);

    expect(next).toEqual([[0, 2]]);
    expect(layout).toEqual([[0]]);
    expect(() => addResistorToStage(layout, 3, 1)).toThrow(RangeError);
  });

  it("removes a resistor and drops stages that become empty", () => {
    expect(removeResistor([[0], [1, 2]], 0)).toEqual([[1, 2]]);
    expect(removeResistor([[0], [1, 2]], 2)).toEqual([[0], [1]]);
  });
});
