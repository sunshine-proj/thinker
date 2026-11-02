export const STANDARD_ACCURACY_POINTS = 60;
export const STANDARD_PREDICTION_POINTS = 20;
/** Bonus for reasoning it out: 20 on the first attempt, 10 on the second, then none. */
export const STANDARD_ATTEMPT_BONUS = [20, 10] as const;
/** A prediction this close (as a fraction of the true value) earns partial credit; exact earns full. */
export const PREDICTION_CREDIT_WINDOW_FRACTION = 0.25;

export interface StandardScoreInput {
  readonly success: boolean;
  /** 0 at the edge of the tolerance, 1 for an exact answer. */
  readonly accuracyFraction: number;
  /** What the learner predicted, or null when the game asks for no prediction. */
  readonly predicted: number | null;
  /** The value the model computed for that prediction. */
  readonly predictionActual: number | null;
  readonly attemptNumber: number;
}

export interface StandardScore {
  readonly accuracyPoints: number;
  readonly predictionPoints: number;
  readonly attemptPoints: number;
  readonly score: number;
}

/**
 * Scores an attempt out of 100: accuracy, prediction quality and attempt count.
 * Speed never counts. Games without a prediction give its 20 points to accuracy.
 * Nothing is awarded unless the attempt succeeds.
 */
export function scoreStandardAttempt(input: StandardScoreInput): StandardScore {
  if (!Number.isInteger(input.attemptNumber) || input.attemptNumber < 1) {
    throw new RangeError("attemptNumber must be a positive integer.");
  }
  if (!input.success) {
    return { accuracyPoints: 0, predictionPoints: 0, attemptPoints: 0, score: 0 };
  }

  const hasPrediction = input.predicted !== null && input.predictionActual !== null;
  const accuracyMaximum = hasPrediction
    ? STANDARD_ACCURACY_POINTS
    : STANDARD_ACCURACY_POINTS + STANDARD_PREDICTION_POINTS;
  const accuracyPoints = Math.round(
    accuracyMaximum * Math.min(1, Math.max(0, input.accuracyFraction)),
  );

  let predictionPoints = 0;
  if (hasPrediction) {
    const actual = input.predictionActual as number;
    const error = Math.abs((input.predicted as number) - actual);
    const window = PREDICTION_CREDIT_WINDOW_FRACTION * Math.abs(actual);
    predictionPoints =
      window === 0
        ? error === 0
          ? STANDARD_PREDICTION_POINTS
          : 0
        : Math.round(
            STANDARD_PREDICTION_POINTS * Math.max(0, 1 - error / window),
          );
  }

  const attemptPoints = STANDARD_ATTEMPT_BONUS[input.attemptNumber - 1] ?? 0;
  return {
    accuracyPoints,
    predictionPoints,
    attemptPoints,
    score: accuracyPoints + predictionPoints + attemptPoints,
  };
}
