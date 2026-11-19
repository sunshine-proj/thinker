import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateAllOnOneSideProbability, calculateEntropyChangeInK, countMicrostates } from "../../../physics/thermodynamics";

export type EntropyKind = "unlikely" | "likely" | "entropy";
export interface EntropyRound extends NumericRound { readonly kind: EntropyKind }
export interface EntropyOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const UNLIKELY_LIMIT = 0.01;
export const LIKELY_TOTAL = 10;
export const ENTROPY_TOTAL = 20;
export const ENTROPY_TOLERANCE = 0.2;

/** Fewest particles for which finding them all on one chosen side is less likely than the limit. */
export function fewestParticlesBelow(limit: number): number {
  let n = 1;
  while (calculateAllOnOneSideProbability(n) >= limit) {
    n += 1;
  }
  return n;
}

export const ENTROPY_META: RoundGameMeta = {
  id: "entropy-shuffle",
  title: "Entropy Shuffle",
  eyebrow: "THERMODYNAMICS · ENTROPY",
  modelTag: "COUNTING MICROSTATES",
  introduction: "Why does gas spread out and never crowd back into a corner? Count the ways particles can share a box. Find how few particles it takes before 'all on one side' becomes rare, which split is most likely, and how much the entropy rises when the gas spreads.",
  instructions: "Predict, then set the number of particles, the split or the entropy change. Every arrangement of particles (a microstate) is equally likely; a split that can be made in more ways is more probable.",
  formula: "Ω = C(N, n)  ·  P(all on one side) = (½)ᴺ  ·  S = k ln Ω",
  formulaCaption: "N is the number of particles, n the number on the left, Ω the number of microstates with that split, k = 1.381 × 10⁻²³ J/K Boltzmann's constant and S the entropy.",
  explanation: "Each particle is equally likely to be in the left or right half, so with N particles there are 2ᴺ equally likely arrangements. Only one of them has every particle on the left, but C(N, N/2) of them have an even split, and that number explodes as N grows: for 20 particles it is 184 756, and for the 10²³ molecules in a breath of air it is so large that a noticeably uneven split never happens in the lifetime of the universe. Boltzmann's entropy S = k ln Ω counts those ways. 'Entropy increases' is therefore a statement about probability: systems drift to the macrostates that can be made in the most ways. This statistical reading of the second law is the standard interpretation in physics.",
  assumptions: "Ideal, non-interacting, distinguishable particles; each microstate equally likely; the box split into two equal halves. Real gases also have energy and velocity microstates, which only make the numbers larger.",
  learningObjectives: ["Count microstates with the binomial coefficient.", "Explain why the even split dominates for large N.", "Calculate an entropy change with S = k ln Ω."],
  objective: { title: "Shuffle the particles", description: "Solve each counting problem.", unit: "puzzles" },
  controlsHeading: "Your answer",
  submitLabel: "Shuffle",
  solvedLabel: "Entropy explained!",
  nextLabel: "Next puzzle",
};

export const ENTROPY_ROUNDS: readonly EntropyRound[] = Object.freeze([
  {
    id: "rarely-all-left", title: "Rarely all on the left", difficulty: "Beginner", kind: "unlikely",
    situation: `Particles move randomly between the two halves of a box. What is the fewest number of particles for which finding them all in the left half has a probability below ${UNLIKELY_LIMIT * 100} %?`,
    controls: [slider("particles", "Number of particles", "", 1, 20, 1, 3)],
    hint: "Each particle halves the chance: (½)ᴺ < 0.01.",
  },
  {
    id: "most-likely-split", title: "The most likely split", difficulty: "Intermediate", kind: "likely",
    situation: `${LIKELY_TOTAL} particles share the box. How many on the left gives the most microstates (the most likely split)?`,
    controls: [fixed("particles", "Particles", "", LIKELY_TOTAL), slider("left", "Particles on the left", "", 0, LIKELY_TOTAL, 1, 2)],
    hint: "Ω = C(10, n) = 10! / (n! (10 − n)!). Try a few values.",
  },
  {
    id: "entropy-rises", title: "Entropy rises", difficulty: "Advanced", kind: "entropy",
    situation: `${ENTROPY_TOTAL} particles start all on the left (Ω = 1) and spread to an even 10–10 split. By how much does the entropy rise, in units of k? (± ${ENTROPY_TOLERANCE} k)`,
    controls: [fixed("particles", "Particles", "", ENTROPY_TOTAL), slider("deltaS", "Entropy rise ΔS", "k", 0, 20, 0.05, 5)],
    hint: "ΔS = k ln(Ω₂/Ω₁) with Ω₂ = C(20, 10).",
  },
]);

