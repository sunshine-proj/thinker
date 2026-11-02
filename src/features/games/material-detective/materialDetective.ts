import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { SPECIFIC_HEAT_WATER } from "../../../physics/core";
import { calculateEquilibriumTemperature } from "../../../physics/thermodynamics";

export interface Material { readonly name: string; readonly specificHeat: number }

/** Handbook values near room temperature, J/(kg·K). */
export const MATERIALS: readonly Material[] = Object.freeze([
  { name: "lead", specificHeat: 130 }, { name: "silver", specificHeat: 235 }, { name: "copper", specificHeat: 385 },
  { name: "iron", specificHeat: 450 }, { name: "glass", specificHeat: 840 }, { name: "aluminium", specificHeat: 900 },
]);

export interface DetectiveRound extends NumericRound {
  readonly hiddenMaterial: string;
}

export interface DetectiveOutcome extends AttemptOutcome {
  readonly trueSpecificHeat: number;
  readonly nearest: Material;
}

export const TOLERANCE = 0.05;

export const DETECTIVE_META: RoundGameMeta = {
  id: "material-detective",
  title: "Material Detective",
  eyebrow: "THERMODYNAMICS · SPECIFIC HEAT",
  modelTag: "CALORIMETRY · ENERGY BALANCE",
  introduction: "Identify a mystery metal by dropping a hot sample into water and measuring how much the water warms. The specific heat is a fingerprint of the material.",
  instructions: "Set up the experiment and read the final temperature the thermometer shows. Work out the sample's specific heat, enter your estimate and submit. A match within 5% identifies the metal.",
  formula: "m_s c_s (T_s − T_f) = (m_w c_w + C_cup)(T_f − T_w)",
  formulaCaption: "The heat lost by the hot sample equals the heat gained by the water and the cup. c_w = 4186 J/kg·K, C_cup is the cup's heat capacity, and T_f is the final temperature.",
  explanation: "Heat flows from the hot sample into the water until they reach a common temperature. If nothing is lost, the heat given up by the sample equals the heat gained by the water (and the cup that holds it). A material with a large specific heat stores more heat per kilogram per degree, so a metal like aluminium warms the water more than the same mass of lead. By measuring the temperatures and masses you can solve for the one unknown, the sample's specific heat, and compare it with a table of known materials.",
  assumptions: "The calorimeter is perfectly insulated, the sample and water reach equilibrium instantly, and specific heats are constant. The sample is only ever heated to below the boiling point of water (99 °C) so no water boils. The thermometer reading is exact.",
  learningObjectives: ["Use conservation of energy to solve for an unknown specific heat.", "Include a calorimeter cup's heat capacity in the balance.", "Identify a material by comparing a measurement with reference values."],
  objective: { title: "Identify every material", description: "Name each hidden metal by its specific heat.", unit: "metals" },
  controlsHeading: "Run the experiment",
  submitLabel: "Submit my identification",
  solvedLabel: "Identified!",
  nextLabel: "Next sample",
};

const estimate = slider("estimate", "Your estimate of the specific heat", "J/kg·K", 100, 1000, 5, 500);

export const DETECTIVE_ROUNDS: readonly DetectiveRound[] = Object.freeze([
  {
    id: "first-sample", title: "The first sample", difficulty: "Beginner", hiddenMaterial: "aluminium",
    situation: "A 0.20 kg sample heated to 100 °C is dropped into 0.30 kg of water at 20 °C. Read the final temperature, calculate the specific heat, and identify the metal.",
    controls: [fixed("sampleMass", "Sample mass", "kg", 0.2), fixed("sampleTemp", "Sample temperature", "°C", 100), fixed("waterMass", "Water mass", "kg", 0.3), fixed("cup", "Cup heat capacity", "J/K", 0), estimate],
    hint: "c_s = m_w c_w (T_f − T_w) / (m_s (T_s − T_f)). Use the thermometer reading for T_f.",
  },
  {
    id: "choose-the-experiment", title: "Design your own run", difficulty: "Intermediate", hiddenMaterial: "copper",
    situation: "Design the experiment: choose the sample's mass and temperature for a clear temperature rise in 0.25 kg of water at 20 °C. Then identify the metal.",
    controls: [slider("sampleMass", "Sample mass", "kg", 0.1, 0.5, 0.01, 0.3), slider("sampleTemp", "Sample temperature", "°C", 60, 99, 1, 90), fixed("waterMass", "Water mass", "kg", 0.25), fixed("cup", "Cup heat capacity", "J/K", 0), estimate],
    hint: "A heavier or hotter sample gives a bigger, easier-to-measure temperature change. The result does not depend on your choice, only on the material.",
  },
  {
    id: "real-calorimeter", title: "A real calorimeter", difficulty: "Advanced", hiddenMaterial: "iron",
    situation: "The aluminium cup holding the water also absorbs heat: its heat capacity is 120 J/K. Choose the experiment and correct for the cup to identify the metal.",
    controls: [slider("sampleMass", "Sample mass", "kg", 0.1, 0.5, 0.01, 0.3), slider("sampleTemp", "Sample temperature", "°C", 60, 99, 1, 90), slider("waterMass", "Water mass", "kg", 0.15, 0.5, 0.01, 0.3), fixed("cup", "Cup heat capacity", "J/K", 120), estimate],
    hint: "Add the cup to the water's heat capacity: (m_w c_w + C_cup)(T_f − T_w) = m_s c_s (T_s − T_f).",
  },
]);

/** The thermometer reading for the current experiment settings. */
export function finalTemperature(round: DetectiveRound, v: NumericControl): number {
  const material = MATERIALS.find((m) => m.name === round.hiddenMaterial)!;
  return calculateEquilibriumTemperature([
    { heatCapacityJoulesPerKelvin: (v.waterMass as number) * SPECIFIC_HEAT_WATER + (v.cup as number), temperatureCelsius: 20 },
    { heatCapacityJoulesPerKelvin: (v.sampleMass as number) * material.specificHeat, temperatureCelsius: v.sampleTemp as number },
  ]);
}

export function runDetective(round: DetectiveRound, v: NumericControl): DetectiveOutcome {
  const material = MATERIALS.find((m) => m.name === round.hiddenMaterial)!;
  const guess = v.estimate as number;
  const error = Math.abs(guess - material.specificHeat) / material.specificHeat;
  const success = error <= TOLERANCE;
  const nearest = MATERIALS.reduce((best, m) => (Math.abs(m.specificHeat - guess) < Math.abs(best.specificHeat - guess) ? m : best));
  return {
    success, trueSpecificHeat: material.specificHeat, nearest,
    accuracyFraction: success ? 1 - error / TOLERANCE : 0, predictionActual: null,
    feedback: success
      ? `Correct: the sample is ${material.name} (${material.specificHeat} J/kg·K).`
      : `Your estimate of ${guess} J/kg·K is closest to ${nearest.name} (${nearest.specificHeat}), but it does not reproduce the measured temperature. Check your energy balance${round.controls.find((c) => c.key === "cup")!.initial > 0 ? " and include the cup" : ""}.`,
  };
}

export const materialDetective = defineNumericGame<DetectiveRound, DetectiveOutcome>({
  meta: DETECTIVE_META,
  rounds: DETECTIVE_ROUNDS,
  prediction: () => null,
  evaluate: (round, values) => runDetective(round, values),
});
