import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateBrakingGForce, calculateCentripetalAcceleration, calculateFreeFallSpeed, calculateWallGForce, rpmToRadiansPerSecond } from "../../../physics/mechanics";
import { CAROUSEL_G, CAROUSEL_RADIUS, ROTOR_FRICTION, ROTOR_RADIUS, TOWER_HEIGHT, TOWER_TARGET_G, amusementParkPhysics, runRide } from "./amusementParkPhysics";

export const AmusementParkPhysicsPage = createNumericGamePage({
  definition: amusementParkPhysics,
  measurements: (game) => {
    const o = runRide(game.round, game.control);
    return [
      { label: "G-FORCE FELT", value: `${o.gForce.toFixed(2)} g` },
      { label: game.round.kind === "tower" ? "SPEED AT THE BRAKES" : "RIDER SPEED", value: o.speed === null ? "—" : `${o.speed.toFixed(1)} m/s` },
      { label: "MINIMUM SPIN", value: o.minimumRpm === null ? "—" : `${o.minimumRpm.toFixed(1)} rpm` },
      { label: "FRICTION SUPPORT", value: game.round.kind === "rotor" ? `${(ROTOR_FRICTION * o.gForce).toFixed(2)} × weight` : "—" },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "carousel") {
      const points = Array.from({ length: 80 }, (_, i) => {
        const t = 2 + (13 * i) / 79;
        return { x: t, y: calculateCentripetalAcceleration(CAROUSEL_RADIUS, t) / 9.80665 };
      });
      const t = game.control.period as number;
      return <LineChart description="Centripetal acceleration in g against the time per revolution; slower rotation gives a gentler ride. The target is 0.5 g." series={[{ label: "Acceleration", points }, { label: "Target 0.5 g", dashed: true, points: [{ x: 2, y: CAROUSEL_G }, { x: 15, y: CAROUSEL_G }] }, { label: "Your period", dashed: true, points: [{ x: t, y: 0 }, { x: t, y: 2 }] }]} title="Carousel" xDomain={[2, 15]} xLabel="Time per revolution (s)" yDomain={[0, 2]} yLabel="Acceleration (g)" />;
    }
    if (game.round.kind === "tower") {
      const speed = calculateFreeFallSpeed(TOWER_HEIGHT);
      const points = Array.from({ length: 80 }, (_, i) => {
        const s = 5 + (35 * i) / 79;
        return { x: s, y: calculateBrakingGForce(speed, s) };
      });
      const s = game.control.distance as number;
      return <LineChart description="G-force felt against braking distance after a 40 meter free fall; longer brake runs are gentler. The target is 3 g." series={[{ label: "G-force", points }, { label: "Target 3 g", dashed: true, points: [{ x: 5, y: TOWER_TARGET_G }, { x: 40, y: TOWER_TARGET_G }] }, { label: "Your brakes", dashed: true, points: [{ x: s, y: 0 }, { x: s, y: 9 }] }]} title="Drop tower" xDomain={[5, 40]} xLabel="Braking distance (m)" yDomain={[0, 9]} yLabel="G-force (g)" />;
    }
    const points = Array.from({ length: 80 }, (_, i) => {
      const rpm = 10 + (50 * i) / 79;
      return { x: rpm, y: ROTOR_FRICTION * calculateWallGForce(ROTOR_RADIUS, rpmToRadiansPerSecond(rpm)) };
    });
    const rpm = game.control.rpm as number;
    return <LineChart description="Friction support, in multiples of the rider's weight, against the spin rate; riders stick once it reaches 1." series={[{ label: "Friction support", points }, { label: "Needed: 1 × weight", dashed: true, points: [{ x: 10, y: 1 }, { x: 60, y: 1 }] }, { label: "Your spin rate", dashed: true, points: [{ x: rpm, y: 0 }, { x: rpm, y: 3 }] }]} title="The Rotor" xDomain={[10, 60]} xLabel="Spin rate (rpm)" yDomain={[0, 3]} yLabel="Friction ÷ weight" />;
  },
});
