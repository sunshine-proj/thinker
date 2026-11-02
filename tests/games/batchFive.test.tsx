import { describe, expect, it } from "vitest";
import { DETECTIVE_META, DETECTIVE_ROUNDS, finalTemperature, runDetective, type DetectiveRound } from "../../src/features/games/material-detective/materialDetective";
import { MaterialDetectivePage } from "../../src/features/games/material-detective/MaterialDetectivePage";
import { COOKER_META, COOKER_ROUNDS, runCooker, type CookerRound } from "../../src/features/games/solar-cooker/solarCooker";
import { SolarCookerPage } from "../../src/features/games/solar-cooker/SolarCookerPage";
import { RAINBOW_META, RAINBOW_ROUNDS, deviationCurve, runRainbow, type RainbowRound } from "../../src/features/games/rainbow-creator/rainbowCreator";
import { RainbowCreatorPage } from "../../src/features/games/rainbow-creator/RainbowCreatorPage";
import { VISION_META, VISION_ROUNDS, runVision, type VisionRound } from "../../src/features/games/vision-simulator/visionSimulator";
import { VisionSimulatorPage } from "../../src/features/games/vision-simulator/VisionSimulatorPage";
import { MIRROR_META, MIRROR_ROUNDS, runMirror, type MirrorRound } from "../../src/features/games/mirror-illusions/mirrorIllusions";
import { MirrorIllusionsPage } from "../../src/features/games/mirror-illusions/MirrorIllusionsPage";
import { SPECIFIC_HEAT_WATER as CW } from "../../src/physics/core";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [alu, copper, iron] = DETECTIVE_ROUNDS as [DetectiveRound, DetectiveRound, DetectiveRound];
const [boil, track, bake] = COOKER_ROUNDS as [CookerRound, CookerRound, CookerRound];
const [minDev, colour, double] = RAINBOW_ROUNDS as [RainbowRound, RainbowRound, RainbowRound];
const [myope, hyperope, bifocal] = VISION_ROUNDS as [VisionRound, VisionRound, VisionRound];
const [plane, shaving, car] = MIRROR_ROUNDS as [MirrorRound, MirrorRound, MirrorRound];

const detective = (round: DetectiveRound, estimate: number, extra: Record<string, number> = {}) => {
  const values: Record<string, number> = Object.fromEntries(round.controls.map((c) => [c.key, c.initial]));
  return runDetective(round, { ...values, ...extra, estimate });
};

describe("Material Detective (worked by hand)", () => {
  it("round 1: the thermometer shows 30.03 °C and c = 900 identifies aluminium", () => {
    const values = Object.fromEntries(alu.controls.map((c) => [c.key, c.initial]));
    expect(finalTemperature(alu, values)).toBeCloseTo(30.03, 1);
    const c = (0.3 * CW * (30.03 - 20)) / (0.2 * (100 - 30.03));
    expect(c).toBeCloseTo(900, -1);
    expect(detective(alu, 900).success).toBe(true);
    expect(detective(alu, 900).feedback).toMatch(/aluminium/);
  });

  it("a wrong estimate names the nearest known material and says to check the balance", () => {
    const o = detective(alu, 400);
    expect(o.success).toBe(false);
    expect(o.nearest.name).toBe("copper");
    expect(o.feedback).toMatch(/closest to copper/);
    expect(detective(alu, 950).success).toBe(false);
    expect(detective(alu, 940).success).toBe(true);
  });

  it("the thermometer reading changes with the experiment but the answer does not", () => {
    const base = Object.fromEntries(copper.controls.map((c) => [c.key, c.initial]));
    expect(finalTemperature(copper, { ...base, sampleMass: 0.5 })).toBeGreaterThan(finalTemperature(copper, { ...base, sampleMass: 0.1 }));
    expect(detective(copper, 385, { sampleMass: 0.5 }).success).toBe(true);
    expect(detective(copper, 385, { sampleMass: 0.1 }).success).toBe(true);
  });

  it("round 3: ignoring the 120 J/K cup biases the answer and the feedback mentions the cup", () => {
    const values = Object.fromEntries(iron.controls.map((c) => [c.key, c.initial]));
    const final = finalTemperature(iron, values);
    const naive = (0.3 * CW * (final - 20)) / (0.3 * (90 - final)) / 0.3 * 0.3;
    expect(naive).toBeLessThan(450);
    expect(detective(iron, 450).success).toBe(true);
    expect(detective(iron, 300).feedback).toMatch(/include the cup/);
  });
});

