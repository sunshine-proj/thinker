import { createNumericGamePage } from "../../../game-engine/rounds";
import { BEAM, HULL_DEPTH, runShip, shipDesigner, type ShipRound } from "./shipDesigner";
import type { NumericControl } from "../../../game-engine/rounds";

function HullView({ round, control }: { round: ShipRound; control: NumericControl }) {
  const o = runShip(round, control);
  const beam = round.kind === "stability" ? (control.beam as number) : BEAM;
  const scale = 22;
  const w = beam * scale;
  const depth = HULL_DEPTH * scale;
  const waterY = 110;
  const x = 350 - w / 2;
  const top = waterY - (o.freeboardMeters) * scale;
  return (
    <svg aria-label={`Barge cross-section: beam ${beam.toFixed(2)} meters, draft ${o.draftMeters.toFixed(2)} meters, freeboard ${o.freeboardMeters.toFixed(2)} meters.`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <rect fill="#dbeeff" height="140" width="660" x="20" y={waterY} />
      <rect fill="#f2d7a6" height={depth} stroke="#364057" strokeWidth="3" width={w} x={x} y={top} />
      <line stroke="#2a6f4f" strokeWidth="3" x1="20" x2="680" y1={waterY} y2={waterY} />
      <text className="balance-plot__pivot-label" x="30" y="24">draft {o.draftMeters.toFixed(2)} m · freeboard {o.freeboardMeters.toFixed(2)} m · {o.massTonnes.toFixed(0)} t</text>
      {o.freeboardMeters < 0 && <text className="balance-plot__pivot-label" x="30" y="44">the deck is under water: sinking</text>}
    </svg>
  );
}

export const ShipDesignerPage = createNumericGamePage({
  definition: shipDesigner,
  measurements: (game) => {
    const o = runShip(game.round, game.control);
    return [
      { label: "TOTAL MASS", value: `${o.massTonnes.toFixed(0)} t` },
      { label: "DRAFT", value: `${o.draftMeters.toFixed(2)} m` },
      { label: "FREEBOARD", value: `${o.freeboardMeters.toFixed(2)} m` },
      { label: "METACENTRIC HEIGHT", value: o.metacentricHeight === null ? "—" : `${o.metacentricHeight.toFixed(2)} m` },
    ];
  },
  visual: (game) => <HullView control={game.control} round={game.round} />,
});
