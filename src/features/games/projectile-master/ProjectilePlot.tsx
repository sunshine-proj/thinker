import type { ProjectileTrajectory } from "./projectileMasterModel";

export const INITIAL_SPEED_METERS_PER_SECOND = 22;
export const INITIAL_ANGLE_DEGREES = 45;
const PLOT = { left: 66, right: 930, top: 28, bottom: 372 } as const;
const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 420;

export function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function ProjectilePlot({
  trajectory,
  targetDistanceMeters,
  targetRadiusMeters,
  title,
}: {
  trajectory: ProjectileTrajectory | null;
  targetDistanceMeters: number;
  targetRadiusMeters: number;
  title: string;
}) {
  const maxDistanceMeters = Math.max(
    targetDistanceMeters * 1.2,
    (trajectory?.horizontalRangeMeters ?? 0) * 1.12,
    10,
  );
  const maxHeightMeters = Math.max(
    (trajectory?.maximumHeightMeters ?? 0) * 1.18,
    8,
  );
  const x = (distance: number) =>
    PLOT.left +
    (distance / maxDistanceMeters) * (PLOT.right - PLOT.left);
  const y = (height: number) =>
    PLOT.bottom -
    (height / maxHeightMeters) * (PLOT.bottom - PLOT.top);
  const path = trajectory
    ? trajectory.points
        .map(
          (point, index) =>
            `${index === 0 ? "M" : "L"} ${x(point.x)} ${y(point.y)}`,
        )
        .join(" ")
    : null;
  const tickCount = 4;

  return (
    <svg
      aria-label={title}
      className="projectile-plot"
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <rect
        fill="#f9faff"
        height={VIEWBOX_HEIGHT}
        rx="10"
        width={VIEWBOX_WIDTH}
      />
      {Array.from({ length: tickCount + 1 }, (_, index) => {
        const distance = (maxDistanceMeters * index) / tickCount;
        const tickX = x(distance);
        return (
          <g key={`x-${index}`}>
            <line
              stroke="#e9edf5"
              x1={tickX}
              x2={tickX}
              y1={PLOT.top}
              y2={PLOT.bottom}
            />
            <text
              fill="#858da0"
              fontSize="11"
              textAnchor="middle"
              x={tickX}
              y={PLOT.bottom + 22}
            >
              {formatNumber(distance, 0)} m
            </text>
          </g>
        );
      })}
      {Array.from({ length: tickCount + 1 }, (_, index) => {
        const height = (maxHeightMeters * index) / tickCount;
        const tickY = y(height);
        return (
          <g key={`y-${index}`}>
            <line
              stroke="#e9edf5"
              x1={PLOT.left}
              x2={PLOT.right}
              y1={tickY}
              y2={tickY}
            />
            <text
              fill="#858da0"
              fontSize="11"
              textAnchor="end"
              x={PLOT.left - 10}
              y={tickY + 4}
            >
              {formatNumber(height, 0)} m
            </text>
          </g>
        );
      })}
      <line
        stroke="#b9c0d0"
        strokeWidth="1.5"
        x1={PLOT.left}
        x2={PLOT.right}
        y1={PLOT.bottom}
        y2={PLOT.bottom}
      />
      <line
        stroke="#b9c0d0"
        strokeWidth="1.5"
        x1={PLOT.left}
        x2={PLOT.left}
        y1={PLOT.top}
        y2={PLOT.bottom}
      />
      <text
        fill="#677187"
        fontSize="11"
        textAnchor="middle"
        x={(PLOT.left + PLOT.right) / 2}
        y={VIEWBOX_HEIGHT - 8}
      >
        Horizontal distance
      </text>
      <circle
        cx={x(targetDistanceMeters)}
        cy={PLOT.bottom}
        fill="rgb(237 159 68 / 18%)"
        r={Math.max(
          9,
          (targetRadiusMeters / maxDistanceMeters) *
            (PLOT.right - PLOT.left),
        )}
      />
      <circle
        cx={x(targetDistanceMeters)}
        cy={PLOT.bottom}
        fill="#ed9f44"
        r="6"
      />
      <text
        fill="#b8792b"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
        x={x(targetDistanceMeters)}
        y={PLOT.bottom - 18}
      >
        TARGET
      </text>
      {trajectory && path && (
        <>
          <path
            d={path}
            fill="none"
            stroke="#596be0"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <circle
            cx={x(trajectory.horizontalRangeMeters)}
            cy={PLOT.bottom}
            fill={Math.abs(
              trajectory.horizontalRangeMeters - targetDistanceMeters,
            ) <= targetRadiusMeters
              ? "#2aab83"
              : "#596be0"}
            r="6"
            stroke="#fff"
            strokeWidth="2"
          />
        </>
      )}
      {!trajectory && (
        <text
          fill="#9aa1b1"
          fontSize="14"
          textAnchor="middle"
          x={(PLOT.left + PLOT.right) / 2}
          y={(PLOT.top + PLOT.bottom) / 2}
        >
          Enter a prediction, then launch to see your trajectory
        </text>
      )}
    </svg>
  );
}

