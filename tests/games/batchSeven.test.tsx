import { describe, expect, it } from "vitest";
import { MISSION_META, MISSION_ROUNDS, REQUIRED_LEAD_DEGREES, runMission, type MissionRound } from "../../src/features/games/asteroid-mission/asteroidMission";
import { AsteroidMissionPage } from "../../src/features/games/asteroid-mission/AsteroidMissionPage";
import { HOLE_META, HOLE_ROUNDS, runHole, type HoleRound } from "../../src/features/games/black-hole-explorer/blackHoleExplorer";
import { BlackHoleExplorerPage } from "../../src/features/games/black-hole-explorer/BlackHoleExplorerPage";
import { ATOM_META, ATOM_ROUNDS, runAtom, type AtomRound } from "../../src/features/games/atom-builder/atomBuilder";
import { AtomBuilderPage } from "../../src/features/games/atom-builder/AtomBuilderPage";
import { TRACK_META, TRACK_ROUNDS, ELECTRON_ENERGY_MEV, runTrack, type TrackRound } from "../../src/features/games/particle-detective/particleDetective";
import { ParticleDetectivePage } from "../../src/features/games/particle-detective/ParticleDetectivePage";
import { MATTER_META, MATTER_ROUNDS, runMatter, type MatterRound } from "../../src/features/games/wave-or-particle/waveOrParticle";
import { WaveOrParticlePage } from "../../src/features/games/wave-or-particle/WaveOrParticlePage";
import { PUZZLE_META, PUZZLE_ROUNDS, runPuzzle, type PuzzleRound } from "../../src/features/games/quantum-puzzle/quantumPuzzle";
import { QuantumPuzzlePage } from "../../src/features/games/quantum-puzzle/QuantumPuzzlePage";
import { DECAY_META, DECAY_ROUNDS, runDecay, type DecayRound } from "../../src/features/games/radioactive-countdown/radioactiveCountdown";
import { RadioactiveCountdownPage } from "../../src/features/games/radioactive-countdown/RadioactiveCountdownPage";
import { LAB_META, LAB_ROUNDS, runLab, type LabRound } from "../../src/features/games/photoelectric-lab/photoelectricLab";
import { PhotoelectricLabPage } from "../../src/features/games/photoelectric-lab/PhotoelectricLabPage";
import { SHIP_META, SHIP_ROUNDS, runShip, type ShipRound } from "../../src/features/games/ship-designer/shipDesigner";
import { ShipDesignerPage } from "../../src/features/games/ship-designer/ShipDesignerPage";
import { PRESSURE_META, PRESSURE_ROUNDS, runPressure, type PressureRound } from "../../src/features/games/water-pressure/waterPressure";
import { WaterPressurePage } from "../../src/features/games/water-pressure/WaterPressurePage";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [shape, burn, window_] = MISSION_ROUNDS as [MissionRound, MissionRound, MissionRound];
const [horizon, clocks, station] = HOLE_ROUNDS as [HoleRound, HoleRound, HoleRound];
const [red, binding, line] = ATOM_ROUNDS as [AtomRound, AtomRound, AtomRound];
const [light, nucleus, fast] = TRACK_ROUNDS as [TrackRound, TrackRound, TrackRound];
const [voltage, fringes, neutron] = MATTER_ROUNDS as [MatterRound, MatterRound, MatterRound];
const [superposition, interferometer, polarizers] = PUZZLE_ROUNDS as [PuzzleRound, PuzzleRound, PuzzleRound];
const [time, count, activity] = DECAY_ROUNDS as [DecayRound, DecayRound, DecayRound];
const [wavelength, stopping, metal] = LAB_ROUNDS as [LabRound, LabRound, LabRound];
const [river, sea, upright] = SHIP_ROUNDS as [ShipRound, ShipRound, ShipRound];
const [diver, submarine, tower] = PRESSURE_ROUNDS as [PressureRound, PressureRound, PressureRound];

