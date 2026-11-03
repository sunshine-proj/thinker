import { describe, expect, it } from "vitest";
import { MICROSCOPE_META, MICROSCOPE_ROUNDS, runMicroscope, type MicroscopeRound } from "../../src/features/games/microscope-builder/microscopeBuilder";
import { MicroscopeBuilderPage } from "../../src/features/games/microscope-builder/MicroscopeBuilderPage";
import { SOUND_META, SOUND_ROUNDS, TARGET_NOTE_HZ, runSound, type SoundRound } from "../../src/features/games/sound-creator/soundCreator";
import { SoundCreatorPage } from "../../src/features/games/sound-creator/SoundCreatorPage";
import { E4_HZ, GUITAR_META, GUITAR_ROUNDS, runGuitar, type GuitarRound } from "../../src/features/games/virtual-guitar/virtualGuitar";
import { VirtualGuitarPage } from "../../src/features/games/virtual-guitar/VirtualGuitarPage";
import { WAVE_META, WAVE_ROUNDS, initialProfile, runWave, type WaveRound } from "../../src/features/games/wave-simulator/waveSimulator";
import { WaveSimulatorPage } from "../../src/features/games/wave-simulator/WaveSimulatorPage";
import { ECHO_META, ECHO_ROUNDS, runEcho, type EchoRound } from "../../src/features/games/echo-explorer/echoExplorer";
import { EchoExplorerPage } from "../../src/features/games/echo-explorer/EchoExplorerPage";
import { FREQUENCY_META, FREQUENCY_ROUNDS, runFrequency, type FrequencyRound } from "../../src/features/games/frequency-detective/frequencyDetective";
import { FrequencyDetectivePage } from "../../src/features/games/frequency-detective/FrequencyDetectivePage";
import { INTERFERENCE_META, INTERFERENCE_ROUNDS, intensityCurve, runInterference, type InterferenceRound } from "../../src/features/games/wave-interference/waveInterference";
import { WaveInterferencePage } from "../../src/features/games/wave-interference/WaveInterferencePage";
import { PLANET_META, PLANET_ROUNDS, runPlanet, type PlanetRound } from "../../src/features/games/planet-designer/planetDesigner";
import { PlanetDesignerPage } from "../../src/features/games/planet-designer/PlanetDesignerPage";
import { SYSTEM_META, SYSTEM_ROUNDS, runSystem, type SystemRound } from "../../src/features/games/solar-system-builder/solarSystemBuilder";
import { SolarSystemBuilderPage } from "../../src/features/games/solar-system-builder/SolarSystemBuilderPage";
import { ESCAPE_META, ESCAPE_ROUNDS, SOLAR_SYSTEM_LAUNCH_SPEED, runEscape, speedCurve, type EscapeRound } from "../../src/features/games/escape-velocity/escapeVelocity";
import { EscapeVelocityPage } from "../../src/features/games/escape-velocity/EscapeVelocityPage";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [magnify, resolve, fit] = MICROSCOPE_ROUNDS as [MicroscopeRound, MicroscopeRound, MicroscopeRound];
const [pitch, loudness, timbre] = SOUND_ROUNDS as [SoundRound, SoundRound, SoundRound];
const [tune, fret, harmonic] = GUITAR_ROUNDS as [GuitarRound, GuitarRound, GuitarRound];
const [echo, sum, cancel] = WAVE_ROUNDS as [WaveRound, WaveRound, WaveRound];
const [canyon, cold, thermometer] = ECHO_ROUNDS as [EchoRound, EchoRound, EchoRound];
const [beats, fundamental, resolution] = FREQUENCY_ROUNDS as [FrequencyRound, FrequencyRound, FrequencyRound];
const [quiet, loud, slits] = INTERFERENCE_ROUNDS as [InterferenceRound, InterferenceRound, InterferenceRound];
const [gravity, atmosphere, giant] = PLANET_ROUNDS as [PlanetRound, PlanetRound, PlanetRound];
const [year, star, comet] = SYSTEM_ROUNDS as [SystemRound, SystemRound, SystemRound];
const [moon, height, solar] = ESCAPE_ROUNDS as [EscapeRound, EscapeRound, EscapeRound];

