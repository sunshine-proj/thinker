import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { DELAYED_NEUTRON_FRACTION, calculateReactivity, calculateRelativePower } from "../../../physics/nuclear";
import { reactorOperator, runReactor } from "./reactorOperator";

export const ReactorOperatorPage = createNumericGamePage({
  definition: reactorOperator,
  measurements: (game) => {
    const o = runReactor(game.round, game.control);
    return [
      { label: "MULTIPLICATION FACTOR k", value: o.multiplication.toFixed(5) },
      { label: "REACTIVITY ρ", value: `${calculateReactivity(o.multiplication).toFixed(5)} (β = ${DELAYED_NEUTRON_FRACTION})` },
      { label: "REACTOR PERIOD", value: o.periodSeconds === null ? "PROMPT CRITICAL" : !Number.isFinite(o.periodSeconds) ? "Steady" : o.periodSeconds < 0 ? `Falling (${Math.abs(o.periodSeconds).toFixed(0)} s)` : `${o.periodSeconds.toFixed(1)} s` },
    ];
  },
  visual: (game) => {
    const o = runReactor(game.round, game.control);
    const period = o.periodSeconds;
    const points = Array.from({ length: 61 }, (_, i) => {
      const t = (120 * i) / 60;
      return { x: t, y: period === null ? 8 : Math.min(8, calculateRelativePower(period, t)) };
    });
    return <LineChart description={period === null ? "Prompt critical: the power would rise off the chart in a fraction of a second." : "Reactor power relative to now over the next two minutes at your setting."} series={[{ label: "Relative power", points }, { label: "Double", dashed: true, points: [{ x: 0, y: 2 }, { x: 120, y: 2 }] }]} title="Power over the next two minutes" xDomain={[0, 120]} xLabel="Time (s)" yDomain={[0, 8]} yLabel="Power ÷ starting power" />;
  },
});
