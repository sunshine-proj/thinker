import type { ExperimentMeasurement } from "../../types/progress";

export type { ExperimentMeasurement } from "../../types/progress";

export function createMeasurement(
  id: string,
  label: string,
  value: number | null,
  unit: string,
): ExperimentMeasurement {
  if (!id.trim() || !label.trim()) {
    throw new RangeError("A measurement needs an id and a label.");
  }
  if (value !== null && !Number.isFinite(value)) {
    throw new RangeError(`Measurement "${id}" must be finite or null.`);
  }
  return { id, label, value, unit };
}

/** Compact value with its unit; "—" when the quantity is undefined. */
export function formatMeasurementValue(
  value: number | null,
  unit: string,
): string {
  if (value === null) {
    return "—";
  }
  if (value === 0) {
    return `0 ${unit}`;
  }
  const magnitude = Math.abs(value);
  const formatted =
    magnitude >= 1e3 || magnitude < 1e-2
      ? value.toExponential(2)
      : value.toPrecision(3);
  return `${formatted} ${unit}`;
}

export function formatMeasurement(measurement: ExperimentMeasurement): string {
  return formatMeasurementValue(measurement.value, measurement.unit);
}

export interface MeasurementComparisonRow {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  readonly first: number | null;
  readonly second: number | null;
  /** second / first; null when either value is missing or the first is zero. */
  readonly ratio: number | null;
}

/** Aligns two runs by measurement id, in the order of the first run. */
export function compareMeasurements(
  first: readonly ExperimentMeasurement[],
  second: readonly ExperimentMeasurement[],
): MeasurementComparisonRow[] {
  const secondById = new Map(second.map((m) => [m.id, m]));
  const rows = first.map((measurement) => {
    const other = secondById.get(measurement.id);
    const ratio =
      measurement.value === null ||
      other?.value === null ||
      other === undefined ||
      measurement.value === 0
        ? null
        : other.value / measurement.value;
    return {
      id: measurement.id,
      label: measurement.label,
      unit: measurement.unit,
      first: measurement.value,
      second: other?.value ?? null,
      ratio,
    };
  });

  // Quantities that only the second run recorded.
  const firstIds = new Set(first.map((m) => m.id));
  for (const measurement of second) {
    if (!firstIds.has(measurement.id)) {
      rows.push({
        id: measurement.id,
        label: measurement.label,
        unit: measurement.unit,
        first: null,
        second: measurement.value,
        ratio: null,
      });
    }
  }
  return rows;
}
