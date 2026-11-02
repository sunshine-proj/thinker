import { RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import { EARTH_GRAVITATIONAL_PARAMETER as MU, EARTH_MEAN_RADIUS as EARTH_RADIUS } from "../../../physics/core";
import type { OrbitControl, OrbitRound } from "./orbitSimulatorData";
import { orbitElementsFor, orbitPath, orbitSimulator, resolveLaunch } from "./orbitSimulatorModel";

const SIZE = 440;
const VIEW_WIDTH = 760;
const CENTER_X = 230;
const CENTER_Y = SIZE / 2;

function targetRadiusMeters(round: OrbitRound): number | null {
  const { goal } = round;
  if (goal.kind === "circular") {
    return EARTH_RADIUS + (round.altitudeKm.fixed ?? 0) * 1000;
  }
  if (goal.kind === "apoapsis") {
    return EARTH_RADIUS + goal.targetAltitudeKm * 1000;
  }
  return Math.cbrt((MU * (goal.targetMinutes * 60) ** 2) / (4 * Math.PI ** 2));
}

function OrbitView({ round, control }: { round: OrbitRound; control: OrbitControl }) {
  const launch = resolveLaunch(round, control);
  const elements = orbitElementsFor(round, control);
  const path = orbitPath(round, control);
  const launchRadius = EARTH_RADIUS + launch.altitudeKm * 1000;
  const target = targetRadiusMeters(round);
  const viewRadius = elements.bound
    ? 1.15 * Math.max(elements.apoapsis ?? 0, launchRadius, target ?? 0)
    : 3 * launchRadius;
  const scale = (SIZE / 2 - 12) / viewRadius;
  const px = (x: number) => CENTER_X + x * scale;
  const py = (y: number) => CENTER_Y - y * scale;
  const trail = path.points
    .filter((p) => p.position.magnitude <= viewRadius * 1.02)
    .map((p) => `${px(p.position.x)},${py(p.position.y)}`)
    .join(" ");
  const kind = !elements.bound
    ? "an escape trajectory"
    : path.stoppedBy === "collision"
      ? "a path that hits the Earth"
      : "a closed orbit";

  return (
    <svg
      aria-label={`Orbit view: Earth at the center. Satellite launched ${launch.altitudeKm} kilometers up at ${launch.speedKmPerSecond} kilometers per second, sideways. The path is ${kind}. Lowest point ${((elements.periapsis - EARTH_RADIUS) / 1000).toFixed(0)} kilometers altitude${elements.apoapsis !== null ? `, highest point ${((elements.apoapsis - EARTH_RADIUS) / 1000).toFixed(0)} kilometers` : ""}.`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${VIEW_WIDTH} ${SIZE}`}
    >
      <rect fill="#0f1633" height={SIZE} rx="10" width={VIEW_WIDTH} />
      {target !== null && (
        <circle className="orbit-target" cx={CENTER_X} cy={CENTER_Y} r={target * scale} />
      )}
      <circle className="orbit-earth" cx={CENTER_X} cy={CENTER_Y} r={EARTH_RADIUS * scale} />
      <polyline className={path.stoppedBy === "collision" ? "orbit-path orbit-path--crash" : "orbit-path"} fill="none" points={trail} />
      <circle className="orbit-launch" cx={px(launchRadius)} cy={py(0)} r="5" />
      <text className="orbit-label" x={px(launchRadius) + 8} y={py(0) - 8}>launch</text>
      {elements.apoapsis !== null && (
        <text className="orbit-label" textAnchor="middle" x={px(-elements.apoapsis) } y={py(0) - 8}>
          highest
        </text>
      )}
      <g className="orbit-legend">
        <text x="470" y="60">Blue: Earth</text>
        <text x="470" y="84">Yellow line: simulated path</text>
        <text x="470" y="108">Dashed ring: mission target</text>
        <text x="470" y="132">Path type: {kind}</text>
        <text x="470" y="170">Scale: 1 px ≈ {(1 / scale / 1000).toFixed(0)} km</text>
      </g>
    </svg>
  );
}

export function OrbitSimulatorPage() {
  return (
    <RoundGamePage
      definition={orbitSimulator}
      renderControls={(game) => (
        <>
          {game.round.altitudeKm.fixed === null ? (
            <RangeControl
              disabled={!game.canEdit}
              displayValue={`${game.control.altitudeKm} km`}
              id="launch-altitude"
              label="Launch altitude"
              maximum={game.round.altitudeKm.maximum}
              minimum={game.round.altitudeKm.minimum}
              onChange={(altitudeKm) => game.setControl((current) => ({ ...current, altitudeKm }))}
              step={game.round.altitudeKm.step}
              value={game.control.altitudeKm}
            />
          ) : (
            <p className="game-instructions">Launch altitude fixed at {game.round.altitudeKm.fixed} km.</p>
          )}
          <RangeControl
            disabled={!game.canEdit}
            displayValue={`${game.control.speedKmPerSecond.toFixed(2)} km/s`}
            id="launch-speed"
            label="Launch speed (sideways)"
            maximum={game.round.speedKmPerSecond.maximum}
            minimum={game.round.speedKmPerSecond.minimum}
            onChange={(speedKmPerSecond) => game.setControl((current) => ({ ...current, speedKmPerSecond }))}
            step={game.round.speedKmPerSecond.step}
            value={game.control.speedKmPerSecond}
          />
        </>
      )}
      renderMeasurements={(game) => {
        const e = orbitElementsFor(game.round, game.control);
        const outcome = game.last?.outcome;
        return [
          { label: "LOWEST POINT", value: `${((e.periapsis - EARTH_RADIUS) / 1000).toFixed(0)} km` },
          { label: "HIGHEST POINT", value: e.apoapsis === null ? "escapes" : `${((e.apoapsis - EARTH_RADIUS) / 1000).toFixed(0)} km` },
          { label: "ECCENTRICITY", value: e.eccentricity.toFixed(3) },
          { label: "PERIOD", value: outcome?.periodMinutes != null ? `${outcome.periodMinutes.toFixed(1)} min` : "—" },
        ];
      }}
      renderVisual={(game) => <OrbitView control={game.control} round={game.round} />}
    />
  );
}
