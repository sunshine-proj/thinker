import { describe, expect, it } from "vitest";
import {
  ASTRONOMICAL_UNIT as AU, EARTH_GRAVITATIONAL_PARAMETER as MU_E, EARTH_MEAN_RADIUS as R_E, GRAVITATIONAL_CONSTANT as G,
  JULIAN_YEAR as YEAR, SUN_GRAVITATIONAL_PARAMETER as MU_SUN, Vector2,
} from "../../src/physics/core";
import {
  calculateEyepieceMagnification, calculateImageDistance, calculateMagnification, calculateMicroscopeMagnification,
  calculateObjectiveMagnification, calculateResolutionLimit, calculateSpecimenDistance, calculateUsefulMagnificationLimit,
} from "../../src/physics/optics";
import {
  calculateAmplitudeRatio, calculateBeatFrequency, calculateEchoDelay, calculateEchoDistance, calculateFringeSpacing,
  calculateFrettedFrequency, calculateFundamental, calculateHarmonicAmplitude, calculateLevelChangeDecibels, calculateMinimumEchoDistance,
  calculateModeShape, calculateNoteFrequency, calculatePathDifference, calculatePeriod, calculateRelativeIntensity, calculateResolutionTime,
  calculateScreenIntensity, calculateSlitSeparation, calculateSpectrum, calculateSpeedOfSound, calculateStringFrequency,
  calculateStringWaveSpeed, calculateTemperatureFromSpeed, calculateTensionForFrequency, calculateTouchedHarmonic, calculateTravelTime,
  calculateWavelength, classifyInterference, createWaveGrid, findSpectralPeaks, gaussianPulse, sampleTones, simulateWave, stepsForDuration,
  synthesizeHarmonics,
} from "../../src/physics/waves";
import {
  calculateEscapeSpeedAt, calculateExcessToLeaveStar, calculateLaunchSpeedForExcess, calculateMaximumRadius, calculateMeanDensity,
  calculatePlanetEscapeSpeed, calculatePlanetPropertiesFromEarthUnits, calculateSpecificEnergy, calculateSurfaceGravity,
  calculateTotalAngularMomentum, calculateTotalEnergy, calculateTotalMomentum, doesEscape, integrateNBody, measureOrbitalPeriod, type Body,
} from "../../src/physics/astronomy";

describe("compound microscope", () => {
  it("multiplies objective (L/fₒ) and eyepiece (25 cm/fₑ) magnifications", () => {
    expect(calculateObjectiveMagnification(0.16, 0.004)).toBeCloseTo(40, 10);
    expect(calculateEyepieceMagnification(0.025)).toBeCloseTo(10, 10);
    expect(calculateMicroscopeMagnification(0.16, 0.004, 0.025)).toBeCloseTo(400, 8);
  });

  it("agrees with the thin-lens equation for the objective: m = −dᵢ/dₒ = −L/fₒ", () => {
    const f = 0.004;
    const L = 0.16;
    const dObject = calculateSpecimenDistance(L, f);
    expect(dObject).toBeCloseTo((f * (f + L)) / L, 12);
    const dImage = calculateImageDistance(f, dObject);
    expect(dImage).toBeCloseTo(f + L, 9);
    expect(Math.abs(calculateMagnification(dObject, dImage!))).toBeCloseTo(L / f, 6);
    expect(dObject).toBeGreaterThan(f);
  });

  it("limits resolution with d = 0.61 λ/NA and the useful magnification with 1000 NA", () => {
    expect(calculateResolutionLimit(550e-9, 0.9) * 1e9).toBeCloseTo(372.8, 1);
    expect(calculateResolutionLimit(550e-9, 0.671) * 1e9).toBeCloseTo(500, 0);
    expect(calculateUsefulMagnificationLimit(0.9)).toBe(900);
  });

  it("rejects invalid inputs", () => {
    expect(() => calculateObjectiveMagnification(0, 0.004)).toThrow(RangeError);
    expect(() => calculateEyepieceMagnification(-1)).toThrow(RangeError);
    expect(() => calculateResolutionLimit(550e-9, 2)).toThrow(RangeError);
    expect(() => calculateResolutionLimit(550e-9, 0)).toThrow(RangeError);
  });
});

