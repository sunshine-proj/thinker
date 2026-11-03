import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateHeightAtDistance, calculateReboundHeight } from "../../../physics/mechanics";
import { DROP_HEIGHT, HOOP_DISTANCE, HOOP_HEIGHT, RELEASE_HEIGHT, basketballChallenge, runShot } from "./basketballChallenge";

export const BasketballChallengePage = createNumericGamePage({
  definition: basketballChallenge,
  measurements: (game) => {
    const o = runShot(game.round, game.control);
    return [
      { label: "HEIGHT AT THE HOOP", value: o.heightAtHoop === null ? "—" : `${o.heightAtHoop.toFixed(2)} m` },
      { label: "VERTICAL VELOCITY THERE", value: o.verticalVelocity === null ? "—" : `${o.verticalVelocity.toFixed(1)} m/s` },
      { label: "REBOUND HEIGHT", value: o.reboundHeight === null ? "—" : `${o.reboundHeight.toFixed(2)} m` },
      { label: "HOOP", value: `${HOOP_HEIGHT} m high, ${HOOP_DISTANCE} m away` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "bounce") {
      const points = Array.from({ length: 50 }, (_, i) => {
        const e = 0.5 + (0.45 * i) / 49;
        return { x: e, y: calculateReboundHeight(DROP_HEIGHT, e) };
      });
      const e = game.control.restitution as number;
      return <LineChart description="Rebound height against the coefficient of restitution, rising as e squared. A dashed line marks the target of 1.2 meters." series={[{ label: "Rebound height", points }, { label: "Target 1.2 m", dashed: true, points: [{ x: 0.5, y: 1.2 }, { x: 0.95, y: 1.2 }] }, { label: "Your ball", dashed: true, points: [{ x: e, y: 0 }, { x: e, y: 1.8 }] }]} title="Bounce height" xDomain={[0.5, 0.95]} xLabel="Coefficient of restitution e" yDomain={[0, 1.8]} yLabel="Rebound height (m)" />;
    }
    const speed = game.control.speed as number;
    const angle = game.control.angle as number;
    const points = Array.from({ length: 90 }, (_, i) => {
      const x = (5.5 * i) / 89;
      return { x, y: Math.max(0, calculateHeightAtDistance(speed, angle, RELEASE_HEIGHT, x)) };
    });
    return <LineChart description={`The ball's path from the shooter to the hoop ${HOOP_DISTANCE} meters away at ${HOOP_HEIGHT} meters height.`} series={[{ label: "Ball", points }, { label: "Hoop", points: [{ x: HOOP_DISTANCE - 0.23, y: HOOP_HEIGHT }, { x: HOOP_DISTANCE + 0.23, y: HOOP_HEIGHT }] }]} title="Flight of the ball" xDomain={[0, 5.5]} xLabel="Distance (m)" yDomain={[0, 5]} yLabel="Height (m)" />;
  },
});
