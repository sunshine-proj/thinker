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
