import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { STANDARD_GRAVITY } from "../../../physics/core";
import { TENNIS_BALL, calculateBallTerminalSpeed, calculateReboundHeight, simulateBallFlight } from "../../../physics/mechanics";
import { DROP_HEIGHT, REBOUND_HIGH, REBOUND_LOW, SERVE_ANGLE, SERVE_HEIGHT, SERVICE_LINE, runTennis, tennisPhysics } from "./tennisPhysics";

export const TennisPhysicsPage = createNumericGamePage({
  definition: tennisPhysics,
  measurements: (game) => {
    const o = runTennis(game.round, game.control);
    return [
      { label: "RANGE WITH DRAG", value: o.range === null ? "—" : `${o.range.toFixed(1)} m` },
      { label: "RANGE WITHOUT AIR", value: o.rangeWithoutDrag === null ? "—" : `${o.rangeWithoutDrag.toFixed(1)} m` },
      { label: "REBOUND HEIGHT", value: o.reboundHeight === null ? "—" : `${(o.reboundHeight * 100).toFixed(0)} cm` },
      { label: "TERMINAL SPEED", value: `${o.terminalSpeed.toFixed(1)} m/s` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "serve") {
      const launch = { speed: game.control.speed as number, angleDegrees: SERVE_ANGLE, height: SERVE_HEIGHT };
      const drag = simulateBallFlight(TENNIS_BALL, launch, true, 0.002).points;
      const free = simulateBallFlight(TENNIS_BALL, launch, false, 0.002).points;
      return <LineChart description={`Serve path with and without air resistance. The service line is ${SERVICE_LINE} meters away.`} series={[{ label: "With drag", points: drag.map((p) => ({ ...p })) }, { label: "Without air", dashed: true, points: free.map((p) => ({ ...p })) }, { label: "Service line", points: [{ x: SERVICE_LINE, y: 0 }, { x: SERVICE_LINE, y: 0.6 }] }]} title="Flight of the serve" xDomain={[0, 40]} xLabel="Distance (m)" yDomain={[0, 3]} yLabel="Height (m)" />;
    }
    if (game.round.kind === "bounce") {
      const points = Array.from({ length: 50 }, (_, i) => {
        const e = 0.5 + (0.4 * i) / 49;
        return { x: e, y: calculateReboundHeight(DROP_HEIGHT, e) * 100 };
      });
      const e = game.control.restitution as number;
      return <LineChart description="Rebound height in centimeters against restitution, with the legal band 135 to 147 centimeters." series={[{ label: "Rebound", points }, { label: "Legal minimum", dashed: true, points: [{ x: 0.5, y: REBOUND_LOW * 100 }, { x: 0.9, y: REBOUND_LOW * 100 }] }, { label: "Legal maximum", dashed: true, points: [{ x: 0.5, y: REBOUND_HIGH * 100 }, { x: 0.9, y: REBOUND_HIGH * 100 }] }, { label: "Your ball", dashed: true, points: [{ x: e, y: 0 }, { x: e, y: 200 }] }]} title="The regulation bounce" xDomain={[0.5, 0.9]} xLabel="Coefficient of restitution e" yDomain={[0, 210]} yLabel="Rebound height (cm)" />;
    }
    const vt = calculateBallTerminalSpeed(TENNIS_BALL);
    const points = Array.from({ length: 80 }, (_, i) => {
      const t = (8 * i) / 79;
      return { x: t, y: vt * Math.tanh((STANDARD_GRAVITY * t) / vt) };
    });
    const guess = game.control.speed as number;
    return <LineChart description="Speed of a falling tennis ball against time: it approaches the terminal speed and stops accelerating." series={[{ label: "Falling ball", points }, { label: "Your speed", dashed: true, points: [{ x: 0, y: guess }, { x: 8, y: guess }] }]} title="Approaching terminal speed" xDomain={[0, 8]} xLabel="Time (s)" yDomain={[0, 60]} yLabel="Speed (m/s)" />;
  },
});
