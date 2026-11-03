import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateConductionPower, calculateIcedDrink, calculateKettleTime } from "../../../physics/thermodynamics";

export type KitchenKind = "boil" | "ice" | "pot";

export interface KitchenRound extends NumericRound { readonly kind: KitchenKind }

export interface KitchenOutcome extends AttemptOutcome {
  readonly headline: number;
  readonly detail: number | null;
}

export const WATER_MASS = 2;
export const HOB_POWER = 2000;
export const HOB_EFFICIENCY = 0.8;
export const BOIL_TOLERANCE_MIN = 0.5;
export const DRINK_MASS = 0.25;
export const DRINK_START = 25;
export const CUBE_MASS = 0.02;
export const DRINK_TARGET = 10;
export const DRINK_TOLERANCE = 1.5;
export const POT_RADIUS = 0.1;
export const ALUMINIUM_CONDUCTIVITY = 237;
export const BASE_POWER = 1500;
export const BASE_DROP = 2;
export const BASE_TOLERANCE_MM = 0.5;

export const KITCHEN_META: RoundGameMeta = {
  id: "kitchen-scientist",
  title: "Kitchen Scientist",
  eyebrow: "EVERYDAY PHYSICS · COOKING",
  modelTag: "HEAT TRANSFER & PHASE CHANGE",
  introduction: "The kitchen is a heat lab. Time a pot of pasta water, cool a drink with the right number of ice cubes, and design the base of a pot so the heat flows through it as it should.",
  instructions: "Predict, set your answer and check it. Heating water takes energy proportional to its mass and temperature rise; melting ice takes a lot of energy at a constant temperature; and heat flows through a pot base in proportion to its area and inversely to its thickness.",
  formula: "Q = m c ΔT  ·  Q = m L  ·  P = k A ΔT / d",
  formulaCaption: "c = 4186 J/kg·K is the specific heat of water, L = 334 kJ/kg the latent heat of fusion of ice, k the thermal conductivity (237 W/m·K for aluminium), A the area and d the thickness of the pot base.",
  explanation: "To heat water you must supply Q = mcΔT; an 80 % efficient 2 kW hob delivers only 1.6 kW to the water, and the rest warms the kitchen. Ice cools a drink in two stages: melting 1 g of ice takes 334 J (the same as warming 1 g of water by 80 °C), and only then does the meltwater warm up, so ice is a far better coolant than cold water. Heat flows through a pot base like current through a resistor: more area or conductivity means more flow; a thicker base means less flow for the same temperature difference, so a thick base needs a bigger drop in temperature across it to carry the same heat.",
  assumptions: "Pure water (sugar, salt and alcohol change its properties), no heat exchange with the glass or the room, a hob efficiency of 80 %, full melting of the ice (checked in the model), and steady one-dimensional conduction through a flat aluminium base.",
  learningObjectives: ["Calculate the heating time from energy and power.", "Include latent heat when cooling with ice.", "Use Fourier's law to design a conducting layer."],
  objective: { title: "Cook up some physics", description: "Solve every kitchen problem.", unit: "problems" },
  controlsHeading: "Your answer",
  submitLabel: "Check the kitchen",
  solvedLabel: "Delicious physics!",
  nextLabel: "Next problem",
};

export const KITCHEN_ROUNDS: readonly KitchenRound[] = Object.freeze([
  {
    id: "boil-the-pasta-water", title: "Boil the pasta water", difficulty: "Beginner", kind: "boil",
    situation: `A ${HOB_POWER / 1000} kW hob, ${HOB_EFFICIENCY * 100} % efficient, heats ${WATER_MASS} kg of water from 20 °C to 100 °C. How many minutes does it take? (± ${BOIL_TOLERANCE_MIN} min)`,
    controls: [slider("minutes", "Heating time", "min", 0, 20, 0.1, 5)],
    hint: "t = m c ΔT / (η P) = 2 × 4186 × 80 / (0.8 × 2000) seconds.",
  },
  {
    id: "ice-in-the-drink", title: "Ice in the drink", difficulty: "Intermediate", kind: "ice",
    situation: `Cool ${DRINK_MASS * 1000} g of juice at ${DRINK_START} °C to ${DRINK_TARGET} °C (± ${DRINK_TOLERANCE} °C) with 20 g ice cubes at 0 °C. How many cubes do you add? Treat the juice like water.`,
    controls: [fixed("start", "Juice temperature", "°C", DRINK_START), slider("cubes", "Ice cubes", "", 0, 8, 1, 1)],
    hint: "Each cube takes 0.02 × 334 000 J to melt and then warms to the final temperature. Balance the heat lost by the juice.",
  },
  {
    id: "the-pot-base", title: "The pot base", difficulty: "Advanced", kind: "pot",
    situation: `A pot with a 20 cm diameter aluminium base (k = ${ALUMINIUM_CONDUCTIVITY} W/m·K) carries ${BASE_POWER} W from the hob to the water. Choose its thickness so the temperature drop across the base is ${BASE_DROP} K (± ${BASE_TOLERANCE_MM} mm in thickness).`,
    controls: [fixed("power", "Heat flow", "W", BASE_POWER), slider("thickness", "Base thickness", "mm", 1, 30, 0.1, 5)],
    hint: "Fourier: P = kAΔT/d, so d = kAΔT/P, with A = π(0.1 m)².",
  },
]);

