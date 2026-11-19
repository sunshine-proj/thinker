import { validateGameResult } from "../../game-engine/progression/progress";
import type {
  ExperimentMeasurement,
  GameResult,
  SavedExperiment,
  UnlockedAchievement,
} from "../../types/progress";
import type { ProgressExport, ProgressSyncAdapter } from "./progressSync";
import type { SupabaseConfig } from "./syncConfig";

/**
 * Supabase sync over its documented REST endpoints (GoTrue auth and PostgREST),
 * using `fetch` so no client library is added to the bundle.
 *
 * Accounts are anonymous by default: the first sync signs the device in
 * anonymously (anonymous sign-ins must be enabled in the Supabase project) and
 * keeps the session in localStorage. Tables and row-level-security policies are
 * in supabase/migrations/0001_progress.sql. Timestamps are stored as the exact
 * ISO strings the app produced, so records keep their natural keys across devices.
 */

interface Session {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Unix time in seconds. */
  readonly expiresAt: number;
  readonly userId: string;
}

export interface SessionStore {
  load(): Session | null;
  save(session: Session | null): void;
}

const SESSION_KEY = "physics-playground.supabase-session";

export const localSessionStore: SessionStore = {
  load() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? parseSession(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
  save(session) {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Without storage a new anonymous session is created on the next sync.
    }
  },
};

function parseSession(value: unknown): Session | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return typeof record.accessToken === "string" &&
    typeof record.refreshToken === "string" &&
    typeof record.expiresAt === "number" &&
    typeof record.userId === "string"
    ? { accessToken: record.accessToken, refreshToken: record.refreshToken, expiresAt: record.expiresAt, userId: record.userId }
    : null;
}

function sessionFromAuthResponse(body: unknown, now: number): Session {
  const record = (body ?? {}) as Record<string, unknown>;
  const user = (record.user ?? {}) as Record<string, unknown>;
  if (typeof record.access_token !== "string" || typeof record.refresh_token !== "string" || typeof user.id !== "string") {
    throw new Error("Supabase did not return a session.");
  }
  const expiresIn = typeof record.expires_in === "number" ? record.expires_in : 3600;
  const expiresAt = typeof record.expires_at === "number" ? record.expires_at : Math.floor(now / 1000) + expiresIn;
  return { accessToken: record.access_token, refreshToken: record.refresh_token, expiresAt, userId: user.id };
}

const isString = (value: unknown): value is string => typeof value === "string";
const DIFFICULTIES = new Set(["Beginner", "Intermediate", "Advanced"]);

/** Converts remote rows to app records, dropping anything malformed. Remote data is untrusted. */
export function parseRemoteRows(rows: {
  results: unknown;
  experiments: unknown;
  achievements: unknown;
}): ProgressExport {
  const list = (value: unknown) => (Array.isArray(value) ? value : []) as Record<string, unknown>[];
  const results: GameResult[] = [];
  for (const row of list(rows.results)) {
    const candidate = {
      gameId: row.game_id,
      score: row.score,
      difficulty: row.difficulty,
      completionStatus: row.completion_status,
      completedAt: row.completed_at,
      ...(typeof row.stars === "number" ? { stars: row.stars } : {}),
      ...(typeof row.max_stars === "number" ? { maxStars: row.max_stars } : {}),
    };
    if (
      isString(candidate.gameId) && typeof candidate.score === "number" && isString(candidate.completedAt) &&
      DIFFICULTIES.has(candidate.difficulty as string) &&
      (candidate.completionStatus === "completed" || candidate.completionStatus === "abandoned")
    ) {
      try {
        validateGameResult(candidate as GameResult);
        results.push(candidate as GameResult);
      } catch {
        // Skip invalid rows.
      }
    }
  }
  const experiments: SavedExperiment[] = list(rows.experiments)
    .filter((row) =>
      isString(row.id) && isString(row.experiment_id) && isString(row.experiment_name) && isString(row.run_name) &&
      isString(row.created_at) && typeof row.parameters === "object" && row.parameters !== null &&
      !Array.isArray(row.parameters) && Array.isArray(row.results),
    )
    .map((row) => ({
      id: row.id as string,
      experimentId: row.experiment_id as string,
      experimentName: row.experiment_name as string,
      runName: row.run_name as string,
      parameters: row.parameters as Record<string, unknown>,
      results: (row.results as unknown[]).filter(isMeasurement),
      createdAt: row.created_at as string,
    }));
  const achievements: UnlockedAchievement[] = list(rows.achievements)
    .filter((row) => isString(row.achievement_id) && isString(row.title) && isString(row.description) && isString(row.unlocked_at))
    .map((row) => ({
      achievementId: row.achievement_id as string,
      title: row.title as string,
      description: row.description as string,
      unlockedAt: row.unlocked_at as string,
    }));
  return { results, experiments, achievements };
}

