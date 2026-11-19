import { describe, expect, it } from "vitest";
import {
  addVelocities,
  calculateBetaForLorentzFactor,
  calculateContractedLength,
  calculateEquatorialSpeed,
  calculateLightTravelTime,
  calculateLorentzFactor,
  calculateProperTime,
  calculateRelativisticKineticEnergy,
  calculateSurvivingFraction,
  calculateTangentialDriftHeight,
  calculateTidalAcceleration,
  calculateTwinTrip,
} from "../../src/physics/astronomy";
import {
  ASTRONOMICAL_UNIT,
  EARTH_MEAN_RADIUS,
  EARTH_MOON_DISTANCE,
  EARTH_SIDEREAL_DAY,
  ELECTRON_MASS,
  HELIUM_MOLAR_MASS,
  MOON_GRAVITATIONAL_PARAMETER,
  MUON_MEAN_LIFETIME,
  SPEED_OF_LIGHT,
  SUN_GRAVITATIONAL_PARAMETER,
} from "../../src/physics/core";
import { calculateDragFallTime, calculateTerminalSpeed } from "../../src/physics/mechanics";
import {
  calculateMeanKineticEnergy,
  calculatePressureAtConstantVolume,
  calculateRmsSpeed,
  calculateThermalWavelength,
} from "../../src/physics/thermodynamics";

describe("special relativity", () => {
  it("gives textbook Lorentz factors", () => {
    expect(calculateLorentzFactor(0)).toBe(1);
    expect(calculateLorentzFactor(0.6)).toBeCloseTo(1.25, 12);
    expect(calculateLorentzFactor(0.8)).toBeCloseTo(5 / 3, 12);
    expect(calculateLorentzFactor(0.99)).toBeCloseTo(7.0888, 4);
    expect(calculateBetaForLorentzFactor(1.25)).toBeCloseTo(0.6, 12);
  });

  it("rejects speeds at or above c and negative speeds", () => {
    expect(() => calculateLorentzFactor(1)).toThrow(RangeError);
    expect(() => calculateLorentzFactor(-0.1)).toThrow(RangeError);
    expect(() => calculateBetaForLorentzFactor(0.5)).toThrow(RangeError);
  });

  it("slows moving clocks and shortens moving rulers by γ", () => {
    expect(calculateProperTime(10, 0.6)).toBeCloseTo(8, 12);
    expect(calculateContractedLength(100, 0.8)).toBeCloseTo(60, 12);
  });

  it("reduces to ½mv² at low speed", () => {
    const beta = 1e-4;
    const classical = 0.5 * ELECTRON_MASS * (beta * SPEED_OF_LIGHT) ** 2;
    expect(calculateRelativisticKineticEnergy(ELECTRON_MASS, beta) / classical).toBeCloseTo(1, 6);
  });

  it("never adds speeds past c", () => {
    expect(addVelocities(0.5, 0.5)).toBeCloseTo(0.8, 12);
    expect(addVelocities(0.9, 0.9)).toBeLessThan(1);
    expect(() => addVelocities(1, 0.1)).toThrow(RangeError);
  });

  it("solves the twin paradox for a 4 ly star at 0.8c: 10 years at home, 6 for the traveller", () => {
    const trip = calculateTwinTrip(4, 0.8);
    expect(trip.homeYears).toBeCloseTo(10, 12);
    expect(trip.travellerYears).toBeCloseTo(6, 12);
    expect(trip.contractedDistanceLightYears).toBeCloseTo(2.4, 12);
  });

  it("lets far more muons reach the ground than a classical clock would allow", () => {
    // Muons made 15 km up at 0.995c: γ ≈ 10.
    const relativistic = calculateSurvivingFraction(15_000, 0.995, MUON_MEAN_LIFETIME);
    const classical = calculateSurvivingFraction(15_000, 0.995, MUON_MEAN_LIFETIME, false);
    expect(classical).toBeLessThan(1e-9);
    expect(relativistic).toBeGreaterThan(0.09);
    expect(relativistic).toBeLessThan(0.12);
  });

  it("takes sunlight about 499 s to reach Earth", () => {
    expect(calculateLightTravelTime(ASTRONOMICAL_UNIT)).toBeCloseTo(499.0, 0);
  });
});

