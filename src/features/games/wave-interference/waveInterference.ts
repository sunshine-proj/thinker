import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  SOUND_SPEED_20C,
  calculateFringeSpacing,
  calculatePathDifference,
  calculateRelativeIntensity,
  calculateScreenIntensity,
  calculateSlitSeparation,
  calculateWavelength,
  classifyInterference,
  type InterferenceKind,
  type Point,
} from "../../../physics/waves";

export type InterferenceRound_ = "quiet" | "loud" | "slits";

export interface InterferenceRound extends NumericRound { readonly kind: InterferenceRound_ }

export interface InterferenceOutcome extends AttemptOutcome {
  readonly wavelengthMeters: number;
  readonly pathDifferenceMeters: number;
  readonly intensity: number;
  readonly interference: InterferenceKind;
  readonly fringeSpacingMillimeters: number | null;
}

export const SPEAKER_A: Point = { x: -1, y: 0 };
export const SPEAKER_B: Point = { x: 1, y: 0 };
export const LISTENER_LINE_Y = 4;
export const QUIET_FREQUENCY_HZ = 343;
export const LISTENER: Point = { x: 2, y: 4 };
export const QUIET_LIMIT = 0.02;
export const LOUD_LIMIT = 0.95;
export const SODIUM_WAVELENGTH = 589e-9;
export const SCREEN_DISTANCE = 2;
export const TARGET_SPACING = 5e-3;
export const SPACING_TOLERANCE = 0.2e-3;

export const INTERFERENCE_META: RoundGameMeta = {
  id: "wave-interference",
  title: "Wave Interference",
  eyebrow: "WAVES & SOUND · INTERFERENCE",
  modelTag: "TWO-SOURCE INTERFERENCE",
  introduction: "Two sources, one point: the waves arrive together and either reinforce or cancel. Find the silent spot between two speakers, tune the frequency to make a point loud, and set a double slit so its bright fringes are exactly 5 mm apart.",
  instructions: "Predict, set the controls, then listen or look. What matters is the path difference: a whole number of wavelengths gives loud, an odd number of half-wavelengths gives silence.",
  formula: "Δ = |r₁ − r₂|  ·  I = I_max cos²(πΔ/λ)  ·  Δy = λL/d",
  formulaCaption: "Δ is the path difference between the two sources, λ the wavelength and I the intensity. For a double slit, d is the slit separation, L the distance to the screen and Δy the spacing of the bright fringes.",
  explanation: "Each wave carries a crest and trough pattern. At a point where the paths differ by a whole number of wavelengths the crests arrive together and add: constructive interference, intensity four times that of one source. Where the paths differ by half a wavelength a crest meets a trough and they cancel: destructive interference. Moving across the line of listeners, the path difference changes smoothly, so loud and silent bands alternate. The same pattern in light gives bright and dark fringes for a double slit, spaced λL/d: closer slits spread the fringes further apart.",
  assumptions: "Two point sources of equal strength and phase in free space, a stationary listener, speed of sound 343 m/s, and equal amplitude from both sources at the listener (the 1/r fall-off is ignored). For the double slit, the screen is far away compared with the slit separation.",
  learningObjectives: ["Compute path differences and classify interference.", "Predict where sound or light cancels or reinforces.", "Use Δy = λL/d to design a double-slit experiment."],
  objective: { title: "Master interference", description: "Complete each setup.", unit: "setups" },
  controlsHeading: "Set up the sources",
  submitLabel: "Measure the intensity",
  solvedLabel: "Interference mastered!",
  nextLabel: "Next setup",
};

export const INTERFERENCE_ROUNDS: readonly InterferenceRound[] = Object.freeze([
  {
    id: "the-quiet-spot", title: "The quiet spot", difficulty: "Beginner", kind: "quiet",
    situation: `Two speakers 2 m apart play the same ${QUIET_FREQUENCY_HZ} Hz tone (wavelength 1.00 m). Walk along a line 4 m in front of them (x = 0 is midway) and find the first spot where the sound cancels, with intensity below ${QUIET_LIMIT * 100} % of the maximum.`,
    controls: [fixed("frequency", "Frequency", "Hz", QUIET_FREQUENCY_HZ), slider("position", "Listener position along the line", "m", 0, 3, 0.01, 0)],
    hint: "Silence needs a path difference of half a wavelength, 0.5 m. Try positions and watch the path difference grow from 0 at the centre.",
  },
  {
    id: "the-loud-spot", title: "The loud spot", difficulty: "Intermediate", kind: "loud",
    situation: `A listener stands at (2 m, 4 m), with the speakers at (−1, 0) and (1, 0). Choose the frequency so the sound is as loud as possible there, with at least ${LOUD_LIMIT * 100} % of the maximum intensity. The speed of sound is ${SOUND_SPEED_20C} m/s.`,
    controls: [slider("frequency", "Frequency", "Hz", 150, 600, 1, 250)],
    hint: "Measure the path difference to the listener, then choose a wavelength that fits a whole number of times into it (λ = Δ/m).",
  },
  {
    id: "double-slit-fringes", title: "Double-slit fringes", difficulty: "Advanced", kind: "slits",
    situation: `Sodium light (589 nm) passes through two slits onto a screen ${SCREEN_DISTANCE} m away. Choose the slit separation so the bright fringes are ${TARGET_SPACING * 1000} mm apart (± ${SPACING_TOLERANCE * 1000} mm).`,
    controls: [fixed("wavelength", "Wavelength", "nm", 589), fixed("screen", "Screen distance", "m", SCREEN_DISTANCE), slider("separation", "Slit separation", "mm", 0.1, 1, 0.005, 0.5)],
    hint: "Rearrange Δy = λL/d to d = λL/Δy.",
  },
]);

