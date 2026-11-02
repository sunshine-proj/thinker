import { describe, expect, it } from "vitest";
import { PLANT_ROUNDS, POWER_PLANT_META, emfWaveform, runPlant, type PlantRound } from "../../src/features/games/power-plant/powerPlant";
import { PowerPlantPage } from "../../src/features/games/power-plant/PowerPlantPage";
import { CRANE_META, CRANE_ROUNDS, forceCurve, runCrane, type CraneRound } from "../../src/features/games/electromagnetic-crane/electromagneticCrane";
import { ElectromagneticCranePage } from "../../src/features/games/electromagnetic-crane/ElectromagneticCranePage";
import { ACCELERATOR_META, ACCELERATOR_ROUNDS, energyCurve, runAccelerator, type AcceleratorRound } from "../../src/features/games/particle-accelerator/particleAccelerator";
import { ParticleAcceleratorPage } from "../../src/features/games/particle-accelerator/ParticleAcceleratorPage";
import { MAZE_META, MAZE_ROUNDS, magneticMaze, runMaze, traceMazePath, type MazeRound } from "../../src/features/games/magnetic-maze/magneticMaze";
import { MagneticMazePage } from "../../src/features/games/magnetic-maze/MagneticMazePage";
import { STANDARD_GRAVITY as g } from "../../src/physics/core";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [town, efficient, grid] = PLANT_ROUNDS as [PlantRound, PlantRound, PlantRound];
const [bin, heat, saturation] = CRANE_ROUNDS as [CraneRound, CraneRound, CraneRound];
const [resonance, tenMev, relativistic] = ACCELERATOR_ROUNDS as [AcceleratorRound, AcceleratorRound, AcceleratorRound];
const [bend, speedField, proton] = MAZE_ROUNDS as [MazeRound, MazeRound, MazeRound];

describe("Power Plant (worked by hand)", () => {
  it("round 1: 500 W needs ε_peak ≈ 169.7 V, i.e. about 101 rpm", () => {
    const o = runPlant(town, { turns: 200, field: 0.8, rpm: 101 });
    expect(o.output.peakEmfVolts).toBeCloseTo(200 * 0.8 * 0.1 * ((2 * Math.PI * 101) / 60), 8);
    expect(o.success).toBe(true);
    expect(runPlant(town, { turns: 200, field: 0.8, rpm: 80 }).feedback).toMatch(/short of/);
    expect(runPlant(town, { turns: 200, field: 0.8, rpm: 130 }).feedback).toMatch(/above/);
  });

  it("round 2: efficiency requires N ≤ 111 turns", () => {
    expect(runPlant(efficient, { turns: 100, field: 0.8, rpm: 235 }).success).toBe(true);
    // 200 turns reaches 800 W at a lower speed but wastes too much in the coil.
    const wasteful = runPlant(efficient, { turns: 200, field: 0.8, rpm: 126 });
    expect(wasteful.output.loadPowerWatts).toBeGreaterThan(700);
    expect(wasteful.success).toBe(false);
    expect(wasteful.feedback).toMatch(/Only \d+% of the power reaches the load/);
  });

  it("round 3: the grid frequency is 50 Hz at 3,000 rpm and B follows from the target", () => {
    const o = runPlant(grid, { turns: 40, field: 0.23, rpm: 3000 });
    expect(o.output.frequencyHertz).toBe(50);
    expect(o.success).toBe(true);
    expect(o.output.efficiency).toBeGreaterThanOrEqual(0.95);
    expect(runPlant(grid, { turns: 100, field: 0.1, rpm: 3000 }).success).toBe(false);
  });

  it("draws two full cycles of the EMF", () => {
    const o = runPlant(town, { turns: 200, field: 0.8, rpm: 101 }).output;
    const wave = emfWaveform(o);
    expect(wave[0]!.y).toBeCloseTo(0, 8);
    expect(Math.max(...wave.map((p) => p.y))).toBeCloseTo(o.peakEmfVolts, 0);
    expect(wave.at(-1)!.x).toBeCloseTo(2 / o.frequencyHertz, 8);
  });
});

