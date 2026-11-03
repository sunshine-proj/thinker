import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateDaughterPeakTime,
  calculateHalfLifeFromActivities,
  calculateMixedActivityFraction,
  calculateTimeForMixedActivity,
  type ActivityComponent,
} from "../../../physics/nuclear";

export type HalfLifeKind = "chain" | "readings" | "mixture";

export interface HalfLifeRound extends NumericRound { readonly kind: HalfLifeKind }

export interface HalfLifeOutcome extends AttemptOutcome {
  readonly truth: number;
  readonly fractionAtGuess: number | null;
}

export const PARENT_HOURS = 66;
export const DAUGHTER_HOURS = 6.01;
export const PEAK_TOLERANCE_HOURS = 1.5;
export const READING_START = 640;
export const READING_END = 40;
export const READING_HOURS = 14;
export const READING_TOLERANCE = 0.1;
export const MIXTURE: readonly ActivityComponent[] = [{ initialShare: 0.5, halfLife: 8.02 }, { initialShare: 0.5, halfLife: 0.25 }];
export const MIXTURE_TARGET = 0.3;
export const MIXTURE_TOLERANCE_DAYS = 0.3;

export const HALF_LIFE_META: RoundGameMeta = {
  id: "half-life-challenge",
  title: "Half-Life Challenge",
  eyebrow: "NUCLEAR PHYSICS · DECAY CHAINS",
  modelTag: "HALF-LIFE & DECAY CHAINS",
  introduction: "Master the clock of radioactive decay: find when a medical generator produces the most technetium, read a half-life from two measurements, and time a mixed sample whose short-lived part fades away first.",
  instructions: "Predict, set your answer and check it. Every radioactive nucleus has a fixed half-life; in a chain the daughter is made by the parent while decaying itself, and in a mixture each component follows its own clock.",
  formula: "N = N₀ 2^(−t/T½)  ·  t_max = ln(λ₂/λ₁)/(λ₂ − λ₁)  ·  T½ = t ln 2 / ln(A₀/A)",
  formulaCaption: "T½ is the half-life and λ = ln 2/T½ the decay constant. In a chain parent → daughter the daughter reaches its maximum at t_max. A is the measured activity at time t.",
  explanation: "A parent decays at a rate proportional to what is left, and each decay creates a daughter nucleus. At first the daughter builds up faster than it decays, then its own decay catches up and the amount falls again, with the peak when the daughter's activity equals the parent's. Hospitals exploit this: a generator of molybdenum-99 (66 h) delivers technetium-99m (6 h), whose amount peaks about 23 hours after it was last washed out. When two isotopes are mixed, the total activity is the sum of two exponentials: the short-lived one dominates at first and disappears, leaving a long, slowly falling tail from the long-lived one.",
  assumptions: "A two-step chain with a stable final product (ignoring Mo-99's small side branches), independent isotopes in the mixture, and exact exponential decay with the half-lives given. Radioactive decay is random, but the samples are large so only the average law matters.",
  learningObjectives: ["Find the time of maximum daughter activity in a chain.", "Determine a half-life from two activity readings.", "Predict the decay of a mixture of isotopes."],
  objective: { title: "Beat the clock", description: "Solve each decay problem.", unit: "problems" },
  controlsHeading: "Your answer",
  submitLabel: "Check the decay",
  solvedLabel: "Decay solved!",
  nextLabel: "Next problem",
};

export const HALF_LIFE_ROUNDS: readonly HalfLifeRound[] = Object.freeze([
  {
    id: "milk-the-generator", title: "Milk the generator", difficulty: "Intermediate", kind: "chain",
    situation: `A generator holds molybdenum-99 (half-life ${PARENT_HOURS} h), which decays into technetium-99m (half-life ${DAUGHTER_HOURS} h). Starting with pure Mo-99, when is the amount of Tc-99m greatest? (± ${PEAK_TOLERANCE_HOURS} h)`,
    controls: [fixed("parent", "Parent half-life", "h", PARENT_HOURS), fixed("daughter", "Daughter half-life", "h", DAUGHTER_HOURS), slider("time", "Time of maximum", "h", 0, 100, 0.5, 10)],
    hint: "t_max = ln(λ₂/λ₁)/(λ₂ − λ₁) with λ = ln 2/T½ for each isotope.",
  },
  {
    id: "read-the-decay", title: "Read the decay", difficulty: "Beginner", kind: "readings",
    situation: `A sample's activity falls from ${READING_START} Bq to ${READING_END} Bq in ${READING_HOURS} hours. What is its half-life? (± ${READING_TOLERANCE} h)`,
    controls: [fixed("start", "Activity at the start", "Bq", READING_START), fixed("end", "Activity after 14 h", "Bq", READING_END), slider("halfLife", "Half-life", "h", 0.5, 10, 0.05, 5)],
    hint: "640 → 40 is a factor of 16 = 2⁴: four half-lives in 14 hours.",
  },
  {
    id: "the-mixed-sample", title: "The mixed sample", difficulty: "Advanced", kind: "mixture",
    situation: `A sample's activity is half iodine-131 (half-life 8.02 days) and half a short-lived isotope (half-life 0.25 days = 6 hours). After how many days has the total activity fallen to ${MIXTURE_TARGET * 100} % of the start? (± ${MIXTURE_TOLERANCE_DAYS} days)`,
    controls: [fixed("long", "Long half-life", "days", 8.02), fixed("short", "Short half-life", "days", 0.25), slider("days", "Time", "days", 0, 20, 0.1, 5)],
    hint: "After a few days only the iodine is left, so 0.5 × 2^(−t/8.02) ≈ 0.3. Check the small remainder of the short-lived part.",
  },
]);

