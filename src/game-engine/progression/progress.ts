import type { GameResult, UserProgress } from "../../types/progress";

export function validateGameResult(result: GameResult): void {
  if (!result.gameId.trim()) {
    throw new RangeError("Game result gameId must not be empty.");
  }
  if (!Number.isSafeInteger(result.score) || result.score < 0) {
    throw new RangeError("Game result score must be a non-negative safe integer.");
  }
  if (Number.isNaN(Date.parse(result.completedAt))) {
    throw new RangeError("Game result completedAt must be an ISO-8601 date.");
  }
  if (result.stars !== undefined && (!Number.isInteger(result.stars) || result.stars < 0 || result.stars > (result.maxStars ?? Number.MAX_SAFE_INTEGER))) {
    throw new RangeError("Game result stars must be a whole number no larger than maxStars.");
  }
}

/** Derives learner progress from the full list of stored game results. */
export function summarizeProgress(
  results: readonly GameResult[],
): UserProgress {
  const completed = new Set<string>();
  const bestScores: Record<string, number> = {};
  let lastActivity: string | null = null;

  for (const result of results) {
    if (result.completionStatus === "completed") {
      completed.add(result.gameId);
      bestScores[result.gameId] = Math.max(
        bestScores[result.gameId] ?? 0,
        result.score,
      );
    }
    if (
      lastActivity === null ||
      Date.parse(result.completedAt) > Date.parse(lastActivity)
    ) {
      lastActivity = result.completedAt;
    }
  }

  return {
    completedGames: [...completed],
    bestScores,
    totalBestScore: Object.values(bestScores).reduce(
      (total, score) => total + score,
      0,
    ),
    lastActivity,
  };
}

export interface WorldProgress {
  readonly worldId: string;
  readonly title: string;
  readonly completedGames: number;
  readonly totalGames: number;
  /** Best scores summed over the world's games. */
  readonly bestScore: number;
}

/** Completed games and best scores per physics world (PRD §11 "progress by physics world"). */
export function summarizeWorldProgress(
  progress: UserProgress,
  worlds: readonly { readonly id: string; readonly title: string; readonly entries: readonly { readonly id: string; readonly kind: string }[] }[],
): WorldProgress[] {
  const completed = new Set(progress.completedGames);
  return worlds.map((world) => {
    const games = world.entries.filter((entry) => entry.kind === "game");
    return {
      worldId: world.id,
      title: world.title,
      completedGames: games.filter((game) => completed.has(game.id)).length,
      totalGames: games.length,
      bestScore: games.reduce((sum, game) => sum + (progress.bestScores[game.id] ?? 0), 0),
    };
  });
}
