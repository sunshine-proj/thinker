import { createNumericGamePage } from "../../../game-engine/rounds";
import { runMission, type MissionRound } from "./asteroidMission";
import { asteroidMission } from "./asteroidMission";
import type { NumericControl } from "../../../game-engine/rounds";

function MissionView({ round, control }: { round: MissionRound; control: NumericControl }) {
  const o = runMission(round, control);
  const far = Math.max(1.5, o.apoapsisAu ?? 1.5);
  const s = 100 / far;
  const cx = 350;
  const cy = 125;
  const apo = o.apoapsisAu ?? far;
  const ellipse = { x: cx + ((1 - apo) / 2) * s, rx: ((1 + apo) / 2) * s, ry: Math.sqrt(apo) * s };
  const lead = (o.leadAngleDegrees * Math.PI) / 180;
  return (
    <svg aria-label={`Transfer orbit from Earth at 1 AU to a far point of ${apo.toFixed(2)} AU. ${o.transferDays ? `Coasting time ${o.transferDays.toFixed(0)} days.` : "The probe escapes."}`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <circle cx={cx} cy={cy} fill="none" r={s} stroke="#9aa5cf" />
      <circle cx={cx} cy={cy} fill="none" r={1.5 * s} stroke="#d98a1f" strokeDasharray="4 4" />
      {o.apoapsisAu !== null && <ellipse cx={ellipse.x} cy={cy} fill="none" rx={ellipse.rx} ry={ellipse.ry} stroke="#596be0" strokeWidth="2.5" />}
      <circle cx={cx} cy={cy} fill="#f2b84b" r="9" />
      <circle cx={cx + s} cy={cy} fill="#2a6f4f" r="5" />
      <text className="balance-plot__pivot-label" x={cx + s + 8} y={cy + 4}>Earth</text>
      {round.kind === "window" && <circle cx={cx + 1.5 * s * Math.cos(lead)} cy={cy - 1.5 * s * Math.sin(lead)} fill="#d63a3a" r="5" />}
      <text className="balance-plot__pivot-label" x="20" y="24">dashed: asteroid orbit (1.5 AU)</text>
    </svg>
  );
}

export const AsteroidMissionPage = createNumericGamePage({
  definition: asteroidMission,
  measurements: (game) => {
    const o = runMission(game.round, game.control);
    return [
      { label: "FAR POINT", value: o.apoapsisAu === null ? "escapes" : `${o.apoapsisAu.toFixed(2)} AU` },
      { label: "COASTING TIME", value: o.transferDays === null ? "—" : `${o.transferDays.toFixed(0)} days` },
      { label: "DEPARTURE BURN", value: `${(o.departureDeltaV / 1000).toFixed(2)} km/s` },
      { label: "EARTH'S SPEED", value: "29.78 km/s" },
    ];
  },
  visual: (game) => <MissionView control={game.control} round={game.round} />,
});
