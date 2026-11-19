import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { SHAPE_FACTORS, calculateRollingAcceleration, calculateRollingTime, calculateSlopeForRollingTime, calculateSpinAfterChange } from "../../../physics/mechanics";

export type RollKind = "headstart" | "ramp" | "skater";
export interface RollRound extends NumericRound { readonly kind: RollKind }
export interface RollOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const RACE = { length: 3, slope: 10, tolerance: 0.02 } as const;
export const RAMP = { distance: 2, time: 1.5, toleranceSeconds: 0.03 } as const;
export const SKATER = { armsOut: 3.5, armsIn: 1.2, initialSpin: 3, tolerance: 0.15 } as const;

/** Head start (m) that lets a hoop tie a disc on the race ramp. */
export function hoopHeadStart(): number {
  const ratio = calculateRollingAcceleration(SHAPE_FACTORS.hoop, RACE.slope) / calculateRollingAcceleration(SHAPE_FACTORS.disc, RACE.slope);
  return RACE.length * (1 - ratio);
}

export const ROLL_META: RoundGameMeta = {
  id: "rolling-race",
  title: "Rolling Race",
  eyebrow: "MECHANICS · ROTATION",
  modelTag: "ROLLING & ANGULAR MOMENTUM",
  introduction: "Race hoops, discs and balls down a ramp. Shape matters more than mass: give the hoop a head start so it ties with a disc, tilt a ramp so a ball arrives on time, and spin up a skater by pulling in their arms.",
  instructions: "Predict, then set the head start, the ramp angle or the spin. A rolling body shares its energy between moving along and spinning; the more of its mass is far from the axis, the more it spins and the slower it rolls.",
  formula: "a = g sinθ / (1 + k), I = k m r²  ·  I₁ω₁ = I₂ω₂",
  formulaCaption: "θ is the ramp angle, k the shape factor (hoop 1, hollow sphere 2/3, disc 1/2, solid sphere 2/5), I the moment of inertia (kg·m²) and ω the spin rate.",
  explanation: "When a body rolls without slipping, every metre it travels also turns it, so some of the energy released by going downhill becomes spin energy ½Iω². A hoop keeps all its mass at the rim (I = mr²), so half its energy goes into spinning; a solid ball keeps most of its mass near the axis (I = 2/5 mr²) and puts more energy into forward motion. The mass and radius cancel out, so any solid ball beats any hoop on the same ramp. With no outside twist, angular momentum Iω stays constant: a skater who pulls their arms in reduces I and spins faster, and the extra spin energy comes from the work their muscles do pulling the arms in.",
  assumptions: "Rigid bodies rolling without slipping (friction at the contact does no work), no rolling resistance or air drag, and a skater modelled as a body whose moment of inertia changes with no friction at the skate.",
  learningObjectives: ["Use the shape factor to compare rolling bodies.", "Find the ramp angle for a given rolling time.", "Apply conservation of angular momentum."],
  objective: { title: "Win the race", description: "Solve every rotation problem.", unit: "races" },
  controlsHeading: "Your setting",
  submitLabel: "Start the race",
  solvedLabel: "Perfectly timed!",
  nextLabel: "Next race",
};

export const ROLL_ROUNDS: readonly RollRound[] = Object.freeze([
  {
    id: "hoop-vs-disc", title: "Hoop against disc", difficulty: "Beginner", kind: "headstart",
    situation: `A hoop and a solid disc race down a ${RACE.length} m ramp at ${RACE.slope}°. How big a head start must the hoop get (starting nearer the bottom) for both to arrive together? (± ${RACE.tolerance * 100} cm)`,
    controls: [fixed("slope", "Ramp angle", "°", RACE.slope), slider("headStart", "Hoop's head start", "m", 0, 2, 0.01, 0.3)],
    hint: "Same time means distance ∝ acceleration: the hoop's 1/(1 + 1) against the disc's 1/(1 + ½).",
  },
  {
    id: "ball-on-time", title: "The ball on time", difficulty: "Intermediate", kind: "ramp",
    situation: `A solid ball should roll ${RAMP.distance} m down a ramp from rest in exactly ${RAMP.time} s. Choose the ramp angle (time ± ${RAMP.toleranceSeconds} s).`,
    controls: [slider("angle", "Ramp angle", "°", 2, 40, 0.1, 10)],
    hint: "s = ½ a t² gives a; then sinθ = a (1 + 2/5) / g.",
  },
  {
    id: "spinning-skater", title: "The spinning skater", difficulty: "Advanced", kind: "skater",
    situation: `A skater spins at ${SKATER.initialSpin} rev/s with arms out (I = ${SKATER.armsOut} kg·m²) and pulls them in (I = ${SKATER.armsIn} kg·m²). How fast do they spin now? (± ${SKATER.tolerance} rev/s)`,
    controls: [fixed("inertia", "Moment of inertia, arms in", "kg·m²", SKATER.armsIn), slider("spin", "New spin rate", "rev/s", 1, 15, 0.05, 4)],
    hint: "I₁ω₁ = I₂ω₂.",
  },
]);

