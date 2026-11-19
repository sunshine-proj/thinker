import type { AttemptOutcome, RoundGameDefinition, RoundGameMeta } from "../../../game-engine/rounds/types";
import { CIRCUIT_BUILDER_GAME, CIRCUIT_BUILDER_ROUNDS, MAX_RESISTORS_PER_STAGE, MAX_STAGES, type CircuitRound } from "./circuitBuilderData";
import { evaluateCircuitAttempt, type CircuitAttemptResult, type CircuitLayout } from "./circuitBuilderModel";

/** The player's board: stages may be empty while editing; one stage is selected for new resistors. */
export interface CircuitControl {
  readonly layout: readonly (readonly number[])[];
  readonly selectedStage: number;
}

export interface CircuitOutcomeRecord extends AttemptOutcome {
  readonly result: CircuitAttemptResult;
}

export const CIRCUIT_META: RoundGameMeta = {
  id: CIRCUIT_BUILDER_GAME.id,
  title: CIRCUIT_BUILDER_GAME.title,
  eyebrow: "ELECTRICITY & MAGNETISM · CIRCUITS",
  modelTag: "DC CIRCUITS · OHM'S LAW",
  introduction: CIRCUIT_BUILDER_GAME.introduction,
  instructions: CIRCUIT_BUILDER_GAME.instructions,
  formula: CIRCUIT_BUILDER_GAME.formula,
  formulaCaption: "V is the battery voltage, I the current (A), R the resistance (Ω): series resistances add, and for parallel branches 1/R = 1/R₁ + 1/R₂. P = V I is the power each resistor turns into heat.",
  explanation: CIRCUIT_BUILDER_GAME.explanation,
  assumptions: CIRCUIT_BUILDER_GAME.assumptions,
  learningObjectives: CIRCUIT_BUILDER_GAME.learningObjectives,
  objective: { title: "Build every circuit", description: "Match each target without overheating a resistor.", unit: "circuits" },
  controlsHeading: "Build and test",
  submitLabel: "Close switch",
  solvedLabel: "Circuit complete!",
  nextLabel: "Next circuit",
};

export function solvedLayout(control: CircuitControl): CircuitLayout {
  return control.layout.filter((stage) => stage.length > 0);
}

export function parseCircuitControl(raw: unknown, round: CircuitRound): CircuitControl | null {
  const record = raw as { layout?: unknown; selectedStage?: unknown } | null;
  const layout = record?.layout;
  if (!Array.isArray(layout) || layout.length > MAX_STAGES) {
    return null;
  }
  const used = new Set<number>();
  for (const stage of layout) {
    if (!Array.isArray(stage) || stage.length > MAX_RESISTORS_PER_STAGE) {
      return null;
    }
    for (const index of stage) {
      if (!Number.isInteger(index) || index < 0 || index >= round.inventoryOhms.length || used.has(index)) {
        return null;
      }
      used.add(index);
    }
  }
  const selected = typeof record?.selectedStage === "number" ? record.selectedStage : 0;
  return { layout: layout as number[][], selectedStage: Math.min(Math.max(0, selected), Math.max(0, layout.length - 1)) };
}

function describe(result: CircuitAttemptResult, round: CircuitRound): string {
  const ohms = (value: number) => `${Number(value.toFixed(1))} Ω`;
  switch (result.outcome) {
    case "success":
      return `The equivalent resistance is ${ohms(result.solution.equivalentResistanceOhms)}, drawing ${(result.solution.totalCurrentAmperes * 1000).toFixed(1)} mA with every resistor within its ${round.powerRatingWatts} W rating.`;
    case "overloaded":
      return `Overheated! ${result.overloadedResistors.length === 1 ? "A resistor" : `${result.overloadedResistors.length} resistors`} dissipated more than the ${round.powerRatingWatts} W rating (P = V × I). Spread the voltage across more resistors.`;
    case "off-target":
      return `The circuit has ${ohms(result.solution.equivalentResistanceOhms)} but the target is ${ohms(result.targetResistanceOhms)} (${(result.resistanceError * 100).toFixed(1)}% off). Rearrange the resistors and try again.`;
  }
}

/** Circuit Builder on the shared round framework (ROADMAP task 129). */
export const circuitBuilder: RoundGameDefinition<CircuitRound, CircuitControl, CircuitOutcomeRecord> = {
  meta: CIRCUIT_META,
  rounds: CIRCUIT_BUILDER_ROUNDS,
  createControl: () => ({ layout: [], selectedStage: 0 }),
  parseControl: parseCircuitControl,
  prediction: () => ({ label: "Your current prediction", unit: "mA", placeholder: "e.g. 30", step: 0.1 }),
  evaluate: (round, control, predicted, attemptNumber) => {
    const layout = solvedLayout(control);
    if (layout.length === 0) {
      throw new RangeError("Add at least one resistor before closing the switch.");
    }
    const result = evaluateCircuitAttempt(round, layout, (predicted ?? 0) / 1000, attemptNumber);
    return {
      result,
      success: result.outcome === "success",
      accuracyFraction: result.outcome === "success" ? Math.max(0, 1 - result.resistanceError / round.toleranceFraction) : 0,
      predictionActual: result.solution.totalCurrentAmperes * 1000,
      feedback: describe(result, round),
      ...(result.outcome === "overloaded"
        ? { catastrophe: { title: "A resistor burned out", explanation: `${result.overloadedResistors.length === 1 ? "One resistor" : `${result.overloadedResistors.length} resistors`} turned more than ${round.powerRatingWatts} W into heat (P = V²/R) and burned out. Put resistors in series so each takes a smaller share of the voltage.` } }
        : {}),
    };
  },
};
