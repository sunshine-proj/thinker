import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateBernoulliPressureDrop, calculatePoiseuilleFlow, calculateSpeedFromFlow } from "../../../physics/fluids";
import { NOZZLE_FLOW, NOZZLE_TARGET_SPEED, OIL_LENGTH, OIL_PRESSURE, OIL_VISCOSITY, PIPE_DIAMETER, VENTURI_FLOW, VENTURI_TARGET_PA, pipePuzzle, runPipe } from "./pipePuzzle";

const range = (from: number, to: number, count = 120) => Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));

export const PipePuzzlePage = createNumericGamePage({
  definition: pipePuzzle,
  measurements: (game) => {
    const o = runPipe(game.round, game.control);
    const label = game.round.kind === "nozzle" ? ["EXIT SPEED", `${o.speed.toFixed(2)} m/s`] : game.round.kind === "venturi" ? ["PRESSURE DROP", `${(o.measured / 1000).toFixed(1)} kPa`] : ["FLOW RATE", `${(o.measured * 1000).toFixed(3)} L/s`];
    return [
      { label: label[0]!, value: label[1]! },
      { label: "DIAMETER", value: `${(game.control.diameter as number).toFixed(1)} mm` },
      { label: "SPEED", value: `${o.speed.toFixed(2)} m/s` },
      { label: "REYNOLDS NUMBER", value: o.reynolds === null ? "—" : o.reynolds.toFixed(0) },
    ];
  },
  visual: (game) => {
    const d = game.control.diameter as number;
    if (game.round.kind === "nozzle") {
      const points = range(4, 30).map((x) => ({ x, y: calculateSpeedFromFlow(NOZZLE_FLOW, x / 1000) }));
      return <LineChart description="Jet speed against nozzle diameter; the speed falls as the square of the diameter." series={[{ label: "Jet speed", points }, { label: "Target 20 m/s", dashed: true, points: [{ x: 4, y: NOZZLE_TARGET_SPEED }, { x: 30, y: NOZZLE_TARGET_SPEED }] }]} title="Nozzle diameter and jet speed" xDomain={[4, 30]} xLabel="Nozzle diameter (mm)" yDomain={[0, 60]} yLabel="Speed (m/s)" />;
    }
    if (game.round.kind === "venturi") {
      const v1 = calculateSpeedFromFlow(VENTURI_FLOW, PIPE_DIAMETER);
      const points = range(10, 50).map((x) => ({ x, y: calculateBernoulliPressureDrop(v1, calculateSpeedFromFlow(VENTURI_FLOW, x / 1000), 1000) / 1000 }));
      return <LineChart description="Pressure drop in the throat against throat diameter; narrower throats give a larger drop." series={[{ label: "Pressure drop", points }, { label: "Target 40 kPa", dashed: true, points: [{ x: 10, y: VENTURI_TARGET_PA / 1000 }, { x: 50, y: VENTURI_TARGET_PA / 1000 }] }]} title="Throat diameter and pressure drop" xDomain={[10, 50]} xLabel="Throat diameter (mm)" yDomain={[0, 200]} yLabel="Pressure drop (kPa)" />;
    }
    const points = range(10, 60).map((x) => ({ x, y: calculatePoiseuilleFlow(x / 1000, OIL_LENGTH, OIL_VISCOSITY, OIL_PRESSURE) * 1000 }));
    return <LineChart description={`Laminar oil flow against pipe diameter; it rises as the fourth power. At ${d.toFixed(1)} millimeters the flow is ${(calculatePoiseuilleFlow(d / 1000, OIL_LENGTH, OIL_VISCOSITY, OIL_PRESSURE) * 1000).toFixed(2)} liters per second.`} series={[{ label: "Flow", points }, { label: "Target 1 L/s", dashed: true, points: [{ x: 10, y: 1 }, { x: 60, y: 1 }] }]} title="Pipe diameter and flow" xDomain={[10, 60]} xLabel="Pipe diameter (mm)" yDomain={[0, 6]} yLabel="Flow (L/s)" />;
  },
});
