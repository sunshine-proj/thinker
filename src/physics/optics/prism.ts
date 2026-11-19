import { assertPositive } from "../core";

/**
 * Dispersion in a glass prism.
 *
 * Crown glass (BK7-like) refractive index from Cauchy's formula n = A + B/λ², with
 * A = 1.5046 and B = 4200 nm² (n = 1.5168 at 589 nm). A ray meeting a prism of apex angle
 * α at incidence θ₁ refracts in (sinθ₁ = n sinθ₂), crosses to the second face where
 * θ₃ = α − θ₂, and leaves at θ₄ with sinθ₄ = n sinθ₃. Its deviation is δ = θ₁ + θ₄ − α.
 * Blue light has a larger n, so it bends more than red: white light fans into a spectrum.
 *
 * Assumptions: a ray in the prism's principal plane, air around the prism, Cauchy's two
 * terms (good to about 0.001 in n across the visible).
 */

export function calculateCrownGlassIndex(wavelengthNm: number): number {
  assertPositive(wavelengthNm, "wavelengthNm");
  return 1.5046 + 4200 / wavelengthNm ** 2;
}

/** Deviation (degrees), or null if the ray is totally reflected inside the prism. */
export function calculatePrismDeviation(incidenceDegrees: number, apexDegrees: number, refractiveIndex: number): number | null {
  assertPositive(refractiveIndex, "refractiveIndex");
  const rad = Math.PI / 180;
  const theta2 = Math.asin(Math.sin(incidenceDegrees * rad) / refractiveIndex);
  const theta3 = apexDegrees * rad - theta2;
  const sine4 = refractiveIndex * Math.sin(theta3);
  if (Math.abs(sine4) > 1) {
    return null;
  }
  return incidenceDegrees + Math.asin(sine4) / rad - apexDegrees;
}
