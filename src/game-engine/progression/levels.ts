export interface PlayerLevel {
  readonly title: string;
  readonly minimumPoints: number;
}

/** Player levels from the product spec, ordered by the points needed to reach them. */
export const PLAYER_LEVELS: readonly PlayerLevel[] = Object.freeze([
  { title: "Physics Explorer", minimumPoints: 0 },
  { title: "Experimenter", minimumPoints: 100 },
  { title: "Junior Scientist", minimumPoints: 300 },
  { title: "Physics Engineer", minimumPoints: 600 },
  { title: "Master Physicist", minimumPoints: 900 },
  { title: "Research Scientist", minimumPoints: 1200 },
]);

/** Each saved experiment is worth this many points, up to the cap below. */
export const EXPERIMENT_POINTS = 10;
export const MAX_EXPERIMENT_POINTS = 100;

export interface LevelStatus {
  readonly points: number;
  readonly level: PlayerLevel;
  readonly levelNumber: number;
  /** Next level, or null at the top. */
  readonly nextLevel: PlayerLevel | null;
  /** Fraction (0–1) of the way from this level to the next. */
  readonly progressToNext: number;
}

/** Learning points: best score per completed game plus a small bonus for saved experiments. */
export function calculateLearningPoints(
  totalBestScore: number,
  savedExperimentCount: number,
): number {
  if (!Number.isFinite(totalBestScore) || totalBestScore < 0) {
    throw new RangeError("totalBestScore must be a non-negative number.");
  }
  if (!Number.isInteger(savedExperimentCount) || savedExperimentCount < 0) {
    throw new RangeError("savedExperimentCount must be a non-negative integer.");
  }
  return (
    totalBestScore +
    Math.min(MAX_EXPERIMENT_POINTS, savedExperimentCount * EXPERIMENT_POINTS)
  );
}

export function getLevelStatus(points: number): LevelStatus {
  if (!Number.isFinite(points) || points < 0) {
    throw new RangeError("points must be a non-negative number.");
  }

  let index = 0;
  PLAYER_LEVELS.forEach((level, levelIndex) => {
    if (points >= level.minimumPoints) {
      index = levelIndex;
    }
  });
  const level = PLAYER_LEVELS[index] as PlayerLevel;
  const nextLevel = PLAYER_LEVELS[index + 1] ?? null;

  return {
    points,
    level,
    levelNumber: index + 1,
    nextLevel,
    progressToNext: nextLevel
      ? (points - level.minimumPoints) /
        (nextLevel.minimumPoints - level.minimumPoints)
      : 1,
  };
}