describe("Microscope Builder (worked by hand)", () => {
  it("round 1: 4 mm objective and 25 mm eyepiece give 40 × 10 = 400×", () => {
    const o = runMicroscope(magnify, { tube: 160, objective: 4, eyepiece: 25 });
    expect(o.objectiveMagnification).toBeCloseTo(40, 8);
    expect(o.eyepieceMagnification).toBeCloseTo(10, 8);
    expect(o.totalMagnification).toBeCloseTo(400, 6);
    expect(o.success).toBe(true);
    expect(runMicroscope(magnify, { tube: 160, objective: 10, eyepiece: 40 }).feedback).toMatch(/Shorten a focal length/);
    expect(runMicroscope(magnify, { tube: 160, objective: 2, eyepiece: 10 }).feedback).toMatch(/Lengthen/);
  });

  it("round 2: resolving 0.5 µm needs NA ≥ 0.67; more magnification cannot make up for it", () => {
    const good = runMicroscope(resolve, { tube: 160, na: 0.9, objective: 4, eyepiece: 12 });
    expect(good.resolutionNanometers).toBeCloseTo(372.8, 1);
    expect(good.totalMagnification).toBeCloseTo(833.3, 0);
    expect(good.success).toBe(true);
    const blurry = runMicroscope(resolve, { tube: 160, na: 0.5, objective: 4, eyepiece: 12 });
    expect(blurry.feedback).toMatch(/blur into one/);
    expect(blurry.success).toBe(false);
    expect(runMicroscope(resolve, { tube: 160, na: 0.9, objective: 4, eyepiece: 5 }).feedback).toMatch(/empty magnification/);
    expect(runMicroscope(resolve, { tube: 160, na: 0.9, objective: 10, eyepiece: 25 }).feedback).toMatch(/too small to see/);
  });

  it("round 3: the stand limits the tube to 200 mm", () => {
    expect(runMicroscope(fit, { eyepiece: 20, objective: 3.5, tube: 170 }).success).toBe(true);
    const long = runMicroscope(fit, { eyepiece: 20, objective: 5, tube: 240 });
    expect(long.totalMagnification).toBeCloseTo(600, 6);
    expect(long.success).toBe(false);
    expect(long.feedback).toMatch(/longer than the 200 mm/);
  });

  it("registers in the catalog and plays through", async () => {
    expect(findCatalogEntry("microscope-builder")?.path).toBe("/worlds/optics/microscope-builder");
    checkGuards(MicroscopeBuilderPage, MICROSCOPE_META, { sliders: { "Objective focal length": 10, "Eyepiece focal length": 40 }, prediction: 100, feedback: /not the 400× required/ });
  });

  it("plays through", async () => {
    await playThrough(MicroscopeBuilderPage, MICROSCOPE_META, [
      { sliders: { "Objective focal length": 4, "Eyepiece focal length": 25 }, prediction: 400 },
      { sliders: { "Numerical aperture of the objective": 0.9, "Objective focal length": 4, "Eyepiece focal length": 12 }, prediction: 833 },
      { sliders: { "Objective focal length": 3.5, "Tube length": 170 }, prediction: 607 },
    ]);
  });
});

