import { LineChart, RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import { SAFE_TOUCHDOWN_SPEED, type LandingControl, type LandingRound } from "./moonLandingData";
import { moonLanding } from "./moonLandingModel";

const WIDTH = 960;
const HEIGHT = 260;

function Descent({ round, control }: { round: LandingRound; control: LandingControl }) {
  const top = 30;
  const ground = 220;
  const y = (altitude: number) => ground - (altitude / round.initialAltitudeMeters) * (ground - top);

  return (
    <svg
      aria-label={`Lunar descent. The lander starts ${round.initialAltitudeMeters} meters above the surface, falling at ${round.initialDownwardSpeed} meters per second. The engine is set to ignite at ${control.ignitionAltitudeMeters} meters at ${Math.round(control.throttle * 100)} percent thrust.`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      <rect fill="#0f1633" height={HEIGHT} rx="10" width={WIDTH} />
      <rect fill="#8c93a8" height={HEIGHT - ground} width={WIDTH} y={ground} />
      <line stroke="#ffd166" strokeDasharray="8 6" strokeWidth="2" x1="60" x2="620" y1={y(control.ignitionAltitudeMeters)} y2={y(control.ignitionAltitudeMeters)} />
      <text className="orbit-label" x="630" y={y(control.ignitionAltitudeMeters) + 4}>
        ignition at {control.ignitionAltitudeMeters} m
      </text>
      <g className="lander">
        <polygon points={`330,${top} 350,${top} 355,${top + 22} 325,${top + 22}`} />
        <line x1="325" x2="312" y1={top + 22} y2={top + 36} />
        <line x1="355" x2="368" y1={top + 22} y2={top + 36} />
        <text x="380" y={top + 16}>start: {round.initialAltitudeMeters} m, {round.initialDownwardSpeed} m/s down</text>
      </g>
      <text className="orbit-label" x="60" y={ground + 22}>Lunar surface · g = 1.62 m/s²</text>
    </svg>
  );
}

export function MoonLandingPage() {
  return (
    <RoundGamePage
      definition={moonLanding}
      renderControls={(game) => (
        <>
          <RangeControl
            disabled={!game.canEdit}
            displayValue={`${game.control.ignitionAltitudeMeters} m`}
            id="ignition-altitude"
            label="Ignition altitude"
            maximum={game.round.ignition.maximum}
            minimum={game.round.ignition.minimum}
            onChange={(ignitionAltitudeMeters) => game.setControl((current) => ({ ...current, ignitionAltitudeMeters }))}
            step={game.round.ignition.step}
            value={game.control.ignitionAltitudeMeters}
          />
          {game.round.throttle.minimum === game.round.throttle.maximum ? (
            <p className="game-instructions">Engine fixed at full thrust (9,000 N).</p>
          ) : (
            <RangeControl
              disabled={!game.canEdit}
              displayValue={`${Math.round(game.control.throttle * 100)}%`}
              id="throttle"
              label="Throttle"
              maximum={game.round.throttle.maximum * 100}
              minimum={game.round.throttle.minimum * 100}
              onChange={(percent) => game.setControl((current) => ({ ...current, throttle: percent / 100 }))}
              step={game.round.throttle.step * 100}
              value={Math.round(game.control.throttle * 100)}
            />
          )}
          <p className="game-instructions">
            Start: {game.round.initialAltitudeMeters} m, {game.round.initialDownwardSpeed} m/s downward · propellant {game.round.fuelKilograms} kg · safe touchdown ≤ {SAFE_TOUCHDOWN_SPEED} m/s.
          </p>
        </>
      )}
      renderMeasurements={(game) => {
        const outcome = game.last?.outcome;
        const d = outcome?.descent;
        const burn = d && d.ignitionTimeSeconds !== null
          ? (d.cutoffTimeSeconds ?? d.samples.at(-1)!.timeSeconds) - d.ignitionTimeSeconds
          : null;
        return [
          { label: "TOUCHDOWN SPEED", value: d ? `${d.touchdownSpeedMetersPerSecond.toFixed(1)} m/s` : "—" },
          { label: "PROPELLANT USED", value: d ? `${d.fuelUsedKilograms.toFixed(1)} kg` : "—" },
          { label: "SPEED AT IGNITION", value: d?.ignitionSpeedMetersPerSecond != null ? `${d.ignitionSpeedMetersPerSecond.toFixed(1)} m/s` : "—" },
          { label: "BURN TIME", value: burn !== null ? `${burn.toFixed(1)} s` : "—" },
        ];
      }}
      renderVisual={(game) => {
        const outcome = game.last?.outcome;
        if (!outcome) {
          return <Descent control={game.control} round={game.round} />;
        }
        const samples = outcome.descent.samples;
        return (
          <>
            <LineChart
              description={`Altitude falls from ${game.round.initialAltitudeMeters} meters to the surface in ${samples.at(-1)!.timeSeconds.toFixed(0)} seconds; the curve flattens after ignition as the engine slows the descent.`}
              series={[{ label: "Altitude", points: samples.map((s) => ({ x: s.timeSeconds, y: s.altitudeMeters })) }]}
              title="Altitude during the descent"
              xLabel="Time (s)"
              yLabel="Altitude (m)"
            />
            <LineChart
              band={{ label: `landing speed within ±${SAFE_TOUCHDOWN_SPEED} m/s`, yMin: -SAFE_TOUCHDOWN_SPEED, yMax: 0 }}
              description={`Vertical speed (negative is downward) grows during free fall, then returns toward zero during the burn. Touchdown speed is ${outcome.descent.touchdownSpeedMetersPerSecond.toFixed(1)} meters per second.`}
              series={[{ label: "Vertical velocity", points: samples.map((s) => ({ x: s.timeSeconds, y: s.velocityMetersPerSecond })) }]}
              title="Vertical velocity during the descent"
              xLabel="Time (s)"
              yLabel="Velocity (m/s, up positive)"
            />
          </>
        );
      }}
    />
  );
}
