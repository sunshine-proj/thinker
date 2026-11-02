import { LineChart, RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import { calculateBendingMomentAt } from "../../../physics/mechanics";
import {
  BRIDGE_MATERIALS,
  type BridgeControl,
  type BridgeRound,
  type MaterialId,
} from "./bridgeBuilderData";
import { bridgeBuilder, type BridgeOutcome } from "./bridgeBuilderModel";

const WIDTH = 960;
const HEIGHT = 230;
const LEFT = 90;
const RIGHT = 870;
const BEAM_Y = 150;

function BridgeSketch({
  round,
  control,
}: {
  round: BridgeRound;
  control: BridgeControl;
}) {
  const x = (meters: number) => LEFT + (meters / round.spanMeters) * (RIGHT - LEFT);
  const depthPixels = Math.max(6, control.heightMeters * 100 * 1.6);
  const loads = round.vehicleLoads
    .map((load) => `${(load.forceNewtons / 1000).toFixed(1)} kN at ${load.positionMeters} m`)
    .join(", ");

  return (
    <svg
      aria-label={`Beam bridge of ${round.spanMeters} meters, ${(control.heightMeters * 100).toFixed(1)} centimeters deep, made of ${BRIDGE_MATERIALS[control.material].name}. Loads: ${loads}${round.deckLoadNewtonsPerMeter > 0 ? `, plus a deck load of ${round.deckLoadNewtonsPerMeter} newtons per meter` : ""}.`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      <rect fill="#f9faff" height={HEIGHT} rx="10" width={WIDTH} />
      <rect
        className="balance-plot__beam"
        height={depthPixels}
        rx="2"
        width={RIGHT - LEFT}
        x={LEFT}
        y={BEAM_Y - depthPixels}
      />
      <polygon className="balance-plot__pivot" points={`${LEFT - 22},${BEAM_Y + 40} ${LEFT + 22},${BEAM_Y + 40} ${LEFT},${BEAM_Y}`} />
      <polygon className="balance-plot__pivot" points={`${RIGHT - 22},${BEAM_Y + 40} ${RIGHT + 22},${BEAM_Y + 40} ${RIGHT},${BEAM_Y}`} />
      {round.deckLoadNewtonsPerMeter > 0 &&
        Array.from({ length: 13 }, (_, i) => (
          <line
            key={i}
            stroke="#9aa5cf"
            strokeWidth="2"
            x1={LEFT + ((RIGHT - LEFT) * i) / 12}
            x2={LEFT + ((RIGHT - LEFT) * i) / 12}
            y1={BEAM_Y - depthPixels - 22}
            y2={BEAM_Y - depthPixels - 4}
          />
        ))}
      {round.vehicleLoads.map((load, index) => (
        <g className="balance-plot__block balance-plot__block--yours" key={index}>
          <line stroke="#d98a1f" strokeWidth="3" x1={x(load.positionMeters)} x2={x(load.positionMeters)} y1={BEAM_Y - depthPixels - 66} y2={BEAM_Y - depthPixels - 6} />
          <polygon fill="#d98a1f" points={`${x(load.positionMeters) - 7},${BEAM_Y - depthPixels - 14} ${x(load.positionMeters) + 7},${BEAM_Y - depthPixels - 14} ${x(load.positionMeters)},${BEAM_Y - depthPixels - 2}`} />
          <text textAnchor="middle" x={x(load.positionMeters)} y={BEAM_Y - depthPixels - 74}>
            {(load.forceNewtons / 1000).toFixed(1)} kN
          </text>
        </g>
      ))}
      <text className="balance-plot__pivot-label" textAnchor="middle" x={(LEFT + RIGHT) / 2} y={HEIGHT - 12}>
        span {round.spanMeters} m · beam depth {(control.heightMeters * 100).toFixed(1)} cm · width {(round.widthMeters * 100).toFixed(0)} cm
      </text>
    </svg>
  );
}

function momentDiagram(outcome: BridgeOutcome, round: BridgeRound) {
  const steps = 60;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const position = (round.spanMeters * i) / steps;
    return {
      x: position,
      y: calculateBendingMomentAt(outcome.beam, position) / 1000,
    };
  });
}

export function BridgeBuilderPage() {
  return (
    <RoundGamePage
      definition={bridgeBuilder}
      renderControls={(game) => (
        <>
          <label className="game-select" htmlFor="bridge-material">
            Material
            <select
              disabled={!game.canEdit}
              id="bridge-material"
              onChange={(event) => {
                const material = event.currentTarget.value as MaterialId;
                game.setControl((current) => ({ ...current, material }));
              }}
              value={game.control.material}
            >
              {Object.values(BRIDGE_MATERIALS).map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} · {material.costPerKilogram} credit/kg
                </option>
              ))}
            </select>
          </label>
          <RangeControl
            disabled={!game.canEdit}
            displayValue={`${(game.control.heightMeters * 100).toFixed(1)} cm`}
            id="bridge-depth"
            label="Beam depth"
            maximum={game.round.maximumHeightMeters * 100}
            minimum={game.round.minimumHeightMeters * 100}
            onChange={(centimeters) =>
              game.setControl((current) => ({
                ...current,
                heightMeters: Math.round(centimeters * 10) / 1000,
              }))
            }
            step={0.1}
            value={game.control.heightMeters * 100}
          />
        </>
      )}
      renderMeasurements={(game) => {
        const outcome = game.last?.outcome;
        return [
          { label: "MAX BENDING MOMENT", value: outcome ? `${(outcome.maximumMomentNewtonMeters / 1000).toFixed(1)} kN·m` : "—" },
          {
            label: "PEAK STRESS / ALLOWED",
            value: outcome ? `${(outcome.stressPascals / 1e6).toFixed(0)} / ${(outcome.allowableStressPascals / 1e6).toFixed(0)} MPa` : "—",
          },
          { label: "COST / BUDGET", value: outcome ? `${Math.round(outcome.cost)} / ${game.round.budget}` : `— / ${game.round.budget}` },
          { label: "BEAM MASS", value: outcome ? `${Math.round(outcome.massKilograms)} kg` : "—" },
        ];
      }}
      renderVisual={(game) => {
        const outcome = game.last?.outcome;
        return (
          <>
            <BridgeSketch control={game.control} round={game.round} />
            {outcome && game.last && (
              <LineChart
                description={`The bending moment rises from zero at the left support to a peak of ${(outcome.maximumMomentNewtonMeters / 1000).toFixed(1)} kilonewton-meters at ${outcome.maximumMomentPositionMeters.toFixed(2)} meters, then falls to zero at the right support.`}
                series={[{ label: "Bending moment", points: momentDiagram(outcome, game.round) }]}
                title="Bending moment diagram"
                xDomain={[0, game.round.spanMeters]}
                xLabel="Position along the span (m)"
                yLabel="Moment (kN·m)"
              />
            )}
          </>
        );
      }}
    />
  );
}
