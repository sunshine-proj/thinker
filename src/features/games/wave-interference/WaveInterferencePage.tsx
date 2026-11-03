import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { intensityCurve, runInterference, waveInterference } from "./waveInterference";

export const WaveInterferencePage = createNumericGamePage({
  definition: waveInterference,
  measurements: (game) => {
    const o = runInterference(game.round, game.control);
    if (game.round.kind === "slits") {
      return [
        { label: "WAVELENGTH", value: "589 nm" },
        { label: "SLIT SEPARATION", value: `${(game.control.separation as number).toFixed(3)} mm` },
        { label: "FRINGE SPACING", value: `${o.fringeSpacingMillimeters?.toFixed(2)} mm` },
        { label: "TARGET", value: "5.00 mm" },
      ];
    }
    return [
      { label: "WAVELENGTH", value: `${o.wavelengthMeters.toFixed(3)} m` },
      { label: "PATH DIFFERENCE", value: `${o.pathDifferenceMeters.toFixed(3)} m` },
      { label: "IN WAVELENGTHS", value: (o.pathDifferenceMeters / o.wavelengthMeters).toFixed(2) },
      { label: "INTENSITY", value: `${(o.intensity * 100).toFixed(0)} % · ${o.interference}` },
    ];
  },
  visual: (game) => {
    const kind = game.round.kind;
    const marker = kind === "quiet" ? (game.control.position as number) : kind === "loud" ? (game.control.frequency as number) : 0;
    const curve = intensityCurve(game.round, game.control);
    const o = runInterference(game.round, game.control);
    const series = [{ label: "Relative intensity", points: curve }];
    if (kind !== "slits") {
      series.push({ label: "Your setting", points: [{ x: marker, y: 0 }, { x: marker, y: 1 }] });
    }
    return (
      <LineChart
        description={`Relative intensity curve. ${kind === "slits" ? `Bright fringes about ${o.fringeSpacingMillimeters?.toFixed(2)} millimeters apart.` : `At your setting the intensity is ${(o.intensity * 100).toFixed(0)} percent of the maximum.`}`}
        series={series}
        title="Interference pattern"
        xDomain={kind === "quiet" ? [0, 3] : kind === "loud" ? [150, 600] : [-15, 15]}
        xLabel={kind === "quiet" ? "Listener position x (m)" : kind === "loud" ? "Frequency (Hz)" : "Position on the screen (mm)"}
        yDomain={[0, 1.05]}
        yLabel="Relative intensity"
      />
    );
  },
});
