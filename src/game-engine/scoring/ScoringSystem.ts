export interface ScoringRule {
  readonly action: string;
  readonly label: string;
  readonly points: number;
}

export interface ScoreEntry {
  readonly id: string;
  readonly label: string;
  readonly points: number;
}

export interface ScoreState {
  readonly totalPoints: number;
  readonly entries: readonly ScoreEntry[];
}

export interface ScoreSummary {
  readonly totalPoints: number;
  readonly entryCount: number;
  readonly entries: readonly ScoreEntry[];
}

export type ScoreRecordStrategy = "add" | "best";

export function createScoreState(): ScoreState {
  return { totalPoints: 0, entries: [] };
}

export function recordScore(
  state: ScoreState,
  entry: ScoreEntry,
  strategy: ScoreRecordStrategy = "add",
): ScoreState {
  validateScoreEntry(entry);

  const existingEntry = state.entries.find(({ id }) => id === entry.id);
  const nextPoints =
    existingEntry && strategy === "best"
      ? Math.max(existingEntry.points, entry.points)
      : (existingEntry?.points ?? 0) + entry.points;
  const nextEntry = { ...entry, points: nextPoints };
  const entries = existingEntry
    ? state.entries.map((current) =>
        current.id === entry.id ? nextEntry : current,
      )
    : [...state.entries, nextEntry];
  const totalPoints = entries.reduce(
    (total, current) => total + current.points,
    0,
  );
  if (!Number.isSafeInteger(totalPoints)) {
    throw new RangeError("Total score must remain a safe integer.");
  }

  return {
    totalPoints,
    entries,
  };
}

export function applyScoringRule(
  state: ScoreState,
  action: string,
  rules: readonly ScoringRule[],
): ScoreState {
  const matchingRules = rules.filter((rule) => rule.action === action);
  if (matchingRules.length !== 1) {
    throw new RangeError(
      matchingRules.length === 0
        ? `No scoring rule is configured for "${action}".`
        : `More than one scoring rule is configured for "${action}".`,
    );
  }

  const [rule] = matchingRules;
  if (!rule) {
    throw new RangeError(`No scoring rule is configured for "${action}".`);
  }

  return recordScore(state, {
    id: action,
    label: rule.label,
    points: rule.points,
  });
}

export function summarizeScore(state: ScoreState): ScoreSummary {
  return {
    totalPoints: state.totalPoints,
    entryCount: state.entries.length,
    entries: state.entries,
  };
}

function validateScoreEntry(entry: ScoreEntry): void {
  if (!entry.id.trim()) {
    throw new RangeError("Score entry id must not be empty.");
  }
  if (!entry.label.trim()) {
    throw new RangeError("Score entry label must not be empty.");
  }
  if (!Number.isSafeInteger(entry.points) || entry.points < 0) {
    throw new RangeError("Score points must be a non-negative safe integer.");
  }
}
