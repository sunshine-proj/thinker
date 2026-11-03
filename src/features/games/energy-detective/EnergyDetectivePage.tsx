import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { energyDetective, runEnergy } from "./energyDetective";

export const EnergyDetectivePage = createNumericGamePage({
  definition: energyDetective,
  measurements: (game) => {
    const o = runEnergy(game.round, game.control);
    return [
      { label: "YOUR ANSWER", value: `${game.control.answer} ${o.unit}` },
      { label: "CONVERSION", value: game.round.kind === "reaction" ? "931.494 MeV per u" : "c² = 8.988×10¹⁶ J/kg" },
      { label: "MASS CONVERTED", value: o.convertedFraction === null ? "—" : `${(o.convertedFraction * 100).toFixed(2)} %` },
      { label: "PRINCIPLE", value: "E = Δm c²" },
    ];
  },
  visual: (game) => {
    const [max, xLabel, yLabel, slope] = game.round.kind === "sun"
      ? [10, "Mass lost per second (million tonnes)", "Power (10²⁶ W)", 0.8988]
      : game.round.kind === "hydrogen" ? [1000, "Energy released (TJ)", "Mass lost (g)", 1 / 89.88]
      : [30, "Energy released (MeV)", "Mass lost (10⁻³ u)", 1000 / 931.494];
    const points = [{ x: 0, y: 0 }, { x: max, y: max * slope }];
    const x = game.control.answer as number;
    return <LineChart description="Mass and energy are proportional: a straight line through the origin with slope c squared. A dashed line marks your answer." series={[{ label: "E = mc²", points }, { label: "Your answer", dashed: true, points: [{ x, y: 0 }, { x, y: max * slope }] }]} title="Mass and energy are proportional" xDomain={[0, max]} xLabel={xLabel as string} yLabel={yLabel as string} />;
  },
});
