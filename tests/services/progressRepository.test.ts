import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import {
  IndexedDbProgressRepository,
  MemoryProgressRepository,
} from "../../src/services/storage/progressRepository";
import type { GameResult } from "../../src/types/progress";

const result: GameResult = {
  gameId: "projectile-master",
  score: 240,
  difficulty: "Beginner",
  completionStatus: "completed",
  completedAt: "2026-11-02T10:00:00.000Z",
};

describe.each([
  ["IndexedDB", () => new IndexedDbProgressRepository(new IDBFactory())],
  ["memory", () => new MemoryProgressRepository()],
])("%s progress repository", (_name, create) => {
  it("starts empty, stores results in order, and clears them", async () => {
    const repository = create();
    expect(await repository.listGameResults()).toEqual([]);

    await repository.saveGameResult(result);
    await repository.saveGameResult({ ...result, score: 300 });
    expect((await repository.listGameResults()).map((r) => r.score)).toEqual([
      240, 300,
    ]);

    await repository.clear();
    expect(await repository.listGameResults()).toEqual([]);
  });
});

describe("IndexedDB persistence", () => {
  it("keeps results across repository instances sharing one database", async () => {
    const factory = new IDBFactory();
    await new IndexedDbProgressRepository(factory).saveGameResult(result);

    const reopened = new IndexedDbProgressRepository(factory);
    expect(await reopened.listGameResults()).toEqual([result]);
  });
});
