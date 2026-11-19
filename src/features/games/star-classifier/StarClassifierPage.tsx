import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateSolarLuminosity, classifySpectralType } from "../../../physics/astronomy";
import { DWARF, GIANT, runStar, starClassifier } from "./starClassifier";

/** Lines of constant radius on a Hertzsprung–Russell diagram (log L against temperature). */
function radiusLine(radius: number) {
  return Array.from({ length: 40 }, (_, i) => {
    const t = 2500 + (37_500 * i) / 39;
    return { x: t, y: Math.log10(calculateSolarLuminosity(radius, t)) };
  });
}

export const StarClassifierPage = createNumericGamePage({
  definition: starClassifier,
  measurements: (game) => {
    const o = runStar(game.round, game.control);
    if (game.round.kind === "colour") {
      const t = game.control.temperature as number;
      return [
        { label: "PEAK AT YOUR TEMPERATURE", value: `${o.headline.toFixed(0)} nm` },
        { label: "SPECTRAL CLASS", value: classifySpectralType(t) },
      ];
    }
    if (game.round.kind === "giant") {
      return [{ label: "LUMINOSITY AT YOUR RADIUS", value: `${o.headline.toExponential(2)} L☉` }];
    }
    return [{ label: "YOUR LUMINOSITY", value: `${(game.control.luminosity as number).toFixed(4)} L☉` }];
  },
  visual: (game) => {
    const star =
      game.round.kind === "giant" ? { x: GIANT.temperature, y: Math.log10(calculateSolarLuminosity(game.control.radius as number, GIANT.temperature)) }
      : game.round.kind === "dwarf" ? { x: DWARF.temperature, y: Math.log10(game.control.luminosity as number) }
      : { x: game.control.temperature as number, y: 1.5 };
    return (
      <LineChart
        description="A Hertzsprung–Russell diagram: luminosity on a logarithmic scale against surface temperature, with lines of constant radius. Giants lie at the top right, white dwarfs at the bottom. The dashed cross marks your star."
        series={[
          { label: "1000 R☉", dashed: true, points: radiusLine(1000) },
          { label: "1 R☉ (Sun's size)", points: radiusLine(1) },
          { label: "0.01 R☉ (Earth-sized)", dashed: true, points: radiusLine(0.01) },
          { label: "Your star", dashed: true, points: [{ x: star.x - 800, y: star.y }, { x: star.x + 800, y: star.y }] },
        ]}
        title="Hertzsprung–Russell diagram"
        xDomain={[2500, 40_000]}
        xLabel="Surface temperature (K)"
        yDomain={[-5, 7]}
        yLabel="log₁₀ (L / L☉)"
      />
    );
  },
});
