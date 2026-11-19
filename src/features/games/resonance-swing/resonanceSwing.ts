import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateAmplification, calculatePeakAmplification, calculatePendulumFrequency, calculateResonantFrequency } from "../../../physics/waves";

export type ResonanceKind = "swing" | "glass" | "bridge";
export interface ResonanceRound extends NumericRound { readonly kind: ResonanceKind }
export interface ResonanceOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const SWING = { length: 2.5, damping: 0.02, toleranceHz: 0.01 } as const;
export const GLASS = { naturalHz: 880, damping: 0.0005, requiredFraction: 0.7 } as const;
export const BRIDGE = { naturalHz: 1.9, lowest: 9, highest: 10 } as const;

export const RESONANCE_META: RoundGameMeta = {
  id: "resonance-swing",
  title: "Resonance Swing",
  eyebrow: "WAVES & SOUND · RESONANCE",
  modelTag: "DRIVEN, DAMPED OSCILLATOR",
  introduction: "Small pushes at the right rhythm build huge swings. Find the push rate that sends a swing highest, sing the note that makes a wine glass ring, and add just enough damping to a footbridge so walkers cannot shake it dangerously.",
  instructions: "Predict, then set the frequency or the damping. Every oscillator has a natural frequency; driving it at that frequency adds energy on every cycle, and only damping stops the swings growing without limit.",
  formula: "f₀ = (1/2π) √(g/L)  ·  A/A₀ = 1 / √((1 − r²)² + (2ζr)²), r = f/f₀",
  formulaCaption: "f₀ is the natural frequency (Hz), L the swing's length, A/A₀ how many times larger the swings are than a steady push would give, r the ratio of driving to natural frequency and ζ the damping ratio.",
  explanation: "A swing has a natural rhythm set by its length. Push in step with it and every push adds a little energy at just the right moment, so the swings grow until the energy lost to air resistance and friction each cycle equals what you add. Push at the wrong rhythm and half your pushes fight the motion. The less damping a system has, the higher and sharper its resonance peak: a crystal wine glass barely loses energy, so only a note within about a hertz of its own makes it ring strongly, but then the response is enormous. Engineers add dampers to bridges and tall buildings to keep that peak low, because people walking or wind gusts can drive them near their natural frequency.",
  assumptions: "A linear oscillator with viscous damping driven sinusoidally, small swing angles for the pendulum (g = 9.81 m/s²), and steady-state response after the start-up transient has died away. Real pushes on a swing are short kicks, which resonate at the same frequency.",
  learningObjectives: ["Calculate a pendulum's natural frequency.", "Explain how damping shapes a resonance peak.", "Use the peak amplification 1/(2ζ√(1 − ζ²)) to design dampers."],
  objective: { title: "Ride the resonance", description: "Solve each resonance problem.", unit: "oscillators" },
  controlsHeading: "Your setting",
  submitLabel: "Start pushing",
  solvedLabel: "In resonance!",
  nextLabel: "Next oscillator",
};

export const RESONANCE_ROUNDS: readonly ResonanceRound[] = Object.freeze([
  {
    id: "push-the-swing", title: "Push the swing", difficulty: "Beginner", kind: "swing",
    situation: `A swing hangs on ${SWING.length} m ropes. How many pushes per second (Hz) make it swing highest? (± ${SWING.toleranceHz} Hz)`,
    controls: [fixed("length", "Rope length", "m", SWING.length), slider("frequency", "Push frequency", "Hz", 0.1, 1, 0.001, 0.5)],
    hint: "Push at the swing's own frequency, f₀ = (1/2π)√(g/L).",
  },
  {
    id: "ring-the-glass", title: "Ring the glass", difficulty: "Intermediate", kind: "glass",
    situation: `A crystal glass rings at ${GLASS.naturalHz} Hz with very little damping (ζ = ${GLASS.damping}). Sing a note that drives it to at least ${GLASS.requiredFraction * 100} % of its peak response.`,
    controls: [fixed("natural", "Glass's natural frequency", "Hz", GLASS.naturalHz), slider("frequency", "Your note", "Hz", 860, 900, 0.1, 870)],
    hint: "With ζ this small, the response drops to 70 % only about ζ f₀ ≈ 0.45 Hz away from the peak.",
  },
  {
    id: "tame-the-bridge", title: "Tame the bridge", difficulty: "Advanced", kind: "bridge",
    situation: `A footbridge's natural frequency (${BRIDGE.naturalHz} Hz) matches walking pace. Add dampers so that walkers in step can make it move at most ${BRIDGE.highest} times as much as a steady load would, but no less than ${BRIDGE.lowest} times (more dampers cost more).`,
    controls: [fixed("natural", "Bridge natural frequency", "Hz", BRIDGE.naturalHz), slider("damping", "Damping ratio ζ", "", 0.005, 0.2, 0.0005, 0.01)],
    hint: "The peak amplification is 1/(2ζ√(1 − ζ²)). Find ζ for 10 and for 9.",
  },
]);

