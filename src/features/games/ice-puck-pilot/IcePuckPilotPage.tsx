import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateBrakingDistance, calculateSpeedAfterPush } from "../../../physics/mechanics";
import { BRAKE_FORCE, GLIDE_SPEED, GOAL_LINE, PUCK_MASS, PUSH_TIME, PUSH_TARGET_SPEED, icePuckPilot, runPuck } from "./icePuckPilot";

const sample = (n: number, f: (i: number) => { x: number; y: number }) => Array.from({ length: n }, (_, i) => f(i));

export const IcePuckPilotPage = createNumericGamePage({
  definition: icePuckPilot,
  measurements: (game) => {
    const o = runPuck(game.round, game.control);
    if (game.round.kind === "push") {
      return [
        { label: "ACCELERATION", value: `${((game.control.force as number) / PUCK_MASS).toFixed(1)} m/s²` },
        { label: "SPEED AFTER THE PUSH", value: `${o.headline.toFixed(2)} m/s` },
        { label: "TARGET", value: `${PUSH_TARGET_SPEED} m/s` },
      ];
    }
    if (game.round.kind === "brake") {
      return [
        { label: "BRAKING DISTANCE", value: `${calculateBrakingDistance(PUCK_MASS, GLIDE_SPEED, BRAKE_FORCE).toFixed(1)} m` },
        { label: "STOPS AT", value: `${o.headline.toFixed(2)} m` },
        { label: "GOAL LINE", value: `${GOAL_LINE} m` },
      ];
    }
    return [
      { label: "IMPULSE ON EACH", value: "60 N·s" },
      { label: "YOUR SLED SPEED", value: `${(game.control.sledSpeed as number).toFixed(2)} m/s` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "push") {
      const force = game.control.force as number;
      const points = sample(61, (i) => {
        const t = (2 * i) / 60;
        return { x: t, y: calculateSpeedAfterPush(PUCK_MASS, force, Math.min(t, PUSH_TIME)) };
      });
      return <LineChart description={`Speed against time: it rises during the ${PUSH_TIME} second push, then stays constant because no force acts.`} series={[{ label: "Puck speed", points }, { label: "Target speed", dashed: true, points: [{ x: 0, y: PUSH_TARGET_SPEED }, { x: 2, y: PUSH_TARGET_SPEED }] }]} title="Speed of the puck" xDomain={[0, 2]} xLabel="Time (s)" yDomain={[0, 10]} yLabel="Speed (m/s)" />;
    }
    if (game.round.kind === "brake") {
      const start = game.control.brakeStart as number;
      const a = BRAKE_FORCE / PUCK_MASS;
      const glideTime = start / GLIDE_SPEED;
      const stopTime = glideTime + GLIDE_SPEED / a;
      const points = sample(81, (i) => {
        const t = (stopTime * 1.2 * i) / 80;
        if (t <= glideTime) return { x: t, y: GLIDE_SPEED * t };
        const tb = Math.min(t - glideTime, GLIDE_SPEED / a);
        return { x: t, y: start + GLIDE_SPEED * tb - 0.5 * a * tb * tb };
      });
      return <LineChart description="Position against time: a straight line while gliding at constant speed, then a curve that flattens as the puck brakes to a stop." series={[{ label: "Position", points }, { label: "Goal line", dashed: true, points: [{ x: 0, y: GOAL_LINE }, { x: stopTime * 1.2, y: GOAL_LINE }] }]} title="Gliding and braking" xLabel="Time (s)" yDomain={[0, 16]} yLabel="Position (m)" />;
    }
    const masses = sample(50, (i) => ({ x: 5 + i * 2, y: 60 / (5 + i * 2) }));
    return <LineChart description="Speed after a 60 newton-second push against mass: lighter bodies move off faster. The sled is 20 kilograms and the skater 60." series={[{ label: "Speed = 60 N·s ÷ mass", points: masses }, { label: "Your sled speed", dashed: true, points: [{ x: 20, y: 0 }, { x: 20, y: game.control.sledSpeed as number }] }]} title="Same push, different masses" xDomain={[5, 103]} xLabel="Mass (kg)" yDomain={[0, 6]} yLabel="Speed (m/s)" />;
  },
});
