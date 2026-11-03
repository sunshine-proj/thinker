import { describe, expect, it } from "vitest";
import {
  ASTRONOMICAL_UNIT as AU, ELECTRON_MASS, ELEMENTARY_CHARGE as E, JULIAN_YEAR as YEAR, NEUTRON_MASS, PROTON_MASS, SEAWATER_DENSITY,
  SUN_GRAVITATIONAL_PARAMETER as MU, FRESH_WATER_DENSITY, ATMOSPHERIC_PRESSURE,
} from "../../src/physics/core";
import {
  SOLAR_MASS, calculateApoapsisAfterBurn, calculateHohmannTransfer, calculateIscoRadius, calculateMassFromSchwarzschildRadius,
  calculatePhotonSphereRadius, calculateSchwarzschildRadius, calculateTimeDilationFactor, classifyCircularOrbit,
} from "../../src/physics/astronomy";
import {
  ELECTRON_REST_ENERGY_MEV, HC_EV_NM, PROTON_REST_ENERGY_MEV, calculateBohrEnergy, calculateBohrRadius, calculateClassicalKineticEnergyMeV,
  calculateDeBroglieWavelength, calculateElectronWavelengthFromVoltage, calculateGyroradius, calculateInterferometerProbability,
  calculateIonizationEnergy, calculateKineticEnergyMeV, calculateMatterFringeSpacing, calculateMaximumKineticEnergyEv, calculateMomentumFromKineticEnergy,
  calculateMomentumFromRadius, calculatePhotonEnergyEv, calculatePolarizerChainTransmission, calculateProbabilityZero, calculateSpeedForWavelength,
  calculateStoppingPotential, calculateThresholdWavelengthNm, calculateTransitionEnergy, calculateTransitionWavelengthNm, calculateVoltageForWavelength,
  calculateWavelengthForKineticEnergy, calculateWavelengthFromSpeed, classifyWavelength, isNormalized, sampleMeasurements,
} from "../../src/physics/quantum";
import {
  calculateActivity, calculateDecayConstant, calculateNucleiInMass, calculateRemainingFraction, calculateStandardDeviation,
  calculateTimeForFraction, createSeededRandom, simulateDecay,
} from "../../src/physics/nuclear";
import {
  calculateDepthForGaugePressure, calculateDraft, calculateForceOnSurface, calculateGaugePressure, calculateMetacentricHeight, calculatePressure,
} from "../../src/physics/fluids";

describe("Hohmann transfer", () => {
  const t = calculateHohmannTransfer(MU, AU, 1.5 * AU);
  it("matches the textbook Earth→1.5 AU values", () => {
    expect(t.semiMajorAxis / AU).toBeCloseTo(1.25, 10);
    expect(t.departureDeltaV / 1000).toBeCloseTo(2.842, 2);
    expect(t.arrivalDeltaV / 1000).toBeCloseTo(2.3, 0);
    expect(t.transferTime / YEAR).toBeCloseTo(1.25 ** 1.5 / 2, 4);
    expect(t.transferTime / 86400).toBeCloseTo(255.2, 0);
    expect((t.leadAngle * 180) / Math.PI).toBeCloseTo(43.06, 1);
  });
  it("gives the classic Earth→Mars figures (2.94 km/s, 259 days)", () => {
    const mars = calculateHohmannTransfer(MU, AU, 1.524 * AU);
    expect(mars.departureDeltaV / 1000).toBeCloseTo(2.94, 1);
    expect(mars.transferTime / 86400).toBeCloseTo(259, 0);
  });
  it("round-trips through vis-viva: the burn lands the apoapsis on the target", () => {
    const speed = Math.sqrt(MU / AU) + t.departureDeltaV;
    expect(calculateApoapsisAfterBurn(MU, AU, speed)! / AU).toBeCloseTo(1.5, 8);
    expect(calculateApoapsisAfterBurn(MU, AU, Math.sqrt((2 * MU) / AU) * 1.01)).toBeNull();
  });
  it("needs a negative departure burn to go inward and rejects bad input", () => {
    expect(calculateHohmannTransfer(MU, AU, 0.7 * AU).departureDeltaV).toBeLessThan(0);
    expect(() => calculateHohmannTransfer(0, AU, AU)).toThrow(RangeError);
  });
});

