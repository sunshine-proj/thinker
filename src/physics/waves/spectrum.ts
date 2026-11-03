import { assertPositive } from "../core";

/**
 * Spectrum analysis and beats.
 *
 * Two tones of frequencies f₁ and f₂ added together beat at |f₁ − f₂|: the loudness rises and falls that many
 * times per second. A recording of duration T has frequency resolution Δf ≈ 1/T, so two tones closer than about
 * 1/T cannot be told apart. The spectrum is computed with a radix-2 fast Fourier transform after zero padding
 * the samples to a power of two; the amplitude of a sinusoid A sin(2π f t) appears as a peak of height ≈ A.
 *
 * Limitations: rectangular window (spectral leakage appears as side lobes), no averaging of noise, and peak
 * frequencies are quantised to the padded bin width.
 */
export interface SpectrumPoint {
  readonly frequency: number;
  readonly amplitude: number;
}

export interface Tone {
  readonly frequency: number;
  readonly amplitude: number;
}

export function calculateBeatFrequency(firstHz: number, secondHz: number): number {
  assertPositive(firstHz, "firstHz");
  assertPositive(secondHz, "secondHz");
  return Math.abs(firstHz - secondHz);
}

/** Shortest recording that can separate two tones `separationHz` apart: T ≈ 1/Δf. */
export function calculateResolutionTime(separationHz: number): number {
  assertPositive(separationHz, "separationHz");
  return 1 / separationHz;
}

/** Samples of a sum of sinusoids, taken at `sampleRate` for `durationSeconds`. */
export function sampleTones(tones: readonly Tone[], sampleRate: number, durationSeconds: number): Float64Array {
  assertPositive(sampleRate, "sampleRate");
  assertPositive(durationSeconds, "durationSeconds");
  const count = Math.max(1, Math.round(sampleRate * durationSeconds));
  const samples = new Float64Array(count);
  for (const tone of tones) {
    assertPositive(tone.frequency, "tone frequency");
    if (tone.frequency >= sampleRate / 2) {
      throw new RangeError("Tones must be below the Nyquist frequency (half the sample rate).");
    }
  }
  for (let i = 0; i < count; i += 1) {
    let value = 0;
    for (const tone of tones) {
      value += tone.amplitude * Math.sin((2 * Math.PI * tone.frequency * i) / sampleRate);
    }
    samples[i] = value;
  }
  return samples;
}

function fft(real: Float64Array, imaginary: Float64Array): void {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j]!, real[i]!];
      [imaginary[i], imaginary[j]] = [imaginary[j]!, imaginary[i]!];
    }
  }
  for (let length = 2; length <= n; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    for (let start = 0; start < n; start += length) {
      for (let k = 0; k < length / 2; k += 1) {
        const wr = Math.cos(angle * k);
        const wi = Math.sin(angle * k);
        const a = start + k;
        const b = a + length / 2;
        const tr = real[b]! * wr - imaginary[b]! * wi;
        const ti = real[b]! * wi + imaginary[b]! * wr;
        real[b] = real[a]! - tr;
        imaginary[b] = imaginary[a]! - ti;
        real[a] = real[a]! + tr;
        imaginary[a] = imaginary[a]! + ti;
      }
    }
  }
}

/** One-sided amplitude spectrum, zero padded to at least `minimumPadding` samples (rounded up to a power of two). */
export function calculateSpectrum(samples: Float64Array, sampleRate: number, minimumPadding = 0): SpectrumPoint[] {
  assertPositive(sampleRate, "sampleRate");
  if (samples.length < 2) {
    throw new RangeError("At least two samples are needed.");
  }
  let size = 1;
  while (size < Math.max(samples.length, minimumPadding)) {
    size <<= 1;
  }
  const real = new Float64Array(size);
  real.set(samples);
  const imaginary = new Float64Array(size);
  fft(real, imaginary);
  const points: SpectrumPoint[] = [];
  for (let k = 0; k <= size / 2; k += 1) {
    const magnitude = Math.hypot(real[k]!, imaginary[k]!);
    points.push({ frequency: (k * sampleRate) / size, amplitude: (2 * magnitude) / samples.length });
  }
  return points;
}

/** Local maxima of the spectrum at least `threshold` × the tallest peak, tallest first. */
export function findSpectralPeaks(spectrum: readonly SpectrumPoint[], threshold = 0.2): SpectrumPoint[] {
  const tallest = Math.max(...spectrum.map((p) => p.amplitude));
  const peaks: SpectrumPoint[] = [];
  for (let i = 1; i < spectrum.length - 1; i += 1) {
    const p = spectrum[i]!;
    if (p.amplitude >= threshold * tallest && p.amplitude > spectrum[i - 1]!.amplitude && p.amplitude >= spectrum[i + 1]!.amplitude) {
      peaks.push(p);
    }
  }
  return peaks.sort((a, b) => b.amplitude - a.amplitude);
}

/** Greatest common divisor of frequencies, found by rounding to `resolutionHz`: the fundamental of a harmonic series. */
export function calculateFundamental(frequencies: readonly number[], resolutionHz = 1): number {
  assertPositive(resolutionHz, "resolutionHz");
  if (frequencies.length === 0) {
    throw new RangeError("At least one frequency is needed.");
  }
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  return frequencies.map((f) => Math.round(f / resolutionHz)).reduce(gcd) * resolutionHz;
}
