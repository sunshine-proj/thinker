import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateIlluminance, calculateTiltedAccelerometerReading } from "../../../physics/mechanics";
import { GYRO_RATE, LIGHT_INTENSITY, TILT_READING, runSensor, smartphoneDetective } from "./smartphoneDetective";

export const SmartphoneDetectivePage = createNumericGamePage({
  definition: smartphoneDetective,
  measurements: (game) => {
    const o = runSensor(game.round, game.control);
    const names = { tilt: "ACCELEROMETER (YOUR TILT)", gyro: "GYROSCOPE", light: "LIGHT SENSOR (YOUR DISTANCE)" } as const;
    return [
      { label: names[game.round.kind], value: `${o.reading.toFixed(game.round.kind === "gyro" ? 0 : 2)} ${o.unit}` },
      { label: "MEASURED", value: game.round.kind === "tilt" ? `${TILT_READING} m/s²` : game.round.kind === "gyro" ? `${GYRO_RATE}°/s for 2 s` : "100 lx" },
      { label: "g", value: "9.81 m/s²" },
      { label: "LAMP", value: `${LIGHT_INTENSITY} cd` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "tilt") {
      const points = Array.from({ length: 91 }, (_, i) => ({ x: i, y: calculateTiltedAccelerometerReading(i) }));
      const angle = game.control.angle as number;
      return <LineChart description="Accelerometer reading along the long edge against tilt angle, a sine curve up to 9.81 meters per second squared at 90 degrees. The measured 4.9 is a dashed line." series={[{ label: "g sin θ", points }, { label: "Measured 4.9 m/s²", dashed: true, points: [{ x: 0, y: TILT_READING }, { x: 90, y: TILT_READING }] }, { label: "Your tilt", dashed: true, points: [{ x: angle, y: 0 }, { x: angle, y: 10 }] }]} title="Accelerometer and tilt" xDomain={[0, 90]} xLabel="Tilt angle (°)" yDomain={[0, 10]} yLabel="Reading (m/s²)" />;
    }
    if (game.round.kind === "gyro") {
      const angle = game.control.angle as number;
      return <LineChart description="Angle turned against time at a constant 90 degrees per second; after 2 seconds it is 180 degrees." series={[{ label: "Angle turned", points: [{ x: 0, y: 0 }, { x: 4, y: 360 }] }, { label: "Your answer", dashed: true, points: [{ x: 0, y: angle }, { x: 4, y: angle }] }]} title="Gyroscope" xDomain={[0, 4]} xLabel="Time (s)" yDomain={[0, 400]} yLabel="Angle (°)" />;
    }
    const points = Array.from({ length: 90 }, (_, i) => {
      const d = 0.5 + (4.5 * i) / 89;
      return { x: d, y: calculateIlluminance(LIGHT_INTENSITY, d) };
    });
    const distance = game.control.distance as number;
    return <LineChart description="Illuminance against distance from the lamp; it falls as one over distance squared. The target is 100 lux." series={[{ label: "Illuminance", points }, { label: "Target 100 lx", dashed: true, points: [{ x: 0.5, y: 100 }, { x: 5, y: 100 }] }, { label: "Your distance", dashed: true, points: [{ x: distance, y: 0 }, { x: distance, y: 800 }] }]} title="Light and distance" xDomain={[0.5, 5]} xLabel="Distance (m)" yDomain={[0, 800]} yLabel="Illuminance (lx)" />;
  },
});