describe("Schwarzschild black holes", () => {
  it("has r_s = 2.953 km per solar mass", () => {
    expect(calculateSchwarzschildRadius(SOLAR_MASS) / 1000).toBeCloseTo(2.953, 2);
    expect(calculateSchwarzschildRadius(5.972e24) * 1000).toBeCloseTo(8.87, 1);
    expect(calculateMassFromSchwarzschildRadius(30_000) / SOLAR_MASS).toBeCloseTo(10.16, 1);
  });
  it("slows clocks by √(1 − r_s/r): half rate at 4/3 r_s, nothing at the horizon", () => {
    expect(calculateTimeDilationFactor(4 / 3, 1)).toBeCloseTo(0.5, 12);
    expect(calculateTimeDilationFactor(1e9, 1)).toBeCloseTo(1, 8);
    expect(() => calculateTimeDilationFactor(1, 1)).toThrow(RangeError);
  });
  it("puts the photon sphere at 1.5 r_s and the ISCO at 3 r_s and classifies orbits", () => {
    expect(calculatePhotonSphereRadius(10)).toBe(15);
    expect(calculateIscoRadius(10)).toBe(30);
    expect(classifyCircularOrbit(5, 10)).toBe("inside-horizon");
    expect(classifyCircularOrbit(12, 10)).toBe("no-orbit");
    expect(classifyCircularOrbit(20, 10)).toBe("unstable");
    expect(classifyCircularOrbit(30, 10)).toBe("stable");
  });
});

describe("Bohr model", () => {
  it("has hydrogen levels −13.6/n² eV and He⁺ four times deeper", () => {
    expect(calculateBohrEnergy(1, 1)).toBeCloseTo(-13.6057, 3);
    expect(calculateBohrEnergy(1, 2)).toBeCloseTo(-3.4014, 3);
    expect(calculateBohrEnergy(2, 1)).toBeCloseTo(-54.4228, 3);
    expect(calculateIonizationEnergy(2, 4)).toBeCloseTo(3.4014, 3);
    expect(calculateIonizationEnergy(3, 6)).toBeCloseTo(3.4014, 3);
  });
  it("reproduces the Balmer lines: 656 nm (3→2), 486 nm (4→2), 434 nm (5→2)", () => {
    expect(calculateTransitionWavelengthNm(1, 3, 2)).toBeCloseTo(656.1, 0);
    expect(calculateTransitionWavelengthNm(1, 4, 2)).toBeCloseTo(486.0, 0);
    expect(calculateTransitionWavelengthNm(1, 5, 2)).toBeCloseTo(433.9, 0);
    expect(calculateTransitionWavelengthNm(1, 2, 1)).toBeCloseTo(121.5, 0);
    expect(calculateTransitionEnergy(1, 4, 2)).toBeCloseTo(2.551, 3);
    expect(HC_EV_NM).toBeCloseTo(1239.84, 1);
  });
  it("has the Bohr radius a₀ = 52.9 pm for n = 1 and scales as n²/Z", () => {
    expect(calculateBohrRadius(1, 1)).toBeCloseTo(5.29e-11, 13);
    expect(calculateBohrRadius(2, 3)).toBeCloseTo(5.29177e-11 * 9 / 2, 14);
  });
  it("classifies wavelengths and validates input", () => {
    expect(classifyWavelength(121)).toBe("ultraviolet");
    expect(classifyWavelength(656)).toBe("visible");
    expect(classifyWavelength(1875)).toBe("infrared");
    expect(() => calculateTransitionEnergy(1, 2, 2)).toThrow(RangeError);
    expect(() => calculateBohrEnergy(0, 1)).toThrow(RangeError);
    expect(() => calculateBohrEnergy(1, 1.5)).toThrow(RangeError);
  });
});