describe("Solar Cooker (worked by hand)", () => {
  it("round 1: a 0.5 m dish boils a litre in 33 minutes; too small is too slow, too big too fast", () => {
    const o = runCooker(boil, { diameter: 0.5 });
    expect(o.powerWatts).toBeCloseTo(166.9, 1);
    expect(o.minutes).toBeCloseTo(33.4, 0);
    expect(o.success).toBe(true);
    expect(runCooker(boil, { diameter: 0.3 }).feedback).toMatch(/too slow/);
    expect(runCooker(boil, { diameter: 0.9 }).feedback).toMatch(/faster than needed/);
  });

  it("round 2: aligned with the sun it takes 16.7 minutes; 20° off it is too slow", () => {
    const aligned = runCooker(track, { diameter: 1, tilt: 35 });
    expect(aligned.minutes).toBeCloseTo(16.7, 0);
    expect(aligned.success).toBe(true);
    const off = runCooker(track, { diameter: 1, tilt: 55 });
    expect(off.misalignmentDegrees).toBeCloseTo(20, 8);
    expect(off.powerWatts / aligned.powerWatts).toBeCloseTo(Math.cos((20 * Math.PI) / 180), 6);
    expect(off.success).toBe(false);
    expect(off.feedback).toMatch(/collects only 94%/);
  });

  it("round 3: steady temperature is 25 + P/(h S)", () => {
    const o = runCooker(bake, { diameter: 0.9, loss: 20 });
    expect(o.steadyCelsius).toBeCloseTo(25 + o.powerWatts / (20 * 0.3), 8);
    expect(o.success).toBe(true);
    expect(runCooker(bake, { diameter: 0.9, loss: 5 }).feedback).toMatch(/too hot/);
    expect(runCooker(bake, { diameter: 0.5, loss: 30 }).feedback).toMatch(/too cool/);
  });
});

describe("Rainbow Creator (worked by hand)", () => {
  it("round 1: the minimum is at 59.4° with deviation 137.9°", () => {
    const o = runRainbow(minDev, { incidence: 59.4, wavelength: 589, reflections: 1 });
    expect(o.minimumIncidenceDegrees).toBeCloseTo(59.41, 1);
    expect(o.deviationDegrees).toBeCloseTo(137.9, 1);
    expect(o.success).toBe(true);
    const off = runRainbow(minDev, { incidence: 45, wavelength: 589, reflections: 1 });
    expect(off.success).toBe(false);
    expect(off.feedback).toMatch(/at a larger angle/);
    expect(off.deviationDegrees).toBeGreaterThan(o.deviationDegrees);
  });

  it("round 2: violet inside, red outside; ~440 nm gives 41.0°", () => {
    expect(runRainbow(colour, { wavelength: 440, reflections: 1 }).success).toBe(true);
    expect(runRainbow(colour, { wavelength: 700, reflections: 1 }).feedback).toMatch(/too large/);
    expect(runRainbow(colour, { wavelength: 400, reflections: 1 }).feedback).toMatch(/too small/);
  });

  it("round 3: only the secondary bow reaches 51.5°, with reversed colour order", () => {
    expect(runRainbow(double, { wavelength: 525, reflections: 2 }).success).toBe(true);
    const primary = runRainbow(double, { wavelength: 525, reflections: 1 });
    expect(primary.success).toBe(false);
    expect(primary.feedback).toMatch(/need a second/);
    expect(runRainbow(double, { wavelength: 700, reflections: 2 }).rainbowAngleDegrees).toBeLessThan(runRainbow(double, { wavelength: 400, reflections: 2 }).rainbowAngleDegrees);
  });

  it("charts a deviation curve whose minimum is the rainbow ray", () => {
    const curve = deviationCurve({ wavelength: 589, reflections: 1 });
    const min = curve.reduce((a, b) => (b.y < a.y ? b : a));
    expect(min.x).toBeCloseTo(59, 0);
  });
});