describe("Sound Creator (worked by hand)", () => {
  it("round 1: C5 is 523.25 Hz with a 1.911 ms period and 0.656 m wavelength", () => {
    const o = runSound(pitch, { frequency: 523.5, amplitude: 0.5 });
    expect(TARGET_NOTE_HZ).toBeCloseTo(523.25, 2);
    expect(o.success).toBe(true);
    expect(o.periodMilliseconds).toBeCloseTo(1.9102, 3);
    expect(o.wavelengthMeters).toBeCloseTo(0.6552, 3);
    expect(runSound(pitch, { frequency: 440, amplitude: 0.5 }).feedback).toMatch(/lower than C5/);
    expect(runSound(pitch, { frequency: 600, amplitude: 0.5 }).feedback).toMatch(/higher than C5/);
  });

  it("round 2: +10 dB needs 3.16 times the amplitude; doubling gives only 6 dB", () => {
    const ok = runSound(loudness, { frequency: 440, amplitude: 0.316 });
    expect(ok.levelChangeDecibels).toBeCloseTo(10, 1);
    expect(ok.success).toBe(true);
    const doubled = runSound(loudness, { frequency: 440, amplitude: 0.2 });
    expect(doubled.levelChangeDecibels).toBeCloseTo(6.02, 1);
    expect(doubled.success).toBe(false);
    expect(doubled.feedback).toMatch(/short/);
  });

  it("round 3: harmonics 1/3 and 1/5 are right and a pure sine is not a square wave", () => {
    expect(runSound(timbre, { frequency: 220, first: 1, third: 0.33, fifth: 0.2 }).success).toBe(true);
    const sine = runSound(timbre, { frequency: 220, first: 1, third: 0, fifth: 0 });
    expect(sine.success).toBe(false);
    expect(sine.peak).toBeCloseTo(1, 2);
    const square = runSound(timbre, { frequency: 220, first: 1, third: 1 / 3, fifth: 0.2 });
    expect(square.peak).toBeCloseTo(0.93, 2); // three terms of the series, not yet flat at 4/π
    expect(square.feedback).toMatch(/flat-topped/);
  });

  it("plays through", async () => {
    checkGuards(SoundCreatorPage, SOUND_META, { sliders: { Frequency: 440 }, prediction: 2, feedback: /lower than C5/ });
  });

  it("completes all rounds", async () => {
    await playThrough(SoundCreatorPage, SOUND_META, [
      { sliders: { Frequency: 523.5 }, prediction: 1.9 },
      { sliders: { Amplitude: 0.315 }, prediction: 0.316 },
      { sliders: { "3rd harmonic amplitude": 0.33, "5th harmonic amplitude": 0.2 }, prediction: 0.33 },
    ]);
  });
});

describe("Virtual Guitar (worked by hand)", () => {
  it("round 1: 91.8 N tunes a 0.65 m, 0.5 g/m string to E4", () => {
    const o = runGuitar(tune, { length: 0.65, tension: 91.8 });
    expect(o.frequencyHz).toBeCloseTo(E4_HZ, 0);
    expect(o.waveSpeed).toBeCloseTo(428.5, 0);
    expect(o.success).toBe(true);
    expect(runGuitar(tune, { length: 0.65, tension: 60 }).feedback).toMatch(/flat by .* Tighten/);
    expect(runGuitar(tune, { length: 0.65, tension: 120 }).feedback).toMatch(/sharp by .* Loosen/);
  });

  it("round 2: pressing 16.3 cm from the nut turns E2 into A2", () => {
    const o = runGuitar(fret, { open: 82.41, length: 0.65, finger: 0.163 });
    expect(o.vibratingLengthMeters).toBeCloseTo(0.487, 3);
    expect(o.frequencyHz).toBeCloseTo(110, 0);
    expect(o.success).toBe(true);
    expect(runGuitar(fret, { open: 82.41, length: 0.65, finger: 0.1 }).feedback).toMatch(/below A2/);
  });

  it("round 3: a light touch at 1/3 rings the third harmonic, 330 Hz", () => {
    const o = runGuitar(harmonic, { open: 110, length: 0.65, touch: 0.335 });
    expect(o.mode).toBe(3);
    expect(o.frequencyHz).toBe(330);
    expect(o.success).toBe(true);
    expect(runGuitar(harmonic, { open: 110, length: 0.65, touch: 0.5 }).feedback).toMatch(/harmonic 2/);
    expect(runGuitar(harmonic, { open: 110, length: 0.65, touch: 0.37 }).feedback).toMatch(/not near a node/);
  });

  it("completes all rounds", async () => {
    checkGuards(VirtualGuitarPage, GUITAR_META, { sliders: { Tension: 60 }, prediction: 90, feedback: /flat by/ });
  });

  it("plays through", async () => {
    await playThrough(VirtualGuitarPage, GUITAR_META, [
      { sliders: { Tension: 91.8 }, prediction: 91.8 },
      { sliders: { "Finger distance from the nut": 0.163 }, prediction: 0.163 },
      { sliders: { "Touch position (fraction of length)": 0.335 }, prediction: 330 },
    ]);
  });
});

