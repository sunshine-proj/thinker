import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  DELAYED_NEUTRON_FRACTION,
  calculateDoublingTime,
  calculateMultiplicationFromReactivity,
  calculateReactivity,
  calculateReactivityForPeriod,
  calculateReactorPeriod,
  calculateRodMultiplication,
  isPromptCritical,
} from "../../../physics/nuclear";

export type ReactorKind = "critical" | "doubling" | "rampup";
export interface ReactorRound extends NumericRound { readonly kind: ReactorKind }
export interface ReactorOutcome extends AttemptOutcome {
  readonly multiplication: number;
  /** Stable period (s); Infinity when steady, null at or above prompt critical. */
  readonly periodSeconds: number | null;
}

export const RODS = { withdrawnK: 1.05, worth: 0.1, toleranceK: 0.0005 } as const;
export const DOUBLING = { lowest: 50, highest: 70 } as const;
export const RAMP = { minimumPeriod: 20, maximumPeriod: 25 } as const;

const PROMPT_FAILURE = {
  title: "Automatic shutdown: prompt critical",
  explanation: `The reactivity reached the delayed-neutron fraction (${DELAYED_NEUTRON_FRACTION}), so prompt neutrons alone would sustain the chain reaction and the power would rise in milliseconds. The safety system drops the rods. Real reactors are designed so this cannot be reached.`,
} as const;

function periodOf(k: number): number | null {
  if (isPromptCritical(k)) {
    return null;
  }
  return calculateReactorPeriod(calculateReactivity(k));
}

export const REACTOR_META: RoundGameMeta = {
  id: "reactor-operator",
  title: "Reactor Operator",
  eyebrow: "NUCLEAR PHYSICS · FISSION",
  modelTag: "CHAIN REACTION CONTROL (SIMPLIFIED)",
  introduction: "Run the control room of a research reactor. Set the control rods so the chain reaction holds steady, raise the power so it doubles in about a minute, and bring it up as fast as the safety rules allow.",
  instructions: "Predict, then set the rods or the multiplication factor. Each fission releases neutrons that cause more fissions; the multiplication factor k counts how many next-generation fissions each one causes. At k = 1 the power is steady.",
  formula: "ρ = (k − 1)/k  ·  T ≈ (β − ρ)/(λρ)  ·  doubling time = T ln 2",
  formulaCaption: "k is the multiplication factor, ρ the reactivity, β = 0.0065 the fraction of delayed neutrons from uranium-235, λ ≈ 0.08 s⁻¹ their precursors' effective decay constant and T the reactor period.",
  explanation: "If every fission causes exactly one more (k = 1), the reactor is critical and the power stays constant; control rods soak up neutrons to set k. Each neutron generation in a reactor lasts far less than a millisecond, so if every neutron were released at once even k = 1.001 would multiply the power enormously within a second. What makes reactors controllable is that about 0.65 % of neutrons are delayed by seconds, released by decaying fission fragments. While the reactivity stays below that delayed fraction, the power rises with a period of many seconds, slow enough for operators and automatic systems to respond. Reactors are designed and operated so the reactivity always stays well below the delayed fraction (prompt criticality).",
  assumptions: "A simplified point-kinetics model with one group of delayed neutrons (β = 0.0065, λ = 0.08 s⁻¹), small reactivities, control-rod worth proportional to insertion, and no temperature feedback, fission-product poisons or fuel burn-up. Real reactor physics is far more detailed; this model teaches the principles of control only.",
  learningObjectives: ["Explain criticality and the multiplication factor.", "Relate reactivity to the reactor period with delayed neutrons.", "Explain why reactors must stay far below prompt criticality."],
  objective: { title: "Run the reactor safely", description: "Complete each control task.", unit: "tasks" },
  controlsHeading: "Control desk",
  submitLabel: "Apply the setting",
  solvedLabel: "Reactor stable!",
  nextLabel: "Next task",
};

export const REACTOR_ROUNDS: readonly ReactorRound[] = Object.freeze([
  {
    id: "make-it-critical", title: "Make it critical", difficulty: "Beginner", kind: "critical",
    situation: `With all rods out the core's multiplication factor is ${RODS.withdrawnK}. Fully inserted, the rods remove ${RODS.worth} from k. How far must they be inserted to hold the power steady? (k within ± ${RODS.toleranceK})`,
    controls: [fixed("withdrawn", "k with rods out", "", RODS.withdrawnK), slider("insertion", "Rod insertion", "%", 0, 100, 0.1, 20)],
    hint: "k = 1.05 − 0.10 × insertion fraction = 1.",
  },
  {
    id: "double-in-a-minute", title: "Double in a minute", difficulty: "Intermediate", kind: "doubling",
    situation: `Raise the power so that it doubles in about a minute: a doubling time between ${DOUBLING.lowest} s and ${DOUBLING.highest} s. Set the multiplication factor.`,
    controls: [slider("k", "Multiplication factor k", "", 0.995, 1.01, 0.00005, 1.002)],
    hint: "Doubling time 60 s means T = 60/ln 2 ≈ 87 s; then ρ = β/(1 + λT) and k = 1/(1 − ρ).",
  },
  {
    id: "fast-but-safe", title: "Fast but safe", difficulty: "Advanced", kind: "rampup",
    situation: `The safety rules forbid a reactor period shorter than ${RAMP.minimumPeriod} s. Bring the power up as fast as allowed: a period between ${RAMP.minimumPeriod} s and ${RAMP.maximumPeriod} s.`,
    controls: [slider("k", "Multiplication factor k", "", 0.995, 1.01, 0.00005, 1.001)],
    hint: "ρ = β/(1 + λT) for T = 20 s, then k = 1/(1 − ρ). Stay far below ρ = β.",
  },
]);

