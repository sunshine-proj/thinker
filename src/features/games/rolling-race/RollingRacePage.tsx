import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { SHAPE_FACTORS, SHAPE_NAMES, calculateRollingAcceleration, calculateRollingTime, type RollingShape } from "../../../physics/mechanics";
import { RACE, RAMP, SKATER, rollingRace, runRoll } from "./rollingRace";

const SHAPES = Object.keys(SHAPE_FACTORS) as RollingShape[];

export const RollingRacePage = createNumericGamePage({
  definition: rollingRace,
  measurements: (game) => {
    const o = runRoll(game.round, game.control);
    if (game.round.kind === "headstart") {
      return [
        { label: "DISC TIME", value: `${calculateRollingTime(RACE.length, SHAPE_FACTORS.disc, RACE.slope).toFixed(3)} s` },
        { label: "HOOP TIME", value: `${calculateRollingTime(RACE.length - (game.control.headStart as number), SHAPE_FACTORS.hoop, RACE.slope).toFixed(3)} s` },
        { label: "GAP AT THE FINISH", value: `${o.headline.toFixed(3)} s` },
      ];
    }
    if (game.round.kind === "ramp") {
      return [
        { label: "ACCELERATION", value: `${calculateRollingAcceleration(SHAPE_FACTORS["solid-sphere"], game.control.angle as number).toFixed(2)} m/s²` },
        { label: "ROLLING TIME", value: `${o.headline.toFixed(3)} s` },
        { label: "TARGET", value: `${RAMP.time} s` },
      ];
    }
    return [
      { label: "ANGULAR MOMENTUM", value: `${(SKATER.armsOut * SKATER.initialSpin).toFixed(1)} kg·m²·rev/s` },
      { label: "YOUR SPIN", value: `${(game.control.spin as number).toFixed(2)} rev/s` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "skater") {
      const points = Array.from({ length: 60 }, (_, i) => {
        const inertia = 1 + (3 * i) / 59;
        return { x: inertia, y: (SKATER.armsOut * SKATER.initialSpin) / inertia };
      });
      return <LineChart description="Spin rate against moment of inertia at constant angular momentum: halving the moment of inertia doubles the spin." series={[{ label: "Spin at constant L", points }, { label: "Arms in", dashed: true, points: [{ x: SKATER.armsIn, y: 0 }, { x: SKATER.armsIn, y: 12 }] }]} title="Pulling the arms in" xDomain={[1, 4]} xLabel="Moment of inertia (kg·m²)" yDomain={[0, 12]} yLabel="Spin (rev/s)" />;
    }
    const slope = game.round.kind === "ramp" ? (game.control.angle as number) : RACE.slope;
    const series = SHAPES.map((shape, index) => ({
      label: SHAPE_NAMES[shape],
      dashed: index % 2 === 1,
      points: Array.from({ length: 41 }, (_, i) => {
        const t = (2.5 * i) / 40;
        return { x: t, y: 0.5 * calculateRollingAcceleration(SHAPE_FACTORS[shape], slope) * t * t };
      }),
    }));
    return <LineChart description={`Distance rolled against time for four shapes on a ${slope.toFixed(1)} degree ramp. The solid sphere is fastest and the hoop slowest, whatever their masses.`} series={series} title="The rolling race" xDomain={[0, 2.5]} xLabel="Time (s)" yDomain={[0, 4]} yLabel="Distance (m)" />;
  },
});
