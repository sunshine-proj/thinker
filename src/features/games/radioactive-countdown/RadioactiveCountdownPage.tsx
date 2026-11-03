import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateRemainingFraction } from "../../../physics/nuclear";
import { AMERICIUM_HALF_LIFE_YEARS, IODINE_HALF_LIFE_DAYS, SAMPLE_HALF_LIFE_S, SAMPLE_NUCLEI, radioactiveCountdown, runDecay } from "./radioactiveCountdown";

export const RadioactiveCountdownPage = createNumericGamePage({
  definition: radioactiveCountdown,
  measurements: (game) => {
    const o = runDecay(game.round, game.control);
    if (game.round.kind === "time") {
      return [
        { label: "HALF-LIVES ELAPSED", value: ((game.control.days as number) / IODINE_HALF_LIFE_DAYS).toFixed(2) },
        { label: "REMAINING", value: `${((o.fraction ?? 0) * 100).toFixed(1)} %` },
        { label: "TARGET", value: "12.5 %" },
        { label: "DECAYED", value: `${((1 - (o.fraction ?? 0)) * 100).toFixed(1)} %` },
      ];
    }
    if (game.round.kind === "count") {
      return [
        { label: "STARTING NUCLEI", value: String(SAMPLE_NUCLEI) },
        { label: "YOUR ESTIMATE", value: String(game.control.estimate) },
        { label: "EXPECTED", value: (o.expected ?? 0).toFixed(1) },
        { label: "SIMULATED SAMPLE", value: String(o.simulated ?? "—") },
      ];
    }
    return [
      { label: "SOURCE MASS", value: "1 µg" },
      { label: "HALF-LIFE", value: `${AMERICIUM_HALF_LIFE_YEARS} years` },
      { label: "YOUR ACTIVITY", value: `${game.control.activity} kBq` },
      { label: "ACTUAL", value: `${(o.activityKilobecquerels ?? 0).toFixed(0)} kBq` },
    ];
  },
  visual: (game) => {
    const [half, unit, max, mark] = game.round.kind === "time"
      ? [IODINE_HALF_LIFE_DAYS, "days", 60, game.control.days as number]
      : game.round.kind === "count" ? [SAMPLE_HALF_LIFE_S, "seconds", 50, 25]
      : [AMERICIUM_HALF_LIFE_YEARS, "years", 1300, 0];
    const points = Array.from({ length: 150 }, (_, i) => {
      const t = (max * i) / 149;
      return { x: t, y: calculateRemainingFraction(half as number, t) };
    });
    return (
      <LineChart
        description={`Fraction of nuclei remaining against time in ${unit}, halving every ${half} ${unit}.`}
        series={[{ label: "Fraction remaining", points }, { label: game.round.kind === "activity" ? "Today" : "Your time", dashed: true, points: [{ x: mark as number, y: 0 }, { x: mark as number, y: 1 }] }]}
        title="Radioactive decay curve"
        xDomain={[0, max as number]}
        xLabel={`Time (${unit})`}
        yDomain={[0, 1.05]}
        yLabel="Fraction remaining"
      />
    );
  },
});
