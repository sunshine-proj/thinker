import { describe, expect, it } from "vitest";
import { BasketballChallengePage } from "../../src/features/games/basketball-challenge/BasketballChallengePage";
import { SHOT_META, SHOT_ROUNDS, runShot, type ShotRound } from "../../src/features/games/basketball-challenge/basketballChallenge";
import { TennisPhysicsPage } from "../../src/features/games/tennis-physics/TennisPhysicsPage";
import { SERVE_SPEED_ANSWER, TENNIS_META, TENNIS_ROUNDS, runTennis, type TennisRound } from "../../src/features/games/tennis-physics/tennisPhysics";
import { KitchenScientistPage } from "../../src/features/games/kitchen-scientist/KitchenScientistPage";
import { KITCHEN_META, KITCHEN_ROUNDS, runKitchen, type KitchenRound } from "../../src/features/games/kitchen-scientist/kitchenScientist";
import { CarSafetyEngineerPage } from "../../src/features/games/car-safety-engineer/CarSafetyEngineerPage";
import { CRASH_META, CRASH_ROUNDS, runCrash, type CrashRound } from "../../src/features/games/car-safety-engineer/carSafetyEngineer";
import { SmartphoneDetectivePage } from "../../src/features/games/smartphone-detective/SmartphoneDetectivePage";
import { SENSOR_META, SENSOR_ROUNDS, runSensor, type SensorRound } from "../../src/features/games/smartphone-detective/smartphoneDetective";
import { AmusementParkPhysicsPage } from "../../src/features/games/amusement-park-physics/AmusementParkPhysicsPage";
import { RIDE_META, RIDE_ROUNDS, runRide, type RideRound } from "../../src/features/games/amusement-park-physics/amusementParkPhysics";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [speedShot, angleShot, bounce] = SHOT_ROUNDS as [ShotRound, ShotRound, ShotRound];
const [serve, regulation, terminal] = TENNIS_ROUNDS as [TennisRound, TennisRound, TennisRound];
const [boil, ice, pot] = KITCHEN_ROUNDS as [KitchenRound, KitchenRound, KitchenRound];
const [crumple, airbag, headOn] = CRASH_ROUNDS as [CrashRound, CrashRound, CrashRound];
const [tilt, gyro, light] = SENSOR_ROUNDS as [SensorRound, SensorRound, SensorRound];
const [carousel, tower, rotor] = RIDE_ROUNDS as [RideRound, RideRound, RideRound];

describe("Basketball Challenge (worked by hand)", () => {
  it("round 1: 7.18 m/s at 52° passes the hoop at 3.05 m while falling", () => {
    const o = runShot(speedShot, { angle: 52, speed: 7.18 });
    expect(o.heightAtHoop).toBeCloseTo(3.05, 1);
    expect(o.verticalVelocity!).toBeLessThan(0);
    expect(o.success).toBe(true);
    expect(runShot(speedShot, { angle: 52, speed: 6 }).feedback).toMatch(/below the hoop/);
    expect(runShot(speedShot, { angle: 52, speed: 9 }).feedback).toMatch(/above the hoop/);
  });
  it("round 2: both 41° and 62° work at 7.5 m/s", () => {
    expect(runShot(angleShot, { speed: 7.5, angle: 41 }).success).toBe(true);
    expect(runShot(angleShot, { speed: 7.5, angle: 61.8 }).success).toBe(true);
    expect(runShot(angleShot, { speed: 7.5, angle: 50 }).success).toBe(false);
  });
  it("round 3: e = 0.8165 rebounds a ball dropped from 1.8 m to 1.2 m", () => {
    const o = runShot(bounce, { drop: 1.8, restitution: 0.815 });
    expect(o.reboundHeight).toBeCloseTo(1.196, 2);
    expect(o.success).toBe(true);
    expect(runShot(bounce, { drop: 1.8, restitution: 0.95 }).feedback).toMatch(/too high/);
    expect(runShot(bounce, { drop: 1.8, restitution: 0.6 }).feedback).toMatch(/too low/);
  });
  it("guards the controls", () => {
    checkGuards(BasketballChallengePage, SHOT_META, { sliders: { "Launch speed": 6 }, prediction: 7.2, feedback: /below the hoop/ });
  });
  it("plays through", async () => {
    await playThrough(BasketballChallengePage, SHOT_META, [
      { sliders: { "Launch speed": 7.18 }, prediction: 7.18 },
      { sliders: { "Launch angle": 61.8 }, prediction: 61.8 },
      { sliders: { "Coefficient of restitution e": 0.815 }, prediction: 0.8165 },
    ]);
  });
});

