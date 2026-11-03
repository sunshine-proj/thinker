import { ATOMIC_MASS_UNIT_MEV } from "../core";

/**
 * Nuclear masses, binding energy and radioactive decay bookkeeping.
 *
 * The binding energy of a nucleus with Z protons and N neutrons is B = (Z m_H + N m_n − M_atom) c², where M_atom is
 * the neutral atomic mass (the electron masses cancel with those in hydrogen atoms) and 1 u = 931.494 MeV/c². This
 * is the energy released when the nucleus forms from separate nucleons, and B/A, the binding energy per nucleon,
 * peaks near iron and nickel (A ≈ 56–62), so fusing light nuclei or splitting heavy ones releases energy. For
 * nuclei not in the table the semi-empirical (liquid-drop) mass formula
 *     B = a_v A − a_s A^(2/3) − a_c Z(Z−1)/A^(1/3) − a_a (A − 2Z)²/A ± a_p/A^(1/2)
 * gives the trend, accurate to a few percent for A > 20. Alpha decay lowers (Z, A) by (2, 4), beta-minus decay
 * raises Z by 1 at constant A, and beta-plus lowers Z by 1.
 *
 * Limitations: the table holds a few dozen nuclides only; the liquid-drop formula ignores shell structure (the
 * magic numbers) and is poor for very light nuclei; half-lives are rounded literature values.
 */
export const HYDROGEN_ATOM_MASS_U = 1.00782503223;
export const NEUTRON_MASS_U = 1.00866491595;

export type DecayMode = "stable" | "alpha" | "beta-minus" | "beta-plus" | "fission-product";

export interface Nuclide {
  readonly symbol: string;
  readonly protons: number;
  readonly massNumber: number;
  /** Neutral atomic mass, u. */
  readonly atomicMass: number;
  /** Half-life, s; null for stable nuclides. */
  readonly halfLifeSeconds: number | null;
  readonly mode: DecayMode;
}

const DAY = 86400;
const YEAR = 365.25 * DAY;

