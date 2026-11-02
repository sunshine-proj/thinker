import type { GameDifficulty } from "../../../types/progress";

export type CircuitTarget =
  | { readonly kind: "current"; readonly amperes: number }
  | { readonly kind: "resistance"; readonly ohms: number };

export interface CircuitRound {
  readonly id: string;
  readonly title: string;
  readonly difficulty: GameDifficulty;
  readonly situation: string;
  readonly sourceVoltageVolts: number;
  /** Each resistor in the box can be used at most once. */
  readonly inventoryOhms: readonly number[];
  readonly target: CircuitTarget;
  /** Maximum power each resistor can dissipate before it overheats, in watts. */
  readonly powerRatingWatts: number;
  /** Accepted relative error of the equivalent resistance. */
  readonly toleranceFraction: number;
  readonly hint: string;
}

export const MAX_STAGES = 4;
export const MAX_RESISTORS_PER_STAGE = 4;

export const CIRCUIT_BUILDER_GAME = Object.freeze({
  id: "circuit-builder",
  title: "Circuit Builder",
  category: "Electricity & Magnetism",
  introduction:
    "Combine resistors in series and in parallel to build a circuit that draws exactly the current you need, without overheating anything.",
  learningObjectives: [
    "Apply Ohm's law, V = I R, to find the current in a circuit.",
    "Combine resistors in series (add) and in parallel (add reciprocals).",
    "Use P = V I to check that no resistor exceeds its power rating.",
  ],
  instructions:
    "Pick resistors from the box and place them in stages. Resistors in the same stage are in parallel; stages are connected one after another in series. Predict the current, then close the switch.",
  formula: "V = I R  ·  P = V I",
  explanation:
    "A battery pushes the same current through every stage of a series chain, so series resistances add: R = R₁ + R₂. Parallel resistors share one voltage and split the current between them, so adding a branch always lowers the combined resistance: 1/R = 1/R₁ + 1/R₂. Every resistor turns electrical power P = V I = V² / R into heat, so a circuit must also keep each part below its power rating: spreading the voltage over several stages lets small resistors share the load.",
  assumptions:
    "This game models steady DC circuits with an ideal battery (no internal resistance), ideal wires and ohmic resistors whose values do not change as they heat. Capacitors, inductors and transient behaviour are not modelled.",
});

export const CIRCUIT_BUILDER_ROUNDS: readonly CircuitRound[] = Object.freeze([
  {
    id: "single-loop",
    title: "A single loop",
    difficulty: "Beginner",
    situation:
      "A 9 V battery must drive exactly 30 mA through your circuit. Which resistors give the right total resistance?",
    sourceVoltageVolts: 9,
    inventoryOhms: [100, 100, 100, 200, 470],
    target: { kind: "current", amperes: 0.03 },
    powerRatingWatts: 0.25,
    toleranceFraction: 0.02,
    hint: "Find the resistance first: R = V / I. Then see which resistors add up to it in series.",
  },
  {
    id: "parallel-branch",
    title: "A parallel branch",
    difficulty: "Intermediate",
    situation:
      "A 12 V supply needs a network whose equivalent resistance is 75 Ω. No single resistor in the box has that value.",
    sourceVoltageVolts: 12,
    inventoryOhms: [100, 200, 300, 600],
    target: { kind: "resistance", ohms: 75 },
    powerRatingWatts: 2,
    toleranceFraction: 0.01,
    hint: "Parallel resistors give a total below the smallest one. Try two resistors in the same stage and compare 1/R values.",
  },
  {
    id: "share-the-load",
    title: "Share the load",
    difficulty: "Advanced",
    situation:
      "A 12 V supply must see 100 Ω, but every resistor is rated for only 0.5 W. Simply connecting 100 Ω across the supply would dissipate 1.44 W and burn out.",
    sourceVoltageVolts: 12,
    inventoryOhms: [100, 100, 100, 100, 200, 200, 300],
    target: { kind: "resistance", ohms: 100 },
    powerRatingWatts: 0.5,
    toleranceFraction: 0.01,
    hint: "Split the 12 V across two stages in series so each part sees less voltage. Each stage can be two resistors in parallel.",
  },
]);
