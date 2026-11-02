import { describe, expect, it } from "vitest";
import { ELEMENTARY_CHARGE as e, PROTON_MASS as mp, SPEED_OF_LIGHT as c, VACUUM_PERMEABILITY as mu0 } from "../../src/physics/core";
import {
  calculateClassicalExtractionEnergy, calculateCoilResistance, calculateCyclotronFrequencyHz, calculateEmfAtTime,
  calculateGeneratorOutput, calculateHeatingPower, calculateLorentzFactor, calculateMagneticPullForce, calculatePeakEmf,
  calculateRadiusForEnergy, calculateRelativisticExtractionEnergy, calculateResonantField, calculateSolenoidField,
  joulesToMegaelectronvolts,
} from "../../src/physics/electromagnetism";

describe("induction (Faraday's law)", () => {
  it("has peak EMF N B A ω (200 turns, 0.8 T, 0.1 m², 10 rad/s → 160 V)", () => {
    expect(calculatePeakEmf(200, 0.8, 0.1, 10)).toBeCloseTo(160, 10);
  });

  it("follows ε = ε₀ sin ωt and is zero at t = 0", () => {
    expect(calculateEmfAtTime(100, 2 * Math.PI, 0)).toBe(0);
    expect(calculateEmfAtTime(100, 2 * Math.PI, 0.25)).toBeCloseTo(100, 10);
    expect(calculateEmfAtTime(100, 2 * Math.PI, 0.75)).toBeCloseTo(-100, 10);
  });

  it("delivers P = I²R_L with the coil's own resistance in series", () => {
    const out = calculateGeneratorOutput({ turns: 200, fieldTesla: 0.8, areaSquareMeters: 0.1, revolutionsPerMinute: 101, loadOhms: 20, coilOhmsPerTurn: 0.02 });
    expect(out.coilResistanceOhms).toBeCloseTo(4, 10);
    expect(out.rmsEmfVolts).toBeCloseTo(out.peakEmfVolts / Math.SQRT2, 10);
    expect(out.rmsCurrentAmperes).toBeCloseTo(out.rmsEmfVolts / 24, 10);
    expect(out.loadPowerWatts).toBeCloseTo(out.rmsCurrentAmperes ** 2 * 20, 8);
    expect(out.efficiency).toBeCloseTo(20 / 24, 10);
    expect(out.loadPowerWatts + out.coilLossWatts).toBeCloseTo(out.rmsEmfVolts * out.rmsCurrentAmperes, 8);
  });

  it("scales power with the square of the speed and gives frequency rpm/60", () => {
    const at = (rpm: number) => calculateGeneratorOutput({ turns: 100, fieldTesla: 1, areaSquareMeters: 0.1, revolutionsPerMinute: rpm, loadOhms: 10, coilOhmsPerTurn: 0 });
    expect(at(200).loadPowerWatts / at(100).loadPowerWatts).toBeCloseTo(4, 10);
    expect(at(3000).frequencyHertz).toBe(50);
  });

  it("validates inputs", () => {
    expect(() => calculatePeakEmf(0, 1, 1, 1)).toThrow(RangeError);
    expect(() => calculateGeneratorOutput({ turns: 10, fieldTesla: 1, areaSquareMeters: 1, revolutionsPerMinute: 60, loadOhms: 0, coilOhmsPerTurn: 0 })).toThrow(RangeError);
  });
});

describe("electromagnet", () => {
  it("has B = μ₀μᵣNI/L below saturation", () => {
    expect(calculateSolenoidField(1000, 1, 0.3, 200)).toBeCloseTo((mu0 * 200 * 1000) / 0.3, 10);
  });

  it("saturates at 1.6 T however much current flows", () => {
    expect(calculateSolenoidField(1000, 50, 0.3, 200)).toBe(1.6);
  });

  it("pulls with F = B²A/μ₀ for two faces (1.6 T over 0.01 m² → 20.4 kN)", () => {
    expect(calculateMagneticPullForce(1.6, 0.01)).toBeCloseTo(1.6 ** 2 * 0.01 / mu0, 6);
    expect(calculateMagneticPullForce(1.6, 0.01) / 1000).toBeCloseTo(20.37, 1);
    expect(calculateMagneticPullForce(1.6, 0.01, 1)).toBeCloseTo(calculateMagneticPullForce(1.6, 0.01) / 2, 6);
  });

  it("quadruples the force when the field doubles", () => {
    expect(calculateMagneticPullForce(1.2, 0.01) / calculateMagneticPullForce(0.6, 0.01)).toBeCloseTo(4, 10);
  });

  it("computes coil resistance and heating", () => {
    const r = calculateCoilResistance(1000, 0.4, 1e-6);
    expect(r).toBeCloseTo(6.72, 2);
    expect(calculateHeatingPower(2, r)).toBeCloseTo(4 * r, 10);
  });
});

describe("cyclotron", () => {
  it("has a proton cyclotron frequency of 15.25 MHz per tesla", () => {
    expect(calculateCyclotronFrequencyHz(e, mp, 1) / 1e6).toBeCloseTo(15.25, 1);
  });

  it("inverts: resonant field for 20 MHz is 1.31 T", () => {
    expect(calculateResonantField(e, mp, 20e6)).toBeCloseTo(1.312, 2);
  });

  it("gives ~20.6 MeV for protons at 1.312 T and R = 0.5 m (classical)", () => {
    const energy = calculateClassicalExtractionEnergy(e, mp, calculateResonantField(e, mp, 20e6), 0.5);
    expect(joulesToMegaelectronvolts(energy)).toBeCloseTo(20.6, 0);
  });

  it("relativistic energy matches classical at low energy and falls below it at high energy", () => {
    const low = (f: (...a: number[]) => number) => f(e, mp, 1.312, 0.1);
    expect(low(calculateRelativisticExtractionEnergy) / low(calculateClassicalExtractionEnergy)).toBeCloseTo(1, 3);
    const classical = calculateClassicalExtractionEnergy(e, mp, 1.5, 2);
    const relativistic = calculateRelativisticExtractionEnergy(e, mp, 1.5, 2);
    expect(relativistic).toBeLessThan(classical);
  });

  it("round-trips radius and energy relativistically (250 MeV proton at 1.5 T → 1.62 m)", () => {
    const energy = 250e6 * e;
    const radius = calculateRadiusForEnergy(e, mp, 1.5, energy);
    expect(radius).toBeCloseTo(1.62, 1);
    expect(calculateRelativisticExtractionEnergy(e, mp, 1.5, radius)).toBeCloseTo(energy, -6 + 3);
  });

  it("gives γ = 1.27 for a 250 MeV proton and reduces the frequency by 1/γ", () => {
    expect(calculateLorentzFactor(mp, 250e6 * e)).toBeCloseTo(1.266, 2);
    expect(mp * c ** 2 / e / 1e6).toBeCloseTo(938.27, 1);
  });

  it("validates inputs", () => {
    expect(() => calculateResonantField(e, mp, 0)).toThrow(RangeError);
    expect(() => calculateRadiusForEnergy(e, mp, 0, 1)).toThrow(RangeError);
  });
});
