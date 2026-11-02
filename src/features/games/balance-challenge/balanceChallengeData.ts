import type { PointLoad } from "../../../physics/mechanics";
import type { GameDifficulty } from "../../../types/progress";

/** What the player adjusts: where a fixed mass sits, or how heavy a mass at a fixed spot is. */
export type BalanceControl =
  | {
      readonly kind: "position";
      readonly massKilograms: number;
      readonly minimumMeters: number;
      readonly maximumMeters: number;
      readonly stepMeters: number;
    }
  | {
      readonly kind: "mass";
      readonly positionMeters: number;
      readonly minimumKilograms: number;
      readonly maximumKilograms: number;
      readonly stepKilograms: number;
    };

export interface BalanceRound {
  readonly id: string;
  readonly title: string;
  readonly difficulty: GameDifficulty;
  readonly situation: string;
  /** Beam extent in meters from the pivot (negative is left). */
  readonly beamLeftMeters: number;
  readonly beamRightMeters: number;
  /** Beam mass in kilograms; 0 means the beam is treated as weightless. */
  readonly beamMassKilograms: number;
  /** Fixed loads on the beam, in meters from the pivot. */
  readonly fixedLoads: readonly PointLoad[];
  readonly control: BalanceControl;
  /** Accepted |net torque| as a fraction of the sum of the fixed torques' magnitudes. */
  readonly toleranceFraction: number;
  readonly hint: string;
}

export const BALANCE_CHALLENGE_GAME = Object.freeze({
  id: "balance-challenge",
  title: "Balance Challenge",
  category: "Mechanics",
  introduction:
    "Predict where a mass must go, or how heavy it must be, so that a lever balances on its pivot.",
  learningObjectives: [
    "Calculate the torque of a weight about a pivot as τ = m g d.",
    "Apply the condition for static equilibrium: the clockwise and counter-clockwise torques must cancel.",
    "Treat a heavy beam as a weight acting at its centre.",
  ],
  instructions:
    "Calculate where the balancing mass belongs and enter your prediction. Then set the control, check the preview of the mass on the beam, and release the lever to see whether it balances.",
  formula: "Στ = 0  →  Σ m g d (clockwise) = Σ m g d (counter-clockwise)",
  explanation:
    "A weight turns a lever about the pivot with torque τ = m g d, where d is its distance from the pivot. The lever stays level only when the clockwise torques equal the counter-clockwise torques. Because g multiplies every term, it cancels: balance depends on the products mass × distance, which is why a light mass far from the pivot can balance a heavy mass close to it. A uniform beam acts as if all of its weight sits at its centre.",
  assumptions:
    "This game models statics only: a rigid horizontal beam on one pivot with weights acting at points, and uniform Earth gravity. The tilt shown on release is an indicator of the direction and relative size of the net torque, not a simulation of the lever's motion; friction and the shortening of lever arms at large tilt are ignored.",
});

export const BALANCE_CHALLENGE_ROUNDS: readonly BalanceRound[] = Object.freeze([
  {
    id: "classic-seesaw",
    title: "The classic seesaw",
    difficulty: "Beginner",
    situation:
      "A 4 kg block sits 2 m left of the pivot on a weightless beam. Where must a 2 kg block go on the right?",
    beamLeftMeters: -6,
    beamRightMeters: 6,
    beamMassKilograms: 0,
    fixedLoads: [{ massKilograms: 4, positionMeters: -2 }],
    control: {
      kind: "position",
      massKilograms: 2,
      minimumMeters: 0.5,
      maximumMeters: 6,
      stepMeters: 0.1,
    },
    toleranceFraction: 0.04,
    hint: "Multiply mass by distance on the left. The right side needs the same product.",
  },
  {
    id: "three-weights",
    title: "Three weights",
    difficulty: "Intermediate",
    situation:
      "Blocks of 3 kg and 2 kg sit 3 m and 1 m left of the pivot, and a 1 kg block sits 2 m right. How heavy must a block at 3 m on the right be?",
    beamLeftMeters: -5,
    beamRightMeters: 5,
    beamMassKilograms: 0,
    fixedLoads: [
      { massKilograms: 3, positionMeters: -3 },
      { massKilograms: 2, positionMeters: -1 },
      { massKilograms: 1, positionMeters: 2 },
    ],
    control: {
      kind: "mass",
      positionMeters: 3,
      minimumKilograms: 0.5,
      maximumKilograms: 8,
      stepKilograms: 0.1,
    },
    toleranceFraction: 0.03,
    hint: "Add up m × d on each side separately. The unknown mass times 3 m must cover the difference.",
  },
  {
    id: "heavy-beam",
    title: "The heavy beam",
    difficulty: "Advanced",
    situation:
      "The pivot sits 1 m left of the centre of a uniform 4 kg beam that spans −4 m to +6 m. A 5 kg block sits 3 m left of the pivot. Where must a 2 kg block go on the right?",
    beamLeftMeters: -4,
    beamRightMeters: 6,
    beamMassKilograms: 4,
    fixedLoads: [{ massKilograms: 5, positionMeters: -3 }],
    control: {
      kind: "position",
      massKilograms: 2,
      minimumMeters: 0.5,
      maximumMeters: 6,
      stepMeters: 0.1,
    },
    toleranceFraction: 0.02,
    hint: "The beam's own weight acts at its centre, which is 1 m to the right of the pivot, so it adds clockwise torque.",
  },
]);
