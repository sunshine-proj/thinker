import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { VALLEY, isotopeExplorer, runIsotope } from "./isotopeExplorer";

export const IsotopeExplorerPage = createNumericGamePage({
  definition: isotopeExplorer,
  measurements: (game) => {
    const o = runIsotope(game.round, game.control);
    return [
      { label: "PROTONS Z", value: String(o.protons) },
      { label: "NEUTRONS N", value: String(o.neutrons) },
      { label: "MASS NUMBER A", value: String(o.protons + o.neutrons) },
      { label: "KNOWN NUCLIDE", value: o.symbol ?? "not in the table" },
    ];
  },
  visual: (game) => {
    const o = runIsotope(game.round, game.control);
    return (
      <LineChart
        description={`Chart of nuclides: protons against neutrons, with the valley of stability as a line. Your nucleus has ${o.protons} protons and ${o.neutrons} neutrons.`}
        series={[{ label: "Valley of stability", points: VALLEY }, { label: "N = Z", dashed: true, points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }, { label: "Your nucleus", points: [{ x: o.neutrons - 1.5, y: o.protons }, { x: o.neutrons + 1.5, y: o.protons }] }]}
        title="Chart of nuclides"
        xDomain={[0, 150]}
        xLabel="Neutrons N"
        yDomain={[0, 100]}
        yLabel="Protons Z"
      />
    );
  },
});
