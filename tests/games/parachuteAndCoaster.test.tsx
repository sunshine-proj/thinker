import { describe, expect, it } from "vitest";
import { PARACHUTE_META, PARACHUTE_ROUNDS, parachuteDesigner, runJump, type ParachuteRound } from "../../src/features/games/parachute-designer/parachuteDesigner";
import { ParachuteDesignerPage } from "../../src/features/games/parachute-designer/ParachuteDesignerPage";
import { COASTER_ROUNDS, ROLLER_META, rollerCoaster, runCoaster, type CoasterRound } from "../../src/features/games/roller-coaster/rollerCoaster";
import { RollerCoasterPage } from "../../src/features/games/roller-coaster/RollerCoasterPage";
import { STANDARD_GRAVITY as g } from "../../src/physics/core";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [first, cargo, timed] = PARACHUTE_ROUNDS as [ParachuteRound, ParachuteRound, ParachuteRound];
const [flat, friction, both] = COASTER_ROUNDS as [CoasterRound, CoasterRound, CoasterRound];

describe("Parachute Designer (worked by hand)", () => {
  it("round 1: a 6 m canopy gives 5.5 m/s", () => {
    const o = runJump(first, { diameter: 6, deploy: 500 });
    expect(o.terminalSpeed).toBeCloseTo(5.5, 1);
    expect(o.fall.touchdownSpeedMetersPerSecond).toBeCloseTo(o.terminalSpeed, 1);
    expect(o.success).toBe(true);
  });

  it("round 1: smaller and larger canopies miss the target in the right direction", () => {
    expect(runJump(first, { diameter: 4, deploy: 500 }).feedback).toMatch(/too fast/);
    expect(runJump(first, { diameter: 9, deploy: 500 }).feedback).toMatch(/too slow/);
  });

  it("round 2: weight demands area, and the fabric limit caps it", () => {
    expect(runJump(cargo, { diameter: 9, deploy: 500 }).success).toBe(true);
    expect(runJump(cargo, { diameter: 8, deploy: 500 }).feedback).toMatch(/above the 7 m\/s limit/);
    expect(runJump(cargo, { diameter: 11, deploy: 500 }).feedback).toMatch(/over the 70 m² limit/);
  });

  it("round 3: needs the right canopy and opening height for speed and time", () => {
    const good = runJump(timed, { diameter: 5.5, deploy: 150 });
    expect(good.success).toBe(true);
    expect(good.fall.totalTimeSeconds).toBeLessThan(50);
    expect(runJump(timed, { diameter: 5.5, deploy: 700 }).feedback).toMatch(/longer than 50 s/);
    expect(runJump(timed, { diameter: 8, deploy: 150 }).feedback).toMatch(/longer than 50 s/);
    expect(runJump(timed, { diameter: 4, deploy: 150 }).feedback).toMatch(/above the 6.5 m\/s limit/);
  });

  it("predicts terminal speed or total time as each round asks", () => {
    expect(parachuteDesigner.prediction(first)?.unit).toBe("m/s");
    expect(parachuteDesigner.prediction(timed)?.unit).toBe("s");
    expect(runJump(timed, { diameter: 5.5, deploy: 150 }).predictionActual).toBeCloseTo(runJump(timed, { diameter: 5.5, deploy: 150 }).fall.totalTimeSeconds, 8);
  });
});

describe("Roller Coaster Engineer (worked by hand)", () => {
  it("round 1: the frictionless window is 25 m ≤ h ≤ 27.5 m", () => {
    expect(runCoaster(flat, { height: 25.5, radius: 10 }).success).toBe(true);
    expect(runCoaster(flat, { height: 24, radius: 10 }).feedback).toMatch(/too slow|runs out of speed/);
    expect(runCoaster(flat, { height: 30, radius: 10 }).feedback).toMatch(/above the 6.5 g limit/);
    const o = runCoaster(flat, { height: 25.5, radius: 10 });
    expect(o.bottomSpeed).toBeCloseTo(Math.sqrt(2 * g * 25.5), 8);
    expect(o.bottomG).toBeCloseTo(1 + (2 * 25.5) / 10, 8);
  });

  it("the bottom g-force always exceeds the top by 6 g", () => {
    const o = runCoaster(flat, { height: 26, radius: 10 });
    expect((o.bottomG as number) - (o.topG as number)).toBeCloseTo(6, 8);
  });

  it("round 2: friction costs the equivalent of μs = 3 m of height", () => {
    expect(runCoaster(friction, { height: 25.5, radius: 10 }).success).toBe(false);
    expect(runCoaster(friction, { height: 28.5, radius: 10 }).success).toBe(true);
    expect(runCoaster(friction, { height: 5, radius: 10 }).feedback).toMatch(/Friction uses up all the energy|runs out of speed/);
  });

  it("round 3: a narrow window needs top 0.3–0.5 g", () => {
    expect(runCoaster(both, { height: 30, radius: 10 }).success).toBe(true);
    expect(runCoaster(both, { height: 29, radius: 10 }).feedback).toMatch(/below the required 0.3 g/);
    expect(runCoaster(both, { height: 31, radius: 10 }).success).toBe(false);
  });

  it("scores a centred top g-force best and predicts the bottom speed", () => {
    const centred = runCoaster(both, { height: 30, radius: 10 });
    const edge = runCoaster(both, { height: 29.7, radius: 10 });
    expect(centred.accuracyFraction).toBeGreaterThan(edge.accuracyFraction);
    expect(rollerCoaster.prediction(flat)?.unit).toBe("m/s");
  });
});

describe("pages", () => {
  it("Parachute Designer guards and plays through", async () => {
    checkGuards(ParachuteDesignerPage, PARACHUTE_META, { sliders: { "Canopy diameter": 4 }, prediction: 6, feedback: /too fast/ });
  });
  it("Parachute Designer is solved round by round", async () => {
    await playThrough(ParachuteDesignerPage, PARACHUTE_META, [
      { sliders: { "Canopy diameter": 6 }, prediction: 5.5 },
      { sliders: { "Canopy diameter": 9 }, prediction: 6.5 },
      { sliders: { "Canopy diameter": 5.5, "Deployment altitude": 150 }, prediction: 47 },
    ]);
  });
  it("Roller Coaster guards", () => {
    checkGuards(RollerCoasterPage, ROLLER_META, { sliders: { "Hill height": 30 }, prediction: 24, feedback: /above the 6.5 g limit/ });
  });
  it("Roller Coaster is solved round by round", async () => {
    await playThrough(RollerCoasterPage, ROLLER_META, [
      { sliders: { "Hill height": 25.5 }, prediction: 22 },
      { sliders: { "Hill height": 28.5 }, prediction: 22 },
      { sliders: { "Hill height": 30, "Loop radius": 10 }, prediction: 22 },
    ]);
  });
});
