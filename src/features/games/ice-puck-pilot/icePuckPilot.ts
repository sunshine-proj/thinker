import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateAccelerationFromForce, calculateBrakingDistance, calculatePushOffSpeeds, calculateSpeedAfterPush } from "../../../physics/mechanics";

export type PuckKind = "push" | "brake" | "pushoff";
export interface PuckRound extends NumericRound { readonly kind: PuckKind }
export interface PuckOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const PUCK_MASS = 0.5;
export const PUSH_TIME = 0.5;
export const PUSH_TARGET_SPEED = 3;
export const PUSH_TOLERANCE = 0.1;
export const GLIDE_SPEED = 4;
export const BRAKE_FORCE = 1;
export const GOAL_LINE = 10;
export const BRAKE_TOLERANCE = 0.2;
export const SKATER_MASS = 60;
export const SLED_MASS = 20;
export const PUSH_FORCE = 120;
export const PUSH_OFF_TIME = 0.5;
export const PUSHOFF_TOLERANCE = 0.1;

export const PUCK_META: RoundGameMeta = {
  id: "ice-puck-pilot",
  title: "Ice Puck Pilot",
  eyebrow: "MECHANICS · NEWTON'S LAWS",
  modelTag: "F = ma ON FRICTIONLESS ICE",
  introduction: "On perfectly smooth ice nothing slows a puck down, so you can see Newton's laws at work. Fire a thruster to reach a target speed, brake at the right moment to stop on the goal line, and push off a sled to find out who moves faster.",
  instructions: "Predict, then set the force, the braking point or the speed. A force changes velocity (a = F/m); with no force the puck keeps gliding at constant speed; and two bodies pushing on each other feel equal and opposite forces.",
  formula: "a = F / m  ·  v = v₀ + a t  ·  F_AB = −F_BA",
  formulaCaption: "F is the net force (N), m the mass (kg), a the acceleration (m/s²), v₀ the starting speed and t the time the force acts (s).",
  explanation: "Newton's first law: on frictionless ice a gliding puck needs no force to keep moving; it only needs a force to change speed or direction. Newton's second law: the same force gives a light object a large acceleration and a heavy one a small acceleration, a = F/m, and a force acting for a time t changes the speed by Ft/m. Newton's third law: when a skater pushes a sled, the sled pushes back on the skater just as hard, for just as long, so each gets the same change in momentum; the lighter one moves off faster.",
  assumptions: "Perfectly frictionless ice and no air resistance, a constant thrust while it acts, motion along a straight line, and rigid bodies. Real ice has a little friction (μ ≈ 0.01–0.03), which would slowly stop a gliding puck.",
  learningObjectives: ["Use a = F/m to choose a force for a target speed.", "Explain why a gliding puck keeps its speed (first law).", "Use equal and opposite forces to predict push-off speeds (third law)."],
  objective: { title: "Pilot the puck", description: "Complete every manoeuvre.", unit: "manoeuvres" },
  controlsHeading: "Your setting",
  submitLabel: "Fire the thrusters",
  solvedLabel: "Perfect piloting!",
  nextLabel: "Next manoeuvre",
};

export const PUCK_ROUNDS: readonly PuckRound[] = Object.freeze([
  {
    id: "push-to-speed", title: "Push to speed", difficulty: "Beginner", kind: "push",
    situation: `A ${PUCK_MASS} kg puck rests on frictionless ice. Its thruster fires for ${PUSH_TIME} s. Choose the thrust so the puck glides away at ${PUSH_TARGET_SPEED} m/s (± ${PUSH_TOLERANCE} m/s).`,
    controls: [fixed("mass", "Puck mass", "kg", PUCK_MASS), slider("force", "Thrust", "N", 0, 10, 0.1, 1)],
    hint: "v = (F/m) t, so F = m v / t.",
  },
  {
    id: "brake-on-the-line", title: "Brake on the line", difficulty: "Intermediate", kind: "brake",
    situation: `The puck glides at a steady ${GLIDE_SPEED} m/s (no force needed). A ${BRAKE_FORCE} N braking thrust can push against it. At what distance from the start must braking begin so the puck stops exactly on the goal line ${GOAL_LINE} m away? (± ${BRAKE_TOLERANCE} m)`,
    controls: [fixed("speed", "Gliding speed", "m/s", GLIDE_SPEED), slider("brakeStart", "Start braking at", "m", 0, 10, 0.05, 3)],
    hint: "The braking distance is v² m / (2F). Start braking that far before the line.",
  },
  {
    id: "push-off", title: "Push off", difficulty: "Advanced", kind: "pushoff",
    situation: `A ${SKATER_MASS} kg skater and a ${SLED_MASS} kg sled stand still on the ice. The skater pushes the sled with ${PUSH_FORCE} N for ${PUSH_OFF_TIME} s. How fast does the sled move away? (± ${PUSHOFF_TOLERANCE} m/s)`,
    controls: [fixed("force", "Push", "N", PUSH_FORCE), slider("sledSpeed", "Sled speed", "m/s", 0, 6, 0.05, 1)],
    hint: "Both feel 120 N for 0.5 s (third law). Each speed is F t / m.",
  },
]);

