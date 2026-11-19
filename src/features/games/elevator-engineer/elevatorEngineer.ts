import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateInputPower, calculateLiftingPower, calculateLiftingWork } from "../../../physics/mechanics";

export type LiftKind = "power" | "counterweight" | "energy";
export interface LiftRound extends NumericRound { readonly kind: LiftKind }
export interface LiftOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const POWER_ROUND = { mass: 800, height: 30, time: 20, toleranceKw: 0.3 } as const;
export const CAR_MASS = 1000;
export const MAX_LOAD = 600;
export const LIFT_SPEED = 1.5;
export const COUNTERWEIGHT_TOLERANCE = 25;
export const ENERGY_ROUND = { netMass: 300, height: 30, efficiency: 0.75, toleranceKj: 2 } as const;

/** Largest mechanical power (W) the motor must deliver, empty or fully loaded. */
export function peakMotorPower(counterweightKg: number): number {
  return Math.max(
    calculateLiftingPower(CAR_MASS - counterweightKg, LIFT_SPEED),
    calculateLiftingPower(CAR_MASS + MAX_LOAD - counterweightKg, LIFT_SPEED),
  );
}

export const LIFT_META: RoundGameMeta = {
  id: "elevator-engineer",
  title: "Elevator Engineer",
  eyebrow: "MECHANICS · WORK AND POWER",
  modelTag: "WORK, POWER & EFFICIENCY",
  introduction: "Design the lift for a new tower. Size the motor so the lift climbs fast enough, choose a counterweight that keeps the motor small, and work out how much electrical energy each trip costs.",
  instructions: "Predict, then set the power, the counterweight or the energy. Lifting a mass takes work mgh; doing it faster needs more power; and no motor turns all its electrical energy into lifting.",
  formula: "W = m g h  ·  P = W / t = m g v  ·  E_in = W / η",
  formulaCaption: "m is the mass lifted (kg), g = 9.81 m/s², h the height (m), t the time (s), v the steady speed (m/s), P the power (W) and η the motor's efficiency.",
  explanation: "Work is force times distance, so raising a mass m by h takes mgh joules whatever route it takes. Power is how fast the work is done: climbing the same height in half the time needs twice the power. A counterweight on the other end of the cable does most of the lifting for free, because as the car rises it falls: the motor only has to lift the difference in mass. Choosing it equal to the car plus half the maximum load makes the empty and the full lift equally hard for the motor. Real motors waste some energy as heat; with efficiency η the electrical energy drawn is the useful work divided by η.",
  assumptions: "Steady speed (the short speeding-up and slowing-down phases are ignored), massless cables and ideal pulleys, a constant motor efficiency and g = 9.80665 m/s².",
  learningObjectives: ["Calculate work and power for lifting.", "Explain how a counterweight reduces the work a motor does.", "Include efficiency when calculating energy use."],
  objective: { title: "Commission the lift", description: "Solve each design problem.", unit: "designs" },
  controlsHeading: "Your design",
  submitLabel: "Test the lift",
  solvedLabel: "Lift approved!",
  nextLabel: "Next design",
};

export const LIFT_ROUNDS: readonly LiftRound[] = Object.freeze([
  {
    id: "size-the-motor", title: "Size the motor", difficulty: "Beginner", kind: "power",
    situation: `The lift car and its passengers have a mass of ${POWER_ROUND.mass} kg. It must climb ${POWER_ROUND.height} m in ${POWER_ROUND.time} s. What mechanical power must the motor deliver? (± ${POWER_ROUND.toleranceKw} kW)`,
    controls: [fixed("mass", "Mass lifted", "kg", POWER_ROUND.mass), slider("powerKw", "Motor power", "kW", 1, 30, 0.1, 5)],
    hint: "P = mgh / t.",
  },
  {
    id: "choose-the-counterweight", title: "Choose the counterweight", difficulty: "Intermediate", kind: "counterweight",
    situation: `A ${CAR_MASS} kg car carries up to ${MAX_LOAD} kg at ${LIFT_SPEED} m/s. Choose the counterweight that makes the motor's largest power, empty or full, as small as possible (± ${COUNTERWEIGHT_TOLERANCE} kg).`,
    controls: [fixed("speed", "Lift speed", "m/s", LIFT_SPEED), slider("counterweight", "Counterweight", "kg", 0, 2000, 5, 800)],
    hint: "The motor lifts the difference between car (plus load) and counterweight. Balance the empty and the full case.",
  },
  {
    id: "energy-per-trip", title: "Energy per trip", difficulty: "Advanced", kind: "energy",
    situation: `With the counterweight fitted, the motor lifts a net ${ENERGY_ROUND.netMass} kg up ${ENERGY_ROUND.height} m. The motor is ${ENERGY_ROUND.efficiency * 100} % efficient. How much electrical energy does one trip use? (± ${ENERGY_ROUND.toleranceKj} kJ)`,
    controls: [fixed("efficiency", "Motor efficiency", "", ENERGY_ROUND.efficiency), slider("energyKj", "Electrical energy", "kJ", 10, 300, 0.5, 80)],
    hint: "Useful work mgh, then divide by the efficiency.",
  },
]);

