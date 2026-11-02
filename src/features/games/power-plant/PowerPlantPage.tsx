import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { emfWaveform, powerPlant } from "./powerPlant";

export const PowerPlantPage = createNumericGamePage({
  definition: powerPlant,
  measurements: (game) => {
    const o = game.last?.outcome.output;
    return [
      { label: "PEAK VOLTAGE", value: o ? `${o.peakEmfVolts.toFixed(0)} V` : "—" },
      { label: "POWER TO LOAD", value: o ? `${o.loadPowerWatts.toFixed(0)} W` : "—" },
      { label: "EFFICIENCY", value: o ? `${(o.efficiency * 100).toFixed(0)}%` : "—" },
      { label: "FREQUENCY", value: o ? `${o.frequencyHertz.toFixed(1)} Hz` : "—" },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome.output;
    if (!o) return <p className="balance-situation">Set up the generator and run the turbine to see the alternating voltage.</p>;
    return (
      <LineChart
        description={`A sine wave with a peak of ${o.peakEmfVolts.toFixed(0)} volts and a frequency of ${o.frequencyHertz.toFixed(1)} hertz, shown for two cycles.`}
        series={[{ label: "Induced EMF", points: emfWaveform(o) }]}
        title="Generator voltage over two cycles"
        xLabel="Time (s)"
        yLabel="EMF (V)"
      />
    );
  },
});
