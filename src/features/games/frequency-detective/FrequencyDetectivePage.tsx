import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { analyse, frequencyDetective, runFrequency, sampleBeats } from "./frequencyDetective";

export const FrequencyDetectivePage = createNumericGamePage({
  definition: frequencyDetective,
  measurements: (game) => {
    const o = runFrequency(game.round, game.control);
    if (game.round.kind === "beats") {
      return [
        { label: "TUNING FORK", value: "440 Hz" },
        { label: "YOUR STRING", value: `${(game.control.frequency as number).toFixed(1)} Hz` },
        { label: "BEATS PER SECOND", value: (o.beatHz ?? 0).toFixed(1) },
        { label: "OBSERVED", value: "4 beats/s, string flat" },
      ];
    }
    if (game.round.kind === "fundamental") {
      return [
        { label: "SPECTRUM PEAKS", value: `${o.peaks.join(", ")} Hz` },
        { label: "YOUR FUNDAMENTAL", value: `${game.control.fundamental} Hz` },
        { label: "HARMONIC NUMBERS", value: o.peaks.map((p) => (p / (game.control.fundamental as number)).toFixed(2)).join(", ") },
        { label: "RESOLUTION", value: "1 Hz (1 s recording)" },
      ];
    }
    return [
      { label: "RECORDING", value: `${(game.control.duration as number).toFixed(2)} s` },
      { label: "RESOLUTION", value: `${(o.resolutionHz ?? 0).toFixed(1)} Hz` },
      { label: "PEAKS FOUND", value: String(o.peaks.length) },
      { label: "PEAK FREQUENCIES", value: o.peaks.length ? o.peaks.map((p) => p.toFixed(1)).join(", ") + " Hz" : "—" },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "beats") {
      return (
        <LineChart
          description="The sum of the tuning fork and the string over half a second; the loudness swells and fades at the beat frequency."
          series={[{ label: "Fork + string", points: sampleBeats(game.control) }]}
          title="Waveform with beats"
          xLabel="Time (s)"
          yDomain={[-2.2, 2.2]}
          yLabel="Pressure"
        />
      );
    }
    const spectrum = analyse(game.round, game.control);
    const [low, high] = game.round.kind === "fundamental" ? [0, 800] : [420, 465];
    return (
      <LineChart
        description={`Amplitude spectrum between ${low} and ${high} hertz; ${runFrequency(game.round, game.control).peaks.length || "some"} peaks.`}
        series={[{ label: "Spectrum", points: spectrum.filter((p) => p.frequency >= low && p.frequency <= high).map((p) => ({ x: p.frequency, y: p.amplitude })) }]}
        title="Amplitude spectrum"
        xDomain={[low, high]}
        xLabel="Frequency (Hz)"
        yLabel="Amplitude"
      />
    );
  },
});
