import { assertPositive } from "../core";

/**
 * Thin-film interference in reflected light.
 *
 * Light reflected from the front and back of a film of index n and thickness t travels
 * an extra optical path 2 n t (near-normal incidence). A reflection off a higher-index
 * medium inverts the wave (half a wavelength). For a soap film in air only the front
 * reflection inverts, so reflection is strongest when 2 n t = (m + ½) λ and weakest when
 * 2 n t = m λ. For a coating between air and glass (n_air < n_film < n_glass) both
 * reflections invert, so reflection is weakest when 2 n t = (m + ½) λ.
 *
 * Inputs: metres or nanometres consistently. Assumptions: normal incidence, uniform film,
 * no absorption. Limitations: intensities are not calculated, only the conditions.
 */

/** True when exactly one of the two reflections inverts the wave. */
export function hasOneInversion(outerIndex: number, filmIndex: number, substrateIndex: number): boolean {
  assertPositive(outerIndex, "outerIndex");
  assertPositive(filmIndex, "filmIndex");
  assertPositive(substrateIndex, "substrateIndex");
  return (filmIndex > outerIndex) !== (substrateIndex > filmIndex);
}

/** Wavelengths (same unit as thickness) reflected most strongly, within [min, max]. */
export function calculateReinforcedWavelengths(
  thickness: number,
  filmIndex: number,
  oneInversion: boolean,
  minimum: number,
  maximum: number,
): number[] {
  assertPositive(thickness, "thickness");
  assertPositive(filmIndex, "filmIndex");
  const path = 2 * filmIndex * thickness;
  const result: number[] = [];
  for (let m = 0; m < 1000; m += 1) {
    const lambda = oneInversion ? path / (m + 0.5) : m === 0 ? Number.POSITIVE_INFINITY : path / m;
    if (lambda < minimum) {
      break;
    }
    if (lambda <= maximum) {
      result.push(lambda);
    }
  }
  return result;
}

/** Thinnest film (same unit as λ) that reinforces (or, with cancel = true, cancels) a wavelength. */
export function calculateThinnestFilm(wavelength: number, filmIndex: number, oneInversion: boolean, cancel = false): number {
  assertPositive(wavelength, "wavelength");
  assertPositive(filmIndex, "filmIndex");
  // Reinforce: (m + ½) with one inversion, m (m ≥ 1) with none. Cancel: the other way round.
  const halfOrder = oneInversion !== cancel;
  return (halfOrder ? 0.5 : 1) * wavelength / (2 * filmIndex);
}

/** Relative reflected intensity factor cos²(δ/2) of the two-beam interference (0 dark, 1 bright). */
export function calculateTwoBeamFactor(thickness: number, filmIndex: number, wavelength: number, oneInversion: boolean): number {
  assertPositive(wavelength, "wavelength");
  const phase = (2 * Math.PI * 2 * filmIndex * thickness) / wavelength + (oneInversion ? Math.PI : 0);
  return Math.cos(phase / 2) ** 2;
}