describe("Electromagnetic Crane (worked by hand)", () => {
  it("round 1: ≈1.33 A lifts 1,000 kg with 1.0–1.25× the weight", () => {
    const o = runCrane(bin, { turns: 1000, area: 0.01, current: 1.33 });
    expect(o.forceRatio).toBeCloseTo(1.007, 2);
    expect(o.success).toBe(true);
    expect(runCrane(bin, { turns: 1000, area: 0.01, current: 1.0 }).feedback).toMatch(/load weighs/);
    expect(runCrane(bin, { turns: 1000, area: 0.01, current: 1.6 }).feedback).toMatch(/above the 1.25 allowed/);
  });

  it("the pull grows with the square of the current below saturation", () => {
    const f = (i: number) => runCrane(bin, { turns: 1000, area: 0.01, current: i }).forceNewtons;
    expect(f(1.2) / f(0.6)).toBeCloseTo(4, 8);
  });

  it("round 2: ampere-turns set the field but more turns run cooler", () => {
    const few = runCrane(heat, { turns: 400, area: 0.01, current: 4.75 });
    const many = runCrane(heat, { turns: 1000, area: 0.01, current: 1.9 });
    expect(few.forceNewtons).toBeCloseTo(many.forceNewtons, -2);
    expect(many.success).toBe(true);
    expect(few.success).toBe(false);
    expect(few.feedback).toMatch(/dissipates .* W/);
    expect(many.powerWatts).toBeLessThan(few.powerWatts);
  });

  it("round 3: saturation caps the field at 1.6 T, so area decides", () => {
    const small = runCrane(saturation, { turns: 1500, area: 0.01, current: 2 });
    expect(small.saturated).toBe(true);
    expect(small.fieldTesla).toBe(1.6);
    expect(small.feedback).toMatch(/already saturated/);
    expect(runCrane(saturation, { turns: 1500, area: 0.016, current: 1.5 }).success).toBe(true);
    expect(runCrane(saturation, { turns: 1500, area: 0.016, current: 1.5 }).forceNewtons).toBeGreaterThan(3000 * g);
  });

  it("charts a force curve that levels off", () => {
    const curve = forceCurve(saturation, { turns: 1500, area: 0.016, current: 1 });
    expect(curve.at(-1)!.y).toBeCloseTo(curve.at(-2)!.y, 6);
    expect(curve[5]!.y).toBeLessThan(curve.at(-1)!.y);
  });
});

describe("Particle Accelerator Laboratory (worked by hand)", () => {
  it("round 1: B = 1.31 T resonates a proton with 20 MHz, giving about 20.6 MeV", () => {
    const o = runAccelerator(resonance, { field: 1.31, radius: 0.5 });
    expect(o.cyclotronFrequencyMHz).toBeCloseTo(19.97, 1);
    expect(o.success).toBe(true);
    expect(o.energyMeV).toBeCloseTo(20.5, 0);
    expect(runAccelerator(resonance, { field: 1.0, radius: 0.5 }).feedback).toMatch(/out of step.*Raise the field/);
    expect(runAccelerator(resonance, { field: 1.6, radius: 0.5 }).feedback).toMatch(/Lower the field/);
  });

  it("round 2: resonance and radius together give 10 MeV", () => {
    const o = runAccelerator(tenMev, { field: 0.985, radius: 0.46 });
    expect(o.success).toBe(true);
    expect(o.energyMeV).toBeCloseTo(9.83, 1);
    expect(runAccelerator(tenMev, { field: 0.985, radius: 0.7 }).feedback).toMatch(/not 10 MeV/);
  });

  it("round 3 (advanced): the relativistic radius for 250 MeV is about 1.62 m, not the classical one", () => {
    const o = runAccelerator(relativistic, { field: 1.5, radius: 1.62 });
    expect(o.success).toBe(true);
    expect(o.energyMeV).toBeCloseTo(249.6, 0);
    expect(o.classicalEnergyMeV).toBeGreaterThan(o.relativisticEnergyMeV);
    // The classical-formula radius (≈1.4 m) misses the target.
    const classicalRadius = Math.sqrt((2 * 1.6726e-27 * 250e6 * 1.602e-19)) / (1.602e-19 * 1.5);
    expect(runAccelerator(relativistic, { field: 1.5, radius: Number(classicalRadius.toFixed(2)) }).success).toBe(false);
  });

  it("draws classical and relativistic energy curves that diverge at large radius", () => {
    const rel = energyCurve(relativistic, { field: 1.5, radius: 1 }, true);
    const cls = energyCurve(relativistic, { field: 1.5, radius: 1 }, false);
    expect(rel[1]!.y / cls[1]!.y).toBeCloseTo(1, 1);
    expect(rel.at(-1)!.y).toBeLessThan(cls.at(-1)!.y);
  });
});