describe("tracks in a magnetic field", () => {
  it("makes a proton's track 1836 times wider than an electron's", () => {
    const rp = calculateGyroradius(PROTON_MASS, E, 1e6, 0.01);
    const re = calculateGyroradius(ELECTRON_MASS, E, 1e6, 0.01);
    expect(rp).toBeCloseTo(1.0443, 3);
    expect(rp / re).toBeCloseTo(PROTON_MASS / ELECTRON_MASS, 3);
  });
  it("makes an alpha particle's track twice a proton's at the same speed", () => {
    expect(calculateGyroradius(4 * PROTON_MASS, 2 * E, 1e6, 0.01) / calculateGyroradius(PROTON_MASS, E, 1e6, 0.01)).toBeCloseTo(2, 3);
  });
  it("gets momentum from radius, pc[MeV] = 299.79 B r", () => {
    const p = calculateMomentumFromRadius(E, 0.5, 0.1);
    expect((p * 299792458) / E / 1e6).toBeCloseTo(14.99, 2);
  });
  it("finds the relativistic kinetic energy of a 15 MeV/c electron, far from the classical value", () => {
    const p = calculateMomentumFromRadius(E, 0.5, 0.1);
    expect(calculateKineticEnergyMeV(p, ELECTRON_REST_ENERGY_MEV)).toBeCloseTo(14.49, 1);
    expect(calculateClassicalKineticEnergyMeV(p, ELECTRON_MASS)).toBeGreaterThan(200);
    expect(ELECTRON_REST_ENERGY_MEV).toBeCloseTo(0.511, 3);
    expect(PROTON_REST_ENERGY_MEV).toBeCloseTo(938.27, 1);
  });
  it("inverts kinetic energy and momentum, and agrees with classical at low speed", () => {
    const p = calculateMomentumFromKineticEnergy(14.49, ELECTRON_REST_ENERGY_MEV);
    expect(calculateKineticEnergyMeV(p, ELECTRON_REST_ENERGY_MEV)).toBeCloseTo(14.49, 8);
    const slow = calculateMomentumFromKineticEnergy(1, PROTON_REST_ENERGY_MEV);
    expect(calculateKineticEnergyMeV(slow, PROTON_REST_ENERGY_MEV) / calculateClassicalKineticEnergyMeV(slow, PROTON_MASS)).toBeCloseTo(1, 2);
  });
  it("rejects invalid input", () => {
    expect(() => calculateGyroradius(PROTON_MASS, 0, 1e6, 0.01)).toThrow(RangeError);
    expect(() => calculateGyroradius(PROTON_MASS, E, 3e8, 0.01)).toThrow(RangeError);
  });
});

describe("matter waves", () => {
  it("gives 0.1226 nm for a 100 V electron and 0.1 nm at 150.4 V", () => {
    expect(calculateElectronWavelengthFromVoltage(100) * 1e9).toBeCloseTo(0.1227, 3);
    expect(calculateVoltageForWavelength(0.1e-9)).toBeCloseTo(150.4, 1);
    expect(calculateElectronWavelengthFromVoltage(calculateVoltageForWavelength(0.2e-9))).toBeCloseTo(0.2e-9, 15);
  });
  it("gives a baseball a hopelessly small wavelength", () => {
    expect(calculateWavelengthFromSpeed(0.145, 40)).toBeLessThan(1.2e-34);
  });
  it("matches the neutron speed to an electron wavelength: 3.2 km/s", () => {
    const lambda = calculateElectronWavelengthFromVoltage(100);
    expect(calculateSpeedForWavelength(NEUTRON_MASS, lambda)).toBeCloseTo(3224, -1);
    expect(calculateDeBroglieWavelength(NEUTRON_MASS * 3224)).toBeCloseTo(lambda, 11);
  });
  it("spaces the fringes by λL/d: 0.2 nm, 1 m, 1 µm gives 0.2 mm", () => {
    expect(calculateMatterFringeSpacing(0.2e-9, 1, 1e-6)).toBeCloseTo(0.2e-3, 10);
  });
  it("rejects relativistic voltages and non-positive input", () => {
    expect(() => calculateElectronWavelengthFromVoltage(50_000)).toThrow(RangeError);
    expect(() => calculateDeBroglieWavelength(0)).toThrow(RangeError);
  });
});

