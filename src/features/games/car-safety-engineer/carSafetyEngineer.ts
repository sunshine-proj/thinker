import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateAverageCrashForce,
  calculateCrashGForce,
  calculateImpulseForce,
  calculateInelasticVelocity,
  calculateKineticEnergyLoss,
  calculateStoppingDistanceForGForce,
} from "../../../physics/mechanics";

export type CrashKind = "crumple" | "airbag" | "head-on";

export interface CrashRound extends NumericRound { readonly kind: CrashKind }

export interface CrashOutcome extends AttemptOutcome {
  readonly forceNewtons: number | null;
  readonly gForce: number | null;
  readonly finalVelocity: number | null;
  readonly energyLost: number | null;
}

export const CAR_MASS = 1200;
export const CRASH_SPEED = 15;
export const G_LOW = 12;
export const G_HIGH = 20;
export const OCCUPANT_MASS = 70;
export const FORCE_LOW = 8000;
export const FORCE_HIGH = 10000;
export const HEAVY_MASS = 1500;
export const HEAVY_SPEED = 20;
export const LIGHT_MASS = 1000;
export const STOP_TOLERANCE = 0.5;

export const CRASH_META: RoundGameMeta = {
  id: "car-safety-engineer",
  title: "Car Safety Engineer",
  eyebrow: "EVERYDAY PHYSICS · SAFETY",
  modelTag: "MOMENTUM & IMPULSE",
  introduction: "Design the safety systems of a car. Size a crumple zone to keep the deceleration survivable, time an airbag to cushion the passenger, and work out how fast two colliding cars can move before both stop dead.",
  instructions: "Predict, set your design and run the crash test. A given change of momentum is unavoidable; safety means spreading it over as long a time and distance as possible, which lowers the force.",
  formula: "F Δt = m Δv  ·  F = m v²/(2s)  ·  v_f = (m₁v₁ + m₂v₂)/(m₁ + m₂)",
  formulaCaption: "F is the average force, Δt the stopping time, m the mass, Δv the change in speed, s the stopping distance and v the speed. In a sticking collision momentum is conserved and v_f is the common final velocity.",
  explanation: "When a car hits a wall the people inside must lose all their speed. The impulse FΔt equals the change of momentum, which is fixed, so the average force is inversely proportional to the time over which the stop happens. A crumple zone that collapses over half a meter instead of 10 cm cuts the force five-fold. The same logic explains airbags and seat belts, which stop a passenger gradually with the car. In a collision between two vehicles momentum is conserved, so a heavier or faster car pushes the wreck in its own direction; if the momenta are equal and opposite both vehicles stop.",
  assumptions: "Constant deceleration (real crashes have force peaks), one-dimensional motion, occupants who move with the car, a rigid barrier, and perfectly sticking wreckage for the head-on collision. A human survives about 20 g for a short time with good restraints; these figures are teaching values, not safety standards.",
  learningObjectives: ["Relate stopping distance to deceleration and force.", "Use the impulse-momentum theorem to size an airbag.", "Apply conservation of momentum to a sticking collision."],
  objective: { title: "Pass the crash tests", description: "Meet every safety target.", unit: "tests" },
  controlsHeading: "Set up the crash test",
  submitLabel: "Run the crash test",
  solvedLabel: "Test passed!",
  nextLabel: "Next test",
};

export const CRASH_ROUNDS: readonly CrashRound[] = Object.freeze([
  {
    id: "the-crumple-zone", title: "The crumple zone", difficulty: "Beginner", kind: "crumple",
    situation: `A ${CAR_MASS} kg car hits a wall at ${CRASH_SPEED} m/s (54 km/h). Choose the length of the crumple zone so the average deceleration is between ${G_LOW} g and ${G_HIGH} g: survivable, without a needlessly long car.`,
    controls: [fixed("speed", "Impact speed", "m/s", CRASH_SPEED), slider("distance", "Crumple distance", "m", 0.1, 1.5, 0.01, 0.2)],
    hint: "a = v²/(2s). For 20 g, s = v²/(2 × 20 × 9.81).",
  },
  {
    id: "the-airbag", title: "The airbag", difficulty: "Intermediate", kind: "airbag",
    situation: `A ${OCCUPANT_MASS} kg passenger travelling at ${CRASH_SPEED} m/s is brought to rest by the airbag. Choose the stopping time so the average force is between ${FORCE_LOW / 1000} and ${FORCE_HIGH / 1000} kN.`,
    controls: [fixed("speed", "Speed to lose", "m/s", CRASH_SPEED), slider("time", "Airbag stopping time", "ms", 20, 300, 1, 60)],
    hint: "F = m Δv / Δt, so Δt = m Δv / F. Try F = 10 kN.",
  },
  {
    id: "the-head-on-collision", title: "The head-on collision", difficulty: "Advanced", kind: "head-on",
    situation: `A ${HEAVY_MASS} kg car travelling at ${HEAVY_SPEED} m/s meets a ${LIGHT_MASS} kg car head-on and they stick together. At what speed must the lighter car come the other way for the wreck to stop dead (final speed within ${STOP_TOLERANCE} m/s of zero)?`,
    controls: [fixed("heavy", "Heavy car", "kg", HEAVY_MASS), slider("speed", "Speed of the light car", "m/s", 5, 40, 0.1, 10)],
    hint: "Total momentum must be zero: 1500 × 20 = 1000 × v.",
  },
]);

