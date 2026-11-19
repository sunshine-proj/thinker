import { describe, expect, it } from "vitest";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import {
  continueLearning,
  featuredExperiment,
  recentActivities,
  recommendGames,
} from "../../src/game-engine/progression/recommendations";
import type { GameResult } from "../../src/types/progress";

const result = (gameId: string, completedAt: string, score = 200): GameResult => ({
  gameId, score, difficulty: "Beginner", completionStatus: "completed", completedAt,
});

describe("continue learning", () => {
  it("lists known in-progress games, newest first", () => {
    const items = continueLearning(
      [
        { gameId: "laser-maze", savedAt: "2026-11-01T10:00:00.000Z", data: {} },
        { gameId: "unknown-game", savedAt: "2026-11-03T10:00:00.000Z", data: {} },
        { gameId: "bridge-builder", savedAt: "2026-11-02T10:00:00.000Z", data: {} },
      ],
      findCatalogEntry,
    );
    expect(items.map((item) => item.entry.id)).toEqual(["bridge-builder", "laser-maze"]);
  });
});

describe("recommended games", () => {
  const worldOf = (id: string) => PHYSICS_WORLDS.find((world) => world.entries.some((entry) => entry.id === id))?.id;

  it("suggests the easiest game of each unexplored world for a new learner", () => {
    const picks = recommendGames([], PHYSICS_WORLDS);
    expect(picks).toHaveLength(3);
    expect(picks.every((entry) => entry.kind === "game")).toBe(true);
    expect(picks.map((entry) => worldOf(entry.id))).toEqual(["mechanics", "electromagnetism", "optics"]);
    expect(picks[0]?.difficulty).toBe("Beginner");
  });

  it("skips worlds the learner has already played", () => {
    const picks = recommendGames([result("projectile-master", "2026-11-01T10:00:00.000Z")], PHYSICS_WORLDS);
    expect(picks.some((entry) => worldOf(entry.id) === "mechanics")).toBe(false);
  });

  it("falls back to any unplayed game and never suggests a played one", () => {
    const allButOne = PHYSICS_WORLDS.flatMap((world) => world.entries)
      .filter((entry) => entry.kind === "game")
      .slice(1)
      .map((entry, i) => result(entry.id, `2026-11-01T10:00:${String(i % 60).padStart(2, "0")}.000Z`));
    const picks = recommendGames(allButOne, PHYSICS_WORLDS);
    expect(picks).toHaveLength(1);
    expect(allButOne.some((r) => r.gameId === picks[0]?.id)).toBe(false);
  });
});

describe("featured experiment", () => {
  const labs = PHYSICS_WORLDS.flatMap((world) => world.entries).filter((entry) => entry.kind === "experiment");

  it("is stable within a day and rotates through every lab", () => {
    const morning = featuredExperiment(labs, new Date(2026, 10, 19, 8));
    expect(featuredExperiment(labs, new Date(2026, 10, 19, 22))).toBe(morning);
    const seen = new Set(Array.from({ length: labs.length }, (_, i) => featuredExperiment(labs, new Date(2026, 10, 1 + i))?.id));
    expect(seen.size).toBe(labs.length);
    expect(featuredExperiment([], new Date())).toBeUndefined();
  });
});

describe("recent activities", () => {
  it("merges completed games and finished thought experiments, newest first", () => {
    const recent = recentActivities(
      [result("laser-maze", "2026-11-01T10:00:00.000Z", 250), { ...result("bridge-builder", "2026-11-03T10:00:00.000Z"), completionStatus: "abandoned" }],
      [{ id: "two-moons:variation", activityId: "two-moons", activityKind: "thought-experiment", questionId: "variation", answer: "x", correct: true, recordedAt: "2026-11-02T10:00:00.000Z" }],
      findCatalogEntry,
      (id) => (id === "two-moons" ? { title: "What if Earth had two moons?" } : undefined),
    );
    expect(recent.map((activity) => activity.title)).toEqual(["What if Earth had two moons?", "Laser Maze"]);
    expect(recent[1]?.detail).toBe("250 points");
  });
});
