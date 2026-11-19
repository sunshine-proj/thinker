import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { STEEL_DENSITY } from "../../../physics/core";
import { VISCOUS_FLUIDS, calculateSphereReynolds, calculateStokesTerminalSpeed } from "../../../physics/fluids";
import { GLYCEROL, MARK_DISTANCE, MEASURE_ROUND, honeyDropRace, runHoney } from "./honeyDropRace";

export const HoneyDropRacePage = createNumericGamePage({
  definition: honeyDropRace,
  measurements: (game) => {
    const o = runHoney(game.round, game.control);
    if (game.round.kind === "glycerol") {
      return [{ label: "TERMINAL SPEED", value: `${o.headline.toFixed(1)} mm/s` }, { label: "YOUR TIME", value: `${(game.control.time as number).toFixed(1)} s` }];
    }
    if (game.round.kind === "honey") {
      return [{ label: "MEASURED SPEED", value: `${((MARK_DISTANCE / MEASURE_ROUND.fallSeconds) * 1000).toFixed(1)} mm/s` }, { label: "YOUR VISCOSITY", value: `${(game.control.viscosity as number).toFixed(2)} Pa·s` }];
    }
    return [{ label: "REYNOLDS NUMBER", value: o.headline.toFixed(2) }];
  },
  visual: (game) => {
    if (game.round.kind === "validity") {
      const points = Array.from({ length: 76 }, (_, i) => {
        const mm = 0.5 + (7.5 * i) / 75;
        const r = mm / 1000;
        return { x: mm, y: Math.log10(calculateSphereReynolds(GLYCEROL.density, calculateStokesTerminalSpeed(STEEL_DENSITY, GLYCEROL.density, r, GLYCEROL.viscosity), r, GLYCEROL.viscosity)) };
      });
      const mm = game.control.radius as number;
      return <LineChart description="Logarithm of the Reynolds number of a steel ball in glycerol against its radius; it rises as the cube of the radius and crosses 1 (zero on this scale) near 3.8 millimetres." series={[{ label: "log₁₀ Re", points }, { label: "Re = 1", dashed: true, points: [{ x: 0.5, y: 0 }, { x: 8, y: 0 }] }, { label: "Your ball", dashed: true, points: [{ x: mm, y: -3 }, { x: mm, y: 2 }] }]} title="When does Stokes' law hold?" xDomain={[0.5, 8]} xLabel="Ball radius (mm)" yDomain={[-3, 2]} yLabel="log₁₀ Reynolds number" />;
    }
    const radius = game.round.kind === "honey" ? MEASURE_ROUND.radiusMm / 1000 : 1e-3;
    const series = VISCOUS_FLUIDS.filter((fluid) => fluid.id !== "water").map((fluid, index) => ({
      label: fluid.id === "honey" && game.round.kind === "honey" ? `Honey (your μ = ${(game.control.viscosity as number).toFixed(1)} Pa·s)` : fluid.name,
      dashed: index % 2 === 1,
      points: Array.from({ length: 31 }, (_, i) => {
        const t = (30 * i) / 30;
        const viscosity = fluid.id === "honey" && game.round.kind === "honey" ? (game.control.viscosity as number) : fluid.viscosity;
        return { x: t, y: Math.min(MARK_DISTANCE, calculateStokesTerminalSpeed(STEEL_DENSITY, fluid.density, radius, viscosity) * t) * 100 };
      }),
    }));
    return <LineChart description={`Distance sunk against time for a steel ball in oil, glycerol and honey. The thicker the liquid, the slower it sinks.`} series={series} title="The drop race" xDomain={[0, 30]} xLabel="Time (s)" yDomain={[0, MARK_DISTANCE * 100]} yLabel="Distance sunk (cm)" />;
  },
});
