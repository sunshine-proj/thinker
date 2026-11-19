import { describe, expect, it } from "vitest";
import {
  SUN_LUMINOSITY_FROM_STEFAN_BOLTZMANN,
  calculatePeakWavelength,
  calculateSolarLuminosity,
  calculateSolarRadius,
  calculateTemperatureFromPeak,
  classifySpectralType,
} from "../../src/physics/astronomy";
import { ELECTRON_MASS, SOLAR_LUMINOSITY } from "../../src/physics/core";
import {
  calculateRadiusForReynolds,
  calculateSphereReynolds,
  calculateStokesTerminalSpeed,
  calculateViscosityFromFall,
} from "../../src/physics/fluids";
import {
  SLED_ON_SNOW,
  calculateAccelerationFromForce,
  calculateBrakingDistance,
  calculateCollisionVelocities,
  calculateConstantSpeedAngle,
  calculateCriticalAngle,
  calculateInputPower,
  calculateLiftingPower,
  calculateLiftingWork,
  calculatePushOffSpeeds,
  calculateRollingAcceleration,
  calculateRollingTime,
  calculateRunOutDistance,
  calculateSlopeAcceleration,
  calculateSlopeForRollingTime,
  calculateSpeedAfterPush,
  calculateSpeedAtBottom,
  calculateSpinAfterChange,
  calculateTotalKineticEnergy,
} from "../../src/physics/mechanics";
import {
  calculateDoublingTime,
  calculateMultiplicationFromReactivity,
  calculateReactivity,
  calculateReactivityForPeriod,
  calculateReactorPeriod,
  calculateRodMultiplication,
  isPromptCritical,
} from "../../src/physics/nuclear";
import {
  calculateGratingAngle,
  calculateMinimumPosition,
  calculateReinforcedWavelengths,
  calculateSingleSlitIntensity,
  calculateSpacingFromAngle,
  calculateThinnestFilm,
  calculateTwoBeamFactor,
  calculateWavelengthFromGrating,
  hasOneInversion,
} from "../../src/physics/optics";
import {
  calculateBarrierTransmissionEv,
  calculateBoxEnergy,
  calculateBoxTransitionWavelength,
  calculateBoxWidthForWavelength,
  calculateWidthForTransmission,
} from "../../src/physics/quantum";
import {
  calculateAllOnOneSideProbability,
  calculateBimetalDeflection,
  calculateEntropyChangeInK,
  calculateExpansionGap,
  calculateLinearExpansion,
  calculateSplitProbability,
  countMicrostates,
  simulateEhrenfest,
} from "../../src/physics/thermodynamics";
import { createSeededRandom } from "../../src/physics/nuclear";
import {
  calculateAmplification,
  calculateDopplerFrequency,
  calculatePeakAmplification,
  calculatePendulumFrequency,
  calculateResonantFrequency,
  calculateRestFrequencyFromShift,
  calculateSourceSpeedFromShift,
  simulateDrivenAmplitude,
} from "../../src/physics/waves";

const EV = 1.602176634e-19;

describe("Newton's laws", () => {
  it("follows F = ma, braking v²m/2F and equal-and-opposite push-offs", () => {
    expect(calculateAccelerationFromForce(3, 0.5)).toBe(6);
    expect(calculateSpeedAfterPush(0.5, 3, 0.5)).toBeCloseTo(3, 12);
    expect(calculateSpeedAfterPush(0.5, -1, 1, 4)).toBeCloseTo(2, 12);
    expect(calculateBrakingDistance(0.5, 4, 1)).toBeCloseTo(4, 12);
    const { speedA, speedB } = calculatePushOffSpeeds(120, 0.5, 60, 20);
    expect(speedA).toBeCloseTo(1, 12);
    expect(speedB).toBeCloseTo(3, 12);
    expect(60 * speedA).toBeCloseTo(20 * speedB, 12);
    expect(() => calculateAccelerationFromForce(1, 0)).toThrow(RangeError);
  });
});

describe("sledding", () => {
  it("slips at atan(μs) and glides v²/(2μk g)", () => {
    expect(calculateCriticalAngle(SLED_ON_SNOW)).toBeCloseTo(7.97, 2);
    expect(calculateSlopeAcceleration(15, 0.05)).toBeCloseTo(2.0645, 3);
    const v = calculateSpeedAtBottom(7.126, 15, 0.05);
    expect(calculateRunOutDistance(v, 0.05)).toBeCloseTo(30, 1);
    expect(calculateSpeedAtBottom(5, 1, 0.05)).toBe(0);
    expect(calculateConstantSpeedAngle(0.3)).toBeCloseTo(16.699, 2);
    expect(calculateSlopeAcceleration(calculateConstantSpeedAngle(0.3), 0.3)).toBeCloseTo(0, 12);
  });
});

