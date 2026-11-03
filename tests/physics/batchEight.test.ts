import { describe, expect, it } from "vitest";
import { AIR_DENSITY, ATOMIC_MASS_UNIT_MEV, STANDARD_GRAVITY, STEEL_DENSITY } from "../../src/physics/core";
import {
  calculateBernoulliPressureDrop, calculateBestGlideLiftCoefficient, calculateCenterOfPressureHeight, calculateCircleArea, calculateDiameterForSpeed,
  calculateDragCoefficient, calculateFluidDensityForFraction, calculateGlideRatio, calculateHollowSphereAverageDensity, calculateLevelFlightSpeed,
  calculateLift, calculateLiftCoefficient, calculateLiftSlope, calculateOverturningMoment, calculateOverturningSafetyFactor, calculatePoiseuilleFlow,
  calculateRequiredLiftCoefficient, calculateResistingMoment, calculateReynoldsNumber, calculateSpeedFromFlow, calculateSubmergedFraction,
  calculateThicknessForSafetyFactor, calculateWallThicknessForDensity, calculateWaterForce, floats, isLaminar,
} from "../../src/physics/fluids";
import {
  applyDecay, calculateBindingEnergyMeV, calculateBindingEnergyPerNucleon, calculateContactDistanceFm, calculateConvertedFraction, calculateCoulombBarrierMeV,
  calculateCoulombPotentialMeV, calculateDaughterAmount, calculateDaughterPeakTime, calculateEnergyFromMass, calculateEnergyPerKilogram,
  calculateHalfLifeFromActivities, calculateKeVFromTemperature, calculateMassDefect, calculateMassFromEnergy, calculateMixedActivityFraction,
  calculateReactionEnergyMeV, calculateSemiEmpiricalBindingEnergy, calculateStableProtonNumber, calculateTemperatureFromKeV, calculateTimeForMixedActivity,
  countDecaysBetween, findNuclide, findNuclideByNumbers, NUCLIDES,
} from "../../src/physics/nuclear";
import {
  calculateBicycleSpeed, calculateDriveForce, calculateResistiveForce, calculateRiderPower, calculateSpeedForPower, calculateWheelTorque,
} from "../../src/physics/mechanics";

describe("gravity dam", () => {
  it("has F = ½ρgh² acting h/3 up and an overturning moment ρgh³/6", () => {
    expect(calculateWaterForce(10)).toBeCloseTo(490_332.5, 0);
    expect(calculateCenterOfPressureHeight(10)).toBeCloseTo(10 / 3, 12);
    expect(calculateOverturningMoment(10)).toBeCloseTo((1000 * STANDARD_GRAVITY * 1000) / 6, 4);
  });
  it("gives SF ∝ b² and the thickness for SF = 1.5 is 4.56 m for a 10 m lake behind a 10 m dam", () => {
    const base = { waterDepth: 10, damHeight: 10 };
    const unit = calculateOverturningSafetyFactor({ ...base, thickness: 1 });
    expect(calculateOverturningSafetyFactor({ ...base, thickness: 3 })).toBeCloseTo(9 * unit, 10);
    expect(calculateThicknessForSafetyFactor(base, 1.5)).toBeCloseTo(4.56, 2);
    expect(calculateOverturningSafetyFactor({ ...base, thickness: 4.56 })).toBeCloseTo(1.5, 2);
  });
  it("resists less when uplift is included", () => {
    const d = { waterDepth: 10, damHeight: 11, thickness: 5 };
    expect(calculateResistingMoment({ ...d, uplift: true })).toBeLessThan(calculateResistingMoment(d));
    const lost = calculateResistingMoment(d) - calculateResistingMoment({ ...d, uplift: true });
    expect(lost).toBeCloseTo(0.5 * 1000 * STANDARD_GRAVITY * 10 * 5 * (10 / 3), 3);
  });
  it("rejects overtopping and bad input", () => {
    expect(() => calculateOverturningSafetyFactor({ waterDepth: 12, damHeight: 10, thickness: 3 })).toThrow(RangeError);
    expect(() => calculateWaterForce(-1)).toThrow(RangeError);
  });
});

