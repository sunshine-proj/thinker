import { describe, expect, it, vi } from "vitest";
import { MemoryProgressRepository } from "../../src/services/storage/progressRepository";
import {
  createMemoryPendingDeletions,
  createSyncManager,
  mergeRemoteProgress,
} from "../../src/services/sync/progressSync";
import {
  createSupabaseSyncAdapter,
  parseRemoteRows,
  type SessionStore,
} from "../../src/services/sync/supabaseAdapter";
import { readSupabaseConfig } from "../../src/services/sync/syncConfig";
import type { GameResult, SavedExperiment } from "../../src/types/progress";

const result: GameResult = {
  gameId: "projectile-master",
  score: 240,
  difficulty: "Beginner",
  completionStatus: "completed",
  completedAt: "2026-11-02T10:00:00.000Z",
};
const experiment: SavedExperiment = {
  id: "run-1",
  experimentId: "gravity-comparison",
  experimentName: "Gravity Comparison",
  runName: "Mars",
  parameters: { body: "mars" },
  results: [{ id: "t", label: "Fall time", value: 1.2, unit: "s" }],
  createdAt: "2026-11-02T11:00:00.000Z",
};

describe("Supabase configuration", () => {
  it("is off unless both URL and key are set and the URL is secure", () => {
    expect(readSupabaseConfig({})).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: "https://x.supabase.co" })).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: "http://x.example", VITE_SUPABASE_ANON_KEY: "k" })).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: "not a url", VITE_SUPABASE_ANON_KEY: "k" })).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: "https://x.supabase.co/", VITE_SUPABASE_ANON_KEY: " k " })).toEqual({
      url: "https://x.supabase.co",
      anonKey: "k",
    });
  });
});

describe("merging remote progress", () => {
  it("adds only missing records, so repeated merges are idempotent", async () => {
    const repository = new MemoryProgressRepository();
    await repository.saveGameResult(result);
    const remote = {
      results: [result, { ...result, score: 300, completedAt: "2026-11-03T10:00:00.000Z" }],
      experiments: [experiment],
      achievements: [{ achievementId: "first-steps", title: "First Steps", description: "d", unlockedAt: "2026-11-02T10:00:01.000Z" }],
    };
    expect(await mergeRemoteProgress(repository, remote)).toBe(3);
    expect(await mergeRemoteProgress(repository, remote)).toBe(0);
    expect((await repository.listGameResults()).map((r) => r.score)).toEqual([240, 300]);
  });

  it("does not restore an experiment deleted on this device", async () => {
    const repository = new MemoryProgressRepository();
    const added = await mergeRemoteProgress(
      repository,
      { results: [], experiments: [experiment], achievements: [] },
      new Set(["run-1"]),
    );
    expect(added).toBe(0);
  });
});

describe("sync manager with a two-way adapter", () => {
  it("sends deletions, pulls and merges, reloads, then pushes", async () => {
    const repository = new MemoryProgressRepository();
    const calls: string[] = [];
    const onMerged = vi.fn();
    const deletions = createMemoryPendingDeletions();
    const manager = createSyncManager(
      repository,
      {
        deleteExperiments: async (ids) => void calls.push(`delete:${ids.join()}`),
        pull: async () => (calls.push("pull"), { results: [result], experiments: [], achievements: [] }),
        push: async (data) => void calls.push(`push:${data.results.length}`),
      },
      () => true,
      { pendingDeletions: deletions, onMerged },
    );
    expect(manager.remote).toBe(true);
    manager.recordExperimentDeletion("old-run");

    expect(await manager.sync()).toBe("idle");
    expect(calls).toEqual(["delete:old-run", "pull", "push:1"]);
    expect(onMerged).toHaveBeenCalledOnce();
    expect(deletions.list()).toEqual([]);
  });

  it("keeps pending deletions and reports an error when the account cannot be reached", async () => {
    const deletions = createMemoryPendingDeletions();
    const manager = createSyncManager(
      new MemoryProgressRepository(),
      { push: async () => undefined, deleteExperiments: async () => { throw new Error("down"); } },
      () => true,
      { pendingDeletions: deletions },
    );
    manager.recordExperimentDeletion("run-1");
    expect(await manager.sync()).toBe("error");
    expect(deletions.list()).toEqual(["run-1"]);
  });
});

