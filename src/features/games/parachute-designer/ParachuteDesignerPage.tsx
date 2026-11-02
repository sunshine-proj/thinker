import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { parachuteDesigner } from "./parachuteDesigner";

export const ParachuteDesignerPage = createNumericGamePage({
  definition: parachuteDesigner,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "TERMINAL SPEED", value: o ? `${o.terminalSpeed.toFixed(1)} m/s` : "—" },
      { label: "LANDING SPEED", value: o ? `${o.fall.touchdownSpeedMetersPerSecond.toFixed(1)} m/s` : "—" },
      { label: "TIME IN THE AIR", value: o ? `${o.fall.totalTimeSeconds.toFixed(0)} s` : "—" },
      { label: "CANOPY AREA", value: o ? `${o.canopyAreaSquareMeters.toFixed(1)} m²` : "—" },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    if (!o) return <p className="balance-situation">Choose your canopy and jump to see the speed against time.</p>;
    return (
      <LineChart
        description={`The falling speed rises, then settles near the terminal speed of ${o.terminalSpeed.toFixed(1)} meters per second; the jumper lands at ${o.fall.touchdownSpeedMetersPerSecond.toFixed(1)} meters per second.`}
        series={[{ label: "Downward speed", points: o.fall.samples.map((s) => ({ x: s.timeSeconds, y: s.downwardSpeedMetersPerSecond })) }]}
        title="Falling speed against time"
        xLabel="Time (s)"
        yLabel="Speed (m/s)"
      />
    );
  },
});