function isMeasurement(value: unknown): value is ExperimentMeasurement {
  const record = value as Record<string, unknown> | null;
  return (
    typeof record === "object" && record !== null && isString(record.id) && isString(record.label) &&
    isString(record.unit) && (record.value === null || typeof record.value === "number")
  );
}

export function createSupabaseSyncAdapter(
  config: SupabaseConfig,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
  sessions: SessionStore = localSessionStore,
  now: () => number = () => Date.now(),
): ProgressSyncAdapter {
  const authHeaders = { apikey: config.anonKey, "Content-Type": "application/json" };

  const authRequest = async (path: string, body: unknown): Promise<Session> => {
    const response = await fetchImpl(`${config.url}/auth/v1/${path}`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Supabase sign-in failed (${response.status}).`);
    }
    const session = sessionFromAuthResponse(await response.json(), now());
    sessions.save(session);
    return session;
  };

  const getSession = async (): Promise<Session> => {
    const stored = sessions.load();
    // Refresh a minute early so a request never carries an expiring token.
    if (stored && stored.expiresAt - 60 > now() / 1000) {
      return stored;
    }
    if (stored) {
      try {
        return await authRequest("token?grant_type=refresh_token", { refresh_token: stored.refreshToken });
      } catch {
        sessions.save(null);
      }
    }
    return authRequest("signup", { data: {} });
  };

  const rest = async (path: string, init: RequestInit = {}): Promise<Response> => {
    const session = await getSession();
    const response = await fetchImpl(`${config.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (!response.ok) {
      throw new Error(`Supabase request failed (${response.status}).`);
    }
    return response;
  };

  const upsert = async (table: string, conflict: string, rows: readonly Record<string, unknown>[]) => {
    if (rows.length === 0) {
      return;
    }
    await rest(`${table}?on_conflict=${conflict}`, {
      method: "POST",
      // Records never change, so an existing row is simply kept.
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
  };

  return {
    async push({ results, experiments, achievements }) {
      const { userId } = await getSession();
      await upsert("game_results", "user_id,game_id,completed_at", results.map((result) => ({
        user_id: userId,
        game_id: result.gameId,
        score: result.score,
        difficulty: result.difficulty,
        completion_status: result.completionStatus,
        completed_at: result.completedAt,
        stars: result.stars ?? null,
        max_stars: result.maxStars ?? null,
      })));
      await upsert("saved_experiments", "user_id,id", experiments.map((experiment) => ({
        user_id: userId,
        id: experiment.id,
        experiment_id: experiment.experimentId,
        experiment_name: experiment.experimentName,
        run_name: experiment.runName,
        parameters: experiment.parameters,
        results: experiment.results,
        created_at: experiment.createdAt,
      })));
      await upsert("achievements", "user_id,achievement_id", achievements.map((achievement) => ({
        user_id: userId,
        achievement_id: achievement.achievementId,
        title: achievement.title,
        description: achievement.description,
        unlocked_at: achievement.unlockedAt,
      })));
    },

    async pull() {
      const [results, experiments, achievements] = await Promise.all([
        rest("game_results?select=game_id,score,difficulty,completion_status,completed_at,stars,max_stars").then((r) => r.json()),
        rest("saved_experiments?select=id,experiment_id,experiment_name,run_name,parameters,results,created_at").then((r) => r.json()),
        rest("achievements?select=achievement_id,title,description,unlocked_at").then((r) => r.json()),
      ]);
      return parseRemoteRows({ results, experiments, achievements });
    },

    async deleteExperiments(ids) {
      if (ids.length === 0) {
        return;
      }
      const list = ids.map((id) => `"${id.replace(/["\\]/g, "")}"`).join(",");
      await rest(`saved_experiments?id=in.(${encodeURIComponent(list)})`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
    },
  };
}
