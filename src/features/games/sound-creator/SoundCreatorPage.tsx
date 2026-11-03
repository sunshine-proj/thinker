import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { runSound, sampleSound, soundCreator } from "./soundCreator";

export const SoundCreatorPage = createNumericGamePage({
  definition: soundCreator,
  measurements: (game) => {
    const o = runSound(game.round, game.control);
    return [
      { label: "FREQUENCY", value: `${o.frequencyHz.toFixed(1)} Hz` },
      { label: "PERIOD", value: `${o.periodMilliseconds.toFixed(3)} ms` },
      { label: "WAVELENGTH IN AIR", value: `${o.wavelengthMeters.toFixed(2)} m` },
      game.round.kind === "loudness"
        ? { label: "LEVEL CHANGE", value: `${o.levelChangeDecibels?.toFixed(1)} dB` }
        : { label: "PEAK AMPLITUDE", value: o.peak.toFixed(2) },
    ];
  },
  visual: (game) => (
    <LineChart
      description={`The pressure wave over two periods; frequency ${(game.control.frequency as number).toFixed(1)} hertz, peak amplitude ${runSound(game.round, game.control).peak.toFixed(2)}.`}
      series={[{ label: "Pressure wave", points: sampleSound(game.round, game.control, 2 / (game.control.frequency as number)) }]}
      title="Waveform"
      xLabel="Time (ms)"
      yDomain={[-2, 2]}
      yLabel="Pressure (relative)"
    />
  ),
});
