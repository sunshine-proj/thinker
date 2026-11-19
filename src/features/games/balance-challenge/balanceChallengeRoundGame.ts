import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, RoundGameDefinition, RoundGameMeta } from "../../../game-engine/rounds/types";
import { BALANCE_CHALLENGE_GAME, BALANCE_CHALLENGE_ROUNDS, type BalanceRound } from "./balanceChallengeData";
import { evaluateBalanceAttempt, getControlRange, solveRound, type BalanceAttemptResult } from "./balanceChallengeModel";
import { getInitialControlValue } from "./BalancePlot";

export interface BalanceOutcome extends AttemptOutcome {
  readonly result: BalanceAttemptResult;
  readonly controlValue: number;
}

export const BALANCE_META: RoundGameMeta = {
  id: BALANCE_CHALLENGE_GAME.id,
  title: BALANCE_CHALLENGE_GAME.title,
  eyebrow: "MECHANICS · TORQUE AND EQUILIBRIUM",
  modelTag: "STATIC EQUILIBRIUM",
  introduction: BALANCE_CHALLENGE_GAME.introduction,
  instructions: BALANCE_CHALLENGE_GAME.instructions,
  formula: BALANCE_CHALLENGE_GAME.formula,
  formulaCaption: "τ = m g d is the torque of a mass m at distance d from the pivot; g = 9.81 m/s² cancels from both sides, so balance depends on mass × distance.",
  explanation: BALANCE_CHALLENGE_GAME.explanation,
  assumptions: BALANCE_CHALLENGE_GAME.assumptions,
  learningObjectives: BALANCE_CHALLENGE_GAME.learningObjectives,
  objective: { title: "Balance every lever", description: "Release each lever and have it settle level.", unit: "levers" },
  controlsHeading: "Balance the lever",
  submitLabel: "Release lever",
  solvedLabel: "Balanced!",
  nextLabel: "Next lever",
};

/** Balance Challenge on the shared round framework (ROADMAP task 129). */
export const balanceChallenge: RoundGameDefinition<BalanceRound, number, BalanceOutcome> = {
  meta: BALANCE_META,
  rounds: BALANCE_CHALLENGE_ROUNDS,
  createControl: getInitialControlValue,
  parseControl: (raw, round) => {
    const { minimum, maximum } = getControlRange(round);
    if (typeof raw === "number") {
      return raw >= minimum && raw <= maximum ? raw : null;
    }
    return isRecord(raw) ? readNumber(raw, "value", minimum, maximum) : null;
  },
  prediction: (round) =>
    round.control.kind === "position"
      ? { label: "Your position prediction", unit: "m", placeholder: "e.g. 3.5", step: 0.1 }
      : { label: "Your mass prediction", unit: "kg", placeholder: "e.g. 3.5", step: 0.1 },
  evaluate: (round, controlValue, predicted, attemptNumber) => {
    const { minimum, maximum } = getControlRange(round);
    if (!(controlValue >= minimum - 1e-9 && controlValue <= maximum + 1e-9)) {
      throw new RangeError(`The control must be between ${minimum} and ${maximum}.`);
    }
    const result = evaluateBalanceAttempt(round, controlValue, predicted ?? 0, attemptNumber);
    const side = result.state === "clockwise" ? "down on the right" : "down on the left";
    return {
      result,
      controlValue,
      success: result.balanced,
      accuracyFraction: result.balanced ? Math.max(0, 1 - Math.abs(result.netTorqueNewtonMeters) / result.toleranceNewtonMeters) : 0,
      predictionActual: solveRound(round),
      feedback: result.balanced
        ? `The torques cancel to within ${result.toleranceNewtonMeters.toFixed(1)} N·m, and the pivot carries ${result.supportForceNewtons.toFixed(1)} N.`
        : `The lever tips ${side}: the net torque is ${Math.abs(result.netTorqueNewtonMeters).toFixed(1)} N·m ${result.state === "clockwise" ? "clockwise" : "counter-clockwise"}. Adjust your mass and try again.`,
    };
  },
};
