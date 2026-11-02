import type { ProgressRepository } from "../storage/progressRepository";

/**
 * Sends local progress to a remote account (planned: Supabase). Implementations
 * must be idempotent, because a sync may be retried after a failure.
 */
export interface ProgressSyncAdapter {
  push(data: ProgressExport): Promise<void>;
}

export interface ProgressExport {
  readonly results: Awaited<ReturnType<ProgressRepository["listGameResults"]>>;
  readonly experiments: Awaited<ReturnType<ProgressRepository["listSavedExperiments"]>>;
  readonly achievements: Awaited<ReturnType<ProgressRepository["listAchievements"]>>;
}

export type SyncState = "local-only" | "idle" | "syncing" | "error";

export interface SyncManager {
  getState(): SyncState;
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
): SyncManager {
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
