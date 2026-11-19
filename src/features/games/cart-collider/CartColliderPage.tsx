import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateCollisionVelocities } from "../../../physics/mechanics";
import { BUMPER, ELASTIC, STICKY, cartCollider, runCarts } from "./cartCollider";

export const CartColliderPage = createNumericGamePage({
  definition: cartCollider,
  measurements: (game) => {
    const o = runCarts(game.round, game.control);
    const massA = game.round.kind === "sticky" ? STICKY.massA : game.round.kind === "elastic" ? ELASTIC.massA : BUMPER.mass;
    const massB = game.round.kind === "bumper" ? BUMPER.mass : (game.control.massB as number);
    return [
      { label: "CART 1 AFTER", value: `${o.velocityA.toFixed(2)} m/s` },
      { label: "CART 2 AFTER", value: `${o.velocityB.toFixed(2)} m/s` },
      { label: "MOMENTUM BEFORE → AFTER", value: `${(massA * (game.control.speedA as number)).toFixed(2)} → ${(massA * o.velocityA + massB * o.velocityB).toFixed(2)} kg·m/s` },
      { label: "KINETIC ENERGY LOST", value: `${(o.energyLostFraction * 100).toFixed(0)} %` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "bumper") {
      const points = Array.from({ length: 51 }, (_, i) => {
        const e = i / 50;
        return { x: e, y: calculateCollisionVelocities(1, 3, 1, 0, e).velocityB };
      });
      const e = game.control.restitution as number;
      return <LineChart description="Speed of the struck cart against the coefficient of restitution: from 1.5 m/s when the carts stick to 3 m/s for a perfectly elastic bounce." series={[{ label: "Struck cart speed", points }, { label: "Target", dashed: true, points: [{ x: 0, y: BUMPER.target }, { x: 1, y: BUMPER.target }] }, { label: "Your bumper", dashed: true, points: [{ x: e, y: 0 }, { x: e, y: 3.2 }] }]} title="How springy is the bumper?" xDomain={[0, 1]} xLabel="Coefficient of restitution e" yDomain={[0, 3.2]} yLabel="Speed after (m/s)" />;
    }
    const sticky = game.round.kind === "sticky";
    const massA = sticky ? STICKY.massA : ELASTIC.massA;
    const speedA = sticky ? STICKY.speedA : ELASTIC.speedA;
    const points = Array.from({ length: 59 }, (_, i) => {
      const massB = 0.2 + (5.8 * i) / 58;
      const after = calculateCollisionVelocities(massA, speedA, massB, 0, sticky ? 0 : 1);
      return { x: massB, y: sticky ? after.velocityB : after.velocityA };
    });
    const target = sticky ? STICKY.target : ELASTIC.target;
    const massB = game.control.massB as number;
    return <LineChart description={sticky ? "Speed of the joined carts against the mass of the resting cart; heavier targets give a slower pair." : "Velocity of the incoming cart after an elastic collision against the target's mass; it bounces back (negative) when the target is heavier."} series={[{ label: sticky ? "Speed of the pair" : "Incoming cart after", points }, { label: "Target", dashed: true, points: [{ x: 0.2, y: target }, { x: 6, y: target }] }, { label: "Your mass", dashed: true, points: [{ x: massB, y: -3 }, { x: massB, y: 3 }] }]} title={sticky ? "Sticking together" : "An elastic bounce"} xDomain={[0.2, 6]} xLabel="Mass of the resting cart (kg)" yDomain={[-3, 3]} yLabel="Velocity after (m/s)" />;
  },
});