describe("Wave Simulator (worked by hand)", () => {
  it("round 1: the echo of an 18 m round trip arrives at 18/c seconds", () => {
    for (const c of [4, 6, 9]) {
      expect(runWave(echo, { speed: c }).measured).toBeCloseTo(18 / c, 1);
    }
    expect(runWave(echo, { speed: 6 }).success).toBe(true);
    expect(runWave(echo, { speed: 3 }).feedback).toMatch(/too late/);
    expect(runWave(echo, { speed: 9 }).feedback).toMatch(/too early/);
    expect(runWave(echo, { speed: 6 }).profile.length).toBe(121);
  });

  it("round 2: heights add at the meeting point", () => {
    const o = runWave(sum, { speed: 3, amplitude: 0.3 });
    expect(o.measured).toBeCloseTo(0.8, 3);
    expect(o.success).toBe(true);
    expect(runWave(sum, { speed: 3, amplitude: -0.5 }).measured).toBeCloseTo(0, 6);
    expect(runWave(sum, { speed: 3, amplitude: 0.9 }).feedback).toMatch(/not 0.8/);
  });

  it("round 3: pulses cancel at x = 6 m only if they arrive together with opposite heights", () => {
    const ok = runWave(cancel, { speed: 3, start: 10, amplitude: -0.5 });
    expect(ok.measured).toBeLessThan(1e-6);
    expect(ok.success).toBe(true);
    expect(runWave(cancel, { speed: 3, start: 10, amplitude: 0.5 }).measured).toBeCloseTo(1, 2);
    const late = runWave(cancel, { speed: 3, start: 8, amplitude: -0.5 });
    expect(late.success).toBe(false);
    expect(late.feedback).toMatch(/did not cancel/);
  });

  it("shows the starting shape before the run", () => {
    const start = initialProfile(echo, { speed: 6 });
    expect(Math.max(...start.map((p) => p.y))).toBeCloseTo(1, 2);
  });

  it("guards the controls", () => {
    checkGuards(WaveSimulatorPage, WAVE_META, { sliders: { "Wave speed": 3 }, prediction: 6, feedback: /too late/ });
  });

  it("plays through", async () => {
    await playThrough(WaveSimulatorPage, WAVE_META, [
      { sliders: { "Wave speed": 6 }, prediction: 6 },
      { sliders: { "Height of the second pulse": 0.3 }, prediction: 0.3 },
      { sliders: { "Start of the second pulse": 10, "Height of the second pulse": -0.5 }, prediction: 10 },
    ]);
  });
});