export function runInterference(round: InterferenceRound, v: NumericControl): InterferenceOutcome {
  if (round.kind === "slits") {
    const d = (v.separation as number) / 1000;
    const spacing = calculateFringeSpacing(SODIUM_WAVELENGTH, SCREEN_DISTANCE, d);
    const error = Math.abs(spacing - TARGET_SPACING);
    const success = error <= SPACING_TOLERANCE;
    return {
      wavelengthMeters: SODIUM_WAVELENGTH, pathDifferenceMeters: 0, intensity: 1, interference: "constructive", fringeSpacingMillimeters: spacing * 1000,
      success, accuracyFraction: success ? 1 - error / SPACING_TOLERANCE : 0, predictionActual: calculateSlitSeparation(SODIUM_WAVELENGTH, SCREEN_DISTANCE, TARGET_SPACING) * 1000,
      feedback: success ? `Slits ${(d * 1000).toFixed(3)} mm apart give fringes λL/d = ${(spacing * 1000).toFixed(2)} mm apart.`
        : `Fringes ${(spacing * 1000).toFixed(2)} mm apart, not 5 mm. ${spacing < TARGET_SPACING ? "Bring the slits closer together" : "Move the slits further apart"}: the spacing is inversely proportional to d.`,
    };
  }
  const frequency = v.frequency as number;
  const wavelength = calculateWavelength(frequency);
  const listener: Point = round.kind === "quiet" ? { x: v.position as number, y: LISTENER_LINE_Y } : LISTENER;
  const delta = calculatePathDifference(listener, SPEAKER_A, SPEAKER_B);
  const intensity = calculateRelativeIntensity(delta, wavelength);
  const kind = classifyInterference(intensity);
  const common = { wavelengthMeters: wavelength, pathDifferenceMeters: delta, intensity, interference: kind, fringeSpacingMillimeters: null };
  if (round.kind === "quiet") {
    const success = intensity <= QUIET_LIMIT;
    return {
      ...common, success, accuracyFraction: success ? 1 - intensity / QUIET_LIMIT : 0, predictionActual: wavelength / 2,
      feedback: success ? `The path difference is ${delta.toFixed(3)} m, about half a wavelength: the waves cancel and the intensity is only ${(intensity * 100).toFixed(1)} % of the maximum.`
        : `The path difference is ${delta.toFixed(3)} m (${(delta / wavelength).toFixed(2)} wavelengths), which gives ${(intensity * 100).toFixed(0)} % of the maximum intensity. Silence needs 0.5 wavelengths.`,
    };
  }
  const success = intensity >= LOUD_LIMIT;
  return {
    ...common, success, accuracyFraction: success ? (intensity - LOUD_LIMIT) / (1 - LOUD_LIMIT) : 0, predictionActual: delta,
    feedback: success ? `The path difference ${delta.toFixed(3)} m is ${(delta / wavelength).toFixed(2)} wavelengths, close to a whole number: the waves reinforce (${(intensity * 100).toFixed(0)} % of the maximum).`
      : `The path difference ${delta.toFixed(3)} m is ${(delta / wavelength).toFixed(2)} wavelengths, which gives only ${(intensity * 100).toFixed(0)} % of the maximum. A whole number of wavelengths is needed.`,
  };
}

/** Intensity curve for the chart: along the listener line, over frequency, or across the screen. */
export function intensityCurve(round: InterferenceRound, v: NumericControl): { x: number; y: number }[] {
  const count = 300;
  if (round.kind === "quiet") {
    const wavelength = calculateWavelength(v.frequency as number);
    return Array.from({ length: count + 1 }, (_, i) => {
      const x = (3 * i) / count;
      return { x, y: calculateRelativeIntensity(calculatePathDifference({ x, y: LISTENER_LINE_Y }, SPEAKER_A, SPEAKER_B), wavelength) };
    });
  }
  if (round.kind === "loud") {
    const delta = calculatePathDifference(LISTENER, SPEAKER_A, SPEAKER_B);
    return Array.from({ length: count + 1 }, (_, i) => {
      const f = 150 + (450 * i) / count;
      return { x: f, y: calculateRelativeIntensity(delta, calculateWavelength(f)) };
    });
  }
  const d = (v.separation as number) / 1000;
  return Array.from({ length: count + 1 }, (_, i) => {
    const y = -0.015 + (0.03 * i) / count;
    return { x: y * 1000, y: calculateScreenIntensity(SODIUM_WAVELENGTH, SCREEN_DISTANCE, d, y) };
  });
}

export const waveInterference = defineNumericGame<InterferenceRound, InterferenceOutcome>({
  meta: INTERFERENCE_META,
  rounds: INTERFERENCE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "quiet" ? { label: "Your prediction of the path difference at the quiet spot", unit: "m", placeholder: "e.g. 0.5", step: 0.01 }
    : round.kind === "loud" ? { label: "Your prediction of the path difference at the listener", unit: "m", placeholder: "e.g. 0.88", step: 0.01 }
    : { label: "Your prediction of the slit separation needed", unit: "mm", placeholder: "e.g. 0.24", step: 0.001 },
  evaluate: (round, values) => runInterference(round, values),
});
