import { useState } from "react";
import {
  compareMeasurements,
  formatMeasurementValue,
  type ExperimentMeasurement,
} from "../../../simulation/measurements";
import { useProgressStore } from "../../../store/progressStore";
import type { SavedExperiment } from "../../../types/progress";

interface SavedExperimentsPanelProps {
  readonly experimentId: string;
  readonly experimentName: string;
  /** JSON-safe parameters describing the current setup. */
  readonly parameters: Readonly<Record<string, unknown>>;
  /** Measurements of the current run. */
  readonly results: readonly ExperimentMeasurement[];
  /** Applies a saved setup; returns false if it can no longer be restored. */
  readonly onLoad: (parameters: Readonly<Record<string, unknown>>) => boolean;
  readonly describe: (parameters: Readonly<Record<string, unknown>>) => string;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function defaultName(count: number): string {
  return `Run ${count + 1}`;
}

/** Saves, restores, deletes and compares runs of any experiment. */
export function SavedExperimentsPanel({
  experimentId,
  experimentName,
  parameters,
  results,
  onLoad,
  describe,
}: SavedExperimentsPanelProps) {
  const experiments = useProgressStore((state) => state.experiments);
  const saveExperiment = useProgressStore((state) => state.saveExperiment);
  const deleteExperiment = useProgressStore((state) => state.deleteExperiment);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const saved = experiments.filter((experiment) => experiment.experimentId === experimentId);
  const compared = selected
    .map((id) => saved.find((experiment) => experiment.id === id))
    .filter((experiment): experiment is SavedExperiment => experiment !== undefined);
  const comparison =
    compared.length === 2
      ? compareMeasurements(compared[0]!.results, compared[1]!.results)
      : null;

  const handleSave = async () => {
    const runName = name.trim() || defaultName(saved.length);
    try {
      await saveExperiment({
        experimentId,
        experimentName,
        runName,
        parameters,
        results,
      });
      setMessage(`Saved “${runName}”.`);
      setName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The experiment could not be saved.");
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id].slice(-2),
    );
  };

  return (
    <section aria-labelledby="saved-experiments-title" className="saved-experiments">
      <div className="saved-experiments__heading">
        <div>
          <p className="eyebrow">YOUR NOTEBOOK</p>
          <h2 id="saved-experiments-title">Saved experiments</h2>
        </div>
        <div className="saved-experiments__save">
          <label htmlFor="experiment-name">Name this run</label>
          <input
            id="experiment-name"
            maxLength={60}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder={defaultName(saved.length)}
            type="text"
            value={name}
          />
          <button
            className="lab-button lab-button--primary"
            onClick={() => void handleSave()}
            type="button"
          >
            Save experiment
          </button>
        </div>
      </div>
      {message && (
        <p className="lab-success" role="status">
          {message}
        </p>
      )}

      {saved.length === 0 ? (
        <p className="saved-experiments__empty">
          Run the experiment, then save it here to compare it with later runs.
          Saved experiments stay on this device.
        </p>
      ) : (
        <ul className="saved-experiments__list">
          {saved.map((experiment) => (
            <li className="saved-experiment" key={experiment.id}>
              <label className="saved-experiment__select">
                <input
                  checked={selected.includes(experiment.id)}
                  onChange={() => toggleSelected(experiment.id)}
                  type="checkbox"
                />
                <span className="visually-hidden">
                  Compare {experiment.runName}
                </span>
              </label>
              <div className="saved-experiment__details">
                <strong>{experiment.runName}</strong>
                <span>{formatDate(experiment.createdAt)}</span>
                <span>{describe(experiment.parameters)}</span>
              </div>
              <button
                className="circuit-chip"
                onClick={() =>
                  setMessage(
                    onLoad(experiment.parameters)
                      ? "Setup loaded. Press Start to run it again."
                      : "That saved setup is no longer valid and could not be loaded.",
                  )
                }
                type="button"
              >
                Load setup
              </button>
              <button
                aria-label={`Delete ${experiment.runName}`}
                className="circuit-chip"
                onClick={() => {
                  setSelected((current) => current.filter((id) => id !== experiment.id));
                  void deleteExperiment(experiment.id);
                }}
                type="button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {saved.length >= 2 && !comparison && (
        <p className="saved-experiments__empty">
          Tick two saved runs to compare their measurements side by side.
        </p>
      )}
      {comparison && compared.length === 2 && (
        <table className="circuit-readings">
          <caption>COMPARISON OF TWO RUNS</caption>
          <thead>
            <tr>
              <th scope="col">Measurement</th>
              <th scope="col">{compared[0]!.runName}</th>
              <th scope="col">{compared[1]!.runName}</th>
              <th scope="col">Second ÷ first</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td>{formatMeasurementValue(row.first, row.unit)}</td>
                <td>{formatMeasurementValue(row.second, row.unit)}</td>
                <td>{row.ratio === null ? "—" : `× ${row.ratio.toPrecision(3)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
