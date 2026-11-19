import { useState } from "react";
import { RoundGamePage } from "../../../game-engine/rounds";
import type { RoundGameState } from "../../../game-engine/rounds/useRoundGame";
import { MAX_RESISTORS_PER_STAGE, MAX_STAGES, type CircuitRound } from "./circuitBuilderData";
import { getTargetResistanceOhms } from "./circuitBuilderModel";
import { circuitBuilder, solvedLayout, type CircuitControl, type CircuitOutcomeRecord } from "./circuitBuilderRoundGame";
import { CircuitDiagram } from "./CircuitDiagram";

type CircuitGame = RoundGameState<CircuitRound, CircuitControl, CircuitOutcomeRecord>;

const formatAmperes = (amperes: number) => `${(amperes * 1000).toFixed(1)} mA`;
const formatOhms = (ohms: number) => `${Number(ohms.toFixed(1))} Ω`;

/** The resistor box and the series stages; resistors in one stage are in parallel. */
function CircuitControls({ game }: { readonly game: CircuitGame }) {
  const [message, setMessage] = useState<string | null>(null);
  const { round, control, canEdit } = game;
  const { layout, selectedStage } = control;
  const used = new Set(layout.flat());
  const change = (next: readonly (readonly number[])[], stage = selectedStage) => {
    setMessage(null);
    game.setControl({ layout: next, selectedStage: Math.min(stage, Math.max(next.length - 1, 0)) });
  };
  const add = (inventoryIndex: number) => {
    if (layout.length === 0) {
      change([[inventoryIndex]], 0);
      return;
    }
    if ((layout[selectedStage] ?? []).length >= MAX_RESISTORS_PER_STAGE) {
      setMessage(`A stage can hold at most ${MAX_RESISTORS_PER_STAGE} resistors.`);
      return;
    }
    change(layout.map((stage, index) => (index === selectedStage ? [...stage, inventoryIndex] : stage)));
  };
  return (
    <>
      <h3 className="circuit-heading" id="resistor-box-title">Resistor box</h3>
      <ul aria-labelledby="resistor-box-title" className="circuit-inventory">
        {round.inventoryOhms.map((ohms, inventoryIndex) => (
          <li key={inventoryIndex}>
            <button aria-label={`Add ${ohms} ohm resistor`} disabled={!canEdit || used.has(inventoryIndex)} onClick={() => add(inventoryIndex)} type="button">
              {ohms} Ω
            </button>
          </li>
        ))}
      </ul>
      <h3 className="circuit-heading" id="stages-title">Series stages</h3>
      <ol aria-labelledby="stages-title" className="circuit-builder-stages">
        {layout.map((stage, stageIndex) => (
          <li className={stageIndex === selectedStage ? "circuit-stage circuit-stage--selected" : "circuit-stage"} key={stageIndex}>
            <label>
              <input checked={stageIndex === selectedStage} disabled={!canEdit} name="target-stage" onChange={() => change(layout, stageIndex)} type="radio" />
              Stage {stageIndex + 1}
            </label>
            {stage.length === 0 && <span>empty</span>}
            {stage.map((inventoryIndex) => (
              <button
                aria-label={`Remove ${round.inventoryOhms[inventoryIndex]} ohm resistor from stage ${stageIndex + 1}`}
                className="circuit-chip"
                disabled={!canEdit}
                key={inventoryIndex}
                onClick={() => change(layout.map((current) => current.filter((index) => index !== inventoryIndex)))}
                type="button"
              >
                {round.inventoryOhms[inventoryIndex]} Ω ×
              </button>
            ))}
            {stage.length === 0 && (
              <button aria-label={`Remove empty stage ${stageIndex + 1}`} className="circuit-chip" disabled={!canEdit} onClick={() => change(layout.filter((_, index) => index !== stageIndex))} type="button">
                Remove stage
              </button>
            )}
          </li>
        ))}
      </ol>
      <button
        className="lab-button lab-button--secondary"
        disabled={!canEdit}
        onClick={() => (layout.length >= MAX_STAGES ? setMessage(`A circuit can have at most ${MAX_STAGES} stages.`) : change([...layout, []], layout.length))}
        type="button"
      >
        Add series stage
      </button>
      {message && <p className="game-error" role="alert">{message}</p>}
    </>
  );
}

export function CircuitBuilderPage() {
  return (
    <RoundGamePage
      definition={circuitBuilder}
      renderControls={(game) => <CircuitControls game={game} />}
      renderDetails={(game) => {
        const solution = game.last?.outcome.result.solution;
        return solution ? (
          <table className="circuit-readings">
            <caption>RESISTOR READINGS · RATING {game.round.powerRatingWatts} W EACH</caption>
            <thead>
              <tr><th scope="col">Stage</th><th scope="col">Resistance</th><th scope="col">Voltage</th><th scope="col">Current</th><th scope="col">Power</th></tr>
            </thead>
            <tbody>
              {solution.resistors.map((reading, position) => (
                <tr key={position}>
                  <td>{reading.stageIndex + 1}</td>
                  <td>{formatOhms(reading.resistanceOhms)}</td>
                  <td>{reading.voltageVolts.toFixed(2)} V</td>
                  <td>{formatAmperes(reading.currentAmperes)}</td>
                  <td>{reading.powerWatts.toFixed(3)} W{reading.powerWatts > game.round.powerRatingWatts * (1 + 1e-9) ? " (over rating)" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null;
      }}
      renderMeasurements={(game) => {
        const solution = game.last?.outcome.result.solution ?? null;
        return [
          { label: "EQUIVALENT RESISTANCE", value: solution ? formatOhms(solution.equivalentResistanceOhms) : "—" },
          { label: "TARGET RESISTANCE", value: formatOhms(getTargetResistanceOhms(game.round)) },
          { label: "TOTAL CURRENT", value: solution ? formatAmperes(solution.totalCurrentAmperes) : "—" },
          { label: "TOTAL POWER", value: solution ? `${solution.totalPowerWatts.toFixed(2)} W` : "—" },
        ];
      }}
      renderVisual={(game) => (
        <CircuitDiagram
          layout={game.last ? solvedLayout(game.last.control) : solvedLayout(game.control)}
          overloaded={game.last?.outcome.result.overloadedResistors ?? []}
          round={game.round}
          solution={game.last?.outcome.result.solution ?? null}
        />
      )}
    />
  );
}
