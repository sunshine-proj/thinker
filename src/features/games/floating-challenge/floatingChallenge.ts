import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { FRESH_WATER_DENSITY, STEEL_DENSITY } from "../../../physics/core";
import {
  calculateFluidDensityForFraction,
  calculateHollowSphereAverageDensity,
  calculateSubmergedFraction,
  calculateWallThicknessForDensity,
  floats,
} from "../../../physics/fluids";

export type FloatKind = "block" | "shell" | "egg";

export interface FloatRound extends NumericRound { readonly kind: FloatKind }

export interface FloatOutcome extends AttemptOutcome {
  readonly objectDensity: number;
  readonly fluidDensity: number;
  readonly submergedFraction: number;
  readonly floating: boolean;
}

export const BLOCK_TARGET = 0.3;
export const BLOCK_TOLERANCE = 0.02;
export const SHELL_RADIUS = 0.5;
export const SHELL_TARGET = 0.5;
export const SHELL_TOLERANCE = 0.03;
export const EGG_DENSITY = 1060;
export const EGG_TARGET = 0.9;
export const EGG_TOLERANCE = 0.01;

export const FLOAT_META: RoundGameMeta = {
  id: "floating-challenge",
  title: "Floating Challenge",
  eyebrow: "FLUID MECHANICS · ARCHIMEDES",
  modelTag: "DENSITY & BUOYANCY",
  introduction: "What floats, and how deep? Pick the density of a wooden block, hollow out a steel ball until it floats half submerged, and mix salt water until an egg bobs at the surface.",
  instructions: "Predict, set the control and drop the object in. An object floats if its average density is less than the fluid's, and it sinks until it has pushed aside its own weight of fluid.",
  formula: "fraction submerged = ρ_object / ρ_fluid  ·  F_buoyant = ρ_fluid g V_displaced",
  formulaCaption: "ρ is density. For a hollow sphere of outer radius R and wall thickness t the average density is ρ_material (1 − (1 − t/R)³), because only the shell is solid material.",
  explanation: "Archimedes' principle says the buoyant force equals the weight of the fluid displaced. A floating object is in balance, so it displaces exactly its own weight of fluid, which means it sinks until the displaced volume times the fluid density equals its mass. The submerged fraction is therefore the ratio of densities. Steel is eight times denser than water, yet a steel ship floats because most of its volume is air: what matters is the average density of the whole object. Denser liquids, such as salt water, carry the same object higher, which is why it is easier to float in the Dead Sea.",
  assumptions: "Uniform fluids at rest, objects that stay upright (stability is covered in Ship Designer), no surface tension, a sealed hollow shell with nothing inside, and densities at room temperature: water 1000 kg/m³, steel 7850 kg/m³, egg 1060 kg/m³.",
  learningObjectives: ["Relate the submerged fraction to the ratio of densities.", "Use average density to explain why hollow steel objects float.", "Predict how fluid density changes the floating depth."],
  objective: { title: "Float every object", description: "Match each floating depth.", unit: "objects" },
  controlsHeading: "Set up the object",
  submitLabel: "Drop it in",
  solvedLabel: "Floating perfectly!",
  nextLabel: "Next object",
};