describe("Echo Explorer (worked by hand)", () => {
  it("round 1: 1.8 s at 20 °C is 309 m", () => {
    const o = runEcho(canyon, { temperature: 20, delay: 1.8, distance: 309 });
    expect(o.speedOfSound).toBeCloseTo(343.2, 1);
    expect(o.predictionActual).toBeCloseTo(308.9, 0);
    expect(o.success).toBe(true);
    expect(runEcho(canyon, { temperature: 20, delay: 1.8, distance: 400 }).feedback).toMatch(/91 m off/);
  });

  it("round 2: in the cold the wall is closer than 343 m/s suggests", () => {
    const right = runEcho(cold, { temperature: -10, delay: 2.4, distance: 390 });
    expect(right.predictionActual).toBeCloseTo(390.2, 0);
    expect(right.success).toBe(true);
    const wrong = runEcho(cold, { temperature: -10, delay: 2.4, distance: 412 });
    expect(wrong.success).toBe(false);
    expect(wrong.feedback).toMatch(/343 m\/s is the speed at 20 °C/);
  });

  it("round 3: a 100 m echo of 0.573 s means 349 m/s, which is 30 °C", () => {
    const o = runEcho(thermometer, { distance: 100, delay: 0.573, temperature: 30 });
    expect(o.predictionActual).toBeCloseTo(349.04, 1);
    expect(o.success).toBe(true);
    expect(runEcho(thermometer, { distance: 100, delay: 0.573, temperature: 20 }).feedback).toMatch(/warmer/);
    expect(runEcho(thermometer, { distance: 100, delay: 0.573, temperature: 40 }).feedback).toMatch(/colder/);
  });

  it("guards the controls", () => {
    checkGuards(EchoExplorerPage, ECHO_META, { sliders: { "Estimated distance to the wall": 400 }, prediction: 300, feedback: /off/ });
  });

  it("plays through", async () => {
    await playThrough(EchoExplorerPage, ECHO_META, [
      { sliders: { "Estimated distance to the wall": 309 }, prediction: 309 },
      { sliders: { "Estimated distance to the wall": 390 }, prediction: 390 },
      { sliders: { "Estimated air temperature": 30 }, prediction: 349 },
    ]);
  });
});

describe("Frequency Detective (worked by hand)", () => {
  it("round 1: 4 beats against 440 Hz and a flat string means 436 Hz, not 444 Hz", () => {
    expect(runFrequency(beats, { reference: 440, frequency: 436 }).success).toBe(true);
    const sharp = runFrequency(beats, { reference: 440, frequency: 444 });
    expect(sharp.beatHz).toBe(4);
    expect(sharp.success).toBe(false);
    expect(sharp.feedback).toMatch(/sharp/);
    expect(runFrequency(beats, { reference: 440, frequency: 430 }).feedback).toMatch(/beats 10.0 times/);
  });

  it("round 2: the FFT finds peaks at 300, 450 and 600 Hz, so the fundamental is 150 Hz", () => {
    const o = runFrequency(fundamental, { fundamental: 150 });
    expect(o.peaks).toEqual([300, 450, 600]);
    expect(o.success).toBe(true);
    expect(runFrequency(fundamental, { fundamental: 300 }).success).toBe(false);
    expect(runFrequency(fundamental, { fundamental: 100 }).success).toBe(false);
  });

  it("round 3: 0.1 s merges the tones, 0.3 s separates them, 1 s runs past the sound", () => {
    expect(runFrequency(resolution, { rate: 2048, duration: 0.1 }).feedback).toMatch(/merge into one peak/);
    const ok = runFrequency(resolution, { rate: 2048, duration: 0.3 });
    expect(ok.peaks).toHaveLength(2);
    expect(ok.success).toBe(true);
    expect(ok.predictionActual).toBe(0.25);
    const long = runFrequency(resolution, { rate: 2048, duration: 1 });
    expect(long.success).toBe(false);
    expect(long.feedback).toMatch(/runs past it/);
    expect(runFrequency(resolution, { rate: 2048, duration: 0.3 }).accuracyFraction).toBeGreaterThan(runFrequency(resolution, { rate: 2048, duration: 0.6 }).accuracyFraction);
  });

  it("guards the controls", () => {
    checkGuards(FrequencyDetectivePage, FREQUENCY_META, { sliders: { "String frequency": 444 }, prediction: 436, feedback: /sharp/ });
  });

  it("plays through", async () => {
    await playThrough(FrequencyDetectivePage, FREQUENCY_META, [
      { sliders: { "String frequency": 436 }, prediction: 436 },
      { sliders: { "Fundamental frequency": 150 }, prediction: 150 },
      { sliders: { "Recording length": 0.3 }, prediction: 0.25 },
    ]);
  });
});

