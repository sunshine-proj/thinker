import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateFrettedFrequency,
  calculateModeShape,
  calculateNoteFrequency,
  calculateStringFrequency,
  calculateStringWaveSpeed,
  calculateTensionForFrequency,
  calculateTouchedHarmonic,
} from "../../../physics/waves";

export type GuitarKind = "tune" | "fret" | "harmonic";

export interface GuitarRound extends NumericRound { readonly kind: GuitarKind }

export interface GuitarOutcome extends AttemptOutcome {
  readonly frequencyHz: number;
  readonly vibratingLengthMeters: number;
  readonly waveSpeed: number | null;
  readonly mode: number;
}

export const STRING_LENGTH = 0.65;
export const LINEAR_DENSITY = 0.0005;
export const E4_HZ = calculateNoteFrequency(64);
export const E2_HZ = calculateNoteFrequency(40);
export const A2_HZ = calculateNoteFrequency(45);
export const OPEN_HARMONIC_HZ = 110;
export const TUNE_TOLERANCE_HZ = 1;
export const FRET_TOLERANCE_HZ = 1;

export const GUITAR_META: RoundGameMeta = {
  id: "virtual-guitar",
  title: "Virtual Guitar",
  eyebrow: "WAVES & SOUND · STRINGS",
  modelTag: "STANDING WAVES ON A STRING",
  introduction: "Play a string instrument by the physics: tune a string with tension, shorten it with your finger to play a note, and touch it gently to ring a harmonic.",
  instructions: "Predict, then pluck. A string fixed at both ends can only vibrate in standing waves with a whole number of half-wavelengths; tension, length and mass per metre set the pitch.",
  formula: "fₙ = (n / 2L) √(T / μ)",
  formulaCaption: "L is the vibrating length, T the tension, μ the mass per unit length (kg/m) and n = 1, 2, 3… the mode. The wave speed on the string is v = √(T/μ).",
  explanation: "A pluck sends waves in both directions along the string; they reflect from the fixed ends and only waves that fit a whole number of half-wavelengths survive, forming standing waves. The fundamental has length L = λ/2, so f₁ = v/2L with v = √(T/μ): more tension, a lighter string or a shorter string raises the pitch. Pressing at a fret shortens the vibrating length. Touching the string lightly at 1/3 of its length forces a node there, so only modes with a node at that point can sound: the 3rd harmonic, three times the fundamental frequency.",
  assumptions: "An ideal, perfectly flexible string with small vibrations. Real strings are slightly stiff, which sharpens the higher harmonics, and the body of the instrument and the damping of the sound are not modelled.",
  learningObjectives: ["Use f = (1/2L)√(T/μ) to tune a string.", "Explain how fretting changes the vibrating length and pitch.", "Locate the nodes that produce harmonics."],
  objective: { title: "Play every note", description: "Hit each target note.", unit: "notes" },
  controlsHeading: "Set up the string",
  submitLabel: "Pluck the string",
  solvedLabel: "In tune!",
  nextLabel: "Next string",
};

export const GUITAR_ROUNDS: readonly GuitarRound[] = Object.freeze([
  {
    id: "tune-the-string", title: "Tune the string", difficulty: "Beginner", kind: "tune",
    situation: `A 0.65 m string of mass per length ${LINEAR_DENSITY * 1000} g/m must sound E4 (${E4_HZ.toFixed(2)} Hz) within ±${TUNE_TOLERANCE_HZ} Hz. Turn the tuning peg to set the tension.`,
    controls: [fixed("length", "String length", "m", STRING_LENGTH), slider("tension", "Tension", "N", 20, 150, 0.1, 60)],
    hint: "Solve f = (1/2L)√(T/μ) for the tension: T = μ (2 L f)².",
  },
  {
    id: "place-the-finger", title: "Place the finger", difficulty: "Intermediate", kind: "fret",
    situation: `The open string sounds E2 (${E2_HZ.toFixed(2)} Hz) over its full 0.65 m. Press it down at the right distance from the nut to sound A2 (${A2_HZ.toFixed(2)} Hz), within ±${FRET_TOLERANCE_HZ} Hz.`,
    controls: [fixed("open", "Open string frequency", "Hz", Number(E2_HZ.toFixed(2))), fixed("length", "String length", "m", STRING_LENGTH), slider("finger", "Finger distance from the nut", "m", 0, 0.4, 0.001, 0.1)],
    hint: "Tension and mass per length stay the same, so f is inversely proportional to the vibrating length: L' = L × f_open / f_target.",
  },
  {
    id: "ring-a-harmonic", title: "Ring a harmonic", difficulty: "Advanced", kind: "harmonic",
    situation: `The open string sounds ${OPEN_HARMONIC_HZ} Hz. Touch it lightly at a fraction of its length from the nut so that it rings the 3rd harmonic (${3 * OPEN_HARMONIC_HZ} Hz).`,
    controls: [fixed("open", "Open string frequency", "Hz", OPEN_HARMONIC_HZ), fixed("length", "String length", "m", STRING_LENGTH), slider("touch", "Touch position (fraction of length)", "", 0.05, 0.5, 0.005, 0.25)],
    hint: "Mode n has nodes at k/n of the length. The first node of the 3rd harmonic is a third of the way along the string.",
  },
]);

