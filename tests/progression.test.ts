import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  findNewlyUnlocked,
  getBestScore,
  type AchievementContext,
} from "../src/game-engine/progression/achievements";
import {
  isChallengeComplete,
  isChallengeCompleteOnDay,
  selectDailyChallenge,
  toLocalDateKey,
  type ChallengeDefinition,
} from "../src/game-engine/progression/challenges";
import {
  PLAYER_LEVELS,
  calculateLearningPoints,
  getLevelStatus,
} from "../src/game-engine/progression/levels";
import { CHALLENGES } from "../src/data/challenges/challengeCatalog";
import type { GameResult, SavedExperiment } from "../src/types/progress";

function result(gameId: string, score: number, completedAt = "2026-11-02T10:00:00"): GameResult {
  return { gameId, score, difficulty: "Beginner", completionStatus: "completed", completedAt };
}

function experiment(createdAt = "2026-11-02T10:00:00", experimentId = "electron-trajectory-lab"): SavedExperiment {
  return { id: createdAt + experimentId, experimentId, experimentName: "Lab", runName: "Run", parameters: {}, results: [], createdAt };
}

const games = ["projectile-master", "balance-challenge", "circuit-builder"];
const context = (results: GameResult[], experiments: SavedExperiment[] = []): AchievementContext => ({
  results,
  experiments,
  playableGameIds: games,
});

describe("levels", () => {
  it("orders the six levels from the product spec", () => {
    expect(PLAYER_LEVELS.map((level) => level.title)).toEqual([
      "Physics Explorer", "Experimenter", "Junior Scientist",
      "Physics Engineer", "Master Physicist", "Research Scientist",
    ]);
  });

  it("chooses the highest level whose threshold is met", () => {
    expect(getLevelStatus(0).level.title).toBe("Physics Explorer");
    expect(getLevelStatus(99).level.title).toBe("Physics Explorer");
    expect(getLevelStatus(100).level.title).toBe("Experimenter");
    expect(getLevelStatus(1200).level.title).toBe("Research Scientist");
    expect(getLevelStatus(5000).nextLevel).toBeNull();
  });

  it("reports progress toward the next level", () => {
    const status = getLevelStatus(200); // halfway between 100 and 300
    expect(status.levelNumber).toBe(2);
    expect(status.progressToNext).toBeCloseTo(0.5, 10);
    expect(getLevelStatus(1500).progressToNext).toBe(1);
  });

  it("adds a capped bonus for saved experiments", () => {
    expect(calculateLearningPoints(250, 3)).toBe(280);
    expect(calculateLearningPoints(0, 50)).toBe(100);
    expect(() => calculateLearningPoints(-1, 0)).toThrow(RangeError);
    expect(() => calculateLearningPoints(0, 1.5)).toThrow(RangeError);
    expect(() => getLevelStatus(Number.NaN)).toThrow(RangeError);
  });
});

describe("achievements", () => {
  it("unlocks nothing for a new learner", () => {
    expect(findNewlyUnlocked(context([]), new Set())).toEqual([]);
  });

  it("unlocks First Steps on any completed game, but not abandoned ones", () => {
    const abandoned: GameResult = { ...result("projectile-master", 50), completionStatus: "abandoned" };
    expect(findNewlyUnlocked(context([abandoned]), new Set())).toEqual([]);
    expect(findNewlyUnlocked(context([result("projectile-master", 50)]), new Set()).map((a) => a.id))
      .toEqual(["first-steps"]);
  });

  it("requires a high score for the mastery achievements", () => {
    const ids = (score: number) =>
      findNewlyUnlocked(context([result("balance-challenge", score)]), new Set()).map((a) => a.id);

    expect(ids(269)).not.toContain("balanced-mind");
    expect(ids(270)).toContain("balanced-mind");
    expect(ids(300)).not.toContain("gravity-master");
  });

  it("does not report achievements twice", () => {
    const unlocked = new Set(["first-steps"]);
    expect(findNewlyUnlocked(context([result("projectile-master", 50)]), unlocked)).toEqual([]);
  });

  it("unlocks experiment achievements from saved experiments", () => {
    const one = findNewlyUnlocked(context([], [experiment()]), new Set()).map((a) => a.id);
    expect(one).toEqual(["particle-explorer"]);
    const three = findNewlyUnlocked(
      context([], [experiment("a"), experiment("b"), experiment("c")]),
      new Set(),
    ).map((a) => a.id);
    expect(three).toContain("lab-notebook");
    expect(findNewlyUnlocked(context([], [experiment("a", "other")]), new Set()).map((a) => a.id))
      .not.toContain("particle-explorer");
  });

  it("unlocks Scientific Mind only after every playable game", () => {
    const some = context(games.slice(0, 2).map((id) => result(id, 10)));
    const all = context(games.map((id) => result(id, 10)));

    expect(findNewlyUnlocked(some, new Set()).map((a) => a.id)).not.toContain("scientific-mind");
    expect(findNewlyUnlocked(all, new Set()).map((a) => a.id)).toContain("scientific-mind");
    expect(findNewlyUnlocked({ ...all, playableGameIds: [] }, new Set()).map((a) => a.id))
      .not.toContain("scientific-mind");
  });

  it("has unique ids", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("finds the best completed score for a game", () => {
    expect(getBestScore([result("a", 10), result("a", 40), result("b", 90)], "a")).toBe(40);
    expect(getBestScore([], "a")).toBe(0);
  });
});

describe("challenges", () => {
  const sharpshooter = CHALLENGES.find((c) => c.id === "sharpshooter") as ChallengeDefinition;
  const labNotes = CHALLENGES.find((c) => c.id === "lab-notes") as ChallengeDefinition;

  it("is complete only when the score requirement is met", () => {
    expect(isChallengeComplete(sharpshooter, { results: [result("projectile-master", 239)], experiments: [] })).toBe(false);
    expect(isChallengeComplete(sharpshooter, { results: [result("projectile-master", 240)], experiments: [] })).toBe(true);
    expect(isChallengeComplete(labNotes, { results: [], experiments: [experiment("a")] })).toBe(false);
    expect(isChallengeComplete(labNotes, { results: [], experiments: [experiment("a"), experiment("b")] })).toBe(true);
  });

  it("checks the daily completion against the local day", () => {
    const monday = "2026-11-02";
    const results = [result("projectile-master", 250, "2026-11-02T12:00:00")];
    expect(isChallengeCompleteOnDay(sharpshooter, { results, experiments: [] }, monday)).toBe(true);
    expect(isChallengeCompleteOnDay(sharpshooter, { results, experiments: [] }, "2026-11-03")).toBe(false);
  });

  it("selects the same daily challenge all day and rotates between days", () => {
    const morning = new Date(2026, 10, 2, 6, 0);
    const night = new Date(2026, 10, 2, 23, 0);
    const tomorrow = new Date(2026, 10, 3, 6, 0);

    expect(selectDailyChallenge(CHALLENGES, morning).id).toBe(selectDailyChallenge(CHALLENGES, night).id);
    expect(selectDailyChallenge(CHALLENGES, tomorrow).id).not.toBe(selectDailyChallenge(CHALLENGES, morning).id);
    expect(() => selectDailyChallenge([], morning)).toThrow(RangeError);
  });

  it("formats local date keys", () => {
    expect(toLocalDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("points every challenge at a real activity route", () => {
    for (const challenge of CHALLENGES) {
      expect(challenge.path.startsWith("/")).toBe(true);
    }
  });
});
