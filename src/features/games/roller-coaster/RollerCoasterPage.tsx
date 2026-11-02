import { createNumericGamePage } from "../../../game-engine/rounds";
import { rollerCoaster } from "./rollerCoaster";

export const RollerCoasterPage = createNumericGamePage({
  definition: rollerCoaster,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "SPEED AT BOTTOM", value: o?.bottomSpeed != null ? `${o.bottomSpeed.toFixed(1)} m/s` : "—" },
      { label: "G-FORCE AT BOTTOM", value: o?.bottomG != null ? `${o.bottomG.toFixed(2)} g` : "—" },
      { label: "G-FORCE AT TOP", value: o?.topG != null ? `${o.topG.toFixed(2)} g` : "—" },
      { label: "G-FORCE LIMITS", value: `top ≥ ${game.round.minimumTopG} · bottom ≤ ${game.round.maximumBottomG}` },
    ];
  },
  visual: (game) => {
    const h = game.control.height as number;
    const R = game.control.radius as number;
    const scale = 200 / Math.max(h, 4 * R);
    const ground = 250;
    const loopX = 520;
    return (
      <svg
        aria-label={`Roller coaster: a hill ${h.toFixed(1)} meters high leading to a vertical loop of radius ${R} meters.`}
        className="balance-plot"
        role="img"
        viewBox="0 0 960 280"
      >
        <rect fill="#f9faff" height="280" rx="10" width="960" />
        <polyline fill="none" stroke="#505a70" strokeWidth="4" points={`60,${ground - h * scale} 300,${ground} ${loopX - R * scale},${ground}`} />
        <circle cx={loopX} cy={ground - R * scale} fill="none" r={R * scale} stroke="#505a70" strokeWidth="4" />
        <line stroke="#505a70" strokeWidth="4" x1={loopX + R * scale} x2={900} y1={ground} y2={ground} />
        <circle cx="60" cy={ground - h * scale} fill="#d63a3a" r="7" />
        <text className="balance-plot__pivot-label" x="72" y={ground - h * scale - 10}>start: {h.toFixed(1)} m</text>
      </svg>
    );
  },
  details: (game) => {
    const o = game.last?.outcome;
    return o && o.points.length > 0 ? (
      <table className="circuit-readings">
        <caption>POINTS ON THE TRACK</caption>
        <thead><tr><th scope="col">Point</th><th scope="col">Height</th><th scope="col">Speed</th><th scope="col">Seat force</th></tr></thead>
        <tbody>
          {o.points.map((p) => (
            <tr key={p.label}><td>{p.label}</td><td>{p.heightMeters.toFixed(1)} m</td><td>{p.speed === null ? "falls off" : `${p.speed.toFixed(1)} m/s`}</td><td>{p.gForce === null ? "—" : `${p.gForce.toFixed(2)} g`}</td></tr>
          ))}
        </tbody>
      </table>
    ) : null;
  },
});
