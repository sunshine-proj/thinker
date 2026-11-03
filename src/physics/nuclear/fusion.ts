import { ATOMIC_MASS_UNIT, ATOMIC_MASS_UNIT_MEV, BOLTZMANN_CONSTANT, ELEMENTARY_CHARGE, assertPositive } from "../core";

/**
 * Fusion energetics: the Coulomb barrier and the energy released.
 *
 * Two nuclei of charges Z₁e and Z₂e repel with potential energy U(r) = Z₁Z₂ e²/(4πε₀ r) = 1.44 MeV·fm × Z₁Z₂/r.
 * The nuclear force takes over at the contact distance r = r₀(A₁^(1/3) + A₂^(1/3)) with r₀ ≈ 1.2 fm, so the barrier
 * height is U at that distance. A plasma of temperature T has typical thermal energy kT (1 keV corresponds to
 * 11.6 million kelvin); real fusion happens at much lower temperatures than U/k because of quantum tunnelling and
 * the fast tail of the Maxwell distribution. The energy released by a reaction is Q = (Σm_in − Σm_out)c², and per
 * kilogram of fuel Q divided by the mass of the reactants.
 *
 * Limitations: the barrier is the classical head-on value; tunnelling, reaction cross-sections and plasma
 * confinement are not modelled, and the 1.2 fm nuclear radius is approximate.
 */
export const COULOMB_MEV_FM = 1.43996;
export const NUCLEAR_RADIUS_PARAMETER_FM = 1.2;

export function calculateContactDistanceFm(massNumber1: number, massNumber2: number): number {
  assertPositive(massNumber1, "massNumber1");
  assertPositive(massNumber2, "massNumber2");
  return NUCLEAR_RADIUS_PARAMETER_FM * (massNumber1 ** (1 / 3) + massNumber2 ** (1 / 3));
}

export function calculateCoulombPotentialMeV(charge1: number, charge2: number, separationFm: number): number {
  assertPositive(charge1, "charge1");
  assertPositive(charge2, "charge2");
  assertPositive(separationFm, "separationFm");
  return (COULOMB_MEV_FM * charge1 * charge2) / separationFm;
}

export function calculateCoulombBarrierMeV(z1: number, a1: number, z2: number, a2: number): number {
  return calculateCoulombPotentialMeV(z1, z2, calculateContactDistanceFm(a1, a2));
}

/** Temperature in kelvin at which kT equals the given energy in keV. */
export function calculateTemperatureFromKeV(kiloElectronVolts: number): number {
  assertPositive(kiloElectronVolts, "kiloElectronVolts");
  return (kiloElectronVolts * 1e3 * ELEMENTARY_CHARGE) / BOLTZMANN_CONSTANT;
}

export function calculateKeVFromTemperature(kelvin: number): number {
  assertPositive(kelvin, "kelvin");
  return (BOLTZMANN_CONSTANT * kelvin) / (1e3 * ELEMENTARY_CHARGE);
}

/** Energy released, MeV, when masses `inputsU` (u) become `outputsU` (u). */
export function calculateReactionEnergyMeV(inputsU: readonly number[], outputsU: readonly number[]): number {
  const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
  return (sum(inputsU) - sum(outputsU)) * ATOMIC_MASS_UNIT_MEV;
}

/** Energy per kilogram of fuel, J/kg, for a reaction releasing `energyMeV` from reactants of total mass `reactantMassU`. */
export function calculateEnergyPerKilogram(energyMeV: number, reactantMassU: number): number {
  assertPositive(reactantMassU, "reactantMassU");
  return (energyMeV * 1e6 * ELEMENTARY_CHARGE) / (reactantMassU * ATOMIC_MASS_UNIT);
}
