import { create } from "zustand";
import { getPlayableGameIds } from "../data/games/gameCatalog";
import { findNewlyUnlocked } from "../game-engine/progression/achievements";
import { summarizeProgress, validateGameResult } from "../game-engine/progression/progress";
import {
  createProgressRepository,
  type ProgressRepository,
} from "../services/storage/progressRepository";
import type {
  GameResult,
  GameSession,
  SavedExperiment,
  UnlockedAchievement,
  UserProgress,
} from "../types/progress";

export type NewExperiment = Omit<SavedExperiment, "id" | "createdAt">;

export interface ProgressState {
  readonly status: "idle" | "loading" | "ready";
  readonly results: readonly GameResult[];
  readonly experiments: readonly SavedExperiment[];
  readonly achievements: readonly UnlockedAchievement[];
  /** Achievements unlocked this session that have not been acknowledged yet. */
  readonly newlyUnlocked: readonly UnlockedAchievement[];
  readonly progress: UserProgress;
  /** Set when data could not be read or saved; everything still works in memory. */
  readonly persistenceError: string | null;
  hydrate(): Promise<void>;
  recordGameResult(result: GameResult): Promise<void>;
  saveExperiment(experiment: NewExperiment): Promise<SavedExperiment>;
  deleteExperiment(id: string): Promise<void>;
  loadSession(gameId: string): Promise<GameSession | null>;
  saveSession(gameId: string, data: unknown): Promise<void>;
  deleteSession(gameId: string): Promise<void>;
  acknowledgeAchievements(): void;
  clearProgress(): Promise<void>;
}

function describeError(error: unknown, action: string): string {
  const reason = error instanceof Error ? error.message : "unknown error";
  return `Progress could not be ${action} on this device (${reason}).`;
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createProgressStore(repository: ProgressRepository) {
  let hydration: Promise<void> | null = null;

  return create<ProgressState>((set, get) => {
    /** Unlocks and persists any achievements the current data now earns. */
    const unlockAchievements = async (): Promise<void> => {
      const { results, experiments, achievements } = get();
      const unlocked = findNewlyUnlocked(
        { results, experiments, playableGameIds: getPlayableGameIds() },
        new Set(achievements.map((achievement) => achievement.achievementId)),
      );
      if (unlocked.length === 0) {
        return;
      }

      const unlockedAt = new Date().toISOString();
      const added = unlocked.map((definition) => ({
        achievementId: definition.id,
        title: definition.title,
        description: definition.description,
        unlockedAt,
      }));
      set((state) => ({
        achievements: [...state.achievements, ...added],
        newlyUnlocked: [...state.newlyUnlocked, ...added],
      }));
      try {
        await Promise.all(added.map((a) => repository.saveAchievement(a)));
      } catch (error) {
        set({ persistenceError: describeError(error, "saved") });
      }
    };

    return {
      status: "idle",
      results: [],
      experiments: [],
      achievements: [],
      newlyUnlocked: [],
      progress: summarizeProgress([]),
      persistenceError: null,

      hydrate() {
        hydration ??= (async () => {
          set({ status: "loading" });
          try {
            const [results, experiments, achievements] = await Promise.all([
              repository.listGameResults(),
              repository.listSavedExperiments(),
              repository.listAchievements(),
            ]);
            set({
              status: "ready",
              results,
              experiments,
              achievements,
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
        await unlockAchievements();
      },

      async saveExperiment(newExperiment) {
        if (!newExperiment.experimentId.trim() || !newExperiment.experimentName.trim()) {
          throw new RangeError("An experiment needs an id and a name.");
        }
        await get().hydrate();
        const experiment: SavedExperiment = {
          ...newExperiment,
          id: createId(),
          createdAt: new Date().toISOString(),
        };
        set({ experiments: [...get().experiments, experiment] });
        try {
          await repository.saveExperiment(experiment);
        } catch (error) {
          set({ persistenceError: describeError(error, "saved") });
        }
        await unlockAchievements();
        return experiment;
      },

      async deleteExperiment(id) {
        set({
          experiments: get().experiments.filter((experiment) => experiment.id !== id),
        });
        try {
          await repository.deleteExperiment(id);
        } catch (error) {
          set({ persistenceError: describeError(error, "updated") });
        }
      },

      async loadSession(gameId) {
        try {
          return await repository.loadSession(gameId);
        } catch (error) {
          set({ persistenceError: describeError(error, "loaded") });
          return null;
        }
      },

      async saveSession(gameId, data) {
        try {
          await repository.saveSession({
            gameId,
            savedAt: new Date().toISOString(),
            data,
          });
        } catch (error) {
          set({ persistenceError: describeError(error, "saved") });
        }
      },

      async deleteSession(gameId) {
        try {
          await repository.deleteSession(gameId);
        } catch (error) {
          set({ persistenceError: describeError(error, "updated") });
        }
      },

      acknowledgeAchievements() {
        set({ newlyUnlocked: [] });
      },

      async clearProgress() {
        set({
          results: [],
          experiments: [],
          achievements: [],
          newlyUnlocked: [],
          progress: summarizeProgress([]),
        });
        try {
          await repository.clear();
          set({ persistenceError: null });
        } catch (error) {
          set({ persistenceError: describeError(error, "cleared") });
        }
      },
    };
  });
}

/** The device's repository, shared by the store and by background services such as sync. */
export const progressRepository = createProgressRepository();
export const useProgressStore = createProgressStore(progressRepository);
