import { PHYSICS_WORLDS, type PhysicsWorld } from "../../data/games/gameCatalog";
import type { GameResult, RecordedPrediction, SavedExperiment } from "../../types/progress";

export interface AchievementContext {
  readonly results: readonly GameResult[];
  readonly experiments: readonly SavedExperiment[];
  /** Predictions made in thought experiments and labs (optional for older callers). */
  readonly predictions?: readonly RecordedPrediction[];
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

/** Thought experiments whose harder variation the learner has answered. */
export function finishedThoughtExperiments(predictions: readonly RecordedPrediction[] = []): Set<string> {
  return new Set(
    predictions
      .filter((prediction) => prediction.activityKind === "thought-experiment" && prediction.questionId === "variation")
      .map((prediction) => prediction.activityId),
  );
}

const completesAll = (gameIds: readonly string[]) => ({ results }: AchievementContext) => {
  const completed = completedGameIds(results);
  return gameIds.length > 0 && gameIds.every((id) => completed.has(id));
};

const gamesOf = (world: PhysicsWorld) => world.entries.filter((entry) => entry.kind === "game").map((entry) => entry.id);
const labIds = PHYSICS_WORLDS.flatMap((world) => world.entries).filter((entry) => entry.kind === "experiment").map((entry) => entry.id);
const wavesGames = gamesOf(PHYSICS_WORLDS.find((world) => world.id === "waves") as PhysicsWorld);

/** One achievement per physics world, for completing every game in it (PRD §11). */
export const WORLD_ACHIEVEMENTS: readonly AchievementDefinition[] = PHYSICS_WORLDS.map((world) => ({
  id: `world-${world.id}`,
  title: `${world.title} Champion`,
  description: `Complete every game in ${world.title}.`,
  isUnlocked: completesAll(gamesOf(world)),
}));

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
    id: "space-engineer",
    title: "Space Engineer",
    description: "Complete Space Mission, Orbit Simulator, Moon Landing and Asteroid Mission.",
    isUnlocked: completesAll(["space-mission", "orbit-simulator", "moon-landing", "asteroid-mission"]),
  },
  {
    id: "wave-master",
    title: "Wave Master",
    description: "Complete three Waves & Sound games.",
    isUnlocked: ({ results }) => {
      const completed = completedGameIds(results);
      return wavesGames.filter((id) => completed.has(id)).length >= 3;
    },
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
    id: "lab-explorer",
    title: "Lab Explorer",
    description: "Save a run in every Experiment Lab experiment.",
    isUnlocked: ({ experiments }) => {
      const saved = new Set(experiments.map((experiment) => experiment.experimentId));
      return labIds.every((id) => saved.has(id));
    },
  },
  {
    id: "thought-explorer",
    title: "Thought Explorer",
    description: "Finish three thought experiments, including their harder variations.",
    isUnlocked: ({ predictions }) => finishedThoughtExperiments(predictions).size >= 3,
  },
  {
    id: "good-predictor",
    title: "Good Predictor",
    description: "Make five predictions that the results confirm.",
    isUnlocked: ({ predictions = [] }) => predictions.filter((prediction) => prediction.correct === true).length >= 5,
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
  ...WORLD_ACHIEVEMENTS,
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