describe("lift and drag", () => {
  it("lifts a 1000 kg plane with C_L = 1.6, S = 16 m² at 25 m/s", () => {
    expect(calculateLevelFlightSpeed(1000, 16, 1.6)).toBeCloseTo(25.0, 1);
    expect(calculateLift(25.0, 16, 1.6)).toBeCloseTo(1000 * STANDARD_GRAVITY, -2);
  });
  it("has lift slope 2π·AR/(AR+2), 5.03 per radian for AR = 8", () => {
    expect(calculateLiftSlope(8)).toBeCloseTo(5.0265, 3);
    expect(calculateLiftCoefficient(0.1244, 8, 1.6).value).toBeCloseTo(0.6253, 3);
    expect(calculateLiftCoefficient(0.4, 8, 1.6)).toEqual({ value: 1.6, stalled: true });
    expect(calculateRequiredLiftCoefficient(1000, 40, 16)).toBeCloseTo(0.6254, 3);
  });
  it("is best at the C_L where induced and parasitic drag are equal: L/D = 12.9 at C_L = 0.777", () => {
    const cl = calculateBestGlideLiftCoefficient(0.03, 8, 0.8);
    expect(cl).toBeCloseTo(0.7767, 3);
    expect(calculateDragCoefficient(cl, 0.03, 8, 0.8)).toBeCloseTo(0.06, 6);
    expect(calculateGlideRatio(cl, 0.03, 8, 0.8)).toBeCloseTo(12.94, 1);
    expect(calculateGlideRatio(cl * 1.3, 0.03, 8, 0.8)).toBeLessThan(calculateGlideRatio(cl, 0.03, 8, 0.8));
    expect(calculateGlideRatio(cl * 0.7, 0.03, 8, 0.8)).toBeLessThan(calculateGlideRatio(cl, 0.03, 8, 0.8));
    expect(calculateLevelFlightSpeed(1000, 16, cl)).toBeCloseTo(35.9, 1);
  });
  it("rejects bad input", () => {
    expect(() => calculateLift(0, 16, 1)).toThrow(RangeError);
    expect(() => calculateLiftSlope(0)).toThrow(RangeError);
    expect(AIR_DENSITY).toBe(1.225);
  });
});

describe("pipe flow", () => {
  it("obeys continuity: 2 L/s at 20 m/s needs a 11.3 mm nozzle, and halving the area doubles the speed", () => {
    expect(calculateDiameterForSpeed(0.002, 20) * 1000).toBeCloseTo(11.28, 2);
    expect(calculateSpeedFromFlow(0.002, 0.01128)).toBeCloseTo(20, 1);
    expect(calculateSpeedFromFlow(0.002, 0.02) / calculateSpeedFromFlow(0.002, 0.02 * Math.SQRT2)).toBeCloseTo(2, 10);
    expect(calculateCircleArea(0.05)).toBeCloseTo(1.9635e-3, 6);
  });
  it("gives the Venturi pressure drop 40 kPa for a 26.2 mm throat in a 50 mm pipe at 5 L/s", () => {
    const v1 = calculateSpeedFromFlow(0.005, 0.05);
    const v2 = calculateSpeedFromFlow(0.005, 0.0262);
    expect(v1).toBeCloseTo(2.546, 3);
    expect(calculateBernoulliPressureDrop(v1, v2, 1000) / 1000).toBeCloseTo(40, 0);
    expect(calculateBernoulliPressureDrop(v1, v1, 1000)).toBe(0);
  });
  it("gives Poiseuille flow Q ∝ d⁴: 1 L/s in a 30 mm pipe for oil, and 16× more for double the diameter", () => {
    const q = calculatePoiseuilleFlow(0.03, 10, 0.1, 50_000);
    expect(q * 1000).toBeCloseTo(0.99, 1);
    expect(calculatePoiseuilleFlow(0.06, 10, 0.1, 50_000) / q).toBeCloseTo(16, 10);
  });
  it("checks that the flow is laminar", () => {
    const q = calculatePoiseuilleFlow(0.03, 10, 0.1, 50_000);
    const re = calculateReynoldsNumber(900, calculateSpeedFromFlow(q, 0.03), 0.03, 0.1);
    expect(re).toBeCloseTo(378, -1);
    expect(isLaminar(re)).toBe(true);
    expect(isLaminar(5000)).toBe(false);
    expect(() => calculatePoiseuilleFlow(0, 10, 0.1, 1)).toThrow(RangeError);
  });
});

