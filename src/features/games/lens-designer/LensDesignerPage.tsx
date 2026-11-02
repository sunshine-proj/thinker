import { RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import { calculateBlurDiameter } from "../../../physics/optics";
import type { LensControl, LensRound } from "./lensDesignerData";
import { calculateLensGeometry, lensDesigner } from "./lensDesignerModel";

const WIDTH = 960;
const HEIGHT = 320;
const LEFT = 30;
const RIGHT = 930;
const AXIS_Y = 160;

function Bench({ round, control }: { round: LensRound; control: LensControl }) {
  const geometry = calculateLensGeometry(round, control);
  const { view, objectHeightCm: h0, apertureCm } = round;
  const p = control.positionCm;
  const f = geometry.focalLengthCm;
  const di = geometry.imageDistanceCm;
  const imageHeight = geometry.imageHeightCm;
  const x = (cm: number) => LEFT + ((cm - view.minimumCm) / (view.maximumCm - view.minimumCm)) * (RIGHT - LEFT);
  const hMax = Math.max(h0, Math.abs(imageHeight ?? 0), apertureCm / 2) * 1.15;
  const yScale = 120 / hMax;
  const y = (cm: number) => AXIS_Y - cm * yScale;

  const rayEnd = (slope: number, startX: number, startY: number) => {
    // Extend a ray from (startX, startY) with the given slope (cm/cm) to the right edge.
    const dx = view.maximumCm - startX;
    return { x: view.maximumCm, y: startY + slope * dx };
  };
  const tip = { x: p + (di ?? 0), y: imageHeight ?? 0 };
  const real = geometry.isReal && di !== null;

  const segments: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }[] = [
    // Incoming rays: tip → lens plane.
    { x1: 0, y1: h0, x2: p, y2: h0 },
    { x1: 0, y1: h0, x2: p, y2: 0 },
  ];
  if (real) {
    segments.push({ x1: p, y1: h0, x2: tip.x, y2: tip.y }, { x1: p, y1: 0, x2: tip.x, y2: tip.y });
  } else {
    const r1 = rayEnd(-h0 / f, p, h0);
    const r2 = rayEnd(-h0 / p, p, 0);
    segments.push({ x1: p, y1: h0, x2: r1.x, y2: r1.y }, { x1: p, y1: 0, x2: r2.x, y2: r2.y });
    if (di !== null) {
      segments.push(
        { x1: p, y1: h0, x2: tip.x, y2: tip.y, dashed: true },
        { x1: p, y1: 0, x2: tip.x, y2: tip.y, dashed: true },
      );
    }
  }

  const description =
    di === null
      ? "No image forms because the object is at the focal point."
      : `${real ? "Real, inverted" : "Virtual, upright"} image ${Math.abs(di).toFixed(1)} centimeters ${real ? "behind" : "in front of"} the lens, ${Math.abs(geometry.magnification ?? 0).toFixed(2)} times the object size.`;

  return (
    <svg
      aria-label={`Optical bench. Object ${h0} centimeters tall at 0. Lens ${p.toFixed(1)} centimeters from the object with focal length ${f.toFixed(1)} centimeters. ${round.screenDistanceCm !== null ? `Screen ${round.screenDistanceCm} centimeters from the object. ` : ""}${description}`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      <defs>
        <clipPath id="bench-clip">
          <rect height={HEIGHT - 30} width={RIGHT - LEFT} x={LEFT} y="10" />
        </clipPath>
      </defs>
      <rect fill="#f9faff" height={HEIGHT} rx="10" width={WIDTH} />
      <line stroke="#9aa5cf" strokeDasharray="4 4" x1={LEFT} x2={RIGHT} y1={AXIS_Y} y2={AXIS_Y} />

      {round.screenDistanceCm !== null && (
        <g>
          <line stroke="#364057" strokeWidth="5" x1={x(round.screenDistanceCm)} x2={x(round.screenDistanceCm)} y1={AXIS_Y - 110} y2={AXIS_Y + 110} />
          <text className="balance-plot__pivot-label" textAnchor="middle" x={x(round.screenDistanceCm)} y={AXIS_Y + 128}>screen</text>
        </g>
      )}

      <g clipPath="url(#bench-clip)">
        {segments.map((s, index) => (
          <line
            className="lens-ray"
            key={index}
            strokeDasharray={s.dashed ? "5 5" : undefined}
            x1={x(s.x1)}
            x2={x(s.x2)}
            y1={y(s.y1)}
            y2={y(s.y2)}
          />
        ))}
      </g>

      {/* Object */}
      <g className="lens-object">
        <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(h0)} />
        <polygon points={`${x(0) - 6},${y(h0) + 10} ${x(0) + 6},${y(h0) + 10} ${x(0)},${y(h0)}`} />
        <text textAnchor="middle" x={x(0)} y={AXIS_Y + 24}>object</text>
      </g>

      {/* Image */}
      {di !== null && imageHeight !== null && tip.x >= view.minimumCm && tip.x <= view.maximumCm && (
        <g className={real ? "lens-image" : "lens-image lens-image--virtual"}>
          <line x1={x(tip.x)} x2={x(tip.x)} y1={y(0)} y2={y(tip.y)} />
          <text textAnchor="middle" x={x(tip.x)} y={AXIS_Y + 40}>{real ? "real image" : "virtual image"}</text>
        </g>
      )}

      {/* Lens */}
      <path
        className="lens-body"
        d={`M ${x(p)} ${y(apertureCm / 2)} Q ${x(p) + 14} ${AXIS_Y} ${x(p)} ${y(-apertureCm / 2)} Q ${x(p) - 14} ${AXIS_Y} ${x(p)} ${y(apertureCm / 2)} Z`}
      />
      {[p - f, p + f].map((fx, index) => (
        <g className="balance-plot__tick" key={index}>
          <circle cx={x(fx)} cy={AXIS_Y} fill="#364057" r="3" />
          <text textAnchor="middle" x={x(fx)} y={AXIS_Y - 8}>F</text>
        </g>
      ))}
    </svg>
  );
}