describe("1D collisions", () => {
  it("conserves momentum for every restitution and keeps energy only when elastic", () => {
    expect(calculateCollisionVelocities(1, 3, 1, 0, 1)).toEqual({ velocityA: 0, velocityB: 3 });
    const stuck = calculateCollisionVelocities(2, 3, 1, 0, 0);
    expect(stuck.velocityA).toBeCloseTo(2, 12);
    expect(stuck.velocityB).toBeCloseTo(2, 12);
    const bounce = calculateCollisionVelocities(1, 3, 2, 0, 1);
    expect(bounce.velocityA).toBeCloseTo(-1, 12);
    expect(bounce.velocityB).toBeCloseTo(2, 12);
    expect(calculateTotalKineticEnergy([{ massKg: 1, speed: -1 }, { massKg: 2, speed: 2 }])).toBeCloseTo(4.5, 12);
    expect(calculateCollisionVelocities(1, 3, 1, 0, 0.6).velocityB).toBeCloseTo(2.4, 12);
    for (const e of [0, 0.3, 0.7, 1]) {
      const r = calculateCollisionVelocities(1.5, 2, 0.5, -1, e);
      expect(1.5 * r.velocityA + 0.5 * r.velocityB).toBeCloseTo(1.5 * 2 + 0.5 * -1, 12);
    }
    expect(() => calculateCollisionVelocities(1, 1, 1, 0, 1.2)).toThrow(RangeError);
  });
});

describe("work and power", () => {
  it("lifts 800 kg by 30 m in 20 s with 11.8 kW", () => {
    const work = calculateLiftingWork(800, 30);
    expect(work).toBeCloseTo(235_359.6, 1);
    expect(work / 20).toBeCloseTo(calculateLiftingPower(800, 1.5), 6);
    expect(calculateInputPower(1000, 0.8)).toBe(1250);
    expect(() => calculateInputPower(1000, 0)).toThrow(RangeError);
  });
});

describe("rolling", () => {
  it("makes a disc beat a hoop and finds the slope for a target time", () => {
    const disc = calculateRollingAcceleration(0.5, 10);
    const hoop = calculateRollingAcceleration(1, 10);
    expect(disc).toBeCloseTo(1.1353, 3);
    expect(hoop / disc).toBeCloseTo(0.75, 12);
    expect(calculateSlopeForRollingTime(2, 1.5, 0.4)).toBeCloseTo(14.70, 1);
    expect(calculateRollingTime(2, 0.4, calculateSlopeForRollingTime(2, 1.5, 0.4))).toBeCloseTo(1.5, 9);
    expect(calculateSpinAfterChange(3.5, 3, 1.2)).toBeCloseTo(8.75, 12);
  });
});

describe("thermal expansion", () => {
  it("leaves 9 mm in a 25 m steel rail laid at 10 °C for 40 °C summers", () => {
    expect(calculateExpansionGap(25, 12e-6, 10, 40)).toBeCloseTo(0.009, 12);
    expect(calculateExpansionGap(25, 12e-6, 45, 40)).toBe(0);
    expect(calculateLinearExpansion(120, 12e-6, 70)).toBeCloseTo(0.1008, 9);
    expect(calculateBimetalDeflection(0.05, 1e-3, 17.8e-6, 20)).toBeCloseTo(6.675e-4, 9);
  });
});

describe("statistical entropy", () => {
  it("counts microstates and the overwhelming even split", () => {
    expect(countMicrostates(10, 5)).toBe(252);
    expect(countMicrostates(20, 10)).toBe(184_756);
    expect(calculateAllOnOneSideProbability(7)).toBeCloseTo(1 / 128, 12);
    expect(calculateSplitProbability(4, 2)).toBeCloseTo(6 / 16, 12);
    expect(calculateEntropyChangeInK(20, 20, 10)).toBeCloseTo(Math.log(184_756), 9);
    let sum = 0;
    for (let n = 0; n <= 12; n += 1) sum += calculateSplitProbability(12, n);
    expect(sum).toBeCloseTo(1, 12);
  });

  it("relaxes toward an even split in the Ehrenfest model", () => {
    const history = simulateEhrenfest(100, 2000, createSeededRandom(7));
    expect(history[0]).toBe(100);
    const late = history.slice(1000);
    const mean = late.reduce((a, b) => a + b, 0) / late.length;
    expect(Math.abs(mean - 50)).toBeLessThan(5);
    history.forEach((n) => expect(n).toBeGreaterThanOrEqual(0));
  });
});

