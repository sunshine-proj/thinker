import { createNumericGamePage } from "../../../game-engine/rounds";
import { visionSimulator, type VisionRound } from "./visionSimulator";

const MAX = 5;
const x = (diopters: number) => 60 + (Math.max(0, Math.min(MAX, diopters)) / MAX) * 560;

function Band({ lower, upper, y, label, className }: { lower: number; upper: number; y: number; label: string; className: string }) {
  const lo = Math.max(0, lower);
  const hi = Math.max(0, upper);
  return (
    <g>
      <rect className={className} height="26" width={Math.max(2, x(hi) - x(lo))} x={x(lo)} y={y} />
      <text className="balance-plot__pivot-label" x="62" y={y - 6}>{label}</text>
    </g>
  );
}

function Ranges({ round, lens, add, solved }: { round: VisionRound; lens: number; add: number; solved: boolean }) {
  const { eye } = round;
  const lower = eye.refractiveErrorDiopters + lens;
  const nearLower = lower + add;
  return (
    <svg
      aria-label={`Range of clear vision in diopters, where an object at distance d has vergence 1 over d. With the lens, distance vision is clear from ${lower.toFixed(2)} to ${(lower + eye.accommodationDiopters).toFixed(2)} diopters; for close work from ${nearLower.toFixed(2)} to ${(nearLower + eye.accommodationDiopters).toFixed(2)} diopters. The far test object is at ${(1 / round.farDistanceMeters).toFixed(2)} diopters and the near test object at ${(1 / round.nearDistanceMeters).toFixed(2)} diopters.`}
      className="balance-plot"
      role="img"
      viewBox="0 0 700 250"
    >
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      {[0, 1, 2, 3, 4, 5].map((d) => (
        <g className="balance-plot__tick" key={d}><line stroke="#e1e5f0" x1={x(d)} x2={x(d)} y1="20" y2="190" /><text textAnchor="middle" x={x(d)} y="208">{d}</text></g>
      ))}
      <text className="balance-plot__pivot-label" textAnchor="middle" x="340" y="235">Vergence of the object, 1/distance (diopters): 0 = infinity</text>
      {solved && <Band className="vision-band vision-band--plain" label="Without lenses" lower={eye.refractiveErrorDiopters} upper={eye.refractiveErrorDiopters + eye.accommodationDiopters} y={50} />}
      <Band className="vision-band" label="Clear with the distance lens" lower={lower} upper={lower + eye.accommodationDiopters} y={95} />
      {add > 0 && <Band className="vision-band vision-band--add" label="Clear with the reading addition" lower={nearLower} upper={nearLower + eye.accommodationDiopters} y={140} />}
      {[{ d: 1 / round.farDistanceMeters, label: `${round.farDistanceMeters} m` }, { d: 1 / round.nearDistanceMeters, label: `${round.nearDistanceMeters} m` }].map((o) => (
        <g key={o.label}><line stroke="#d63a3a" strokeWidth="3" x1={x(o.d)} x2={x(o.d)} y1="30" y2="185" /><text className="balance-plot__pivot-label" fill="#d63a3a" x={x(o.d) + 4} y="40">object at {o.label}</text></g>
      ))}
    </svg>
  );
}

export const VisionSimulatorPage = createNumericGamePage({
  definition: visionSimulator,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "BLUR AT FAR TEST", value: o ? `${o.farDefocus.toFixed(2)} D` : "—" },
      { label: "BLUR AT NEAR TEST", value: o ? `${o.nearDefocus.toFixed(2)} D` : "—" },
      { label: "UNCORRECTED FAR POINT", value: o ? (Number.isFinite(o.uncorrectedFarPoint) ? `${o.uncorrectedFarPoint.toFixed(2)} m` : "infinity") : "—" },
      { label: "UNCORRECTED NEAR POINT", value: o ? (Number.isFinite(o.uncorrectedNearPoint) ? `${o.uncorrectedNearPoint.toFixed(2)} m` : "—") : "—" },
    ];
  },
  visual: (game) => <Ranges add={game.control.add as number} lens={game.control.distance as number} round={game.round} solved={!!game.last} />,
});