describe("Asteroid Mission (worked by hand)", () => {
  it("round 1: a far point of 1.5 AU takes 255 days; short or long misses the asteroid", () => {
    const o = runMission(shape, { apoapsis: 1.5 });
    expect(o.transferDays).toBeCloseTo(255.2, 0);
    expect(o.success).toBe(true);
    expect(runMission(shape, { apoapsis: 1.2 }).feedback).toMatch(/short of/);
    expect(runMission(shape, { apoapsis: 2.5 }).feedback).toMatch(/past/);
  });
  it("round 2: adding 2.84 km/s to Earth's 29.78 km/s reaches 1.5 AU; too much escapes", () => {
    const o = runMission(burn, { burn: 2.84 });
    expect(o.apoapsisAu).toBeCloseTo(1.5, 1);
    expect(o.success).toBe(true);
    expect(runMission(burn, { burn: 1 }).feedback).toMatch(/short of/);
    expect(runMission(burn, { burn: 13 }).feedback).toMatch(/escape/);
  });
  it("round 3: the asteroid must lead by 43° for the 255-day coast", () => {
    expect(REQUIRED_LEAD_DEGREES).toBeCloseTo(43.06, 1);
    expect(runMission(window_, { apoapsis: 1.5, lead: 43 }).success).toBe(true);
    const wrong = runMission(window_, { apoapsis: 1.5, lead: 90 });
    expect(wrong.success).toBe(false);
    expect(wrong.feedback).toMatch(/ahead of/);
  });
  it("plays through", async () => {
    checkGuards(AsteroidMissionPage, MISSION_META, { sliders: { "Far point of the transfer orbit": 1.2 }, prediction: 255, feedback: /short of/ });
  });
  it("completes", async () => {
    await playThrough(AsteroidMissionPage, MISSION_META, [
      { sliders: { "Far point of the transfer orbit": 1.5 }, prediction: 255 },
      { sliders: { "Departure burn": 2.84 }, prediction: 2.84 },
      { sliders: { "Asteroid's lead angle at launch": 43 }, prediction: 43 },
    ]);
  });
});

describe("Black Hole Explorer (worked by hand)", () => {
  it("round 1: 10.16 solar masses have a 30 km horizon", () => {
    expect(runHole(horizon, { mass: 10.2 }).horizonKm).toBeCloseTo(30.1, 1);
    expect(runHole(horizon, { mass: 10.2 }).success).toBe(true);
    expect(runHole(horizon, { mass: 5 }).feedback).toMatch(/too small/);
  });
  it("round 2: a clock at 39.4 km ticks at half speed; inside the horizon none can rest", () => {
    const o = runHole(clocks, { mass: 10, radius: 39.5 });
    expect(o.timeFactor).toBeCloseTo(0.5, 2);
    expect(o.success).toBe(true);
    expect(runHole(clocks, { mass: 10, radius: 100 }).feedback).toMatch(/too fast/);
    expect(runHole(clocks, { mass: 10, radius: 25 }).feedback).toMatch(/inside the event horizon|at or inside/);
  });
  it("round 3: the closest stable orbit is 88.6 km; nearer ones are unstable or impossible", () => {
    expect(runHole(station, { mass: 10, radius: 89 }).success).toBe(true);
    expect(runHole(station, { mass: 10, radius: 60 }).feedback).toMatch(/unstable/);
    expect(runHole(station, { mass: 10, radius: 40 }).feedback).toMatch(/no circular orbit exists/);
    expect(runHole(station, { mass: 10, radius: 25 }).feedback).toMatch(/inside the event horizon/);
    expect(runHole(station, { mass: 10, radius: 140 }).feedback).toMatch(/far outside/);
  });
  it("guards and completes", async () => {
    checkGuards(BlackHoleExplorerPage, HOLE_META, { sliders: { Mass: 5 }, prediction: 10, feedback: /too small/ });
  });
  it("plays through", async () => {
    await playThrough(BlackHoleExplorerPage, HOLE_META, [
      { sliders: { Mass: 10.2 }, prediction: 10.2 },
      { sliders: { "Radius of the clock": 39.5 }, prediction: 39.4 },
      { sliders: { "Orbital radius": 89 }, prediction: 88.6 },
    ]);
  });
});

