import { describe, expect, it } from "vitest";
import { STANDARD_GRAVITY } from "../../src/physics/core";
import {
  calculateMassFlowRate,
  calculateRocketDeltaV,
  simulateVerticalDescent,
  type DescentParameters,
} from "../../src/physics/mechanics";

const lander: DescentParameters = {
  gravityMetersPerSecondSquared: 1.62,
  dryMassKilograms: 1500,
  fuelMassKilograms: 500,
  maximumThrustNewtons: 9000,
  specificImpulseSeconds: 311,
  initialAltitudeMeters: 2000,
  initialVelocityMetersPerSecond: -40,
  ignitionAltitudeMeters: 0, // never burns before touchdown
  throttle: 1,
};

describe("rocket equation", () => {
  it("gives Δv = Isp g₀ ln(m₀/m₁) (textbook: Isp 300 s, mass ratio e → 2,942 m/s)", () => {
    expect(calculateRocketDeltaV(300, Math.E, 1)).toBeCloseTo(300 * STANDARD_GRAVITY, 8);
  });

  it("is zero with no propellant used and rejects impossible masses", () => {
    expect(calculateRocketDeltaV(300, 1000, 1000)).toBe(0);
    expect(() => calculateRocketDeltaV(300, 500, 1000)).toThrow(RangeError);
    expect(() => calculateRocketDeltaV(0, 1000, 500)).toThrow(RangeError);
  });

  it("gives mass flow ṁ = T/(Isp g₀)", () => {
    expect(calculateMassFlowRate(9000, 311)).toBeCloseTo(9000 / (311 * STANDARD_GRAVITY), 10);
    expect(calculateMassFlowRate(0, 311)).toBe(0);
  });
});

describe("free fall (no burn)", () => {
  it("matches v² = v₀² + 2 g h and t from the quadratic", () => {
    const result = simulateVerticalDescent(lander);
    const analyticSpeed = Math.sqrt(40 ** 2 + 2 * 1.62 * 2000);
    // h(t) = h₀ − v₀t − ½gt², with downward v₀ = 40
    const analyticTime = (-40 + analyticSpeed) / 1.62;

    expect(result.end).toBe("touchdown");
    expect(result.touchdownSpeedMetersPerSecond).toBeCloseTo(analyticSpeed, 2);
    expect(result.samples.at(-1)?.timeSeconds).toBeCloseTo(analyticTime, 2);
    expect(result.fuelUsedKilograms).toBe(0);
    expect(result.ignitionTimeSeconds).toBeNull();
  });
});

describe("powered descent", () => {
  it("ignites at the chosen altitude with the free-fall speed there", () => {
    const result = simulateVerticalDescent({ ...lander, ignitionAltitudeMeters: 900 });
    const expected = Math.sqrt(40 ** 2 + 2 * 1.62 * (2000 - 900));

    expect(result.ignitionSpeedMetersPerSecond).toBeCloseTo(expected, 1);
    expect(result.ignitionTimeSeconds).toBeGreaterThan(0);
  });

  it("lands softly when ignition is timed so the burn ends at the surface", () => {
    // Constant-acceleration estimate: decel a = T/m − g ≈ 9000/1950 − 1.62; solve the ignition altitude by bisection.
    let low = 100;
    let high = 1900;
    for (let i = 0; i < 40; i += 1) {
      const mid = (low + high) / 2;
      const result = simulateVerticalDescent({ ...lander, ignitionAltitudeMeters: mid });
      if (result.touchdownSpeedMetersPerSecond > 0.5 && result.cutoffTimeSeconds === null) {
        low = mid; // still hits too fast: start burning earlier
      } else {
        high = mid;
      }
    }
    const soft = simulateVerticalDescent({ ...lander, ignitionAltitudeMeters: high });
    expect(soft.end).toBe("touchdown");
    expect(soft.touchdownSpeedMetersPerSecond).toBeLessThan(2);
  });

  it("burns later than needed and hits hard; burns earlier and cuts off then drops", () => {
    const late = simulateVerticalDescent({ ...lander, ignitionAltitudeMeters: 300 });
    expect(late.touchdownSpeedMetersPerSecond).toBeGreaterThan(20);

    const early = simulateVerticalDescent({ ...lander, ignitionAltitudeMeters: 1900 });
    expect(early.cutoffTimeSeconds).not.toBeNull(); // engine stops when the lander stops
    expect(early.touchdownSpeedMetersPerSecond).toBeGreaterThan(5);
  });

  it("uses fuel at the rate T / (Isp g₀) while the engine burns", () => {
    const result = simulateVerticalDescent({ ...lander, ignitionAltitudeMeters: 900 });
    const burnTime = ((result.cutoffTimeSeconds ?? result.samples.at(-1)!.timeSeconds) - (result.ignitionTimeSeconds as number));
    expect(result.fuelUsedKilograms).toBeCloseTo(9000 * burnTime / (311 * STANDARD_GRAVITY), 1);
  });

  it("satisfies the rocket equation in zero gravity (burn to rest)", () => {
    const result = simulateVerticalDescent({
      ...lander,
      gravityMetersPerSecondSquared: 0,
      initialAltitudeMeters: 1e6,
      initialVelocityMetersPerSecond: -100,
      ignitionAltitudeMeters: 1e6,
      maximumTimeSeconds: 200,
    });
    const initialMass = 2000;
    const finalMass = initialMass - result.fuelUsedKilograms;

    expect(calculateRocketDeltaV(311, initialMass, finalMass)).toBeCloseTo(100, 1);
    expect(result.cutoffTimeSeconds).not.toBeNull();
  });

  it("runs out of fuel and reports it", () => {
    const result = simulateVerticalDescent({ ...lander, fuelMassKilograms: 5, ignitionAltitudeMeters: 1500 });
    expect(result.fuelExhausted).toBe(true);
    expect(result.fuelUsedKilograms).toBeCloseTo(5, 2);
    expect(result.touchdownSpeedMetersPerSecond).toBeGreaterThan(20);
  });

  it("converges as the time step shrinks (events are timed to one step)", () => {
    const speed = (dt: number) =>
      simulateVerticalDescent({ ...lander, ignitionAltitudeMeters: 900, timeStepSeconds: dt }).touchdownSpeedMetersPerSecond;
    const reference = speed(0.001);

    expect(Math.abs(speed(0.01) - reference)).toBeLessThan(Math.abs(speed(0.05) - reference));
    expect(Math.abs(speed(0.005) - reference)).toBeLessThan(0.2);
  });

  it("validates inputs", () => {
    expect(() => simulateVerticalDescent({ ...lander, throttle: 0 })).toThrow(/throttle/);
    expect(() => simulateVerticalDescent({ ...lander, throttle: 1.5 })).toThrow(RangeError);
    expect(() => simulateVerticalDescent({ ...lander, dryMassKilograms: 0 })).toThrow(RangeError);
    expect(() => simulateVerticalDescent({ ...lander, initialAltitudeMeters: -5 })).toThrow(RangeError);
  });
});