describe("Wave Interference (worked by hand)", () => {
  it("round 1: the first quiet spot is near x = 1.06 m and the path difference is half a wavelength", () => {
    const o = runInterference(quiet, { frequency: 343, position: 1.06 });
    expect(o.pathDifferenceMeters).toBeCloseTo(0.5, 2);
    expect(o.interference).toBe("destructive");
    expect(o.success).toBe(true);
    expect(runInterference(quiet, { frequency: 343, position: 0 }).interference).toBe("constructive");
    expect(runInterference(quiet, { frequency: 343, position: 0.5 }).feedback).toMatch(/Silence needs 0.5 wavelengths/);
  });

  it("round 2: the listener at (2, 4) is loud at about 391 Hz (Δ = 0.877 m = one wavelength)", () => {
    const o = runInterference(loud, { frequency: 391 });
    expect(o.pathDifferenceMeters).toBeCloseTo(0.8769, 3);
    expect(o.intensity).toBeGreaterThan(0.99);
    expect(o.success).toBe(true);
    expect(runInterference(loud, { frequency: 250 }).success).toBe(false);
    expect(runInterference(loud, { frequency: 586 }).success).toBe(false); // 1.5 wavelengths: silent
  });

  it("round 3: slits 0.2356 mm apart give 5 mm fringes", () => {
    const o = runInterference(slits, { wavelength: 589, screen: 2, separation: 0.235 });
    expect(o.fringeSpacingMillimeters).toBeCloseTo(5.01, 2);
    expect(o.success).toBe(true);
    expect(runInterference(slits, { wavelength: 589, screen: 2, separation: 0.5 }).feedback).toMatch(/Bring the slits closer/);
    expect(runInterference(slits, { wavelength: 589, screen: 2, separation: 0.12 }).feedback).toMatch(/further apart/);
  });

  it("draws an intensity curve between 0 and 1", () => {
    for (const round of [quiet, loud, slits]) {
      const curve = intensityCurve(round, { frequency: 343, position: 1, separation: 0.2356, wavelength: 589, screen: 2 });
      expect(curve.length).toBeGreaterThan(100);
      expect(Math.min(...curve.map((p) => p.y))).toBeGreaterThanOrEqual(0);
      expect(Math.max(...curve.map((p) => p.y))).toBeLessThanOrEqual(1);
    }
  });

  it("guards the controls", () => {
    checkGuards(WaveInterferencePage, INTERFERENCE_META, { sliders: { "Listener position along the line": 0.3 }, prediction: 0.5, feedback: /Silence needs/ });
  });

  it("plays through", async () => {
    await playThrough(WaveInterferencePage, INTERFERENCE_META, [
      { sliders: { "Listener position along the line": 1.06 }, prediction: 0.5 },
      { sliders: { Frequency: 391 }, prediction: 0.877 },
      { sliders: { "Slit separation": 0.235 }, prediction: 0.236 },
    ]);
  });
});

