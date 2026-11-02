import { createNumericGamePage } from "../../../game-engine/rounds";
import { BODY_HEIGHT, EYE_HEIGHT, mirrorIllusions, runMirror, type MirrorRound } from "./mirrorIllusions";
import type { NumericControl } from "../../../game-engine/rounds";

function PlaneView({ control }: { control: NumericControl }) {
  const scale = 100;
  const floor = 220;
  const y = (h: number) => floor - h * scale;
  const bottom = control.bottom as number;
  const top = bottom + (control.height as number);
  return (
    <svg aria-label={`A person 1.8 meters tall with eyes at 1.7 meters in front of a plane mirror from ${bottom.toFixed(2)} to ${top.toFixed(2)} meters above the floor.`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <line stroke="#9aa5cf" x1="30" x2="670" y1={floor} y2={floor} />
      <rect fill="#dbeeff" height={(top - bottom) * scale} stroke="#5a8fc4" strokeWidth="3" width="10" x="500" y={y(top)} />
      <line stroke="#364057" strokeWidth="6" x1="240" x2="240" y1={y(0)} y2={y(BODY_HEIGHT)} />
      <circle cx="240" cy={y(EYE_HEIGHT)} fill="#364057" r="6" />
      <line stroke="#d63a3a" strokeDasharray="4 4" x1="240" x2="500" y1={y(EYE_HEIGHT)} y2={y(EYE_HEIGHT / 2)} />
      <line stroke="#d63a3a" strokeDasharray="4 4" x1="240" x2="500" y1={y(EYE_HEIGHT)} y2={y((EYE_HEIGHT + BODY_HEIGHT) / 2)} />
      <text className="balance-plot__pivot-label" x="520" y={y(top) + 12}>mirror {bottom.toFixed(2)}–{top.toFixed(2)} m</text>
      <text className="balance-plot__pivot-label" x="520" y="30">dashed: rays from feet and head</text>
    </svg>
  );
}

function CurvedView({ round, control }: { round: MirrorRound; control: NumericControl }) {
  const o = runMirror(round, control);
  const f = o.focalLengthMeters ?? 0;
  const span = round.kind === "convex" ? 32 : 0.7;
  const px = (d: number) => 560 - (d / span) * 480;
  const di = o.imageDistanceMeters;
  const objectX = px(control.distance as number);
  return (
    <svg aria-label={`${round.kind === "convex" ? "Convex" : "Concave"} mirror, focal length ${f.toFixed(2)} meters, object ${(control.distance as number).toFixed(2)} meters away. ${di === null ? "No image forms." : `${di < 0 ? "Virtual upright" : "Real inverted"} image ${Math.abs(di).toFixed(2)} meters ${di < 0 ? "behind" : "in front of"} the mirror, magnification ${o.magnification?.toFixed(3)}.`}`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <line stroke="#9aa5cf" strokeDasharray="4 4" x1="30" x2="660" y1="130" y2="130" />
      <path d={round.kind === "convex" ? "M 560 60 Q 590 130 560 200" : "M 560 60 Q 530 130 560 200"} fill="none" stroke="#364057" strokeWidth="5" />
      <line stroke="#2a6f4f" strokeWidth="4" x1={objectX} x2={objectX} y1="130" y2="90" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x={objectX} y="150">object</text>
      {di !== null && o.magnification !== null && (
        <g>
          <line stroke="#d98a1f" strokeDasharray={di < 0 ? "6 4" : undefined} strokeWidth="4" x1={px(di)} x2={px(di)} y1="130" y2={130 - 40 * o.magnification} />
          <text className="balance-plot__pivot-label" textAnchor="middle" x={Math.min(650, Math.max(40, px(di)))} y="175">{di < 0 ? "virtual image" : "real image"}</text>
        </g>
      )}
      <circle cx={px(f)} cy="130" fill="#364057" r="3" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x={px(f)} y="120">F</text>
    </svg>
  );
}

export const MirrorIllusionsPage = createNumericGamePage({
  definition: mirrorIllusions,
  measurements: (game) => {
    const o = game.last?.outcome;
    if (game.round.kind === "plane") {
      return [
        { label: "MIRROR HEIGHT", value: `${(game.control.height as number).toFixed(2)} m` },
        { label: "LOWER EDGE", value: `${(game.control.bottom as number).toFixed(2)} m` },
        { label: "UPPER EDGE", value: `${((game.control.bottom as number) + (game.control.height as number)).toFixed(2)} m` },
        { label: "BODY / EYES", value: `${BODY_HEIGHT} m / ${EYE_HEIGHT} m` },
      ];
    }
    return [
      { label: "FOCAL LENGTH", value: o?.focalLengthMeters != null ? `${o.focalLengthMeters.toFixed(2)} m` : "—" },
      { label: "IMAGE DISTANCE", value: o?.imageDistanceMeters != null ? `${o.imageDistanceMeters.toFixed(2)} m${o.imageDistanceMeters < 0 ? " (virtual)" : ""}` : "—" },
      { label: "MAGNIFICATION", value: o?.magnification != null ? `${o.magnification.toFixed(3)}×` : "—" },
      { label: "IMAGE", value: o?.imageDistanceMeters != null ? (o.imageDistanceMeters < 0 ? "upright" : "inverted") : "—" },
    ];
  },
  visual: (game) => (game.round.kind === "plane" ? <PlaneView control={game.control} /> : <CurvedView control={game.control} round={game.round} />),
});
