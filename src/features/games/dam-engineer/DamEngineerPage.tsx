import { createNumericGamePage } from "../../../game-engine/rounds";
import { damEngineer, runDam, type DamRound } from "./damEngineer";
import type { NumericControl } from "../../../game-engine/rounds";

function DamView({ round, control }: { round: DamRound; control: NumericControl }) {
  const o = runDam(round, control);
  const scale = 11;
  const base = 235;
  const h = (control.damHeight as number) * scale;
  const w = (control.thickness as number) * scale;
  const water = (control.waterDepth as number) * scale;
  const x = 330;
  return (
    <svg aria-label={`Dam ${(control.thickness as number).toFixed(2)} meters thick holding ${(control.waterDepth as number)} meters of water. Safety factor ${o.safetyFactor.toFixed(2)}.`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <polygon fill="#bcdcff" points={`30,${base} ${x},${base} ${x},${base - water} 30,${base - water}`} />
      <rect fill="#a8a8b3" height={h} stroke="#364057" strokeWidth="3" width={w} x={x} y={base - h} />
      <line stroke="#d63a3a" strokeWidth="4" x1="250" x2={x - 4} y1={base - water / 3} y2={base - water / 3} />
      <text className="balance-plot__pivot-label" x="40" y="24">F = {(o.forceNewtons / 1000).toFixed(0)} kN/m at h/3 · SF = {o.safetyFactor.toFixed(2)}</text>
      <circle cx={x + w} cy={base} fill="#364057" r="4" />
      <text className="balance-plot__pivot-label" x={x + w + 8} y={base - 6}>toe</text>
    </svg>
  );
}

export const DamEngineerPage = createNumericGamePage({
  definition: damEngineer,
  measurements: (game) => {
    const o = runDam(game.round, game.control);
    return [
      { label: "WATER FORCE", value: `${(o.forceNewtons / 1000).toFixed(0)} kN/m` },
      { label: "OVERTURNING MOMENT", value: `${(o.overturningMoment / 1000).toFixed(0)} kN·m/m` },
      { label: "RESISTING MOMENT", value: `${(o.resistingMoment / 1000).toFixed(0)} kN·m/m` },
      { label: "SAFETY FACTOR", value: o.safetyFactor.toFixed(2) },
    ];
  },
  visual: (game) => <DamView control={game.control} round={game.round} />,
});
