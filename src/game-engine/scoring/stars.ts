/**
 * Stars per round (1–3) for correctness, prediction accuracy and efficiency. Speed never
 * counts (PRD §9). The round score already combines accuracy, prediction and attempts;
 * hints lower the stars but never stop a learner from finishing.
 */
export const MAX_STARS_PER_ROUND = 3;
/** Hint levels: 1 nudge, 2 formula, 3 worked step. */
export const MAX_HINT_LEVEL = 3;

export function calculateRoundStars(roundScore: number, hintLevelUsed: number): 1 | 2 | 3 {
  if (!Number.isFinite(roundScore) || roundScore < 0) {
    throw new RangeError("roundScore must be a non-negative number.");
  }
  if (!Number.isInteger(hintLevelUsed) || hintLevelUsed < 0 || hintLevelUsed > MAX_HINT_LEVEL) {
    throw new RangeError("hintLevelUsed must be 0–3.");
  }
  if (roundScore >= 80 && hintLevelUsed <= 1) {
    return 3;
  }
  if (roundScore >= 50 && hintLevelUsed <= 2) {
    return 2;
  }
  return 1;
}

/** Best stars per round summed for a game; rounds not yet solved count as 0. */
export function totalStars(starsByRound: readonly number[]): number {
  return starsByRound.reduce((sum, stars) => sum + Math.max(0, Math.min(MAX_STARS_PER_ROUND, stars)), 0);
}

/** Best stars recorded for each game, from stored results that carry stars. */
export function bestStarsByGame(results: readonly { readonly gameId: string; readonly stars?: number; readonly completionStatus: string }[]): Record<string, number> {
  const best: Record<string, number> = {};
  for (const result of results) {
    if (result.completionStatus === "completed" && typeof result.stars === "number") {
      best[result.gameId] = Math.max(best[result.gameId] ?? 0, result.stars);
    }
  }
  return best;
}
