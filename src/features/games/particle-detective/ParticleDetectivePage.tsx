import { createNumericGamePage } from "../../../game-engine/rounds";
import { particleDetective, runTrack, type TrackRound } from "./particleDetective";
import type { NumericControl } from "../../../game-engine/rounds";

function TrackView({ round, control }: { round: TrackRound; control: NumericControl }) {
  const o = runTrack(round, control);
  const scale = 100 / o.measuredRadiusMeters;
  const r = Math.min(110, Math.max(4, o.radiusMeters * scale));
  return (
    <svg aria-label={`Detector view. The measured track has radius ${o.measuredRadiusMeters.toFixed(3)} meters; your particle would make a radius of ${o.radiusMeters.toFixed(3)} meters.`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <circle cx="230" cy="125" fill="none" r="100" stroke="#596be0" strokeWidth="3" />
      <circle cx="480" cy="125" fill="none" r={r} stroke="#d98a1f" strokeDasharray="6 4" strokeWidth="3" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x="230" y="240">measured r = {o.measuredRadiusMeters.toFixed(3)} m</text>
      <text className="balance-plot__pivot-label" textAnchor="middle" x="480" y="240">yours r = {o.radiusMeters.toFixed(3)} m</text>
      <text className="balance-plot__pivot-label" x="20" y="24">field points into the page (⊗)</text>
    </svg>
  );
}

export const ParticleDetectivePage = createNumericGamePage({
  definition: particleDetective,
  measurements: (game) => {
    const o = runTrack(game.round, game.control);
    return [
      { label: "MEASURED RADIUS", value: `${o.measuredRadiusMeters.toFixed(3)} m` },
      { label: "RADIUS OF YOUR PARTICLE", value: `${o.radiusMeters.toFixed(3)} m` },
      { label: "MAGNETIC FIELD", value: `${game.control.field} T` },
      { label: "MOMENTUM", value: o.momentumMeVc === null ? "—" : `${o.momentumMeVc.toFixed(2)} MeV/c` },
    ];
  },
  visual: (game) => <TrackView control={game.control} round={game.round} />,
});
