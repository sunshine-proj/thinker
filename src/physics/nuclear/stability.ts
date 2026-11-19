/**
 * Which light nuclei (up to magnesium, Z ≤ 12) are stable, from measured data.
 *
 * Every stable nuclide with Z ≤ 12 is listed as [Z, A]. Any other combination is unstable;
 * it is classified by comparing it with the stable nuclei of the same mass number A
 * (isobars): with fewer protons than they have it has too many neutrons and decays by
 * β⁻ (a neutron becomes a proton); with more protons it decays by β⁺ or electron capture.
 * Mass numbers 5 and 8 have no stable nucleus at all, and such nuclei fall apart at once
 * (He-5 and Li-5 shed a nucleon, Be-8 splits into two alpha particles).
 *
 * Limitations: Z and N between 0 and 12, a yes/no notion of stability (a nucleus with a
 * half-life of 10¹⁶ years counts as unstable here only if it is not in the stable list),
 * and a simplified decay description for the unstable ones (some emit protons or
 * neutrons rather than beta particles).
 */
export const STABLE_LIGHT_NUCLEI: readonly (readonly [number, number])[] = Object.freeze([
  [1, 1], [1, 2], [2, 3], [2, 4], [3, 6], [3, 7], [4, 9], [5, 10], [5, 11], [6, 12], [6, 13],
  [7, 14], [7, 15], [8, 16], [8, 17], [8, 18], [9, 19], [10, 20], [10, 21], [10, 22], [11, 23],
  [12, 24], [12, 25], [12, 26],
]);

const SYMBOLS = ["n", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg"] as const;

export function elementSymbol(protons: number): string {
  const symbol = SYMBOLS[protons];
  if (symbol === undefined) {
    throw new RangeError("Only elements up to magnesium (Z = 12) are covered.");
  }
  return symbol;
}

export type NucleusVerdict = "stable" | "beta-minus" | "beta-plus" | "falls-apart";

export function classifyLightNucleus(protons: number, neutrons: number): NucleusVerdict {
  if (!Number.isInteger(protons) || !Number.isInteger(neutrons) || protons < 1 || protons > 12 || neutrons < 0 || neutrons > 14) {
    throw new RangeError("Protons must be 1–12 and neutrons 0–14.");
  }
  const massNumber = protons + neutrons;
  if (STABLE_LIGHT_NUCLEI.some(([z, a]) => z === protons && a === massNumber)) return "stable";
  const isobars = STABLE_LIGHT_NUCLEI.filter(([, a]) => a === massNumber).map(([z]) => z);
  if (isobars.length === 0) return "falls-apart";
  return protons < Math.min(...isobars) ? "beta-minus" : "beta-plus";
}