describe("thin films", () => {
  it("reinforces green at λ/4n in soap and cancels it at λ/4n in a coating", () => {
    expect(hasOneInversion(1, 1.33, 1)).toBe(true);
    expect(hasOneInversion(1, 1.38, 1.52)).toBe(false);
    expect(calculateThinnestFilm(550, 1.33, true)).toBeCloseTo(103.38, 2);
    expect(calculateThinnestFilm(550, 1.38, false, true)).toBeCloseTo(99.64, 2);
    expect(calculateReinforcedWavelengths(300, 1.33, true, 380, 750).map((x) => Math.round(x))).toEqual([532]);
    expect(calculateTwoBeamFactor(1, 1.33, 550, true)).toBeLessThan(0.001);
    expect(calculateTwoBeamFactor(103.383, 1.33, 550, true)).toBeCloseTo(1, 6);
  });
});

describe("diffraction", () => {
  it("measures a He–Ne laser, a CD and a hair", () => {
    const d = 1e-3 / 600;
    expect(calculateGratingAngle(d, 632.8e-9)).toBeCloseTo(22.31, 2);
    expect(calculateWavelengthFromGrating(d, calculateGratingAngle(d, 632.8e-9))).toBeCloseTo(632.8e-9, 15);
    expect(calculateSpacingFromAngle(650e-9, 23.9)).toBeCloseTo(1.6044e-6, 9);
    expect(calculateMinimumPosition(106.4e-6, 532e-9, 2)).toBeCloseTo(0.01, 4);
    expect(calculateSingleSlitIntensity(1e-4, 500e-9, 1, 0)).toBe(1);
    expect(calculateSingleSlitIntensity(1e-4, 500e-9, 1, calculateMinimumPosition(1e-4, 500e-9, 1))).toBeLessThan(1e-20);
    expect(() => calculateGratingAngle(d, 2e-6)).toThrow(RangeError);
  });
});

describe("resonance", () => {
  it("swings a 2.5 m swing at 0.315 Hz and peaks at 1/(2ζ√(1−ζ²))", () => {
    expect(calculatePendulumFrequency(2.5)).toBeCloseTo(0.31522, 4);
    expect(calculatePeakAmplification(0.05)).toBeCloseTo(10.0125, 3);
    expect(calculateAmplification(calculateResonantFrequency(1, 0.05), 1, 0.05)).toBeCloseTo(calculatePeakAmplification(0.05), 9);
    expect(calculateAmplification(0, 1, 0.05)).toBeCloseTo(1, 12);
    expect(calculateAmplification(10, 1, 0.05)).toBeLessThan(0.02);
  });

  it("agrees with a numerical integration of the driven oscillator", () => {
    for (const ratio of [0.5, 1, 1.5]) {
      expect(simulateDrivenAmplitude(ratio, 1, 0.05) / calculateAmplification(ratio, 1, 0.05)).toBeCloseTo(1, 2);
    }
  });
});

describe("Doppler effect", () => {
  it("raises an approaching siren and recovers speed and pitch from the shift", () => {
    expect(calculateDopplerFrequency(700, 343, 0, 27.079)).toBeCloseTo(760, 1);
    expect(calculateDopplerFrequency(700, 343, 0, -30)).toBeCloseTo(643.7, 1);
    expect(calculateDopplerFrequency(500, 343, 13.72, 0)).toBeCloseTo(520, 1);
    expect(calculateSourceSpeedFromShift(750, 650, 343)).toBeCloseTo(24.5, 9);
    expect(calculateRestFrequencyFromShift(750, 650)).toBeCloseTo(696.43, 2);
    const v = 24.5;
    expect(calculateDopplerFrequency(696.4286, 343, 0, v)).toBeCloseTo(750, 1);
    expect(() => calculateDopplerFrequency(700, 343, 0, 400)).toThrow(RangeError);
  });
});

describe("stars", () => {
  it("applies Wien's and the Stefan–Boltzmann laws", () => {
    expect(calculateTemperatureFromPeak(290e-9)).toBeCloseTo(9992, 0);
    expect(calculatePeakWavelength(5772) * 1e9).toBeCloseTo(502, 0);
    expect(SUN_LUMINOSITY_FROM_STEFAN_BOLTZMANN / SOLAR_LUMINOSITY).toBeCloseTo(1, 2);
    expect(calculateSolarLuminosity(1, 5772)).toBeCloseTo(1, 12);
    expect(calculateSolarRadius(1e5, 3600)).toBeCloseTo(812.9, 0);
    expect(calculateSolarLuminosity(0.0084, 25_000)).toBeCloseTo(0.02483, 4);
    expect(classifySpectralType(5772)).toBe("G");
    expect(classifySpectralType(3600)).toBe("M");
    expect(classifySpectralType(35_000)).toBe("O");
  });
});