describe("tones and decibels", () => {
  it("has period 1/f and wavelength v/f", () => {
    expect(calculatePeriod(440)).toBeCloseTo(1 / 440, 12);
    expect(calculateWavelength(343)).toBeCloseTo(1, 10);
    expect(calculateWavelength(686, 343)).toBeCloseTo(0.5, 10);
  });

  it("uses equal temperament: A4 = 440 Hz, C5 = 523.25 Hz, an octave doubles the frequency", () => {
    expect(calculateNoteFrequency(69)).toBeCloseTo(440, 10);
    expect(calculateNoteFrequency(72)).toBeCloseTo(523.2511, 3);
    expect(calculateNoteFrequency(81) / calculateNoteFrequency(69)).toBeCloseTo(2, 10);
  });

  it("converts amplitude ratios to decibels: ×2 = 6.02 dB, ×10 = 20 dB, and back", () => {
    expect(calculateLevelChangeDecibels(0.2, 0.1)).toBeCloseTo(6.0206, 3);
    expect(calculateLevelChangeDecibels(1, 0.1)).toBeCloseTo(20, 10);
    expect(calculateAmplitudeRatio(10)).toBeCloseTo(3.1623, 4);
    expect(calculateLevelChangeDecibels(0.1 * calculateAmplitudeRatio(10), 0.1)).toBeCloseTo(10, 10);
    expect(() => calculateLevelChangeDecibels(0, 0.1)).toThrow(RangeError);
  });

  it("builds a square wave from odd harmonics 1, 1/3, 1/5, … which flattens toward ±π/4 · 4/π", () => {
    expect(calculateHarmonicAmplitude("square", 3)).toBeCloseTo(1 / 3, 12);
    expect(calculateHarmonicAmplitude("square", 4)).toBe(0);
    expect(calculateHarmonicAmplitude("triangle", 3)).toBeCloseTo(-1 / 9, 12);
    expect(calculateHarmonicAmplitude("triangle", 5)).toBeCloseTo(1 / 25, 12);
    expect(calculateHarmonicAmplitude("sawtooth", 4)).toBeCloseTo(0.25, 12);
    const amplitudes = Array.from({ length: 199 }, (_, i) => calculateHarmonicAmplitude("square", i + 1));
    // a quarter period in: the series approaches π/4 (Leibniz series)
    expect(synthesizeHarmonics(100, amplitudes, 1 / 400)).toBeCloseTo(Math.PI / 4, 1);
    expect(() => calculateHarmonicAmplitude("square", 0)).toThrow(RangeError);
  });
});

describe("standing waves on a string", () => {
  it("has v = √(T/μ) and fₙ = n v / 2L", () => {
    expect(calculateStringWaveSpeed(100, 0.0004)).toBeCloseTo(500, 8);
    expect(calculateStringFrequency(0.5, 100, 0.0004)).toBeCloseTo(500, 8);
    expect(calculateStringFrequency(0.5, 100, 0.0004, 3)).toBeCloseTo(1500, 8);
  });

  it("round-trips the tension for E4 and shows f ∝ √T", () => {
    const T = calculateTensionForFrequency(0.65, 0.0005, 329.6276);
    expect(T).toBeCloseTo(91.8, 0);
    expect(calculateStringFrequency(0.65, T, 0.0005)).toBeCloseTo(329.6276, 8);
    expect(calculateStringFrequency(0.65, 4 * T, 0.0005) / 329.6276).toBeCloseTo(2, 10);
  });

  it("frets by shortening the length: pressing 16.3 cm of a 0.65 m E2 string gives A2", () => {
    const e2 = calculateNoteFrequency(40);
    const a2 = calculateNoteFrequency(45);
    expect(calculateFrettedFrequency(e2, 0.65, 0.65 * (1 - e2 / a2))).toBeCloseTo(a2, 8);
    expect(0.65 * (1 - e2 / a2)).toBeCloseTo(0.163, 3);
    expect(() => calculateFrettedFrequency(100, 0.65, 0.65)).toThrow(RangeError);
  });

  it("finds the harmonic produced by touching a node", () => {
    expect(calculateTouchedHarmonic(0.5)).toBe(2);
    expect(calculateTouchedHarmonic(1 / 3)).toBe(3);
    expect(calculateTouchedHarmonic(0.25)).toBe(4);
    expect(calculateTouchedHarmonic(0.2)).toBe(5);
    expect(calculateTouchedHarmonic(0.4)).toBe(5);
    expect(calculateTouchedHarmonic(0.37)).toBeNull();
    expect(() => calculateTouchedHarmonic(0)).toThrow(RangeError);
  });

  it("has mode shapes that vanish at both ends and at the right nodes", () => {
    expect(calculateModeShape(3, 0)).toBeCloseTo(0, 12);
    expect(calculateModeShape(3, 1)).toBeCloseTo(0, 12);
    expect(calculateModeShape(3, 1 / 3)).toBeCloseTo(0, 12);
    expect(calculateModeShape(1, 0.5)).toBeCloseTo(1, 12);
  });
});