describe("Planet Designer (worked by hand)", () => {
  it("round 1: 2 Earth masses at 1.41 Earth radii gives Earth's gravity", () => {
    const o = runPlanet(gravity, { mass: 2, radius: 1.41 });
    expect(o.properties.surfaceGravity).toBeCloseTo(9.82 * 2 / 1.41 ** 2, 2);
    expect(o.success).toBe(true);
    expect(runPlanet(gravity, { mass: 2, radius: 1 }).feedback).toMatch(/too strong/);
    expect(runPlanet(gravity, { mass: 2, radius: 2 }).feedback).toMatch(/too weak/);
  });

  it("round 2: gravity must be comfortable and the escape speed high", () => {
    const ok = runPlanet(atmosphere, { mass: 2, radius: 1.4 });
    expect(ok.properties.surfaceGravity).toBeCloseTo(10.02, 1);
    expect(ok.properties.escapeSpeed / 1000).toBeCloseTo(13.37, 1);
    expect(ok.success).toBe(true);
    expect(runPlanet(atmosphere, { mass: 1, radius: 1 }).feedback).toMatch(/below 13 km\/s/);
    expect(runPlanet(atmosphere, { mass: 5, radius: 1 }).feedback).toMatch(/outside the 8–12/);
  });

  it("round 3: a Saturn-like giant is lighter than water yet hard to escape", () => {
    const o = runPlanet(giant, { mass: 93.5, radius: 9.05 });
    expect(o.properties.meanDensity).toBeCloseTo(696, -1);
    expect(o.properties.meanDensity).toBeLessThan(1000);
    expect(o.success).toBe(true);
    expect(runPlanet(giant, { mass: 20, radius: 4 }).success).toBe(false);
  });

  it("guards the controls", () => {
    checkGuards(PlanetDesignerPage, PLANET_META, { sliders: { Radius: 1 }, prediction: 1.4, feedback: /too strong/ });
  });

  it("plays through", async () => {
    await playThrough(PlanetDesignerPage, PLANET_META, [
      { sliders: { Radius: 1.41 }, prediction: 1.41 },
      { sliders: { Mass: 2, Radius: 1.4 }, prediction: 13.4 },
      { sliders: { Mass: 93.5, Radius: 9.05 }, prediction: 696 },
    ]);
  });
});

describe("Solar System Builder (N-body, worked by hand)", () => {
  it("round 1: a = 2^(2/3) = 1.587 AU gives a two-year orbit; Kepler's T² = a³ holds", () => {
    const o = runSystem(year, { star: 1, distance: 1.59 });
    expect(o.periodYears).toBeCloseTo(1.59 ** 1.5, 2);
    expect(o.success).toBe(true);
    expect(o.semiMajorAxisAu).toBeCloseTo(1.59, 2);
    expect(o.energyDrift).toBeLessThan(1e-6);
    expect(runSystem(year, { star: 1, distance: 1 }).feedback).toMatch(/too quick/);
    expect(runSystem(year, { star: 1, distance: 3 }).feedback).toMatch(/too slow/);
  });

  it("round 2: four solar masses halve the year at 1 AU", () => {
    const o = runSystem(star, { star: 4, distance: 1 });
    expect(o.periodYears).toBeCloseTo(0.5, 2);
    expect(o.success).toBe(true);
    expect(runSystem(star, { star: 1, distance: 1 }).success).toBe(false);
  });

  it("round 3: 39.4 km/s at 1 AU makes an 8-year ellipse with a = 4 AU; 42 km/s is also bound but 41 km/s is not as quick", () => {
    const o = runSystem(comet, { star: 1, distance: 1, speed: 39.4 });
    expect(o.periodYears).toBeCloseTo(8, 1);
    expect(o.semiMajorAxisAu).toBeCloseTo(4, 1);
    expect(o.success).toBe(true);
    expect(o.path.length).toBeGreaterThan(50);
    expect(runSystem(comet, { star: 1, distance: 1, speed: 36 }).success).toBe(false);
    expect(runSystem(comet, { star: 1, distance: 1, speed: 41 }).periodYears!).toBeGreaterThan(20);
  });

  it("guards the controls", () => {
    checkGuards(SolarSystemBuilderPage, SYSTEM_META, { sliders: { "Orbital radius": 1 }, prediction: 1.5, feedback: /too quick/ });
  });

  it("plays through", async () => {
    await playThrough(SolarSystemBuilderPage, SYSTEM_META, [
      { sliders: { "Orbital radius": 1.59 }, prediction: 1.59 },
      { sliders: { "Star mass": 4 }, prediction: 4 },
      { sliders: { "Launch speed": 39.4 }, prediction: 4 },
    ]);
  });
});

