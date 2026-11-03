import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateHarmonicAmplitude,
  calculateLevelChangeDecibels,
  calculateNoteFrequency,
  calculatePeriod,
  calculateWavelength,
  synthesizeHarmonics,
} from "../../../physics/waves";

export type SoundKind = "pitch" | "loudness" | "timbre";

export interface SoundRound extends NumericRound { readonly kind: SoundKind }

export interface SoundOutcome extends AttemptOutcome {
  readonly frequencyHz: number;
  readonly periodMilliseconds: number;
  readonly wavelengthMeters: number;
  readonly levelChangeDecibels: number | null;
  readonly peak: number;
}

/** C5 is MIDI note 72. */
export const TARGET_NOTE_MIDI = 72;
export const TARGET_NOTE_HZ = calculateNoteFrequency(TARGET_NOTE_MIDI);
export const PITCH_TOLERANCE_HZ = 3;
export const REFERENCE_AMPLITUDE = 0.1;
export const TARGET_LEVEL_DB = 10;
export const LEVEL_TOLERANCE_DB = 0.5;
export const HARMONIC_TOLERANCE = 0.04;
export const TIMBRE_FREQUENCY_HZ = 220;

export const SOUND_META: RoundGameMeta = {
  id: "sound-creator",
  title: "Sound Creator",
  eyebrow: "WAVES & SOUND · SYNTHESIS",
  modelTag: "TONES & HARMONICS",
  introduction: "Build sounds from waves: tune a note to the exact pitch, make a sound a set number of decibels louder, and add harmonics to turn a pure tone into a square-wave buzz.",
  instructions: "Predict, set the sliders, then play the sound. Frequency sets the pitch, amplitude sets the loudness, and the mix of harmonics sets the timbre, the character of the sound.",
  formula: "f = 1/T  ·  λ = v/f  ·  ΔL = 20 log₁₀(A₂/A₁)  ·  square wave = sin ωt + ⅓ sin 3ωt + ⅕ sin 5ωt + …",
  formulaCaption: "f is frequency, T the period, v the speed of sound (343 m/s), λ the wavelength, A the pressure amplitude, ΔL the change in sound level in decibels and ω = 2πf.",
  explanation: "Pitch is frequency: each doubling is an octave, and in equal temperament each semitone multiplies the frequency by 2^(1/12). Loudness follows amplitude, but our ears work on a logarithmic scale, so decibels compare amplitudes as ratios: doubling the amplitude adds about 6 dB, and ten times the amplitude adds 20 dB. Timbre comes from harmonics, extra waves at whole-number multiples of the fundamental. A square wave is the sum of the odd harmonics with amplitudes 1, 1/3, 1/5, …, which is why a pure sine and a square wave at the same pitch sound so different.",
  assumptions: "Ideal waveforms without attack, decay or room acoustics. Levels are relative to a reference amplitude, not absolute sound pressure levels, and the speed of sound is taken as 343 m/s.",
  learningObjectives: ["Relate frequency to pitch, period and wavelength.", "Use decibels to compare amplitudes.", "Build a waveform from its harmonics."],
  objective: { title: "Create every sound", description: "Match each target sound.", unit: "sounds" },
  controlsHeading: "Shape the sound",
  submitLabel: "Play the sound",
  solvedLabel: "Sound matched!",
  nextLabel: "Next sound",
};

export const SOUND_ROUNDS: readonly SoundRound[] = Object.freeze([
  {
    id: "match-the-note", title: "Match the note", difficulty: "Beginner", kind: "pitch",
    situation: `Tune the synthesizer to C5, the note an octave above middle C (MIDI note 72), to within ±${PITCH_TOLERANCE_HZ} Hz. In equal temperament A4 is 440 Hz and each semitone multiplies the frequency by 2^(1/12).`,
    controls: [slider("frequency", "Frequency", "Hz", 200, 1000, 0.5, 440), fixed("amplitude", "Amplitude", "", 0.5)],
    hint: "C5 is 3 semitones above A4: f = 440 × 2^(3/12) ≈ 523.25 Hz.",
  },
  {
    id: "ten-decibels-louder", title: "Ten decibels louder", difficulty: "Intermediate", kind: "loudness",
    situation: `A 440 Hz tone has amplitude ${REFERENCE_AMPLITUDE}. Set the amplitude of a second tone so it is ${TARGET_LEVEL_DB} dB louder (within ±${LEVEL_TOLERANCE_DB} dB).`,
    controls: [fixed("frequency", "Frequency", "Hz", 440), slider("amplitude", "Amplitude", "", 0.01, 1, 0.005, 0.2)],
    hint: "ΔL = 20 log₁₀(A/0.1) = 10, so A = 0.1 × 10^(10/20) = 0.1 × 3.16.",
  },
  {
    id: "build-a-square-wave", title: "Build a square wave", difficulty: "Advanced", kind: "timbre",
    situation: `A 220 Hz tone has a fundamental of amplitude 1. Add the 3rd and 5th harmonics so the sum approximates a square wave, within ±${HARMONIC_TOLERANCE} of the Fourier series amplitudes.`,
    controls: [fixed("frequency", "Frequency", "Hz", TIMBRE_FREQUENCY_HZ), fixed("first", "1st harmonic amplitude", "", 1), slider("third", "3rd harmonic amplitude", "", 0, 1, 0.01, 0.5), slider("fifth", "5th harmonic amplitude", "", 0, 1, 0.01, 0.5)],
    hint: "A square wave contains only odd harmonics, each with amplitude 1/n of the fundamental: 1/3 and 1/5.",
  },
]);

