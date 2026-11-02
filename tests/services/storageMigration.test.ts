import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import {
  DATABASE_NAME,
  IndexedDbProgressRepository,
  MemoryProgressRepository,
} from "../../src/services/storage/progressRepository";
import type {
  GameResult,
  SavedExperiment,
  UnlockedAchievement,
} from "../../src/types/progress";

const result: GameResult = {
  gameId: "projectile-master", score: 240, difficulty: "Beginner",
  completionStatus: "completed", completedAt: "2026-11-02T10:00:00.000Z",
};
const experiment: SavedExperiment = {
  id: "e1", experimentId: "electron-trajectory-lab", experimentName: "Electron Trajectory Lab",
  runName: "Run 1", parameters: { particle: "electron" },
  results: [{ id: "speed", label: "Speed", value: 2e6, unit: "m/s" }],
  createdAt: "2026-11-02T10:00:00.000Z",
};
const achievement: UnlockedAchievement = {
  achievementId: "first-steps", title: "First Steps", description: "Complete your first game.",
  unlockedAt: "2026-11-02T10:00:00.000Z",
};

describe.each([
  ["IndexedDB", () => new IndexedDbProgressRepository(new IDBFactory())],
  ["memory", () => new MemoryProgressRepository()],
])("%s repository (v2 stores)", (_name, create) => {
  it("stores, replaces and deletes saved experiments", async () => {
    const repository = create();
    await repository.saveExperiment(experiment);
    await repository.saveExperiment({ ...experiment, runName: "Renamed" });

    expect(await repository.listSavedExperiments()).toEqual([{ ...experiment, runName: "Renamed" }]);
    await repository.deleteExperiment("e1");
    expect(await repository.listSavedExperiments()).toEqual([]);
  });

  it("stores each achievement once", async () => {
    const repository = create();
    await repository.saveAchievement(achievement);
    await repository.saveAchievement(achievement);

    expect(await repository.listAchievements()).toEqual([achievement]);
  });

  it("stores one session per game and can delete it", async () => {
    const repository = create();
    expect(await repository.loadSession("g")).toBeNull();
    await repository.saveSession({ gameId: "g", savedAt: "t1", data: { round: 1 } });
    await repository.saveSession({ gameId: "g", savedAt: "t2", data: { round: 2 } });

    expect(await repository.loadSession("g")).toEqual({ gameId: "g", savedAt: "t2", data: { round: 2 } });
    await repository.deleteSession("g");
    expect(await repository.loadSession("g")).toBeNull();
  });

  it("clears every kind of record", async () => {
    const repository = create();
    await repository.saveGameResult(result);
    await repository.saveExperiment(experiment);
    await repository.saveAchievement(achievement);
    await repository.saveSession({ gameId: "g", savedAt: "t", data: 1 });
    await repository.clear();

    expect(await repository.listGameResults()).toEqual([]);
    expect(await repository.listSavedExperiments()).toEqual([]);
    expect(await repository.listAchievements()).toEqual([]);
    expect(await repository.loadSession("g")).toBeNull();
  });
});

describe("upgrading a version 1 database", () => {
  it("keeps stored game results and adds the new stores", async () => {
    const factory = new IDBFactory();
    // Recreate what the previous release stored: version 1 with only gameResults.
    await new Promise<void>((resolve, reject) => {
      const request = factory.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("gameResults", { autoIncrement: true });
        store.createIndex("gameId", "gameId");
        store.add(result);
      };
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    const repository = new IndexedDbProgressRepository(factory);
    expect(await repository.listGameResults()).toEqual([result]);
    await repository.saveExperiment(experiment);
    expect(await repository.listSavedExperiments()).toEqual([experiment]);
  });
});
