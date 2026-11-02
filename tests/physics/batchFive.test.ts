import { describe, expect, it } from "vitest";
import { SPECIFIC_HEAT_WATER as CW } from "../../src/physics/core";
import {
  calculateCollectedPower, calculateConcentrationRatio, calculateDishArea, calculateEquilibriumTemperature,
  calculateHeatingTime, calculateSpecificHeatFromMixing, calculateSteadyPotTemperature,
} from "../../src/physics/thermodynamics";
import {
  calculateCorrectionForFarPoint, calculateDefocus, calculateDeviation, calculateFarPoint, calculateMinimumDeviationIncidence,
  calculateMirrorFocalLength, calculateMirrorImage, calculateNearPoint, calculatePlaneMirrorCoverage, calculateRainbowAngle,
  calculateRefractionAngle, calculateWaterRefractiveIndex,
} from "../../src/physics/optics";

describe("calorimetry of a metal sample", () => {
  it("finds the common temperature: Σ C T / Σ C", () => {
    expect(calculateEquilibriumTemperature([{ heatCapacityJoulesPerKelvin: 100, temperatureCelsius: 80 }, { heatCapacityJoulesPerKelvin: 300, temperatureCelsius: 20 }])).toBeCloseTo(35, 10);
  });

  it("round-trips: mixing aluminium (900 J/kg·K) then inverting recovers c", () => {
    const final = calculateEquilibriumTemperature([
      { heatCapacityJoulesPerKelvin: 0.3 * CW + 80, temperatureCelsius: 20 },
      { heatCapacityJoulesPerKelvin: 0.2 * 900, temperatureCelsius: 100 },
    ]);
    const c = calculateSpecificHeatFromMixing({ waterMassKilograms: 0.3, waterTemperatureCelsius: 20, cupHeatCapacityJoulesPerKelvin: 80, sampleMassKilograms: 0.2, sampleTemperatureCelsius: 100, finalTemperatureCelsius: final });
    expect(c).toBeCloseTo(900, 8);
  });

  it("gives 900 J/kg·K at 30.03 °C for the first Material Detective case", () => {
    expect(calculateEquilibriumTemperature([{ heatCapacityJoulesPerKelvin: 0.3 * CW, temperatureCelsius: 20 }, { heatCapacityJoulesPerKelvin: 180, temperatureCelsius: 100 }])).toBeCloseTo(30.03, 1);
  });

  it("rejects impossible mixing data", () => {
    expect(() => calculateEquilibriumTemperature([])).toThrow(RangeError);
    expect(() => calculateSpecificHeatFromMixing({ waterMassKilograms: 1, waterTemperatureCelsius: 20, cupHeatCapacityJoulesPerKelvin: 0, sampleMassKilograms: 0.1, sampleTemperatureCelsius: 100, finalTemperatureCelsius: 15 })).toThrow(RangeError);
  });
});

describe("solar cooker", () => {
  it("collects P = I A ρ cos θ", () => {
    const area = calculateDishArea(0.5);
    expect(area).toBeCloseTo(0.19635, 5);
    expect(calculateCollectedPower(1000, area, 0.85, 0)).toBeCloseTo(166.9, 1);
    expect(calculateCollectedPower(1000, area, 0.85, 60)).toBeCloseTo(166.9 / 2, 1);
    expect(calculateCollectedPower(1000, area, 0.85, 95)).toBe(0);
  });

  it("boils 1 kg from 20 °C in 33 minutes with a 0.5 m dish and no losses", () => {
    const energy = 1 * CW * 80;
    const t = calculateHeatingTime(energy, calculateCollectedPower(1000, calculateDishArea(0.5), 0.85, 0)) as number;
    expect(t / 60).toBeCloseTo(33.4, 0);
    expect(calculateHeatingTime(energy, 0)).toBeNull();
  });

  it("settles at T = T_a + P/(hS) and concentrates by area ratio", () => {
    expect(calculateSteadyPotTemperature(510, 20, 0.3, 25)).toBeCloseTo(110, 8);
    expect(calculateConcentrationRatio(0.785, 0.0785)).toBeCloseTo(10, 8);
  });

  it("validates", () => {
    expect(() => calculateCollectedPower(1000, 1, 1.2, 0)).toThrow(RangeError);
    expect(() => calculateDishArea(0)).toThrow(RangeError);
  });
});

