import { createNumericGamePage } from "../../../game-engine/rounds";
import { microscopeBuilder, runMicroscope, type MicroscopeRound } from "./microscopeBuilder";
import type { NumericControl } from "../../../game-engine/rounds";

function MicroscopeView({ round, control }: { round: MicroscopeRound; control: NumericControl }) {
  const o = runMicroscope(round, control);
  return (
    <svg aria-label={`Compound microscope: objective ${o.objectiveMagnification.toFixed(1)} times, eyepiece ${o.eyepieceMagnification.toFixed(1)} times, total ${o.totalMagnification.toFixed(0)} times. The specimen sits ${o.specimenDistanceMm.toFixed(2)} millimeters in front of the objective.`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <line stroke="#9aa5cf" strokeDasharray="4 4" x1="20" x2="680" y1="125" y2="125" />
      <line stroke="#2a6f4f" strokeWidth="5" x1="70" x2="70" y1="125" y2="111" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x="70" y="150">specimen</text>
      <ellipse cx="170" cy="125" fill="#dbeeff" rx="9" ry="52" stroke="#5a8fc4" strokeWidth="3" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x="170" y="195">objective {o.objectiveMagnification.toFixed(1)}×</text>
      <line stroke="#d98a1f" strokeWidth="5" x1="400" x2="400" y1="125" y2={125 + Math.min(60, 14 * Math.sqrt(o.objectiveMagnification))} />
      <text className="balance-plot__pivot-label" textAnchor="middle" x="400" y="105">real image</text>
      <ellipse cx="500" cy="125" fill="#dbeeff" rx="8" ry="40" stroke="#5a8fc4" strokeWidth="3" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x="500" y="185">eyepiece {o.eyepieceMagnification.toFixed(1)}×</text>
      <text className="balance-plot__pivot-label" x="520" y="30">total {o.totalMagnification.toFixed(0)}×</text>
      <text className="balance-plot__pivot-label" x="520" y="50">{round.kind === "resolve" && o.resolutionNanometers !== null ? `resolves ${o.resolutionNanometers.toFixed(0)} nm` : `tube ${(control.tube as number).toFixed(0)} mm`}</text>
    </svg>
  );
}

export const MicroscopeBuilderPage = createNumericGamePage({
  definition: microscopeBuilder,
  measurements: (game) => {
    const o = runMicroscope(game.round, game.control);
    return [
      { label: "OBJECTIVE", value: `${o.objectiveMagnification.toFixed(1)}×` },
      { label: "EYEPIECE", value: `${o.eyepieceMagnification.toFixed(1)}×` },
      { label: "TOTAL", value: `${o.totalMagnification.toFixed(0)}×` },
      game.round.kind === "resolve"
        ? { label: "RESOLUTION LIMIT", value: o.resolutionNanometers !== null ? `${o.resolutionNanometers.toFixed(0)} nm` : "—" }
        : { label: "SPECIMEN DISTANCE", value: `${o.specimenDistanceMm.toFixed(2)} mm` },
    ];
  },
  visual: (game) => <MicroscopeView control={game.control} round={game.round} />,
});
