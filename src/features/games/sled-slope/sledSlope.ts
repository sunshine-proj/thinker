import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { SLED_ON_SNOW, SURFACES, calculateConstantSpeedAngle, calculateCriticalAngle, calculateRunOutDistance, calculateSlopeAcceleration, calculateSpeedAtBottom } from "../../../physics/mechanics";

export type SledKind = "slip" | "runout" | "steady";
export interface SledRound extends NumericRound { readonly kind: SledKind }
export interface SledOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const SLIP_MARGIN = 0.5;
export const RUNOUT_SLOPE = 15;
export const RUNOUT_TARGET = 30;
export const RUNOUT_TOLERANCE = 1;
export const WOOD = SURFACES.find((surface) => surface.id === "wood-wood")!;
export const STEADY_TOLERANCE = 0.5;

export const SLED_META: RoundGameMeta = {
  id: "sled-slope",
  title: "Sled Slope",
  eyebrow: "MECHANICS · FRICTION",
  modelTag: "STATIC & KINETIC FRICTION",
  introduction: "Friction decides whether a sled sits still, races away or slides at a steady speed. Find the angle where a sled starts to slip, build a slope that stops it in the finish zone, and tilt a loading ramp so a crate slides down at constant speed.",
  instructions: "Predict, then set the angle or the slope length. Static friction holds an object up to μ_s N; once it slides, kinetic friction μ_k N acts, which is usually smaller.",
  formula: "tanθ_slip = μ_s  ·  a = g (sinθ − μ_k cosθ)  ·  d = v² / (2 μ_k g)",
  formulaCaption: "θ is the slope angle, μ_s and μ_k the static and kinetic friction coefficients, g = 9.81 m/s², a the acceleration down the slope, v the speed and d the glide distance on the flat.",
  explanation: "On a slope the weight splits into a part along the slope, mg sinθ, and a part into it, mg cosθ, which sets the normal force. Static friction can hold the sled until mg sinθ exceeds μ_s mg cosθ, that is until tanθ = μ_s: the mass cancels, so every sled on the same snow slips at the same angle. Once sliding, friction drops to μ_k N and the sled accelerates at g(sinθ − μ_k cosθ). On the flat, kinetic friction removes its energy and it glides v²/(2μ_k g). If tanθ equals μ_k exactly, the forces balance and a nudged object slides at constant speed: Newton's first law with friction included.",
  assumptions: "Dry Coulomb friction with constant coefficients (waxed runners on packed snow μ_s = 0.14, μ_k = 0.05; wood on wood μ_s = 0.5, μ_k = 0.3), no air resistance, no speed lost where the slope meets the flat. Real snow friction changes with temperature and wax.",
  learningObjectives: ["Find the slipping angle from μ_s.", "Use energy or kinematics to predict a run-out distance.", "Explain constant-speed sliding when tanθ = μ_k."],
  objective: { title: "Master the slope", description: "Solve each friction problem.", unit: "slopes" },
  controlsHeading: "Your design",
  submitLabel: "Release the sled",
  solvedLabel: "Great sledding!",
  nextLabel: "Next slope",
};

export const SLED_ROUNDS: readonly SledRound[] = Object.freeze([
  {
    id: "when-does-it-slip", title: "When does it slip?", difficulty: "Beginner", kind: "slip",
    situation: `A sled with waxed runners sits on packed snow (μ_s = ${SLED_ON_SNOW.staticCoefficient}). Tilt the slope until the sled just starts to slide by itself: at most ${SLIP_MARGIN}° steeper than the slipping angle.`,
    controls: [slider("angle", "Slope angle", "°", 0, 30, 0.1, 3)],
    hint: "It slips when tanθ = μ_s.",
  },
  {
    id: "stop-in-the-zone", title: "Stop in the zone", difficulty: "Intermediate", kind: "runout",
    situation: `A sled starts from rest at the top of a ${RUNOUT_SLOPE}° snow slope (μ_k = ${SLED_ON_SNOW.kineticCoefficient}) and glides onto flat snow. How long must the slope be for the sled to stop ${RUNOUT_TARGET} m along the flat? (± ${RUNOUT_TOLERANCE} m of glide)`,
    controls: [fixed("slope", "Slope angle", "°", RUNOUT_SLOPE), slider("length", "Slope length", "m", 1, 20, 0.05, 5)],
    hint: "v² = 2 g (sinθ − μ_k cosθ) L at the bottom, then the glide is v²/(2 μ_k g).",
  },
  {
    id: "steady-crate", title: "The steady crate", difficulty: "Advanced", kind: "steady",
    situation: `A wooden crate on a wooden ramp (μ_s = ${WOOD.staticCoefficient}, μ_k = ${WOOD.kineticCoefficient}) should slide down at a steady speed once it is given a nudge. Set the ramp angle (± ${STEADY_TOLERANCE}°).`,
    controls: [slider("angle", "Ramp angle", "°", 0, 40, 0.1, 25)],
    hint: "Constant speed means no net force: mg sinθ = μ_k mg cosθ.",
  },
]);

