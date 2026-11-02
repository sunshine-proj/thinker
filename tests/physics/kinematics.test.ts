import { describe, expect, it } from "vitest";
import {
  calculateDistanceAtTime,
  calculateSpeedAtTime,
  calculateStoppingDistance,
  calculateTimeToCoverDistance,
} from "../../src/physics/mechanics";

describe("constant acceleration from rest", () => {
  it("covers ½at² and reaches at (textbook: 3 m/s² for 4 s → 24 m, 12 m/s)", () => {
    expect(calculateDistanceAtTime(3, 4)).toBeCloseTo(24, 10);
    expect(calculateSpeedAtTime(3, 4)).toBeCloseTo(12, 10);
  });

  it("inverts: time to cover 400 m at 8 m/s² is 10 s", () => {
    expect(calculateTimeToCoverDistance(400, 8)).toBeCloseTo(10, 10);
    expect(calculateDistanceAtTime(8, calculateTimeToCoverDistance(400, 8))).toBeCloseTo(400, 8);
  });

  it("satisfies v² = 2ad at the finish", () => {
    const t = calculateTimeToCoverDistance(250, 5);
    expect(calculateSpeedAtTime(5, t) ** 2).toBeCloseTo(2 * 5 * 250, 6);
  });
});

describe("with a top speed", () => {
  it("accelerates, then cruises: t = d/v + v/(2a)", () => {
    // 1000 m, a = 12.9, vmax = 70: t = 1000/70 + 70/25.8
    expect(calculateTimeToCoverDistance(1000, 12.9, 70)).toBeCloseTo(1000 / 70 + 70 / 25.8, 10);
  });

  it("is continuous at the moment the top speed is reached", () => {
    const a = 5;
    const v = 20;
    const tTop = v / a;
    expect(calculateDistanceAtTime(a, tTop - 1e-9, v)).toBeCloseTo(calculateDistanceAtTime(a, tTop + 1e-9, v), 6);
    expect(calculateSpeedAtTime(a, 10, v)).toBe(20);
  });

  it("agrees between the distance and time formulas", () => {
    const t = calculateTimeToCoverDistance(1000, 8, 60);
    expect(calculateDistanceAtTime(8, t, 60)).toBeCloseTo(1000, 6);
  });

  it("ignores the cap for distances shorter than the acceleration phase", () => {
    expect(calculateTimeToCoverDistance(50, 5, 70)).toBeCloseTo(Math.sqrt(20), 10);
  });
});

describe("stopping distance", () => {
  it("is v²/(2a) (50 m/s at 8 m/s² → 156 m)", () => {
    expect(calculateStoppingDistance(50, 8)).toBeCloseTo(156.25, 10);
  });

  it("quadruples when the speed doubles and halves when the braking doubles", () => {
    expect(calculateStoppingDistance(40, 5) / calculateStoppingDistance(20, 5)).toBeCloseTo(4, 10);
    expect(calculateStoppingDistance(30, 10) / calculateStoppingDistance(30, 5)).toBeCloseTo(0.5, 10);
  });
});

describe("validation", () => {
  it("rejects non-physical inputs", () => {
    expect(() => calculateTimeToCoverDistance(0, 5)).toThrow(RangeError);
    expect(() => calculateTimeToCoverDistance(100, 0)).toThrow(RangeError);
    expect(() => calculateDistanceAtTime(5, -1)).toThrow(RangeError);
    expect(() => calculateStoppingDistance(-1, 5)).toThrow(RangeError);
    expect(() => calculateStoppingDistance(10, 0)).toThrow(RangeError);
  });
});
