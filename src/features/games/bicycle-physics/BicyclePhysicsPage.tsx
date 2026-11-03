import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateBicycleSpeed, calculateRiderPower } from "../../../physics/mechanics";
import { CADENCE, CLIMB, FLAT, FLAT_POWER, FLAT_SPEED_KMH, FRONT_TEETH, GEAR_TARGET_KMH, WHEEL_CIRCUMFERENCE, bicyclePhysics, runBike } from "./bicyclePhysics";

export const BicyclePhysicsPage = createNumericGamePage({
  definition: bicyclePhysics,
  measurements: (game) => {
    const o = runBike(game.round, game.control);
    return [
      { label: "SPEED", value: `${o.speedKmh.toFixed(1)} km/h` },
      { label: "PEDAL POWER", value: o.powerWatts === null ? "—" : `${o.powerWatts.toFixed(0)} W` },
      { label: "WHEEL TORQUE (40 N·m AT PEDALS)", value: game.round.kind === "gear" ? `${o.wheelTorque.toFixed(0)} N·m` : "—" },
      { label: "DRIVE FORCE", value: game.round.kind === "gear" ? `${o.driveForce.toFixed(0)} N` : "—" },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "gear") {
      const points = Array.from({ length: 24 }, (_, i) => ({ x: 11 + i, y: calculateBicycleSpeed(CADENCE, FRONT_TEETH, 11 + i, WHEEL_CIRCUMFERENCE) * 3.6 }));
      return <LineChart description="Speed against the number of teeth on the rear sprocket at 90 rpm; fewer teeth give higher speed." series={[{ label: "Speed", points }, { label: "Target 25 km/h", dashed: true, points: [{ x: 11, y: GEAR_TARGET_KMH }, { x: 34, y: GEAR_TARGET_KMH }] }, { label: "Your sprocket", dashed: true, points: [{ x: game.control.rear as number, y: 0 }, { x: game.control.rear as number, y: 60 }] }]} title="Gearing and speed" xDomain={[11, 34]} xLabel="Rear sprocket teeth" yDomain={[0, 60]} yLabel="Speed (km/h)" />;
    }
    if (game.round.kind === "climb") {
      const points = Array.from({ length: 100 }, (_, i) => {
        const kmh = 3 + (37 * i) / 99;
        return { x: kmh, y: calculateRiderPower(kmh / 3.6, CLIMB) };
      });
      return <LineChart description="Pedal power against speed on a 6 percent climb, with the available 200 watts as a dashed line." series={[{ label: "Power needed", points }, { label: "Available 200 W", dashed: true, points: [{ x: 3, y: 200 }, { x: 40, y: 200 }] }, { label: "Your speed", dashed: true, points: [{ x: game.control.speed as number, y: 0 }, { x: game.control.speed as number, y: 900 }] }]} title="Power on the climb" xDomain={[3, 40]} xLabel="Speed (km/h)" yDomain={[0, 900]} yLabel="Power (W)" />;
    }
    const points = Array.from({ length: 80 }, (_, i) => {
      const cda = 0.15 + (0.35 * i) / 79;
      return { x: cda, y: calculateRiderPower(FLAT_SPEED_KMH / 3.6, { ...FLAT, dragArea: cda }) };
    });
    return <LineChart description="Power needed at 40 kilometers per hour against drag area; it rises in a straight line." series={[{ label: "Power needed", points }, { label: "Available 250 W", dashed: true, points: [{ x: 0.15, y: FLAT_POWER }, { x: 0.5, y: FLAT_POWER }] }, { label: "Your position", dashed: true, points: [{ x: game.control.dragArea as number, y: 150 }, { x: game.control.dragArea as number, y: 450 }] }]} title="Power and riding position" xDomain={[0.15, 0.5]} xLabel="Drag area C_dA (m²)" yDomain={[150, 450]} yLabel="Power (W)" />;
  },
});
