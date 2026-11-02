import { useState } from "react";
import { RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import {
  ARENA_SIZE_CM,
  type DetectiveControl,
  type DetectiveRound,
  type Point,
} from "./electricDetectiveData";
import { addProbe, electricDetective, readingFor } from "./electricDetectiveModel";

const SIZE = 380;
const LEFT = 40;
const TOP = 20;
const VIEW_WIDTH = 700;
const VIEW_HEIGHT = 420;
const ARROW_LENGTH = 40;

const px = (xCm: number) => LEFT + (xCm / ARENA_SIZE_CM) * SIZE;
const py = (yCm: number) => TOP + SIZE - (yCm / ARENA_SIZE_CM) * SIZE;
const signOf = (charge: number) => (charge > 0 ? "+" : charge < 0 ? "−" : "0");

function ChargeMarker({ x, y, charge, className }: { x: number; y: number; charge: number; className: string }) {
  return (
    <g className={className}>
      <circle cx={px(x)} cy={py(y)} r="14" />
      <text textAnchor="middle" x={px(x)} y={py(y) + 5}>
        {signOf(charge)}
      </text>
    </g>
  );
}

function Arena({ round, control, solved }: { round: DetectiveRound; control: DetectiveControl; solved: boolean }) {
  const readings = control.probes.map((probe) => readingFor(round, probe));
  const known = round.knownPosition || solved;

  return (
    <svg
      aria-label={`Arena 100 by 100 centimeters. ${control.probes.length} of ${round.maxProbes} readings taken. ${round.knownPosition ? `The hidden charge is at ${round.hidden.xCm}, ${round.hidden.yCm} centimeters. ` : ""}Your guess is at ${control.guess.xCm}, ${control.guess.yCm} centimeters. The readings are listed in the table below.`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    >
      <rect fill="#f9faff" height={VIEW_HEIGHT} rx="10" width={VIEW_WIDTH} />
      <rect fill="#fff" height={SIZE} stroke="#c9d0e6" width={SIZE} x={LEFT} y={TOP} />
      {[0, 20, 40, 60, 80, 100].map((tick) => (
        <g className="balance-plot__tick" key={tick}>
          <line stroke="#e1e5f0" x1={px(tick)} x2={px(tick)} y1={TOP} y2={TOP + SIZE} />
          <line stroke="#e1e5f0" x1={LEFT} x2={LEFT + SIZE} y1={py(tick)} y2={py(tick)} />
          <text textAnchor="middle" x={px(tick)} y={TOP + SIZE + 16}>{tick}</text>
          <text textAnchor="end" x={LEFT - 6} y={py(tick) + 4}>{tick}</text>
        </g>
      ))}
      <text className="balance-plot__pivot-label" textAnchor="middle" x={LEFT + SIZE / 2} y={VIEW_HEIGHT - 4}>cm</text>

      {known && (
        <ChargeMarker
          charge={round.hidden.chargeNanocoulombs}
          className="detective-charge detective-charge--hidden"
          x={round.hidden.xCm}
          y={round.hidden.yCm}
        />
      )}
      {!round.knownPosition && !solved && (
        <ChargeMarker
          charge={control.guess.chargeNanocoulombs}
          className="detective-charge detective-charge--guess"
          x={control.guess.xCm}
          y={control.guess.yCm}
        />
      )}

      <g className="detective-next">
        <line x1={px(control.nextProbe.xCm) - 8} x2={px(control.nextProbe.xCm) + 8} y1={py(control.nextProbe.yCm)} y2={py(control.nextProbe.yCm)} />
        <line x1={px(control.nextProbe.xCm)} x2={px(control.nextProbe.xCm)} y1={py(control.nextProbe.yCm) - 8} y2={py(control.nextProbe.yCm) + 8} />
      </g>

      {readings.map((reading, index) => {
        const unit = reading.forceMicronewtons.scale(1 / reading.magnitudeMicronewtons);
        const x1 = px(reading.probe.xCm);
        const y1 = py(reading.probe.yCm);
        const x2 = x1 + unit.x * ARROW_LENGTH;
        const y2 = y1 - unit.y * ARROW_LENGTH;
        return (
          <g className="detective-probe" key={index}>
            <line x1={x1} x2={x2} y1={y1} y2={y2} />
            <polygon points={`${x2},${y2} ${x2 - unit.x * 9 + unit.y * 5},${y2 + unit.y * 9 + unit.x * 5} ${x2 - unit.x * 9 - unit.y * 5},${y2 + unit.y * 9 - unit.x * 5}`} />
            <circle cx={x1} cy={y1} r="4" />
            <text x={x1 + 7} y={y1 - 7}>{index + 1}</text>
          </g>
        );
      })}

      <g className="detective-legend">
        <text x="450" y="60">● numbered dots: readings (arrow = force)</text>
        <text x="450" y="84">＋ cross: next probe position</text>
        <text x="450" y="108">○ dashed: your guess</text>
        <text x="450" y="132">{solved ? "● solid: the hidden charge" : "The hidden charge is not shown"}</text>
      </g>
    </svg>
  );
}

export function ElectricDetectivePage() {
  const [probeError, setProbeError] = useState<string | null>(null);

  return (
    <RoundGamePage
      definition={electricDetective}
      renderVisual={(game) => <Arena control={game.control} round={game.round} solved={game.roundSolved} />}
      renderMeasurements={(game) => {
        const last = game.control.probes.at(-1);
        const reading = last ? readingFor(game.round, last) : null;
        return [
          { label: "READINGS USED", value: `${game.control.probes.length} / ${game.round.maxProbes}` },
          { label: "LATEST FORCE", value: reading ? `${reading.magnitudeMicronewtons.toPrecision(3)} µN` : "—" },
          { label: "FORCE DIRECTION", value: reading ? `${reading.directionDegrees.toFixed(0)}°` : "—" },
          { label: "TEST CHARGE", value: "+1 nC" },
        ];
      }}
      renderDetails={(game) =>
        game.control.probes.length > 0 ? (
          <table className="circuit-readings">
            <caption>READINGS · FORCE ON A +1 nC TEST CHARGE · DIRECTION IN DEGREES FROM +x</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Probe (cm)</th>
                <th scope="col">Fx (µN)</th>
                <th scope="col">Fy (µN)</th>
                <th scope="col">|F| (µN)</th>
                <th scope="col">Direction</th>
              </tr>
            </thead>
            <tbody>
              {game.control.probes.map((probe, index) => {
                const r = readingFor(game.round, probe);
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{probe.xCm}, {probe.yCm}</td>
                    <td>{r.forceMicronewtons.x.toFixed(3)}</td>
                    <td>{r.forceMicronewtons.y.toFixed(3)}</td>
                    <td>{r.magnitudeMicronewtons.toFixed(3)}</td>
                    <td>{r.directionDegrees.toFixed(1)}°</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null
      }
      renderControls={(game) => {
        const { control, round, canEdit } = game;
        const moveProbe = (changes: Partial<Point>) => {
          setProbeError(null);
          game.setControl((current) => ({ ...current, nextProbe: { ...current.nextProbe, ...changes } }));
        };
        const moveGuess = (changes: Partial<DetectiveControl["guess"]>) =>
          game.setControl((current) => ({ ...current, guess: { ...current.guess, ...changes } }));
        const takeReading = () => {
          try {
            game.setControl(addProbe(round, control));
            setProbeError(null);
          } catch (error) {
            setProbeError(error instanceof Error ? error.message : "That reading could not be taken.");
          }
        };

        return (
          <>
            <fieldset className="game-fieldset">
              <legend>1 · Place the test charge</legend>
              <RangeControl disabled={!canEdit} displayValue={`${control.nextProbe.xCm} cm`} id="probe-x" label="Probe x" maximum={ARENA_SIZE_CM} minimum={0} onChange={(xCm) => moveProbe({ xCm })} step={1} value={control.nextProbe.xCm} />
              <RangeControl disabled={!canEdit} displayValue={`${control.nextProbe.yCm} cm`} id="probe-y" label="Probe y" maximum={ARENA_SIZE_CM} minimum={0} onChange={(yCm) => moveProbe({ yCm })} step={1} value={control.nextProbe.yCm} />
              <button
                className="lab-button lab-button--secondary"
                disabled={!canEdit || control.probes.length >= round.maxProbes}
                onClick={takeReading}
                type="button"
              >
                Take reading ({control.probes.length}/{round.maxProbes})
              </button>
              {probeError && <p className="game-error" role="alert">{probeError}</p>}
            </fieldset>

            <fieldset className="game-fieldset">
              <legend>2 · Your hypothesis</legend>
              {round.knownPosition ? (
                <p>Position is known: ({round.hidden.xCm}, {round.hidden.yCm}) cm.</p>
              ) : (
                <>
                  <RangeControl disabled={!canEdit} displayValue={`${control.guess.xCm} cm`} id="guess-x" label="Guess x" maximum={ARENA_SIZE_CM} minimum={0} onChange={(xCm) => moveGuess({ xCm })} step={1} value={control.guess.xCm} />
                  <RangeControl disabled={!canEdit} displayValue={`${control.guess.yCm} cm`} id="guess-y" label="Guess y" maximum={ARENA_SIZE_CM} minimum={0} onChange={(yCm) => moveGuess({ yCm })} step={1} value={control.guess.yCm} />
                </>
              )}
              {round.knownCharge ? (
                <p>Charge is known: +{round.hidden.chargeNanocoulombs} nC.</p>
              ) : (
                <RangeControl
                  disabled={!canEdit}
                  displayValue={`${control.guess.chargeNanocoulombs > 0 ? "+" : ""}${control.guess.chargeNanocoulombs.toFixed(1)} nC`}
                  id="guess-charge"
                  label="Guess charge"
                  maximum={10}
                  minimum={-10}
                  onChange={(chargeNanocoulombs) => moveGuess({ chargeNanocoulombs })}
                  step={0.1}
                  value={control.guess.chargeNanocoulombs}
                />
              )}
            </fieldset>
          </>
        );
      }}
    />
  );
}
