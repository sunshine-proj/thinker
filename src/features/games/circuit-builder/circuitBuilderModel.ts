import { assertNonNegative } from "../../../physics/core";
import {
  solveSeriesParallelCircuit,
  type CircuitSolution,
} from "../../../physics/electromagnetism";
import {
  MAX_RESISTORS_PER_STAGE,
  MAX_STAGES,
  type CircuitRound,
} from "./circuitBuilderData";

/** Stages of resistors, each resistor given as an index into the round's inventory. */
export type CircuitLayout = readonly (readonly number[])[];

export type CircuitOutcome = "success" | "off-target" | "overloaded";

export interface CircuitAttemptResult {
  readonly outcome: CircuitOutcome;
  readonly solution: CircuitSolution;
  readonly targetResistanceOhms: number;
  /** Relative error of the equivalent resistance versus the target. */
  readonly resistanceError: number;
  /** Inventory indexes of resistors dissipating more than their rating. */
  readonly overloadedResistors: readonly number[];
  readonly accuracyPoints: number;
  readonly predictionPoints: number;
  readonly attemptPoints: number;
  readonly score: number;
}

export const ACCURACY_SCORE_POINTS = 60;
export const PREDICTION_SCORE_POINTS = 20;
export const ATTEMPT_BONUS_POINTS = [20, 10] as const;
const PREDICTION_CREDIT_WINDOW_FRACTION = 0.25;
/** Relative slack so a resistor running exactly at its rating does not fail on round-off. */
const RATING_TOLERANCE = 1e-9;

export function getTargetResistanceOhms(round: CircuitRound): number {
  return round.target.kind === "resistance"
    ? round.target.ohms
    : round.sourceVoltageVolts / round.target.amperes;
}

export function describeTarget(round: CircuitRound): string {
  return round.target.kind === "current"
    ? `${round.target.amperes * 1000} mA from a ${round.sourceVoltageVolts} V battery`
    : `${round.target.ohms} Ω equivalent resistance`;
}

/** Checks that a layout only uses inventory resistors, each at most once, in non-empty stages. */
export function validateLayout(
  round: CircuitRound,
  layout: CircuitLayout,
): void {
  if (layout.length === 0 || layout.every((stage) => stage.length === 0)) {
    throw new RangeError("Add at least one resistor to the circuit.");
  }
  if (layout.some((stage) => stage.length === 0)) {
    throw new RangeError("Every stage needs at least one resistor; remove empty stages.");
  }
  if (layout.length > MAX_STAGES) {
    throw new RangeError(`A circuit can have at most ${MAX_STAGES} stages.`);
  }

  const used = new Set<number>();
  for (const stage of layout) {
    if (stage.length > MAX_RESISTORS_PER_STAGE) {
      throw new RangeError(
        `A stage can hold at most ${MAX_RESISTORS_PER_STAGE} resistors.`,
      );
    }
    for (const index of stage) {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= round.inventoryOhms.length
      ) {
        throw new RangeError("The circuit uses a resistor that is not in the box.");
      }
      if (used.has(index)) {
        throw new RangeError("Each resistor in the box can be used only once.");
      }
      used.add(index);
    }
  }
}

export function solveLayout(
  round: CircuitRound,
  layout: CircuitLayout,
): CircuitSolution {
  validateLayout(round, layout);
  return solveSeriesParallelCircuit(
    round.sourceVoltageVolts,
    layout.map((stage) =>
      stage.map((index) => round.inventoryOhms[index] as number),
    ),
  );
}

/**
 * Closes the switch on the player's layout and scores it. Points are awarded
 * only when the equivalent resistance matches the target within tolerance and
 * no resistor exceeds its power rating.
 */
export function evaluateCircuitAttempt(
  round: CircuitRound,
  layout: CircuitLayout,
  predictedCurrentAmperes: number,
  attemptNumber: number,
): CircuitAttemptResult {
  assertNonNegative(predictedCurrentAmperes, "predictedCurrentAmperes");
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    throw new RangeError("attemptNumber must be a positive integer.");
  }

  const solution = solveLayout(round, layout);
  const targetResistanceOhms = getTargetResistanceOhms(round);
  const resistanceError =
    Math.abs(solution.equivalentResistanceOhms - targetResistanceOhms) /
    targetResistanceOhms;

  const flatIndexes = layout.flat();
  const overloadedResistors = solution.resistors.flatMap((reading, position) =>
    reading.powerWatts > round.powerRatingWatts * (1 + RATING_TOLERANCE)
      ? [flatIndexes[position] as number]
      : [],
  );

  const outcome: CircuitOutcome =
    overloadedResistors.length > 0
      ? "overloaded"
      : resistanceError <= round.toleranceFraction
        ? "success"
        : "off-target";

  if (outcome !== "success") {
    return {
      outcome,
      solution,
      targetResistanceOhms,
      resistanceError,
      overloadedResistors,
      accuracyPoints: 0,
      predictionPoints: 0,
      attemptPoints: 0,
      score: 0,
    };
  }

  const accuracyPoints = Math.round(
    ACCURACY_SCORE_POINTS *
      Math.max(0, 1 - resistanceError / round.toleranceFraction),
  );
  const predictionPoints = Math.round(
    PREDICTION_SCORE_POINTS *
      Math.max(
        0,
        1 -
          Math.abs(predictedCurrentAmperes - solution.totalCurrentAmperes) /
            (PREDICTION_CREDIT_WINDOW_FRACTION * solution.totalCurrentAmperes),
      ),
  );
  const attemptPoints = ATTEMPT_BONUS_POINTS[attemptNumber - 1] ?? 0;

  return {
    outcome,
    solution,
    targetResistanceOhms,
    resistanceError,
    overloadedResistors,
    accuracyPoints,
    predictionPoints,
    attemptPoints,
    score: accuracyPoints + predictionPoints + attemptPoints,
  };
}

/** Layout operations kept pure so the page and tests share them. */
export function addResistorToStage(
  layout: CircuitLayout,
  stageIndex: number,
  inventoryIndex: number,
): CircuitLayout {
  if (stageIndex < 0 || stageIndex >= layout.length) {
    throw new RangeError("That stage does not exist.");
  }
  return layout.map((stage, index) =>
    index === stageIndex ? [...stage, inventoryIndex] : stage,
  );
}

export function removeResistor(
  layout: CircuitLayout,
  inventoryIndex: number,
): CircuitLayout {
  return layout
    .map((stage) => stage.filter((index) => index !== inventoryIndex))
    .filter((stage) => stage.length > 0);
}
