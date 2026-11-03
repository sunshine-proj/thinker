import { createNumericGamePage } from "../../../game-engine/rounds";
import { solarSystemBuilder } from "./solarSystemBuilder";

export const SolarSystemBuilderPage = createNumericGamePage({
  definition: solarSystemBuilder,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "SIMULATED PERIOD", value: o?.periodYears != null ? `${o.periodYears.toFixed(3)} years` : "—" },
      { label: "SEMI-MAJOR AXIS", value: o?.semiMajorAxisAu != null ? `${o.semiMajorAxisAu.toFixed(2)} AU` : "—" },
      { label: "STAR MASS", value: `${(game.control.star as number).toFixed(2)} Suns` },
      { label: "ENERGY DRIFT", value: o ? `${(o.energyDrift * 100).toExponential(1)} %` : "—" },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    const path = o?.path ?? [];
    const extent = Math.max(1, ...path.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));
    const scale = 105 / extent;
    const first = path[0];
    return (
      <svg aria-label={o ? `Orbit around the star, simulated period ${o.periodYears?.toFixed(2) ?? "unknown"} years.` : "The star at the center; run the simulation to see the orbit."} className="balance-plot" role="img" viewBox="0 0 700 250">
        <rect fill="#f9faff" height="250" rx="10" width="700" />
        <circle cx="350" cy="125" fill="#f2b84b" r="10" />
        {path.length > 1 && <polyline fill="none" points={path.map((p) => `${350 + p.x * scale},${125 - p.y * scale}`).join(" ")} stroke="#596be0" strokeWidth="2" />}
        {first && <circle cx={350 + first.x * scale} cy={125 - first.y * scale} fill="#2a6f4f" r="5" />}
        <text className="balance-plot__pivot-label" x="20" y="24">{o ? `orbit spans ${(extent * 2).toFixed(1)} AU` : "Run the simulation to draw the orbit"}</text>
      </svg>
    );
  },
});