export function runEntropy(round: EntropyRound, v: NumericControl): EntropyOutcome {
  if (round.kind === "unlikely") {
    const n = v.particles as number;
    const probability = calculateAllOnOneSideProbability(n);
    const truth = fewestParticlesBelow(UNLIKELY_LIMIT);
    const success = n === truth;
    return {
      headline: probability, unit: "", success, accuracyFraction: success ? 1 : 0, predictionActual: truth,
      feedback: success
        ? `With ${n} particles the chance is (½)^${n} = 1 in ${2 ** n}, just under 1 %. With ${n - 1} it was 1 in ${2 ** (n - 1)}.`
        : probability >= UNLIKELY_LIMIT ? `With ${n} particles the chance is 1 in ${2 ** n}, still ${(probability * 100).toFixed(1)} %.` : `${n} particles works, but fewer would do: the chance is already 1 in ${2 ** n}.`,
    };
  }
  if (round.kind === "likely") {
    const n = v.left as number;
    const ways = countMicrostates(LIKELY_TOTAL, n);
    const best = countMicrostates(LIKELY_TOTAL, LIKELY_TOTAL / 2);
    const success = ways === best;
    return {
      headline: ways, unit: "microstates", success, accuracyFraction: success ? 1 : 0, predictionActual: LIKELY_TOTAL / 2,
      feedback: success
        ? `${n}–${LIKELY_TOTAL - n} can be made in ${ways} ways out of ${2 ** LIKELY_TOTAL}: ${((ways / 2 ** LIKELY_TOTAL) * 100).toFixed(1)} %, more than any other split.`
        : `${n}–${LIKELY_TOTAL - n} can be made in only ${ways} ways; the most likely split has ${best}.`,
    };
  }
  const guess = v.deltaS as number;
  const truth = calculateEntropyChangeInK(ENTROPY_TOTAL, ENTROPY_TOTAL, ENTROPY_TOTAL / 2);
  const error = Math.abs(guess - truth);
  const success = error <= ENTROPY_TOLERANCE;
  return {
    headline: truth, unit: "k", success, accuracyFraction: success ? 1 - error / ENTROPY_TOLERANCE : 0, predictionActual: truth,
    feedback: success
      ? `ΔS = k ln ${countMicrostates(ENTROPY_TOTAL, 10)} = ${truth.toFixed(2)} k. For a mole of gas the same idea gives ΔS = N k ln 2 ≈ 5.8 J/K when it doubles its volume.`
      : `${guess.toFixed(2)} k is ${guess > truth ? "too much" : "too little"}: ln C(20, 10) = ${truth.toFixed(2)}.`,
  };
}

export const entropyShuffle = defineNumericGame<EntropyRound, EntropyOutcome>({
  meta: ENTROPY_META,
  rounds: ENTROPY_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "unlikely" ? { label: "Your prediction of the number of particles", unit: "", placeholder: "e.g. 5", step: 1 }
    : round.kind === "likely" ? { label: "Your prediction of the number on the left", unit: "", placeholder: "e.g. 3", step: 1 }
    : { label: "Your prediction of the entropy rise", unit: "k", placeholder: "e.g. 10", step: 0.05 },
  evaluate: (round, values) => runEntropy(round, values),
});
