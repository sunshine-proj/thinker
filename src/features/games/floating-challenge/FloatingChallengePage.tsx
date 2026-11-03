import { createNumericGamePage } from "../../../game-engine/rounds";
import { floatingChallenge, runFloat } from "./floatingChallenge";

export const FloatingChallengePage = createNumericGamePage({
  definition: floatingChallenge,
  measurements: (game) => {
    const o = runFloat(game.round, game.control);
    return [
      { label: "OBJECT DENSITY", value: `${o.objectDensity.toFixed(0)} kg/m³` },
      { label: "FLUID DENSITY", value: `${o.fluidDensity.toFixed(0)} kg/m³` },
      { label: "SUBMERGED", value: `${(o.submergedFraction * 100).toFixed(1)} %` },
      { label: "RESULT", value: o.floating ? "floats" : "sinks" },
    ];
  },
  visual: (game) => {
    const o = runFloat(game.round, game.control);
    const size = 90;
    const water = 130;
    const top = o.floating ? water - size * (1 - o.submergedFraction) : 200 - size + 20;
    return (
      <svg aria-label={`The object is ${(o.submergedFraction * 100).toFixed(0)} percent submerged and ${o.floating ? "floats" : "sinks"}.`} className="balance-plot" role="img" viewBox="0 0 700 250">
        <rect fill="#f9faff" height="250" rx="10" width="700" />
        <rect fill="#dbeeff" height={120} width="660" x="20" y={water} />
        <line stroke="#2a6f4f" strokeWidth="3" x1="20" x2="680" y1={water} y2={water} />
        <rect fill="#f2d7a6" height={size} stroke="#364057" strokeWidth="3" width={size} x="305" y={o.floating ? top : 150} />
        <text className="balance-plot__pivot-label" x="30" y="30">{(o.submergedFraction * 100).toFixed(1)} % submerged · ρ_object / ρ_fluid = {(o.objectDensity / o.fluidDensity).toFixed(3)}</text>
      </svg>
    );
  },
});