export const FLOAT_ROUNDS: readonly FloatRound[] = Object.freeze([
  {
    id: "the-wooden-block", title: "The wooden block", difficulty: "Beginner", kind: "block",
    situation: `Choose the density of a wooden block so that ${BLOCK_TARGET * 100} % of its volume is below the surface (± ${BLOCK_TOLERANCE * 100} %) in fresh water.`,
    controls: [fixed("fluid", "Water density", "kg/m³", FRESH_WATER_DENSITY), slider("density", "Block density", "kg/m³", 100, 1200, 1, 800)],
    hint: "The submerged fraction equals ρ_block / ρ_water.",
  },
  {
    id: "the-hollow-ball", title: "The hollow ball", difficulty: "Intermediate", kind: "shell",
    situation: `A sealed hollow steel ball of outer radius ${SHELL_RADIUS * 100} cm sinks if its walls are thick. Choose the wall thickness so that it floats ${SHELL_TARGET * 100} % submerged (± ${SHELL_TOLERANCE * 100} %). Steel is ${STEEL_DENSITY} kg/m³.`,
    controls: [fixed("fluid", "Water density", "kg/m³", FRESH_WATER_DENSITY), slider("thickness", "Wall thickness", "mm", 1, 50, 0.1, 30)],
    hint: "The ball must have an average density of 500 kg/m³: the steel must fill 500/7850 of its volume, so (1 − t/R)³ = 1 − 0.0637.",
  },
  {
    id: "the-egg", title: "The egg", difficulty: "Advanced", kind: "egg",
    situation: `An egg (density ${EGG_DENSITY} kg/m³) sinks in fresh water. Dissolve salt to choose the water's density so that ${EGG_TARGET * 100} % of the egg is submerged (± ${EGG_TOLERANCE * 100} %).`,
    controls: [fixed("egg", "Egg density", "kg/m³", EGG_DENSITY), slider("fluid", "Salt water density", "kg/m³", 1000, 1300, 1, 1000)],
    hint: "fraction = ρ_egg / ρ_fluid = 0.9, so ρ_fluid = ρ_egg / 0.9.",
  },
]);

export function runFloat(round: FloatRound, v: NumericControl): FloatOutcome {
  let objectDensity: number;
  let fluid: number;
  let target: number;
  let tolerance: number;
  let predictionActual: number;
  if (round.kind === "block") {
    objectDensity = v.density as number; fluid = v.fluid as number; target = BLOCK_TARGET; tolerance = BLOCK_TOLERANCE; predictionActual = BLOCK_TARGET * fluid;
  } else if (round.kind === "shell") {
    objectDensity = calculateHollowSphereAverageDensity(STEEL_DENSITY, SHELL_RADIUS, (v.thickness as number) / 1000);
    fluid = v.fluid as number; target = SHELL_TARGET; tolerance = SHELL_TOLERANCE;
    predictionActual = calculateWallThicknessForDensity(STEEL_DENSITY, SHELL_RADIUS, SHELL_TARGET * fluid) * 1000;
  } else {
    objectDensity = v.egg as number; fluid = v.fluid as number; target = EGG_TARGET; tolerance = EGG_TOLERANCE; predictionActual = calculateFluidDensityForFraction(objectDensity, EGG_TARGET);
  }
  const fraction = calculateSubmergedFraction(objectDensity, fluid);
  const doesFloat = floats(objectDensity, fluid);
  const error = Math.abs(fraction - target);
  const success = doesFloat && error <= tolerance;
  return {
    objectDensity, fluidDensity: fluid, submergedFraction: fraction, floating: doesFloat, success, accuracyFraction: success ? 1 - error / tolerance : 0, predictionActual,
    feedback: success ? `Average density ${objectDensity.toFixed(0)} kg/m³ in fluid of ${fluid} kg/m³ floats with ${(fraction * 100).toFixed(1)} % submerged.`
      : !doesFloat ? `Average density ${objectDensity.toFixed(0)} kg/m³ is not below the fluid's ${fluid} kg/m³: it sinks.`
      : `It floats with ${(fraction * 100).toFixed(1)} % submerged, ${fraction > target ? "too deep" : "too high"} (target ${target * 100} %).`,
  };
}

export const floatingChallenge = defineNumericGame<FloatRound, FloatOutcome>({
  meta: FLOAT_META,
  rounds: FLOAT_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "block" ? { label: "Your prediction of the block density", unit: "kg/m³", placeholder: "e.g. 300", step: 1 }
    : round.kind === "shell" ? { label: "Your prediction of the wall thickness", unit: "mm", placeholder: "e.g. 11", step: 0.1 }
    : { label: "Your prediction of the salt water density", unit: "kg/m³", placeholder: "e.g. 1178", step: 0.1 },
  evaluate: (round, values) => runFloat(round, values),
});