export function runKitchen(round: KitchenRound, v: NumericControl): KitchenOutcome {
  if (round.kind === "boil") {
    const truth = calculateKettleTime(WATER_MASS, 20, 100, HOB_POWER, HOB_EFFICIENCY) / 60;
    const guess = v.minutes as number;
    const error = Math.abs(guess - truth);
    const success = error <= BOIL_TOLERANCE_MIN;
    return {
      headline: truth, detail: null, success, accuracyFraction: success ? 1 - error / BOIL_TOLERANCE_MIN : 0, predictionActual: truth,
      feedback: success ? `Q = mcΔT = ${(WATER_MASS * 4186 * 80 / 1000).toFixed(0)} kJ delivered at ${HOB_POWER * HOB_EFFICIENCY} W takes ${truth.toFixed(2)} min.`
        : `${guess} min is ${guess > truth ? "longer" : "shorter"} than the ${truth.toFixed(2)} min the energy needs: at ${HOB_POWER * HOB_EFFICIENCY} W the pot gains ${(HOB_POWER * HOB_EFFICIENCY * guess * 60 / 1000).toFixed(0)} kJ in that time.`,
    };
  }
  if (round.kind === "ice") {
    const cubes = v.cubes as number;
    const drink = calculateIcedDrink(DRINK_MASS, DRINK_START, cubes * CUBE_MASS);
    const exact = ((DRINK_MASS * 4186 * DRINK_START) - DRINK_TARGET * (DRINK_MASS * 4186)) / (CUBE_MASS * (334000 + 4186 * DRINK_TARGET));
    const error = Math.abs(drink.finalCelsius - DRINK_TARGET);
    const success = error <= DRINK_TOLERANCE && drink.iceLeftKg === 0;
    return {
      headline: drink.finalCelsius, detail: drink.iceLeftKg, success, accuracyFraction: success ? 1 - error / DRINK_TOLERANCE : 0, predictionActual: exact,
      feedback: success ? `${cubes} cubes absorb ${(cubes * CUBE_MASS * 334000 / 1000).toFixed(1)} kJ just to melt, leaving the drink at ${drink.finalCelsius.toFixed(1)} °C.`
        : drink.iceLeftKg > 0 ? `Too much ice: the drink falls to 0 °C and ${(drink.iceLeftKg * 1000).toFixed(0)} g of ice is left unmelted.`
        : `${cubes} cubes leave the drink at ${drink.finalCelsius.toFixed(1)} °C, ${drink.finalCelsius > DRINK_TARGET ? "too warm" : "too cold"}.`,
    };
  }
  const area = Math.PI * POT_RADIUS ** 2;
  const thickness = (v.thickness as number) / 1000;
  const drop = (BASE_POWER * thickness) / (ALUMINIUM_CONDUCTIVITY * area);
  const truth = (ALUMINIUM_CONDUCTIVITY * area * BASE_DROP) / BASE_POWER * 1000;
  const error = Math.abs(thickness * 1000 - truth);
  const success = error <= BASE_TOLERANCE_MM;
  const check = calculateConductionPower(ALUMINIUM_CONDUCTIVITY, area, thickness, BASE_DROP);
  return {
    headline: drop, detail: check, success, accuracyFraction: success ? 1 - error / BASE_TOLERANCE_MM : 0, predictionActual: truth,
    feedback: success ? `A ${(thickness * 1000).toFixed(1)} mm base needs only ${drop.toFixed(2)} K to carry ${BASE_POWER} W (k A ΔT/d).`
      : `A ${(thickness * 1000).toFixed(1)} mm base drops ${drop.toFixed(2)} K at ${BASE_POWER} W, ${drop > BASE_DROP ? "too much: make it thinner" : "less than wanted: make it thicker"}.`,
  };
}

export const kitchenScientist = defineNumericGame<KitchenRound, KitchenOutcome>({
  meta: KITCHEN_META,
  rounds: KITCHEN_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "boil" ? { label: "Your prediction of the heating time", unit: "min", placeholder: "e.g. 7", step: 0.1 }
    : round.kind === "ice" ? { label: "Your prediction of the number of cubes", unit: "", placeholder: "e.g. 2", step: 0.1 }
    : { label: "Your prediction of the base thickness", unit: "mm", placeholder: "e.g. 10", step: 0.1 },
  evaluate: (round, values) => runKitchen(round, values),
});
