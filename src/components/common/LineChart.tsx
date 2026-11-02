export interface ChartSeries {
  readonly label: string;
  readonly points: readonly { readonly x: number; readonly y: number }[];
  readonly dashed?: boolean;
}

export interface ChartBand {
  readonly label: string;
  readonly yMin: number;
  readonly yMax: number;
}

interface LineChartProps {
  readonly title: string;
  /** Text alternative describing what the chart shows. */
  readonly description: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly series: readonly ChartSeries[];
  readonly band?: ChartBand;
  readonly xDomain?: readonly [number, number];
  readonly yDomain?: readonly [number, number];
}

const WIDTH = 640;
const HEIGHT = 300;
const PAD = { left: 58, right: 16, top: 16, bottom: 44 };
const DASHES = ["none", "6 4"];
const STROKES = ["#596be0", "#d98a1f", "#2a9d8f"];

function niceTicks(minimum: number, maximum: number, count = 5): number[] {
  const span = maximum - minimum || 1;
  return Array.from({ length: count }, (_, i) => minimum + (span * i) / (count - 1));
}

function formatTick(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 1e5 || magnitude < 1e-2)) {
    return value.toExponential(1);
  }
  return Number(value.toPrecision(3)).toString();
}

/** Accessible SVG line chart with axes, an optional target band, and a text alternative. */
export function LineChart({
  title,
  description,
  xLabel,
  yLabel,
  series,
  band,
  xDomain,
  yDomain,
}: LineChartProps) {
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const ys = [...all.map((p) => p.y), ...(band ? [band.yMin, band.yMax] : [])];
  const [xMin, xMax] = xDomain ?? [Math.min(0, ...xs), Math.max(1e-9, ...xs)];
  const dataMin = Math.min(...ys, 0);
  const dataMax = Math.max(...ys, 1e-9);
  const padding = (dataMax - dataMin) * 0.08;
  const [yMin, yMax] = yDomain ?? [dataMin - (dataMin < 0 ? padding : 0), dataMax + padding];
  const sx = (x: number) =>
    PAD.left + ((x - xMin) / (xMax - xMin || 1)) * (WIDTH - PAD.left - PAD.right);
  const sy = (y: number) =>
    HEIGHT - PAD.bottom - ((y - yMin) / (yMax - yMin || 1)) * (HEIGHT - PAD.top - PAD.bottom);

  return (
    <figure className="line-chart">
      <svg
        aria-label={`${title}. ${description}`}
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        <rect fill="#f9faff" height={HEIGHT} rx="10" width={WIDTH} />
        {band && (
          <rect
            className="line-chart__band"
            height={Math.abs(sy(band.yMin) - sy(band.yMax))}
            width={WIDTH - PAD.left - PAD.right}
            x={PAD.left}
            y={Math.min(sy(band.yMin), sy(band.yMax))}
          />
        )}
        {niceTicks(yMin, yMax).map((tick) => (
          <g className="line-chart__tick" key={`y-${tick}`}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={sy(tick)} y2={sy(tick)} />
            <text textAnchor="end" x={PAD.left - 6} y={sy(tick) + 4}>
              {formatTick(tick)}
            </text>
          </g>
        ))}
        {niceTicks(xMin, xMax).map((tick) => (
          <text className="line-chart__tick-label" key={`x-${tick}`} textAnchor="middle" x={sx(tick)} y={HEIGHT - PAD.bottom + 16}>
            {formatTick(tick)}
          </text>
        ))}
        <text className="line-chart__axis" textAnchor="middle" x={(PAD.left + WIDTH - PAD.right) / 2} y={HEIGHT - 6}>
          {xLabel}
        </text>
        <text
          className="line-chart__axis"
          textAnchor="middle"
          transform={`rotate(-90 14 ${(PAD.top + HEIGHT - PAD.bottom) / 2})`}
          x={14}
          y={(PAD.top + HEIGHT - PAD.bottom) / 2}
        >
          {yLabel}
        </text>
        {series.map((s, index) => (
          <polyline
            fill="none"
            key={s.label}
            points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
            stroke={STROKES[index % STROKES.length]}
            strokeDasharray={s.dashed ? DASHES[1] : DASHES[0]}
            strokeWidth="2.5"
          />
        ))}
      </svg>
      <figcaption>
        {series.map((s, index) => (
          <span className="line-chart__legend" key={s.label}>
            <span aria-hidden="true" style={{ background: STROKES[index % STROKES.length] }} />
            {s.label}
            {s.dashed ? " (dashed)" : ""}
          </span>
        ))}
        {band && <span className="line-chart__legend">Target: {band.label}</span>}
      </figcaption>
    </figure>
  );
}
