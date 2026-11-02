import { describe, expect, it } from "vitest";
import { calculateCarnotCop, calculateCarnotEfficiency, calculateEngine, calculateFridgeSteadyState } from "../../src/physics/thermodynamics";

describe("Carnot limit and heat engines", () => {
  it("gives η = 1 − Tc/Th (textbook: 500 K and 300 K → 40%)", () => {
    expect(calculateCarnotEfficiency(500, 300)).toBeCloseTo(0.4, 10);
  });

  it("conserves energy: Qh = W + Qc", () => {
    const e = calculateEngine(600, 300, 100e3, 0.6);
    expect(e.workWatts + e.rejectedHeatWatts).toBeCloseTo(100e3, 6);
    expect(e.efficiency).toBeCloseTo(0.6 * 0.5, 10);
  });

  it("never produces negative entropy, and zero entropy only for a reversible (Carnot) engine", () => {
    for (const [th, tc, f] of [[600, 300, 0.5], [450, 303, 0.6], [800, 280, 0.9], [400, 399, 0.2]] as const) {
      expect(calculateEngine(th, tc, 50e3, f).entropyProductionWattsPerKelvin).toBeGreaterThanOrEqual(-1e-9);
    }
    expect(calculateEngine(600, 300, 50e3, 1).entropyProductionWattsPerKelvin).toBeCloseTo(0, 8);
    expect(calculateEngine(600, 300, 50e3, 0.5).entropyProductionWattsPerKelvin).toBeGreaterThan(0);
  });

  it("matches the textbook steam example: 100 kW at 454.7 K and 303.15 K, 60% of Carnot → 20 kW", () => {
    expect(calculateEngine(454.7, 303.15, 100e3, 0.6).workWatts).toBeCloseTo(20e3, -2);
  });

  it("rejects an engine hotter at the cold side or impossible fractions", () => {
    expect(() => calculateCarnotEfficiency(300, 300)).toThrow(RangeError);
    expect(() => calculateCarnotEfficiency(300, 400)).toThrow(RangeError);
    expect(() => calculateEngine(600, 300, 100, 1.2)).toThrow(RangeError);
    expect(() => calculateEngine(600, 300, 0, 0.5)).toThrow(RangeError);
  });
});

describe("refrigerators", () => {
  it("has Carnot COP = Tc/(Th − Tc) (277.15 K in a 298.15 K room → 13.2)", () => {
    expect(calculateCarnotCop(277.15, 298.15)).toBeCloseTo(13.198, 2);
  });

  it("settles where the machine's cooling equals the heat leak", () => {
    const s = calculateFridgeSteadyState(298.15, 2, 0.4, 8);
    expect(s.coldKelvin).toBeLessThan(298.15);
    expect(s.coolingWatts).toBeCloseTo(2 * (298.15 - s.coldKelvin), 8);
    expect(s.cop * 8).toBeCloseTo(s.coolingWatts, 8); // Q_c = COP · W
    expect(s.heatRejectedWatts).toBeCloseTo(s.coolingWatts + 8, 8);
    expect(s.coldKelvin - 273.15).toBeCloseTo(3.96, 1);
  });

  it("cools more with more compressor power and with better insulation", () => {
    const t = (u: number, w: number) => calculateFridgeSteadyState(298.15, u, 0.4, w).coldKelvin;
    expect(t(2, 20)).toBeLessThan(t(2, 8));
    expect(t(1, 8)).toBeLessThan(t(2, 8));
  });

  it("stays at room temperature with the compressor off", () => {
    expect(calculateFridgeSteadyState(298.15, 2, 0.4, 0).coldKelvin).toBeCloseTo(298.15, 6);
  });

  it("obeys the second law: the cold space cannot reach absolute zero for any power", () => {
    expect(calculateFridgeSteadyState(298.15, 1, 1, 1e6).coldKelvin).toBeGreaterThan(0);
  });

  it("validates inputs", () => {
    expect(() => calculateFridgeSteadyState(298, 0, 0.4, 5)).toThrow(RangeError);
    expect(() => calculateFridgeSteadyState(298, 2, 0, 5)).toThrow(RangeError);
    expect(() => calculateCarnotCop(300, 290)).toThrow(RangeError);
  });
});
