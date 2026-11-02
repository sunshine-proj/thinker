import { describe, expect, it } from "vitest";
import { HEAT_ROUNDS, type HeatRound } from "../../src/features/games/temperature-control/temperatureControlData";
import {
  buildRoom,
  evaluateHeating,
  temperatureControl,
  temperatureCurve,
} from "../../src/features/games/temperature-control/temperatureControlModel";

const [heater, insulation, frugal] = HEAT_ROUNDS as [HeatRound, HeatRound, HeatRound];

function* settings(round: HeatRound) {
  const stepsH = Math.round((round.heater.maximum - round.heater.minimum) / round.heater.step);
  const stepsI = Math.round((round.insulation.maximum - round.insulation.minimum) / round.insulation.step);
  for (let i = 0; i <= stepsH; i += 1) {
    for (let j = 0; j <= stepsI; j += 1) {
      yield {
        heaterWatts: round.heater.minimum + i * round.heater.step,
        insulationCentimeters: Number((round.insulation.minimum + j * round.insulation.step).toFixed(2)),
      };
    }
  }
}

describe("Temperature Control rounds (worked by hand)", () => {
  it("round 1: U = kA/d = 16 W/K, so 400 W holds 20 °C when it is −5 °C outside", () => {
    const outcome = evaluateHeating(heater, { heaterWatts: 400, insulationCentimeters: 10 });
    expect(outcome.conductanceWattsPerKelvin).toBeCloseTo(16, 10);
    expect(outcome.steadyStateCelsius).toBeCloseTo(20, 10);
    expect(outcome.riseAboveOutsideKelvin).toBeCloseTo(25, 10);
    expect(outcome.success).toBe(true);
    expect(outcome.accuracyFraction).toBeCloseTo(1, 8);
  });

  it("round 1: too little or too much power is explained with the heat balance", () => {
    const cold = evaluateHeating(heater, { heaterWatts: 300, insulationCentimeters: 10 });
    const hot = evaluateHeating(heater, { heaterWatts: 600, insulationCentimeters: 10 });
    expect(cold.success).toBe(false);
    expect(cold.feedback).toMatch(/too cold.*400 W/);
    expect(hot.feedback).toMatch(/too warm/);
  });

  it("round 2: d = kA/U = 0.04·40/12 = 13.3 cm with 300 W", () => {
    const outcome = evaluateHeating(insulation, { heaterWatts: 300, insulationCentimeters: 13.3 });
    expect(outcome.success).toBe(true);
    expect(outcome.steadyStateCelsius).toBeCloseTo(19.9, 0);
    expect(evaluateHeating(insulation, { heaterWatts: 300, insulationCentimeters: 8 }).success).toBe(false);
  });

  it("round 2: thicker insulation always makes the cabin warmer", () => {
    const temperature = (d: number) => evaluateHeating(insulation, { heaterWatts: 300, insulationCentimeters: d }).steadyStateCelsius;
    expect(temperature(10)).toBeLessThan(temperature(14));
    expect(temperature(14)).toBeLessThan(temperature(20));
  });

  it("round 3 has working designs, all within the power limit and warm-up time", () => {
    const working = [...settings(frugal)].filter((s) => evaluateHeating(frugal, s).success);
    expect(working.length).toBeGreaterThanOrEqual(5);
    for (const s of working) {
      expect(s.heaterWatts).toBeLessThanOrEqual(800);
      expect(s.insulationCentimeters).toBeGreaterThan(5.5);
      expect(s.insulationCentimeters).toBeLessThan(9);
    }
  });

  it("round 3: thick insulation holds the temperature but warms up too slowly", () => {
    const slow = evaluateHeating(frugal, { heaterWatts: 400, insulationCentimeters: 12 });
    expect(slow.steadyStateCelsius).toBeCloseTo(20, 0);
    expect(slow.success).toBe(false);
    expect(slow.feedback).toMatch(/takes .* h to reach 18 °C/);
  });

  it("round 3: a bigger heater with thin insulation breaks the power limit", () => {
    const powerful = evaluateHeating(frugal, { heaterWatts: 1200, insulationCentimeters: 4 });
    expect(powerful.success).toBe(false);
    expect(powerful.feedback).toMatch(/only 800 W is allowed/);
  });

  it("predicts the rise above outside as P / U", () => {
    expect(evaluateHeating(heater, { heaterWatts: 160, insulationCentimeters: 10 }).predictionActual).toBeCloseTo(10, 10);
  });
});

describe("Temperature curve", () => {
  it("starts at the initial temperature and rises toward the steady state", () => {
    const room = buildRoom(heater, { heaterWatts: 400, insulationCentimeters: 10 });
    const curve = temperatureCurve(room);

    expect(curve[0]).toEqual({ x: 0, y: 5 });
    expect(curve.at(-1)?.x).toBe(12);
    expect(curve.at(-1)!.y).toBeGreaterThan(19.4);
    for (let i = 1; i < curve.length; i += 1) {
      expect(curve[i]!.y).toBeGreaterThanOrEqual(curve[i - 1]!.y);
    }
  });
});

describe("controls and saved state", () => {
  it("validates settings and ignores locked controls", () => {
    expect(() => evaluateHeating(heater, { heaterWatts: 2000, insulationCentimeters: 10 })).toThrow(/between/);
    // Round 1's insulation is fixed at 10 cm whatever the control says.
    expect(evaluateHeating(heater, { heaterWatts: 400, insulationCentimeters: 99 }).conductanceWattsPerKelvin).toBeCloseTo(16, 10);
  });

  it("round-trips and rejects corrupt saved controls", () => {
    expect(temperatureControl.parseControl({ heaterWatts: 400, insulationCentimeters: 10 }, heater)).toEqual({ heaterWatts: 400, insulationCentimeters: 10 });
    expect(temperatureControl.parseControl({ heaterWatts: 9999, insulationCentimeters: 10 }, heater)).toBeNull();
    expect(temperatureControl.parseControl(3, heater)).toBeNull();
  });

  it("rise in difficulty", () => {
    expect(HEAT_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});
