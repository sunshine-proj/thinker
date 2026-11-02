import { describe, expect, it } from "vitest";
import { STANDARD_GRAVITY } from "../../src/physics/core";
import {
  calculateNetTorque,
  calculateSupportForce,
  calculateTorque,
  classifyBalance,
  createUniformBeamLoad,
  solveBalanceMass,
  solveBalancePosition,
} from "../../src/physics/mechanics";

const g = STANDARD_GRAVITY;

describe("torque about a pivot", () => {
  it("computes τ = m g x with clockwise positive", () => {
    expect(calculateTorque({ massKilograms: 2, positionMeters: 3 })).toBeCloseTo(
      6 * g,
      10,
    );
    expect(
      calculateTorque({ massKilograms: 2, positionMeters: -3 }),
    ).toBeCloseTo(-6 * g, 10);
  });

  it("gives zero torque at the pivot or for zero mass", () => {
    expect(calculateTorque({ massKilograms: 5, positionMeters: 0 })).toBe(0);
    expect(calculateTorque({ massKilograms: 0, positionMeters: 4 })).toBe(0);
  });

  it("scales linearly with gravity", () => {
    const load = { massKilograms: 3, positionMeters: 2 };
    expect(calculateTorque(load, 1.62)).toBeCloseTo(6 * 1.62, 10);
  });

  it("rejects invalid inputs", () => {
    expect(() =>
      calculateTorque({ massKilograms: -1, positionMeters: 1 }),
    ).toThrow(RangeError);
    expect(() =>
      calculateTorque({ massKilograms: 1, positionMeters: Number.NaN }),
    ).toThrow(RangeError);
    expect(() =>
      calculateTorque({ massKilograms: 1, positionMeters: 1 }, 0),
    ).toThrow(RangeError);
  });
});

describe("equilibrium", () => {
  it("balances the classic seesaw: 4 kg at 2 m needs 2 kg at 4 m", () => {
    const left = { massKilograms: 4, positionMeters: -2 };
    const position = solveBalancePosition([left], 2);

    expect(position).toBeCloseTo(4, 10);
    expect(
      calculateNetTorque([left, { massKilograms: 2, positionMeters: 4 }]),
    ).toBeCloseTo(0, 10);
  });

  it("solves the balancing mass for a fixed position", () => {
    const loads = [
      { massKilograms: 3, positionMeters: -2 },
      { massKilograms: 1, positionMeters: -1 },
    ];
    // Left torque magnitude: 7 kg·m; at 2.5 m the mass is 2.8 kg.
    expect(solveBalanceMass(loads, 2.5)).toBeCloseTo(2.8, 10);
  });

  it("includes an off-centre uniform beam as a load at its centre", () => {
    // Pivot 0.5 m left of the centre of a 3 kg beam: the beam pulls clockwise.
    const beam = createUniformBeamLoad(3, 0.5);
    const position = solveBalancePosition([beam], 1.5);

    expect(position).toBeCloseTo(-1, 10);
  });

  it("is independent of gravity when solving for position", () => {
    const loads = [{ massKilograms: 4, positionMeters: -2 }];
    expect(solveBalancePosition(loads, 2, 1.62)).toBeCloseTo(4, 10);
  });

  it("returns null when no balance exists", () => {
    const loads = [{ massKilograms: 4, positionMeters: -2 }];
    expect(solveBalancePosition(loads, 0)).toBeNull();
    expect(solveBalanceMass(loads, 0)).toBeNull();
    // A mass on the same (left) side cannot cancel a counter-clockwise torque.
    expect(solveBalanceMass(loads, -1)).toBeNull();
  });

  it("returns exactly zero position when nothing needs balancing", () => {
    expect(solveBalancePosition([], 2)).toBe(0);
  });
});

describe("support force and classification", () => {
  it("equals the total weight", () => {
    expect(
      calculateSupportForce([
        { massKilograms: 4, positionMeters: -2 },
        { massKilograms: 2, positionMeters: 4 },
      ]),
    ).toBeCloseTo(6 * g, 10);
  });

  it("classifies tilt direction and tolerance", () => {
    expect(classifyBalance(0.2, 0.5)).toBe("balanced");
    expect(classifyBalance(-0.5, 0.5)).toBe("balanced");
    expect(classifyBalance(3, 0.5)).toBe("clockwise");
    expect(classifyBalance(-3, 0.5)).toBe("counterclockwise");
    expect(() => classifyBalance(1, -1)).toThrow(RangeError);
  });
});
