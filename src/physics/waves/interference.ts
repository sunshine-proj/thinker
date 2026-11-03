import { assertPositive } from "../core";

/**
 * Interference of two coherent sources of equal amplitude and wavelength λ.
 *
 * At a point whose distances to the sources are r₁ and r₂ the path difference is Δ = |r₁ − r₂|. The waves are in
 * phase (loudest, or brightest) when Δ = mλ and in antiphase (silent) when Δ = (m + ½)λ. The intensity is
 * I = I_max cos²(πΔ/λ), with I_max four times a single source's intensity. For a double slit of separation d and a
 * screen at distance L ≫ d, bright fringes are spaced Δy = λL/d apart.
 *
 * Limitations: point sources of equal strength in free space, the far-field fringe formula holds only for small
 * angles, and reflections and the decay of amplitude with distance are neglected.
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

export function calculatePathDifference(point: Point, first: Point, second: Point): number {
  return Math.abs(Math.hypot(point.x - first.x, point.y - first.y) - Math.hypot(point.x - second.x, point.y - second.y));
}

/** Relative intensity I/I_max = cos²(πΔ/λ), between 0 (cancelling) and 1 (reinforcing). */
export function calculateRelativeIntensity(pathDifferenceMeters: number, wavelengthMeters: number): number {
  assertPositive(wavelengthMeters, "wavelengthMeters");
  if (pathDifferenceMeters < 0) {
    throw new RangeError("The path difference must not be negative.");
  }
  return Math.cos((Math.PI * pathDifferenceMeters) / wavelengthMeters) ** 2;
}

export type InterferenceKind = "constructive" | "destructive" | "partial";

export function classifyInterference(relativeIntensity: number, tolerance = 0.05): InterferenceKind {
  if (relativeIntensity >= 1 - tolerance) {
    return "constructive";
  }
  return relativeIntensity <= tolerance ? "destructive" : "partial";
}

/** Fringe spacing on a distant screen, Δy = λL/d, in meters. */
export function calculateFringeSpacing(wavelengthMeters: number, screenDistanceMeters: number, slitSeparationMeters: number): number {
  assertPositive(wavelengthMeters, "wavelengthMeters");
  assertPositive(screenDistanceMeters, "screenDistanceMeters");
  assertPositive(slitSeparationMeters, "slitSeparationMeters");
  return (wavelengthMeters * screenDistanceMeters) / slitSeparationMeters;
}

/** Slit separation that gives a required fringe spacing: d = λL/Δy. */
export function calculateSlitSeparation(wavelengthMeters: number, screenDistanceMeters: number, fringeSpacingMeters: number): number {
  return calculateFringeSpacing(wavelengthMeters, screenDistanceMeters, fringeSpacingMeters);
}

/** Relative intensity at height y on a screen, using exact path lengths from two slits at ±d/2. */
export function calculateScreenIntensity(
  wavelengthMeters: number,
  screenDistanceMeters: number,
  slitSeparationMeters: number,
  heightMeters: number,
): number {
  const slitA = { x: 0, y: slitSeparationMeters / 2 };
  const slitB = { x: 0, y: -slitSeparationMeters / 2 };
  const delta = calculatePathDifference({ x: screenDistanceMeters, y: heightMeters }, slitA, slitB);
  return calculateRelativeIntensity(delta, wavelengthMeters);
}
