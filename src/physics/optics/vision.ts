import { assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * A simple model of the eye's focusing, measured in diopters (1/m).
 *
 * To put an object at distance d in focus on the retina, the eye needs optical power 1/L + 1/d, where L is the
 * eye's length. Relative to focusing on infinity, the object therefore needs an extra vergence Δ = 1/d (diopters).
 * An eye has a refractive error E: its relaxed power exceeds the infinity-focus power by E diopters (E > 0 is
 * short-sighted/myopic, E < 0 is long-sighted/hyperopic), and it can add up to A diopters by accommodating. Its
 * range of clear vision is therefore Δ ∈ [E + P, E + P + A] when a lens of power P is worn in front of it.
 * Far point = 1/E, near point = 1/(E + A).
 *
 * Limitations: a thin-lens eye with the correction at the eye (no vertex distance), no astigmatism, and a
 * fixed pupil with no depth-of-field effects beyond a small blur tolerance.
 */
export interface Eye {
  /** Refractive error in diopters (positive = myopic). */
  readonly refractiveErrorDiopters: number;
  /** Accommodation range in diopters. */
  readonly accommodationDiopters: number;
}

/** Extra vergence of an object at distance d relative to infinity: Δ = 1/d. */
export function calculateObjectVergence(distanceMeters: number): number {
  assertPositive(distanceMeters, "distanceMeters");
  return 1 / distanceMeters;
}

/** Defocus in diopters (0 when the object lies within the eye's clear range). */
export function calculateDefocus(eye: Eye, lensPowerDiopters: number, objectDistanceMeters: number): number {
  assertNonNegative(eye.accommodationDiopters, "accommodation");
  assertFiniteNumber(eye.refractiveErrorDiopters, "refractiveError");
  assertFiniteNumber(lensPowerDiopters, "lensPowerDiopters");
  const vergence = calculateObjectVergence(objectDistanceMeters);
  const lower = eye.refractiveErrorDiopters + lensPowerDiopters;
  const upper = lower + eye.accommodationDiopters;
  return Math.max(0, lower - vergence, vergence - upper);
}

/** Far point (m) of an eye wearing a lens; Infinity when the eye can focus on infinity. */
export function calculateFarPoint(eye: Eye, lensPowerDiopters = 0): number {
  const lower = eye.refractiveErrorDiopters + lensPowerDiopters;
  return lower <= 0 ? Number.POSITIVE_INFINITY : 1 / lower;
}

/** Near point (m): the closest object that can be focused. */
export function calculateNearPoint(eye: Eye, lensPowerDiopters = 0): number {
  const upper = eye.refractiveErrorDiopters + lensPowerDiopters + eye.accommodationDiopters;
  return upper <= 0 ? Number.POSITIVE_INFINITY : 1 / upper;
}

/** Lens power that moves a far point from `farPointMeters` to infinity: P = −1/far point. */
export function calculateCorrectionForFarPoint(farPointMeters: number): number {
  assertPositive(farPointMeters, "farPointMeters");
  return -1 / farPointMeters;
}