export function runGuitar(round: GuitarRound, v: NumericControl): GuitarOutcome {
  const length = v.length as number;
  if (round.kind === "tune") {
    const tension = v.tension as number;
    const f = calculateStringFrequency(length, tension, LINEAR_DENSITY);
    const error = Math.abs(f - E4_HZ);
    const success = error <= TUNE_TOLERANCE_HZ;
    return {
      frequencyHz: f, vibratingLengthMeters: length, waveSpeed: calculateStringWaveSpeed(tension, LINEAR_DENSITY), mode: 1,
      success, accuracyFraction: success ? 1 - error / TUNE_TOLERANCE_HZ : 0, predictionActual: calculateTensionForFrequency(length, LINEAR_DENSITY, E4_HZ),
      feedback: success ? `At ${tension.toFixed(1)} N the wave speed is ${Math.sqrt(tension / LINEAR_DENSITY).toFixed(0)} m/s and the string sounds ${f.toFixed(2)} Hz: in tune.`
        : `At ${tension.toFixed(1)} N the string sounds ${f.toFixed(1)} Hz, ${f > E4_HZ ? "sharp" : "flat"} by ${error.toFixed(1)} Hz. ${f > E4_HZ ? "Loosen" : "Tighten"} it.`,
    };
  }
  if (round.kind === "fret") {
    const finger = v.finger as number;
    const open = v.open as number;
    const f = calculateFrettedFrequency(open, length, finger);
    const error = Math.abs(f - A2_HZ);
    const success = error <= FRET_TOLERANCE_HZ;
    return {
      frequencyHz: f, vibratingLengthMeters: length - finger, waveSpeed: null, mode: 1,
      success, accuracyFraction: success ? 1 - error / FRET_TOLERANCE_HZ : 0, predictionActual: length * (1 - open / A2_HZ),
      feedback: success ? `With ${(length - finger).toFixed(3)} m of string free, the note is ${f.toFixed(2)} Hz: A2.`
        : `Pressed ${finger.toFixed(3)} m from the nut the string sounds ${f.toFixed(1)} Hz, ${f > A2_HZ ? "above" : "below"} A2 by ${error.toFixed(1)} Hz. ${f > A2_HZ ? "Move the finger toward the nut" : "Move the finger farther along"}.`,
    };
  }
  const touch = v.touch as number;
  const open = v.open as number;
  const mode = calculateTouchedHarmonic(touch);
  const target = 3 * open;
  const deviation = Math.abs(3 * touch - 1);
  const success = mode === 3;
  return {
    frequencyHz: mode === null ? open : mode * open, vibratingLengthMeters: length, waveSpeed: null, mode: mode ?? 1,
    success, accuracyFraction: success ? 1 - deviation / 0.02 : 0, predictionActual: target,
    feedback: success ? `Touching at ${touch.toFixed(3)} of the length puts a node where the 3rd harmonic has one, so the string rings ${target.toFixed(0)} Hz.`
      : mode === null ? `${touch.toFixed(3)} of the way is not near a node of any low harmonic, so the touch only damps the string and it sounds its ${open} Hz fundamental weakly.`
      : `Touching at ${touch.toFixed(3)} rings harmonic ${mode} (${(mode * open).toFixed(0)} Hz), not the 3rd.`,
  };
}

/** Standing-wave shape between the finger and the bridge (or the whole string) for the chart. */
export function sampleString(round: GuitarRound, v: NumericControl, mode: number): { x: number; y: number }[] {
  const length = v.length as number;
  const start = round.kind === "fret" ? (v.finger as number) : 0;
  const span = length - start;
  return Array.from({ length: 121 }, (_, i) => {
    const fraction = i / 120;
    return { x: start + fraction * span, y: calculateModeShape(mode, fraction) };
  });
}

export const virtualGuitar = defineNumericGame<GuitarRound, GuitarOutcome>({
  meta: GUITAR_META,
  rounds: GUITAR_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "tune" ? { label: "Your prediction of the tension needed", unit: "N", placeholder: "e.g. 90", step: 0.1 }
    : round.kind === "fret" ? { label: "Your prediction of the finger distance from the nut", unit: "m", placeholder: "e.g. 0.16", step: 0.001 }
    : { label: "Your prediction of the frequency heard", unit: "Hz", placeholder: "e.g. 330", step: 1 },
  evaluate: (round, values) => runGuitar(round, values),
});
