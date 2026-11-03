import { createNumericGamePage } from "../../../game-engine/rounds";
import { planetDesigner, runPlanet } from "./planetDesigner";

export const PlanetDesignerPage = createNumericGamePage({
  definition: planetDesigner,
  measurements: (game) => {
    const o = runPlanet(game.round, game.control);
    return [
      { label: "SURFACE GRAVITY", value: `${o.properties.surfaceGravity.toFixed(2)} m/s²` },
      { label: "MEAN DENSITY", value: `${o.properties.meanDensity.toFixed(0)} kg/m³` },
      { label: "ESCAPE SPEED", value: `${(o.properties.escapeSpeed / 1000).toFixed(2)} km/s` },
      { label: "SURFACE ORBIT PERIOD", value: `${(o.properties.orbitalPeriodAtSurface / 60).toFixed(0)} min` },
    ];
  },
  visual: (game) => {
    const o = runPlanet(game.round, game.control);
    const scale = 14;
    const r = Math.min(110, Math.max(8, o.earthRadii * scale));
    return (
      <svg aria-label={`A planet of ${o.earthMasses.toFixed(2)} Earth masses and ${o.earthRadii.toFixed(2)} Earth radii next to a circle for Earth. Surface gravity ${o.properties.surfaceGravity.toFixed(2)} meters per second squared.`} className="balance-plot" role="img" viewBox="0 0 700 250">
        <rect fill="#f9faff" height="250" rx="10" width="700" />
        <circle cx="140" cy="125" fill="#cfe4ff" r={scale} stroke="#5a8fc4" strokeWidth="2" />
        <text className="balance-plot__pivot-label" textAnchor="middle" x="140" y="175">Earth</text>
        <circle cx="430" cy="125" fill="#f2d7a6" r={r} stroke="#d98a1f" strokeWidth="3" />
        <text className="balance-plot__pivot-label" textAnchor="middle" x="430" y="240">your planet · {o.earthRadii.toFixed(2)} R⊕ · {o.earthMasses.toFixed(2)} M⊕</text>
      </svg>
    );
  },
});
