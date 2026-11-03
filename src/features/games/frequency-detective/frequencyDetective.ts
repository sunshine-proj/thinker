import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateBeatFrequency,
  calculateFundamental,
  calculateResolutionTime,
  calculateSpectrum,
  findSpectralPeaks,
  sampleTones,
  type SpectrumPoint,
  type Tone,
} from "../../../physics/waves";

export type DetectiveKind = "beats" | "fundamental" | "resolution";

export interface FrequencyRound extends NumericRound { readonly kind: DetectiveKind }

export interface FrequencyOutcome extends AttemptOutcome {
  readonly beatHz: number | null;
  readonly peaks: readonly number[];
  readonly resolutionHz: number | null;
}

export const SAMPLE_RATE = 2048;
export const REFERENCE_HZ = 440;
export const OBSERVED_BEATS = 4;
export const FLAT_STRING_HZ = REFERENCE_HZ - OBSERVED_BEATS;
export const BEAT_TOLERANCE = 0.5;
export const HARMONIC_SIGNAL: readonly Tone[] = [{ frequency: 300, amplitude: 1 }, { frequency: 450, amplitude: 0.7 }, { frequency: 600, amplitude: 0.5 }];
export const FUNDAMENTAL_HZ = 150;
export const CLOSE_TONES: readonly Tone[] = [{ frequency: 440, amplitude: 1 }, { frequency: 444, amplitude: 1 }];
export const MAXIMUM_RECORDING = 0.6;
export const PEAK_TOLERANCE_HZ = 1.5;

export const FREQUENCY_META: RoundGameMeta = {
  id: "frequency-detective",
  title: "Frequency Detective",
  eyebrow: "WAVES & SOUND · ANALYSIS",
  modelTag: "BEATS & SPECTRUM ANALYSIS",
  introduction: "Investigate sounds you cannot hear directly: find a string's pitch from the beats it makes against a reference, read a missing fundamental from a spectrum, and choose a recording long enough to separate two close tones.",
  instructions: "Predict, set your answer, then check it. Beats reveal small frequency differences, and a Fourier spectrum reveals every frequency a sound contains.",
  formula: "f_beat = |f₁ − f₂|  ·  Δf ≈ 1/T  ·  harmonics: fₙ = n f₁",
  formulaCaption: "Two close tones beat at the difference of their frequencies. A recording of length T can separate frequencies that differ by about 1/T or more. A harmonic series has frequencies that are whole-number multiples of the fundamental f₁.",
  explanation: "When two tones of nearby frequency sound together they drift in and out of phase, so the loudness rises and falls |f₁ − f₂| times per second: a piano tuner listens for beats to slow to zero. A Fourier transform splits any recording into its frequencies and shows a peak for each. A set of peaks at 300, 450 and 600 Hz are the 2nd, 3rd and 4th harmonics of 150 Hz, and the ear hears a pitch of 150 Hz even though that frequency is missing. Because a short recording has few cycles, the peaks are wide: you need a recording about 1/Δf long to see two tones Δf apart as two peaks.",
  assumptions: "Pure sinusoidal tones sampled at 2048 Hz with a rectangular window and an FFT, zero padded for a smooth spectrum. There is no background noise. Beat tracking assumes the two tones have equal amplitude.",
  learningObjectives: ["Calculate the beat frequency of two tones.", "Read the fundamental of a harmonic series from a spectrum.", "Relate recording length to frequency resolution."],
  objective: { title: "Solve every case", description: "Identify each sound.", unit: "cases" },
  controlsHeading: "Your findings",
  submitLabel: "Submit findings",
  solvedLabel: "Case solved!",
  nextLabel: "Next case",
};

export const FREQUENCY_ROUNDS: readonly FrequencyRound[] = Object.freeze([
  {
    id: "the-flat-string", title: "The flat string", difficulty: "Beginner", kind: "beats",
    situation: `A string played together with a ${REFERENCE_HZ} Hz tuning fork makes ${OBSERVED_BEATS} beats per second. You can hear that the string is flat, lower in pitch than the fork. What is its frequency? (± ${BEAT_TOLERANCE} Hz)`,
    controls: [fixed("reference", "Tuning fork", "Hz", REFERENCE_HZ), slider("frequency", "String frequency", "Hz", 400, 480, 0.5, 450)],
    hint: "The beat frequency is the difference |f₁ − f₂|. A flat string has the lower frequency.",
  },
  {
    id: "the-missing-fundamental", title: "The missing fundamental", difficulty: "Intermediate", kind: "fundamental",
    situation: "The spectrum of a sound has peaks at 300, 450 and 600 Hz and nothing below. The ear hears one pitch. What is the fundamental frequency of the series? (± 2 Hz)",
    controls: [slider("fundamental", "Fundamental frequency", "Hz", 50, 400, 1, 200)],
    hint: "In a harmonic series every peak is a whole-number multiple of the fundamental: find the largest frequency that divides all three.",
  },
  {
    id: "two-close-tones", title: "Two close tones", difficulty: "Advanced", kind: "resolution",
    situation: `Two tones of 440 Hz and 444 Hz sound together for at most ${MAXIMUM_RECORDING} s. Choose the recording length so the spectrum shows two separate peaks at the right frequencies (within ${PEAK_TOLERANCE_HZ} Hz).`,
    controls: [fixed("rate", "Sample rate", "Hz", SAMPLE_RATE), slider("duration", "Recording length", "s", 0.05, 1.5, 0.05, 0.1)],
    hint: "Frequencies Δf apart need a recording about 1/Δf long. Too short and the two peaks merge into one; longer than the sound lasts, there is nothing left to record.",
  },
]);

