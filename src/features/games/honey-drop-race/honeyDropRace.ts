import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { STEEL_DENSITY } from "../../../physics/core";
import { VISCOUS_FLUIDS, calculateRadiusForReynolds, calculateSphereReynolds, calculateStokesTerminalSpeed, calculateViscosityFromFall } from "../../../physics/fluids";

export type HoneyKind = "glycerol" | "honey" | "validity";
export interface HoneyRound extends NumericRound { readonly kind: HoneyKind }
export interface HoneyOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const GLYCEROL = VISCOUS_FLUIDS.find((fluid) => fluid.id === "glycerol")!;
export const HONEY = VISCOUS_FLUIDS.find((fluid) => fluid.id === "honey")!;
export const MARK_DISTANCE = 0.1;
export const FALL_ROUND = { radiusMm: 1, toleranceSeconds: 0.3 } as const;
export const MEASURE_ROUND = { radiusMm: 1.5, fallSeconds: 25, tolerance: 0.03 } as const;
export const VALIDITY_ROUND = { lowest: 0.8, highest: 1 } as const;

export const HONEY_META: RoundGameMeta = {
  id: "honey-drop-race",
  title: "Honey Drop Race",
  eyebrow: "FLUID MECHANICS · VISCOSITY",
  modelTag: "STOKES' LAW",
  introduction: "Drop steel balls into thick liquids and time them. Predict how long a ball takes to sink through glycerol, measure the viscosity of honey from a stopwatch reading, and find the largest ball for which the simple law still works.",
  instructions: "Predict, then set the time, the viscosity or the ball size. A small ball sinking slowly through a thick liquid soon reaches a steady speed where viscous drag and buoyancy balance its weight.",
  formula: "v_t = 2 (ρ_s − ρ_f) g r² / (9 μ)  ·  Re = ρ_f v (2r) / μ",
  formulaCaption: "v_t is the terminal speed, ρ_s and ρ_f the densities of the steel (7850 kg/m³) and the liquid, g = 9.81 m/s², r the ball's radius, μ the viscosity (Pa·s) and Re the Reynolds number.",
  explanation: "A ball sinking through a thick liquid is pulled down by its weight, pushed up by buoyancy and held back by viscous drag, which for slow, smooth flow is 6πμrv (Stokes' law). It quickly reaches the speed where these balance. Because the weight grows as r³ but the drag only as r, bigger balls sink faster, as r². Timing a ball between two marks therefore measures the viscosity, the principle of the falling-ball viscometer. Stokes' law assumes the liquid flows smoothly round the ball, which is true only when the Reynolds number is below about 1; for faster or bigger balls, swirling wakes add extra drag and the simple formula overestimates the speed.",
  assumptions: "A smooth steel sphere far from the container walls, a Newtonian liquid at about 20 °C (glycerol 1260 kg/m³ and 1.41 Pa·s, honey 1420 kg/m³), the terminal speed reached before the first mark, and Stokes drag for Re < 1. Honey's viscosity varies strongly with temperature and water content.",
  learningObjectives: ["Use Stokes' law to predict a terminal speed.", "Measure viscosity from a falling-ball experiment.", "Check a model's range of validity with the Reynolds number."],
  objective: { title: "Win the drop race", description: "Solve each viscosity problem.", unit: "drops" },
  controlsHeading: "Your answer",
  submitLabel: "Drop the ball",
  solvedLabel: "Sticky success!",
  nextLabel: "Next drop",
};

export const HONEY_ROUNDS: readonly HoneyRound[] = Object.freeze([
  {
    id: "glycerol-drop", title: "The glycerol drop", difficulty: "Beginner", kind: "glycerol",
    situation: `A steel ball of radius ${FALL_ROUND.radiusMm} mm sinks through glycerol (μ = ${GLYCEROL.viscosity} Pa·s). How long does it take to pass between two marks ${MARK_DISTANCE * 100} cm apart? (± ${FALL_ROUND.toleranceSeconds} s)`,
    controls: [fixed("radius", "Ball radius", "mm", FALL_ROUND.radiusMm), slider("time", "Time between the marks", "s", 1, 30, 0.1, 5)],
    hint: "Find v_t with Stokes' law, then t = distance / v_t.",
  },
  {
    id: "measure-honey", title: "Measure the honey", difficulty: "Intermediate", kind: "honey",
    situation: `A steel ball of radius ${MEASURE_ROUND.radiusMm} mm takes ${MEASURE_ROUND.fallSeconds} s to fall ${MARK_DISTANCE * 100} cm through honey (${HONEY.density} kg/m³). What is the honey's viscosity? (± ${MEASURE_ROUND.tolerance * 100} %)`,
    controls: [fixed("radius", "Ball radius", "mm", MEASURE_ROUND.radiusMm), slider("viscosity", "Viscosity", "Pa·s", 1, 20, 0.05, 5)],
    hint: "μ = 2 (ρ_s − ρ_f) g r² / (9 v), with v = 0.1 m / 25 s.",
  },
  {
    id: "how-big", title: "How big can it be?", difficulty: "Advanced", kind: "validity",
    situation: `Stokes' law only holds while the Reynolds number stays below 1. Choose the largest steel ball for glycerol that keeps Re between ${VALIDITY_ROUND.lowest} and ${VALIDITY_ROUND.highest}.`,
    controls: [fixed("viscosity", "Glycerol viscosity", "Pa·s", GLYCEROL.viscosity), slider("radius", "Ball radius", "mm", 0.5, 8, 0.01, 2)],
    hint: "Re = ρ_f v_t (2r)/μ, and v_t ∝ r², so Re ∝ r³.",
  },
]);

