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
