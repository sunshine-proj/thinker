import { assertFiniteNumber, assertPositive } from "../core";

/** Speed of sound in air at 20 °C, m/s, used for wavelength calculations in the Sound Creator. */
export const SOUND_SPEED_20C = 343;
/** Frequency of concert A (A4), Hz. */
export const CONCERT_A_HZ = 440;

export type Waveform = "sine" | "square" | "triangle" | "sawtooth";

/**
 * Pure tones and simple synthesis.
 *
 * A tone of frequency f has period T = 1/f and, in air, wavelength λ = v/f. Equal temperament puts the pitch of
 * MIDI note n at 440 · 2^((n − 69)/12). Sound pressure amplitude A relates to level by ΔL = 20 log₁₀(A₂/A₁) dB.
 * Any periodic waveform is a sum of harmonics (Fourier series): a square wave has odd harmonics with amplitude
 * 1/n, a triangle odd harmonics with 1/n² and alternating sign, a sawtooth every harmonic with 1/n.
 *
 * Limitations: ideal waveforms without attack/decay or room acoustics; level changes are relative, not absolute
 * sound pressure levels.
 */
export function calculatePeriod(frequencyHz: number): number {
  assertPositive(frequencyHz, "frequencyHz");
  return 1 / frequencyHz;
}

export function calculateWavelength(frequencyHz: number, speedMetersPerSecond = SOUND_SPEED_20C): number {
  assertPositive(frequencyHz, "frequencyHz");
  assertPositive(speedMetersPerSecond, "speedMetersPerSecond");
  return speedMetersPerSecond / frequencyHz;
}

/** Equal-tempered frequency of a MIDI note number (69 = A4 = 440 Hz). */
export function calculateNoteFrequency(midiNote: number): number {
  assertFiniteNumber(midiNote, "midiNote");
  return CONCERT_A_HZ * 2 ** ((midiNote - 69) / 12);
}

/** Level change in decibels when the pressure amplitude goes from `reference` to `amplitude`. */
export function calculateLevelChangeDecibels(amplitude: number, reference: number): number {
  assertPositive(amplitude, "amplitude");
  assertPositive(reference, "reference");
  return 20 * Math.log10(amplitude / reference);
}

/** Amplitude ratio that produces a level change of `decibels`. */
export function calculateAmplitudeRatio(decibels: number): number {
  assertFiniteNumber(decibels, "decibels");
  return 10 ** (decibels / 20);
}

/** Amplitude of the n-th harmonic (n ≥ 1) of a unit-fundamental waveform; signed for the triangle wave. */
export function calculateHarmonicAmplitude(waveform: Waveform, n: number): number {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError("The harmonic number must be a positive integer.");
  }
  const odd = n % 2 === 1;
  switch (waveform) {
    case "sine":
      return n === 1 ? 1 : 0;
    case "square":
      return odd ? 1 / n : 0;
    case "triangle":
      return odd ? ((n - 1) / 2 % 2 === 0 ? 1 : -1) / (n * n) : 0;
    case "sawtooth":
      return 1 / n;
  }
}

/** Sum of sinusoidal harmonics at time t: Σ aₙ sin(2π n f t). */
export function synthesizeHarmonics(frequencyHz: number, harmonicAmplitudes: readonly number[], timeSeconds: number): number {
  assertPositive(frequencyHz, "frequencyHz");
  assertFiniteNumber(timeSeconds, "timeSeconds");
  let sum = 0;
  harmonicAmplitudes.forEach((amplitude, index) => {
    sum += amplitude * Math.sin(2 * Math.PI * (index + 1) * frequencyHz * timeSeconds);
  });
  return sum;
}
