import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateGlideRatio, calculateLift, calculateLiftCoefficient, calculateRequiredLiftCoefficient } from "../../../physics/fluids";
import { ASPECT_RATIO, EFFICIENCY, MASS, MAXIMUM_LIFT_COEFFICIENT, PARASITIC_DRAG, WING_AREA, flightSimulator, runFlight } from "./flightSimulator";

export const FlightSimulatorPage = createNumericGamePage({
  definition: flightSimulator,
  measurements: (game) => {
    const o = runFlight(game.round, game.control);
    return [
      { label: "LIFT", value: `${(o.liftNewtons / 1000).toFixed(2)} kN` },
      { label: "WEIGHT", value: `${(o.weightNewtons / 1000).toFixed(2)} kN` },
      { label: "LIFT COEFFICIENT", value: `${o.liftCoefficient.toFixed(3)}${o.stalled ? " (stalled)" : ""}` },
      { label: "LIFT / DRAG", value: o.glideRatio === null ? "—" : o.glideRatio.toFixed(1) },
    ];
  },
  visual: (game) => {
    const weight = MASS * 9.80665;
    if (game.round.kind === "takeoff") {
      const points = Array.from({ length: 100 }, (_, i) => {
        const speed = 10 + (50 * i) / 99;
        return { x: speed, y: calculateLift(speed, WING_AREA, MAXIMUM_LIFT_COEFFICIENT) / 1000 };
      });
      return <LineChart description="Lift against speed with the weight as a dashed line; the plane can leave the ground where the curve is above the line." series={[{ label: "Lift", points }, { label: "Weight", dashed: true, points: [{ x: 10, y: weight / 1000 }, { x: 60, y: weight / 1000 }] }]} title="Lift and weight" xDomain={[10, 60]} xLabel="Speed (m/s)" yLabel="Force (kN)" />;
    }
    if (game.round.kind === "angle") {
      const points = Array.from({ length: 100 }, (_, i) => {
        const angle = (20 * i) / 99;
        return { x: angle, y: calculateLiftCoefficient((angle * Math.PI) / 180, ASPECT_RATIO, MAXIMUM_LIFT_COEFFICIENT).value };
      });
      const required = calculateRequiredLiftCoefficient(MASS, 40, WING_AREA);
      return <LineChart description="Lift coefficient against angle of attack, flattening at the stall, with the needed coefficient as a dashed line." series={[{ label: "Lift coefficient", points }, { label: "Needed for level flight", dashed: true, points: [{ x: 0, y: required }, { x: 20, y: required }] }]} title="Lift coefficient and angle" xDomain={[0, 20]} xLabel="Angle of attack (°)" yDomain={[0, 1.8]} yLabel="C_L" />;
    }
    const points = Array.from({ length: 120 }, (_, i) => {
      const speed = 20 + (60 * i) / 119;
      const cl = calculateRequiredLiftCoefficient(MASS, speed, WING_AREA);
      return { x: speed, y: cl > MAXIMUM_LIFT_COEFFICIENT ? 0 : calculateGlideRatio(cl, PARASITIC_DRAG, ASPECT_RATIO, EFFICIENCY) };
    });
    return <LineChart description="Lift-to-drag ratio against airspeed in level flight; it is zero below the stall speed and peaks near 36 meters per second." series={[{ label: "L/D", points }, { label: "Your speed", dashed: true, points: [{ x: game.control.speed as number, y: 0 }, { x: game.control.speed as number, y: 14 }] }]} title="Glide ratio" xDomain={[20, 80]} xLabel="Airspeed (m/s)" yDomain={[0, 14]} yLabel="Lift / drag" />;
  },
});