describe("two-state quantum systems", () => {
  it("gives P(0) = cos²(θ/2): 1 at 0°, ½ at 90°, ¼ at 120°, 0 at 180°", () => {
    expect(calculateProbabilityZero(0)).toBeCloseTo(1, 12);
    expect(calculateProbabilityZero(Math.PI / 2)).toBeCloseTo(0.5, 12);
    expect(calculateProbabilityZero((2 * Math.PI) / 3)).toBeCloseTo(0.25, 12);
    expect(calculateProbabilityZero(Math.PI)).toBeCloseTo(0, 12);
  });
  it("gives the interferometer output cos²(φ/2)", () => {
    expect(calculateInterferometerProbability(0)).toBeCloseTo(1, 12);
    expect(calculateInterferometerProbability(Math.PI)).toBeCloseTo(0, 12);
    expect(calculateInterferometerProbability(Math.PI / 3)).toBeCloseTo(0.75, 12);
    expect(calculateInterferometerProbability(5 * Math.PI / 3)).toBeCloseTo(0.75, 12);
  });
  it("blocks crossed polarizers but passes 25 % through a 45° third, 18.75 % at 30°", () => {
    const rad = (d: number) => (d * Math.PI) / 180;
    expect(calculatePolarizerChainTransmission(0, [rad(90)])).toBeCloseTo(0, 12);
    expect(calculatePolarizerChainTransmission(0, [rad(45), rad(90)])).toBeCloseTo(0.25, 12);
    expect(calculatePolarizerChainTransmission(0, [rad(30), rad(90)])).toBeCloseTo(0.1875, 12);
    expect(calculatePolarizerChainTransmission(0, [rad(60), rad(90)])).toBeCloseTo(0.1875, 12);
  });
  it("checks normalization and samples measurement counts that approach the probability", () => {
    expect(isNormalized([Math.SQRT1_2, Math.SQRT1_2])).toBe(true);
    expect(isNormalized([1, 1])).toBe(false);
    const random = createSeededRandom(7);
    expect(sampleMeasurements(0.25, 20_000, random) / 20_000).toBeCloseTo(0.25, 1);
    expect(() => sampleMeasurements(1.5, 10, random)).toThrow(RangeError);
  });
});

describe("radioactive decay", () => {
  it("halves every half-life and gives 12.5 % after three", () => {
    expect(calculateRemainingFraction(8.02, 8.02)).toBeCloseTo(0.5, 12);
    expect(calculateRemainingFraction(8.02, 24.06)).toBeCloseTo(0.125, 12);
    expect(calculateTimeForFraction(8.02, 0.125)).toBeCloseTo(24.06, 10);
    expect(calculateTimeForFraction(8.02, 1)).toBe(0);
    expect(() => calculateTimeForFraction(8.02, 0)).toThrow(RangeError);
  });
  it("has λ = ln2/T½ and an activity A = λN: 1 µg of Am-241 is 127 kBq", () => {
    const lambda = calculateDecayConstant(432.2 * YEAR);
    expect(lambda).toBeCloseTo(5.08e-11, 12);
    const n = calculateNucleiInMass(1e-9, 0.241);
    expect(n).toBeCloseTo(2.499e15, -12);
    expect(calculateActivity(lambda, n) / 1000).toBeCloseTo(127, 0);
  });
  it("scatters a 1000-nucleus sample about the expectation by √(Np(1−p))", () => {
    const p = calculateRemainingFraction(10, 25);
    const sigma = calculateStandardDeviation(1000, p);
    expect(1000 * p).toBeCloseTo(176.8, 1);
    expect(sigma).toBeCloseTo(12.06, 1);
    const counts = Array.from({ length: 200 }, (_, i) => simulateDecay(1000, 10, 25, createSeededRandom(i + 1)));
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const sd = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length);
    expect(mean).toBeCloseTo(176.8, -1);
    expect(sd).toBeGreaterThan(sigma * 0.8);
    expect(sd).toBeLessThan(sigma * 1.2);
  });
  it("repeats the same random numbers for the same seed and rejects bad samples", () => {
    expect(simulateDecay(500, 10, 10, createSeededRandom(3))).toBe(simulateDecay(500, 10, 10, createSeededRandom(3)));
    expect(() => simulateDecay(-1, 10, 1, createSeededRandom(1))).toThrow(RangeError);
    expect(() => calculateDecayConstant(0)).toThrow(RangeError);
  });
});

