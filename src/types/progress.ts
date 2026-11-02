export type GameDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type GameCompletionStatus = "completed" | "abandoned";

/** One finished (or abandoned) play-through of a game. */
export interface GameResult {
  readonly gameId: string;
  readonly score: number;
  readonly difficulty: GameDifficulty;
  readonly completionStatus: GameCompletionStatus;
  /** ISO-8601 timestamp. */
  readonly completedAt: string;
}

export interface UserProgress {
  readonly completedGames: readonly string[];
  readonly bestScores: Readonly<Record<string, number>>;
  readonly totalBestScore: number;
  readonly lastActivity: string | null;
}

/** A named, plain-data measurement taken from an experiment run. */
export interface ExperimentMeasurement {
  readonly id: string;
  readonly label: string;
  /** SI value, or null when the quantity is undefined (for example, orbit radius with no field). */
  readonly value: number | null;
  readonly unit: string;
}

/** A saved experiment configuration with the results it produced. */
export interface SavedExperiment {
  readonly id: string;
  readonly experimentId: string;
  readonly experimentName: string;
  /** Name the learner gave this run. */
  readonly runName: string;
  /** JSON-safe parameters that the experiment can restore. */
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly results: readonly ExperimentMeasurement[];
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
}

export interface UnlockedAchievement {
  readonly achievementId: string;
  readonly title: string;
  readonly description: string;
  /** ISO-8601 timestamp. */
  readonly unlockedAt: string;
}

/** In-progress game state that lets a learner resume after leaving. */
export interface GameSession {
  readonly gameId: string;
  /** ISO-8601 timestamp. */
  readonly savedAt: string;
  readonly data: unknown;
}