describe("Atom Builder (worked by hand)", () => {
  it("round 1: n = 3 gives red 656 nm; n = 2 gives no emission", () => {
    const o = runAtom(red, { z: 1, lower: 2, upper: 3 });
    expect(o.wavelengthNm).toBeCloseTo(656.1, 0);
    expect(o.region).toBe("visible");
    expect(o.success).toBe(true);
    expect(runAtom(red, { z: 1, lower: 2, upper: 2 }).feedback).toMatch(/No light is emitted/);
    expect(runAtom(red, { z: 1, lower: 2, upper: 5 }).success).toBe(false);
  });
  it("round 2: Z²/n² = 1/4 binds 3.4 eV for (1,2), (2,4) and (3,6)", () => {
    for (const [z, n] of [[1, 2], [2, 4], [3, 6]] as const) {
      expect(runAtom(binding, { z, upper: n, lower: 1 }).success).toBe(true);
    }
    expect(runAtom(binding, { z: 1, upper: 1, lower: 1 }).bindingEv).toBeCloseTo(13.6, 1);
    expect(runAtom(binding, { z: 2, upper: 2, lower: 1 }).success).toBe(false);
  });
  it("round 3: 4→2 is 486 nm at 2.55 eV; ultraviolet jumps to n = 1 are rejected", () => {
    const o = runAtom(line, { z: 1, upper: 4, lower: 2 });
    expect(o.photonEv).toBeCloseTo(2.551, 2);
    expect(o.success).toBe(true);
    const uv = runAtom(line, { z: 1, upper: 3, lower: 1 });
    expect(uv.region).toBe("ultraviolet");
    expect(uv.feedback).toMatch(/ultraviolet/);
  });
  it("guards and completes", async () => {
    checkGuards(AtomBuilderPage, ATOM_META, { sliders: { "Upper level": 5 }, prediction: 656, feedback: /not 656 nm/ });
  });
  it("plays through", async () => {
    await playThrough(AtomBuilderPage, ATOM_META, [
      { sliders: { "Upper level": 3 }, prediction: 656 },
      { sliders: { "Protons Z": 2, "Electron level n": 4 }, prediction: 3.4 },
      { sliders: { "Upper level": 4, "Lower level": 2 }, prediction: 2.55 },
    ]);
  });
});

describe("Particle Detective (worked by hand)", () => {
  it("round 1: 1.044 m at 1000 km/s and 0.01 T is a proton, 1836 electron masses", () => {
    const o = runTrack(light, { field: 0.01, mass: 1836 });
    expect(o.measuredRadiusMeters).toBeCloseTo(1.0443, 3);
    expect(o.success).toBe(true);
    expect(runTrack(light, { field: 0.01, mass: 1 }).success).toBe(false);
    expect(runTrack(light, { field: 0.01, mass: 1 }).radiusMeters).toBeCloseTo(5.69e-4, 6);
    expect(runTrack(light, { field: 0.01, mass: 3000 }).feedback).toMatch(/wider/);
  });
  it("round 2: charge 2 and mass 4 is an alpha particle; q = 1, A = 2 has the right radius but the wrong ionization", () => {
    expect(runTrack(nucleus, { field: 0.01, charge: 2, mass: 4 }).success).toBe(true);
    const deuteron = runTrack(nucleus, { field: 0.01, charge: 1, mass: 2 });
    expect(deuteron.radiusMeters).toBeCloseTo(deuteron.measuredRadiusMeters, 6);
    expect(deuteron.success).toBe(false);
    expect(deuteron.feedback).toMatch(/charge must be 2e/);
    expect(runTrack(nucleus, { field: 0.01, charge: 2, mass: 6 }).feedback).toMatch(/mass 6/);
  });
  it("round 3: pc = 15 MeV gives T = 14.49 MeV, not the classical 220 MeV", () => {
    expect(ELECTRON_ENERGY_MEV).toBeCloseTo(14.49, 1);
    const o = runTrack(fast, { field: 0.5, energy: 14.5 });
    expect(o.radiusMeters).toBeCloseTo(0.1, 3);
    expect(o.momentumMeVc).toBeCloseTo(15, 0);
    expect(o.success).toBe(true);
    expect(runTrack(fast, { field: 0.5, energy: 200 }).feedback).toMatch(/not ½mv²/);
  });
  it("guards and completes", async () => {
    checkGuards(ParticleDetectivePage, TRACK_META, { sliders: { "Mass of the particle": 100 }, prediction: 1836, feedback: /tighter/ });
  });
  it("plays through", async () => {
    await playThrough(ParticleDetectivePage, TRACK_META, [
      { sliders: { "Mass of the particle": 1836 }, prediction: 1836 },
      { sliders: { Charge: 2, "Mass number": 4 }, prediction: 4 },
      { sliders: { "Kinetic energy": 14.5 }, prediction: 14.5 },
    ]);
  });
});

