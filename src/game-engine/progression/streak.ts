import { toLocalDateKey } from "./challenges";

/**
 * A gentle daily streak: the number of consecutive local days, ending today or
 * yesterday, on which the learner did anything (a game, a saved run or a prediction).
 * Missing a day resets only the streak, never any progress.
 */
export function calculateStreak(activityTimestamps: readonly string[], now: Date): number {
  const days = new Set(
    activityTimestamps
      .map((timestamp) => new Date(timestamp))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map(toLocalDateKey),
  );
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Today does not have to be done yet: a streak alive until yesterday still counts.
  if (!days.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Picks a random game, preferring ones not played yet. `random` returns [0, 1). */
export function pickSurprise<T extends { readonly id: string }>(
  games: readonly T[],
  playedIds: ReadonlySet<string>,
  random: () => number = Math.random,
): T | null {
  const fresh = games.filter((game) => !playedIds.has(game.id));
  const pool = fresh.length > 0 ? fresh : games;
  if (pool.length === 0) {
    return null;
  }
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] as T;
}
