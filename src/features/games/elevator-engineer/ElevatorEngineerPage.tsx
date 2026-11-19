import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateLiftingPower, calculateLiftingWork } from "../../../physics/mechanics";
import { CAR_MASS, ENERGY_ROUND, LIFT_SPEED, MAX_LOAD, POWER_ROUND, elevatorEngineer, runLift } from "./elevatorEngineer";

export const ElevatorEngineerPage = createNumericGamePage({
  definition: elevatorEngineer,
  measurements: (game) => {
    const o = runLift(game.round, game.control);
    if (game.round.kind === "power") {
      return [
        { label: "WORK TO CLIMB", value: `${(calculateLiftingWork(POWER_ROUND.mass, POWER_ROUND.height) / 1000).toFixed(0)} kJ` },
        { label: "CLIMB TIME WITH YOUR MOTOR", value: `${o.headline.toFixed(1)} s` },
        { label: "REQUIRED TIME", value: `${POWER_ROUND.time} s` },
      ];
    }
    if (game.round.kind === "counterweight") {
      const counterweight = game.control.counterweight as number;
      return [
        { label: "EMPTY CAR", value: `${(calculateLiftingPower(CAR_MASS - counterweight, LIFT_SPEED) / 1000).toFixed(2)} kW` },
        { label: "FULL CAR", value: `${(calculateLiftingPower(CAR_MASS + MAX_LOAD - counterweight, LIFT_SPEED) / 1000).toFixed(2)} kW` },
        { label: "WORST CASE", value: `${o.headline.toFixed(2)} kW` },
      ];
    }
    return [
      { label: "USEFUL WORK", value: `${(calculateLiftingWork(ENERGY_ROUND.netMass, ENERGY_ROUND.height) / 1000).toFixed(1)} kJ` },
      { label: "YOUR ANSWER", value: `${(game.control.energyKj as number).toFixed(1)} kJ` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "counterweight") {
      const empty = Array.from({ length: 81 }, (_, i) => ({ x: i * 25, y: calculateLiftingPower(CAR_MASS - i * 25, LIFT_SPEED) / 1000 }));
      const full = Array.from({ length: 81 }, (_, i) => ({ x: i * 25, y: calculateLiftingPower(CAR_MASS + MAX_LOAD - i * 25, LIFT_SPEED) / 1000 }));
      const counterweight = game.control.counterweight as number;
      return <LineChart description="Motor power against counterweight for the empty and the full car. The worst case is smallest where the two lines cross." series={[{ label: "Empty car", points: empty }, { label: "Full car", dashed: true, points: full }, { label: "Your counterweight", dashed: true, points: [{ x: counterweight, y: 0 }, { x: counterweight, y: 30 }] }]} title="Balancing the lift" xDomain={[0, 2000]} xLabel="Counterweight (kg)" yDomain={[0, 30]} yLabel="Motor power (kW)" />;
    }
    if (game.round.kind === "power") {
      const work = calculateLiftingWork(POWER_ROUND.mass, POWER_ROUND.height);
      const points = Array.from({ length: 59 }, (_, i) => {
        const kw = 1 + (29 * i) / 58;
        return { x: kw, y: work / (kw * 1000) };
      });
      return <LineChart description="Time to climb 30 meters against motor power: doubling the power halves the time." series={[{ label: "Climb time", points }, { label: "Required 20 s", dashed: true, points: [{ x: 1, y: POWER_ROUND.time }, { x: 30, y: POWER_ROUND.time }] }]} title="Power and time" xDomain={[1, 30]} xLabel="Motor power (kW)" yDomain={[0, 80]} yLabel="Climb time (s)" />;
    }
    const work = calculateLiftingWork(ENERGY_ROUND.netMass, ENERGY_ROUND.height) / 1000;
    const points = Array.from({ length: 46 }, (_, i) => {
      const eta = 0.3 + (0.7 * i) / 45;
      return { x: eta * 100, y: work / eta };
    });
    return <LineChart description="Electrical energy per trip against motor efficiency: a less efficient motor wastes more energy as heat." series={[{ label: "Electrical energy", points }, { label: "75 % efficient", dashed: true, points: [{ x: 75, y: 0 }, { x: 75, y: 300 }] }]} title="Efficiency and energy" xDomain={[30, 100]} xLabel="Efficiency (%)" yDomain={[0, 300]} yLabel="Energy per trip (kJ)" />;
  },
});
