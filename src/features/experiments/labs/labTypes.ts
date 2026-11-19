import type { ChartSeries } from "../../../components/common";
import type { ExperimentMeasurement } from "../../../simulation/measurements";
import type { ResultExplanation } from "../electronExperiment";

export interface LabNumberControl {
  readonly kind: "number";
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
  readonly initial: number;
  /** Controls that do not apply to the current setup are hidden. */
  readonly visibleWhen?: (values: LabValues) => boolean;
}

export interface LabChoiceControl {
  readonly kind: "choice";
  readonly key: string;
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly initial: string;
  readonly visibleWhen?: (values: LabValues) => boolean;
}

export type LabControl = LabNumberControl | LabChoiceControl;
export type LabValues = Readonly<Record<string, number | string>>;

export interface LabChart {
  readonly title: string;
  readonly description: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly series: readonly ChartSeries[];
  readonly xDomain?: readonly [number, number];
  readonly yDomain?: readonly [number, number];
}

export interface LabResult {
  readonly measurements: readonly ExperimentMeasurement[];
  readonly charts: readonly LabChart[];
  readonly explanations: readonly ResultExplanation[];
}

/** Before the first run the learner predicts one measurement (SKILLS §7, AGENTS §8). */
export interface LabPrediction {
  readonly prompt: string;
  /** The measurement to predict; may depend on the setup, for example wire or solenoid. */
  readonly measurementId: string | ((values: LabValues) => string);
  /** Relative error (fraction) within which the prediction counts as confirmed. Defaults to 0.1. */
  readonly tolerance?: number;
}

/** Beginner and advanced presentations of the same lab (PRD §7). */
export interface LabModes {
  /** Control keys hidden in beginner mode; they keep their current values. */
  readonly advancedControls: readonly string[];
  /** Guided steps shown in beginner mode. */
  readonly beginnerSteps: readonly string[];
}

export interface LabDefinition {
  /** Matches the catalog entry id; saved runs are filed under it. */
  readonly id: string;
  readonly name: string;
  readonly eyebrow: string;
  readonly introduction: string;
  /** Simplifications of the model, shown to the learner. */
  readonly assumptions: string;
  readonly controls: readonly LabControl[];
  run(values: LabValues): LabResult;
  describe(values: LabValues): string;
  readonly prediction: LabPrediction;
  readonly modes: LabModes;
}

export function predictionMeasurementId(definition: LabDefinition, values: LabValues): string {
  const { measurementId } = definition.prediction;
  return typeof measurementId === "function" ? measurementId(values) : measurementId;
}

/** Whether a predicted value is within the lab's tolerance of the measured one. */
export function isPredictionConfirmed(predicted: number, measured: number, tolerance = 0.1): boolean {
  if (!Number.isFinite(predicted) || !Number.isFinite(measured)) {
    return false;
  }
  if (measured === 0) {
    return Math.abs(predicted) <= tolerance;
  }
  return Math.abs(predicted - measured) / Math.abs(measured) <= tolerance;
}

export function defaultLabValues(definition: LabDefinition): Record<string, number | string> {
  return Object.fromEntries(definition.controls.map((control) => [control.key, control.initial]));
}

/** Rebuilds values from stored data; returns null for anything missing or out of range. */
export function parseLabValues(definition: LabDefinition, raw: unknown): Record<string, number | string> | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const data = raw as Record<string, unknown>;
  const values: Record<string, number | string> = {};
  for (const control of definition.controls) {
    const value = data[control.key];
    if (control.kind === "number") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < control.minimum || value > control.maximum) {
        return null;
      }
      values[control.key] = value;
    } else {
      if (typeof value !== "string" || !control.options.some((option) => option.value === value)) {
        return null;
      }
      values[control.key] = value;
    }
  }
  return values;
}
