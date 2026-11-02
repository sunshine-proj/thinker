import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { deviationCurve, rainbowCreator } from "./rainbowCreator";

export const RainbowCreatorPage = createNumericGamePage({
  definition: rainbowCreator,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "REFRACTIVE INDEX", value: o ? o.refractiveIndex.toFixed(4) : "—" },
      { label: "DEVIATION", value: o ? `${o.deviationDegrees.toFixed(1)}°` : "—" },
      { label: "MINIMUM-DEVIATION INCIDENCE", value: o ? `${o.minimumIncidenceDegrees.toFixed(1)}°` : "—" },
      { label: "RAINBOW ANGLE", value: o ? `${o.rainbowAngleDegrees.toFixed(2)}°` : "—" },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    if (!o) return <p className="balance-situation">Trace the ray to see how the deviation depends on where the light enters the drop.</p>;
    const curve = deviationCurve(game.last!.control);
    const minimum = Math.min(...curve.map((p) => p.y));
    const maximum = Math.max(...curve.map((p) => p.y));
    return (
      <LineChart
        description={`The deviation falls to a minimum of ${minimum.toFixed(1)} degrees near an incidence of ${o.minimumIncidenceDegrees.toFixed(1)} degrees. Rays near the minimum leave in nearly the same direction, which creates the bright rainbow.`}
        series={[{ label: "Deviation", points: curve }, { label: "Minimum deviation", points: curve.map((p) => ({ x: p.x, y: minimum })), dashed: true }]}
        title="Deviation against angle of incidence"
        xLabel="Angle of incidence (°)"
        yDomain={[Math.floor(minimum - 5), Math.ceil(maximum)]}
        yLabel="Total deviation (°)"
      />
    );
  },
});