describe("Vision Simulator (worked by hand)", () => {
  it("round 1: −2 D corrects the 2 D myope at 6 m and 0.4 m; no lens blurs the board", () => {
    expect(runVision(myope, { distance: -2, add: 0 }).success).toBe(true);
    const bare = runVision(myope, { distance: 0, add: 0 });
    expect(bare.success).toBe(false);
    expect(bare.farDefocus).toBeCloseTo(2 - 1 / 6, 8);
    expect(bare.uncorrectedFarPoint).toBeCloseTo(0.5, 10);
    expect(runVision(myope, { distance: -4.5, add: 0 }).feedback).toMatch(/0.4 m object is blurred/);
  });

  it("round 2: a +2.75 to +3.5 D reading lens works; too little or too much does not", () => {
    for (const p of [2.75, 3, 3.5]) expect(runVision(hyperope, { distance: p, add: 0 }).success).toBe(true);
    expect(runVision(hyperope, { distance: 1, add: 0 }).feedback).toMatch(/0.3 m object/);
    expect(runVision(hyperope, { distance: 5, add: 0 }).feedback).toMatch(/1 m object/);
    expect(runVision(hyperope, { distance: 3, add: 0 }).uncorrectedNearPoint).toBeCloseTo(2, 10);
  });

  it("round 3: needs both a distance lens and a reading addition", () => {
    expect(runVision(bifocal, { distance: -1.5, add: 1.5 }).success).toBe(true);
    expect(runVision(bifocal, { distance: -1.5, add: 0 }).feedback).toMatch(/0.4 m object/);
    expect(runVision(bifocal, { distance: 0, add: 1.5 }).feedback).toMatch(/6 m object/);
  });
});

describe("Mirror Illusions (worked by hand)", () => {
  it("round 1: the least mirror is 0.90 m from 0.85 m to 1.75 m, half the person's height", () => {
    const o = runMirror(plane, { bottom: 0.85, height: 0.9 });
    expect(o.success).toBe(true);
    expect(o.predictionActual).toBeCloseTo(0.9, 10);
    expect(o.accuracyFraction).toBeCloseTo(1, 8);
    expect(runMirror(plane, { bottom: 1, height: 0.9 }).feedback).toMatch(/cannot see your feet/);
    expect(runMirror(plane, { bottom: 0.5, height: 0.9 }).feedback).toMatch(/top of your head/);
    expect(runMirror(plane, { bottom: 0.5, height: 1.8 }).accuracyFraction).toBeLessThan(o.accuracyFraction);
  });

  it("round 2: f = R/2 and dₒ = f/2 give an upright virtual image magnified 2×", () => {
    const o = runMirror(shaving, { radius: 0.6, distance: 0.15 });
    expect(o.magnification).toBeCloseTo(2, 8);
    expect(o.imageDistanceMeters).toBeCloseTo(-0.3, 8);
    expect(o.success).toBe(true);
    expect(runMirror(shaving, { radius: 0.6, distance: 0.5 }).feedback).toMatch(/real, inverted/);
    expect(runMirror(shaving, { radius: 0.6, distance: 0.3 }).feedback).toMatch(/no image forms/);
    expect(runMirror(shaving, { radius: 0.6, distance: 0.2 }).feedback).toMatch(/not 2×/);
  });

  it("round 3: a convex mirror of R ≈ 2.2 m shows a car at 10 m at 0.1× just behind the glass", () => {
    const o = runMirror(car, { radius: 2.2, distance: 10 });
    expect(o.magnification).toBeCloseTo(0.0991, 3);
    expect(Math.abs(o.imageDistanceMeters as number)).toBeLessThan(1);
    expect(o.success).toBe(true);
    expect(runMirror(car, { radius: 4, distance: 10 }).feedback).toMatch(/not 0.10×/);
    expect(runMirror(car, { radius: 2.2, distance: 20 }).success).toBe(false);
  });
});