describe("rainbows", () => {
  it("has Cauchy indices of 1.330 (red) to 1.344 (violet)", () => {
    expect(calculateWaterRefractiveIndex(700)).toBeCloseTo(1.3303, 3);
    expect(calculateWaterRefractiveIndex(400)).toBeCloseTo(1.344, 3);
  });

  it("puts the primary bow near 42° for red and 40.5° for violet (violet inside)", () => {
    const red = calculateRainbowAngle(calculateWaterRefractiveIndex(700), 1);
    const violet = calculateRainbowAngle(calculateWaterRefractiveIndex(400), 1);
    expect(red).toBeCloseTo(42.4, 0);
    expect(violet).toBeCloseTo(40.4, 0);
    expect(red).toBeGreaterThan(violet);
  });

  it("puts the secondary bow near 51° with the colours reversed (red inside)", () => {
    const red = calculateRainbowAngle(calculateWaterRefractiveIndex(700), 2);
    const violet = calculateRainbowAngle(calculateWaterRefractiveIndex(400), 2);
    expect(red).toBeGreaterThan(49.5);
    expect(violet).toBeLessThan(55);
    expect(violet).toBeGreaterThan(red);
  });

  it("has minimum deviation exactly where cos²θᵢ = (n² − 1)/(k(k+2)) (checked by scanning)", () => {
    const n = 1.333;
    for (const k of [1, 2]) {
      let best = 0;
      let bestDeviation = Infinity;
      for (let i = 1; i < 90_000; i += 1) {
        const theta = i / 1000;
        const d = k === 1 ? calculateDeviation(theta, n, 1) : Math.abs(calculateDeviation(theta, n, 2) - 180);
        const score = k === 1 ? d : calculateDeviation(theta, n, 2);
        if (score < bestDeviation && (k === 1 || score > 180)) { bestDeviation = score; best = theta; }
      }
      expect(best).toBeCloseTo(calculateMinimumDeviationIncidence(n, k), 1);
      void best;
    }
  });

  it("obeys Snell's law inside the drop", () => {
    expect(calculateRefractionAngle(59.4, 1.333)).toBeCloseTo(40.2, 0);
  });

  it("validates", () => {
    expect(() => calculateDeviation(40, 1.33, 3)).toThrow(RangeError);
    expect(() => calculateWaterRefractiveIndex(100)).toThrow(RangeError);
    expect(() => calculateRefractionAngle(95, 1.33)).toThrow(RangeError);
  });
});

describe("vision", () => {
  const myope = { refractiveErrorDiopters: 2, accommodationDiopters: 4 };

  it("has far point 1/E and near point 1/(E + A)", () => {
    expect(calculateFarPoint(myope)).toBeCloseTo(0.5, 10);
    expect(calculateNearPoint(myope)).toBeCloseTo(1 / 6, 10);
    expect(calculateFarPoint({ refractiveErrorDiopters: -1, accommodationDiopters: 3 })).toBe(Infinity);
  });

  it("is corrected by P = −1/far point (−2 D for a 0.5 m far point)", () => {
    const lens = calculateCorrectionForFarPoint(0.5);
    expect(lens).toBeCloseTo(-2, 10);
    expect(calculateFarPoint(myope, lens)).toBe(Infinity);
    expect(calculateDefocus(myope, lens, 100)).toBe(0);
  });

  it("is blurred at a distance without correction, by about the error", () => {
    expect(calculateDefocus(myope, 0, 6)).toBeCloseTo(2 - 1 / 6, 8);
    expect(calculateDefocus(myope, 0, 0.25)).toBe(0);
  });

  it("needs a plus lens for a long-sighted eye to read", () => {
    const hyperope = { refractiveErrorDiopters: -2.5, accommodationDiopters: 3 };
    expect(calculateDefocus(hyperope, 0, 0.3)).toBeGreaterThan(0.5);
    expect(calculateDefocus(hyperope, 3, 0.3)).toBe(0);
  });

  it("validates", () => {
    expect(() => calculateDefocus(myope, 0, 0)).toThrow(RangeError);
  });
});

describe("mirrors", () => {
  it("has f = R/2, negative for convex", () => {
    expect(calculateMirrorFocalLength(0.6)).toBeCloseTo(0.3, 10);
    expect(calculateMirrorFocalLength(0.6, true)).toBeCloseTo(-0.3, 10);
  });

  it("makes an upright virtual image magnified f/(f − dₒ) inside the focal length (shaving mirror)", () => {
    const { imageDistance, magnification } = calculateMirrorImage(0.3, 0.15);
    expect(imageDistance).toBeCloseTo(-0.3, 10);
    expect(magnification).toBeCloseTo(2, 10);
  });

  it("makes a small virtual image in a convex mirror (m = |f|/(|f| + dₒ))", () => {
    const { imageDistance, magnification } = calculateMirrorImage(-10 / 9, 10);
    expect(magnification).toBeCloseTo(0.1, 8);
    expect(imageDistance).toBeCloseTo(-1, 8);
  });

  it("covers the half-height rule for a plane mirror", () => {
    const c = calculatePlaneMirrorCoverage(1.7, 1.8);
    expect(c.lowest).toBeCloseTo(0.85, 10);
    expect(c.highest).toBeCloseTo(1.75, 10);
    expect(c.highest - c.lowest).toBeCloseTo(0.9, 10);
  });

  it("validates", () => {
    expect(() => calculatePlaneMirrorCoverage(2, 1.8)).toThrow(RangeError);
    expect(() => calculateMirrorFocalLength(0)).toThrow(RangeError);
  });
});