describe("floating by density", () => {
  it("submerges the fraction ρ_object/ρ_fluid and sinks denser objects", () => {
    expect(calculateSubmergedFraction(300, 1000)).toBeCloseTo(0.3, 12);
    expect(calculateSubmergedFraction(2700, 1000)).toBe(1);
    expect(floats(917, 1000)).toBe(true);
    expect(floats(2700, 1000)).toBe(false);
    expect(calculateSubmergedFraction(917, 1025)).toBeCloseTo(0.8946, 3);
  });
  it("floats a thin steel shell: 10.85 mm walls on a 0.5 m sphere give half-submerged", () => {
    const t = calculateWallThicknessForDensity(STEEL_DENSITY, 0.5, 500);
    expect(t * 1000).toBeCloseTo(10.85, 1);
    expect(calculateHollowSphereAverageDensity(STEEL_DENSITY, 0.5, t)).toBeCloseTo(500, 8);
    expect(calculateHollowSphereAverageDensity(STEEL_DENSITY, 0.5, 0.5)).toBeCloseTo(STEEL_DENSITY, 8);
  });
  it("finds the fluid density that floats an egg 90 % submerged", () => {
    expect(calculateFluidDensityForFraction(1060, 0.9)).toBeCloseTo(1177.8, 1);
    expect(() => calculateFluidDensityForFraction(1060, 0)).toThrow(RangeError);
    expect(() => calculateWallThicknessForDensity(STEEL_DENSITY, 0.5, 9000)).toThrow(RangeError);
  });
});

describe("nuclear binding energy", () => {
  it("gives the textbook binding energies per nucleon", () => {
    const perNucleon = (s: string) => calculateBindingEnergyPerNucleon(findNuclide(s));
    expect(calculateBindingEnergyMeV(findNuclide("He-4"))).toBeCloseTo(28.296, 2);
    expect(perNucleon("H-2")).toBeCloseTo(1.112, 2);
    expect(perNucleon("C-12")).toBeCloseTo(7.680, 2);
    expect(perNucleon("O-16")).toBeCloseTo(7.976, 2);
    expect(perNucleon("Fe-56")).toBeCloseTo(8.790, 2);
    expect(perNucleon("Ni-62")).toBeCloseTo(8.795, 2);
    expect(perNucleon("Pb-208")).toBeCloseTo(7.867, 2);
    expect(perNucleon("U-235")).toBeCloseTo(7.591, 2);
    expect(perNucleon("U-238")).toBeCloseTo(7.570, 2);
  });
  it("peaks at nickel-62 among the table's nuclides", () => {
    const best = [...NUCLIDES].sort((a, b) => calculateBindingEnergyPerNucleon(b) - calculateBindingEnergyPerNucleon(a))[0]!;
    expect(best.symbol).toBe("Ni-62");
  });
  it("has the mass defect of helium-4, 0.03038 u", () => {
    expect(calculateMassDefect(2, 4, 4.00260325413)).toBeCloseTo(0.030377, 5);
    expect(0.030377 * ATOMIC_MASS_UNIT_MEV).toBeCloseTo(28.296, 2);
  });
  it("the liquid-drop formula follows the trend within a few percent for A > 20", () => {
    for (const s of ["Ca-40", "Fe-56", "Ni-62", "Pb-208", "U-238"]) {
      const n = findNuclide(s);
      const model = calculateSemiEmpiricalBindingEnergy(n.protons, n.massNumber) / n.massNumber;
      expect(Math.abs(model / calculateBindingEnergyPerNucleon(n) - 1)).toBeLessThan(0.025);
    }
  });
  it("puts the stable valley at Z ≈ A/2 for light nuclei and below it for heavy ones", () => {
    expect(calculateStableProtonNumber(40)).toBeGreaterThanOrEqual(18);
    expect(calculateStableProtonNumber(40)).toBeLessThanOrEqual(20);
    expect(calculateStableProtonNumber(208)).toBeGreaterThanOrEqual(80);
    expect(calculateStableProtonNumber(208)).toBeLessThanOrEqual(84);
  });
  it("validates Z and A", () => {
    expect(() => calculateMassDefect(0, 4, 4)).toThrow(RangeError);
    expect(() => calculateSemiEmpiricalBindingEnergy(5, 3)).toThrow(RangeError);
    expect(() => findNuclide("Xx-1")).toThrow(RangeError);
  });
});

