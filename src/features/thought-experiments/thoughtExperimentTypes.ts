import type { ChartSeries } from "../../components/common";

/**
 * How certain a statement is (SKILLS §10). Every statement shown in a thought
 * experiment carries one of these labels so hypotheses are never presented as facts.
 */
export type StatementKind = "established" | "prediction" | "assumption" | "speculation";

export const STATEMENT_LABELS: Readonly<Record<StatementKind, string>> = Object.freeze({
  established: "Established science",
  prediction: "Mathematical prediction",
  assumption: "Simplified assumption",
  speculation: "Speculation",
});

export interface Statement {
  readonly kind: StatementKind;
  readonly text: string;
}

export interface PredictionOption {
  readonly id: string;
  readonly label: string;
}

export interface PredictionQuestion {
  /** Unique within the thought experiment; also the stored prediction's question id. */
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly PredictionOption[];
  /** The option the model's result supports. */
  readonly answerId: string;
}

export interface ThoughtParameter {
  readonly label: string;
  readonly unit: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
  readonly initial: number;
  /** Optional display transform, for example a logarithmic slider. */
  readonly format?: (value: number) => string;
}

export interface ThoughtRow {
  readonly label: string;
  readonly value: string;
}

export interface ThoughtChart {
  readonly title: string;
  readonly description: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly series: readonly ChartSeries[];
  readonly xDomain?: readonly [number, number];
  readonly yDomain?: readonly [number, number];
}

export interface ThoughtResult {
  readonly rows: readonly ThoughtRow[];
  readonly chart?: ThoughtChart;
  /** One-sentence summary of what the numbers show at this setting. */
  readonly summary: string;
}

export interface ThoughtExperiment {
  readonly id: string;
  readonly title: string;
  /** Physics world the scenario belongs to (matches a catalog world id). */
  readonly worldId: string;
  readonly summary: string;
  readonly scenario: string;
  /** What the scenario takes as given, each labeled by certainty. */
  readonly statements: readonly Statement[];
  readonly question: PredictionQuestion;
  readonly parameter: ThoughtParameter;
  /** Pure calculation from tested physics modules; `value` is the parameter. */
  run(value: number): ThoughtResult;
  /** Explanation after the result, each paragraph labeled by certainty. */
  readonly explanation: readonly Statement[];
  /** A harder follow-up question (PRD §8 step 7). */
  readonly variation: {
    readonly question: PredictionQuestion;
    readonly explanation: readonly Statement[];
  };
  /** Games and labs that explore the same physics. */
  readonly related: readonly { readonly title: string; readonly path: string }[];
}