describe("Wave or Particle? (worked by hand)", () => {
  it("round 1: 150 V gives 0.1 nm; 50 V is too long", () => {
    const o = runMatter(voltage, { volts: 150 });
    expect(o.wavelengthNm).toBeCloseTo(0.1004, 3);
    expect(o.success).toBe(true);
    expect(runMatter(voltage, { volts: 50 }).feedback).toMatch(/too long/);
    expect(runMatter(voltage, { volts: 400 }).feedback).toMatch(/too short/);
  });
  it("round 2: 37.6 V makes 0.2 nm electrons and 0.2 mm fringes", () => {
    const o = runMatter(fringes, { slits: 1, screen: 1, volts: 38 });
    expect(o.fringeSpacingMm).toBeCloseTo(0.199, 2);
    expect(o.success).toBe(true);
    expect(runMatter(fringes, { slits: 1, screen: 1, volts: 100 }).feedback).toMatch(/Lower the voltage|Raise the voltage/);
    expect(runMatter(fringes, { slits: 1, screen: 1, volts: 100 }).fringeSpacingMm!).toBeLessThan(0.2);
  });
  it("round 3: a neutron at 3.22 km/s matches a 100 V electron", () => {
    const o = runMatter(neutron, { volts: 100, speed: 3220 });
    expect(o.success).toBe(true);
    expect(o.targetWavelengthNm).toBeCloseTo(0.1227, 3);
    expect(o.predictionActual).toBeCloseTo(3224, -1);
    expect(runMatter(neutron, { volts: 100, speed: 2000 }).feedback).toMatch(/longer/);
  });
  it("guards and completes", async () => {
    checkGuards(WaveOrParticlePage, MATTER_META, { sliders: { "Accelerating voltage": 50 }, prediction: 150, feedback: /too long/ });
  });
  it("plays through", async () => {
    await playThrough(WaveOrParticlePage, MATTER_META, [
      { sliders: { "Accelerating voltage": 150 }, prediction: 150.4 },
      { sliders: { "Accelerating voltage": 38 }, prediction: 37.6 },
      { sliders: { "Neutron speed": 3220 }, prediction: 3224 },
    ]);
  });
});