export function runCrash(round: CrashRound, v: NumericControl): CrashOutcome {
  if (round.kind === "crumple") {
    const distance = v.distance as number;
    const g = calculateCrashGForce(CRASH_SPEED, distance);
    const success = g >= G_LOW && g <= G_HIGH;
    return {
      forceNewtons: calculateAverageCrashForce(CAR_MASS, CRASH_SPEED, distance), gForce: g, finalVelocity: null, energyLost: null,
      success, accuracyFraction: success ? 1 - Math.abs(g - (G_LOW + G_HIGH) / 2) / ((G_HIGH - G_LOW) / 2) : 0, predictionActual: calculateStoppingDistanceForGForce(CRASH_SPEED, G_HIGH),
      feedback: success ? `The car stops in ${distance.toFixed(2)} m with an average deceleration of ${g.toFixed(1)} g (${(calculateAverageCrashForce(CAR_MASS, CRASH_SPEED, distance) / 1000).toFixed(0)} kN on the car).`
        : g > G_HIGH ? `${g.toFixed(0)} g is not survivable: the crumple zone is too short.` : `${g.toFixed(1)} g is gentle, but a ${distance.toFixed(2)} m crumple zone makes the car too long. Shorten it.`,
    };
  }
  if (round.kind === "airbag") {
    const time = (v.time as number) / 1000;
    const force = calculateImpulseForce(OCCUPANT_MASS, CRASH_SPEED, time);
    const success = force >= FORCE_LOW && force <= FORCE_HIGH;
    return {
      forceNewtons: force, gForce: force / (OCCUPANT_MASS * 9.80665), finalVelocity: null, energyLost: null, success,
      accuracyFraction: success ? 1 - Math.abs(force - (FORCE_LOW + FORCE_HIGH) / 2) / ((FORCE_HIGH - FORCE_LOW) / 2) : 0, predictionActual: (OCCUPANT_MASS * CRASH_SPEED) / FORCE_HIGH * 1000,
      feedback: success ? `Stopping ${CRASH_SPEED} m/s in ${(time * 1000).toFixed(0)} ms needs ${(force / 1000).toFixed(1)} kN: ${(force / (OCCUPANT_MASS * 9.80665)).toFixed(0)} g for the passenger.`
        : force > FORCE_HIGH ? `${(force / 1000).toFixed(1)} kN is too harsh: let the bag deflate over a longer time.` : `${(force / 1000).toFixed(1)} kN is soft, but a ${(time * 1000).toFixed(0)} ms stop is so slow the passenger would hit the dashboard first.`,
    };
  }
  const speed = v.speed as number;
  const final = calculateInelasticVelocity(HEAVY_MASS, HEAVY_SPEED, LIGHT_MASS, -speed);
  const lost = calculateKineticEnergyLoss(HEAVY_MASS, HEAVY_SPEED, LIGHT_MASS, -speed);
  const success = Math.abs(final) <= STOP_TOLERANCE;
  return {
    forceNewtons: null, gForce: null, finalVelocity: final, energyLost: lost, success, accuracyFraction: success ? 1 - Math.abs(final) / STOP_TOLERANCE : 0, predictionActual: (HEAVY_MASS * HEAVY_SPEED) / LIGHT_MASS,
    feedback: success ? `Momentum 1500 × 20 − 1000 × ${speed.toFixed(1)} is almost zero, so the wreck stops. ${(lost / 1000).toFixed(0)} kJ of kinetic energy went into deformation.`
      : `The wreck slides on at ${final.toFixed(1)} m/s ${final > 0 ? "in the heavy car's direction" : "in the light car's direction"}.`,
  };
}

export const carSafetyEngineer = defineNumericGame<CrashRound, CrashOutcome>({
  meta: CRASH_META,
  rounds: CRASH_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "crumple" ? { label: "Your prediction of the crumple distance for 20 g", unit: "m", placeholder: "e.g. 0.57", step: 0.01 }
    : round.kind === "airbag" ? { label: "Your prediction of the stopping time for 10 kN", unit: "ms", placeholder: "e.g. 105", step: 1 }
    : { label: "Your prediction of the light car's speed", unit: "m/s", placeholder: "e.g. 30", step: 0.1 },
  evaluate: (round, values) => runCrash(round, values),
});