export function runReactor(round: ReactorRound, v: NumericControl): ReactorOutcome {
  if (round.kind === "critical") {
    const insertion = (v.insertion as number) / 100;
    const k = calculateRodMultiplication(RODS.withdrawnK, RODS.worth, insertion);
    const truth = ((RODS.withdrawnK - 1) / RODS.worth) * 100;
    const error = Math.abs(k - 1);
    const success = error <= RODS.toleranceK;
    return {
      multiplication: k, periodSeconds: periodOf(k), success, accuracyFraction: success ? 1 - error / RODS.toleranceK : 0, predictionActual: truth,
      feedback: success
        ? `At ${(insertion * 100).toFixed(1)} % insertion k = ${k.toFixed(4)}: each fission causes one more, and the power holds steady.`
        : k > 1 ? `k = ${k.toFixed(4)}: the chain reaction grows. Insert the rods further.` : `k = ${k.toFixed(4)}: the chain reaction dies away. Withdraw the rods a little.`,
    };
  }
  const k = v.k as number;
  const period = periodOf(k);
  if (round.kind === "doubling") {
    const doubling = period !== null && period > 0 && Number.isFinite(period) ? calculateDoublingTime(period) : null;
    const success = doubling !== null && doubling >= DOUBLING.lowest && doubling <= DOUBLING.highest;
    const truth = calculateMultiplicationFromReactivity(calculateReactivityForPeriod(60 / Math.LN2));
    return {
      ...(period === null ? { catastrophe: PROMPT_FAILURE } : {}),
      multiplication: k, periodSeconds: period, success, accuracyFraction: success ? 1 - Math.abs((doubling as number) - 60) / 10 : 0, predictionActual: truth,
      feedback: period === null
        ? `k = ${k.toFixed(5)} is prompt critical: the power would surge in milliseconds. Never do this.`
        : success ? `k = ${k.toFixed(5)} gives a period of ${period.toFixed(0)} s: the power doubles every ${(doubling as number).toFixed(0)} s, a calm, controlled rise.`
        : doubling === null ? `k = ${k.toFixed(5)} does not raise the power at all.`
        : `The power doubles every ${doubling.toFixed(0)} s: ${doubling < DOUBLING.lowest ? "too fast" : "too slow"}.`,
    };
  }
  const success = period !== null && period >= RAMP.minimumPeriod && period <= RAMP.maximumPeriod;
  const truth = calculateMultiplicationFromReactivity(calculateReactivityForPeriod(RAMP.minimumPeriod));
  return {
    ...(period === null ? { catastrophe: PROMPT_FAILURE } : {}),
    multiplication: k, periodSeconds: period, success, accuracyFraction: success ? 1 - ((period as number) - RAMP.minimumPeriod) / (RAMP.maximumPeriod - RAMP.minimumPeriod) : 0, predictionActual: truth,
    feedback: period === null
      ? `k = ${k.toFixed(5)} reaches prompt criticality (ρ ≥ ${DELAYED_NEUTRON_FRACTION}): the delayed neutrons no longer control the reactor. Far outside the rules.`
      : success ? `Period ${period.toFixed(1)} s, just within the rules: the reactivity ${calculateReactivity(k).toFixed(5)} is still well below the delayed-neutron fraction ${DELAYED_NEUTRON_FRACTION}.`
      : period > 0 && Number.isFinite(period) ? `Period ${period.toFixed(1)} s: ${period < RAMP.minimumPeriod ? "too short, breaking the safety rule" : "safe but slower than allowed"}.`
      : `k = ${k.toFixed(5)} does not raise the power.`,
  };
}

export const reactorOperator = defineNumericGame<ReactorRound, ReactorOutcome>({
  meta: REACTOR_META,
  rounds: REACTOR_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "critical" ? { label: "Your prediction of the rod insertion", unit: "%", placeholder: "e.g. 40", step: 0.1 }
    : { label: "Your prediction of k", unit: "", placeholder: "e.g. 1.001", step: 0.00005 },
  evaluate: (round, values) => runReactor(round, values),
});
