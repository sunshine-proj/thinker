import type { PointLoad } from "../../../physics/mechanics";
import type { BalanceRound } from "./balanceChallengeData";
import { getBackgroundLoads, getControlRange, getControlledLoad, type BalanceAttemptResult } from "./balanceChallengeModel";

export interface Release {
  readonly controlValue: number;
  readonly result: BalanceAttemptResult;
}

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 380;
const DOMAIN_METERS = 7.5;
const PIVOT_Y = 270;
const PLOT_LEFT = 50;
const PLOT_RIGHT = 910;
const PIXELS_PER_METER = (PLOT_RIGHT - PLOT_LEFT) / (2 * DOMAIN_METERS);
const PIVOT_X = (PLOT_LEFT + PLOT_RIGHT) / 2;
const BEAM_THICKNESS = 14;
/** Largest drawn tilt, in degrees. The tilt shows direction and relative size only. */
const MAX_DRAWN_TILT_DEGREES = 9;

export function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function getInitialControlValue(round: BalanceRound): number {
  const { minimum, maximum, step } = getControlRange(round);
  const steps = Math.round((maximum - minimum) / step / 2);
  return Number((minimum + steps * step).toFixed(6));
}

export function getControlUnit(round: BalanceRound): "m" | "kg" {
  return round.control.kind === "position" ? "m" : "kg";
}

function blockSize(massKilograms: number): number {
  return 18 + 9 * Math.sqrt(massKilograms);
}

function describeLoads(loads: readonly PointLoad[]): string {
  return loads
    .map((load) => {
      const side = load.positionMeters < 0 ? "left" : "right";
      return `${formatNumber(load.massKilograms)} kilograms ${formatNumber(Math.abs(load.positionMeters))} meters ${side}`;
    })
    .join("; ");
}

export function BalancePlot({
  round,
  controlValue,
  release,
}: {
  round: BalanceRound;
  controlValue: number;
  release: Release | null;
}) {
  const x = (meters: number) => PIVOT_X + meters * PIXELS_PER_METER;
  const toleranceReference = release
    ? Math.max(release.result.toleranceNewtonMeters * 6, 1)
    : 1;
  const tiltDegrees = release
    ? release.result.balanced
      ? 0
      : Math.max(
          -MAX_DRAWN_TILT_DEGREES,
          Math.min(
            MAX_DRAWN_TILT_DEGREES,
            (release.result.netTorqueNewtonMeters / toleranceReference) *
              MAX_DRAWN_TILT_DEGREES,
          ),
        )
    : 0;
  const controlled = getControlledLoad(round, controlValue);
  const beamTop = PIVOT_Y - BEAM_THICKNESS;
  const ticks = Array.from(
    { length: Math.floor(round.beamRightMeters - round.beamLeftMeters) + 1 },
    (_, index) => Math.ceil(round.beamLeftMeters) + index,
  ).filter((tick) => tick <= round.beamRightMeters);

  const renderBlock = (
    load: PointLoad,
    key: string,
    className: string,
    label: string,
  ) => {
    const size = blockSize(load.massKilograms);
    return (
      <g className={className} key={key}>
        <rect
          height={size}
          rx="4"
          width={size}
          x={x(load.positionMeters) - size / 2}
          y={beamTop - size}
        />
        <text
          textAnchor="middle"
          x={x(load.positionMeters)}
          y={beamTop - size / 2 + 4}
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg
      aria-label={`Lever with the pivot at 0 meters. Fixed loads: ${describeLoads(getBackgroundLoads(round))}. Your mass: ${describeLoads([controlled])}. ${release ? (release.result.balanced ? "The lever is balanced." : release.result.state === "clockwise" ? "The lever tips down on the right." : "The lever tips down on the left.") : "The lever is held level until you release it."}`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <rect
        fill="#f9faff"
        height={VIEWBOX_HEIGHT}
        rx="10"
        width={VIEWBOX_WIDTH}
      />
      <line
        stroke="#d9deea"
        x1={PLOT_LEFT}
        x2={PLOT_RIGHT}
        y1={PIVOT_Y + 52}
        y2={PIVOT_Y + 52}
      />
      <polygon
        className="balance-plot__pivot"
        points={`${PIVOT_X - 34},${PIVOT_Y + 52} ${PIVOT_X + 34},${PIVOT_Y + 52} ${PIVOT_X},${PIVOT_Y}`}
      />
      <g
        style={{
          transform: `rotate(${tiltDegrees}deg)`,
          transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px`,
          transition: "transform 450ms ease-out",
        }}
      >
        <rect
          className="balance-plot__beam"
          height={BEAM_THICKNESS}
          rx="3"
          width={(round.beamRightMeters - round.beamLeftMeters) * PIXELS_PER_METER}
          x={x(round.beamLeftMeters)}
          y={beamTop}
        />
        {ticks.map((tick) => (
          <g className="balance-plot__tick" key={`tick-${tick}`}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={PIVOT_Y}
              y2={PIVOT_Y + 6}
            />
            <text textAnchor="middle" x={x(tick)} y={PIVOT_Y + 20}>
              {tick}
            </text>
          </g>
        ))}
        {round.fixedLoads.map((load, index) =>
          renderBlock(
            load,
            `fixed-${index}`,
            "balance-plot__block",
            `${formatNumber(load.massKilograms, 0)} kg`,
          ),
        )}
        {renderBlock(
          controlled,
          "controlled",
          "balance-plot__block balance-plot__block--yours",
          `${formatNumber(controlled.massKilograms, round.control.kind === "mass" ? 1 : 0)} kg`,
        )}
        {round.beamMassKilograms > 0 && (
          <g className="balance-plot__centre">
            <circle
              cx={x((round.beamLeftMeters + round.beamRightMeters) / 2)}
              cy={beamTop + BEAM_THICKNESS / 2}
              r="4"
            />
            <text
              textAnchor="middle"
              x={x((round.beamLeftMeters + round.beamRightMeters) / 2)}
              y={beamTop + BEAM_THICKNESS + 34}
            >
              beam {formatNumber(round.beamMassKilograms, 0)} kg
            </text>
          </g>
        )}
      </g>
      <text className="balance-plot__pivot-label" textAnchor="middle" x={PIVOT_X} y={PIVOT_Y + 74}>
        pivot · 0 m
      </text>
    </svg>
  );
}

