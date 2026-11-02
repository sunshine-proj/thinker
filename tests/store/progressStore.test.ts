import { describe, expect, it } from "vitest";
import { summarizeProgress } from "../../src/game-engine/progression/progress";
import { MemoryProgressRepository } from "../../src/services/storage/progressRepository";
import { createProgressStore } from "../../src/store/progressStore";
import type { GameResult } from "../../src/types/progress";

function result(overrides: Partial<GameResult> = {}): GameResult {
  return {
    gameId: "projectile-master",
    score: 100,
    difficulty: "Beginner",
    completionStatus: "completed",
    completedAt: "2026-11-02T10:00:00.000Z",
    ...overrides,
  };
}

class FailingRepository extends MemoryProgressRepository {
  override async listGameResults(): Promise<GameResult[]> {
    throw new Error("storage unavailable");
  }
  override async saveGameResult(): Promise<void> {
    throw new Error("quota exceeded");
  }
  override async listSavedExperiments(): Promise<never[]> {
    throw new Error("storage unavailable");
  }
  override async saveAchievement(): Promise<void> {
    throw new Error("quota exceeded");
  }
  override async clear(): Promise<void> {
    throw new Error("storage unavailable");
  }
}

describe("summarizeProgress", () => {
  it("counts only completed games and keeps each game's best score", () => {
    const progress = summarizeProgress([
      result({ score: 100 }),
      result({ score: 180, completedAt: "2026-11-03T10:00:00.000Z" }),
      result({ gameId: "balance-challenge", score: 90 }),
      result({ gameId: "abandoned", score: 500, completionStatus: "abandoned" }),
    ]);

    expect([...progress.completedGames].sort()).toEqual([
      "balance-challenge",
      "projectile-master",
    ]);
    expect(progress.bestScores["projectile-master"]).toBe(180);
    expect(progress.bestScores["abandoned"]).toBeUndefined();
    expect(progress.totalBestScore).toBe(270);
    expect(progress.lastActivity).toBe("2026-11-03T10:00:00.000Z");
  });

  it("reports no activity for an empty history", () => {
    expect(summarizeProgress([])).toEqual({
      completedGames: [],
      bestScores: {},
      totalBestScore: 0,
      lastActivity: null,
    });
  });
});

describe("progress store", () => {
  it("hydrates stored results and persists newly recorded ones", async () => {
    const repository = new MemoryProgressRepository();
    await repository.saveGameResult(result({ score: 50 }));
    const store = createProgressStore(repository);

    await store.getState().hydrate();
    expect(store.getState().progress.bestScores["projectile-master"]).toBe(50);

    await store.getState().recordGameResult(result({ score: 120 }));
    expect(store.getState().progress.bestScores["projectile-master"]).toBe(120);
    expect(await repository.listGameResults()).toHaveLength(2);
  });

  it("does not double count a result recorded before hydration finished", async () => {
    const store = createProgressStore(new MemoryProgressRepository());
    await store.getState().recordGameResult(result());
    await store.getState().hydrate();

    expect(store.getState().results).toHaveLength(1);
  });

  it("keeps progress in memory and reports an error when storage fails", async () => {
    const store = createProgressStore(new FailingRepository());
    await store.getState().hydrate();
    expect(store.getState().persistenceError).toMatch(/loaded/);

    await store.getState().recordGameResult(result({ score: 70 }));
    expect(store.getState().progress.totalBestScore).toBe(70);
    expect(store.getState().persistenceError).toMatch(/saved/);
  });

  it("rejects invalid results without changing state", async () => {
    const store = createProgressStore(new MemoryProgressRepository());
    await expect(
      store.getState().recordGameResult(result({ score: -1 })),
    ).rejects.toThrow(RangeError);
    expect(store.getState().results).toHaveLength(0);
  });
});