describe("Tennis Physics (worked by hand)", () => {
  it("round 1: drag shortens the serve, so about 56.7 m/s is needed to land at 18.29 m", () => {
    const answer = SERVE_SPEED_ANSWER();
    expect(answer).toBeGreaterThan(50);
    expect(answer).toBeLessThan(62);
    const o = runTennis(serve, { angle: -6, speed: 56.7 });
    expect(o.range!).toBeCloseTo(18.29, 0);
    expect(o.rangeWithoutDrag!).toBeGreaterThan(o.range!);
    expect(o.success).toBe(true);
    expect(runTennis(serve, { angle: -6, speed: 40 }).feedback).toMatch(/short/);
    expect(runTennis(serve, { angle: -6, speed: 75 }).feedback).toMatch(/long/);
  });
  it("round 2: e from 0.728 to 0.762 passes the 135–147 cm drop test", () => {
    expect(runTennis(regulation, { drop: 2.54, restitution: 0.74 }).success).toBe(true);
    expect(runTennis(regulation, { drop: 2.54, restitution: 0.7 }).feedback).toMatch(/too dead/);
    expect(runTennis(regulation, { drop: 2.54, restitution: 0.8 }).feedback).toMatch(/too lively/);
  });
  it("round 3: the terminal speed is 21.7 m/s", () => {
    const o = runTennis(terminal, { speed: 21.7 });
    expect(o.terminalSpeed).toBeCloseTo(21.7, 1);
    expect(o.success).toBe(true);
    expect(runTennis(terminal, { speed: 40 }).feedback).toMatch(/above/);
  });
  it("guards the controls", () => {
    checkGuards(TennisPhysicsPage, TENNIS_META, { sliders: { "Serve speed": 40 }, prediction: 55, feedback: /short/ });
  });
  it("plays through", async () => {
    await playThrough(TennisPhysicsPage, TENNIS_META, [
      { sliders: { "Serve speed": 56.7 }, prediction: 56.7 },
      { sliders: { "Coefficient of restitution e": 0.74 }, prediction: 0.745 },
      { sliders: { "Terminal speed": 21.7 }, prediction: 21.7 },
    ]);
  });
});

describe("Kitchen Scientist (worked by hand)", () => {
  it("round 1: 2 kg from 20 to 100 °C takes 7 minutes", () => {
    expect(runKitchen(boil, { minutes: 7 }).headline).toBeCloseTo(6.98, 2);
    expect(runKitchen(boil, { minutes: 7 }).success).toBe(true);
    expect(runKitchen(boil, { minutes: 3 }).feedback).toMatch(/shorter/);
  });
  it("round 2: two cubes cool 250 g of juice from 25 to 10.5 °C; six leave ice", () => {
    const o = runKitchen(ice, { start: 25, cubes: 2 });
    expect(o.headline).toBeCloseTo(10.55, 1);
    expect(o.success).toBe(true);
    expect(runKitchen(ice, { start: 25, cubes: 0 }).feedback).toMatch(/too warm/);
    expect(runKitchen(ice, { start: 25, cubes: 3 }).headline).toBeLessThan(5);
    expect(runKitchen(ice, { start: 25, cubes: 8 }).feedback).toMatch(/ice is left unmelted/);
  });
  it("round 3: a 9.9 mm aluminium base drops 2 K at 1500 W", () => {
    const o = runKitchen(pot, { power: 1500, thickness: 9.9 });
    expect(o.headline).toBeCloseTo(2, 1);
    expect(o.detail!).toBeGreaterThan(1400);
    expect(o.success).toBe(true);
    expect(runKitchen(pot, { power: 1500, thickness: 20 }).feedback).toMatch(/make it thinner/);
    expect(runKitchen(pot, { power: 1500, thickness: 3 }).feedback).toMatch(/make it thicker/);
  });
  it("guards the controls", () => {
    checkGuards(KitchenScientistPage, KITCHEN_META, { sliders: { "Heating time": 3 }, prediction: 7, feedback: /shorter/ });
  });
  it("plays through", async () => {
    await playThrough(KitchenScientistPage, KITCHEN_META, [
      { sliders: { "Heating time": 7 }, prediction: 6.98 },
      { sliders: { "Ice cubes": 2 }, prediction: 2.1 },
      { sliders: { "Base thickness": 9.9 }, prediction: 9.9 },
    ]);
  });
});

