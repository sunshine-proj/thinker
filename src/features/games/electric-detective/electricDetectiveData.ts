import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";

export interface HiddenCharge {
  /** Position in centimeters within the 100 cm × 100 cm arena. */
  readonly xCm: number;
  readonly yCm: number;
  readonly chargeNanocoulombs: number;
}

export interface DetectiveRound extends RoundBase {
  readonly hidden: HiddenCharge;
  /** When true the charge's sign and size are given and only its position is unknown. */
  readonly knownCharge: boolean;
  /** When true the position is given and only the charge is unknown. */
  readonly knownPosition: boolean;
  readonly maxProbes: number;
  readonly positionToleranceCm: number;
  readonly chargeToleranceNanocoulombs: number;
}

export interface Point {
  readonly xCm: number;
  readonly yCm: number;
}

export interface DetectiveControl {
  /** Where the test charge has been placed so far. */
  readonly probes: readonly Point[];
  /** Where the next probe will go. */
  readonly nextProbe: Point;
  /** The learner's hypothesis. */
  readonly guess: Point & { readonly chargeNanocoulombs: number };
}

/** The test charge placed at each probe point. */
export const TEST_CHARGE_NANOCOULOMBS = 1;
export const ARENA_SIZE_CM = 100;
/** Probes closer than this to the hidden charge are refused (the field becomes extreme). */
export const MINIMUM_PROBE_DISTANCE_CM = 5;

export const ELECTRIC_DETECTIVE_META: RoundGameMeta = {
  id: "electric-detective",
  title: "Electric Detective",
  eyebrow: "ELECTRICITY & MAGNETISM · INVESTIGATION",
  modelTag: "COULOMB'S LAW · POINT CHARGES",
  introduction:
    "A hidden charge sits somewhere in the arena. Place a small test charge, read the force on it, and work out where the hidden charge is and what it carries.",
  instructions:
    "Place a +1 nC test charge with the probe controls and take a reading: you get the force it feels. Use the direction and size of the force to form a hypothesis, set your guess, and submit it. Readings are limited, so choose probe points wisely.",
  formula: "F = k q Q / r²  ·  E = F / q  ·  k = 8.99 × 10⁹ N·m²/C²",
  formulaCaption:
    "F is the force on the test charge q, Q is the hidden charge, r the distance between them, and E the electric field. Like charges repel and opposite charges attract.",
  explanation:
    "A point charge pushes a positive test charge directly away from it if it is positive, and pulls it directly toward it if it is negative. So the direction of the force points along the line to the hidden charge, and Coulomb's law F = k q Q / r² turns the size of the force into a distance (or, if the distance is known, into the charge). Two readings give two lines that cross at the charge. Checking whether your hypothesis reproduces the measured force at every probe is exactly how a scientist tests a model.",
  assumptions:
    "The charges are static point charges in a vacuum, in a flat arena. There are no other charges, conductors or magnetic effects, and the field is not measured within 5 cm of the hidden charge, where it grows very large.",
  learningObjectives: [
    "Apply Coulomb's law F = k q Q / r² to find distances and charges.",
    "Use the direction of the force to tell attraction from repulsion, and so the sign of a charge.",
    "Test a hypothesis against measurements, and combine two readings to locate a source.",
  ],
  objective: {
    title: "Solve every case",
    description: "Identify each hidden charge from its force readings.",
    unit: "cases",
  },
  controlsHeading: "Investigate",
  submitLabel: "Submit your answer",
  solvedLabel: "Case solved!",
  nextLabel: "Next case",
};

export const DETECTIVE_ROUNDS: readonly DetectiveRound[] = Object.freeze([
  {
    id: "where-is-it",
    title: "Where is it?",
    difficulty: "Beginner",
    situation:
      "A +4 nC charge is hidden somewhere in the arena. Find its position. One reading is enough if you use both the direction and the size of the force.",
    hidden: { xCm: 35, yCm: 70, chargeNanocoulombs: 4 },
    knownCharge: true,
    knownPosition: false,
    maxProbes: 3,
    positionToleranceCm: 3,
    chargeToleranceNanocoulombs: 0.5,
    hint: "A positive source pushes the test charge straight away from itself, so step back along the line opposite to the force. Then use F = k q Q / r² to find how far.",
  },
  {
    id: "what-is-it",
    title: "What is it?",
    difficulty: "Intermediate",
    situation:
      "A charge is fixed at (60, 40) cm, marked on the arena. Is it positive or negative, and how large is it?",
    hidden: { xCm: 60, yCm: 40, chargeNanocoulombs: -6 },
    knownCharge: false,
    knownPosition: true,
    maxProbes: 3,
    positionToleranceCm: 3,
    chargeToleranceNanocoulombs: 0.5,
    hint: "If the force points toward the charge it is negative. With the distance known, rearrange Coulomb's law to Q = F r² / (k q).",
  },
  {
    id: "mystery-charge",
    title: "The mystery charge",
    difficulty: "Advanced",
    situation:
      "Nothing is known about this charge: not its position, its sign or its size. Four readings are available.",
    hidden: { xCm: 25, yCm: 30, chargeNanocoulombs: -3 },
    knownCharge: false,
    knownPosition: false,
    maxProbes: 4,
    positionToleranceCm: 4,
    chargeToleranceNanocoulombs: 0.6,
    hint: "Each force direction gives a line toward (or away from) the source. Two readings from different places give two lines that cross at the charge. Then use the distance and the force size for Q.",
  },
]);
