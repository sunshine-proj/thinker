import { LineChart } from "../../../components/common";
import { STANDARD_GRAVITY } from "../../../physics/core";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { electromagneticCrane, forceCurve } from "./electromagneticCrane";

export const ElectromagneticCranePage = createNumericGamePage({
  definition: electromagneticCrane,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "FIELD", value: o ? `${o.fieldTesla.toFixed(2)} T${o.saturated ? " (saturated)" : ""}` : "—" },
      { label: "MAGNETIC PULL", value: o ? `${(o.forceNewtons / 1000).toFixed(1)} kN` : "—" },
      { label: "LOAD WEIGHT", value: `${((game.round.loadKilograms * STANDARD_GRAVITY) / 1000).toFixed(1)} kN` },
      { label: "COIL HEATING", value: o ? `${o.powerWatts.toFixed(1)} W` : "—" },
    ];
  },
  visual: (game) => {
    if (!game.last) return <p className="balance-situation">Set up the magnet and energise it to see how the pull grows with current.</p>;
    const weight = (game.round.loadKilograms * STANDARD_GRAVITY) / 1000;
    const points = forceCurve(game.round, game.last.control);
    return (
      <LineChart
        description="The pull grows with the square of the current, then levels off when the iron saturates. The dashed line is the load's weight."
        series={[{ label: "Magnetic pull", points }, { label: "Load weight", points: points.map((p) => ({ x: p.x, y: weight })), dashed: true }]}
        title="Magnetic pull against coil current"
        xLabel="Current (A)"
        yLabel="Force (kN)"
      />
    );
  },
});
