import { describe, expect, it } from "vitest";
import { LANDING_ROUNDS, SAFE_TOUCHDOWN_SPEED, type LandingRound } from "../../src/features/games/moon-landing/moonLandingData";
import { evaluateLanding, moonLanding, runDescent } from "../../src/features/games/moon-landing/moonLandingModel";
import { LUNAR_GRAVITY } from "../../src/physics/core";

const [first, limited, fast] = LANDING_ROUNDS as [LandingRound, LandingRound, LandingRound];

describe("Moon Landing missions (worked by hand)", () => {
  it("mission 1: a hand calculation puts the ignition near 890 m", () => {
    // v² at ignition = 40² + 2 g (2000 − h); stopping needs v² = 2 a h with a = T/m − g (m ≈ 2000 → 2.88 m/s²).
    const a = 9000 / 2000 - LUNAR_GRAVITY;
    const h = (40 ** 2 + 2 * LUNAR_GRAVITY * 2000) / (2 * a + 2 * LUNAR_GRAVITY);

    expect(h).toBeGreaterThan(850);
    expect(h).toBeLessThan(930);
    expect(evaluateLanding(first, { ignitionAltitudeMeters: 888, throttle: 1 }).success).toBe(true);
  });

  it("mission 1: late ignition hits hard and early ignition drops from a stop", () => {
    const late = evaluateLanding(first, { ignitionAltitudeMeters: 700, throttle: 1 });
    const early = evaluateLanding(first, { ignitionAltitudeMeters: 1100, throttle: 1 });

    expect(late.success).toBe(false);
    expect(late.feedback).toMatch(/ignited too late/);
    expect(early.success).toBe(false);
    expect(early.feedback).toMatch(/ignited too early/);
    expect(late.descent.touchdownSpeedMetersPerSecond).toBeGreaterThan(SAFE_TOUCHDOWN_SPEED);
  });

  it("mission 2: full and 80% throttle both land within the fuel, but gentler burns run out", () => {
    expect(evaluateLanding(limited, { ignitionAltitudeMeters: 912, throttle: 1 }).success).toBe(true);
    expect(evaluateLanding(limited, { ignitionAltitudeMeters: 1138, throttle: 0.8 }).success).toBe(true);
    const gentle = evaluateLanding(limited, { ignitionAltitudeMeters: 1900, throttle: 0.5 });
    expect(gentle.success).toBe(false);
    expect(gentle.feedback).toMatch(/propellant ran out/);
  });

  it("mission 2: a gentler burn uses more propellant than full thrust", () => {
    const full = evaluateLanding(limited, { ignitionAltitudeMeters: 912, throttle: 1 }).descent.fuelUsedKilograms;
    const soft = evaluateLanding(limited, { ignitionAltitudeMeters: 1138, throttle: 0.8 }).descent.fuelUsedKilograms;
    expect(soft).toBeGreaterThan(full);
  });

  it("mission 3: needs a nearly full-power burn at the right height", () => {
    expect(evaluateLanding(fast, { ignitionAltitudeMeters: 1677, throttle: 1 }).success).toBe(true);
    expect(evaluateLanding(fast, { ignitionAltitudeMeters: 1861, throttle: 0.9 }).success).toBe(true);
    expect(evaluateLanding(fast, { ignitionAltitudeMeters: 2395, throttle: 0.7 }).success).toBe(false);
    expect(evaluateLanding(fast, { ignitionAltitudeMeters: 1000, throttle: 1 }).success).toBe(false);
  });

  it("predicts fuel use, which follows ṁ t = T t / (Isp g₀)", () => {
    const outcome = evaluateLanding(first, { ignitionAltitudeMeters: 888, throttle: 1 });
    const { descent } = outcome;
    const burn = (descent.cutoffTimeSeconds ?? descent.samples.at(-1)!.timeSeconds) - (descent.ignitionTimeSeconds as number);

    expect(outcome.predictionActual).toBeCloseTo(descent.fuelUsedKilograms, 10);
    expect(outcome.predictionActual).toBeCloseTo((9000 * burn) / (311 * 9.80665), 1);
    expect(outcome.predictionActual).toBeGreaterThan(60);
    expect(outcome.predictionActual).toBeLessThan(85);
  });

  it("gives more accuracy credit to a softer touchdown", () => {
    const soft = evaluateLanding(first, { ignitionAltitudeMeters: 889, throttle: 1 });
    const hard = evaluateLanding(first, { ignitionAltitudeMeters: 885, throttle: 1 });
    expect(soft.success && hard.success).toBe(true);
    expect(soft.accuracyFraction).toBeGreaterThan(hard.accuracyFraction);
  });
});

describe("controls and saved state", () => {
  it("validates ignition altitude and throttle", () => {
    expect(() => runDescent(first, { ignitionAltitudeMeters: 50, throttle: 1 })).toThrow(/Ignition altitude/);
    expect(() => runDescent(limited, { ignitionAltitudeMeters: 900, throttle: 0.2 })).toThrow(/Throttle/);
  });

  it("round-trips and rejects corrupt saved controls", () => {
    expect(moonLanding.parseControl({ ignitionAltitudeMeters: 900, throttle: 1 }, first)).toEqual({ ignitionAltitudeMeters: 900, throttle: 1 });
    expect(moonLanding.parseControl({ ignitionAltitudeMeters: 900, throttle: 0.5 }, first)).toBeNull();
    expect(moonLanding.parseControl("x", first)).toBeNull();
  });

  it("rise in difficulty", () => {
    expect(LANDING_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});
