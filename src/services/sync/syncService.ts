import {
  experimentDeletionListeners,
  progressRepository,
  useProgressStore,
} from "../../store/progressStore";
import { createSyncManager, type PendingDeletions } from "./progressSync";
import { createSupabaseSyncAdapter } from "./supabaseAdapter";
import { readSupabaseConfig } from "./syncConfig";

const DELETIONS_KEY = "physics-playground.pending-experiment-deletions";

/** Pending deletions survive reloads so an offline delete still reaches the account. */
const storedDeletions: PendingDeletions = {
  list() {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(DELETIONS_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      return [];
    }
  },
  add(id) {
    this.write([...new Set([...this.list(), id])]);
  },
  remove(ids) {
    const removed = new Set(ids);
    this.write(this.list().filter((id) => !removed.has(id)));
  },
  write(ids: string[]) {
    try {
      localStorage.setItem(DELETIONS_KEY, JSON.stringify(ids));
    } catch {
      // Without storage the deletion is retried only during this session.
    }
  },
} as PendingDeletions & { write(ids: string[]): void };

const config = readSupabaseConfig();

/**
 * The app's single sync manager. Without Supabase configuration it is
 * "local-only" and never touches the network.
 */
export const progressSync = createSyncManager(
  progressRepository,
  config ? createSupabaseSyncAdapter(config) : null,
  () => navigator.onLine,
  {
    pendingDeletions: storedDeletions,
    onMerged: () => useProgressStore.getState().reload(),
  },
);

/**
 * Starts background sync: once now, whenever connectivity returns, and shortly
 * after new local records. Returns a function that stops it.
 */
export function startProgressSync(target: Window = window): () => void {
  if (!progressSync.remote) {
    return () => undefined;
  }
  const onDelete = (id: string) => progressSync.recordExperimentDeletion(id);
  experimentDeletionListeners.add(onDelete);
  const stopReconnect = progressSync.syncOnReconnect(target);
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = useProgressStore.subscribe((state, previous) => {
    if (
      state.results !== previous.results ||
      state.experiments !== previous.experiments ||
      state.achievements !== previous.achievements
    ) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => void progressSync.sync(), 2_000);
    }
  });
  void progressSync.sync();
  return () => {
    experimentDeletionListeners.delete(onDelete);
    stopReconnect();
    unsubscribe();
    if (timer) {
      clearTimeout(timer);
    }
  };
}