describe("1-D wave equation solver", () => {
  const grid = createWaveGrid(12, 240);

  it("moves a pulse at the wave speed without changing its shape (Courant number 1)", () => {
    const c = 6;
    const steps = stepsForDuration(grid, c, 1, 0.5);
    const out = simulateWave(grid, c, 1, steps, [{ profile: gaussianPulse(1, 3, 0.5), direction: 1 }]);
    const peakIndex = out.displacement.indexOf(Math.max(...out.displacement));
    expect(peakIndex * grid.dx).toBeCloseTo(3 + c * out.time, 1);
    expect(Math.max(...out.displacement)).toBeCloseTo(1, 3);
    expect(calculateTravelTime(18, c)).toBe(3);
  });

  it("reflects a pulse inverted from a fixed end and returns it after 18 m of travel", () => {
    const c = 6;
    let lowest = 0;
    let atTime = 0;
    simulateWave(grid, c, 1, stepsForDuration(grid, c, 1, 3.5), [{ profile: gaussianPulse(1, 3, 0.5), direction: 1 }], (s) => {
      const u = s.displacement[Math.round(3 / grid.dx)]!;
      if (u < lowest) { lowest = u; atTime = s.time; }
    });
    expect(lowest).toBeCloseTo(-1, 3);
    expect(atTime).toBeCloseTo(3, 1);
  });

  it("superposes exactly: the sum of two runs equals the run of the sum", () => {
    const a = [{ profile: gaussianPulse(0.5, 3, 0.5), direction: 1 as const }];
    const b = [{ profile: gaussianPulse(0.3, 9, 0.5), direction: -1 as const }];
    const steps = stepsForDuration(grid, 3, 1, 1);
    const sumRun = simulateWave(grid, 3, 1, steps, [...a, ...b]).displacement;
    const first = simulateWave(grid, 3, 1, steps, a).displacement;
    const second = simulateWave(grid, 3, 1, steps, b).displacement;
    for (let i = 0; i < sumRun.length; i += 1) {
      expect(sumRun[i]!).toBeCloseTo(first[i]! + second[i]!, 12);
    }
    expect(sumRun[120]!).toBeCloseTo(0.8, 3);
  });

  it("cancels two equal and opposite pulses at the meeting point", () => {
    const steps = stepsForDuration(grid, 3, 1, 1);
    const out = simulateWave(grid, 3, 1, steps, [
      { profile: gaussianPulse(0.5, 3, 0.5), direction: 1 },
      { profile: gaussianPulse(-0.5, 9, 0.5), direction: -1 },
    ]);
    expect(Math.abs(out.displacement[120]!)).toBeLessThan(1e-9);
  });

  it("is only first-order wrong for a Courant number below 1 (numerical dispersion) and rejects an unstable one", () => {
    const c = 6;
    const steps = stepsForDuration(grid, c, 0.9, 0.5);
    const out = simulateWave(grid, c, 0.9, steps, [{ profile: gaussianPulse(1, 3, 0.5), direction: 1 }]);
    const peakIndex = out.displacement.indexOf(Math.max(...out.displacement));
    expect(Math.abs(peakIndex * grid.dx - (3 + c * out.time))).toBeLessThan(0.15);
    expect(() => simulateWave(grid, c, 1.1, 10, [])).toThrow(RangeError);
    expect(() => createWaveGrid(12, 2)).toThrow(RangeError);
  });

  it("conserves energy of a travelling pulse to within a few percent", () => {
    const energy = (u: Float64Array, v: Float64Array) => {
      let e = 0;
      for (let i = 1; i < u.length - 1; i += 1) {
        e += ((u[i]! - v[i]!) / 1) ** 2;
      }
      return e;
    };
    const c = 6;
    const dtSteps = 20;
    const a = simulateWave(grid, c, 1, dtSteps, [{ profile: gaussianPulse(1, 3, 0.5), direction: 1 }]).displacement;
    const b = simulateWave(grid, c, 1, dtSteps + 1, [{ profile: gaussianPulse(1, 3, 0.5), direction: 1 }]).displacement;
    const later = simulateWave(grid, c, 1, 2 * dtSteps, [{ profile: gaussianPulse(1, 3, 0.5), direction: 1 }]).displacement;
    const later2 = simulateWave(grid, c, 1, 2 * dtSteps + 1, [{ profile: gaussianPulse(1, 3, 0.5), direction: 1 }]).displacement;
    expect(energy(later, later2) / energy(a, b)).toBeCloseTo(1, 1);
  });
});