describe("Car Safety Engineer (worked by hand)", () => {
  it("round 1: 0.6 m of crumple gives 19 g; 0.2 m gives 57 g; 1.4 m is wasteful", () => {
    const ok = runCrash(crumple, { speed: 15, distance: 0.6 });
    expect(ok.gForce).toBeCloseTo(19.1, 1);
    expect(ok.forceNewtons! / 1000).toBeCloseTo(225, -1);
    expect(ok.success).toBe(true);
    expect(runCrash(crumple, { speed: 15, distance: 0.2 }).feedback).toMatch(/not survivable/);
    expect(runCrash(crumple, { speed: 15, distance: 1.4 }).feedback).toMatch(/too long/);
  });
  it("round 2: a 110 ms airbag stop is 9.5 kN; 30 ms is 35 kN", () => {
    expect(runCrash(airbag, { speed: 15, time: 110 }).forceNewtons! / 1000).toBeCloseTo(9.55, 1);
    expect(runCrash(airbag, { speed: 15, time: 110 }).success).toBe(true);
    expect(runCrash(airbag, { speed: 15, time: 30 }).feedback).toMatch(/too harsh/);
    expect(runCrash(airbag, { speed: 15, time: 250 }).feedback).toMatch(/dashboard/);
  });
  it("round 3: a 30 m/s light car stops the wreck, losing 1.1 MJ", () => {
    const o = runCrash(headOn, { heavy: 1500, speed: 30 });
    expect(o.finalVelocity!).toBeCloseTo(0, 10);
    expect(o.energyLost!).toBeCloseTo(0.5 * 1500 * 400 + 0.5 * 1000 * 900, 3);
    expect(o.success).toBe(true);
    expect(runCrash(headOn, { heavy: 1500, speed: 10 }).feedback).toMatch(/heavy car's direction/);
    expect(runCrash(headOn, { heavy: 1500, speed: 40 }).feedback).toMatch(/light car's direction/);
  });
  it("guards the controls", () => {
    checkGuards(CarSafetyEngineerPage, CRASH_META, { sliders: { "Crumple distance": 0.2 }, prediction: 0.57, feedback: /not survivable/ });
  });
  it("plays through", async () => {
    await playThrough(CarSafetyEngineerPage, CRASH_META, [
      { sliders: { "Crumple distance": 0.6 }, prediction: 0.57 },
      { sliders: { "Airbag stopping time": 110 }, prediction: 105 },
      { sliders: { "Speed of the light car": 30 }, prediction: 30 },
    ]);
  });
});

describe("Smartphone Detective (worked by hand)", () => {
  it("round 1: 4.9 m/s² on an axis is a 30° tilt", () => {
    const o = runSensor(tilt, { reading: 4.9, angle: 30 });
    expect(o.truth).toBeCloseTo(29.99, 1);
    expect(o.reading).toBeCloseTo(4.9, 1);
    expect(o.success).toBe(true);
    expect(runSensor(tilt, { reading: 4.9, angle: 60 }).feedback).toMatch(/more/);
  });
  it("round 2: 90°/s for 2 s is 180°", () => {
    expect(runSensor(gyro, { rate: 90, time: 2, angle: 180 }).success).toBe(true);
    expect(runSensor(gyro, { rate: 90, time: 2, angle: 90 }).feedback).toMatch(/does not match/);
  });
  it("round 3: 400 lx at 1 m becomes 100 lx at 2 m", () => {
    const o = runSensor(light, { intensity: 400, distance: 2 });
    expect(o.reading).toBeCloseTo(100, 8);
    expect(o.success).toBe(true);
    expect(runSensor(light, { intensity: 400, distance: 1 }).feedback).toMatch(/too bright/);
    expect(runSensor(light, { intensity: 400, distance: 4 }).feedback).toMatch(/too dim/);
  });
  it("guards the controls", () => {
    checkGuards(SmartphoneDetectivePage, SENSOR_META, { sliders: { "Tilt angle": 60 }, prediction: 30, feedback: /more/ });
  });
  it("plays through", async () => {
    await playThrough(SmartphoneDetectivePage, SENSOR_META, [
      { sliders: { "Tilt angle": 30 }, prediction: 30 },
      { sliders: { "Rotation angle": 180 }, prediction: 180 },
      { sliders: { "Distance from the lamp": 2 }, prediction: 2 },
    ]);
  });
});

describe("Amusement Park Physics (worked by hand)", () => {
  it("round 1: a 6.35 s period at 5 m gives 0.5 g", () => {
    const o = runRide(carousel, { radius: 5, period: 6.35 });
    expect(o.gForce).toBeCloseTo(0.5, 2);
    expect(o.success).toBe(true);
    expect(runRide(carousel, { radius: 5, period: 3 }).feedback).toMatch(/too intense/);
    expect(runRide(carousel, { radius: 5, period: 12 }).feedback).toMatch(/too gentle/);
  });
  it("round 2: 40 m of free fall is 28 m/s; braking over 20 m gives 3 g", () => {
    const o = runRide(tower, { height: 40, distance: 20 });
    expect(o.speed).toBeCloseTo(28.01, 2);
    expect(o.gForce).toBeCloseTo(3, 6);
    expect(o.success).toBe(true);
    expect(runRide(tower, { height: 40, distance: 8 }).feedback).toMatch(/too harsh/);
    expect(runRide(tower, { height: 40, distance: 35 }).feedback).toMatch(/gentler/);
  });
  it("round 3: the Rotor needs 29.9 rpm for μ = 0.4 at 2.5 m; 20 rpm drops riders; 45 rpm is too fast", () => {
    const o = runRide(rotor, { radius: 2.5, rpm: 31 });
    expect(o.minimumRpm!).toBeCloseTo(29.9, 1);
    expect(o.success).toBe(true);
    expect(runRide(rotor, { radius: 2.5, rpm: 20 }).feedback).toMatch(/slide down/);
    expect(runRide(rotor, { radius: 2.5, rpm: 45 }).feedback).toMatch(/faster than needed/);
  });
  it("guards the controls", () => {
    checkGuards(AmusementParkPhysicsPage, RIDE_META, { sliders: { "Time per revolution": 3 }, prediction: 6, feedback: /too intense/ });
  });
  it("plays through", async () => {
    await playThrough(AmusementParkPhysicsPage, RIDE_META, [
      { sliders: { "Time per revolution": 6.35 }, prediction: 6.35 },
      { sliders: { "Braking distance": 20 }, prediction: 20 },
      { sliders: { "Spin rate": 31 }, prediction: 29.9 },
    ]);
  });
});

describe("catalog", () => {
  it("lists the six new games and the four labs, and the Everyday world has nothing left to come", () => {
    for (const id of ["basketball-challenge", "tennis-physics", "kitchen-scientist", "car-safety-engineer", "smartphone-detective", "amusement-park-physics"]) {
      expect(findCatalogEntry(id)?.kind).toBe("game");
    }
    for (const id of ["gravity-comparison", "friction-surfaces", "projectile-motion-lab", "magnetic-field-strength"]) {
      expect(findCatalogEntry(id)?.kind).toBe("experiment");
    }
    expect(PHYSICS_WORLDS.find((w) => w.id === "everyday")!.comingSoon).toEqual([]);
  });
});
