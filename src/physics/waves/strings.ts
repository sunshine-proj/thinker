import { assertPositive } from "../core";

/**
 * Standing waves on a stretched string fixed at both ends.
 *
 * Wave speed v = √(T/μ) for tension T and linear density μ. The allowed modes have n half-wavelengths on the
 * string, fₙ = n v / (2L) = (n/2L) √(T/μ). Pressing the string against a fret shortens the vibrating length to
 * L − x. Touching the string lightly at a point p·L silences every mode that has no node there, so the lowest
 * remaining mode is n = the smallest integer for which n·p is a whole number.
 *
 * Limitations: ideal, perfectly flexible string with small displacements; real strings have stiffness that
 * slightly raises the higher harmonics (inharmonicity), and the body of the instrument is not modelled.
 */
export function calculateStringWaveSpeed(tensionNewtons: number, linearDensityKgPerMeter: number): number {
  assertPositive(tensionNewtons, "tensionNewtons");
  assertPositive(linearDensityKgPerMeter, "linearDensityKgPerMeter");
  return Math.sqrt(tensionNewtons / linearDensityKgPerMeter);
}

export function calculateStringFrequency(
  lengthMeters: number,
  tensionNewtons: number,
  linearDensityKgPerMeter: number,
  mode = 1,
): number {
  assertPositive(lengthMeters, "lengthMeters");
  if (!Number.isInteger(mode) || mode < 1) {
    throw new RangeError("The mode number must be a positive integer.");
  }
  return (mode * calculateStringWaveSpeed(tensionNewtons, linearDensityKgPerMeter)) / (2 * lengthMeters);
}

/** Tension giving fundamental frequency f on a string of length L: T = μ (2 L f)². */
export function calculateTensionForFrequency(lengthMeters: number, linearDensityKgPerMeter: number, frequencyHz: number): number {
  assertPositive(lengthMeters, "lengthMeters");
  assertPositive(linearDensityKgPerMeter, "linearDensityKgPerMeter");
  assertPositive(frequencyHz, "frequencyHz");
  return linearDensityKgPerMeter * (2 * lengthMeters * frequencyHz) ** 2;
}

/** Fundamental frequency when the string is pressed down `fingerDistanceMeters` from the nut. */
export function calculateFrettedFrequency(openFrequencyHz: number, lengthMeters: number, fingerDistanceMeters: number): number {
  assertPositive(openFrequencyHz, "openFrequencyHz");
  assertPositive(lengthMeters, "lengthMeters");
  if (fingerDistanceMeters < 0 || fingerDistanceMeters >= lengthMeters) {
    throw new RangeError("The finger must press the string somewhere along its length.");
  }
  return (openFrequencyHz * lengthMeters) / (lengthMeters - fingerDistanceMeters);
}

/**
 * Lowest harmonic sounded when the string is touched at fraction `fraction` of its length (0 < p < 1), or null if
 * the point is not within `tolerance` (in units of one node spacing·n) of a node of any of the first `maxMode` modes.
 */
export function calculateTouchedHarmonic(fraction: number, maxMode = 8, tolerance = 0.02): number | null {
  if (!(fraction > 0 && fraction < 1)) {
    throw new RangeError("The touch position must be strictly between the two ends.");
  }
  for (let n = 2; n <= maxMode; n += 1) {
    const nodes = n * fraction;
    if (Math.abs(nodes - Math.round(nodes)) <= tolerance && Math.round(nodes) >= 1 && Math.round(nodes) < n) {
      return n;
    }
  }
  return null;
}

/** Displacement shape of mode n at fraction p of the length: sin(nπp). */
export function calculateModeShape(mode: number, fraction: number): number {
  if (!Number.isInteger(mode) || mode < 1) {
    throw new RangeError("The mode number must be a positive integer.");
  }
  return Math.sin(mode * Math.PI * fraction);
}