describe("echoes and the speed of sound", () => {
  it("gives 331.3 m/s at 0 °C and 343.2 m/s at 20 °C", () => {
    expect(calculateSpeedOfSound(0)).toBeCloseTo(331.3, 0);
    expect(calculateSpeedOfSound(20)).toBeCloseTo(343.2, 1);
    expect(calculateSpeedOfSound(-10)).toBeCloseTo(325.2, 1);
    expect(calculateSpeedOfSound(30)).toBeCloseTo(349.0, 1);
  });

  it("is inverted by calculateTemperatureFromSpeed", () => {
    for (const t of [-20, 0, 12.5, 30, 45]) {
      expect(calculateTemperatureFromSpeed(calculateSpeedOfSound(t))).toBeCloseTo(t, 8);
    }
  });

  it("turns delay into distance: d = vt/2 and t = 2d/v", () => {
    expect(calculateEchoDistance(1.8, 343.2)).toBeCloseTo(308.9, 1);
    expect(calculateEchoDelay(100, 349.04)).toBeCloseTo(0.573, 3);
    expect(calculateEchoDistance(calculateEchoDelay(250, 340), 340)).toBeCloseTo(250, 10);
    expect(calculateMinimumEchoDistance(343.2)).toBeCloseTo(17.16, 2);
  });

  it("rejects non-physical inputs", () => {
    expect(() => calculateSpeedOfSound(-300)).toThrow(RangeError);
    expect(() => calculateEchoDelay(-1, 340)).toThrow(RangeError);
    expect(() => calculateEchoDistance(1, 0)).toThrow(RangeError);
  });
});

describe("beats and spectrum analysis", () => {
  it("has beat frequency |f₁ − f₂| and resolution time 1/Δf", () => {
    expect(calculateBeatFrequency(440, 436)).toBe(4);
    expect(calculateBeatFrequency(436, 440)).toBe(4);
    expect(calculateResolutionTime(4)).toBe(0.25);
  });

  it("finds the frequency and amplitude of a sinusoid with the FFT", () => {
    const spectrum = calculateSpectrum(sampleTones([{ frequency: 300, amplitude: 0.8 }], 2048, 1), 2048);
    const [peak] = findSpectralPeaks(spectrum);
    expect(peak!.frequency).toBeCloseTo(300, 6);
    expect(peak!.amplitude).toBeCloseTo(0.8, 6);
  });

  it("finds three harmonics and their greatest common divisor 150 Hz", () => {
    const tones = [{ frequency: 300, amplitude: 1 }, { frequency: 450, amplitude: 0.7 }, { frequency: 600, amplitude: 0.5 }];
    const peaks = findSpectralPeaks(calculateSpectrum(sampleTones(tones, 2048, 1), 2048), 0.2).map((p) => Math.round(p.frequency)).sort((a, b) => a - b);
    expect(peaks).toEqual([300, 450, 600]);
    expect(calculateFundamental(peaks)).toBe(150);
  });

  it("separates 440 and 444 Hz only when the recording is long enough (≈ 1/Δf = 0.25 s)", () => {
    const peaksFor = (seconds: number) => {
      const s = calculateSpectrum(sampleTones([{ frequency: 440, amplitude: 1 }, { frequency: 444, amplitude: 1 }], 2048, seconds), 2048, 8192);
      return findSpectralPeaks(s.filter((p) => p.frequency > 400 && p.frequency < 480), 0.5);
    };
    expect(peaksFor(0.1)).toHaveLength(1);
    expect(peaksFor(0.15)).toHaveLength(1);
    expect(peaksFor(0.3)).toHaveLength(2);
    expect(peaksFor(1)).toHaveLength(2);
  });

  it("rejects tones above the Nyquist frequency and too-short signals", () => {
    expect(() => sampleTones([{ frequency: 1500, amplitude: 1 }], 2048, 1)).toThrow(RangeError);
    expect(() => calculateSpectrum(new Float64Array(1), 2048)).toThrow(RangeError);
  });
});

