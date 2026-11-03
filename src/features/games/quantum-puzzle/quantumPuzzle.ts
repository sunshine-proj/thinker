import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateInterferometerProbability,
  calculatePolarizerChainTransmission,
  calculateProbabilityZero,
} from "../../../physics/quantum";

export type PuzzleKind = "superposition" | "interferometer" | "polarizers";

export interface PuzzleRound extends NumericRound { readonly kind: PuzzleKind }

export interface PuzzleOutcome extends AttemptOutcome {
  /** Probability of the first outcome (state 0, port 0, or photon passes). */
  readonly probability: number;
  readonly labels: readonly [string, string];
}

export const SUPERPOSITION_TARGET = 0.25;
export const SUPERPOSITION_TOLERANCE = 0.01;
export const INTERFEROMETER_TARGET = 0.75;
export const INTERFEROMETER_TOLERANCE = 0.02;
export const POLARIZER_TARGET = 0.1875;
export const POLARIZER_TOLERANCE = 0.01;

export const PUZZLE_META: RoundGameMeta = {
  id: "quantum-puzzle",
  title: "Quantum Puzzle",
  eyebrow: "MODERN PHYSICS · SUPERPOSITION",
  modelTag: "TWO-STATE QUANTUM SYSTEMS",
  introduction: "Solve three puzzles with a system that can be in two states at once. Prepare a superposition with the right odds, steer light through an interferometer, and place a filter between two polarizers that seem to block everything.",
  instructions: "Predict, then tune. Quantum outcomes are random, but the probabilities are exact: they are the squares of amplitudes, and amplitudes can interfere.",
  formula: "P(0) = |α|² = cos²(θ/2)  ·  P(port 0) = cos²(φ/2)  ·  I = I₀ cos²θ₁ cos²(θ₂ − θ₁)",
  formulaCaption: "α is the amplitude of state 0 and θ sets the superposition angle. In the interferometer φ is the phase difference between the two paths. For polarizers θ is the angle between successive transmission axes (Malus's law).",
  explanation: "A quantum state is described by amplitudes, not probabilities. A measurement yields each outcome with probability equal to its amplitude squared, which is why tilting the state by an angle θ changes the odds as cos²(θ/2). When the two routes through an interferometer are recombined, their amplitudes add before squaring, so a small phase shift can switch an output between certain and impossible. Likewise, two crossed polarizers block all light, but a third inserted between them at 45° lets a quarter through: measuring the polarization changes it, so blocking is not simply subtracting.",
  assumptions: "Ideal two-state systems with no noise, loss or decoherence, perfect beam splitters, polarizers and detectors. Probabilities are exact; a real experiment would show them as frequencies from many repeated trials.",
  learningObjectives: ["Convert between amplitudes and measurement probabilities.", "Use interference to control the outcome probability.", "Apply Malus's law to a chain of polarizers."],
  objective: { title: "Solve every puzzle", description: "Meet each probability target.", unit: "puzzles" },
  controlsHeading: "Set up the experiment",
  submitLabel: "Measure",
  solvedLabel: "Puzzle solved!",
  nextLabel: "Next puzzle",
};

export const PUZZLE_ROUNDS: readonly PuzzleRound[] = Object.freeze([
  {
    id: "one-in-four", title: "One in four", difficulty: "Beginner", kind: "superposition",
    situation: `Prepare a qubit in the state cos(θ/2)|0⟩ + sin(θ/2)|1⟩ so that a measurement gives 0 with probability ${SUPERPOSITION_TARGET} (± ${SUPERPOSITION_TOLERANCE}). Choose θ.`,
    controls: [slider("theta", "Superposition angle θ", "°", 0, 180, 1, 90)],
    hint: "P(0) = cos²(θ/2) = 0.25, so cos(θ/2) = 0.5 and θ/2 = 60°.",
  },
  {
    id: "the-interferometer", title: "The interferometer", difficulty: "Intermediate", kind: "interferometer",
    situation: `A photon passes a beam splitter, a phase shifter and a second beam splitter. Choose the phase shift φ so that it leaves by port 0 with probability ${INTERFEROMETER_TARGET} (± ${INTERFEROMETER_TOLERANCE}).`,
    controls: [slider("phase", "Phase shift φ", "°", 0, 360, 1, 0)],
    hint: "The paths interfere: P(port 0) = cos²(φ/2). For 0.75, cos(φ/2) = √0.75.",
  },
  {
    id: "the-third-polarizer", title: "The third polarizer", difficulty: "Advanced", kind: "polarizers",
    situation: `Vertically polarized light meets a horizontal polarizer (90° away), which blocks everything. Insert a polarizer between them at angle θ from vertical so that ${POLARIZER_TARGET * 100} % (± 1 %) of the light gets through.`,
    controls: [fixed("source", "Light polarization", "°", 0), fixed("last", "Final polarizer", "°", 90), slider("middle", "Middle polarizer angle", "°", 0, 90, 1, 10)],
    hint: "Transmission = cos²θ · cos²(90° − θ) = sin²(2θ)/4. Set it to 0.1875.",
  },
]);

export function runPuzzle(round: PuzzleRound, v: NumericControl): PuzzleOutcome {
  const rad = (d: number) => (d * Math.PI) / 180;
  let probability: number;
  let target: number;
  let tolerance: number;
  let labels: readonly [string, string];
  let predictionActual: number;
  if (round.kind === "superposition") {
    probability = calculateProbabilityZero(rad(v.theta as number));
    target = SUPERPOSITION_TARGET; tolerance = SUPERPOSITION_TOLERANCE; labels = ["P(0)", "P(1)"]; predictionActual = 120;
  } else if (round.kind === "interferometer") {
    probability = calculateInterferometerProbability(rad(v.phase as number));
    target = INTERFEROMETER_TARGET; tolerance = INTERFEROMETER_TOLERANCE; labels = ["Port 0", "Port 1"]; predictionActual = 60;
  } else {
    probability = calculatePolarizerChainTransmission(rad(v.source as number), [rad(v.middle as number), rad(v.last as number)]);
    target = POLARIZER_TARGET; tolerance = POLARIZER_TOLERANCE; labels = ["Transmitted", "Blocked"]; predictionActual = 30;
  }
  const error = Math.abs(probability - target);
  const success = error <= tolerance;
  const setting = round.kind === "superposition" ? `θ = ${v.theta}°` : round.kind === "interferometer" ? `φ = ${v.phase}°` : `a polarizer at ${v.middle}°`;
  return {
    probability, labels, success, accuracyFraction: success ? 1 - error / tolerance : 0, predictionActual,
    feedback: success ? `With ${setting} the probability is ${probability.toFixed(4)}: ${(probability * 100).toFixed(1)} % ${labels[0].toLowerCase()}.`
      : `With ${setting} the probability is ${probability.toFixed(3)}, ${probability > target ? "above" : "below"} the target ${target}.`,
  };
}

export const quantumPuzzle = defineNumericGame<PuzzleRound, PuzzleOutcome>({
  meta: PUZZLE_META,
  rounds: PUZZLE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "superposition" ? { label: "Your prediction of the angle θ needed", unit: "°", placeholder: "e.g. 120", step: 1 }
    : round.kind === "interferometer" ? { label: "Your prediction of the phase needed", unit: "°", placeholder: "e.g. 60", step: 1 }
    : { label: "Your prediction of the middle polarizer angle", unit: "°", placeholder: "e.g. 30", step: 1 },
  evaluate: (round, values) => runPuzzle(round, values),
});