export function runLift(round: LiftRound, v: NumericControl): LiftOutcome {
  if (round.kind === "power") {
    const truth = calculateLiftingWork(POWER_ROUND.mass, POWER_ROUND.height) / POWER_ROUND.time / 1000;
    const power = v.powerKw as number;
    const time = calculateLiftingWork(POWER_ROUND.mass, POWER_ROUND.height) / (power * 1000);
    const error = Math.abs(power - truth);
    const success = error <= POWER_ROUND.toleranceKw;
    return {
      headline: time, unit: "s", success, accuracyFraction: success ? 1 - error / POWER_ROUND.toleranceKw : 0, predictionActual: truth,
      feedback: success
        ? `${(calculateLiftingWork(POWER_ROUND.mass, POWER_ROUND.height) / 1000).toFixed(0)} kJ in ${POWER_ROUND.time} s needs ${truth.toFixed(2)} kW. Your ${power.toFixed(1)} kW motor climbs in ${time.toFixed(1)} s.`
        : `A ${power.toFixed(1)} kW motor takes ${time.toFixed(1)} s, ${time > POWER_ROUND.time ? "too slow" : "faster than needed: a smaller motor is cheaper"}.`,
    };
  }
  if (round.kind === "counterweight") {
    const counterweight = v.counterweight as number;
    const best = CAR_MASS + MAX_LOAD / 2;
    const peak = peakMotorPower(counterweight);
    const error = Math.abs(counterweight - best);
    const success = error <= COUNTERWEIGHT_TOLERANCE;
    return {
      headline: peak / 1000, unit: "kW", success, accuracyFraction: success ? 1 - error / COUNTERWEIGHT_TOLERANCE : 0, predictionActual: best,
      feedback: success
        ? `With ${counterweight} kg the motor never needs more than ${(peak / 1000).toFixed(2)} kW, against ${(peakMotorPower(0) / 1000).toFixed(1)} kW with no counterweight.`
        : `With ${counterweight} kg the worst case needs ${(peak / 1000).toFixed(2)} kW: ${counterweight < best ? "the full car is too heavy for the motor" : "the empty car is pulled up too hard"}.`,
    };
  }
  const truth = calculateInputPower(calculateLiftingWork(ENERGY_ROUND.netMass, ENERGY_ROUND.height), ENERGY_ROUND.efficiency) / 1000;
  const energy = v.energyKj as number;
  const error = Math.abs(energy - truth);
  const success = error <= ENERGY_ROUND.toleranceKj;
  return {
    headline: truth, unit: "kJ", success, accuracyFraction: success ? 1 - error / ENERGY_ROUND.toleranceKj : 0, predictionActual: truth,
    feedback: success
      ? `The useful work is ${(calculateLiftingWork(ENERGY_ROUND.netMass, ENERGY_ROUND.height) / 1000).toFixed(1)} kJ; at ${ENERGY_ROUND.efficiency * 100} % efficiency the motor draws ${truth.toFixed(1)} kJ, and ${(truth * (1 - ENERGY_ROUND.efficiency)).toFixed(1)} kJ becomes heat.`
      : `${energy.toFixed(1)} kJ is ${energy > truth ? "more" : "less"} than the ${truth.toFixed(1)} kJ needed: remember to divide the work by the efficiency.`,
  };
}

export const elevatorEngineer = defineNumericGame<LiftRound, LiftOutcome>({
  meta: LIFT_META,
  rounds: LIFT_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "power" ? { label: "Your prediction of the power", unit: "kW", placeholder: "e.g. 10", step: 0.1 }
    : round.kind === "counterweight" ? { label: "Your prediction of the best counterweight", unit: "kg", placeholder: "e.g. 1000", step: 5 }
    : { label: "Your prediction of the electrical energy", unit: "kJ", placeholder: "e.g. 100", step: 0.5 },
  evaluate: (round, values) => runLift(round, values),
});