export function runHoney(round: HoneyRound, v: NumericControl): HoneyOutcome {
  if (round.kind === "glycerol") {
    const guess = v.time as number;
    const speed = calculateStokesTerminalSpeed(STEEL_DENSITY, GLYCEROL.density, FALL_ROUND.radiusMm / 1000, GLYCEROL.viscosity);
    const truth = MARK_DISTANCE / speed;
    const error = Math.abs(guess - truth);
    const success = error <= FALL_ROUND.toleranceSeconds;
    return {
      headline: speed * 1000, unit: "mm/s", success, accuracyFraction: success ? 1 - error / FALL_ROUND.toleranceSeconds : 0, predictionActual: truth,
      feedback: success
        ? `The ball sinks at ${(speed * 1000).toFixed(1)} mm/s, so it takes ${truth.toFixed(1)} s. The drag is so strong that it reaches this speed within a hundredth of a millimetre.`
        : `At ${(speed * 1000).toFixed(1)} mm/s the ball takes ${truth.toFixed(1)} s, not ${guess.toFixed(1)} s.`,
    };
  }
  if (round.kind === "honey") {
    const guess = v.viscosity as number;
    const speed = MARK_DISTANCE / MEASURE_ROUND.fallSeconds;
    const truth = calculateViscosityFromFall(STEEL_DENSITY, HONEY.density, MEASURE_ROUND.radiusMm / 1000, speed);
    const error = Math.abs(guess - truth) / truth;
    const success = error <= MEASURE_ROUND.tolerance;
    const reynolds = calculateSphereReynolds(HONEY.density, speed, MEASURE_ROUND.radiusMm / 1000, truth);
    return {
      headline: truth, unit: "Pa·s", success, accuracyFraction: success ? 1 - error / MEASURE_ROUND.tolerance : 0, predictionActual: truth,
      feedback: success
        ? `μ = ${truth.toFixed(2)} Pa·s, about ${(truth / 1e-3).toFixed(0)} times as viscous as water. Re = ${reynolds.toExponential(1)}, so Stokes' law applies.`
        : `With μ = ${guess.toFixed(2)} Pa·s the ball would take ${((MARK_DISTANCE / calculateStokesTerminalSpeed(STEEL_DENSITY, HONEY.density, MEASURE_ROUND.radiusMm / 1000, guess))).toFixed(1)} s, not ${MEASURE_ROUND.fallSeconds} s.`,
    };
  }
  const radius = (v.radius as number) / 1000;
  const speed = calculateStokesTerminalSpeed(STEEL_DENSITY, GLYCEROL.density, radius, GLYCEROL.viscosity);
  const reynolds = calculateSphereReynolds(GLYCEROL.density, speed, radius, GLYCEROL.viscosity);
  const truth = calculateRadiusForReynolds(STEEL_DENSITY, GLYCEROL.density, GLYCEROL.viscosity, 1) * 1000;
  const success = reynolds >= VALIDITY_ROUND.lowest && reynolds <= VALIDITY_ROUND.highest;
  return {
    headline: reynolds, unit: "", success, accuracyFraction: success ? (reynolds - VALIDITY_ROUND.lowest) / (VALIDITY_ROUND.highest - VALIDITY_ROUND.lowest) : 0, predictionActual: truth,
    feedback: success
      ? `A ${(radius * 1000).toFixed(2)} mm ball has Re = ${reynolds.toFixed(2)}: still smooth flow. Because Re grows as r³, a ball only ${(Math.cbrt(10)).toFixed(1)} times larger would reach Re = 10, where Stokes' law fails.`
      : reynolds > VALIDITY_ROUND.highest ? `Re = ${reynolds.toFixed(2)}: the flow is no longer smooth and Stokes' law overestimates the speed. Use a smaller ball.` : `Re = ${reynolds.toFixed(2)}: safely valid, but you can use a bigger ball.`,
  };
}

export const honeyDropRace = defineNumericGame<HoneyRound, HoneyOutcome>({
  meta: HONEY_META,
  rounds: HONEY_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "glycerol" ? { label: "Your prediction of the time", unit: "s", placeholder: "e.g. 8", step: 0.1 }
    : round.kind === "honey" ? { label: "Your prediction of the viscosity", unit: "Pa·s", placeholder: "e.g. 6", step: 0.05 }
    : { label: "Your prediction of the largest radius", unit: "mm", placeholder: "e.g. 3", step: 0.01 },
  evaluate: (round, values) => runHoney(round, values),
});