/** Pressure waveform sampled over `windowSeconds`, for the chart. */
export function sampleSound(round: SoundRound, v: NumericControl, windowSeconds: number, points = 240): { x: number; y: number }[] {
  const f = v.frequency as number;
  const harmonics = round.kind === "timbre" ? [v.first as number, 0, v.third as number, 0, v.fifth as number] : [v.amplitude as number];
  return Array.from({ length: points + 1 }, (_, i) => {
    const t = (windowSeconds * i) / points;
    return { x: t * 1000, y: synthesizeHarmonics(f, harmonics, t) };
  });
}

export function runSound(round: SoundRound, v: NumericControl): SoundOutcome {
  const f = v.frequency as number;
  const common = {
    frequencyHz: f, periodMilliseconds: calculatePeriod(f) * 1000, wavelengthMeters: calculateWavelength(f),
    levelChangeDecibels: null as number | null,
    peak: Math.max(...sampleSound(round, v, calculatePeriod(f), 360).map((p) => Math.abs(p.y))),
  };
  if (round.kind === "pitch") {
    const error = Math.abs(f - TARGET_NOTE_HZ);
    const success = error <= PITCH_TOLERANCE_HZ;
    return {
      ...common, success, accuracyFraction: success ? 1 - error / PITCH_TOLERANCE_HZ : 0, predictionActual: 1000 / TARGET_NOTE_HZ,
      feedback: success ? `${f.toFixed(1)} Hz is within ${error.toFixed(1)} Hz of C5 (${TARGET_NOTE_HZ.toFixed(2)} Hz); its period is ${common.periodMilliseconds.toFixed(3)} ms and its wavelength ${common.wavelengthMeters.toFixed(2)} m.`
        : `${f.toFixed(1)} Hz sounds ${f > TARGET_NOTE_HZ ? "higher" : "lower"} than C5 (${TARGET_NOTE_HZ.toFixed(2)} Hz) by ${error.toFixed(1)} Hz.`,
    };
  }
  if (round.kind === "loudness") {
    const a = v.amplitude as number;
    const db = calculateLevelChangeDecibels(a, REFERENCE_AMPLITUDE);
    const error = Math.abs(db - TARGET_LEVEL_DB);
    const success = error <= LEVEL_TOLERANCE_DB;
    return {
      ...common, levelChangeDecibels: db, success, accuracyFraction: success ? 1 - error / LEVEL_TOLERANCE_DB : 0, predictionActual: REFERENCE_AMPLITUDE * 10 ** (TARGET_LEVEL_DB / 20),
      feedback: success ? `Amplitude ${a.toFixed(3)} is ${(a / REFERENCE_AMPLITUDE).toFixed(2)} times the reference: ${db.toFixed(1)} dB louder.`
        : `Amplitude ${a.toFixed(3)} is ${db.toFixed(1)} dB ${db > TARGET_LEVEL_DB ? "too loud" : "short"}: it is ${(db - TARGET_LEVEL_DB).toFixed(1)} dB from the ${TARGET_LEVEL_DB} dB target.`,
    };
  }
  const third = v.third as number;
  const fifth = v.fifth as number;
  const idealThird = calculateHarmonicAmplitude("square", 3);
  const idealFifth = calculateHarmonicAmplitude("square", 5);
  const worst = Math.max(Math.abs(third - idealThird), Math.abs(fifth - idealFifth));
  const success = worst <= HARMONIC_TOLERANCE;
  return {
    ...common, success, accuracyFraction: success ? 1 - worst / HARMONIC_TOLERANCE : 0, predictionActual: idealThird,
    feedback: success ? `Harmonics of ${third.toFixed(2)} and ${fifth.toFixed(2)} are close to 1/3 and 1/5: the sum is flat-topped like a square wave.`
      : `The 3rd harmonic should be about ${idealThird.toFixed(2)} (you have ${third.toFixed(2)}) and the 5th about ${idealFifth.toFixed(2)} (you have ${fifth.toFixed(2)}).`,
  };
}

export const soundCreator = defineNumericGame<SoundRound, SoundOutcome>({
  meta: SOUND_META,
  rounds: SOUND_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "pitch" ? { label: "Your prediction of the period of C5", unit: "ms", placeholder: "e.g. 1.9", step: 0.01 }
    : round.kind === "loudness" ? { label: "Your prediction of the amplitude needed", unit: "", placeholder: "e.g. 0.3", step: 0.01 }
    : { label: "Your prediction of the 3rd harmonic's amplitude", unit: "", placeholder: "e.g. 0.33", step: 0.01 },
  evaluate: (round, values) => runSound(round, values),
});