export function runSled(round: SledRound, v: NumericControl): SledOutcome {
  if (round.kind === "slip") {
    const angle = v.angle as number;
    const critical = calculateCriticalAngle(SLED_ON_SNOW);
    const success = angle >= critical && angle <= critical + SLIP_MARGIN;
    return {
      headline: angle, unit: "°", success, accuracyFraction: success ? 1 - (angle - critical) / SLIP_MARGIN : 0, predictionActual: critical,
      feedback: success
        ? `At ${angle.toFixed(1)}° the pull down the slope just beats static friction (slip angle ${critical.toFixed(2)}°), so the sled starts to slide.`
        : angle < critical ? `At ${angle.toFixed(1)}° static friction still holds the sled: it needs ${critical.toFixed(2)}°.` : `At ${angle.toFixed(1)}° the sled slides, but you went more than ${SLIP_MARGIN}° past the slip angle of ${critical.toFixed(2)}°.`,
    };
  }
  if (round.kind === "runout") {
    const length = v.length as number;
    const speed = calculateSpeedAtBottom(length, RUNOUT_SLOPE, SLED_ON_SNOW.kineticCoefficient);
    const glide = calculateRunOutDistance(speed, SLED_ON_SNOW.kineticCoefficient);
    const angle = (RUNOUT_SLOPE * Math.PI) / 180;
    const truth = (RUNOUT_TARGET * SLED_ON_SNOW.kineticCoefficient) / (Math.sin(angle) - SLED_ON_SNOW.kineticCoefficient * Math.cos(angle));
    const error = Math.abs(glide - RUNOUT_TARGET);
    const success = error <= RUNOUT_TOLERANCE;
    return {
      headline: glide, unit: "m", success, accuracyFraction: success ? 1 - error / RUNOUT_TOLERANCE : 0, predictionActual: truth,
      feedback: success
        ? `A ${length.toFixed(2)} m slope gives ${speed.toFixed(2)} m/s at the bottom; friction then stops the sled after ${glide.toFixed(1)} m, in the zone.`
        : `A ${length.toFixed(2)} m slope gives ${speed.toFixed(2)} m/s and a ${glide.toFixed(1)} m glide, ${glide > RUNOUT_TARGET ? "past" : "short of"} the zone at ${RUNOUT_TARGET} m.`,
    };
  }
  const angle = v.angle as number;
  const steady = calculateConstantSpeedAngle(WOOD.kineticCoefficient);
  const a = calculateSlopeAcceleration(angle, WOOD.kineticCoefficient);
  const error = Math.abs(angle - steady);
  const success = error <= STEADY_TOLERANCE;
  return {
    headline: a, unit: "m/s²", success, accuracyFraction: success ? 1 - error / STEADY_TOLERANCE : 0, predictionActual: steady,
    feedback: success
      ? `At ${angle.toFixed(1)}° kinetic friction balances the pull down the slope (acceleration ${a.toFixed(2)} m/s²): once nudged, the crate slides at constant speed.`
      : a > 0 ? `At ${angle.toFixed(1)}° the crate speeds up at ${a.toFixed(2)} m/s²; the steady angle is ${steady.toFixed(1)}°.` : `At ${angle.toFixed(1)}° friction wins and a nudged crate slows down (${a.toFixed(2)} m/s²).`,
  };
}

export const sledSlope = defineNumericGame<SledRound, SledOutcome>({
  meta: SLED_META,
  rounds: SLED_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "runout" ? { label: "Your prediction of the slope length", unit: "m", placeholder: "e.g. 10", step: 0.1 }
    : { label: "Your prediction of the angle", unit: "°", placeholder: "e.g. 10", step: 0.1 },
  evaluate: (round, values) => runSled(round, values),
});
