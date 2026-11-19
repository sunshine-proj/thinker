import { describe, expect, it } from "vitest";
import { CHALLENGES } from "../../src/data/challenges/challengeCatalog";
import { PHYSICS_WORLDS, getPlayableGameIds } from "../../src/data/games/gameCatalog";
import { ACHIEVEMENTS, WORLD_ACHIEVEMENTS, findNewlyUnlocked } from "../../src/game-engine/progression/achievements";
import { isChallengeComplete, isChallengeCompleteOnDay, toLocalDateKey } from "../../src/game-engine/progression/challenges";
import { summarizeProgress, summarizeWorldProgress } from "../../src/game-engine/progression/progress";
import type { GameResult, RecordedPrediction, SavedExperiment } from "../../src/types/progress";

const done = (gameId: string, score = 250, completedAt = "2026-11-02T10:00:00.000Z"): GameResult => ({
  gameId, score, difficulty: "Beginner", completionStatus: "completed", completedAt,
});
const finished = (activityId: string, at = "2026-11-02T10:00:00.000Z"): RecordedPrediction => ({
  id: `${activityId}:variation`, activityId, activityKind: "thought-experiment", questionId: "variation", answer: "a", correct: true, recordedAt: at,
});
const unlockedIds = (context: Parameters<typeof findNewlyUnlocked>[0]) =>
  findNewlyUnlocked(context, new Set()).map((achievement) => achievement.id);
const base = { results: [] as GameResult[], experiments: [] as SavedExperiment[], predictions: [] as RecordedPrediction[], playableGameIds: getPlayableGameIds() };

describe("PRD §11 achievements", () => {
  it("includes every PRD achievement title", () => {
    const titles = ACHIEVEMENTS.map((achievement) => achievement.title);
    for (const title of ["Gravity Master", "Circuit Genius", "Space Engineer", "Wave Master", "Particle Explorer", "Scientific Mind"]) {
      expect(titles).toContain(title);
    }
    expect(new Set(ACHIEVEMENTS.map((achievement) => achievement.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("unlocks Space Engineer for the four spaceflight games and Wave Master for three waves games", () => {
    const space = ["space-mission", "orbit-simulator", "moon-landing"].map((id) => done(id));
    expect(unlockedIds({ ...base, results: space })).not.toContain("space-engineer");
    expect(unlockedIds({ ...base, results: [...space, done("asteroid-mission")] })).toContain("space-engineer");
    expect(unlockedIds({ ...base, results: ["sound-creator", "virtual-guitar"].map((id) => done(id)) })).not.toContain("wave-master");
    expect(unlockedIds({ ...base, results: ["sound-creator", "virtual-guitar", "echo-explorer"].map((id) => done(id)) })).toContain("wave-master");
  });

  it("has one champion achievement per world, unlocked by completing all its games", () => {
    expect(WORLD_ACHIEVEMENTS).toHaveLength(PHYSICS_WORLDS.length);
    const nuclear = PHYSICS_WORLDS.find((world) => world.id === "nuclear")!;
    const games = nuclear.entries.filter((entry) => entry.kind === "game").map((entry) => done(entry.id));
    expect(unlockedIds({ ...base, results: games.slice(1) })).not.toContain("world-nuclear");
    expect(unlockedIds({ ...base, results: games })).toContain("world-nuclear");
  });

  it("rewards thought experiments, good predictions and visiting every lab", () => {
    const three = ["gravity-doubles", "two-moons", "absolute-zero"].map((id) => finished(id));
    expect(unlockedIds({ ...base, predictions: three.slice(0, 2) })).not.toContain("thought-explorer");
    expect(unlockedIds({ ...base, predictions: three })).toContain("thought-explorer");
    const correct = Array.from({ length: 5 }, (_, i) => ({ ...finished(`t${i}`), id: `t${i}:main`, questionId: "main" }));
    expect(unlockedIds({ ...base, predictions: correct })).toContain("good-predictor");
    const labs = PHYSICS_WORLDS.flatMap((world) => world.entries).filter((entry) => entry.kind === "experiment");
    const runs = labs.map((lab, i): SavedExperiment => ({
      id: `r${i}`, experimentId: lab.id, experimentName: lab.title, runName: "r", parameters: {}, results: [], createdAt: "2026-11-02T10:00:00.000Z",
    }));
    expect(unlockedIds({ ...base, experiments: runs.slice(1) })).not.toContain("lab-explorer");
    expect(unlockedIds({ ...base, experiments: runs })).toContain("lab-explorer");
  });
});

describe("challenges (PRD §9)", () => {
  it("has at least one challenge in every physics world", () => {
    for (const world of PHYSICS_WORLDS) {
      const paths = new Set(world.entries.map((entry) => entry.path));
      expect(CHALLENGES.some((challenge) => paths.has(challenge.path)), world.id).toBe(true);
    }
  });

  it("includes the PRD examples for electron orbit radius and ship cargo", () => {
    expect(CHALLENGES.find((challenge) => challenge.id === "electron-orbit")?.description).toMatch(/electron orbit radius/);
    expect(CHALLENGES.find((challenge) => challenge.id === "cargo-captain")?.description).toMatch(/maximum cargo capacity/);
  });

  it("checks a saved electron run against the target radius and particle", () => {
    const orbit = CHALLENGES.find((challenge) => challenge.id === "electron-orbit")!;
    const run = (radius: number, particle: string): SavedExperiment => ({
      id: "x", experimentId: "electron-trajectory-lab", experimentName: "Electron Trajectory Lab", runName: "r",
      parameters: { particle }, results: [{ id: "gyroradius", label: "Gyroradius", value: radius, unit: "m" }],
      createdAt: "2026-11-02T10:00:00.000Z",
    });
    const context = (experiments: SavedExperiment[]) => ({ results: [], experiments });
    expect(isChallengeComplete(orbit, context([run(0.255, "electron")]))).toBe(true);
    expect(isChallengeComplete(orbit, context([run(0.27, "electron")]))).toBe(false);
    expect(isChallengeComplete(orbit, context([run(0.25, "proton")]))).toBe(false);
    expect(isChallengeCompleteOnDay(orbit, context([run(0.25, "electron")]), toLocalDateKey(new Date("2026-11-02T10:00:00.000Z")))).toBe(true);
  });

  it("counts finished thought experiments, also for the daily challenge", () => {
    const deep = CHALLENGES.find((challenge) => challenge.id === "deep-thinker")!;
    const predictions = ["a", "b", "c"].map((id) => finished(id));
    expect(isChallengeComplete(deep, { results: [], experiments: [], predictions: predictions.slice(0, 2) })).toBe(false);
    expect(isChallengeComplete(deep, { results: [], experiments: [], predictions })).toBe(true);
    const day = toLocalDateKey(new Date("2026-11-02T10:00:00.000Z"));
    expect(isChallengeCompleteOnDay(deep, { results: [], experiments: [], predictions }, day)).toBe(true);
  });
});

describe("progress by world", () => {
  it("counts completed games and best scores per world", () => {
    const progress = summarizeProgress([done("projectile-master", 280), done("bridge-builder", 200), done("laser-maze", 150)]);
    const worlds = summarizeWorldProgress(progress, PHYSICS_WORLDS);
    const mechanics = worlds.find((world) => world.worldId === "mechanics")!;
    expect(mechanics.completedGames).toBe(2);
    expect(mechanics.bestScore).toBe(480);
    expect(mechanics.totalGames).toBe(PHYSICS_WORLDS[0]!.entries.filter((entry) => entry.kind === "game").length);
    expect(worlds.find((world) => world.worldId === "optics")?.completedGames).toBe(1);
  });
});
