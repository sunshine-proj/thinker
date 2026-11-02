import { RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import type { IceControl, IceRound } from "./iceMeltingData";
import { iceMelting, resolveInputs, type IceOutcome } from "./iceMeltingModel";

const WIDTH = 960;
const HEIGHT = 260;

function Flask({ round, control, outcome }: { round: IceRound; control: IceControl; outcome: IceOutcome | null }) {
  const inputs = resolveInputs(round, control);
  const iceCubes = Math.min(14, Math.max(1, Math.round(inputs.iceMassGrams / 20)));
  const waterHeight = 40 + round.waterMassKilograms * 200;
  const mixture = outcome?.mixture;
  const heat = mixture
    ? [
        { label: "Heat the water can release cooling to 0 °C", joules: mixture.heatAvailableFromWaterJoules },
        { label: "Heat to warm the ice to 0 °C", joules: mixture.heatToWarmIceJoules },
        { label: "Heat to melt all the ice", joules: mixture.heatToMeltAllJoules },
      ]
    : [];
  const maxHeat = Math.max(1, ...heat.map((h) => h.joules));

  return (
    <svg
      aria-label={`Insulated flask with ${round.waterMassKilograms} kilograms of water at ${inputs.waterTemperatureCelsius} degrees Celsius and ${inputs.iceMassGrams} grams of ice at ${round.iceTemperatureCelsius} degrees Celsius. ${mixture ? `Result: ${mixture.phase === "liquid" ? "all liquid" : mixture.phase === "ice-and-water" ? "ice and water" : "solid ice"} at ${mixture.finalTemperatureCelsius.toFixed(1)} degrees Celsius with ${outcome?.iceRemainingGrams.toFixed(0)} grams of ice.` : "Press mix to see the result."}`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      <rect fill="#f9faff" height={HEIGHT} rx="10" width={WIDTH} />
      <rect className="flask-water" height={waterHeight} width="150" x="40" y={230 - waterHeight} />
      <path className="flask-glass" d="M 40 40 L 40 230 L 190 230 L 190 40" fill="none" />
      {Array.from({ length: iceCubes }, (_, i) => (
        <rect className="flask-ice" height="18" key={i} rx="3" width="18" x={50 + (i % 7) * 20} y={230 - waterHeight - 18 - Math.floor(i / 7) * 20} />
      ))}
      <text className="balance-plot__pivot-label" textAnchor="middle" x="115" y="250">
        {round.waterMassKilograms} kg water · {inputs.iceMassGrams} g ice
      </text>
      <g className="detective-legend">
        <text x="220" y="60">Water: {inputs.waterTemperatureCelsius} °C · Ice: {round.iceTemperatureCelsius} °C</text>
        {heat.length === 0 && <text x="220" y="100">Energy accounting appears after you mix.</text>}
      </g>
      {heat.map((h, index) => (
        <g className="flask-bars" key={h.label}>
          <text x="220" y={96 + index * 54}>{h.label}</text>
          <rect height="16" width={Math.max(2, (h.joules / maxHeat) * 480)} x="220" y={104 + index * 54} />
          <text x={226 + Math.max(2, (h.joules / maxHeat) * 480)} y={117 + index * 54}>{(h.joules / 1000).toFixed(1)} kJ</text>
        </g>
      ))}
    </svg>
  );
}

export function IceMeltingPage() {
  return (
    <RoundGamePage
      definition={iceMelting}
      renderControls={(game) => {
        const { control: spec } = game.round;
        const isIce = spec.kind === "iceMassGrams";
        const inputs = resolveInputs(game.round, game.control);
        return (
          <>
            <p className="game-instructions">
              {isIce
                ? `Water: ${game.round.waterMassKilograms} kg at ${game.round.waterTemperatureCelsius} °C. Ice at ${game.round.iceTemperatureCelsius} °C.`
                : `Ice: ${game.round.iceMassGrams} g at ${game.round.iceTemperatureCelsius} °C. Water: ${game.round.waterMassKilograms} kg.`}
            </p>
            <RangeControl
              disabled={!game.canEdit}
              displayValue={isIce ? `${inputs.iceMassGrams.toFixed(1)} g` : `${inputs.waterTemperatureCelsius.toFixed(1)} °C`}
              id="ice-control"
              label={isIce ? "Mass of ice added" : "Starting water temperature"}
              maximum={spec.maximum}
              minimum={spec.minimum}
              onChange={(value) => game.setControl({ value })}
              step={spec.step}
              value={game.control.value}
            />
          </>
        );
      }}
      renderMeasurements={(game) => {
        const outcome = game.last?.outcome;
        return [
          { label: "FINAL TEMPERATURE", value: outcome ? `${outcome.mixture.finalTemperatureCelsius.toFixed(2)} °C` : "—" },
          { label: "ICE LEFT", value: outcome ? `${outcome.iceRemainingGrams.toFixed(0)} g` : "—" },
          { label: "WATER AT END", value: outcome ? `${(outcome.mixture.waterMassKilograms * 1000).toFixed(0)} g` : "—" },
          {
            label: "STATE",
            value: outcome ? (outcome.mixture.phase === "liquid" ? "All liquid" : outcome.mixture.phase === "ice" ? "Solid ice" : "Ice + water") : "—",
          },
        ];
      }}
      renderVisual={(game) => <Flask control={game.control} outcome={game.last?.outcome ?? null} round={game.round} />}
    />
  );
}
