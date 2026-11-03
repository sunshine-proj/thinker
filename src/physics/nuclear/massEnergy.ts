import { SPEED_OF_LIGHT, assertNonNegative, assertPositive } from "../core";

/**
 * Mass-energy equivalence, E = mc².
 *
 * Any change in the rest energy of a system corresponds to a change in its mass: E = Δm c². Reactions that release
 * energy, such as the Sun's fusion of hydrogen into helium, lose a tiny fraction of their mass. The Sun's
 * luminosity L therefore costs it L/c² kilograms every second, and fusing hydrogen to helium converts 0.71 % of the
 * fuel's mass.
 *
 * Limitations: rest-mass changes only, in the frame where the system is at rest; kinetic energy of the products is
 * counted as part of the energy released.
 */
export function calculateEnergyFromMass(massKg: number): number {
  assertNonNegative(massKg, "massKg");
  return massKg * SPEED_OF_LIGHT ** 2;
}

export function calculateMassFromEnergy(energyJoules: number): number {
  assertNonNegative(energyJoules, "energyJoules");
  return energyJoules / SPEED_OF_LIGHT ** 2;
}

/** Fraction of the initial mass converted to energy. */
export function calculateConvertedFraction(inputMassU: number, outputMassU: number): number {
  assertPositive(inputMassU, "inputMassU");
  assertPositive(outputMassU, "outputMassU");
  if (outputMassU > inputMassU) {
    throw new RangeError("The reaction must release energy (products lighter than reactants).");
  }
  return (inputMassU - outputMassU) / inputMassU;
}
