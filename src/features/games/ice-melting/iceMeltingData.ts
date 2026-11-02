import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";

export type IceControlKind = "iceMassGrams" | "waterTemperatureCelsius";

export type IceGoal =
  | { readonly kind: "final-temperature"; readonly targetCelsius: number; readonly toleranceKelvin: number }
  | { readonly kind: "ice-remaining"; readonly targetGrams: number; readonly toleranceGrams: number };

export interface IceRound extends RoundBase {
  readonly waterMassKilograms: number;
  /** Used when the learner does not set it. */
  readonly waterTemperatureCelsius: number;
  readonly iceMassGrams: number;
  readonly iceTemperatureCelsius: number;
  readonly control: {
    readonly kind: IceControlKind;
    readonly minimum: number;
    readonly maximum: number;
    readonly step: number;
  };
  readonly goal: IceGoal;
  readonly predictionKind: "finalTemperature" | "iceRemaining";
}

export interface IceControl {
  /** Ice mass in grams or water temperature in °C, depending on the round's control kind. */
  readonly value: number;
}

export const ICE_MELTING_META: RoundGameMeta = {
  id: "ice-melting",
  title: "Ice Melting Challenge",
  eyebrow: "THERMODYNAMICS · CALORIMETRY",
  modelTag: "INSULATED MIXING · ENERGY BALANCE",
  introduction:
    "Drop ice into water in a perfectly insulated flask. Work out how much heat the water can give up, then choose the setting that leaves the mixture exactly as required.",
  instructions:
    "Predict the outcome, set the control, and mix. Heat lost by the warm water must equal the heat gained by the ice, which has to warm up, melt, and then warm as water.",
  formula: "Q = m c ΔT  ·  Q = m L  ·  Σ Q = 0",
  formulaCaption:
    "c is specific heat (4186 J/kg·K for water, 2090 for ice), L = 334 kJ/kg is the latent heat of melting, and heat lost by the warm parts equals heat gained by the cold parts.",
  explanation:
    "Heat flows from the warm water to the ice until they share one temperature. The ice first warms to 0 °C, then melts at a constant 0 °C while absorbing 334 kJ per kilogram, and only then can the meltwater warm further. That large latent heat is why ice is so effective at cooling a drink: melting 1 kg of ice absorbs as much heat as cooling 1 kg of water by about 80 K. If the water does not hold enough heat, the mixture stops at 0 °C with some ice left over.",
  assumptions:
    "The flask is perfectly insulated and has no heat capacity of its own. Specific heats are treated as constant, nothing evaporates, and the mixture reaches equilibrium instantly at ordinary pressure.",
  learningObjectives: [
    "Use Q = m c ΔT for heating and cooling and Q = m L for melting.",
    "Apply conservation of energy: heat lost equals heat gained.",
    "Recognise when a mixture ends at 0 °C with ice left, and when it ends above 0 °C with none.",
  ],
  objective: {
    title: "Mix every flask",
    description: "Reach the required final state for each mixture.",
    unit: "flasks",
  },
  controlsHeading: "Set up the flask",
  submitLabel: "Mix and wait for equilibrium",
  solvedLabel: "Perfect mixture!",
  nextLabel: "Next flask",
};

export const ICE_ROUNDS: readonly IceRound[] = Object.freeze([
  {
    id: "cool-a-drink",
    title: "Cool a drink",
    difficulty: "Beginner",
    situation:
      "A 0.30 kg drink at 25 °C must cool to 10 °C by adding ice from the freezer at −10 °C. How much ice? All the ice must melt.",
    waterMassKilograms: 0.3,
    waterTemperatureCelsius: 25,
    iceMassGrams: 50,
    iceTemperatureCelsius: -10,
    control: { kind: "iceMassGrams", minimum: 10, maximum: 150, step: 0.5 },
    goal: { kind: "final-temperature", targetCelsius: 10, toleranceKelvin: 0.5 },
    predictionKind: "finalTemperature",
    hint: "Heat lost by the water: m c (25 − 10). Heat gained by the ice: m c_ice (10) to reach 0 °C, plus m L to melt, plus m c_water (10) to warm the meltwater to 10 °C. Set them equal.",
  },
  {
    id: "slush",
    title: "Make a slush",
    difficulty: "Intermediate",
    situation:
      "0.50 kg of water at 20 °C is mixed with ice at −10 °C. Add enough ice that the flask settles at 0 °C with exactly 100 g of ice left floating.",
    waterMassKilograms: 0.5,
    waterTemperatureCelsius: 20,
    iceMassGrams: 200,
    iceTemperatureCelsius: -10,
    control: { kind: "iceMassGrams", minimum: 50, maximum: 500, step: 1 },
    goal: { kind: "ice-remaining", targetGrams: 100, toleranceGrams: 10 },
    predictionKind: "iceRemaining",
    hint: "At 0 °C the water's heat pays first to warm the ice to 0 °C, and the rest melts ice: melted mass = (heat from water − heat to warm ice) / L. Ice left = ice added − melted.",
  },
  {
    id: "hot-water-bath",
    title: "The hot water bath",
    difficulty: "Advanced",
    situation:
      "250 g of ice at −20 °C is dropped into 0.40 kg of hot water. How hot must the water start so that everything melts and the final temperature is 15 °C?",
    waterMassKilograms: 0.4,
    waterTemperatureCelsius: 80,
    iceMassGrams: 250,
    iceTemperatureCelsius: -20,
    control: { kind: "waterTemperatureCelsius", minimum: 30, maximum: 95, step: 0.5 },
    goal: { kind: "final-temperature", targetCelsius: 15, toleranceKelvin: 0.5 },
    predictionKind: "finalTemperature",
    hint: "Solve for the water's starting temperature T: m_w c_w (T − 15) = m_i c_ice (20) + m_i L + m_i c_w (15).",
  },
]);