describe("Quantum Puzzle (worked by hand)", () => {
  it("round 1: θ = 120° gives P(0) = 0.25", () => {
    expect(runPuzzle(superposition, { theta: 120 }).probability).toBeCloseTo(0.25, 12);
    expect(runPuzzle(superposition, { theta: 120 }).success).toBe(true);
    expect(runPuzzle(superposition, { theta: 90 }).probability).toBeCloseTo(0.5, 12);
    expect(runPuzzle(superposition, { theta: 90 }).feedback).toMatch(/above the target/);
  });
  it("round 2: φ = 60° or 300° gives 0.75 at port 0; 0° sends everything to port 0", () => {
    expect(runPuzzle(interferometer, { phase: 60 }).success).toBe(true);
    expect(runPuzzle(interferometer, { phase: 300 }).success).toBe(true);
    expect(runPuzzle(interferometer, { phase: 0 }).probability).toBeCloseTo(1, 12);
    expect(runPuzzle(interferometer, { phase: 180 }).probability).toBeCloseTo(0, 12);
  });
  it("round 3: a middle polarizer at 30° or 60° passes 18.75 %, at 45° 25 %, at 0° nothing", () => {
    for (const middle of [30, 60]) {
      expect(runPuzzle(polarizers, { source: 0, last: 90, middle }).success).toBe(true);
    }
    expect(runPuzzle(polarizers, { source: 0, last: 90, middle: 45 }).probability).toBeCloseTo(0.25, 12);
    expect(runPuzzle(polarizers, { source: 0, last: 90, middle: 0 }).probability).toBeCloseTo(0, 12);
    expect(runPuzzle(polarizers, { source: 0, last: 90, middle: 45 }).feedback).toMatch(/above the target/);
  });
  it("guards and completes", async () => {
    checkGuards(QuantumPuzzlePage, PUZZLE_META, { sliders: { "Superposition angle θ": 90 }, prediction: 120, feedback: /above the target/ });
  });
  it("plays through", async () => {
    await playThrough(QuantumPuzzlePage, PUZZLE_META, [
      { sliders: { "Superposition angle θ": 120 }, prediction: 120 },
      { sliders: { "Phase shift φ": 60 }, prediction: 60 },
      { sliders: { "Middle polarizer angle": 30 }, prediction: 30 },
    ]);
  });
});

describe("Radioactive Countdown (worked by hand)", () => {
  it("round 1: three half-lives is 24.06 days and 12.5 %", () => {
    const o = runDecay(time, { halfLife: 8.02, days: 24.1 });
    expect(o.fraction).toBeCloseTo(0.125, 3);
    expect(o.success).toBe(true);
    expect(runDecay(time, { halfLife: 8.02, days: 10 }).feedback).toMatch(/wait longer/);
    expect(runDecay(time, { halfLife: 8.02, days: 40 }).feedback).toMatch(/less than needed/);
  });
  it("round 2: 177 ± 24 remain after 2.5 half-lives, and the simulated sample is repeatable", () => {
    const o = runDecay(count, { halfLife: 10, estimate: 177 });
    expect(o.expected).toBeCloseTo(176.8, 1);
    expect(o.success).toBe(true);
    expect(Math.abs(o.simulated! - 176.8)).toBeLessThan(40);
    expect(runDecay(count, { halfLife: 10, estimate: 177 }).simulated).toBe(o.simulated);
    expect(runDecay(count, { halfLife: 10, estimate: 250 }).success).toBe(false);
    expect(runDecay(count, { halfLife: 10, estimate: 160 }).success).toBe(true);
    expect(runDecay(count, { halfLife: 10, estimate: 500 }).feedback).toMatch(/more than 2σ/);
  });
  it("round 3: 1 µg of americium-241 emits 127 kBq", () => {
    const o = runDecay(activity, { halfLife: 432.2, activity: 127 });
    expect(o.activityKilobecquerels).toBeCloseTo(127, 0);
    expect(o.success).toBe(true);
    expect(runDecay(activity, { halfLife: 432.2, activity: 50 }).feedback).toMatch(/too low/);
  });
  it("guards and completes", async () => {
    checkGuards(RadioactiveCountdownPage, DECAY_META, { sliders: { "Storage time": 10 }, prediction: 24, feedback: /wait longer/ });
  });
  it("plays through", async () => {
    await playThrough(RadioactiveCountdownPage, DECAY_META, [
      { sliders: { "Storage time": 24.1 }, prediction: 24.06 },
      { sliders: { "Nuclei remaining": 177 }, prediction: 177 },
      { sliders: { Activity: 127 }, prediction: 127 },
    ]);
  });
});

