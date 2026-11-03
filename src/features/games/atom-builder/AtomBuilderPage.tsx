import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateBohrEnergy } from "../../../physics/quantum";
import { atomBuilder, runAtom, type AtomRound } from "./atomBuilder";
import type { NumericControl } from "../../../game-engine/rounds";

function LevelDiagram({ round, control }: { round: AtomRound; control: NumericControl }) {
  const o = runAtom(round, control);
  const y = (n: number) => 30 + 190 * (1 / (n * n));
  return (
    <svg aria-label={`Energy levels of an atom with ${o.atomicNumber} proton${o.atomicNumber > 1 ? "s" : ""}. ${o.wavelengthNm ? `Jump ${o.upper} to ${o.lower} emits ${o.wavelengthNm.toFixed(0)} nanometers.` : `Level ${o.upper} binds the electron with ${o.bindingEv.toFixed(2)} electron-volts.`}`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <g key={n}>
          <line stroke={n === o.upper || n === o.lower ? "#364057" : "#9aa5cf"} strokeWidth={n === o.upper || n === o.lower ? 3 : 1.5} x1="150" x2="450" y1={y(n)} y2={y(n)} />
          <text className="balance-plot__pivot-label" x="460" y={y(n) + 4}>n = {n} · {calculateBohrEnergy(o.atomicNumber, n).toFixed(2)} eV</text>
        </g>
      ))}
      {o.wavelengthNm !== null && <line stroke="#d98a1f" strokeWidth="4" x1="300" x2="300" y1={y(o.upper)} y2={y(o.lower)} />}
      {round.kind === "binding" && <line stroke="#d98a1f" strokeDasharray="5 4" strokeWidth="3" x1="300" x2="300" y1={y(o.upper)} y2="18" />}
      <text className="balance-plot__pivot-label" x="20" y="24">{o.wavelengthNm !== null ? `${o.wavelengthNm.toFixed(1)} nm · ${o.region}` : round.kind === "binding" ? `binding ${o.bindingEv.toFixed(2)} eV` : "no emission"}</text>
    </svg>
  );
}

export const AtomBuilderPage = createNumericGamePage({
  definition: atomBuilder,
  measurements: (game) => {
    const o = runAtom(game.round, game.control);
    return [
      { label: "PROTONS Z", value: String(o.atomicNumber) },
      { label: "PHOTON ENERGY", value: o.photonEv === null ? "—" : `${o.photonEv.toFixed(3)} eV` },
      { label: "WAVELENGTH", value: o.wavelengthNm === null ? "—" : `${o.wavelengthNm.toFixed(1)} nm` },
      { label: "BINDING ENERGY OF UPPER LEVEL", value: `${o.bindingEv.toFixed(2)} eV` },
    ];
  },
  visual: (game) => <LevelDiagram control={game.control} round={game.round} />,
});
