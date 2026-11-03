import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { escapeVelocity, runEscape, speedCurve } from "./escapeVelocity";

export const EscapeVelocityPage = createNumericGamePage({
  definition: escapeVelocity,
  measurements: (game) => {
    const o = runEscape(game.round, game.control);
    return [
      { label: "LAUNCH SPEED", value: `${(game.control.speed as number).toFixed(2)} km/s` },
      { label: "ENERGY PER KG", value: `${(o.specificEnergy / 1e6).toFixed(2)} MJ/kg` },
      { label: "OUTCOME", value: o.escapes ? "escapes" : `falls back from ${((o.maximumAltitudeMeters ?? 0) / 1000).toFixed(0)} km` },
      { label: "ESCAPE SPEED OF THE BODY", value: `${(o.bodyEscapeSpeed / 1000).toFixed(2)} km/s` },
    ];
  },
  visual: (game) => (
    <LineChart
      description="Speed of a straight-up launch against distance from the body's center, in radii. A curve that ends has a turning point; a curve that continues has escaped."
      series={[{ label: "Speed", points: speedCurve(game.round, game.control) }]}
      title="Speed as the probe climbs"
      xDomain={[1, 10]}
      xLabel="Distance from the center (body radii)"
      yLabel="Speed (km/s)"
    />
  ),
});
