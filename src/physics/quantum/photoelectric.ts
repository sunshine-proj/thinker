import { assertPositive } from "../core";
import { HC_EV_NM } from "./bohr";

/**
 * The photoelectric effect (Einstein 1905).
 *
 * A photon of frequency f carries E = hf = hc/λ. An electron absorbs one photon whole; if hf exceeds the metal's
 * work function φ it escapes with maximum kinetic energy K = hf − φ. Below the threshold frequency f₀ = φ/h no
 * electrons are emitted, however bright the light. The stopping potential that just halts the fastest electrons
 * is V_s = K/e. Brightness only changes how many electrons are emitted per second, not their energy.
 *
 * Limitations: single-photon absorption at low intensities, a clean surface at zero temperature, and no
 * contact-potential or space-charge effects. Energies are in electron-volts.
 */
export function calculatePhotonEnergyEv(wavelengthNm: number): number {
  assertPositive(wavelengthNm, "wavelengthNm");
  return HC_EV_NM / wavelengthNm;
}

/** Maximum kinetic energy in eV; 0 when below threshold. */
export function calculateMaximumKineticEnergyEv(wavelengthNm: number, workFunctionEv: number): number {
  assertPositive(workFunctionEv, "workFunctionEv");
  return Math.max(0, calculatePhotonEnergyEv(wavelengthNm) - workFunctionEv);
}

/** Stopping potential in volts: numerically equal to K in eV. */
export function calculateStoppingPotential(wavelengthNm: number, workFunctionEv: number): number {
  return calculateMaximumKineticEnergyEv(wavelengthNm, workFunctionEv);
}

/** Longest wavelength that still ejects electrons, nm. */
export function calculateThresholdWavelengthNm(workFunctionEv: number): number {
  assertPositive(workFunctionEv, "workFunctionEv");
  return HC_EV_NM / workFunctionEv;
}

/** Wavelength needed for a given maximum kinetic energy, nm. */
export function calculateWavelengthForKineticEnergy(kineticEnergyEv: number, workFunctionEv: number): number {
  if (kineticEnergyEv < 0) {
    throw new RangeError("Kinetic energy must not be negative.");
  }
  assertPositive(workFunctionEv, "workFunctionEv");
  return HC_EV_NM / (kineticEnergyEv + workFunctionEv);
}
