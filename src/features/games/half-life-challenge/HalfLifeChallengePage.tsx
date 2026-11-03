import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateDaughterAmount, calculateMixedActivityFraction } from "../../../physics/nuclear";
import { DAUGHTER_HOURS, MIXTURE, MIXTURE_TARGET, PARENT_HOURS, READING_END, READING_HOURS, READING_START, halfLifeChallenge, runHalfLife } from "./halfLifeChallenge";

const range = (to: number, count = 150) => Array.from({ length: count }, (_, i) => (to * i) / (count - 1));

export const HalfLifeChallengePage = createNumericGamePage({
  definition: halfLifeChallenge,
  measurements: (game) => {
    const o = runHalfLife(game.round, game.control);
    if (game.round.kind === "chain") {
      return [
        { label: "PARENT HALF-LIFE", value: `${PARENT_HOURS} h` },
        { label: "DAUGHTER HALF-LIFE", value: `${DAUGHTER_HOURS} h` },
        { label: "YOUR TIME", value: `${game.control.time} h` },
        { label: "DAUGHTER AT YOUR TIME", value: `${(calculateDaughterAmount(1, PARENT_HOURS, DAUGHTER_HOURS, game.control.time as number) * 100).toFixed(1)} % of N₀` },
      ];
    }
    if (game.round.kind === "readings") {
      return [
        { label: "START", value: `${READING_START} Bq` },
        { label: "AFTER 14 H", value: `${READING_END} Bq` },
        { label: "YOUR HALF-LIFE", value: `${game.control.halfLife} h` },
        { label: "ACTIVITY AT 14 H FOR YOURS", value: `${(READING_START * (o.fractionAtGuess ?? 0)).toFixed(1)} Bq` },
      ];
    }
    return [
      { label: "YOUR TIME", value: `${game.control.days} days` },
      { label: "ACTIVITY LEFT", value: `${((o.fractionAtGuess ?? 0) * 100).toFixed(1)} %` },
      { label: "TARGET", value: `${MIXTURE_TARGET * 100} %` },
      { label: "COMPONENTS", value: "I-131 + short-lived" },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "chain") {
      const hours = range(120);
      return <LineChart description="Amounts of molybdenum-99 and technetium-99m against time: the daughter rises, peaks near 23 hours, then falls." series={[{ label: "Mo-99 (parent)", points: hours.map((x) => ({ x, y: 2 ** (-x / PARENT_HOURS) })) }, { label: "Tc-99m (daughter)", points: hours.map((x) => ({ x, y: calculateDaughterAmount(1, PARENT_HOURS, DAUGHTER_HOURS, x) })) }, { label: "Your time", dashed: true, points: [{ x: game.control.time as number, y: 0 }, { x: game.control.time as number, y: 1 }] }]} title="A decay chain" xDomain={[0, 120]} xLabel="Time (h)" yDomain={[0, 1.05]} yLabel="Fraction of the initial Mo-99" />;
    }
    if (game.round.kind === "readings") {
      const h = game.control.halfLife as number;
      return <LineChart description="Activity against time for your half-life, with the two measured activities as a dashed line from 640 becquerels to 40 becquerels at 14 hours." series={[{ label: "Your half-life", points: range(20).map((x) => ({ x, y: READING_START * 2 ** (-x / h) })) }, { label: "Measurements", dashed: true, points: [{ x: 0, y: READING_START }, { x: READING_HOURS, y: READING_END }] }]} title="Activity readings" xDomain={[0, 20]} xLabel="Time (h)" yDomain={[0, 700]} yLabel="Activity (Bq)" />;
    }
    return <LineChart description="Total activity of the mixed sample against time: a fast drop from the short-lived component then a slow tail from iodine-131." series={[{ label: "Total activity", points: range(20).map((x) => ({ x, y: calculateMixedActivityFraction(MIXTURE, x) })) }, { label: "Target 30 %", dashed: true, points: [{ x: 0, y: MIXTURE_TARGET }, { x: 20, y: MIXTURE_TARGET }] }]} title="A mixed sample" xDomain={[0, 20]} xLabel="Time (days)" yDomain={[0, 1.05]} yLabel="Fraction of the initial activity" />;
  },
});
