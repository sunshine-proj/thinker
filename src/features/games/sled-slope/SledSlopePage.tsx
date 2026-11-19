import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { SLED_ON_SNOW, calculateCriticalAngle, calculateRunOutDistance, calculateSlopeAcceleration, calculateSpeedAtBottom } from "../../../physics/mechanics";
import { RUNOUT_SLOPE, RUNOUT_TARGET, WOOD, runSled, sledSlope } from "./sledSlope";

export const SledSlopePage = createNumericGamePage({
  definition: sledSlope,
  measurements: (game) => {
    const o = runSled(game.round, game.control);
    if (game.round.kind === "slip") {
      const angle = game.control.angle as number;
      const rad = (angle * Math.PI) / 180;
      return [
        { label: "PULL DOWN THE SLOPE ÷ WEIGHT", value: Math.sin(rad).toFixed(3) },
        { label: "MAX STATIC FRICTION ÷ WEIGHT", value: (SLED_ON_SNOW.staticCoefficient * Math.cos(rad)).toFixed(3) },
        { label: "STATE", value: angle >= calculateCriticalAngle(SLED_ON_SNOW) ? "Sliding" : "Held by friction" },
      ];
    }
    if (game.round.kind === "runout") {
      const speed = calculateSpeedAtBottom(game.control.length as number, RUNOUT_SLOPE, SLED_ON_SNOW.kineticCoefficient);
      return [
        { label: "SPEED AT THE BOTTOM", value: `${speed.toFixed(2)} m/s` },
        { label: "GLIDE ON THE FLAT", value: `${o.headline.toFixed(1)} m` },
        { label: "FINISH ZONE", value: `${RUNOUT_TARGET} m` },
      ];
    }
    return [
      { label: "ACCELERATION DOWN THE RAMP", value: `${o.headline.toFixed(2)} m/s²` },
      { label: "STATE AFTER A NUDGE", value: Math.abs(o.headline) < 0.05 ? "Steady speed" : o.headline > 0 ? "Speeding up" : "Slowing down" },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "runout") {
      const points = Array.from({ length: 77 }, (_, i) => {
        const length = 1 + (19 * i) / 76;
        return { x: length, y: calculateRunOutDistance(calculateSpeedAtBottom(length, RUNOUT_SLOPE, SLED_ON_SNOW.kineticCoefficient), SLED_ON_SNOW.kineticCoefficient) };
      });
      const length = game.control.length as number;
      return <LineChart description="Glide distance on the flat against slope length; it grows in proportion to the slope length." series={[{ label: "Glide distance", points }, { label: "Finish zone", dashed: true, points: [{ x: 1, y: RUNOUT_TARGET }, { x: 20, y: RUNOUT_TARGET }] }, { label: "Your slope", dashed: true, points: [{ x: length, y: 0 }, { x: length, y: 90 }] }]} title="Slope length and glide" xDomain={[1, 20]} xLabel="Slope length (m)" yDomain={[0, 90]} yLabel="Glide (m)" />;
    }
    const surface = game.round.kind === "slip" ? SLED_ON_SNOW : WOOD;
    const max = game.round.kind === "slip" ? 30 : 40;
    const angle = game.control.angle as number;
    const points = Array.from({ length: 81 }, (_, i) => {
      const deg = (max * i) / 80;
      return { x: deg, y: calculateSlopeAcceleration(deg, surface.kineticCoefficient) };
    });
    return <LineChart description="Acceleration of a sliding body against slope angle. Below zero, friction slows it; where the line crosses zero it slides at constant speed." series={[{ label: "Acceleration while sliding", points }, { label: "Your angle", dashed: true, points: [{ x: angle, y: -3 }, { x: angle, y: 5 }] }]} title="Friction on the slope" xDomain={[0, max]} xLabel="Slope angle (°)" yDomain={[-3, 5]} yLabel="Acceleration (m/s²)" />;
  },
});
