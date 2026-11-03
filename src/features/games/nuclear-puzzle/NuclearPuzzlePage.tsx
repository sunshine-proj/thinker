import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { bindingPerNucleonAt, nuclearPuzzle, runNuclear } from "./nuclearPuzzle";

const CURVE = Array.from({ length: 247 }, (_, i) => ({ x: i + 4, y: bindingPerNucleonAt(i + 4) }));

export const NuclearPuzzlePage = createNumericGamePage({
  definition: nuclearPuzzle,
  measurements: (game) => {
    const o = runNuclear(game.round, game.control);
    if (game.round.kind === "peak") {
      return [
        { label: "MASS NUMBER", value: String(game.control.mass) },
        { label: "BINDING PER NUCLEON", value: `${o.perNucleon?.toFixed(2)} MeV` },
        { label: "MAXIMUM", value: `${o.truth.toFixed(2)} MeV` },
        { label: "BELOW MAXIMUM", value: `${(o.truth - (o.perNucleon ?? 0)).toFixed(2)} MeV` },
      ];
    }
    return [
      { label: "YOUR ANSWER", value: `${game.control.energy} MeV` },
      { label: "ENERGY PER NUCLEON", value: game.round.kind === "helium" ? "7.07 MeV (He-4)" : "7.59 MeV (U-235)" },
      { label: "CONVERSION", value: "931.494 MeV per u" },
      { label: "REACTION", value: game.round.kind === "helium" ? "2p + 2n → He-4" : "U-235 + n → Ba-141 + Kr-92 + 3n" },
    ];
  },
  visual: (game) => {
    const mark = game.round.kind === "peak" ? (game.control.mass as number) : game.round.kind === "helium" ? 4 : 235;
    return (
      <LineChart
        description="Binding energy per nucleon against mass number from the liquid-drop model: it rises steeply, peaks near iron and nickel at about 8.8 MeV, then falls slowly."
        series={[{ label: "Binding energy per nucleon", points: CURVE }, { label: game.round.kind === "peak" ? "Your A" : "This nucleus", dashed: true, points: [{ x: mark, y: 0 }, { x: mark, y: 9.5 }] }]}
        title="Binding energy per nucleon"
        xDomain={[0, 250]}
        xLabel="Mass number A"
        yDomain={[0, 10]}
        yLabel="B/A (MeV)"
      />
    );
  },
});