describe("Photoelectric Lab (worked by hand)", () => {
  it("round 1: 378 nm gives 1.0 eV electrons from sodium; red light gives none", () => {
    const o = runLab(wavelength, { work: 2.28, wavelength: 378 });
    expect(o.kineticEnergyEv).toBeCloseTo(1.0, 1);
    expect(o.success).toBe(true);
    expect(runLab(wavelength, { work: 2.28, wavelength: 650 }).feedback).toMatch(/no electrons at all, however bright/);
    expect(runLab(wavelength, { work: 2.28, wavelength: 250 }).feedback).toMatch(/too fast/);
    expect(runLab(wavelength, { work: 2.28, wavelength: 500 }).feedback).toMatch(/too slow/);
  });
  it("round 2: 250 nm on potassium needs a 2.66 V stopping voltage", () => {
    const o = runLab(stopping, { work: 2.3, wavelength: 250, voltage: 2.66 });
    expect(o.stoppingVolts).toBeCloseTo(2.659, 3);
    expect(o.success).toBe(true);
    expect(runLab(stopping, { work: 2.3, wavelength: 250, voltage: 1 }).feedback).toMatch(/too weak/);
    expect(runLab(stopping, { work: 2.3, wavelength: 250, voltage: 4 }).feedback).toMatch(/more than needed/);
  });
  it("round 3: φ = 2.60 eV leaves 0.5 eV with 400 nm light", () => {
    expect(runLab(metal, { wavelength: 400, work: 2.6 }).success).toBe(true);
    expect(runLab(metal, { wavelength: 400, work: 4 }).feedback).toMatch(/no electrons/);
    expect(runLab(metal, { wavelength: 400, work: 1.5 }).feedback).toMatch(/too much/);
  });
  it("guards and completes", async () => {
    checkGuards(PhotoelectricLabPage, LAB_META, { sliders: { Wavelength: 650 }, prediction: 3.3, feedback: /no electrons at all/ });
  });
  it("plays through", async () => {
    await playThrough(PhotoelectricLabPage, LAB_META, [
      { sliders: { Wavelength: 378 }, prediction: 3.28 },
      { sliders: { "Reverse voltage": 2.66 }, prediction: 2.66 },
      { sliders: { "Work function of the metal": 2.6 }, prediction: 2.6 },
    ]);
  });
});

describe("Ship Designer (worked by hand)", () => {
  it("round 1: 140 t of cargo gives a 2.0 m draft in fresh water", () => {
    const o = runShip(river, { density: 1000, cargo: 140 });
    expect(o.draftMeters).toBeCloseTo(2, 10);
    expect(o.freeboardMeters).toBeCloseTo(2, 10);
    expect(o.success).toBe(true);
    expect(runShip(river, { density: 1000, cargo: 300 }).feedback).toMatch(/too deep/);
    expect(runShip(river, { density: 1000, cargo: 100 }).feedback).toMatch(/too shallow/);
  });
  it("round 2: 269 t reaches the 3 m load line in seawater; 300 t overloads", () => {
    expect(runShip(sea, { density: 1025, cargo: 269 }).success).toBe(true);
    expect(runShip(sea, { density: 1025, cargo: 269 }).draftMeters).toBeCloseTo(3, 3);
    expect(runShip(sea, { density: 1025, cargo: 300 }).feedback).toMatch(/overloaded/);
    expect(runShip(sea, { density: 1025, cargo: 150 }).feedback).toMatch(/under-loaded/);
    expect(runShip(river, { density: 1000, cargo: 140 }).draftMeters).toBeGreaterThan(runShip(sea, { density: 1025, cargo: 140 }).draftMeters);
  });
  it("round 3: a 5.5 m beam is stable (GM 1.4 m); 4 m barely; 3 m capsizes; 7 m is too stiff", () => {
    expect(runShip(upright, { density: 1025, beam: 5.5 }).success).toBe(true);
    expect(runShip(upright, { density: 1025, beam: 5.5 }).metacentricHeight).toBeCloseTo(1.4, 1);
    expect(runShip(upright, { density: 1025, beam: 4 }).feedback).toMatch(/marginal/);
    expect(runShip(upright, { density: 1025, beam: 3 }).feedback).toMatch(/capsizes/);
    expect(runShip(upright, { density: 1025, beam: 7 }).feedback).toMatch(/too stiff/);
  });
  it("guards and completes", async () => {
    checkGuards(ShipDesignerPage, SHIP_META, { sliders: { Cargo: 100 }, prediction: 140, feedback: /too shallow/ });
  });
  it("plays through", async () => {
    await playThrough(ShipDesignerPage, SHIP_META, [
      { sliders: { Cargo: 140 }, prediction: 140 },
      { sliders: { Cargo: 269 }, prediction: 269 },
      { sliders: { Beam: 5.5 }, prediction: 1.4 },
    ]);
  });
});

