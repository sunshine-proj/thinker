import { RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import {
  ARENA_CM,
  MIRROR_ANGLE_RANGE,
  type LaserControl,
  type LaserRound,
} from "./laserMazeData";
import { buildScene, laserMaze, traceLaser } from "./laserMazeModel";

const SIZE = 400;
const OFFSET = 20;
const VIEW_WIDTH = 680;
const VIEW_HEIGHT = 440;

const px = (xCm: number) => OFFSET + (xCm / ARENA_CM) * SIZE;
const py = (yCm: number) => OFFSET + SIZE - (yCm / ARENA_CM) * SIZE;

function Bench({ round, control }: { round: LaserRound; control: LaserControl }) {
  const scene = buildScene(round, control);
  const trace = traceLaser(round, control);
  const path = trace.points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");
  const status = trace.hitTarget ? "The beam hits the target." : "The beam misses the target.";

  return (
    <svg
      aria-label={`Laser bench, 100 by 100 centimeters. Laser at ${round.laser.xCm}, ${round.laser.yCm} centimeters firing at ${round.laser.angleDegrees} degrees. ${round.mirrors.length} mirror${round.mirrors.length === 1 ? "" : "s"} at angles ${control.mirrorAnglesDegrees.join(", ")} degrees. Target at ${round.target.xCm}, ${round.target.yCm} centimeters. ${trace.events.length} reflections or refractions. ${status}`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    >
      <rect fill="#f9faff" height={VIEW_HEIGHT} rx="10" width={VIEW_WIDTH} />
      <rect fill="#fff" height={SIZE} stroke="#c9d0e6" width={SIZE} x={OFFSET} y={OFFSET} />
      {round.blocks.map((block, index) => (
        <g key={index}>
          <rect
            className="laser-glass"
            height={((block.maxYCm - block.minYCm) / ARENA_CM) * SIZE}
            width={((block.maxXCm - block.minXCm) / ARENA_CM) * SIZE}
            x={px(block.minXCm)}
            y={py(block.maxYCm)}
          />
          <text className="balance-plot__pivot-label" textAnchor="middle" x={px((block.minXCm + block.maxXCm) / 2)} y={py(block.maxYCm) - 6}>
            glass n = {block.refractiveIndex.toFixed(2)}
          </text>
        </g>
      ))}
      <circle className={trace.hitTarget ? "laser-target laser-target--hit" : "laser-target"} cx={px(round.target.xCm)} cy={py(round.target.yCm)} r={(round.target.radiusCm / ARENA_CM) * SIZE} />
      <polyline className="laser-beam" fill="none" points={path} />
      {scene.elements.map((element, index) =>
        element.kind === "mirror" ? (
          <g key={index}>
            <line className="laser-mirror" x1={px(element.start.x)} x2={px(element.end.x)} y1={py(element.start.y)} y2={py(element.end.y)} />
            <text className="balance-plot__pivot-label" x={px(element.end.x) + 6} y={py(element.end.y) - 6}>
              M{index + 1}
            </text>
          </g>
        ) : null,
      )}
      <rect className="laser-source" height="12" width="22" x={px(round.laser.xCm) - 18} y={py(round.laser.yCm) - 6} />
      <g className="detective-legend">
        <text x="450" y="60">Red line: the laser beam</text>
        <text x="450" y="84">Dark bars: mirrors (M1, M2…)</text>
        <text x="450" y="108">Green circle: the target</text>
        <text x="450" y="132">{status}</text>
      </g>
    </svg>
  );
}

export function LaserMazePage() {
  return (
    <RoundGamePage
      definition={laserMaze}
      renderControls={(game) => (
        <>
          {game.round.mirrors.map((_, index) => (
            <RangeControl
              disabled={!game.canEdit}
              displayValue={`${game.control.mirrorAnglesDegrees[index]?.toFixed(1)}°`}
              id={`mirror-angle-${index}`}
              key={index}
              label={`Mirror ${index + 1} angle`}
              maximum={MIRROR_ANGLE_RANGE.maximum}
              minimum={MIRROR_ANGLE_RANGE.minimum}
              onChange={(angle) =>
                game.setControl((current) => ({
                  mirrorAnglesDegrees: current.mirrorAnglesDegrees.map((value, i) => (i === index ? angle : value)),
                }))
              }
              step={MIRROR_ANGLE_RANGE.step}
              value={game.control.mirrorAnglesDegrees[index] as number}
            />
          ))}
        </>
      )}
      renderMeasurements={(game) => {
        const trace = traceLaser(game.round, game.control);
        const firstReflection = trace.events.find((e) => e.kind === "reflection");
        return [
          { label: "INCIDENCE AT FIRST MIRROR", value: firstReflection ? `${firstReflection.incidenceDegrees.toFixed(1)}°` : "—" },
          { label: "INTERACTIONS", value: String(trace.events.length) },
          { label: "CLOSEST TO TARGET", value: trace.closestApproach === null ? "—" : `${trace.closestApproach.toFixed(1)} cm` },
          { label: "BEAM", value: trace.hitTarget ? "On target" : "Off target" },
        ];
      }}
      renderVisual={(game) => <Bench control={game.control} round={game.round} />}
    />
  );
}
