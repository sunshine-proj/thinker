import { describe, expect, it } from "vitest";
import { RACE_META, RACE_ROUNDS, type RaceRound } from "../../src/features/games/race-simulator/raceSimulator";
import { raceSimulator, runRace } from "../../src/features/games/race-simulator/raceSimulator";
import { RaceSimulatorPage } from "../../src/features/games/race-simulator/RaceSimulatorPage";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [sprint, chase, brake] = RACE_ROUNDS as [RaceRound, RaceRound, RaceRound];

describe("Race Simulator rounds (worked by hand)", () => {
  it("drag strip: a = 2d/t² = 8 m/s² gives exactly 10 s", () => {
    const o = runRace(sprint, { acceleration: 8 });
    expect(o.timeSeconds).toBeCloseTo(10, 10);
    expect(o.success).toBe(true);
    expect(o.accuracyFraction).toBeCloseTo(1, 8);
    expect(runRace(sprint, { acceleration: 6 }).feedback).toMatch(/too slow/);
    expect(runRace(sprint, { acceleration: 10 }).feedback).toMatch(/too fast/);
  });

  it("photo finish: t = d/v + v/(2a) → a = 12.9 m/s² finishes in 17.0 s, 0.5 s ahead", () => {
    const o = runRace(chase, { acceleration: 12.9 });
    expect(o.timeSeconds).toBeCloseTo(1000 / 70 + 70 / 25.8, 8);
    expect(o.success).toBe(true);
    expect(o.feedback).toMatch(/ahead of the rival/);
    expect(o.rivalCurve.at(-1)?.y).toBeCloseTo(300 + 40 * (o.timeSeconds as number), 8);
  });

  it("photo finish: too little power loses, too much wins by more than a photo finish", () => {
    expect(runRace(chase, { acceleration: 8 }).feedback).toMatch(/rival wins/);
    expect(runRace(chase, { acceleration: 19 }).feedback).toMatch(/more than a photo finish/);
  });

  it("brake: reaction 50 m + 50²/(2a); a = 8.93 leaves a 10 m gap", () => {
    const o = runRace(brake, { deceleration: 8.93 });
    expect(o.stoppingDistanceMeters).toBeCloseTo(50 + 1250 / 8.93, 8);
    expect(o.gapMeters).toBeCloseTo(10, 0);
    expect(o.success).toBe(true);
    expect(runRace(brake, { deceleration: 6 }).feedback).toMatch(/Crash/);
    expect(runRace(brake, { deceleration: 12 }).feedback).toMatch(/too far back/);
    expect(runRace(brake, { deceleration: 8.4 }).feedback).toMatch(/too close/);
  });

  it("validates controls and saved state", () => {
    expect(() => raceSimulator.evaluate(sprint, { acceleration: 99 }, 10, 1)).toThrow(/between/);
    expect(raceSimulator.parseControl({ acceleration: 8 }, sprint)).toEqual({ acceleration: 8 });
    expect(raceSimulator.parseControl({ acceleration: 99 }, sprint)).toBeNull();
    expect(RACE_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});

describe("Race Simulator page", () => {
  it("guards and explains", () => {
    checkGuards(RaceSimulatorPage, RACE_META, { sliders: { Acceleration: 6 }, prediction: 12, feedback: /too slow/ });
  });

  it("is solved round by round", async () => {
    await playThrough(RaceSimulatorPage, RACE_META, [
      { sliders: { Acceleration: 8 }, prediction: 10 },
      { sliders: { Acceleration: 12.9 }, prediction: 17 },
      { sliders: { "Braking deceleration": 8.95 }, prediction: 190 },
    ]);
  });
});