describe("Magnetic Maze (worked by hand)", () => {
  it("round 1: B ≈ 10 µT bends the electron through (1.0, 0.6)", () => {
    const o = runMaze(bend, { speed: 2, field: 10.05 });
    expect(o.success).toBe(true);
    expect(o.path.orbitRadius).toBeCloseTo(1.1315, 3);
    expect(runMaze(bend, { speed: 2, field: 20 }).feedback).toMatch(/misses the target/);
  });

  it("the simulated circle has the analytic radius r = mv/(eB)", () => {
    const far: MazeRound = { ...bend, target: { x: 10, y: 10, radius: 0.01 }, arenaHalfSize: 5 };
    const path = traceMazePath(far, { speed: 2, field: 20 });
    const top = Math.max(...path.points.map((p) => p.y));
    expect(top).toBeCloseTo(2 * (path.orbitRadius as number), 1);
    // The magnetic force does no work: the speed is unchanged, so the path length per step is constant.
    const steps = path.points.slice(1).map((p, i) => Math.hypot(p.x - path.points[i]!.x, p.y - path.points[i]!.y));
    expect(Math.max(...steps) / Math.min(...steps)).toBeCloseTo(1, 2);
  });

  it("round 2: speed and field must scale together, within the 12 µT limit", () => {
    expect(runMaze(speedField, { speed: 2, field: 9.1 }).success).toBe(true);
    expect(runMaze(speedField, { speed: 2.5, field: 11.4 }).success).toBe(true);
    expect(runMaze(speedField, { speed: 2, field: 11.4 }).success).toBe(false);
  });

  it("round 3: a proton bends opposite to an electron, so the field sign matters", () => {
    expect(runMaze(proton, { speed: 0.5, field: 4.6 }).success).toBe(true);
    const wrong = runMaze(proton, { speed: 0.5, field: -4.6 });
    expect(wrong.success).toBe(false);
    expect(wrong.feedback).toMatch(/reverse the field/);
  });

  it("refuses a zero field and rejects corrupt saves", () => {
    expect(() => magneticMaze.evaluate(proton, { speed: 0.5, field: 0 }, 1, 1)).toThrow(/non-zero/);
    expect(magneticMaze.parseControl({ speed: 0.5, field: 99 }, proton)).toBeNull();
  });
});

describe("pages", () => {
  it("Power Plant guards and is solved", async () => {
    checkGuards(PowerPlantPage, POWER_PLANT_META, { sliders: { "Rotation speed": 80 }, prediction: 100, feedback: /short of/ });
  });
  it("Power Plant is solved round by round", async () => {
    await playThrough(PowerPlantPage, POWER_PLANT_META, [
      { sliders: { "Rotation speed": 101 }, prediction: 169 },
      { sliders: { Turns: 100, "Rotation speed": 235 }, prediction: 197 },
      { sliders: { Turns: 40, "Magnetic field": 0.23 }, prediction: 289 },
    ]);
  });
  it("Crane guards", () => {
    checkGuards(ElectromagneticCranePage, CRANE_META, { sliders: { "Coil current": 1 }, prediction: 5, feedback: /load weighs/ });
  });
  it("Crane is solved round by round", async () => {
    await playThrough(ElectromagneticCranePage, CRANE_META, [
      { sliders: { "Coil current": 1.33 }, prediction: 9.9 },
      { sliders: { Turns: 1000, "Coil current": 1.9 }, prediction: 20 },
      { sliders: { "Pole area": 0.016, "Coil current": 1.5 }, prediction: 32 },
    ]);
  });
  it("Accelerator guards", () => {
    checkGuards(ParticleAcceleratorPage, ACCELERATOR_META, { sliders: { "Magnetic field": 1 }, prediction: 10, feedback: /out of step/ });
  });
  it("Accelerator is solved round by round", async () => {
    await playThrough(ParticleAcceleratorPage, ACCELERATOR_META, [
      { sliders: { "Magnetic field": 1.31 }, prediction: 20.5 },
      { sliders: { "Magnetic field": 0.985, "Extraction radius": 0.46 }, prediction: 9.8 },
      { sliders: { "Extraction radius": 1.62 }, prediction: 250 },
    ]);
  });
  it("Maze guards", () => {
    checkGuards(MagneticMazePage, MAZE_META, { sliders: { "Magnetic field": 20 }, prediction: 1, feedback: /misses the target/ });
  });
  it("Maze is solved round by round", async () => {
    await playThrough(MagneticMazePage, MAZE_META, [
      { sliders: { "Magnetic field": 10.05 }, prediction: 1.13 },
      { sliders: { Speed: 2, "Magnetic field": 9.1 }, prediction: 1.25 },
      { sliders: { "Magnetic field": 4.6 }, prediction: 1.13 },
    ], 90);
  });
});