/** Damping ratio giving a peak amplification A (for small ζ, ≈ 1/(2A)). */
export function dampingForPeak(amplification: number): number {
  let low = 1e-4;
  let high = 0.7;
  for (let i = 0; i < 100; i += 1) {
    const middle = (low + high) / 2;
    if (calculatePeakAmplification(middle) > amplification) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}

export function runResonance(round: ResonanceRound, v: NumericControl): ResonanceOutcome {
  if (round.kind === "swing") {
    const f = v.frequency as number;
    const natural = calculatePendulumFrequency(SWING.length);
    const best = calculateResonantFrequency(natural, SWING.damping);
    const amplification = calculateAmplification(f, natural, SWING.damping);
    const error = Math.abs(f - best);
    const success = error <= SWING.toleranceHz;
    return {
      headline: amplification, unit: "×", success, accuracyFraction: success ? 1 - error / SWING.toleranceHz : 0, predictionActual: natural,
      feedback: success
        ? `${f.toFixed(3)} Hz, one push every ${(1 / f).toFixed(2)} s, matches the swing's ${natural.toFixed(3)} Hz: the swings grow ${amplification.toFixed(0)} times larger than a steady push.`
        : `At ${f.toFixed(3)} Hz the pushes drift out of step with the swing (${natural.toFixed(3)} Hz): only ${amplification.toFixed(1)} times.`,
    };
  }
  if (round.kind === "glass") {
    const f = v.frequency as number;
    const peak = calculatePeakAmplification(GLASS.damping);
    const fraction = calculateAmplification(f, GLASS.naturalHz, GLASS.damping) / peak;
    const success = fraction >= GLASS.requiredFraction;
    return {
      headline: fraction, unit: "of peak", success, accuracyFraction: success ? (fraction - GLASS.requiredFraction) / (1 - GLASS.requiredFraction) : 0, predictionActual: GLASS.naturalHz,
      feedback: success
        ? `${f.toFixed(1)} Hz drives the glass to ${(fraction * 100).toFixed(0)} % of its peak, ${(peak * fraction).toFixed(0)} times a steady push: it rings loudly.`
        : `${f.toFixed(1)} Hz gives only ${(fraction * 100).toFixed(0)} % of the peak. With so little damping the resonance is very narrow.`,
    };
  }
  const zeta = v.damping as number;
  const peak = calculatePeakAmplification(zeta);
  const success = peak <= BRIDGE.highest && peak >= BRIDGE.lowest;
  const target = dampingForPeak(BRIDGE.highest);
  return {
    headline: peak, unit: "×", success, accuracyFraction: success ? (BRIDGE.highest - peak) / (BRIDGE.highest - BRIDGE.lowest) : 0, predictionActual: target,
    feedback: success
      ? `With ζ = ${zeta.toFixed(4)} walkers in step can make the bridge move at most ${peak.toFixed(1)} times as much as a steady load: safe, without over-spending on dampers.`
      : peak > BRIDGE.highest ? `With ζ = ${zeta.toFixed(4)} resonance amplifies the motion ${peak.toFixed(1)} times: add damping.` : `ζ = ${zeta.toFixed(4)} keeps it to ${peak.toFixed(1)} times, safe but more damping than needed.`,
  };
}

export const resonanceSwing = defineNumericGame<ResonanceRound, ResonanceOutcome>({
  meta: RESONANCE_META,
  rounds: RESONANCE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "bridge" ? { label: "Your prediction of the damping ratio", unit: "", placeholder: "e.g. 0.03", step: 0.0005 }
    : { label: "Your prediction of the best frequency", unit: "Hz", placeholder: round.kind === "swing" ? "e.g. 0.4" : "e.g. 875", step: 0.001 },
  evaluate: (round, values) => runResonance(round, values),
});