describe("two-source interference", () => {
  const a = { x: -1, y: 0 };
  const b = { x: 1, y: 0 };

  it("has zero path difference on the axis of symmetry", () => {
    expect(calculatePathDifference({ x: 0, y: 4 }, a, b)).toBeCloseTo(0, 12);
    expect(calculatePathDifference({ x: 2, y: 4 }, a, b)).toBeCloseTo(Math.hypot(3, 4) - Math.hypot(1, 4), 12);
  });

  it("is I = cos²(πΔ/λ): bright at whole wavelengths, dark at half", () => {
    expect(calculateRelativeIntensity(0, 1)).toBeCloseTo(1, 12);
    expect(calculateRelativeIntensity(0.5, 1)).toBeCloseTo(0, 12);
    expect(calculateRelativeIntensity(1, 1)).toBeCloseTo(1, 12);
    expect(calculateRelativeIntensity(0.25, 1)).toBeCloseTo(0.5, 12);
    expect(classifyInterference(0.99)).toBe("constructive");
    expect(classifyInterference(0.01)).toBe("destructive");
    expect(classifyInterference(0.5)).toBe("partial");
  });

  it("finds the first quiet spot 4 m away at x ≈ 1.06 m for λ = 1 m", () => {
    const delta = (x: number) => calculatePathDifference({ x, y: 4 }, a, b);
    expect(delta(1.06)).toBeCloseTo(0.5, 2);
    expect(calculateRelativeIntensity(delta(1.06), 1)).toBeLessThan(0.001);
  });

  it("has the double-slit fringe spacing Δy = λL/d and its inverse", () => {
    expect(calculateFringeSpacing(589e-9, 2, 0.2356e-3)).toBeCloseTo(5e-3, 5);
    expect(calculateSlitSeparation(589e-9, 2, 5e-3)).toBeCloseTo(0.2356e-3, 7);
    expect(() => calculateFringeSpacing(589e-9, 2, 0)).toThrow(RangeError);
  });

  it("puts adjacent bright maxima of the exact screen pattern one fringe spacing apart", () => {
    const d = 0.2356e-3;
    const spacing = calculateFringeSpacing(589e-9, 2, d);
    expect(calculateScreenIntensity(589e-9, 2, d, 0)).toBeCloseTo(1, 10);
    expect(calculateScreenIntensity(589e-9, 2, d, spacing)).toBeCloseTo(1, 4);
    expect(calculateScreenIntensity(589e-9, 2, d, spacing / 2)).toBeCloseTo(0, 4);
  });
});

describe("planet properties", () => {
  it("gives Earth's gravity, density and escape speed from M and R", () => {
    const earth = calculatePlanetPropertiesFromEarthUnits(1, 1);
    expect(earth.surfaceGravity).toBeCloseTo(9.82, 2);
    expect(earth.meanDensity).toBeCloseTo(5514, -1);
    expect(earth.escapeSpeed).toBeCloseTo(11186, -1);
    expect(earth.orbitalPeriodAtSurface / 60).toBeCloseTo(84.4, 0);
  });

  it("scales as g ∝ M/R², ρ ∝ M/R³ and v ∝ √(M/R)", () => {
    const base = calculatePlanetPropertiesFromEarthUnits(1, 1);
    const big = calculatePlanetPropertiesFromEarthUnits(2, Math.SQRT2);
    expect(big.surfaceGravity / base.surfaceGravity).toBeCloseTo(1, 10);
    expect(big.meanDensity / base.meanDensity).toBeCloseTo(2 / 2 ** 1.5, 10);
    expect(big.escapeSpeed / base.escapeSpeed).toBeCloseTo(Math.sqrt(2 / Math.SQRT2), 10);
  });

  it("matches Saturn-like numbers: 95 Earth masses, 9.45 Earth radii", () => {
    const saturn = calculatePlanetPropertiesFromEarthUnits(95, 9.45);
    expect(saturn.meanDensity).toBeLessThan(1000);
    expect(saturn.escapeSpeed / 1000).toBeCloseTo(35.5, 0);
    expect(saturn.surfaceGravity).toBeCloseTo(10.4, 0);
  });

  it("validates inputs", () => {
    expect(() => calculateSurfaceGravity(0, 1)).toThrow(RangeError);
    expect(() => calculateMeanDensity(1, -1)).toThrow(RangeError);
    expect(() => calculatePlanetEscapeSpeed(Number.NaN, 1)).toThrow(RangeError);
  });
});

