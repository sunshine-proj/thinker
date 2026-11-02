import { solveIceWaterMixture, type MixtureResult } from "../../../physics/thermodynamics";
import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, PredictionSpec, RoundGameDefinition } from "../../../game-engine/rounds/types";
import {
  ICE_MELTING_META,
  ICE_ROUNDS,
  type IceControl,
  type IceRound,
} from "./iceMeltingData";

export interface IceOutcome extends AttemptOutcome {
  readonly mixture: MixtureResult;
  readonly iceRemainingGrams: number;
  readonly inputs: {
    readonly iceMassGrams: number;
    readonly waterTemperatureCelsius: number;
  };
}

/** The ice mass and water temperature the flask actually starts with. */
export function resolveInputs(round: IceRound, control: IceControl) {
  const { control: spec } = round;
  if (control.value < spec.minimum || control.value > spec.maximum) {
    throw new RangeError(`The setting must be between ${spec.minimum} and ${spec.maximum}.`);
  }
  return spec.kind === "iceMassGrams"
    ? { iceMassGrams: control.value, waterTemperatureCelsius: round.waterTemperatureCelsius }
    : { iceMassGrams: round.iceMassGrams, waterTemperatureCelsius: control.value };
}

export function mixFlask(round: IceRound, control: IceControl): { mixture: MixtureResult; inputs: IceOutcome["inputs"] } {
  const inputs = resolveInputs(round, control);
  const mixture = solveIceWaterMixture({
    iceMassKilograms: inputs.iceMassGrams / 1000,
    iceTemperatureCelsius: round.iceTemperatureCelsius,
    waterMassKilograms: round.waterMassKilograms,
    waterTemperatureCelsius: inputs.waterTemperatureCelsius,
  });
  return { mixture, inputs };
}

export function evaluateIce(round: IceRound, control: IceControl): IceOutcome {
  const { mixture, inputs } = mixFlask(round, control);
  const iceRemainingGrams = mixture.iceMassKilograms * 1000;
  const { goal } = round;
  const finalTemperature = mixture.finalTemperatureCelsius;

  let success: boolean;
  let error: number;
  let tolerance: number;
  let feedback: string;
  if (goal.kind === "final-temperature") {
    error = Math.abs(finalTemperature - goal.targetCelsius);
    tolerance = goal.toleranceKelvin;
    success = mixture.phase === "liquid" && error <= tolerance;
    feedback =
      mixture.phase !== "liquid"
        ? `Not all the ice melted: the flask settles at ${finalTemperature.toFixed(1)} °C with ${iceRemainingGrams.toFixed(0)} g of ice left. The water did not hold enough heat.`
        : success
          ? `All the ice melted and the flask settled at ${finalTemperature.toFixed(2)} °C.`
          : `All the ice melted and the flask settled at ${finalTemperature.toFixed(2)} °C, ${error.toFixed(1)} K from the ${goal.targetCelsius} °C target. ${finalTemperature > goal.targetCelsius ? "Too little cooling" : "Too much cooling"}: adjust the setting.`;
  } else {
    error = Math.abs(iceRemainingGrams - goal.targetGrams);
    tolerance = goal.toleranceGrams;
    success = mixture.phase === "ice-and-water" && error <= tolerance;
    feedback =
      mixture.phase === "liquid"
        ? `All the ice melted and the flask reached ${finalTemperature.toFixed(1)} °C: you added too little ice for a slush.`
        : success
          ? `The flask settled at 0 °C with ${iceRemainingGrams.toFixed(0)} g of ice left.`
          : `The flask settled at 0 °C with ${iceRemainingGrams.toFixed(0)} g of ice left, not ${goal.targetGrams} g. ${iceRemainingGrams > goal.targetGrams ? "Too much ice" : "Too little ice"}.`;
  }

  return {
    success,
    accuracyFraction: success ? 1 - error / tolerance : 0,
    predictionActual:
      round.predictionKind === "finalTemperature" ? Math.max(0, finalTemperature) : iceRemainingGrams,
    feedback,
    mixture,
    iceRemainingGrams,
    inputs,
  };
}

const PREDICTION_SPECS: Record<IceRound["predictionKind"], PredictionSpec> = {
  finalTemperature: { label: "Your prediction of the final temperature", unit: "°C", placeholder: "e.g. 12", step: 0.1 },
  iceRemaining: { label: "Your prediction of the ice left over", unit: "g", placeholder: "e.g. 100", step: 1 },
};

export const iceMelting: RoundGameDefinition<IceRound, IceControl, IceOutcome> = {
  meta: ICE_MELTING_META,
  rounds: ICE_ROUNDS,
  createControl: (round) => ({
    value:
      round.control.kind === "iceMassGrams" ? round.iceMassGrams : round.waterTemperatureCelsius,
  }),
  parseControl: (raw, round) => {
    if (!isRecord(raw)) {
      return null;
    }
    const value = readNumber(raw, "value", round.control.minimum, round.control.maximum);
    return value === null ? null : { value };
  },
  prediction: (round) => PREDICTION_SPECS[round.predictionKind],
  evaluate: (round, control) => evaluateIce(round, control),
};
