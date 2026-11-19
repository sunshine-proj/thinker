import type { CatalogEntry, PhysicsWorld } from "../../data/games/gameCatalog";
import type { GameResult, GameSession, RecordedPrediction } from "../../types/progress";

/**
 * Pure helpers behind the Home page: what to continue, what to try next and
 * what was done recently. All lists are deterministic for the same inputs.
 */

export interface ContinueItem {
  readonly entry: CatalogEntry;
  readonly savedAt: string;
}

/** In-progress games, most recently saved first. Sessions for unknown games are ignored. */
export function continueLearning(
  sessions: readonly GameSession[],
  findEntry: (id: string) => CatalogEntry | undefined,
  limit = 3,
): ContinueItem[] {
  return [...sessions]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .flatMap((session) => {
      const entry = findEntry(session.gameId);
      return entry ? [{ entry, savedAt: session.savedAt }] : [];
    })
    .slice(0, limit);
}

const DIFFICULTY_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 } as const;

/**
 * Suggests games from worlds the learner has not played yet: the easiest
 * unplayed game of each such world, in catalog order. Once every world has
 * been visited, it suggests the easiest unplayed games anywhere.
 */
export function recommendGames(
  results: readonly GameResult[],
  worlds: readonly PhysicsWorld[],
  limit = 3,
): CatalogEntry[] {
  const played = new Set(results.map((result) => result.gameId));
  const easiestUnplayed = (entries: readonly CatalogEntry[]) =>
    entries
      .filter((entry) => entry.kind === "game" && !played.has(entry.id))
      .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty])[0];
  const fresh = worlds
    .filter((world) => !world.entries.some((entry) => played.has(entry.id)))
    .flatMap((world) => {
      const entry = easiestUnplayed(world.entries);
      return entry ? [entry] : [];
    });
  if (fresh.length >= limit) {
    return fresh.slice(0, limit);
  }
  const chosen = new Set(fresh.map((entry) => entry.id));
  const rest = worlds
    .flatMap((world) => world.entries)
    .filter((entry) => entry.kind === "game" && !played.has(entry.id) && !chosen.has(entry.id))
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
  return [...fresh, ...rest].slice(0, limit);
}

/** The lab featured on a given local day, rotating through all experiments. */
export function featuredExperiment(experiments: readonly CatalogEntry[], date: Date): CatalogEntry | undefined {
  if (experiments.length === 0) {
    return undefined;
  }
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return experiments[((dayNumber % experiments.length) + experiments.length) % experiments.length];
}

export interface RecentActivity {
  readonly title: string;
  readonly path: string;
  readonly detail: string;
  readonly at: string;
}

/** Completed games and finished thought experiments, newest first. */
export function recentActivities(
  results: readonly GameResult[],
  predictions: readonly RecordedPrediction[],
  findEntry: (id: string) => CatalogEntry | undefined,
  findThought: (id: string) => { readonly title: string } | undefined,
  limit = 5,
): RecentActivity[] {
  const games = results
    .filter((result) => result.completionStatus === "completed")
    .flatMap((result) => {
      const entry = findEntry(result.gameId);
      return entry ? [{ title: entry.title, path: entry.path, detail: `${result.score} points`, at: result.completedAt }] : [];
    });
  const thoughts = predictions
    .filter((prediction) => prediction.activityKind === "thought-experiment" && prediction.questionId === "variation")
    .flatMap((prediction) => {
      const experiment = findThought(prediction.activityId);
      return experiment
        ? [{ title: experiment.title, path: `/thought-experiments/${prediction.activityId}`, detail: "Thought experiment finished", at: prediction.recordedAt }]
        : [];
    });
  return [...games, ...thoughts].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

const ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 } as const;

/**
 * A harder game to try after finishing one: a game of higher difficulty in the same
 * world (unplayed first), otherwise any unplayed game in that world.
 */
export function suggestHarderChallenge(
  gameId: string,
  worlds: readonly PhysicsWorld[],
  playedGameIds: ReadonlySet<string> = new Set(),
): CatalogEntry | null {
  const world = worlds.find((candidate) => candidate.entries.some((entry) => entry.id === gameId));
  const current = world?.entries.find((entry) => entry.id === gameId);
  if (!world || !current) {
    return null;
  }
  const games = world.entries.filter((entry) => entry.kind === "game" && entry.id !== gameId);
  const harder = games.filter((entry) => ORDER[entry.difficulty] > ORDER[current.difficulty]);
  const pick = (list: readonly CatalogEntry[]) => list.find((entry) => !playedGameIds.has(entry.id)) ?? list[0];
  return pick(harder) ?? pick(games.filter((entry) => !playedGameIds.has(entry.id))) ?? null;
}
