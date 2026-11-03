import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculatePressure } from "../../../physics/fluids";
import { runPressure, waterPressure } from "./waterPressure";

export const WaterPressurePage = createNumericGamePage({
  definition: waterPressure,
  measurements: (game) => {
    const o = runPressure(game.round, game.control);
    return [
      { label: "ABSOLUTE PRESSURE", value: `${(o.absolutePa / 1000).toFixed(0)} kPa` },
      { label: "IN ATMOSPHERES", value: `${(o.absolutePa / 101325).toFixed(2)} atm` },
      { label: "GAUGE PRESSURE", value: `${(o.gaugePa / 1000).toFixed(0)} kPa` },
      { label: "FORCE ON WINDOW", value: o.forceNewtons === null ? "—" : `${(o.forceNewtons / 1000).toFixed(1)} kN` },
    ];
  },
  visual: (game) => {
    const density = game.control.density as number;
    const depth = game.control.depth as number;
    const max = game.round.kind === "window" ? 150 : game.round.kind === "diver" ? 100 : 60;
    const points = Array.from({ length: 100 }, (_, i) => {
      const h = (max * i) / 99;
      return { x: h, y: calculatePressure(h, density) / 1000 };
    });
    const now = calculatePressure(depth, density) / 1000;
    return (
      <LineChart
        description={`Absolute pressure against depth; at ${depth} meters it is ${now.toFixed(0)} kilopascals.`}
        series={[{ label: "Pressure", points }, { label: "Your depth", dashed: true, points: [{ x: depth, y: 0 }, { x: depth, y: now }] }]}
        title="Pressure and depth"
        xDomain={[0, max]}
        xLabel="Depth (m)"
        yDomain={[0, calculatePressure(max, density) / 1000 * 1.05]}
        yLabel="Absolute pressure (kPa)"
      />
    );
  },
});