describe("Escape Velocity (worked by hand)", () => {
  it("round 1: the Moon's escape speed is 2.376 km/s; below it the probe falls back", () => {
    const o = runEscape(moon, { speed: 2.4 });
    expect(o.bodyEscapeSpeed / 1000).toBeCloseTo(2.3757, 3);
    expect(o.success).toBe(true);
    const slow = runEscape(moon, { speed: 2 });
    expect(slow.escapes).toBe(false);
    expect(slow.maximumAltitudeMeters! / 1000).toBeGreaterThan(0);
    expect(slow.feedback).toMatch(/still negative/);
    expect(runEscape(moon, { speed: 4 }).feedback).toMatch(/wasted fuel/);
  });

  it("round 2: about 4.12 km/s straight up reaches 1000 km", () => {
    const o = runEscape(height, { speed: 4.12 });
    expect(o.maximumAltitudeMeters! / 1000).toBeCloseTo(1000, -1);
    expect(o.requiredSpeed / 1000).toBeCloseTo(4.12, 2);
    expect(o.success).toBe(true);
    expect(runEscape(height, { speed: 3 }).feedback).toMatch(/short of the target/);
    expect(runEscape(height, { speed: 5 }).feedback).toMatch(/too high/);
    expect(runEscape(height, { speed: 11.5 }).feedback).toMatch(/escaped/);
  });

  it("round 3: leaving the Solar System takes 16.65 km/s from Earth, not just 11.2 or 12.3", () => {
    expect(SOLAR_SYSTEM_LAUNCH_SPEED / 1000).toBeCloseTo(16.65, 1);
    const ok = runEscape(solar, { sun: 42.1, speed: 16.7 });
    expect(ok.success).toBe(true);
    expect(ok.speedAtInfinity! / 1000).toBeGreaterThan(12.3);
    const orbit = runEscape(solar, { sun: 42.1, speed: 14 });
    expect(orbit.success).toBe(false);
    expect(orbit.feedback).toMatch(/stays in orbit around the Sun/);
    expect(runEscape(solar, { sun: 42.1, speed: 10 }).feedback).toMatch(/falls back/);
    expect(runEscape(solar, { sun: 42.1, speed: 20 }).feedback).toMatch(/more than 0.5 km\/s above/);
  });

  it("draws a speed curve that ends at the turning point", () => {
    const bound = speedCurve(height, { speed: 4.12 });
    expect(bound.at(-1)!.x).toBeLessThan(1.2);
    const free = speedCurve(height, { speed: 11.5 });
    expect(free.at(-1)!.x).toBeCloseTo(10, 5);
  });

  it("guards the controls", () => {
    checkGuards(EscapeVelocityPage, ESCAPE_META, { sliders: { "Launch speed": 2 }, prediction: 2.4, feedback: /still negative/ });
  });

  it("plays through", async () => {
    await playThrough(EscapeVelocityPage, ESCAPE_META, [
      { sliders: { "Launch speed": 2.4 }, prediction: 2.38 },
      { sliders: { "Launch speed": 4.12 }, prediction: 4.12 },
      { sliders: { "Launch speed": 16.7 }, prediction: 16.7 },
    ]);
  });
});

describe("catalog", () => {
  it("lists all ten new games as playable and none as coming soon", () => {
    const ids = ["microscope-builder", "sound-creator", "virtual-guitar", "wave-simulator", "echo-explorer", "frequency-detective", "wave-interference", "planet-designer", "solar-system-builder", "escape-velocity"];
    for (const id of ids) {
      expect(findCatalogEntry(id)?.kind).toBe("game");
    }
    const waves = PHYSICS_WORLDS.find((w) => w.id === "waves")!;
    expect(waves.entries).toHaveLength(6);
    expect(waves.comingSoon).toEqual([]);
    expect(PHYSICS_WORLDS.find((w) => w.id === "optics")!.comingSoon).toEqual([]);
    expect(PHYSICS_WORLDS.find((w) => w.id === "astronomy")!.comingSoon).toEqual(["Asteroid Mission", "Black Hole Explorer"]);
  });
});