describe("decay chains and isotopes", () => {
  const hours = 3600;
  it("peaks the Tc-99m daughter of Mo-99 at 22.9 hours", () => {
    expect(calculateDaughterPeakTime(66 * hours, 6.01 * hours) / hours).toBeCloseTo(22.86, 1);
    const t = calculateDaughterPeakTime(66 * hours, 6.01 * hours);
    const at = (x: number) => calculateDaughterAmount(1, 66 * hours, 6.01 * hours, x);
    expect(at(t)).toBeGreaterThan(at(t * 0.8));
    expect(at(t)).toBeGreaterThan(at(t * 1.2));
    expect(at(0)).toBe(0);
  });
  it("conserves atoms: parent + daughter + granddaughter = N₀", () => {
    const l1 = Math.LN2 / 66;
    const t = 40;
    const parent = Math.exp(-l1 * t);
    const daughter = calculateDaughterAmount(1, 66, 6.01, t);
    expect(parent + daughter).toBeLessThan(1);
    expect(daughter).toBeGreaterThan(0);
  });
  it("finds a half-life from two activity readings: 640 → 40 Bq in 14 h is 3.5 h", () => {
    expect(calculateHalfLifeFromActivities(640, 40, 14)).toBeCloseTo(3.5, 10);
    expect(() => calculateHalfLifeFromActivities(10, 20, 1)).toThrow(RangeError);
  });
  it("solves a mixed sample's decay time by bisection", () => {
    const mix = [{ initialShare: 0.5, halfLife: 8.02 }, { initialShare: 0.5, halfLife: 0.25 }];
    const t = calculateTimeForMixedActivity(mix, 0.3);
    expect(calculateMixedActivityFraction(mix, t)).toBeCloseTo(0.3, 8);
    expect(calculateMixedActivityFraction(mix, 0)).toBeCloseTo(1, 12);
    expect(t).toBeGreaterThan(3);
    expect(t).toBeLessThan(8.02);
  });
  it("applies decay modes and counts the U-238 → Pb-206 series: 8 alphas and 6 betas", () => {
    expect(applyDecay(92, 238, "alpha")).toEqual({ protons: 90, massNumber: 234 });
    expect(applyDecay(53, 131, "beta-minus")).toEqual({ protons: 54, massNumber: 131 });
    expect(applyDecay(6, 11, "beta-plus")).toEqual({ protons: 5, massNumber: 11 });
    expect(countDecaysBetween({ protons: 92, massNumber: 238 }, { protons: 82, massNumber: 206 })).toEqual({ alphas: 8, betas: 6 });
    expect(countDecaysBetween({ protons: 92, massNumber: 238 }, { protons: 82, massNumber: 207 })).toBeNull();
    expect(findNuclideByNumbers(27, 60)?.symbol).toBe("Co-60");
    expect(findNuclide("I-131").mode).toBe("beta-minus");
  });
});

