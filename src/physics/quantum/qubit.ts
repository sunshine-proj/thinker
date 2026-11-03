import { assertFiniteNumber } from "../core";

/**
 * A two-state quantum system (qubit, spin-½ or photon polarization).
 *
 * A pure state is |ψ⟩ = α|0⟩ + β|1⟩ with |α|² + |β|² = 1; measuring gives 0 with probability |α|² and 1 with
 * probability |β|². With the state written as cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩, P(0) = cos²(θ/2). In a
 * two-path interferometer (beam splitter, phase shift φ, beam splitter) the probability of leaving by the first
 * port is cos²(φ/2). For photon polarization, a polarizer at angle θ to the polarization passes cos²θ of the
 * intensity (Malus's law), and a sequence of polarizers multiplies those factors.
 *
 * Limitations: single idealized systems without decoherence, loss or detector inefficiency. Probabilities are
 * exact; sampled counts only approach them for many trials.
 */
export function calculateProbabilityZero(thetaRadians: number): number {
  assertFiniteNumber(thetaRadians, "thetaRadians");
  return Math.cos(thetaRadians / 2) ** 2;
}

export function calculateInterferometerProbability(phaseRadians: number): number {
  assertFiniteNumber(phaseRadians, "phaseRadians");
  return Math.cos(phaseRadians / 2) ** 2;
}

/** Fraction of polarized light passing a chain of ideal polarizers at the given absolute angles (radians). */
export function calculatePolarizerChainTransmission(sourceAngle: number, polarizerAngles: readonly number[]): number {
  let angle = sourceAngle;
  let transmission = 1;
  for (const next of polarizerAngles) {
    assertFiniteNumber(next, "polarizer angle");
    transmission *= Math.cos(next - angle) ** 2;
    angle = next;
  }
  return transmission;
}

/** Normalization check for amplitudes. */
export function isNormalized(amplitudes: readonly number[], tolerance = 1e-9): boolean {
  return Math.abs(amplitudes.reduce((sum, a) => sum + a * a, 0) - 1) <= tolerance;
}

/** Counts of outcome 0 in `trials` independent measurements, using a supplied uniform [0,1) generator. */
export function sampleMeasurements(probabilityZero: number, trials: number, random: () => number): number {
  if (!(probabilityZero >= 0 && probabilityZero <= 1)) {
    throw new RangeError("The probability must be between 0 and 1.");
  }
  if (!Number.isInteger(trials) || trials < 0) {
    throw new RangeError("trials must be a non-negative integer.");
  }
  let zeros = 0;
  for (let i = 0; i < trials; i += 1) {
    if (random() < probabilityZero) zeros += 1;
  }
  return zeros;
}