describe("quantisation and tunnelling", () => {
  it("sizes a 600 nm quantum dot and scales levels as n²/L²", () => {
    const width = calculateBoxWidthForWavelength(2, 1, ELECTRON_MASS, 600e-9);
    expect(width * 1e9).toBeCloseTo(0.7389, 3);
    expect(calculateBoxTransitionWavelength(2, 1, ELECTRON_MASS, width)).toBeCloseTo(600e-9, 15);
    expect(calculateBoxEnergy(3, ELECTRON_MASS, 1e-9) / calculateBoxEnergy(1, ELECTRON_MASS, 1e-9)).toBeCloseTo(9, 12);
    expect(calculateBoxEnergy(1, ELECTRON_MASS, 1e-9) / EV).toBeCloseTo(0.376, 3);
  });

  it("matches the wide-barrier approximation and is transparent at resonance above the barrier", () => {
    const kappa = Math.sqrt(2 * ELECTRON_MASS * 4 * EV) / (6.62607015e-34 / (2 * Math.PI));
    const approx = (16 * 1 * 4) / 25 * Math.exp(-2 * kappa * 0.5e-9);
    expect(calculateBarrierTransmissionEv(1, 5, 0.5, ELECTRON_MASS) / approx).toBeCloseTo(1, 2);
    const width = calculateWidthForTransmission(EV, 5 * EV, ELECTRON_MASS, 0.01);
    expect(calculateBarrierTransmissionEv(1, 5, width * 1e9, ELECTRON_MASS)).toBeCloseTo(0.01, 6);
    expect(width * 1e9).toBeCloseTo(0.2705, 3);
    // Above the barrier, k a = π gives full transmission.
    const k = Math.PI / 1e-9;
    const energyAbove = 1 * EV + ((6.62607015e-34 / (2 * Math.PI)) * k) ** 2 / (2 * ELECTRON_MASS);
    expect(calculateBarrierTransmissionEv(energyAbove / EV, 1, 1, ELECTRON_MASS)).toBeCloseTo(1, 9);
    expect(calculateBarrierTransmissionEv(1, 5, 50, ELECTRON_MASS)).toBe(0);
  });
});

describe("Stokes' law", () => {
  it("drops a 1 mm steel ball through glycerol at about 1 cm/s", () => {
    const v = calculateStokesTerminalSpeed(7850, 1260, 1e-3, 1.41);
    expect(v).toBeCloseTo(0.010185, 5);
    expect(calculateViscosityFromFall(7850, 1260, 1e-3, v)).toBeCloseTo(1.41, 9);
    expect(calculateSphereReynolds(1260, v, 1e-3, 1.41)).toBeLessThan(0.05);
    const r = calculateRadiusForReynolds(7850, 1260, 1.41, 1);
    expect(r * 1000).toBeCloseTo(3.80, 1);
    expect(calculateSphereReynolds(1260, calculateStokesTerminalSpeed(7850, 1260, r, 1.41), r, 1.41)).toBeCloseTo(1, 9);
    expect(calculateStokesTerminalSpeed(500, 1000, 1e-3, 1e-3)).toBeLessThan(0);
  });
});

describe("reactor control", () => {
  it("is critical at k = 1 and doubles its power in 60 s at ρ ≈ 0.00082", () => {
    expect(calculateRodMultiplication(1.05, 0.1, 0.5)).toBeCloseTo(1, 12);
    expect(calculateReactorPeriod(0)).toBe(Number.POSITIVE_INFINITY);
    const period = 60 / Math.LN2;
    const rho = calculateReactivityForPeriod(period);
    expect(rho).toBeCloseTo(0.00082, 5);
    expect(calculateReactorPeriod(rho)).toBeCloseTo(period, 9);
    expect(calculateDoublingTime(calculateReactorPeriod(calculateReactivity(calculateMultiplicationFromReactivity(rho))))).toBeCloseTo(60, 6);
    expect(calculateReactorPeriod(-0.001)).toBeLessThan(0);
    expect(isPromptCritical(1.0166)).toBe(true);
    expect(isPromptCritical(1.001)).toBe(false);
    expect(() => calculateReactorPeriod(0.007)).toThrow(RangeError);
  });
});
