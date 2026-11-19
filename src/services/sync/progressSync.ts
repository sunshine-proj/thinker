import type { ProgressRepository } from "../storage/progressRepository";

/**
 * Sends local progress to a remote account (planned: Supabase). Implementations
 * must be idempotent, because a sync may be retried after a failure.
 */
export interface ProgressSyncAdapter {
  /** Uploads local records. Records are immutable, so uploading twice is harmless. */
  push(data: ProgressExport): Promise<void>;
  /** Downloads the account's records, for example those made on another device. */
  pull?(): Promise<ProgressExport>;
  /** Removes saved experiments the learner deleted on this device. */
  deleteExperiments?(ids: readonly string[]): Promise<void>;
}

/** Saved-experiment deletions that still have to reach the remote account. */
export interface PendingDeletions {
  list(): string[];
  add(id: string): void;
  remove(ids: readonly string[]): void;
}

export function createMemoryPendingDeletions(): PendingDeletions {
  const ids = new Set<string>();
  return {
    list: () => [...ids],
    add: (id) => void ids.add(id),
    remove: (removed) => removed.forEach((id) => ids.delete(id)),
  };
}

export interface SyncOptions {
  readonly pendingDeletions?: PendingDeletions;
  /** Called after remote records were added to this device, so the UI can reload. */
  readonly onMerged?: () => void | Promise<void>;
}

const resultKey = (result: { gameId: string; completedAt: string }) =>
  `${result.gameId}\u0000${result.completedAt}`;

/**
 * Adds remote records that this device does not have yet. Every record is
 * immutable and has a natural key (a result's game and completion time, an
 * experiment's id, an achievement's id), so a merge is a set union and two
 * devices can never conflict. Experiments deleted here and not yet deleted
 * remotely are skipped. Returns the number of records added.
 */
export async function mergeRemoteProgress(
  repository: ProgressRepository,
  remote: ProgressExport,
  skipExperimentIds: ReadonlySet<string> = new Set(),
): Promise<number> {
  const [results, experiments, achievements] = await Promise.all([
    repository.listGameResults(),
    repository.listSavedExperiments(),
    repository.listAchievements(),
  ]);
  const knownResults = new Set(results.map(resultKey));
  const knownExperiments = new Set(experiments.map((experiment) => experiment.id));
  const knownAchievements = new Set(achievements.map((achievement) => achievement.achievementId));
  let added = 0;
  for (const result of remote.results) {
    if (!knownResults.has(resultKey(result))) {
      knownResults.add(resultKey(result));
      await repository.saveGameResult(result);
      added += 1;
    }
  }
  for (const experiment of remote.experiments) {
    if (!knownExperiments.has(experiment.id) && !skipExperimentIds.has(experiment.id)) {
      knownExperiments.add(experiment.id);
      await repository.saveExperiment(experiment);
      added += 1;
    }
  }
  for (const achievement of remote.achievements) {
    if (!knownAchievements.has(achievement.achievementId)) {
      knownAchievements.add(achievement.achievementId);
      await repository.saveAchievement(achievement);
      added += 1;
    }
  }
  return added;
}

export interface ProgressExport {
  readonly results: Awaited<ReturnType<ProgressRepository["listGameResults"]>>;
  readonly experiments: Awaited<ReturnType<ProgressRepository["listSavedExperiments"]>>;
  readonly achievements: Awaited<ReturnType<ProgressRepository["listAchievements"]>>;
}

export type SyncState = "local-only" | "idle" | "syncing" | "error";

export interface SyncManager {
  getState(): SyncState;
  /** True when a remote account is configured; otherwise progress stays on this device. */
  readonly remote: boolean;
  /** Remembers a deleted saved experiment so the deletion reaches the account on the next sync. */
  recordExperimentDeletion(id: string): void;
  /** Pushes local data now. Resolves to the resulting state; never rejects. */
  sync(): Promise<SyncState>;
  /** Syncs whenever the browser regains connectivity. Returns an unsubscribe function. */
  syncOnReconnect(target: Pick<Window, "addEventListener" | "removeEventListener">): () => void;
  subscribe(listener: (state: SyncState) => void): () => void;
}

/**
 * Coordinates syncing. Without an adapter (no account configured) progress
 * simply stays on this device and the state is "local-only".
 */
export function createSyncManager(
  repository: ProgressRepository,
  adapter: ProgressSyncAdapter | null,
  isOnline: () => boolean = () => navigator.onLine,
  options: SyncOptions = {},
): SyncManager {
  const pendingDeletions = options.pendingDeletions ?? createMemoryPendingDeletions();
  let state: SyncState = adapter ? "idle" : "local-only";
  let inFlight: Promise<SyncState> | null = null;
  const listeners = new Set<(state: SyncState) => void>();

  const setState = (next: SyncState) => {
    state = next;
    listeners.forEach((listener) => listener(next));
  };

  const sync = (): Promise<SyncState> => {
    if (!adapter || !isOnline()) {
      return Promise.resolve(state);
    }
    inFlight ??= (async () => {
      setState("syncing");
      try {
        const deletions = pendingDeletions.list();
        if (deletions.length > 0 && adapter.deleteExperiments) {
          await adapter.deleteExperiments(deletions);
          pendingDeletions.remove(deletions);
        }
        if (adapter.pull) {
          const remote = await adapter.pull();
          const added = await mergeRemoteProgress(
            repository,
            remote,
            new Set(pendingDeletions.list()),
          );
          if (added > 0) {
            await options.onMerged?.();
          }
        }
        const [results, experiments, achievements] = await Promise.all([
          repository.listGameResults(),
          repository.listSavedExperiments(),
          repository.listAchievements(),
        ]);
        await adapter.push({ results, experiments, achievements });
        setState("idle");
      } catch {
        // Local data is untouched; the next reconnect retries.
        setState("error");
      } finally {
        inFlight = null;
      }
      return state;
    })();
    return inFlight;
  };

  return {
    getState: () => state,
    remote: adapter !== null,
    recordExperimentDeletion(id) {
      if (adapter) {
        pendingDeletions.add(id);
      }
    },
    sync,
    syncOnReconnect(target) {
      const handler = () => void sync();
      target.addEventListener("online", handler);
      return () => target.removeEventListener("online", handler);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