describe("tides and rotation", () => {
  it("gives the Moon's tidal acceleration on Earth (≈1.1 × 10⁻⁶ m/s²), about 2.2 times the Sun's", () => {
    const moon = calculateTidalAcceleration(MOON_GRAVITATIONAL_PARAMETER, EARTH_MOON_DISTANCE, EARTH_MEAN_RADIUS);
    const sun = calculateTidalAcceleration(SUN_GRAVITATIONAL_PARAMETER, ASTRONOMICAL_UNIT, EARTH_MEAN_RADIUS);
    expect(moon).toBeCloseTo(1.1e-6, 7);
    expect(moon / sun).toBeCloseTo(2.18, 1);
  });

  it("scales with 1/d³: half the distance gives eight times the tide", () => {
    const near = calculateTidalAcceleration(1, 50, 1);
    const far = calculateTidalAcceleration(1, 100, 1);
    expect(near / far).toBeCloseTo(8, 12);
    expect(() => calculateTidalAcceleration(1, 1, 2)).toThrow(RangeError);
  });

  it("moves the equator at about 465 m/s", () => {
    expect(calculateEquatorialSpeed(6.378137e6, EARTH_SIDEREAL_DAY)).toBeCloseTo(465.1, 1);
  });

  it("drifts slowly at first: s²/2R for short times", () => {
    const height = calculateTangentialDriftHeight(EARTH_MEAN_RADIUS, 465, 1);
    expect(height).toBeCloseTo(465 ** 2 / (2 * EARTH_MEAN_RADIUS), 6);
    expect(calculateTangentialDriftHeight(3, 4, 1)).toBeCloseTo(2, 12);
  });
});

describe("kinetic theory", () => {
  it("gives helium atoms about 1.37 km/s at room temperature", () => {
    expect(calculateRmsSpeed(300, HELIUM_MOLAR_MASS)).toBeCloseTo(1367, -1);
  });

  it("gives ⟨E⟩ = 3/2 kT and v_rms ∝ √T", () => {
    expect(calculateMeanKineticEnergy(300)).toBeCloseTo(6.21e-21, 23);
    expect(calculateRmsSpeed(4 * 300, HELIUM_MOLAR_MASS) / calculateRmsSpeed(300, HELIUM_MOLAR_MASS)).toBeCloseTo(2, 12);
  });

  it("halves the pressure when the absolute temperature halves", () => {
    expect(calculatePressureAtConstantVolume(100_000, 300, 150)).toBeCloseTo(50_000, 9);
    expect(() => calculatePressureAtConstantVolume(100_000, 300, 0)).toThrow(RangeError);
  });

  it("grows the thermal wavelength as 1/√T", () => {
    const heliumMass = HELIUM_MOLAR_MASS / 6.02214076e23;
    const warm = calculateThermalWavelength(300, heliumMass);
    expect(warm).toBeCloseTo(5.04e-11, 12);
    expect(calculateThermalWavelength(3, heliumMass) / warm).toBeCloseTo(10, 9);
  });
});

describe("falling with quadratic drag", () => {
  it("approaches the vacuum time when drag is negligible", () => {
    expect(calculateDragFallTime(2, 1e5, 9.81)).toBeCloseTo(Math.sqrt(4 / 9.81), 6);
  });

  it("approaches h / v_t plus a constant for long falls", () => {
    const t = calculateDragFallTime(1000, 1, 9.81);
    expect(t).toBeCloseTo(1000 + Math.LN2 / 9.81, 6);
  });

  it("matches y = (v_t²/g) ln cosh(g t / v_t)", () => {
    const vt = calculateTerminalSpeed(5e-4, 0.008);
    const t = calculateDragFallTime(1.2, vt);
    const y = (vt ** 2 / 9.80665) * Math.log(Math.cosh((9.80665 * t) / vt));
    expect(y).toBeCloseTo(1.2, 9);
  });
});

describe("distance fallen with quadratic drag", () => {
  it("inverts the fall time and starts like ½gt²", async () => {
    const { calculateDragFallDistance } = await import("../../src/physics/mechanics");
    const t = calculateDragFallTime(1.5, 2);
    expect(calculateDragFallDistance(t, 2)).toBeCloseTo(1.5, 9);
    expect(calculateDragFallDistance(0.01, 50, 9.81)).toBeCloseTo(0.5 * 9.81 * 1e-4, 8);
    expect(calculateDragFallDistance(1000, 1, 9.81)).toBeCloseTo(1000 - Math.LN2 / 9.81, 6);
  });
});
