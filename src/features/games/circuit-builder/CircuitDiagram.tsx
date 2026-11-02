import type { CircuitSolution } from "../../../physics/electromagnetism";
import type { CircuitRound } from "./circuitBuilderData";
import type { CircuitLayout } from "./circuitBuilderModel";

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 360;
const BATTERY_X = 90;
const MAIN_Y = 110;
const BRANCH_SPACING = 54;
const RETURN_Y = 330;
const FIRST_NODE_X = 170;
const LAST_NODE_X = 850;
const BOX_WIDTH = 64;
const BOX_HEIGHT = 24;

function formatCurrent(amperes: number): string {
  return amperes >= 1
    ? `${amperes.toFixed(2)} A`
    : `${(amperes * 1000).toFixed(1)} mA`;
}

export function describeLayout(round: CircuitRound, layout: CircuitLayout): string {
  if (layout.length === 0) {
    return "No resistors have been placed yet.";
  }
  return layout
    .map((stage, index) => {
      const values = stage
        .map((resistor) => `${round.inventoryOhms[resistor]} ohms`)
        .join(", ");
      return `Stage ${index + 1}: ${stage.length === 0 ? "empty" : stage.length === 1 ? values : `${values} in parallel`}`;
    })
    .join("; ");
}

export function CircuitDiagram({
  round,
  layout,
  solution,
  overloaded,
}: {
  round: CircuitRound;
  layout: CircuitLayout;
  /** Present after the switch is closed. */
  solution: CircuitSolution | null;
  overloaded: readonly number[];
}) {
  const stageCount = Math.max(layout.length, 1);
  const stageWidth = (LAST_NODE_X - FIRST_NODE_X) / stageCount;
  const readings = new Map<number, number>();
  if (solution) {
    layout.flat().forEach((inventoryIndex, position) => {
      readings.set(
        inventoryIndex,
        solution.resistors[position]?.currentAmperes ?? 0,
      );
    });
  }

  const stageLeftX = (index: number) => FIRST_NODE_X + index * stageWidth + 24;
  const stageRightX = (index: number) =>
    FIRST_NODE_X + (index + 1) * stageWidth - 24;
  const lastRightX =
    layout.length > 0 ? stageRightX(layout.length - 1) : BATTERY_X + 14;

  return (
    <svg
      aria-label={`Circuit schematic with a ${round.sourceVoltageVolts} volt battery. ${describeLayout(round, layout)}${solution ? ` Total current ${formatCurrent(solution.totalCurrentAmperes)}.` : ""}`}
      className="circuit-diagram"
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <rect fill="#f9faff" height={VIEWBOX_HEIGHT} rx="10" width={VIEWBOX_WIDTH} />

      <g className="circuit-diagram__wire">
        <line x1={BATTERY_X} x2={BATTERY_X} y1={MAIN_Y} y2={MAIN_Y + 60} />
        <line x1={BATTERY_X} x2={BATTERY_X} y1={RETURN_Y - 60} y2={RETURN_Y} />
        <line x1={BATTERY_X} x2={LAST_NODE_X + 30} y1={RETURN_Y} y2={RETURN_Y} />
      </g>
      <g className="circuit-diagram__battery">
        <line x1={BATTERY_X - 22} x2={BATTERY_X + 22} y1={MAIN_Y + 60} y2={MAIN_Y + 60} />
        <line x1={BATTERY_X - 11} x2={BATTERY_X + 11} y1={MAIN_Y + 76} y2={MAIN_Y + 76} />
        <line x1={BATTERY_X} x2={BATTERY_X} y1={MAIN_Y + 76} y2={RETURN_Y - 60} />
        <text textAnchor="middle" x={BATTERY_X} y={MAIN_Y + 112}>
          {round.sourceVoltageVolts} V
        </text>
        <text textAnchor="middle" x={BATTERY_X - 32} y={MAIN_Y + 58}>
          +
        </text>
      </g>

      {layout.length === 0 && (
        <>
          <line
            className="circuit-diagram__wire"
            x1={BATTERY_X}
            x2={LAST_NODE_X + 30}
            y1={MAIN_Y}
            y2={MAIN_Y}
          />
          <line
            className="circuit-diagram__wire"
            x1={LAST_NODE_X + 30}
            x2={LAST_NODE_X + 30}
            y1={MAIN_Y}
            y2={RETURN_Y}
          />
          <text className="circuit-diagram__hint" textAnchor="middle" x={480} y={MAIN_Y - 16}>
            Open circuit: add resistors from the box
          </text>
        </>
      )}

      {layout.map((stage, stageIndex) => {
        const leftX = stageLeftX(stageIndex);
        const rightX = stageRightX(stageIndex);
        const previousRightX =
          stageIndex === 0 ? BATTERY_X : stageRightX(stageIndex - 1);
        const centreX = (leftX + rightX) / 2;
        const lastY = MAIN_Y + Math.max(stage.length - 1, 0) * BRANCH_SPACING;
        const connector = (
          <line
            className="circuit-diagram__wire"
            key={`link-${stageIndex}`}
            x1={previousRightX}
            x2={leftX}
            y1={MAIN_Y}
            y2={MAIN_Y}
          />
        );

        return (
          <g key={`stage-${stageIndex}`}>
            {connector}
            <g className="circuit-diagram__wire">
              {stage.length === 0 && (
                <line x1={leftX} x2={rightX} y1={MAIN_Y} y2={MAIN_Y} strokeDasharray="4 5" />
              )}
              {stage.length > 1 && (
                <>
                  <line x1={leftX} x2={leftX} y1={MAIN_Y} y2={lastY} />
                  <line x1={rightX} x2={rightX} y1={MAIN_Y} y2={lastY} />
                </>
              )}
            </g>
            <text className="circuit-diagram__stage" textAnchor="middle" x={centreX} y={MAIN_Y - 40}>
              Stage {stageIndex + 1}
              {stage.length > 1 ? " · parallel" : ""}
              {solution ? ` · ${(solution.stageVoltagesVolts[stageIndex] ?? 0).toFixed(2)} V` : ""}
            </text>
            {stage.map((inventoryIndex, branch) => {
              const y = MAIN_Y + branch * BRANCH_SPACING;
              const isOverloaded = overloaded.includes(inventoryIndex);
              const current = readings.get(inventoryIndex);
              return (
                <g key={`resistor-${inventoryIndex}`}>
                  <g className="circuit-diagram__wire">
                    <line x1={leftX} x2={centreX - BOX_WIDTH / 2} y1={y} y2={y} />
                    <line x1={centreX + BOX_WIDTH / 2} x2={rightX} y1={y} y2={y} />
                  </g>
                  <rect
                    className={
                      isOverloaded
                        ? "circuit-diagram__resistor circuit-diagram__resistor--overloaded"
                        : "circuit-diagram__resistor"
                    }
                    height={BOX_HEIGHT}
                    rx="4"
                    width={BOX_WIDTH}
                    x={centreX - BOX_WIDTH / 2}
                    y={y - BOX_HEIGHT / 2}
                  />
                  <text className="circuit-diagram__value" textAnchor="middle" x={centreX} y={y + 4}>
                    {round.inventoryOhms[inventoryIndex]} Ω
                  </text>
                  {current !== undefined && (
                    <text className="circuit-diagram__reading" textAnchor="middle" x={centreX} y={y + 28}>
                      {formatCurrent(current)}
                      {isOverloaded ? " · overheating" : ""}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {layout.length > 0 && (
        <g className="circuit-diagram__wire">
          <line x1={lastRightX} x2={LAST_NODE_X + 30} y1={MAIN_Y} y2={MAIN_Y} />
          <line x1={LAST_NODE_X + 30} x2={LAST_NODE_X + 30} y1={MAIN_Y} y2={RETURN_Y} />
        </g>
      )}
    </svg>
  );
}
