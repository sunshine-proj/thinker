import { describe, expect, it } from "vitest";
import { STANDARD_GRAVITY as g } from "../../src/physics/core";
import {
  calculateBottomGForce,
  calculateDragForce,
  calculateMinimumLoopTopSpeed,
  calculateSpeedSquared,
  calculateTerminalSpeed,
  calculateTopGForce,
  simulateParachuteFall,
} from "../../src/physics/mechanics";

describe("drag and terminal speed", () => {
  it("balances weight at terminal speed", () => {
    const vt = calculateTerminalSpeed(80, 0.7);
    expect(calculateDragForce(1.225, 1, 0.7, vt)).toBeCloseTo(80 * g, 6);
    expect(vt).toBeCloseTo(42.8, 0);
  });

  it("scales as 1/√(drag area): quadrupling the canopy halves the speed", () => {
    expect(calculateTerminalSpeed(80, 4) / calculateTerminalSpeed(80, 16)).toBeCloseTo(2, 10);
  });

  it("gives 5.5 m/s for an 80 kg jumper under a 6 m round canopy (Cd = 1.5)", () => {
    const area = Math.PI * 3 ** 2 * 1.5;
    expect(calculateTerminalSpeed(80, area)).toBeCloseTo(5.5, 1);
  });

  it("rejects non-physical inputs", () => {
    expect(() => calculateTerminalSpeed(0, 1)).toThrow(RangeError);
    expect(() => calculateTerminalSpeed(80, 0)).toThrow(RangeError);
    expect(() => calculateDragForce(0, 1, 1, 5)).toThrow(RangeError);
  });
});

describe("parachute fall simulation", () => {
  const base = { massKilograms: 80, bodyDragAreaSquareMeters: 0.7, canopyDragAreaSquareMeters: 42.4, initialAltitudeMeters: 2000, deployAltitudeMeters: 0 };

  it("matches the exact solution u = v_t tanh(g t / v_t) from rest", () => {
    const run = simulateParachuteFall({ ...base, timeStepSeconds: 0.01 });
    const vt = calculateTerminalSpeed(80, 0.7);
    const sample = run.samples.find((s) => s.timeSeconds >= 10) as { timeSeconds: number; downwardSpeedMetersPerSecond: number };
    expect(sample.downwardSpeedMetersPerSecond).toBeCloseTo(vt * Math.tanh((g * sample.timeSeconds) / vt), 3);
  });

  it("reaches the terminal speed of the canopy when opened early enough", () => {
    const run = simulateParachuteFall({ ...base, deployAltitudeMeters: 1500 });
    expect(run.touchdownSpeedMetersPerSecond).toBeCloseTo(calculateTerminalSpeed(80, 42.4), 2);
    expect(run.deploymentTimeSeconds).not.toBeNull();
  });

  it("lands hard when the canopy opens too low", () => {
    const high = simulateParachuteFall({ ...base, deployAltitudeMeters: 600 });
    const low = simulateParachuteFall({ ...base, deployAltitudeMeters: 2 });
    expect(low.touchdownSpeedMetersPerSecond).toBeGreaterThan(high.touchdownSpeedMetersPerSecond + 10);
    expect(low.totalTimeSeconds).toBeLessThan(high.totalTimeSeconds);
  });

  it("converges with the time step", () => {
    const fine = simulateParachuteFall({ ...base, deployAltitudeMeters: 600, timeStepSeconds: 0.002 });
    const coarse = simulateParachuteFall({ ...base, deployAltitudeMeters: 600, timeStepSeconds: 0.02 });
    expect(Math.abs(fine.touchdownSpeedMetersPerSecond - coarse.touchdownSpeedMetersPerSecond)).toBeLessThan(0.1);
  });

  it("validates inputs", () => {
    expect(() => simulateParachuteFall({ ...base, massKilograms: 0 })).toThrow(RangeError);
    expect(() => simulateParachuteFall({ ...base, initialAltitudeMeters: -1 })).toThrow(RangeError);
  });
});

describe("roller coaster energy", () => {
  it("gives v² = 2gh at the bottom of a frictionless drop", () => {
    expect(calculateSpeedSquared(0, 25, 0)).toBeCloseTo(2 * g * 25, 10);
  });

  it("loses speed to friction: μ g s per kilogram", () => {
    const frictionless = calculateSpeedSquared(0, 30, 0);
    const lossy = calculateSpeedSquared(0, 30, 0, 0.02, 150);
    expect(frictionless - lossy).toBeCloseTo(2 * 0.02 * g * 150, 8);
  });

  it("needs a start height of 2.5R to just clear a loop of radius R (frictionless)", () => {
    const R = 10;
    const top = calculateSpeedSquared(0, 25, 2 * R);
    expect(Math.sqrt(top)).toBeCloseTo(calculateMinimumLoopTopSpeed(R), 8);
    expect(calculateTopGForce(Math.sqrt(top), R)).toBeCloseTo(0, 8);
  });

  it("gives 6 g at the bottom of that loop and 1 g at rest", () => {
    expect(calculateBottomGForce(Math.sqrt(2 * g * 25), 10)).toBeCloseTo(6, 8);
    expect(calculateBottomGForce(0, 10)).toBe(1);
  });

  it("makes the top g-force negative when the car is too slow", () => {
    expect(calculateTopGForce(5, 10)).toBeLessThan(0);
  });

  it("rejects non-physical inputs", () => {
    expect(() => calculateMinimumLoopTopSpeed(0)).toThrow(RangeError);
    expect(() => calculateBottomGForce(-1, 10)).toThrow(RangeError);
    expect(() => calculateSpeedSquared(0, 10, 0, -0.1)).toThrow(RangeError);
  });
});
