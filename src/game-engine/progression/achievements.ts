import type { GameResult, SavedExperiment } from "../../types/progress";

export interface AchievementContext {
  readonly results: readonly GameResult[];
  readonly experiments: readonly SavedExperiment[];
  /** Ids of every playable game, used by "complete everything" achievements. */
  readonly playableGameIds: readonly string[];
}

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly isUnlocked: (context: AchievementContext) => boolean;
}

export function getBestScore(
  results: readonly GameResult[],
  gameId: string,
): number {
  return results
    .filter(
      (result) =>
        result.gameId === gameId && result.completionStatus === "completed",
    )
    .reduce((best, result) => Math.max(best, result.score), 0);
}

function completedGameIds(results: readonly GameResult[]): Set<string> {
  return new Set(
    results
      .filter((result) => result.completionStatus === "completed")
      .map((result) => result.gameId),
  );
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = Object.freeze([
  {
    id: "first-steps",
    title: "First Steps",
    description: "Complete your first game.",
    isUnlocked: ({ results }) => completedGameIds(results).size >= 1,
  },
  {
    id: "gravity-master",
    title: "Gravity Master",
    description: "Score at least 270 in Projectile Master.",
    isUnlocked: ({ results }) => getBestScore(results, "projectile-master") >= 270,
  },
  {
    id: "balanced-mind",
    title: "Balanced Mind",
    description: "Score at least 270 in Balance Challenge.",
    isUnlocked: ({ results }) => getBestScore(results, "balance-challenge") >= 270,
  },
  {
    id: "circuit-genius",
    title: "Circuit Genius",
    description: "Score at least 270 in Circuit Builder.",
    isUnlocked: ({ results }) => getBestScore(results, "circuit-builder") >= 270,
  },
  {
    id: "particle-explorer",
    title: "Particle Explorer",
    description: "Save an Electron Trajectory Lab experiment.",
    isUnlocked: ({ experiments }) =>
      experiments.some(
        (experiment) => experiment.experimentId === "electron-trajectory-lab",
      ),
  },
  {
    id: "lab-notebook",
    title: "Lab Notebook",
    description: "Save three experiments.",
    isUnlocked: ({ experiments }) => experiments.length >= 3,
  },
  {
    id: "scientific-mind",
    title: "Scientific Mind",
    description: "Complete every game that is available.",
    isUnlocked: ({ results, playableGameIds }) => {
      const completed = completedGameIds(results);
      return (
        playableGameIds.length > 0 &&
        playableGameIds.every((gameId) => completed.has(gameId))
      );
    },
  },
]);

/** Achievements whose conditions are met and that are not yet unlocked. */
export function findNewlyUnlocked(
  context: AchievementContext,
  alreadyUnlockedIds: ReadonlySet<string>,
  definitions: readonly AchievementDefinition[] = ACHIEVEMENTS,
): AchievementDefinition[] {
  return definitions.filter(
    (definition) =>
      !alreadyUnlockedIds.has(definition.id) && definition.isUnlocked(context),
  );
}