describe("N-body gravity", () => {
  const sunMass = MU_SUN / G;
  const star: Body = { name: "Star", mass: sunMass, position: Vector2.zero(), velocity: Vector2.zero() };
  const planetAt = (aAu: number, massFactor = 1): Body[] => {
    const r = aAu * AU;
    return [{ ...star, mass: sunMass * massFactor }, { name: "Planet", mass: 5.972e24, position: new Vector2(r, 0), velocity: new Vector2(0, Math.sqrt((MU_SUN * massFactor) / r)) }];
  };

  it("reproduces Kepler's third law: a planet at 1 AU takes 1 year, at 4^(1/3)... a = 1.5874 AU takes 2 years", () => {
    expect(measureOrbitalPeriod(planetAt(1), 1, 0, 3 * YEAR).period! / YEAR).toBeCloseTo(1, 3);
    expect(measureOrbitalPeriod(planetAt(1.5874), 1, 0, 5 * YEAR).period! / YEAR).toBeCloseTo(2, 3);
    expect(measureOrbitalPeriod(planetAt(4), 1, 0, 20 * YEAR).period! / YEAR).toBeCloseTo(8, 2);
  });

  it("follows T² = a³/M for a heavier star: M = 4 gives half a year at 1 AU", () => {
    expect(measureOrbitalPeriod(planetAt(1, 4), 1, 0, 2 * YEAR).period! / YEAR).toBeCloseTo(0.5, 2);
  });

  it("matches the analytic period of an ellipse from vis-viva (8 years for a = 4 AU)", () => {
    const v = Math.sqrt(MU_SUN * (2 / AU - 1 / (4 * AU)));
    expect(v / 1000).toBeCloseTo(39.4, 1);
    const bodies: Body[] = [star, { name: "Comet", mass: 1e12, position: new Vector2(AU, 0), velocity: new Vector2(0, v) }];
    expect(measureOrbitalPeriod(bodies, 1, 0, 30 * YEAR).period! / YEAR).toBeCloseTo(8, 1);
  });

  it("conserves energy, momentum and angular momentum in a three-body system", () => {
    const bodies: Body[] = [
      star,
      { name: "A", mass: 5.972e24, position: new Vector2(AU, 0), velocity: new Vector2(0, Math.sqrt(MU_SUN / AU)) },
      { name: "B", mass: 6.4e23, position: new Vector2(-1.52 * AU, 0), velocity: new Vector2(0, -Math.sqrt(MU_SUN / (1.52 * AU))) },
    ];
    const p0 = calculateTotalMomentum(bodies);
    const centred: Body[] = [{ ...bodies[0]!, velocity: p0.scale(-1 / sunMass) }, bodies[1]!, bodies[2]!];
    const e0 = calculateTotalEnergy(centred);
    const l0 = calculateTotalAngularMomentum(centred);
    const out = integrateNBody(centred, 2 * YEAR);
    expect(Math.abs(calculateTotalEnergy(out.bodies) / e0 - 1)).toBeLessThan(1e-6);
    expect(Math.abs(calculateTotalAngularMomentum(out.bodies) / l0 - 1)).toBeLessThan(1e-6);
    const p = calculateTotalMomentum(out.bodies);
    expect(p.magnitude / (sunMass * 3e4)).toBeLessThan(1e-9);
    expect(out.stoppedBy).toBe("duration");
  });

  it("is time-reversible: running forward then backward returns to the start", () => {
    const start = planetAt(1);
    const forward = integrateNBody(start, 0.5 * YEAR);
    const reversed = forward.bodies.map((b) => ({ ...b, velocity: b.velocity.scale(-1) }));
    const back = integrateNBody(reversed, forward.time);
    expect(back.bodies[1]!.position.distanceTo(start[1]!.position) / AU).toBeLessThan(1e-3);
  });

  it("returns a null period if the orbit is not completed, and validates the system", () => {
    expect(measureOrbitalPeriod(planetAt(1), 1, 0, 0.3 * YEAR).period).toBeNull();
    expect(() => integrateNBody([star], YEAR)).toThrow(RangeError);
    expect(() => integrateNBody([star, { ...star }], YEAR)).toThrow(RangeError);
  });
});

