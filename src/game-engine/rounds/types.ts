import type { GameDifficulty } from "../../types/progress";

export interface RoundGameMeta {
  readonly id: string;
  readonly title: string;
  /** Small heading above the title, e.g. "MECHANICS · CONSTRUCTION". */
  readonly eyebrow: string;
  readonly modelTag: string;
  readonly introduction: string;
  readonly instructions: string;
  readonly formula: string;
  readonly formulaCaption: string;
  readonly explanation: string;
  /** Simplifications of the physical model, stated for the learner. */
  readonly assumptions: string;
  readonly learningObjectives: readonly string[];
  readonly objective: {
    readonly title: string;
    readonly description: string;
    readonly unit: string;
  };
  readonly controlsHeading: string;
  readonly submitLabel: string;
  readonly solvedLabel: string;
  readonly nextLabel: string;
}

export interface RoundBase {
  readonly id: string;
  readonly title: string;
  readonly difficulty: GameDifficulty;
  readonly situation: string;
  readonly hint: string;
}

export interface PredictionSpec {
  readonly label: string;
  readonly unit: string;
  readonly placeholder: string;
  readonly step: number;
}

/** What a game's physics reports after the learner commits to a setting. */
export interface AttemptOutcome {
  readonly success: boolean;
  /** 0 at the edge of the tolerance, 1 for an exact answer; used only on success. */
  readonly accuracyFraction: number;
  /** The quantity the learner predicted, as computed by the model; null if none was asked. */
  readonly predictionActual: number | null;
  /** Plain-language explanation of what happened and why. */
  readonly feedback: string;
}

export interface RoundGameDefinition<
  Round extends RoundBase,
  Control,
  Outcome extends AttemptOutcome,
> {
  readonly meta: RoundGameMeta;
  readonly rounds: readonly Round[];
  /** Initial, JSON-serializable control state for a round. */
  createControl(round: Round): Control;
  /** Validates stored control state; returns null for corrupt or outdated data. */
  parseControl(raw: unknown, round: Round): Control | null;
  /** Null when the round asks for no prediction. */
  prediction(round: Round): PredictionSpec | null;
  /** Runs the physics. May throw RangeError for an invalid setting. */
  evaluate(
    round: Round,
    control: Control,
    predicted: number | null,
    attemptNumber: number,
  ): Outcome;
}
