import { useEffect, useMemo, useState } from "react";
import { LineChart, MeasurementGrid, RangeControl } from "../../../components/common";
import { formatMeasurement } from "../../../simulation/measurements";
import { useProgressStore } from "../../../store/progressStore";
import { ResultExplanation } from "../components/ResultExplanation";
import { SavedExperimentsPanel } from "../components/SavedExperimentsPanel";
import { defaultLabValues, parseLabValues, type LabDefinition, type LabValues } from "./labTypes";

function formatNumber(value: number, step: number, unit: string): string {
  const digits = Math.min(6, Math.max(0, Math.ceil(-Math.log10(step) - 1e-9)));
  return `${value.toFixed(digits)} ${unit}`.trim();
}

/** A generic open-ended lab: controls, live measurements, charts, explanations and a saved-runs notebook. */
export function LabPage({
  definition,
  savedExperimentId,
}: {
  readonly definition: LabDefinition;
  /** When set, the lab opens with that saved run's setup. */
  readonly savedExperimentId?: string;
}) {
  const [values, setValues] = useState<LabValues>(() => defaultLabValues(definition));
  const hydrate = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!savedExperimentId) {
      return;
    }
    let cancelled = false;
    void hydrate().then(() => {
      if (cancelled) {
        return;
      }
      const target = useProgressStore.getState().experiments.find((experiment) => experiment.id === savedExperimentId);
      const restored = target ? parseLabValues(definition, target.parameters) : null;
      if (restored) {
        setValues(restored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [savedExperimentId, hydrate, definition]);

  const result = useMemo(() => definition.run(values), [definition, values]);
  const setValue = (key: string, value: number | string) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <div className="lab-page">
      <header className="worlds-page__header">
        <p className="eyebrow">{definition.eyebrow}</p>
        <h1>{definition.name}</h1>
        <p>{definition.introduction}</p>
      </header>

      <section aria-labelledby="lab-controls-title" className="lab-panel">
        <div className="lab-panel__heading">
          <h2 id="lab-controls-title">Change the conditions</h2>
          <button className="lab-button" onClick={() => setValues(defaultLabValues(definition))} type="button">
            Reset to defaults
          </button>
        </div>
        {definition.controls
          .filter((control) => !control.visibleWhen || control.visibleWhen(values))
          .map((control) =>
            control.kind === "number" ? (
              <RangeControl
                displayValue={formatNumber(values[control.key] as number, control.step, control.unit)}
                id={`lab-${control.key}`}
                key={control.key}
                label={control.label}
                maximum={control.maximum}
                minimum={control.minimum}
                onChange={(value) => setValue(control.key, value)}
                step={control.step}
                value={values[control.key] as number}
              />
            ) : (
              <div className="lab-control" key={control.key}>
                <span className="lab-control__heading">
                  <label htmlFor={`lab-${control.key}`}>{control.label}</label>
                </span>
                <select
                  id={`lab-${control.key}`}
                  onChange={(event) => setValue(control.key, event.currentTarget.value)}
                  value={values[control.key] as string}
                >
                  {control.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ),
          )}
      </section>

      <section aria-labelledby="lab-measurements-title" className="lab-panel">
        <h2 id="lab-measurements-title">Measurements</h2>
        <MeasurementGrid items={result.measurements.map((measurement) => ({ label: measurement.label.toUpperCase(), value: formatMeasurement(measurement) }))} />
      </section>

      {result.charts.map((chart) => (
        <LineChart
          description={chart.description}
          key={chart.title}
          series={chart.series}
          title={chart.title}
          xDomain={chart.xDomain}
          xLabel={chart.xLabel}
          yDomain={chart.yDomain}
          yLabel={chart.yLabel}
        />
      ))}

      <ResultExplanation explanations={result.explanations} />

      <section aria-labelledby="lab-assumptions-title" className="lab-panel">
        <h2 id="lab-assumptions-title">Assumptions and limits</h2>
        <p>{definition.assumptions}</p>
      </section>

      <SavedExperimentsPanel
        describe={(parameters) => {
          const restored = parseLabValues(definition, parameters);
          return restored ? definition.describe(restored) : "Setup from an older version";
        }}
        experimentId={definition.id}
        experimentName={definition.name}
        onLoad={(parameters) => {
          const restored = parseLabValues(definition, parameters);
          if (!restored) {
            return false;
          }
          setValues(restored);
          return true;
        }}
        parameters={values}
        results={result.measurements}
      />
    </div>
  );
}
