import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { SPECIFIC_HEAT_WATER } from "../../../physics/core";
import { calculateCollectedPower, calculateDishArea, calculateHeatingTime, calculateSteadyPotTemperature } from "../../../physics/thermodynamics";

export type CookerKind = "time" | "alignment" | "bake";

export interface CookerRound extends NumericRound {
  readonly kind: CookerKind;
  readonly waterKilograms?: number;
}

export interface CookerOutcome extends AttemptOutcome {
  readonly powerWatts: number;
  readonly minutes: number | null;
  readonly steadyCelsius: number | null;
  readonly misalignmentDegrees: number;
}

export const IRRADIANCE = 1000;
export const REFLECTIVITY = 0.85;
export const AMBIENT = 25;
export const SUN_ELEVATION = 35;
export const POT_AREA = 0.3;
const BOIL_RISE = 80;

export const COOKER_META: RoundGameMeta = {
  id: "solar-cooker",
  title: "Solar Cooker",
  eyebrow: "THERMODYNAMICS · RADIATION & HEAT LOSS",
  modelTag: "SOLAR CONCENTRATION · NEWTON COOLING",
  introduction: "Cook with sunlight. A reflector gathers solar power onto a pot: choose its size and pointing, and the insulation around the pot, to boil water or bake at the right temperature.",
  instructions: "Predict the result, set the cooker, then put it in the sun (1000 W/m², reflectivity 0.85). The pot gains the collected power and loses heat to the air.",
  formula: "P = I A ρ cos θ  ·  t = m c ΔT / P  ·  T = T_a + P/(h S)",
  formulaCaption: "I = 1000 W/m² is the sunlight's intensity, A the dish area, ρ the reflectivity and θ the angle between the dish axis and the sun. h is the pot's loss coefficient and S its surface area.",
  explanation: "A reflector collects sunlight over its whole aperture and concentrates it on a small pot, so a bigger dish collects power in proportion to its area (the square of its diameter). If the dish does not face the sun, it intercepts less: the collected power falls as the cosine of the misalignment angle. The pot also loses heat to the air in proportion to its temperature excess, so it stops warming where heat in equals heat out; better insulation (a smaller loss coefficient) lets it get hotter.",
  assumptions: "Constant irradiance, a perfectly focused reflector with 85% reflectivity, a single loss coefficient for the pot (standing for convection and radiation), and a pot at a uniform temperature. The sun is 35° above the horizon in the alignment round.",
  learningObjectives: ["Calculate the solar power collected by a reflector, including misalignment.", "Estimate heating time from Q = mcΔT and power.", "Find the equilibrium temperature where heat gain equals heat loss."],
  objective: { title: "Cook every meal", description: "Meet each cooking goal.", unit: "meals" },
  controlsHeading: "Set up the cooker",
  submitLabel: "Put it in the sun",
  solvedLabel: "Dinner is served!",
  nextLabel: "Next meal",
};

export const COOKER_ROUNDS: readonly CookerRound[] = Object.freeze([
  {
    id: "boil-a-litre", title: "Boil a litre", difficulty: "Beginner", kind: "time", waterKilograms: 1,
    situation: "Heat 1 kg of water from 20 °C to boiling (an 80 K rise) with a dish pointed straight at the sun. It should take between 20 and 40 minutes: faster is wasteful, slower is a long wait. Choose the dish diameter.",
    controls: [slider("diameter", "Dish diameter", "m", 0.3, 2, 0.01, 0.8)],
    hint: "Energy needed: m c ΔT = 1 × 4186 × 80 ≈ 335 kJ. At power P the time is Q/P. Find the P that gives 30 minutes, then the area from P = I A ρ.",
  },
  {
    id: "track-the-sun", title: "Track the sun", difficulty: "Intermediate", kind: "alignment", waterKilograms: 2,
    situation: "A 1.0 m dish heats 2 kg of water by 80 K. The sun is 35° above the horizon, and you set the dish's tilt (its axis angle above the horizon). Aim well enough to boil the water in 17.2 minutes or less.",
    controls: [fixed("diameter", "Dish diameter", "m", 1), slider("tilt", "Dish tilt above horizon", "°", 0, 90, 0.5, 45)],
    hint: "The power is proportional to cos θ with θ the angle between the dish axis and the sun. Facing the sun directly gives 16.7 minutes; how far can you be off?",
  },
  {
    id: "bake", title: "Bake at 110–130 °C", difficulty: "Advanced", kind: "bake",
    situation: "Now you want to bake: the closed pot (0.3 m² of surface) should settle at between 110 °C and 130 °C in 25 °C air. Choose the dish diameter and the pot's insulation (its loss coefficient h, in W/m²·K).",
    controls: [slider("diameter", "Dish diameter", "m", 0.4, 1.5, 0.01, 0.8), slider("loss", "Pot loss coefficient", "W/m²·K", 5, 40, 0.5, 20)],
    hint: "In steady state the collected power equals the heat lost: P = h S (T − 25). Choose a diameter and an h that give T in range.",
  },
]);

