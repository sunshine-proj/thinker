import {
  STANDARD_GRAVITY,
  Vector2,
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
} from "../../../physics/core";

export interface ProjectileLaunchParameters {
  /** Launch speed in meters per second. */
  readonly speedMetersPerSecond: number;
  /** Launch angle measured above horizontal, in degrees. */
  readonly angleDegrees: number;
  /** Constant downward gravitational acceleration, in meters per second squared. */
  readonly gravityMetersPerSecondSquared?: number;
  /** Launch height above the landing surface, in meters. */
  readonly launchHeightMeters?: number;
}

export interface ProjectileTrajectory {
  readonly points: readonly Vector2[];
  readonly initialVelocityMetersPerSecond: Vector2;
  readonly flightTimeSeconds: number;
  readonly horizontalRangeMeters: number;
  readonly maximumHeightMeters: number;
}

export interface ProjectileShotResult {
  readonly hit: boolean;
  readonly missDistanceMeters: number;
  readonly accuracyPoints: number;
  readonly predictionPoints: number;
  readonly score: number;
}

const DEFAULT_SAMPLE_INTERVALS = 100;
const MAX_SAMPLE_INTERVALS = 2_000;
const ACCURACY_SCORE_POINTS = 80;
const PREDICTION_SCORE_POINTS = 20;
const FULL_PREDICTION_CREDIT_ERROR_METERS = 5;

/**
 * Calculates an ideal two-dimensional projectile trajectory in SI units.
 *
 * Assumptions: uniform gravity, no air resistance, and a level landing surface.
 */
export function calculateProjectileTrajectory(
  parameters: ProjectileLaunchParameters,
  sampleIntervals = DEFAULT_SAMPLE_INTERVALS,
): ProjectileTrajectory {
  assertPositive(parameters.speedMetersPerSecond, "speedMetersPerSecond");
  assertFiniteNumber(parameters.angleDegrees, "angleDegrees");

  if (parameters.angleDegrees < 0 || parameters.angleDegrees > 90) {
    throw new RangeError("angleDegrees must be between 0 and 90.");
  }

  const gravity = parameters.gravityMetersPerSecondSquared ?? STANDARD_GRAVITY;
  const launchHeight = parameters.launchHeightMeters ?? 0;
  assertPositive(gravity, "gravityMetersPerSecondSquared");
  assertNonNegative(launchHeight, "launchHeightMeters");

  if (
    !Number.isInteger(sampleIntervals) ||
    sampleIntervals < 2 ||
    sampleIntervals > MAX_SAMPLE_INTERVALS
  ) {
    throw new RangeError(
      `sampleIntervals must be an integer between 2 and ${MAX_SAMPLE_INTERVALS}.`,
    );
  }

  const angleRadians = (parameters.angleDegrees * Math.PI) / 180;
  const initialVelocityMetersPerSecond = new Vector2(
    parameters.speedMetersPerSecond * Math.cos(angleRadians),
    parameters.speedMetersPerSecond * Math.sin(angleRadians),
  );
  const verticalSpeed = initialVelocityMetersPerSecond.y;
  const flightTimeSeconds =
    (verticalSpeed +
      Math.sqrt(verticalSpeed ** 2 + 2 * gravity * launchHeight)) /
    gravity;

  if (!Number.isFinite(flightTimeSeconds) || flightTimeSeconds <= 0) {
    throw new RangeError(
      "The launch must produce a positive flight time before reaching the landing surface.",
    );
  }

  const horizontalRangeMeters =
    initialVelocityMetersPerSecond.x * flightTimeSeconds;
  const maximumHeightMeters =
    launchHeight + verticalSpeed ** 2 / (2 * gravity);
  const points = Array.from({ length: sampleIntervals + 1 }, (_, index) => {
    const timeSeconds = (flightTimeSeconds * index) / sampleIntervals;
    const heightMeters =
      launchHeight +
      verticalSpeed * timeSeconds -
      0.5 * gravity * timeSeconds ** 2;

    return new Vector2(
      initialVelocityMetersPerSecond.x * timeSeconds,
      index === sampleIntervals ? 0 : Math.max(0, heightMeters),
    );
  });

  return {
    points,
    initialVelocityMetersPerSecond,
    flightTimeSeconds,
    horizontalRangeMeters,
    maximumHeightMeters,
  };
}

export function scoreProjectileShot(
  trajectory: ProjectileTrajectory,
  targetDistanceMeters: number,
  targetRadiusMeters: number,
  predictedRangeMeters: number,
): ProjectileShotResult {
  assertPositive(targetDistanceMeters, "targetDistanceMeters");
  assertPositive(targetRadiusMeters, "targetRadiusMeters");
  assertNonNegative(predictedRangeMeters, "predictedRangeMeters");

  const missDistanceMeters = Math.abs(
    trajectory.horizontalRangeMeters - targetDistanceMeters,
  );
  const hit = missDistanceMeters <= targetRadiusMeters;

  if (!hit) {
    return {
      hit,
      missDistanceMeters,
      accuracyPoints: 0,
      predictionPoints: 0,
      score: 0,
    };
  }

  const accuracyPoints = Math.round(
    ACCURACY_SCORE_POINTS *
      Math.max(0, 1 - missDistanceMeters / targetRadiusMeters),
  );
  const predictionErrorMeters = Math.abs(
    predictedRangeMeters - trajectory.horizontalRangeMeters,
  );
  const predictionPoints = Math.round(
    PREDICTION_SCORE_POINTS *
      Math.max(
        0,
        1 - predictionErrorMeters / FULL_PREDICTION_CREDIT_ERROR_METERS,
      ),
  );

  return {
    hit,
    missDistanceMeters,
    accuracyPoints,
    predictionPoints,
    score: accuracyPoints + predictionPoints,
  };
}