describe("photoelectric effect", () => {
  it("has photon energy 1239.84/λ: 4.96 eV at 250 nm, 3.10 eV at 400 nm", () => {
    expect(calculatePhotonEnergyEv(250)).toBeCloseTo(4.959, 3);
    expect(calculatePhotonEnergyEv(400)).toBeCloseTo(3.0996, 3);
  });
  it("gives K = hf − φ and zero below threshold", () => {
    expect(calculateMaximumKineticEnergyEv(250, 2.3)).toBeCloseTo(2.659, 3);
    expect(calculateStoppingPotential(250, 2.3)).toBeCloseTo(2.659, 3);
    expect(calculateMaximumKineticEnergyEv(600, 2.28)).toBe(0);
    expect(calculateThresholdWavelengthNm(2.28)).toBeCloseTo(543.8, 1);
  });
  it("finds the wavelength for a chosen energy and round-trips", () => {
    const nm = calculateWavelengthForKineticEnergy(1, 2.28);
    expect(nm).toBeCloseTo(378.0, 0);
    expect(calculateMaximumKineticEnergyEv(nm, 2.28)).toBeCloseTo(1, 8);
    expect(() => calculateWavelengthForKineticEnergy(-1, 2)).toThrow(RangeError);
  });
});

describe("hydrostatics and buoyancy", () => {
  it("adds ρgh to the surface pressure: about one atmosphere every 10 m of fresh water", () => {
    expect(calculatePressure(0, 1000)).toBe(ATMOSPHERIC_PRESSURE);
    expect(calculateGaugePressure(10, FRESH_WATER_DENSITY) / 1000).toBeCloseTo(98.07, 1);
    expect(calculatePressure(10.33, 1000) / ATMOSPHERIC_PRESSURE).toBeCloseTo(2, 2);
    expect(calculateDepthForGaugePressure(2 * ATMOSPHERIC_PRESSURE, SEAWATER_DENSITY)).toBeCloseTo(20.16, 1);
    expect(calculateDepthForGaugePressure(300_000, 1000)).toBeCloseTo(30.59, 2);
  });
  it("computes the force on a submarine window", () => {
    const area = Math.PI * 0.15 ** 2;
    expect(calculateForceOnSurface(70.4, area, SEAWATER_DENSITY) / 1000).toBeCloseTo(50, 0);
  });
  it("floats a barge at draft m/(ρlw), deeper in fresh water than in the sea", () => {
    expect(calculateDraft(240_000, 20, 6, 1000)).toBeCloseTo(2, 10);
    expect(calculateDraft(240_000, 20, 6, 1025)).toBeLessThan(2);
    expect(calculateDraft(369_000, 20, 6, 1025)).toBeCloseTo(3, 10);
  });
  it("computes the metacentric height: a wider hull is more stable, GM > 0 needed", () => {
    const gm = (w: number) => calculateMetacentricHeight(calculateDraft(120_000, 20, w, 1025), w, 1.5);
    expect(gm(4)).toBeCloseTo(0.14, 1);
    expect(gm(5.5)).toBeCloseTo(1.4, 1);
    expect(gm(3)).toBeLessThan(0);
    expect(gm(6)).toBeGreaterThan(gm(5));
  });
  it("rejects non-physical input", () => {
    expect(() => calculatePressure(-1, 1000)).toThrow(RangeError);
    expect(() => calculateDraft(1, 1, 0, 1000)).toThrow(RangeError);
    expect(() => calculateMetacentricHeight(0, 1, 1)).toThrow(RangeError);
  });
});
