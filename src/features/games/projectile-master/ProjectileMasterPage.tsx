import { RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import { ANGLE_RANGE, SPEED_RANGE, projectileMaster } from "./projectileMasterRoundGame";
import { ProjectilePlot, formatNumber } from "./ProjectilePlot";

export function ProjectileMasterPage() {
  return (
    <RoundGamePage
      definition={projectileMaster}
      renderControls={(game) => (
        <>
          <RangeControl
            disabled={!game.canEdit}
            displayValue={`${formatNumber(game.control.angle, 0)}°`}
            id="projectile-angle"
            label="Launch angle"
            maximum={ANGLE_RANGE.maximum}
            minimum={ANGLE_RANGE.minimum}
            onChange={(angle) => game.setControl((current) => ({ ...current, angle }))}
            step={ANGLE_RANGE.step}
            value={game.control.angle}
          />
          <RangeControl
            disabled={!game.canEdit}
            displayValue={`${formatNumber(game.control.speed)} m/s`}
            id="projectile-speed"
            label="Launch speed"
            maximum={SPEED_RANGE.maximum}
            minimum={SPEED_RANGE.minimum}
            onChange={(speed) => game.setControl((current) => ({ ...current, speed }))}
            step={SPEED_RANGE.step}
            value={game.control.speed}
          />
        </>
      )}
      renderMeasurements={(game) => {
        const shot = game.last?.outcome;
        return [
          { label: "RANGE", value: shot ? `${formatNumber(shot.trajectory.horizontalRangeMeters)} m` : "—" },
          { label: "FLIGHT TIME", value: shot ? `${formatNumber(shot.trajectory.flightTimeSeconds, 2)} s` : "—" },
          { label: "MAX HEIGHT", value: shot ? `${formatNumber(shot.trajectory.maximumHeightMeters)} m` : "—" },
          { label: "MISS DISTANCE", value: shot ? `${formatNumber(shot.missDistanceMeters)} m` : "—" },
        ];
      }}
      renderVisual={(game) => (
        <ProjectilePlot
          targetDistanceMeters={game.round.targetDistanceMeters}
          targetRadiusMeters={game.round.targetRadiusMeters}
          title={
            game.last
              ? `Projectile trajectory, range ${formatNumber(game.last.outcome.trajectory.horizontalRangeMeters)} meters, target at ${game.round.targetDistanceMeters} meters`
              : `Projectile target at ${game.round.targetDistanceMeters} meters`
          }
          trajectory={game.last?.outcome.trajectory ?? null}
        />
      )}
    />
  );
}
