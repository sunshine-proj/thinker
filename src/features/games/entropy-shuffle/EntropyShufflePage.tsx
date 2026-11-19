import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { createSeededRandom } from "../../../physics/nuclear";
import { calculateAllOnOneSideProbability, calculateSplitProbability, simulateEhrenfest } from "../../../physics/thermodynamics";
import { ENTROPY_TOTAL, LIKELY_TOTAL, entropyShuffle, runEntropy } from "./entropyShuffle";

export const EntropyShufflePage = createNumericGamePage({
  definition: entropyShuffle,
  measurements: (game) => {
    const o = runEntropy(game.round, game.control);
    if (game.round.kind === "unlikely") {
      const n = game.control.particles as number;
      return [
        { label: "ARRANGEMENTS", value: `${2 ** n}` },
        { label: "CHANCE ALL ON THE LEFT", value: `${(o.headline * 100).toPrecision(3)} %` },
      ];
    }
    if (game.round.kind === "likely") {
      const n = game.control.left as number;
      return [
        { label: "MICROSTATES", value: `${o.headline}` },
        { label: "PROBABILITY", value: `${(calculateSplitProbability(LIKELY_TOTAL, n) * 100).toFixed(1)} %` },
      ];
    }
    return [
      { label: "YOUR ΔS", value: `${(game.control.deltaS as number).toFixed(2)} k` },
      { label: "IN J/K", value: `${((game.control.deltaS as number) * 1.380649e-23).toExponential(2)} J/K` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "unlikely") {
      const points = Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: Math.log10(calculateAllOnOneSideProbability(i + 1)) }));
      return <LineChart description="Logarithm of the chance that all particles are on the left, against the number of particles. Each extra particle halves the chance." series={[{ label: "log₁₀ P(all left)", points }, { label: "1 %", dashed: true, points: [{ x: 1, y: -2 }, { x: 20, y: -2 }] }]} title="All on one side" xDomain={[1, 20]} xLabel="Particles" yDomain={[-7, 0]} yLabel="log₁₀ probability" />;
    }
    if (game.round.kind === "likely") {
      const points = Array.from({ length: LIKELY_TOTAL + 1 }, (_, n) => ({ x: n, y: calculateSplitProbability(LIKELY_TOTAL, n) }));
      return <LineChart description="Probability of each split of 10 particles; the even 5 to 5 split is the most likely." series={[{ label: "Probability", points }]} title="Which split is most likely?" xDomain={[0, LIKELY_TOTAL]} xLabel="Particles on the left" yDomain={[0, 0.3]} yLabel="Probability" />;
    }
    // A seeded random shuffle (Ehrenfest model), the same every time the page is drawn.
    const history = simulateEhrenfest(ENTROPY_TOTAL, 200, createSeededRandom(2026));
    return <LineChart description="A random shuffle of 20 particles starting all on the left. One random particle hops each step; the count soon wanders around 10 and never returns to 20." series={[{ label: "Particles on the left", points: history.map((y, x) => ({ x, y })) }, { label: "Even split", dashed: true, points: [{ x: 0, y: 10 }, { x: 200, y: 10 }] }]} title="Watch the gas spread" xDomain={[0, 200]} xLabel="Step" yDomain={[0, 20]} yLabel="Particles on the left" />;
  },
});