describe("Water Pressure (worked by hand)", () => {
  it("round 1: 2 atmospheres of water is 20.2 m of seawater", () => {
    const o = runPressure(diver, { density: 1025, depth: 20.2 });
    expect(o.absolutePa / 101325).toBeCloseTo(3, 1);
    expect(o.success).toBe(true);
    expect(runPressure(diver, { density: 1025, depth: 10 }).feedback).toMatch(/less than 3/);
    expect(runPressure(diver, { density: 1025, depth: 50 }).feedback).toMatch(/more than 3/);
  });
  it("round 2: the window takes 50 kN at 70.4 m; at 68 m it is safe, at 80 m it fails", () => {
    expect(runPressure(submarine, { density: 1025, depth: 70 }).success).toBe(true);
    expect(runPressure(submarine, { density: 1025, depth: 70 }).forceNewtons! / 1000).toBeCloseTo(49.7, 0);
    expect(runPressure(submarine, { density: 1025, depth: 80 }).feedback).toMatch(/would fail/);
    expect(runPressure(submarine, { density: 1025, depth: 40 }).feedback).toMatch(/dive deeper/);
  });
  it("round 3: 30.6 m of water gives 300 kPa at the tap", () => {
    expect(runPressure(tower, { density: 1000, depth: 30.5 }).gaugePa / 1000).toBeCloseTo(299, 0);
    expect(runPressure(tower, { density: 1000, depth: 30.5 }).success).toBe(true);
    expect(runPressure(tower, { density: 1000, depth: 10 }).feedback).toMatch(/too low/);
  });
  it("guards and completes", async () => {
    checkGuards(WaterPressurePage, PRESSURE_META, { sliders: { Depth: 10 }, prediction: 20, feedback: /less than 3/ });
  });
  it("plays through", async () => {
    await playThrough(WaterPressurePage, PRESSURE_META, [
      { sliders: { Depth: 20.2 }, prediction: 20.16 },
      { sliders: { "Depth of the window": 70 }, prediction: 70.4 },
      { sliders: { "Height of the water above the tap": 30.5 }, prediction: 30.6 },
    ]);
  });
});

describe("catalog", () => {
  it("lists all ten new games as playable", () => {
    const ids = ["asteroid-mission", "black-hole-explorer", "atom-builder", "particle-detective", "wave-or-particle", "quantum-puzzle", "radioactive-countdown", "photoelectric-lab", "ship-designer", "water-pressure"];
    for (const id of ids) {
      expect(findCatalogEntry(id)?.kind).toBe("game");
    }
    expect(PHYSICS_WORLDS.find((w) => w.id === "astronomy")!.comingSoon).toEqual([]);
    expect(PHYSICS_WORLDS.find((w) => w.id === "modern-physics")!.comingSoon).toEqual([]);
    expect(PHYSICS_WORLDS.find((w) => w.id === "fluids")!.comingSoon).toEqual(["Dam Engineer", "Flight Simulator", "Pipe Puzzle", "Floating Challenge"]);
  });
});