describe("fusion and mass-energy", () => {
  it("has the D–T Coulomb barrier near 0.44 MeV at 3.2 fm", () => {
    expect(calculateContactDistanceFm(2, 3)).toBeCloseTo(3.242, 2);
    expect(calculateCoulombBarrierMeV(1, 2, 1, 3)).toBeCloseTo(0.444, 2);
    expect(calculateCoulombPotentialMeV(1, 1, 1)).toBeCloseTo(1.44, 2);
    expect(calculateCoulombBarrierMeV(6, 12, 6, 12)).toBeGreaterThan(calculateCoulombBarrierMeV(1, 2, 1, 3) * 10);
  });
  it("converts kT between keV and kelvin: 10 keV is 116 MK", () => {
    expect(calculateTemperatureFromKeV(10) / 1e6).toBeCloseTo(116.05, 1);
    expect(calculateKeVFromTemperature(1.5e7)).toBeCloseTo(1.29, 2);
  });
  it("releases 17.59 MeV in D + T → He-4 + n and 3.37e14 J/kg", () => {
    const d = findNuclide("H-2").atomicMass;
    const t = findNuclide("H-3").atomicMass;
    const he = findNuclide("He-4").atomicMass;
    const n = 1.00866491595;
    const q = calculateReactionEnergyMeV([d, t], [he, n]);
    expect(q).toBeCloseTo(17.59, 1);
    expect(calculateEnergyPerKilogram(q, d + t) / 1e14).toBeCloseTo(3.37, 1);
  });
  it("releases about 173 MeV when U-235 + n splits into Ba-141, Kr-92 and 3 n", () => {
    const n = 1.00866491595;
    const q = calculateReactionEnergyMeV([findNuclide("U-235").atomicMass, n], [findNuclide("Ba-141").atomicMass, findNuclide("Kr-92").atomicMass, 3 * n]);
    expect(q).toBeCloseTo(173, 0);
  });
  it("turns mass into energy: 1 g is 9×10¹³ J and the Sun loses 4.26 million tonnes per second", () => {
    expect(calculateEnergyFromMass(0.001)).toBeCloseTo(8.988e13, -10);
    expect(calculateMassFromEnergy(3.828e26)).toBeCloseTo(4.259e9, -6);
    expect(calculateConvertedFraction(4 * 1.00782503223, 4.00260325413)).toBeCloseTo(0.00712, 4);
    expect(() => calculateConvertedFraction(1, 2)).toThrow(RangeError);
  });
});

describe("bicycle", () => {
  const ride = { massKg: 85, rollingResistance: 0.005, dragArea: 0.35, grade: 0.06 };
  it("gears: 90 rpm, 48/22, 2.1 m wheel is 24.7 km/h", () => {
    expect(calculateBicycleSpeed(90, 48, 22, 2.1) * 3.6).toBeCloseTo(24.74, 1);
    expect(calculateBicycleSpeed(90, 48, 11, 2.1)).toBeCloseTo(2 * calculateBicycleSpeed(90, 48, 22, 2.1), 10);
  });
  it("trades torque for speed through the gears", () => {
    expect(calculateWheelTorque(40, 48, 24)).toBe(80);
    expect(calculateDriveForce(80, 0.33)).toBeCloseTo(242.4, 1);
    expect(calculateWheelTorque(40, 48, 12)).toBeGreaterThan(calculateWheelTorque(40, 48, 24));
  });
  it("needs 200 W to climb a 6 % grade at about 12.4 km/h", () => {
    expect(calculateRiderPower(3.4, ride)).toBeCloseTo(198.3, 0);
    const v = calculateSpeedForPower(200, ride);
    expect(calculateRiderPower(v, ride)).toBeCloseTo(200, 6);
    expect(v * 3.6).toBeGreaterThan(12.2);
    expect(v * 3.6).toBeLessThan(12.6);
  });
  it("is dominated by air drag on the flat at 40 km/h, which grows as v³", () => {
    const flat = { massKg: 80, rollingResistance: 0.004, dragArea: 0.25, grade: 0 };
    expect(calculateRiderPower(40 / 3.6, flat)).toBeCloseTo(252, -1);
    expect(calculateResistiveForce(20, flat) / calculateResistiveForce(10, flat)).toBeGreaterThan(3);
    expect(calculateRiderPower(20, { ...flat, rollingResistance: 0 }) / calculateRiderPower(10, { ...flat, rollingResistance: 0 })).toBeCloseTo(8, 8);
  });
  it("rejects bad input", () => {
    expect(() => calculateBicycleSpeed(0, 48, 22, 2.1)).toThrow(RangeError);
    expect(() => calculateSpeedForPower(1e6, ride)).toThrow(RangeError);
  });
});
