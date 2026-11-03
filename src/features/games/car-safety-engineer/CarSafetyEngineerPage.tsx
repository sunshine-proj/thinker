import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateCrashGForce, calculateImpulseForce, calculateInelasticVelocity } from "../../../physics/mechanics";
import { CRASH_SPEED, G_HIGH, G_LOW, HEAVY_MASS, HEAVY_SPEED, LIGHT_MASS, OCCUPANT_MASS, carSafetyEngineer, runCrash } from "./carSafetyEngineer";

export const CarSafetyEngineerPage = createNumericGamePage({
  definition: carSafetyEngineer,
  measurements: (game) => {
    const o = runCrash(game.round, game.control);
    return [
      { label: "AVERAGE FORCE", value: o.forceNewtons === null ? "—" : `${(o.forceNewtons / 1000).toFixed(1)} kN` },
      { label: "DECELERATION", value: o.gForce === null ? "—" : `${o.gForce.toFixed(1)} g` },
      { label: "FINAL VELOCITY", value: o.finalVelocity === null ? "—" : `${o.finalVelocity.toFixed(1)} m/s` },
      { label: "ENERGY LOST", value: o.energyLost === null ? "—" : `${(o.energyLost / 1000).toFixed(0)} kJ` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "crumple") {
      const points = Array.from({ length: 80 }, (_, i) => {
        const s = 0.1 + (1.4 * i) / 79;
        return { x: s, y: calculateCrashGForce(CRASH_SPEED, s) };
      });
      const distance = game.control.distance as number;
      return <LineChart description="Average deceleration in g against crumple distance; a longer crumple zone gives a gentler stop. The survivable band is 12 to 20 g." series={[{ label: "Deceleration", points }, { label: "Upper limit 20 g", dashed: true, points: [{ x: 0.1, y: G_HIGH }, { x: 1.5, y: G_HIGH }] }, { label: "Lower bound 12 g", dashed: true, points: [{ x: 0.1, y: G_LOW }, { x: 1.5, y: G_LOW }] }, { label: "Your car", dashed: true, points: [{ x: distance, y: 0 }, { x: distance, y: 120 }] }]} title="Crumple zone and deceleration" xDomain={[0.1, 1.5]} xLabel="Crumple distance (m)" yDomain={[0, 120]} yLabel="Deceleration (g)" />;
    }
    if (game.round.kind === "airbag") {
      const points = Array.from({ length: 80 }, (_, i) => {
        const ms = 20 + (280 * i) / 79;
        return { x: ms, y: calculateImpulseForce(OCCUPANT_MASS, CRASH_SPEED, ms / 1000) / 1000 };
      });
      const time = game.control.time as number;
      return <LineChart description="Average force on the passenger against airbag stopping time; a longer stop gives a smaller force." series={[{ label: "Force", points }, { label: "Upper limit 10 kN", dashed: true, points: [{ x: 20, y: 10 }, { x: 300, y: 10 }] }, { label: "Your airbag", dashed: true, points: [{ x: time, y: 0 }, { x: time, y: 55 }] }]} title="Airbag timing" xDomain={[20, 300]} xLabel="Stopping time (ms)" yDomain={[0, 55]} yLabel="Force (kN)" />;
    }
    const points = Array.from({ length: 70 }, (_, i) => {
      const v = 5 + (35 * i) / 69;
      return { x: v, y: calculateInelasticVelocity(HEAVY_MASS, HEAVY_SPEED, LIGHT_MASS, -v) };
    });
    const v = game.control.speed as number;
    return <LineChart description="Velocity of the wreck after the collision against the speed of the light car; it is zero at 30 meters per second." series={[{ label: "Wreck velocity", points }, { label: "Stopped", dashed: true, points: [{ x: 5, y: 0 }, { x: 40, y: 0 }] }, { label: "Your car", dashed: true, points: [{ x: v, y: -20 }, { x: v, y: 20 }] }]} title="Head-on collision" xDomain={[5, 40]} xLabel="Speed of the light car (m/s)" yDomain={[-20, 20]} yLabel="Final velocity (m/s)" />;
  },
});
