import { describe, expect, it } from "vitest";
import {
  LATENT_HEAT_FUSION_WATER as L,
  SPECIFIC_HEAT_ICE as CI,
  SPECIFIC_HEAT_WATER as CW,
} from "../../src/physics/core";
import {
  calculateEnthalpy,
  calculateHeatOfFusion,
  calculateHeatToChangeTemperature,
  solveIceWaterMixture,
} from "../../src/physics/thermodynamics";

const mix = (iceKg: number, iceC: number, waterKg: number, waterC: number) =>
  solveIceWaterMixture({
    iceMassKilograms: iceKg, iceTemperatureCelsius: iceC,
    waterMassKilograms: waterKg, waterTemperatureCelsius: waterC,
  });

describe("heat formulas", () => {
  it("computes Q = m c ΔT and Q = m L", () => {
    expect(calculateHeatToChangeTemperature(2, CW, 10)).toBeCloseTo(2 * 4186 * 10, 6);
    expect(calculateHeatOfFusion(0.5)).toBeCloseTo(0.5 * 3.34e5, 6);
  });

  it("rejects negative masses", () => {
    expect(() => calculateHeatOfFusion(-1)).toThrow(RangeError);
  });
});

describe("mixing ice and water", () => {
  it("melts all the ice and warms it when the water holds enough heat (textbook check)", () => {
    // 0.1 kg ice at 0 °C into 0.5 kg water at 40 °C: T = (0.5·CW·40 − 0.1·L) / (0.6·CW)
    const result = mix(0.1, 0, 0.5, 40);
    expect(result.finalTemperatureCelsius).toBeCloseTo((0.5 * CW * 40 - 0.1 * L) / (0.6 * CW), 8);
    expect(result.phase).toBe("liquid");
    expect(result.iceMassKilograms).toBe(0);
    expect(result.waterMassKilograms).toBeCloseTo(0.6, 10);
  });

  it("stops at 0 °C with ice left when the water cannot melt it all", () => {
    // 0.5 kg ice at 0 °C into 0.2 kg water at 20 °C melts 0.2·CW·20 / L = 0.0501 kg.
    const result = mix(0.5, 0, 0.2, 20);
    expect(result.finalTemperatureCelsius).toBe(0);
    expect(result.phase).toBe("ice-and-water");
    expect(result.iceMassKilograms).toBeCloseTo(0.5 - (0.2 * CW * 20) / L, 10);
  });

  it("accounts for warming cold ice to 0 °C first", () => {
    const warm = mix(0.2, -10, 0.5, 20);
    const cold = mix(0.2, 0, 0.5, 20);
    expect(warm.heatToWarmIceJoules).toBeCloseTo(0.2 * CI * 10, 8);
    expect(warm.iceMassKilograms).toBeGreaterThan(cold.iceMassKilograms);
  });

  it("freezes some water when ice is cold enough to need more heat than the water supplies", () => {
    // 0.5 kg ice at −10 °C into 0.1 kg water at 0 °C: the ice needs 10,450 J to reach 0 °C,
    // which the water supplies by freezing 10,450 / L = 0.0313 kg of itself.
    const result = mix(0.5, -10, 0.1, 0);
    expect(result.finalTemperatureCelsius).toBe(0);
    expect(result.iceMassKilograms).toBeCloseTo(0.5 + 10_450 / L, 8);
    expect(result.waterMassKilograms).toBeCloseTo(0.1 - 10_450 / L, 8);
  });

  it("ends below 0 °C as solid ice when all the water freezes and the ice is still cold", () => {
    const result = mix(1, -40, 0.05, 0);
    expect(result.phase).toBe("ice");
    expect(result.finalTemperatureCelsius).toBeLessThan(0);
    expect(result.finalTemperatureCelsius).toBeGreaterThan(-40);
    expect(result.waterMassKilograms).toBe(0);
  });

  it("gives the same temperature as plain water mixing when there is no ice", () => {
    expect(mix(0, 0, 1, 50).finalTemperatureCelsius).toBeCloseTo(50, 10);
    // Ice melting only (no water): not possible to warm, stays ice.
    expect(mix(1, -5, 0, 0).phase).toBe("ice");
  });

  it("conserves energy for a wide range of mixtures", () => {
    const cases: [number, number, number, number][] = [
      [0.1, 0, 0.5, 40], [0.5, 0, 0.2, 20], [0.2, -10, 0.5, 20], [0.5, -10, 0.1, 0],
      [1, -40, 0.05, 0], [0.3, -15, 0.7, 85], [0.05, -2, 1, 5], [2, -30, 0.5, 90],
    ];
    for (const [mi, ti, mw, tw] of cases) {
      const result = mix(mi, ti, mw, tw);
      const before = calculateEnthalpy(mi, ti, mw, tw);
      const after =
        result.phase === "ice"
          ? calculateEnthalpy(result.iceMassKilograms, result.finalTemperatureCelsius, 0, 0)
          : calculateEnthalpy(result.iceMassKilograms, 0, result.waterMassKilograms, result.finalTemperatureCelsius);
      expect(after).toBeCloseTo(before, 4);
    }
  });

  it("conserves mass", () => {
    const result = mix(0.3, -15, 0.7, 85);
    expect(result.iceMassKilograms + result.waterMassKilograms).toBeCloseTo(1, 12);
  });

  it("validates inputs", () => {
    expect(() => mix(0.1, 5, 0.5, 20)).toThrow(/warmer than 0/);
    expect(() => mix(0.1, -5, 0.5, -1)).toThrow(/colder than 0/);
    expect(() => mix(0, 0, 0, 0)).toThrow(/some ice or water/);
    expect(() => mix(-1, 0, 1, 1)).toThrow(RangeError);
  });
});
