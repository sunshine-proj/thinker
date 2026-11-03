import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { initialProfile, waveSimulator } from "./waveSimulator";

export const WaveSimulatorPage = createNumericGamePage({
  definition: waveSimulator,
  measurements: (game) => {
    const o = game.last?.outcome;
    const label = game.round.kind === "echo" ? "ECHO TIME" : game.round.kind === "sum" ? "MEETING HEIGHT" : "LARGEST MOTION AT x = 6 m";
    const unit = game.round.kind === "echo" ? " s" : "";
    return [
      { label: "WAVE SPEED", value: `${(game.control.speed as number).toFixed(1)} m/s` },
      { label: label, value: o ? `${o.measured.toFixed(2)}${unit}` : "—" },
      { label: "TIME STEP", value: `${((0.05 / (game.control.speed as number)) * 1000).toFixed(1)} ms` },
      { label: "COURANT NUMBER", value: "1 (stable)" },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    const points = o?.profile ?? initialProfile(game.round, game.control);
    return (
      <LineChart
        description={o ? `The string shape at the end of the simulation. ${o.feedback}` : "The string shape at the start of the simulation, before the pulses move."}
        series={[{ label: o ? "String at the end of the run" : "String at the start", points }]}
        title="Pulses on the string"
        xDomain={[0, 12]}
        xLabel="Position (m)"
        yDomain={[-1.2, 1.2]}
        yLabel="Displacement"
      />
    );
  },
});