function memorySessions(): SessionStore {
  let value: ReturnType<SessionStore["load"]> = null;
  return { load: () => value, save: (session) => void (value = session) };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("Supabase adapter", () => {
  const config = { url: "https://demo.supabase.co", anonKey: "anon" };
  const authBody = { access_token: "token-1", refresh_token: "refresh-1", expires_in: 3600, user: { id: "user-1" } };

  it("signs in anonymously once and upserts rows that ignore duplicates", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, _init?: RequestInit) =>
      String(url).includes("/auth/v1/signup") ? jsonResponse(authBody) : new Response(null, { status: 201 }),
    );
    const adapter = createSupabaseSyncAdapter(config, fetchMock as unknown as typeof fetch, memorySessions(), () => 0);

    await adapter.push({ results: [result], experiments: [experiment], achievements: [] });
    await adapter.push({ results: [result], experiments: [], achievements: [] });

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.filter((url) => url.includes("signup"))).toHaveLength(1);
    const resultCall = fetchMock.mock.calls.find(([url]) => String(url).includes("game_results"));
    expect(String(resultCall?.[0])).toContain("on_conflict=user_id,game_id,completed_at");
    const init = resultCall?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-1");
    expect((init.headers as Record<string, string>).Prefer).toContain("ignore-duplicates");
    expect(JSON.parse(String(init.body))).toEqual([
      { user_id: "user-1", game_id: "projectile-master", score: 240, difficulty: "Beginner", completion_status: "completed", completed_at: "2026-11-02T10:00:00.000Z", stars: null, max_stars: null },
    ]);
    expect(urls.some((url) => url.includes("achievements"))).toBe(false);
  });

  it("refreshes an expired session before a request", async () => {
    const sessions = memorySessions();
    sessions.save({ accessToken: "old", refreshToken: "refresh-0", expiresAt: 10, userId: "user-1" });
    const fetchMock = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("grant_type=refresh_token") ? jsonResponse(authBody) : jsonResponse([]),
    );
    const adapter = createSupabaseSyncAdapter(config, fetchMock as unknown as typeof fetch, sessions, () => 1_000_000);
    await adapter.pull?.();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("grant_type=refresh_token");
    expect(sessions.load()?.accessToken).toBe("token-1");
  });

  it("fails clearly when the server rejects a request", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("signup") ? jsonResponse(authBody) : new Response(null, { status: 401 }),
    );
    const adapter = createSupabaseSyncAdapter(config, fetchMock as unknown as typeof fetch, memorySessions(), () => 0);
    await expect(adapter.push({ results: [result], experiments: [], achievements: [] })).rejects.toThrow("401");
  });

  it("drops malformed remote rows", () => {
    const parsed = parseRemoteRows({
      results: [
        { game_id: "g", score: 10, difficulty: "Beginner", completion_status: "completed", completed_at: "2026-11-02T10:00:00.000Z" },
        { game_id: "g", score: -1, difficulty: "Beginner", completion_status: "completed", completed_at: "2026-11-02T10:00:00.000Z" },
        { game_id: "g", score: 1, difficulty: "Expert", completion_status: "completed", completed_at: "x" },
      ],
      experiments: "not a list",
      achievements: [{ achievement_id: "a", title: "A", description: "d", unlocked_at: "2026" }, { achievement_id: 3 }],
    });
    expect(parsed.results).toHaveLength(1);
    expect(parseRemoteRows({ results: [{ game_id: "g", score: 10, difficulty: "Beginner", completion_status: "completed", completed_at: "2026-11-02T10:00:00.000Z", stars: 7, max_stars: 9 }], experiments: [], achievements: [] }).results[0]).toMatchObject({ stars: 7, maxStars: 9 });
    expect(parsed.experiments).toEqual([]);
    expect(parsed.achievements).toHaveLength(1);
  });
});
