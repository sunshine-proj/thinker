import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { runGuitar, sampleString, virtualGuitar } from "./virtualGuitar";

export const VirtualGuitarPage = createNumericGamePage({
  definition: virtualGuitar,
  measurements: (game) => {
    const o = runGuitar(game.round, game.control);
    return [
      { label: "FREQUENCY", value: `${o.frequencyHz.toFixed(2)} Hz` },
      { label: "VIBRATING LENGTH", value: `${o.vibratingLengthMeters.toFixed(3)} m` },
      { label: "WAVE SPEED", value: o.waveSpeed === null ? "—" : `${o.waveSpeed.toFixed(0)} m/s` },
      { label: "HARMONIC", value: `n = ${o.mode}` },
    ];
  },
  visual: (game) => {
    const o = runGuitar(game.round, game.control);
    return (
      <LineChart
        description={`Standing wave of harmonic ${o.mode} on ${o.vibratingLengthMeters.toFixed(3)} meters of string, sounding ${o.frequencyHz.toFixed(1)} hertz.`}
        series={[{ label: `Mode ${o.mode}`, points: sampleString(game.round, game.control, o.mode) }]}
        title="Standing wave on the string"
        xDomain={[0, 0.65]}
        xLabel="Position along the string (m)"
        yDomain={[-1.2, 1.2]}
        yLabel="Displacement (relative)"
      />
    );
  },
});
