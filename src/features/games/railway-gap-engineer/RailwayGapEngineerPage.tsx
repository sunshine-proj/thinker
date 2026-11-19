import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateLinearExpansion } from "../../../physics/thermodynamics";
import { BRIDGE, CONCRETE, RAIL, STEEL, STRIP, bimetalTipMm, railwayGapEngineer, runGap } from "./railwayGapEngineer";

export const RailwayGapEngineerPage = createNumericGamePage({
  definition: railwayGapEngineer,
  measurements: (game) => {
    const o = runGap(game.round, game.control);
    if (game.round.kind === "rail") {
      return [
        { label: "RAIL GROWTH BY 40 °C", value: `${(RAIL.length * STEEL.alpha * (RAIL.hottest - RAIL.laying) * 1000).toFixed(1)} mm` },
        { label: "GAP LEFT ON THE HOTTEST DAY", value: `${o.headline.toFixed(1)} mm` },
      ];
    }
    if (game.round.kind === "bridge") {
      return [
        { label: "TEMPERATURE RANGE", value: `${BRIDGE.hottest - BRIDGE.coldest} K` },
        { label: "YOUR JOINT", value: `${(game.control.travelMm as number).toFixed(1)} mm` },
      ];
    }
    return [
      { label: "TIP MOVEMENT", value: `${o.headline.toFixed(2)} mm` },
      { label: "TARGET", value: `${STRIP.targetMm} mm` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "bimetal") {
      const points = Array.from({ length: 57 }, (_, i) => {
        const length = 10 + (140 * i) / 56;
        return { x: length, y: bimetalTipMm(length) };
      });
      const length = game.control.lengthMm as number;
      return <LineChart description="Tip movement of the bimetallic strip against its length for a 20 kelvin rise; it grows with the square of the length." series={[{ label: "Tip movement", points }, { label: "Target 2 mm", dashed: true, points: [{ x: 10, y: STRIP.targetMm }, { x: 150, y: STRIP.targetMm }] }, { label: "Your strip", dashed: true, points: [{ x: length, y: 0 }, { x: length, y: 8 }] }]} title="Bending with heat" xDomain={[10, 150]} xLabel="Strip length (mm)" yDomain={[0, 8]} yLabel="Tip movement (mm)" />;
    }
    const rail = game.round.kind === "rail";
    const length = rail ? RAIL.length : BRIDGE.length;
    const material = rail ? STEEL : CONCRETE;
    const from = rail ? -20 : BRIDGE.coldest;
    const reference = rail ? RAIL.laying : BRIDGE.coldest;
    const points = Array.from({ length: 41 }, (_, i) => {
      const t = from + ((50 - from) * i) / 40;
      return { x: t, y: calculateLinearExpansion(length, material.alpha, t - reference) * 1000 };
    });
    return <LineChart description={`Change in length of the ${length} meter ${material.name.toLowerCase()} ${rail ? "rail" : "deck"} against temperature; it is a straight line.`} series={[{ label: "Change in length", points }]} title="Growing in the heat" xDomain={[from, 50]} xLabel="Temperature (°C)" yLabel="Change in length (mm)" />;
  },
});