describe("escape velocity from energy", () => {
  it("has ε = v²/2 − μ/r and v_esc = √(2μ/r): 11.19 km/s for Earth", () => {
    expect(calculateEscapeSpeedAt(MU_E, R_E)).toBeCloseTo(11186, -1);
    expect(calculateSpecificEnergy(calculateEscapeSpeedAt(MU_E, R_E), MU_E, R_E)).toBeCloseTo(0, 3);
    expect(calculateSpecificEnergy(0, MU_E, R_E)).toBeCloseTo(-MU_E / R_E, 3);
    expect(doesEscape(11.2e3, MU_E, R_E)).toBe(true);
    expect(doesEscape(11.1e3, MU_E, R_E)).toBe(false);
  });

  it("finds the Moon's escape speed 2.376 km/s", () => {
    expect(calculateEscapeSpeedAt(4.9028e12, 1.7374e6)).toBeCloseTo(2375.7, 0);
  });

  it("gives r_max = 2r/(2 − v²r/μ), so 1000 km altitude needs about 4.12 km/s", () => {
    const v = Math.sqrt(2 * MU_E * (1 / R_E - 1 / (R_E + 1_000_000)));
    expect(v).toBeCloseTo(4120, -1);
    expect(calculateMaximumRadius(v, MU_E, R_E)! - R_E).toBeCloseTo(1_000_000, -2);
    expect(calculateMaximumRadius(0, MU_E, R_E)).toBeCloseTo(R_E, 3);
    expect(calculateMaximumRadius(12e3, MU_E, R_E)).toBeNull();
    // at the turning point the energy is purely potential: −μ/r_max = ε
    const rMax = calculateMaximumRadius(5000, MU_E, R_E)!;
    expect(-MU_E / rMax).toBeCloseTo(calculateSpecificEnergy(5000, MU_E, R_E), 3);
  });

  it("agrees with a numerical integration of the vertical flight", () => {
    const v = Math.sqrt(2 * MU_E * (1 / R_E - 1 / (R_E + 1_000_000)));
    let peak = 0;
    integrateNBody(
      [
        { name: "Earth", mass: MU_E / G, position: Vector2.zero(), velocity: Vector2.zero() },
        { name: "Probe", mass: 1, position: new Vector2(R_E, 0), velocity: new Vector2(v, 0) },
      ],
      3000,
      {
        stepFraction: 0.001,
        onStep: (_, bodies) => {
          const r = bodies[1]!.position.distanceTo(bodies[0]!.position);
          peak = Math.max(peak, r);
          return r < peak - 10; // stop once it has turned around
        },
      },
    );
    expect(peak - R_E).toBeCloseTo(1_000_000, -3);
  });

  it("gives the launch speed to leave the Solar System from Earth, 16.65 km/s", () => {
    const sunEscape = calculateEscapeSpeedAt(MU_SUN, AU);
    const earthSpeed = sunEscape / Math.SQRT2;
    expect(sunEscape / 1000).toBeCloseTo(42.12, 1);
    expect(earthSpeed / 1000).toBeCloseTo(29.79, 1);
    const excess = calculateExcessToLeaveStar(earthSpeed);
    expect(excess / 1000).toBeCloseTo(12.34, 1);
    expect(calculateLaunchSpeedForExcess(excess, MU_E, R_E) / 1000).toBeCloseTo(16.65, 1);
    expect(calculateLaunchSpeedForExcess(0, MU_E, R_E)).toBeCloseTo(calculateEscapeSpeedAt(MU_E, R_E), 6);
  });

  it("rejects invalid inputs", () => {
    expect(() => calculateEscapeSpeedAt(0, 1)).toThrow(RangeError);
    expect(() => calculateSpecificEnergy(-1, MU_E, R_E)).toThrow(RangeError);
    expect(() => calculateLaunchSpeedForExcess(-1, MU_E, R_E)).toThrow(RangeError);
  });
});