export function LensDesignerPage() {
  return (
    <RoundGamePage
      definition={lensDesigner}
      renderControls={(game) => (
        <>
          {game.round.radius.fixed === null ? (
            <RangeControl
              disabled={!game.canEdit}
              displayValue={`${game.control.radiusCm.toFixed(2)} cm`}
              id="lens-radius"
              label="Surface radius of curvature"
              maximum={game.round.radius.maximumCm}
              minimum={game.round.radius.minimumCm}
              onChange={(radiusCm) => game.setControl((current) => ({ ...current, radiusCm }))}
              step={game.round.radius.stepCm}
              value={game.control.radiusCm}
            />
          ) : (
            <p className="game-instructions">
              Lens fixed: radius {game.round.radius.fixed} cm on both faces, glass n = {game.round.refractiveIndex.toFixed(2)}.
            </p>
          )}
          <RangeControl
            disabled={!game.canEdit}
            displayValue={`${game.control.positionCm.toFixed(2)} cm`}
            id="lens-position"
            label="Lens distance from the object"
            maximum={game.round.position.maximumCm}
            minimum={game.round.position.minimumCm}
            onChange={(positionCm) => game.setControl((current) => ({ ...current, positionCm }))}
            step={game.round.position.stepCm}
            value={game.control.positionCm}
          />
        </>
      )}
      renderMeasurements={(game) => {
        const g = calculateLensGeometry(game.round, game.control);
        const screenDistance =
          game.round.screenDistanceCm === null ? null : game.round.screenDistanceCm - game.control.positionCm;
        const blur =
          g.isReal && g.imageDistanceCm !== null && screenDistance !== null
            ? calculateBlurDiameter(game.round.apertureCm, g.imageDistanceCm, screenDistance) * 10
            : null;
        return [
          { label: "FOCAL LENGTH", value: `${g.focalLengthCm.toFixed(2)} cm` },
          {
            label: "IMAGE DISTANCE",
            value: g.imageDistanceCm === null ? "no image" : `${g.imageDistanceCm.toFixed(1)} cm${g.isReal ? "" : " (virtual)"}`,
          },
          {
            label: "MAGNIFICATION",
            value: g.magnification === null ? "—" : `${g.magnification > 0 ? "+" : "−"}${Math.abs(g.magnification).toFixed(2)}×`,
          },
          { label: "BLUR ON SCREEN", value: blur === null ? "n/a" : `${blur.toFixed(2)} mm` },
        ];
      }}
      renderVisual={(game) => <Bench control={game.control} round={game.round} />}
    />
  );
}