/** Spectrum of the signal for a round, from real samples through the FFT. */
export function analyse(round: FrequencyRound, v: NumericControl): SpectrumPoint[] {
  if (round.kind === "beats") {
    return calculateSpectrum(sampleTones([{ frequency: REFERENCE_HZ, amplitude: 1 }, { frequency: v.frequency as number, amplitude: 1 }], SAMPLE_RATE, 1), SAMPLE_RATE, 8192);
  }
  if (round.kind === "fundamental") {
    return calculateSpectrum(sampleTones(HARMONIC_SIGNAL, SAMPLE_RATE, 1), SAMPLE_RATE);
  }
  return calculateSpectrum(sampleTones(CLOSE_TONES, SAMPLE_RATE, v.duration as number), SAMPLE_RATE, 8192);
}

/** The waveform of the two tones for the beats round, to see the envelope. */
export function sampleBeats(v: NumericControl, seconds = 0.5): { x: number; y: number }[] {
  const rate = 6000;
  const samples = sampleTones([{ frequency: REFERENCE_HZ, amplitude: 1 }, { frequency: v.frequency as number, amplitude: 1 }], rate, seconds);
  return Array.from(samples, (y, i) => ({ x: i / rate, y }));
}

export function runFrequency(round: FrequencyRound, v: NumericControl): FrequencyOutcome {
  if (round.kind === "beats") {
    const f = v.frequency as number;
    const beat = calculateBeatFrequency(REFERENCE_HZ, f);
    const beatsRight = Math.abs(beat - OBSERVED_BEATS) <= BEAT_TOLERANCE;
    const flat = f < REFERENCE_HZ;
    const success = beatsRight && flat;
    return {
      beatHz: beat, peaks: [], resolutionHz: null, success, accuracyFraction: success ? 1 - Math.abs(f - FLAT_STRING_HZ) / BEAT_TOLERANCE : 0, predictionActual: FLAT_STRING_HZ,
      feedback: success ? `${f} Hz against ${REFERENCE_HZ} Hz beats at ${beat.toFixed(1)} per second, and a flat string is below the fork: ${FLAT_STRING_HZ} Hz.`
        : beatsRight ? `${f} Hz would also beat ${beat.toFixed(1)} times per second, but it is sharp (higher than the fork) and you heard the string is flat.`
        : `${f} Hz against ${REFERENCE_HZ} Hz beats ${beat.toFixed(1)} times per second, not ${OBSERVED_BEATS}.`,
    };
  }
  if (round.kind === "fundamental") {
    const peaks = findSpectralPeaks(analyse(round, v), 0.2).map((p) => Math.round(p.frequency)).sort((a, b) => a - b);
    const truth = calculateFundamental(peaks);
    const guess = v.fundamental as number;
    const error = Math.abs(guess - truth);
    const success = error <= 2;
    return {
      beatHz: null, peaks, resolutionHz: null, success, accuracyFraction: success ? 1 - error / 2 : 0, predictionActual: truth,
      feedback: success ? `The peaks at ${peaks.join(", ")} Hz are harmonics ${peaks.map((p) => p / truth).join(", ")} of ${truth} Hz: the fundamental is missing from the spectrum but still gives the pitch.`
        : `${guess} Hz does not divide the peaks ${peaks.join(", ")} Hz into whole-number harmonics. ${guess > truth ? "Look for a lower frequency" : "Each peak must be a whole-number multiple"} of the fundamental.`,
    };
  }
  const duration = v.duration as number;
  const spectrum = analyse(round, v);
  const peaks = findSpectralPeaks(spectrum.filter((p) => p.frequency > 400 && p.frequency < 480), 0.5).map((p) => p.frequency).sort((a, b) => a - b);
  const separation = 4;
  const resolved = peaks.length === 2 && Math.abs(peaks[0]! - 440) <= PEAK_TOLERANCE_HZ && Math.abs(peaks[1]! - 444) <= PEAK_TOLERANCE_HZ;
  const minimum = calculateResolutionTime(separation);
  const success = resolved && duration <= MAXIMUM_RECORDING + 1e-9;
  return {
    beatHz: calculateBeatFrequency(440, 444), peaks, resolutionHz: 1 / duration, success,
    accuracyFraction: success ? Math.max(0, 1 - (duration - minimum) / (MAXIMUM_RECORDING - minimum + 1e-9)) : 0, predictionActual: minimum,
    feedback: success ? `A ${duration} s recording has a resolution of about ${(1 / duration).toFixed(1)} Hz, enough to separate the 4 Hz gap: peaks at ${peaks.map((p) => p.toFixed(1)).join(" and ")} Hz.`
      : !resolved ? `With a ${duration} s recording the resolution is only about ${(1 / duration).toFixed(1)} Hz, so the tones 4 Hz apart ${peaks.length < 2 ? "merge into one peak" : "are not clearly separated"}. You need roughly 1/Δf = 0.25 s or more.`
      : `The peaks are separate, but the sound only lasts ${MAXIMUM_RECORDING} s: a ${duration} s recording runs past it.`,
  };
}

export const frequencyDetective = defineNumericGame<FrequencyRound, FrequencyOutcome>({
  meta: FREQUENCY_META,
  rounds: FREQUENCY_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "beats" ? { label: "Your prediction of the string's frequency", unit: "Hz", placeholder: "e.g. 436", step: 0.5 }
    : round.kind === "fundamental" ? { label: "Your prediction of the fundamental", unit: "Hz", placeholder: "e.g. 150", step: 1 }
    : { label: "Your prediction of the shortest useful recording", unit: "s", placeholder: "e.g. 0.25", step: 0.01 },
  evaluate: (round, values) => runFrequency(round, values),
});