export function runPuck(round: PuckRound, v: NumericControl): PuckOutcome {
  if (round.kind === "push") {
    const force = v.force as number;
    const speed = calculateSpeedAfterPush(PUCK_MASS, force, PUSH_TIME);
    const truth = (PUCK_MASS * PUSH_TARGET_SPEED) / PUSH_TIME;
    const error = Math.abs(speed - PUSH_TARGET_SPEED);
    const success = error <= PUSH_TOLERANCE;
    return {
      headline: speed, unit: "m/s", success, accuracyFraction: success ? 1 - error / PUSH_TOLERANCE : 0, predictionActual: truth,
      feedback: success
        ? `${force.toFixed(1)} N gives a = ${calculateAccelerationFromForce(force, PUCK_MASS).toFixed(1)} m/s² for ${PUSH_TIME} s: the puck leaves at ${speed.toFixed(2)} m/s and keeps that speed forever on frictionless ice.`
        : `${force.toFixed(1)} N for ${PUSH_TIME} s gives ${speed.toFixed(2)} m/s, ${speed > PUSH_TARGET_SPEED ? "too fast" : "too slow"}.`,
    };
  }
  if (round.kind === "brake") {
    const start = v.brakeStart as number;
    const distance = calculateBrakingDistance(PUCK_MASS, GLIDE_SPEED, BRAKE_FORCE);
    const stop = start + distance;
    const truth = GOAL_LINE - distance;
    const error = Math.abs(stop - GOAL_LINE);
    const success = error <= BRAKE_TOLERANCE;
    return {
      headline: stop, unit: "m", success, accuracyFraction: success ? 1 - error / BRAKE_TOLERANCE : 0, predictionActual: truth,
      feedback: success
        ? `The puck glides at constant speed to ${start.toFixed(2)} m, then needs ${distance.toFixed(1)} m to stop: it halts at ${stop.toFixed(2)} m, on the line.`
        : `Braking from ${start.toFixed(2)} m, the puck needs ${distance.toFixed(1)} m and stops at ${stop.toFixed(2)} m, ${stop > GOAL_LINE ? "past" : "short of"} the line.`,
    };
  }
  const { speedA: skater, speedB: sled } = calculatePushOffSpeeds(PUSH_FORCE, PUSH_OFF_TIME, SKATER_MASS, SLED_MASS);
  const guess = v.sledSpeed as number;
  const error = Math.abs(guess - sled);
  const success = error <= PUSHOFF_TOLERANCE;
  return {
    headline: sled, unit: "m/s", success, accuracyFraction: success ? 1 - error / PUSHOFF_TOLERANCE : 0, predictionActual: skater,
    feedback: success
      ? `Equal and opposite: both get ${PUSH_FORCE * PUSH_OFF_TIME} N·s. The sled moves off at ${sled.toFixed(1)} m/s and the skater recoils at ${skater.toFixed(1)} m/s.`
      : `The sled actually leaves at ${sled.toFixed(1)} m/s, not ${guess.toFixed(2)} m/s. It feels the same ${PUSH_FORCE} N as the skater, but has a third of the mass.`,
  };
}

export const icePuckPilot = defineNumericGame<PuckRound, PuckOutcome>({
  meta: PUCK_META,
  rounds: PUCK_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "push" ? { label: "Your prediction of the thrust needed", unit: "N", placeholder: "e.g. 2", step: 0.1 }
    : round.kind === "brake" ? { label: "Your prediction of where to start braking", unit: "m", placeholder: "e.g. 5", step: 0.1 }
    : { label: "Your prediction of the skater's recoil speed", unit: "m/s", placeholder: "e.g. 0.5", step: 0.05 },
  evaluate: (round, values) => runPuck(round, values),
});