export function runCooker(round: CookerRound, v: NumericControl): CookerOutcome {
  const diameter = v.diameter as number;
  const misalignment = round.kind === "alignment" ? Math.abs((v.tilt as number) - SUN_ELEVATION) : 0;
  const power = calculateCollectedPower(IRRADIANCE, calculateDishArea(diameter), REFLECTIVITY, misalignment);

  if (round.kind === "bake") {
    const steady = calculateSteadyPotTemperature(power, v.loss as number, POT_AREA, AMBIENT);
    const success = steady >= 110 && steady <= 130;
    return {
      success, powerWatts: power, minutes: null, steadyCelsius: steady, misalignmentDegrees: 0,
      accuracyFraction: success ? 1 - Math.abs(steady - 120) / 10 : 0, predictionActual: steady,
      feedback: success ? `The pot settles at ${steady.toFixed(0)} °C, ideal for baking.` : `The pot settles at ${steady.toFixed(0)} °C, ${steady < 110 ? "too cool: collect more power or lose less heat" : "too hot: collect less power or lose more heat"}.`,
    };
  }

  const energy = (round.waterKilograms as number) * SPECIFIC_HEAT_WATER * BOIL_RISE;
  const seconds = calculateHeatingTime(energy, power);
  const minutes = seconds === null ? null : seconds / 60;
  let success: boolean;
  let accuracy: number;
  let feedback: string;
  if (round.kind === "time") {
    success = minutes !== null && minutes >= 20 && minutes <= 40;
    accuracy = minutes === null ? 0 : 1 - Math.abs(minutes - 30) / 10;
    feedback = success ? `The water boils in ${minutes!.toFixed(1)} minutes.` : minutes === null ? "No sunlight reaches the pot." : minutes > 40 ? `${minutes.toFixed(0)} minutes is too slow: a bigger dish collects more power.` : `${minutes.toFixed(0)} minutes is faster than needed: a smaller dish would do.`;
  } else {
    success = minutes !== null && minutes <= 17.2;
    accuracy = minutes === null ? 0 : Math.min(1, (17.2 - minutes) / 0.5 + 0.5);
    feedback = success ? `Boiling in ${minutes!.toFixed(1)} minutes with the dish ${misalignment.toFixed(1)}° off the sun.` : minutes === null ? "The dish faces away from the sun." : `Boiling takes ${minutes.toFixed(1)} minutes, but the sun is 35° up and the dish is ${misalignment.toFixed(0)}° off axis, so it collects only ${(Math.cos((misalignment * Math.PI) / 180) * 100).toFixed(0)}% of the power.`;
  }
  return { success, powerWatts: power, minutes, steadyCelsius: null, misalignmentDegrees: misalignment, accuracyFraction: success ? Math.max(0, Math.min(1, accuracy)) : 0, predictionActual: minutes, feedback };
}

export const solarCooker = defineNumericGame<CookerRound, CookerOutcome>({
  meta: COOKER_META,
  rounds: COOKER_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "bake"
      ? { label: "Your prediction of the pot's steady temperature", unit: "°C", placeholder: "e.g. 120", step: 1 }
      : { label: "Your prediction of the time to boil", unit: "min", placeholder: "e.g. 30", step: 0.1 },
  evaluate: (round, values) => runCooker(round, values),
});
