import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { SOLAR_MASS, calculateSchwarzschildRadius, calculateTimeDilationFactor } from "../../../physics/astronomy";
import { blackHoleExplorer, runHole } from "./blackHoleExplorer";

export const BlackHoleExplorerPage = createNumericGamePage({
  definition: blackHoleExplorer,
  measurements: (game) => {
    const o = runHole(game.round, game.control);
    return [
      { label: "EVENT HORIZON", value: `${o.horizonKm.toFixed(1)} km` },
      { label: "CLOCK RATE", value: o.timeFactor === null || game.round.kind === "horizon" ? "—" : o.timeFactor.toFixed(3) },
      { label: "PHOTON SPHERE", value: `${(1.5 * o.horizonKm).toFixed(1)} km` },
      { label: "CLOSEST STABLE ORBIT", value: `${o.iscoKm.toFixed(1)} km` },
    ];
  },
  visual: (game) => {
    const rs = calculateSchwarzschildRadius((game.control.mass as number) * SOLAR_MASS);
    const points = Array.from({ length: 200 }, (_, i) => {
      const r = rs * (1.001 + (i * (10 - 1.001)) / 199);
      return { x: r / 1000, y: calculateTimeDilationFactor(r, rs) };
    });
    const marker = game.round.kind === "horizon" ? [] : [{ label: "Your radius", points: [{ x: game.control.radius as number, y: 0 }, { x: game.control.radius as number, y: 1 }], dashed: true }];
    return (
      <LineChart
        description={`Rate of a clock at rest against radius, from the horizon at ${(rs / 1000).toFixed(1)} kilometers outward; it falls to zero at the horizon.`}
        series={[{ label: "Clock rate", points }, ...marker]}
        title="Time dilation near the black hole"
        xDomain={[rs / 1000, (10 * rs) / 1000]}
        xLabel="Radius (km)"
        yDomain={[0, 1.05]}
        yLabel="Clock rate (distant = 1)"
      />
    );
  },
});
