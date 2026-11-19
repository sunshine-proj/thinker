import { useEffect, useMemo, useState } from "react";
import { LineChart, MeasurementGrid, RangeControl } from "../../../components/common";
import { formatMeasurement } from "../../../simulation/measurements";
import { useProgressStore } from "../../../store/progressStore";
import { ResultExplanation } from "../components/ResultExplanation";
import { SavedExperimentsPanel } from "../components/SavedExperimentsPanel";
import {
  defaultLabValues,
  isPredictionConfirmed,
  parseLabValues,
  predictionMeasurementId,
  type LabDefinition,
  type LabValues,
} from "./labTypes";

type LabMode = "beginner" | "advanced";
const MODE_KEY = "physics-playground.lab-mode";

function readMode(): LabMode {
  try {
    return localStorage.getItem(MODE_KEY) === "advanced" ? "advanced" : "beginner";
  } catch {
    return "beginner";
  }
}

function writeMode(mode: LabMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // The choice simply is not remembered.
  }
}

interface LockedPrediction {
  readonly measurementId: string;
  readonly value: number;
}

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
  const [mode, setMode] = useState<LabMode>(readMode);
  const [ran, setRan] = useState(false);
  const [guess, setGuess] = useState("");
  const [locked, setLocked] = useState<LockedPrediction | null>(null);
  const hydrate = useProgressStore((state) => state.hydrate);
  const recordPrediction = useProgressStore((state) => state.recordPrediction);

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
        setRan(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [savedExperimentId, hydrate, definition]);

  const result = useMemo(() => definition.run(values), [definition, values]);
  const setValue = (key: string, value: number | string) => setValues((current) => ({ ...current, [key]: value }));
  const advancedKeys = new Set(definition.modes.advancedControls);
  const predictedId = predictionMeasurementId(definition, values);
  const predictedMeasurement = result.measurements.find((measurement) => measurement.id === predictedId);
  const lockedMeasurement = locked && result.measurements.find((measurement) => measurement.id === locked.measurementId);

  const changeMode = (next: LabMode) => {
    setMode(next);
    writeMode(next);
  };

  const run = (withPrediction: boolean) => {
    setRan(true);
    const predicted = Number(guess.replace(",", "."));
    if (!withPrediction || !Number.isFinite(predicted) || guess.trim() === "") {
      setLocked(null);
      return;
    }
    setLocked({ measurementId: predictedId, value: predicted });
    const measured = predictedMeasurement?.value ?? null;
    void recordPrediction({
      activityId: definition.id,
      activityKind: "experiment",
      questionId: predictedId,
      answer: String(predicted),
      correct: measured === null ? false : isPredictionConfirmed(predicted, measured, definition.prediction.tolerance),
    });
  };

  const predictAgain = () => {
    setRan(false);
    setLocked(null);
    setGuess("");
  };

  return (
    <div className="lab-page">
      <header className="worlds-page__header">
        <p className="eyebrow">{definition.eyebrow}</p>
        <h1>{definition.name}</h1>
        <p>{definition.introduction}</p>
      </header>

      <div aria-label="Lab mode" className="lab-mode" role="group">
        {(["beginner", "advanced"] as const).map((option) => (
          <button
            aria-pressed={mode === option}
            className={`lab-mode__option${mode === option ? " lab-mode__option--active" : ""}`}
            key={option}
            onClick={() => changeMode(option)}
            type="button"
          >
            {option === "beginner" ? "Beginner" : "Advanced"}
          </button>
        ))}
      </div>

      {mode === "beginner" && (
        <section aria-labelledby="lab-steps-title" className="lab-panel">
          <h2 id="lab-steps-title">How to run this experiment</h2>
          <ol className="lab-steps">
            {definition.modes.beginnerSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      )}

      <section aria-labelledby="lab-controls-title" className="lab-panel">
        <div className="lab-panel__heading">
          <h2 id="lab-controls-title">Change the conditions</h2>
          <button className="lab-button" onClick={() => setValues(defaultLabValues(definition))} type="button">
            Reset to defaults
          </button>
        </div>
        {definition.controls
          .filter((control) => !control.visibleWhen || control.visibleWhen(values))
          .filter((control) => mode === "advanced" || !advancedKeys.has(control.key))
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

      {!ran && (
        <section aria-labelledby="lab-predict-title" className="lab-panel">
          <h2 id="lab-predict-title">Predict before you run</h2>
          <form
            className="lab-prediction"
            onSubmit={(event) => {
              event.preventDefault();
              run(true);
            }}
          >
            <label htmlFor="lab-prediction-value">
              {definition.prediction.prompt}
              {predictedMeasurement?.unit ? ` (${predictedMeasurement.unit})` : ""}
            </label>
            <div className="lab-prediction__row">
              <input
                id="lab-prediction-value"
                inputMode="decimal"
                onChange={(event) => setGuess(event.currentTarget.value)}
                placeholder="Your estimate"
                type="text"
                value={guess}
              />
              <button className="lab-button lab-button--primary" disabled={guess.trim() === "" || !Number.isFinite(Number(guess.replace(",", ".")))} type="submit">
                Lock in and run
              </button>
            </div>
            <button className="lab-button" onClick={() => run(false)} type="button">
              Run without a prediction
            </button>
          </form>
        </section>
      )}

      {ran && (
        <>
      {locked && lockedMeasurement && (
        <section aria-labelledby="lab-compare-title" className="lab-panel">
          <h2 id="lab-compare-title">Your prediction</h2>
          {lockedMeasurement.value === null ? (
            <p role="status">You predicted {locked.value} {lockedMeasurement.unit}, but with these settings the {lockedMeasurement.label.toLowerCase()} is not defined.</p>
          ) : (
            <p
              className={`prediction-check prediction-check--${isPredictionConfirmed(locked.value, lockedMeasurement.value, definition.prediction.tolerance) ? "match" : "miss"}`}
              role="status"
            >
              <strong>
                {isPredictionConfirmed(locked.value, lockedMeasurement.value, definition.prediction.tolerance)
                  ? "✓ Your prediction was within "
                  : "✗ Your prediction was more than "}
                {Math.round((definition.prediction.tolerance ?? 0.1) * 100)} % of the measurement.
              </strong>
              <span>
                You predicted {locked.value} {lockedMeasurement.unit}; the experiment measured {formatMeasurement(lockedMeasurement)}.
              </span>
            </p>
          )}
          <button className="lab-button" onClick={predictAgain} type="button">
            Make a new prediction
          </button>
        </section>
      )}

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

      {mode === "advanced" && (
        <section aria-labelledby="lab-raw-title" className="lab-panel">
          <h2 id="lab-raw-title">Raw data</h2>
          <div className="lab-raw">
            <table>
              <caption className="visually-hidden">All measurements at full precision</caption>
              <thead>
                <tr><th scope="col">Quantity</th><th scope="col">Value</th><th scope="col">Unit</th></tr>
              </thead>
              <tbody>
                {result.measurements.map((measurement) => (
                  <tr key={measurement.id}>
                    <th scope="row">{measurement.label}</th>
                    <td>{measurement.value === null ? "—" : measurement.value.toPrecision(8)}</td>
                    <td>{measurement.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
        </>
      )}
    </div>
  );
}