describe("pages", () => {
  it("Material Detective guards", () => {
    checkGuards(MaterialDetectivePage, DETECTIVE_META, { sliders: { "Your estimate of the specific heat": 400 }, feedback: /closest to copper/ });
  });
  it("Material Detective plays through", async () => {
    await playThrough(MaterialDetectivePage, DETECTIVE_META, [
      { sliders: { "Your estimate of the specific heat": 900 } },
      { sliders: { "Your estimate of the specific heat": 385 } },
      { sliders: { "Your estimate of the specific heat": 450 } },
    ]);
  });
  it("Solar Cooker guards", () => {
    checkGuards(SolarCookerPage, COOKER_META, { sliders: { "Dish diameter": 0.3 }, prediction: 60, feedback: /too slow/ });
  });
  it("Solar Cooker plays through", async () => {
    await playThrough(SolarCookerPage, COOKER_META, [
      { sliders: { "Dish diameter": 0.5 }, prediction: 33.4 },
      { sliders: { "Dish tilt above horizon": 35 }, prediction: 16.7 },
      { sliders: { "Dish diameter": 0.9, "Pot loss coefficient": 20 }, prediction: 115 },
    ]);
  });
  it("Rainbow Creator guards", () => {
    checkGuards(RainbowCreatorPage, RAINBOW_META, { sliders: { "Angle of incidence": 45 }, prediction: 140, feedback: /still changing quickly/ });
  });
  it("Rainbow Creator plays through", async () => {
    await playThrough(RainbowCreatorPage, RAINBOW_META, [
      { sliders: { "Angle of incidence": 59.4 }, prediction: 137.9 },
      { sliders: { Wavelength: 440 }, prediction: 41 },
      { sliders: { Wavelength: 525, "Internal reflections": 2 }, prediction: 51.5 },
    ]);
  });
  it("Vision Simulator guards", () => {
    checkGuards(VisionSimulatorPage, VISION_META, { sliders: { "Lens power": 1 }, prediction: 0.5, feedback: /blurred/ });
  });
  it("Vision Simulator plays through", async () => {
    await playThrough(VisionSimulatorPage, VISION_META, [
      { sliders: { "Lens power": -2 }, prediction: 0.5 },
      { sliders: { "Lens power": 3 }, prediction: 2 },
      { sliders: { "Lens power (distance)": -1.5, "Reading addition": 1.5 }, prediction: 0.67 },
    ]);
  });
  it("Mirror Illusions guards", () => {
    checkGuards(MirrorIllusionsPage, MIRROR_META, { sliders: { "Height of the mirror's lower edge": 1.2 }, prediction: 0.9, feedback: /cannot see your feet/ });
  });
  it("Mirror Illusions plays through", async () => {
    await playThrough(MirrorIllusionsPage, MIRROR_META, [
      { sliders: { "Height of the mirror's lower edge": 0.85, "Mirror height": 0.9 }, prediction: 0.9 },
      { sliders: { "Radius of curvature": 0.6, "Face distance": 0.15 }, prediction: 0.3 },
      { sliders: { "Radius of curvature": 2.2, "Car distance": 10 }, prediction: 0.1 },
    ]);
  });
});