export const NUCLIDES: readonly Nuclide[] = Object.freeze([
  { symbol: "H-1", protons: 1, massNumber: 1, atomicMass: 1.00782503223, halfLifeSeconds: null, mode: "stable" },
  { symbol: "H-2", protons: 1, massNumber: 2, atomicMass: 2.01410177812, halfLifeSeconds: null, mode: "stable" },
  { symbol: "H-3", protons: 1, massNumber: 3, atomicMass: 3.0160492779, halfLifeSeconds: 12.32 * YEAR, mode: "beta-minus" },
  { symbol: "He-3", protons: 2, massNumber: 3, atomicMass: 3.0160293201, halfLifeSeconds: null, mode: "stable" },
  { symbol: "He-4", protons: 2, massNumber: 4, atomicMass: 4.00260325413, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Li-6", protons: 3, massNumber: 6, atomicMass: 6.0151228874, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Li-7", protons: 3, massNumber: 7, atomicMass: 7.0160034366, halfLifeSeconds: null, mode: "stable" },
  { symbol: "C-12", protons: 6, massNumber: 12, atomicMass: 12, halfLifeSeconds: null, mode: "stable" },
  { symbol: "C-14", protons: 6, massNumber: 14, atomicMass: 14.0032419884, halfLifeSeconds: 5730 * YEAR, mode: "beta-minus" },
  { symbol: "O-16", protons: 8, massNumber: 16, atomicMass: 15.99491461957, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Ca-40", protons: 20, massNumber: 40, atomicMass: 39.9625909, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Fe-56", protons: 26, massNumber: 56, atomicMass: 55.9349363, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Co-60", protons: 27, massNumber: 60, atomicMass: 59.9338171, halfLifeSeconds: 5.2714 * YEAR, mode: "beta-minus" },
  { symbol: "Ni-62", protons: 28, massNumber: 62, atomicMass: 61.9283448, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Kr-92", protons: 36, massNumber: 92, atomicMass: 91.926156, halfLifeSeconds: 1.84, mode: "beta-minus" },
  { symbol: "I-131", protons: 53, massNumber: 131, atomicMass: 130.9061263, halfLifeSeconds: 8.0252 * DAY, mode: "beta-minus" },
  { symbol: "Xe-131", protons: 54, massNumber: 131, atomicMass: 130.9050841, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Ba-141", protons: 56, massNumber: 141, atomicMass: 140.914411, halfLifeSeconds: 18.27 * 60, mode: "beta-minus" },
  { symbol: "Pb-206", protons: 82, massNumber: 206, atomicMass: 205.9744653, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Pb-208", protons: 82, massNumber: 208, atomicMass: 207.9766525, halfLifeSeconds: null, mode: "stable" },
  { symbol: "Rn-222", protons: 86, massNumber: 222, atomicMass: 222.0175782, halfLifeSeconds: 3.8235 * DAY, mode: "alpha" },
  { symbol: "Ra-226", protons: 88, massNumber: 226, atomicMass: 226.0254103, halfLifeSeconds: 1600 * YEAR, mode: "alpha" },
  { symbol: "U-235", protons: 92, massNumber: 235, atomicMass: 235.0439301, halfLifeSeconds: 7.04e8 * YEAR, mode: "alpha" },
  { symbol: "U-238", protons: 92, massNumber: 238, atomicMass: 238.0507884, halfLifeSeconds: 4.468e9 * YEAR, mode: "alpha" },
]);

export function findNuclide(symbol: string): Nuclide {
  const found = NUCLIDES.find((n) => n.symbol === symbol);
  if (!found) {
    throw new RangeError(`Unknown nuclide ${symbol}.`);
  }
  return found;
}

export function findNuclideByNumbers(protons: number, massNumber: number): Nuclide | undefined {
  return NUCLIDES.find((n) => n.protons === protons && n.massNumber === massNumber);
}

/** Mass defect in u: Z m_H + N m_n − M_atom. */
export function calculateMassDefect(protons: number, massNumber: number, atomicMass: number): number {
  validateNumbers(protons, massNumber);
  return protons * HYDROGEN_ATOM_MASS_U + (massNumber - protons) * NEUTRON_MASS_U - atomicMass;
}

export function calculateBindingEnergyMeV(nuclide: Nuclide): number {
  return calculateMassDefect(nuclide.protons, nuclide.massNumber, nuclide.atomicMass) * ATOMIC_MASS_UNIT_MEV;
}

export function calculateBindingEnergyPerNucleon(nuclide: Nuclide): number {
  return calculateBindingEnergyMeV(nuclide) / nuclide.massNumber;
}

function validateNumbers(protons: number, massNumber: number): void {
  if (!Number.isInteger(protons) || !Number.isInteger(massNumber) || protons < 1 || massNumber < protons) {
    throw new RangeError("Z and A must be integers with 1 ≤ Z ≤ A.");
  }
}

/** Liquid-drop binding energy in MeV for any (Z, A). */
export function calculateSemiEmpiricalBindingEnergy(protons: number, massNumber: number): number {
  validateNumbers(protons, massNumber);
  const a = massNumber;
  const z = protons;
  const n = a - z;
  const volume = 15.75 * a;
  const surface = 17.8 * a ** (2 / 3);
  const coulomb = (0.711 * z * (z - 1)) / a ** (1 / 3);
  const asymmetry = (23.7 * (a - 2 * z) ** 2) / a;
  const pairing = z % 2 === 0 && n % 2 === 0 ? 11.18 / Math.sqrt(a) : z % 2 === 1 && n % 2 === 1 ? -11.18 / Math.sqrt(a) : 0;
  return volume - surface - coulomb - asymmetry + pairing;
}

/** Most stable proton number for a given mass number (valley of stability, from the liquid-drop formula). */
export function calculateStableProtonNumber(massNumber: number): number {
  if (!Number.isInteger(massNumber) || massNumber < 1) {
    throw new RangeError("The mass number must be a positive integer.");
  }
  let best = 1;
  let bestEnergy = -Infinity;
  for (let z = 1; z <= massNumber; z += 1) {
    const energy = calculateSemiEmpiricalBindingEnergy(z, massNumber);
    if (energy > bestEnergy) {
      bestEnergy = energy;
      best = z;
    }
  }
  return best;
}

export interface Daughter {
  readonly protons: number;
  readonly massNumber: number;
}

export function applyDecay(protons: number, massNumber: number, mode: Exclude<DecayMode, "stable" | "fission-product">): Daughter {
  validateNumbers(protons, massNumber);
  if (mode === "alpha") return { protons: protons - 2, massNumber: massNumber - 4 };
  if (mode === "beta-minus") return { protons: protons + 1, massNumber };
  return { protons: protons - 1, massNumber };
}

/** Numbers of alpha and beta-minus decays that turn (Z, A) into (Z', A'), or null if impossible. */
export function countDecaysBetween(from: Daughter, to: Daughter): { alphas: number; betas: number } | null {
  const mass = from.massNumber - to.massNumber;
  if (mass < 0 || mass % 4 !== 0) return null;
  const alphas = mass / 4;
  const betas = to.protons - from.protons + 2 * alphas;
  return betas < 0 ? null : { alphas, betas };
}
