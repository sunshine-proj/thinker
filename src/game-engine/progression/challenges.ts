import type { GameResult, SavedExperiment } from "../../types/progress";
import { getBestScore } from "./achievements";

export type ChallengeRequirement =
  | { readonly kind: "game-score"; readonly gameId: string; readonly minimumScore: number }
  | { readonly kind: "any-game" }
  | { readonly kind: "saved-experiments"; readonly count: number };

export interface ChallengeDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly requirement: ChallengeRequirement;
  /** Path of the activity that helps complete the challenge. */
  readonly path: string;
}

export interface ChallengeContext {
  readonly results: readonly GameResult[];
  readonly experiments: readonly SavedExperiment[];
}

/** Local calendar day as YYYY-MM-DD, so "today" follows the learner's clock. */
export function toLocalDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isOnDay(isoTimestamp: string, dateKey: string): boolean {
  return toLocalDateKey(new Date(isoTimestamp)) === dateKey;
}

/** True when the requirement is met by everything the learner has ever done. */
export function isChallengeComplete(
  challenge: ChallengeDefinition,
  context: ChallengeContext,
): boolean {
  const { requirement } = challenge;
  switch (requirement.kind) {
    case "game-score":
      return (
        getBestScore(context.results, requirement.gameId) >=
        requirement.minimumScore
      );
    case "any-game":
      return context.results.some(
        (result) => result.completionStatus === "completed",
      );
    case "saved-experiments":
      return context.experiments.length >= requirement.count;
  }
}

/** True when the requirement was met by something done on the given local day. */
export function isChallengeCompleteOnDay(
  challenge: ChallengeDefinition,
  context: ChallengeContext,
  dateKey: string,
): boolean {
  const { requirement } = challenge;
  switch (requirement.kind) {
    case "game-score":
      return context.results.some(
        (result) =>
          result.gameId === requirement.gameId &&
          result.completionStatus === "completed" &&
          result.score >= requirement.minimumScore &&
          isOnDay(result.completedAt, dateKey),
      );
    case "any-game":
      return context.results.some(
        (result) =>
          result.completionStatus === "completed" &&
          isOnDay(result.completedAt, dateKey),
      );
    case "saved-experiments":
      return (
        context.experiments.filter((experiment) =>
          isOnDay(experiment.createdAt, dateKey),
        ).length >= requirement.count
      );
  }
}

/** Picks the same challenge for everyone on a given local day, rotating through the list. */
export function selectDailyChallenge(
  challenges: readonly ChallengeDefinition[],
  date: Date,
): ChallengeDefinition {
  if (challenges.length === 0) {
    throw new RangeError("At least one challenge is required.");
  }
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return challenges[dayNumber % challenges.length] as ChallengeDefinition;
}
