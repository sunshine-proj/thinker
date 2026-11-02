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