export function runRoll(round: RollRound, v: NumericControl): RollOutcome {
  if (round.kind === "headstart") {
    const head = v.headStart as number;
    const truth = hoopHeadStart();
    const disc = calculateRollingTime(RACE.length, SHAPE_FACTORS.disc, RACE.slope);
    const hoop = calculateRollingTime(RACE.length - head, SHAPE_FACTORS.hoop, RACE.slope);
    const error = Math.abs(head - truth);
    const success = error <= RACE.tolerance;
    return {
      headline: hoop - disc, unit: "s", success, accuracyFraction: success ? 1 - error / RACE.tolerance : 0, predictionActual: truth,
      feedback: success
        ? `With a ${head.toFixed(2)} m head start the hoop arrives ${Math.abs(hoop - disc).toFixed(3)} s ${hoop > disc ? "after" : "before"} the disc: a dead heat. The hoop needs it because half its energy goes into spinning.`
        : `The ${hoop > disc ? "disc" : "hoop"} wins by ${Math.abs(hoop - disc).toFixed(2)} s: the head start is too ${hoop > disc ? "small" : "large"}.`,
    };
  }
  if (round.kind === "ramp") {
    const angle = v.angle as number;
    const time = calculateRollingTime(RAMP.distance, SHAPE_FACTORS["solid-sphere"], angle);
    const truth = calculateSlopeForRollingTime(RAMP.distance, RAMP.time, SHAPE_FACTORS["solid-sphere"]);
    const error = Math.abs(time - RAMP.time);
    const success = error <= RAMP.toleranceSeconds;
    return {
      headline: time, unit: "s", success, accuracyFraction: success ? 1 - error / RAMP.toleranceSeconds : 0, predictionActual: truth,
      feedback: success
        ? `At ${angle.toFixed(1)}° the ball accelerates at ${calculateRollingAcceleration(SHAPE_FACTORS["solid-sphere"], angle).toFixed(2)} m/s² and takes ${time.toFixed(3)} s.`
        : `At ${angle.toFixed(1)}° the ball takes ${time.toFixed(2)} s, ${time > RAMP.time ? "too slow: steepen the ramp" : "too fast: make it gentler"}.`,
    };
  }
  const spin = v.spin as number;
  const truth = calculateSpinAfterChange(SKATER.armsOut, SKATER.initialSpin, SKATER.armsIn);
  const error = Math.abs(spin - truth);
  const success = error <= SKATER.tolerance;
  const energyRatio = truth / SKATER.initialSpin;
  return {
    headline: truth, unit: "rev/s", success, accuracyFraction: success ? 1 - error / SKATER.tolerance : 0, predictionActual: truth,
    feedback: success
      ? `Angular momentum stays at ${(SKATER.armsOut * SKATER.initialSpin).toFixed(1)} kg·m²·rev/s, so the skater spins at ${truth.toFixed(2)} rev/s. Their spin energy grows ${energyRatio.toFixed(2)} times, supplied by the work of pulling the arms in.`
      : `${spin.toFixed(2)} rev/s would change the angular momentum to ${(SKATER.armsIn * spin).toFixed(1)} instead of keeping ${(SKATER.armsOut * SKATER.initialSpin).toFixed(1)}.`,
  };
}

export const rollingRace = defineNumericGame<RollRound, RollOutcome>({
  meta: ROLL_META,
  rounds: ROLL_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "headstart" ? { label: "Your prediction of the head start", unit: "m", placeholder: "e.g. 0.5", step: 0.01 }
    : round.kind === "ramp" ? { label: "Your prediction of the ramp angle", unit: "°", placeholder: "e.g. 12", step: 0.1 }
    : { label: "Your prediction of the new spin rate", unit: "rev/s", placeholder: "e.g. 6", step: 0.05 },
  evaluate: (round, values) => runRoll(round, values),
});
