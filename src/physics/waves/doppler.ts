import { assertFiniteNumber, assertPositive } from "../core";

/**
 * The Doppler effect for sound.
 *
 * f' = f (v + v_o) / (v − v_s), with v the speed of sound in still air, v_o > 0 when the
 * observer moves toward the source and v_s > 0 when the source moves toward the
 * observer. From the pitch heard while a source approaches (f_a) and recedes (f_r), its
 * speed is v_s = v (f_a − f_r)/(f_a + f_r) and its true frequency 2 f_a f_r/(f_a + f_r).
 *
 * Inputs SI. Assumptions: still air, motion along the line between source and observer,
 * speeds below the speed of sound. Limitations: no wind, no relativistic effects (needed
 * only for light).
 */

/** Observed frequency (Hz). */
export function calculateDopplerFrequency(sourceHz: number, soundSpeed: number, observerSpeedToward: number, sourceSpeedToward: number): number {
  assertPositive(sourceHz, "sourceHz");
  assertPositive(soundSpeed, "soundSpeed");
  assertFiniteNumber(observerSpeedToward, "observerSpeedToward");
  assertFiniteNumber(sourceSpeedToward, "sourceSpeedToward");
  if (Math.abs(sourceSpeedToward) >= soundSpeed || Math.abs(observerSpeedToward) >= soundSpeed) {
    throw new RangeError("Speeds must stay below the speed of sound.");
  }
  return (sourceHz * (soundSpeed + observerSpeedToward)) / (soundSpeed - sourceSpeedToward);
}

/** Source speed (m/s) from the approaching and receding frequencies. */
export function calculateSourceSpeedFromShift(approachHz: number, recedeHz: number, soundSpeed: number): number {
  assertPositive(approachHz, "approachHz");
  assertPositive(recedeHz, "recedeHz");
  assertPositive(soundSpeed, "soundSpeed");
  return (soundSpeed * (approachHz - recedeHz)) / (approachHz + recedeHz);
}

/** True emitted frequency (Hz) from the approaching and receding frequencies. */
export function calculateRestFrequencyFromShift(approachHz: number, recedeHz: number): number {
  assertPositive(approachHz, "approachHz");
  assertPositive(recedeHz, "recedeHz");
  return (2 * approachHz * recedeHz) / (approachHz + recedeHz);
}
