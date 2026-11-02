import { create } from "zustand";
import { summarizeProgress, validateGameResult } from "../game-engine/progression/progress";
import {
  createProgressRepository,
  type ProgressRepository,
} from "../services/storage/progressRepository";
import type { GameResult, UserProgress } from "../types/progress";

export interface ProgressState {
  readonly status: "idle" | "loading" | "ready";
  readonly results: readonly GameResult[];
  readonly progress: UserProgress;
  /** Set when results could not be read or saved; progress still works in memory. */
  readonly persistenceError: string | null;
  hydrate(): Promise<void>;
  recordGameResult(result: GameResult): Promise<void>;
  clearProgress(): Promise<void>;
}

function describeError(error: unknown, action: string): string {
  const reason = error instanceof Error ? error.message : "unknown error";
  return `Progress could not be ${action} on this device (${reason}).`;
}

export function createProgressStore(repository: ProgressRepository) {
  let hydration: Promise<void> | null = null;

  return create<ProgressState>((set, get) => ({
    status: "idle",
    results: [],
    progress: summarizeProgress([]),
    persistenceError: null,

    hydrate() {
      hydration ??= (async () => {
        set({ status: "loading" });
        try {
          const results = await repository.listGameResults();
          set({
            status: "ready",
            results,
            progress: summarizeProgress(results),
            persistenceError: null,
          });
        } catch (error) {
          set({
            status: "ready",
            persistenceError: describeError(error, "loaded"),
          });
        }
      })();
      return hydration;
    },

    async recordGameResult(result) {
      validateGameResult(result);
      // Load stored results first so the saved result is not counted twice.
      await get().hydrate();
      const results = [...get().results, result];
      set({ results, progress: summarizeProgress(results) });
      try {
        await repository.saveGameResult(result);
      } catch (error) {
        set({ persistenceError: describeError(error, "saved") });
      }
    },

    async clearProgress() {
      set({ results: [], progress: summarizeProgress([]) });
      try {
        await repository.clear();
        set({ persistenceError: null });
      } catch (error) {
        set({ persistenceError: describeError(error, "cleared") });
      }
    },
  }));
}

export const useProgressStore = createProgressStore(createProgressRepository());
