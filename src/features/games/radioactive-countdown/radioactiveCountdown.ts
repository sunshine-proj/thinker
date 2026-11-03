import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateActivity,
  calculateDecayConstant,
  calculateNucleiInMass,
  calculateRemainingFraction,
  calculateStandardDeviation,
  calculateTimeForFraction,
  createSeededRandom,
  simulateDecay,
} from "../../../physics/nuclear";
import { JULIAN_YEAR } from "../../../physics/core";

export type DecayKind = "time" | "count" | "activity";

export interface DecayRound extends NumericRound { readonly kind: DecayKind }

export interface DecayOutcome extends AttemptOutcome {
  readonly fraction: number | null;
  readonly expected: number | null;
  readonly simulated: number | null;
  readonly activityKilobecquerels: number | null;
}

export const IODINE_HALF_LIFE_DAYS = 8.02;
export const FRACTION_TARGET = 0.125;
export const FRACTION_TOLERANCE = 0.01;
export const SAMPLE_NUCLEI = 1000;
export const SAMPLE_HALF_LIFE_S = 10;
export const SAMPLE_TIME_S = 25;
export const SAMPLE_SEED = 20240611;
export const AMERICIUM_HALF_LIFE_YEARS = 432.2;
export const AMERICIUM_MOLAR_MASS = 0.241;
export const SOURCE_MASS_KG = 1e-9;
export const ACTIVITY_TOLERANCE = 0.05;

export const DECAY_META: RoundGameMeta = {
  id: "radioactive-countdown",
  title: "Radioactive Countdown",
  eyebrow: "MODERN PHYSICS · RADIOACTIVITY",
  modelTag: "EXPONENTIAL DECAY",
  introduction: "No one can say when a single nucleus will decay, yet a large sample decays with clockwork regularity. Time a medical isotope's decay, estimate how many nuclei a small sample has left, and find the activity of a smoke-detector source.",
  instructions: "Predict, then answer. Each nucleus has the same chance of decaying in every second, so the number remaining halves in every half-life.",
  formula: "N = N₀ 2^(−t/T½)  ·  λ = ln 2 / T½  ·  A = λN  ·  σ = √(Np(1−p))",
  formulaCaption: "N is the number of nuclei left after time t, T½ the half-life, λ the decay constant, A the activity in becquerels (decays per second) and σ the random scatter in the count for survival probability p.",
  explanation: "Decay is random but its odds are fixed: each nucleus survives a time t with probability 2^(−t/T½), regardless of how long it has already existed. With billions of nuclei the fraction left follows the smooth exponential curve almost exactly; with only a thousand the count scatters around it by about √(Np(1−p)), and with a handful the curve is lost in the noise. The activity A = λN is proportional to the number of nuclei, so it too halves every half-life. A long half-life means a slow decay rate per nucleus, so a source with a half-life of centuries has a low activity per atom, yet even a microgram holds so many atoms that it emits over a hundred thousand particles per second.",
  assumptions: "A single isotope whose decay products are not radioactive or ignored, a sample large enough that the smooth law applies (except in the counting round, which simulates each nucleus individually with a fixed random seed so it is repeatable), and constants from standard tables.",
  learningObjectives: ["Use the half-life to find the remaining fraction and elapsed time.", "Explain the statistical scatter in small samples.", "Calculate activity from the number of nuclei and the half-life."],
  objective: { title: "Master the countdown", description: "Complete each decay problem.", unit: "problems" },
  controlsHeading: "Your answer",
  submitLabel: "Check the decay",
  solvedLabel: "Countdown complete!",
  nextLabel: "Next problem",
};

export const DECAY_ROUNDS: readonly DecayRound[] = Object.freeze([
  {
    id: "wait-for-the-decay", title: "Wait for the decay", difficulty: "Beginner", kind: "time",
    situation: `Iodine-131 (half-life ${IODINE_HALF_LIFE_DAYS} days) is stored until only 12.5 % of it remains (± 1 percentage point). How long must it be kept?`,
    controls: [fixed("halfLife", "Half-life", "days", IODINE_HALF_LIFE_DAYS), slider("days", "Storage time", "days", 0, 60, 0.1, 8)],
    hint: "12.5 % is 1/8 = (1/2)³: three half-lives.",
  },
  {
    id: "count-the-survivors", title: "Count the survivors", difficulty: "Intermediate", kind: "count",
    situation: `A sample starts with ${SAMPLE_NUCLEI} nuclei of half-life ${SAMPLE_HALF_LIFE_S} s. Estimate how many remain after ${SAMPLE_TIME_S} s. Because decay is random, anything within two standard deviations of the expected number counts.`,
    controls: [fixed("halfLife", "Half-life", "s", SAMPLE_HALF_LIFE_S), slider("estimate", "Nuclei remaining", "", 0, SAMPLE_NUCLEI, 1, 500)],
    hint: "The expected number is N₀ 2^(−t/T½), with t/T½ = 2.5 half-lives.",
  },
  {
    id: "the-smoke-detector", title: "The smoke detector", difficulty: "Advanced", kind: "activity",
    situation: `A smoke detector holds 1 µg of americium-241 (half-life ${AMERICIUM_HALF_LIFE_YEARS} years, molar mass 241 g/mol). What is its activity in kilobecquerels (± ${ACTIVITY_TOLERANCE * 100} %)?`,
    controls: [fixed("halfLife", "Half-life", "years", AMERICIUM_HALF_LIFE_YEARS), slider("activity", "Activity", "kBq", 1, 500, 1, 100)],
    hint: "Count the atoms N = (m/M) N_A, find λ = ln 2 / T½ in 1/s, then A = λN.",
  },
]);

