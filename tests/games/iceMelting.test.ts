import { describe, expect, it } from "vitest";
import { ICE_ROUNDS, type IceRound } from "../../src/features/games/ice-melting/iceMeltingData";
import { evaluateIce, iceMelting, resolveInputs } from "../../src/features/games/ice-melting/iceMeltingModel";
import { LATENT_HEAT_FUSION_WATER as L, SPECIFIC_HEAT_ICE as CI, SPECIFIC_HEAT_WATER as CW } from "../../src/physics/core";

const [drink, slush, bath] = ICE_ROUNDS as [IceRound, IceRound, IceRound];

describe("Ice Melting rounds (worked by hand)", () => {
  it("round 1: ice mass = m_w c_w (T_w − T_f) / (c_ice·10 + L + c_w T_f)", () => {
    const exact = (0.3 * CW * 15) / (CI * 10 + L + CW * 10) * 1000; // grams
    const outcome = evaluateIce(drink, { value: Math.round(exact * 2) / 2 });

    expect(exact).toBeCloseTo(47.5, 0);
    expect(outcome.success).toBe(true);
    expect(outcome.mixture.finalTemperatureCelsius).toBeCloseTo(10, 0);
    expect(outcome.mixture.phase).toBe("liquid");
  });

  it("round 1: too little ice leaves the drink warm, too much leaves ice", () => {
    const little = evaluateIce(drink, { value: 30 });
    const lots = evaluateIce(drink, { value: 120 });

    expect(little.success).toBe(false);
    expect(little.feedback).toMatch(/Too little cooling/);
    expect(lots.mixture.phase).toBe("ice-and-water");
    expect(lots.feedback).toMatch(/Not all the ice melted/);
  });

  it("round 2: the ice to add leaves exactly the target slush", () => {
    // m_i − (m_w c_w T_w − m_i c_ice 10)/L = 0.1 kg → m_i = 0.212 kg
    const iceKg = (0.1 + (0.5 * CW * 20) / L) / (1 + (CI * 10) / L);
    const outcome = evaluateIce(slush, { value: Math.round(iceKg * 1000) });

    expect(iceKg * 1000).toBeCloseTo(212, 0);
    expect(outcome.success).toBe(true);
    expect(outcome.iceRemainingGrams).toBeCloseTo(100, -1);
    expect(outcome.mixture.finalTemperatureCelsius).toBe(0);
  });

  it("round 2: too much melting or none at all are both explained", () => {
    expect(evaluateIce(slush, { value: 100 }).feedback).toMatch(/too little ice for a slush/);
    expect(evaluateIce(slush, { value: 400 }).feedback).toMatch(/Too much ice/);
  });

  it("round 3: the starting water temperature follows from energy balance", () => {
    const tw = 15 + (0.25 * (CI * 20 + L + CW * 15)) / (0.4 * CW);
    const outcome = evaluateIce(bath, { value: Math.round(tw * 2) / 2 });

    expect(tw).toBeCloseTo(80.5, 0);
    expect(outcome.success).toBe(true);
    expect(outcome.mixture.finalTemperatureCelsius).toBeCloseTo(15, 0);
    expect(resolveInputs(bath, { value: 80.5 })).toEqual({ iceMassGrams: 250, waterTemperatureCelsius: 80.5 });
  });

  it("round 3: slightly cooler water leaves ice unmelted or a cold result", () => {
    const outcome = evaluateIce(bath, { value: 50 });
    expect(outcome.success).toBe(false);
    expect(outcome.mixture.finalTemperatureCelsius).toBeLessThan(10);
  });

  it("gives more accuracy for a result closer to the target", () => {
    const exact = (0.3 * CW * 15) / (CI * 10 + L + CW * 10) * 1000;
    const close = evaluateIce(drink, { value: Math.round(exact * 2) / 2 });
    const edge = evaluateIce(drink, { value: Math.round(exact * 2) / 2 + 1.5 });
    expect(close.accuracyFraction).toBeGreaterThan(edge.accuracyFraction);
    expect(edge.success).toBe(true);
  });

  it("predicts the final temperature or the ice left, as each round asks", () => {
    expect(iceMelting.prediction(drink)?.unit).toBe("°C");
    expect(iceMelting.prediction(slush)?.unit).toBe("g");
    expect(evaluateIce(drink, { value: 47.5 }).predictionActual).toBeCloseTo(10, 0);
    expect(evaluateIce(slush, { value: 212 }).predictionActual).toBeCloseTo(100, -1);
  });

  it("validates the control and saved state", () => {
    expect(() => evaluateIce(drink, { value: 500 })).toThrow(/between/);
    expect(iceMelting.parseControl({ value: 40 }, drink)).toEqual({ value: 40 });
    expect(iceMelting.parseControl({ value: 4000 }, drink)).toBeNull();
    expect(iceMelting.parseControl(undefined, drink)).toBeNull();
  });

  it("rise in difficulty", () => {
    expect(ICE_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});
