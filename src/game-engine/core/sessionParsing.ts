import { createScoreState, recordScore, type ScoreState } from "../scoring/ScoringSystem";

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readInteger(
  record: JsonRecord,
  key: string,
  minimum: number,
  maximum: number,
): number | null {
  const value = record[key];
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : null;
}

export function readNumber(
  record: JsonRecord,
  key: string,
  minimum: number,
  maximum: number,
): number | null {
  const value = record[key];
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : null;
}

export function readString(record: JsonRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

export function readBooleanArray(
  record: JsonRecord,
  key: string,
  length: number,
): boolean[] | null {
  const value = record[key];
  return Array.isArray(value) &&
    value.length === length &&
    value.every((item) => typeof item === "boolean")
    ? (value as boolean[])
    : null;
}

export function readPausableStatus(
  record: JsonRecord,
  key: string,
): "playing" | "paused" | null {
  const value = record[key];
  return value === "playing" || value === "paused" ? value : null;
}

/** Rebuilds a score through the scoring rules, so corrupt saves cannot inject points. */
export function readScoreState(
  record: JsonRecord,
  key: string,
): ScoreState | null {
  const value = record[key];
  if (!isRecord(value) || !Array.isArray(value.entries)) {
    return null;
  }

  try {
    return value.entries.reduce<ScoreState>((state, entry) => {
      if (
        !isRecord(entry) ||
        typeof entry.id !== "string" ||
        typeof entry.label !== "string" ||
        typeof entry.points !== "number"
      ) {
        throw new TypeError("Invalid score entry.");
      }
      return recordScore(state, {
        id: entry.id,
        label: entry.label,
        points: entry.points,
      });
    }, createScoreState());
  } catch {
    return null;
  }
}