const americiumActivity = () => {
  const nuclei = calculateNucleiInMass(SOURCE_MASS_KG, AMERICIUM_MOLAR_MASS);
  return calculateActivity(calculateDecayConstant(AMERICIUM_HALF_LIFE_YEARS * JULIAN_YEAR), nuclei);
};

export function runDecay(round: DecayRound, v: NumericControl): DecayOutcome {
  if (round.kind === "time") {
    const days = v.days as number;
    const fraction = calculateRemainingFraction(IODINE_HALF_LIFE_DAYS, days);
    const error = Math.abs(fraction - FRACTION_TARGET);
    const success = error <= FRACTION_TOLERANCE;
    return {
      fraction, expected: null, simulated: null, activityKilobecquerels: null, success, accuracyFraction: success ? 1 - error / FRACTION_TOLERANCE : 0,
      predictionActual: calculateTimeForFraction(IODINE_HALF_LIFE_DAYS, FRACTION_TARGET),
      feedback: success ? `After ${days.toFixed(1)} days (${(days / IODINE_HALF_LIFE_DAYS).toFixed(2)} half-lives) ${(fraction * 100).toFixed(1)} % remains.`
        : `After ${days.toFixed(1)} days ${(fraction * 100).toFixed(1)} % remains, ${fraction > FRACTION_TARGET ? "too much: wait longer" : "less than needed"}.`,
    };
  }
  if (round.kind === "count") {
    const p = calculateRemainingFraction(SAMPLE_HALF_LIFE_S, SAMPLE_TIME_S);
    const expected = SAMPLE_NUCLEI * p;
    const sigma = calculateStandardDeviation(SAMPLE_NUCLEI, p);
    const simulated = simulateDecay(SAMPLE_NUCLEI, SAMPLE_HALF_LIFE_S, SAMPLE_TIME_S, createSeededRandom(SAMPLE_SEED));
    const estimate = v.estimate as number;
    const error = Math.abs(estimate - expected);
    const success = error <= 2 * sigma;
    return {
      fraction: p, expected, simulated, activityKilobecquerels: null, success, accuracyFraction: success ? 1 - error / (2 * sigma) : 0, predictionActual: expected,
      feedback: success ? `Expected ${expected.toFixed(1)} ± ${sigma.toFixed(1)}; the simulated sample actually kept ${simulated} of ${SAMPLE_NUCLEI}. Your ${estimate} is within two standard deviations.`
        : `Your ${estimate} is ${error.toFixed(0)} away from the expected ${expected.toFixed(1)}, more than 2σ = ${(2 * sigma).toFixed(1)}. The simulated sample kept ${simulated}.`,
    };
  }
  const truth = americiumActivity() / 1000;
  const activity = v.activity as number;
  const error = Math.abs(activity - truth) / truth;
  const success = error <= ACTIVITY_TOLERANCE;
  return {
    fraction: null, expected: null, simulated: null, activityKilobecquerels: truth, success, accuracyFraction: success ? 1 - error / ACTIVITY_TOLERANCE : 0, predictionActual: truth,
    feedback: success ? `1 µg holds ${calculateNucleiInMass(SOURCE_MASS_KG, AMERICIUM_MOLAR_MASS).toExponential(2)} atoms and λ = ${calculateDecayConstant(AMERICIUM_HALF_LIFE_YEARS * JULIAN_YEAR).toExponential(2)} /s: A = ${truth.toFixed(0)} kBq.`
      : `${activity} kBq is ${activity > truth ? "too high" : "too low"}: A = λN = ${truth.toFixed(0)} kBq.`,
  };
}

export const radioactiveCountdown = defineNumericGame<DecayRound, DecayOutcome>({
  meta: DECAY_META,
  rounds: DECAY_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "time" ? { label: "Your prediction of the storage time", unit: "days", placeholder: "e.g. 24", step: 0.1 }
    : round.kind === "count" ? { label: "Your prediction of the number remaining", unit: "nuclei", placeholder: "e.g. 177", step: 1 }
    : { label: "Your prediction of the activity", unit: "kBq", placeholder: "e.g. 127", step: 1 },
  evaluate: (round, values) => runDecay(round, values),
});
