import {
  assertFiniteNumber,
  assertNonNegative,
} from "../../../physics/core";
import {
  calculateNetTorque,
  calculateSupportForce,
  classifyBalance,
  createUniformBeamLoad,
  solveBalanceMass,
  solveBalancePosition,
  type BalanceState,
  type PointLoad,
} from "../../../physics/mechanics";
import type { BalanceRound } from "./balanceChallengeData";

export interface BalanceAttemptResult {
  readonly balanced: boolean;
  readonly state: BalanceState;
  /** Net torque about the pivot in N·m; positive turns the beam clockwise. */
  readonly netTorqueNewtonMeters: number;
  readonly toleranceNewtonMeters: number;
  readonly supportForceNewtons: number;
  readonly accuracyPoints: number;
  readonly predictionPoints: number;
  readonly attemptPoints: number;
  readonly score: number;
}

export const ACCURACY_SCORE_POINTS = 60;
export const PREDICTION_SCORE_POINTS = 20;
/** Bonus for reasoning it out: 20 on the first release, 10 on the second, then none. */
export const ATTEMPT_BONUS_POINTS = [20, 10] as const;
/** A prediction within this fraction of the exact answer earns partial credit; exact earns full. */
const PREDICTION_CREDIT_WINDOW_FRACTION = 0.25;

export function getControlRange(round: BalanceRound): {
  minimum: number;
  maximum: number;
  step: number;
} {
  const { control } = round;
  return control.kind === "position"
    ? {
        minimum: control.minimumMeters,
        maximum: control.maximumMeters,
        step: control.stepMeters,
      }
    : {
        minimum: control.minimumKilograms,
        maximum: control.maximumKilograms,
        step: control.stepKilograms,
      };
}

/** Load that the player's control adds to the beam for a given control value. */
export function getControlledLoad(
  round: BalanceRound,
  controlValue: number,
): PointLoad {
  assertFiniteNumber(controlValue, "controlValue");
  const { control } = round;
  const { minimum, maximum } = getControlRange(round);

  if (controlValue < minimum || controlValue > maximum) {
    throw new RangeError(
      `The control value must be between ${minimum} and ${maximum}.`,
    );
  }

  return control.kind === "position"
    ? { massKilograms: control.massKilograms, positionMeters: controlValue }
    : { massKilograms: controlValue, positionMeters: control.positionMeters };
}

/** Loads other than the player's, including the beam's own weight at its centre. */
export function getBackgroundLoads(round: BalanceRound): PointLoad[] {
  const loads = [...round.fixedLoads];
  if (round.beamMassKilograms > 0) {
    loads.push(
      createUniformBeamLoad(
        round.beamMassKilograms,
        (round.beamLeftMeters + round.beamRightMeters) / 2,
      ),
    );
  }
  return loads;
}

/** Exact answer in the control's unit (m or kg); null if the round has no solution. */
export function solveRound(round: BalanceRound): number | null {
  const background = getBackgroundLoads(round);
  return round.control.kind === "position"
    ? solveBalancePosition(background, round.control.massKilograms)
    : solveBalanceMass(background, round.control.positionMeters);
}

/** Tolerance in N·m: a fraction of the total torque magnitude of the fixed loads. */
export function getToleranceNewtonMeters(round: BalanceRound): number {
  const scale = round.fixedLoads.reduce(
    (total, load) =>
      total + Math.abs(calculateNetTorque([load])),
    0,
  );
  return scale * round.toleranceFraction;
}

export function getTotalLoads(
  round: BalanceRound,
  controlValue: number,
): PointLoad[] {
  return [...getBackgroundLoads(round), getControlledLoad(round, controlValue)];
}

/**
 * Releases the lever with the player's control setting and scores the outcome.
 * Points are only awarded when the lever balances within tolerance.
 */
export function evaluateBalanceAttempt(
  round: BalanceRound,
  controlValue: number,
  predictedValue: number,
  attemptNumber: number,
): BalanceAttemptResult {
  assertNonNegative(predictedValue, "predictedValue");
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    throw new RangeError("attemptNumber must be a positive integer.");
  }

  const loads = getTotalLoads(round, controlValue);
  const netTorqueNewtonMeters = calculateNetTorque(loads);
  const toleranceNewtonMeters = getToleranceNewtonMeters(round);
  const state = classifyBalance(netTorqueNewtonMeters, toleranceNewtonMeters);
  const supportForceNewtons = calculateSupportForce(loads);
  const balanced = state === "balanced";

  if (!balanced) {
    return {
      balanced,
      state,
      netTorqueNewtonMeters,
      toleranceNewtonMeters,
      supportForceNewtons,
      accuracyPoints: 0,
      predictionPoints: 0,
      attemptPoints: 0,
      score: 0,
    };
  }

  const accuracyPoints = Math.round(
    ACCURACY_SCORE_POINTS *
      Math.max(0, 1 - Math.abs(netTorqueNewtonMeters) / toleranceNewtonMeters),
  );
  const solution = solveRound(round);
  const predictionPoints =
    solution === null || solution === 0
      ? 0
      : Math.round(
          PREDICTION_SCORE_POINTS *
            Math.max(
              0,
              1 -
                Math.abs(predictedValue - solution) /
                  (PREDICTION_CREDIT_WINDOW_FRACTION * Math.abs(solution)),
            ),
        );
  const attemptPoints = ATTEMPT_BONUS_POINTS[attemptNumber - 1] ?? 0;

  return {
    balanced,
    state,
    netTorqueNewtonMeters,
    toleranceNewtonMeters,
    supportForceNewtons,
    accuracyPoints,
    predictionPoints,
    attemptPoints,
    score: accuracyPoints + predictionPoints + attemptPoints,
  };
}

export interface TorqueBreakdown {
  /** Sum of clockwise torques about the pivot, in N·m. */
  readonly clockwiseNewtonMeters: number;
  /** Sum of counter-clockwise torque magnitudes about the pivot, in N·m. */
  readonly counterClockwiseNewtonMeters: number;
}

export function summarizeTorques(
  round: BalanceRound,
  controlValue: number,
): TorqueBreakdown {
  let clockwiseNewtonMeters = 0;
  let counterClockwiseNewtonMeters = 0;

  for (const load of getTotalLoads(round, controlValue)) {
    const torque = calculateNetTorque([load]);
    if (torque > 0) {
      clockwiseNewtonMeters += torque;
    } else {
      counterClockwiseNewtonMeters -= torque;
    }
  }

  return { clockwiseNewtonMeters, counterClockwiseNewtonMeters };
}