export function runHalfLife(round: HalfLifeRound, v: NumericControl): HalfLifeOutcome {
  if (round.kind === "chain") {
    const truth = calculateDaughterPeakTime(PARENT_HOURS, DAUGHTER_HOURS);
    const guess = v.time as number;
    const error = Math.abs(guess - truth);
    const success = error <= PEAK_TOLERANCE_HOURS;
    return {
      truth, fractionAtGuess: null, success, accuracyFraction: success ? 1 - error / PEAK_TOLERANCE_HOURS : 0, predictionActual: truth,
      feedback: success ? `The Tc-99m peaks at ${truth.toFixed(1)} h, when its decay balances the supply from Mo-99. Your ${guess} h is within ${error.toFixed(1)} h.`
        : `${guess} h is ${guess < truth ? "too early: the daughter is still building up" : "too late: the daughter is already declining"}; the peak is at ${truth.toFixed(1)} h.`,
    };
  }
  if (round.kind === "readings") {
    const truth = calculateHalfLifeFromActivities(READING_START, READING_END, READING_HOURS);
    const guess = v.halfLife as number;
    const error = Math.abs(guess - truth);
    const success = error <= READING_TOLERANCE;
    return {
      truth, fractionAtGuess: 2 ** (-READING_HOURS / guess), success, accuracyFraction: success ? 1 - error / READING_TOLERANCE : 0, predictionActual: truth,
      feedback: success ? `${READING_START} → ${READING_END} Bq is a factor of 16 in ${READING_HOURS} h: four half-lives of ${truth} h each.`
        : `With a half-life of ${guess} h the activity would fall to ${(READING_START * 2 ** (-READING_HOURS / guess)).toFixed(1)} Bq in ${READING_HOURS} h, not ${READING_END} Bq.`,
    };
  }
  const truth = calculateTimeForMixedActivity(MIXTURE, MIXTURE_TARGET);
  const guess = v.days as number;
  const fraction = calculateMixedActivityFraction(MIXTURE, guess);
  const error = Math.abs(guess - truth);
  const success = error <= MIXTURE_TOLERANCE_DAYS;
  return {
    truth, fractionAtGuess: fraction, success, accuracyFraction: success ? 1 - error / MIXTURE_TOLERANCE_DAYS : 0, predictionActual: truth,
    feedback: success ? `After ${guess} days the short-lived half is gone and the iodine has fallen to ${(fraction * 100).toFixed(1)} % of the total: the activity reaches 30 % at ${truth.toFixed(2)} days.`
      : `After ${guess} days ${(fraction * 100).toFixed(1)} % of the activity remains, ${fraction > MIXTURE_TARGET ? "more" : "less"} than ${MIXTURE_TARGET * 100} %. The time needed is ${truth.toFixed(2)} days.`,
  };
}

export const halfLifeChallenge = defineNumericGame<HalfLifeRound, HalfLifeOutcome>({
  meta: HALF_LIFE_META,
  rounds: HALF_LIFE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "chain" ? { label: "Your prediction of the time of the maximum", unit: "h", placeholder: "e.g. 23", step: 0.1 }
    : round.kind === "readings" ? { label: "Your prediction of the half-life", unit: "h", placeholder: "e.g. 3.5", step: 0.01 }
    : { label: "Your prediction of the time", unit: "days", placeholder: "e.g. 6", step: 0.1 },
  evaluate: (round, values) => runHalfLife(round, values),
});
