import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { ELECTRON_MASS, NEUTRON_MASS } from "../../../physics/core";
import {
  calculateElectronWavelengthFromVoltage,
  calculateMatterFringeSpacing,
  calculateSpeedForWavelength,
  calculateVoltageForWavelength,
  calculateWavelengthFromSpeed,
} from "../../../physics/quantum";

export type MatterKind = "voltage" | "fringes" | "neutron";

export interface MatterRound extends NumericRound { readonly kind: MatterKind }

export interface MatterOutcome extends AttemptOutcome {
  readonly wavelengthNm: number;
  readonly targetWavelengthNm: number;
  readonly fringeSpacingMm: number | null;
}

export const WAVELENGTH_TARGET_M = 0.1e-9;
export const WAVELENGTH_TOLERANCE = 0.05;
export const SLIT_SEPARATION_M = 1e-6;
export const SCREEN_DISTANCE_M = 1;
export const FRINGE_TARGET_M = 0.2e-3;
export const FRINGE_TOLERANCE = 0.05;
export const REFERENCE_VOLTS = 100;
export const NEUTRON_TOLERANCE = 0.03;

export const MATTER_META: RoundGameMeta = {
  id: "wave-or-particle",
  title: "Wave or Particle?",
  eyebrow: "MODERN PHYSICS · MATTER WAVES",
  modelTag: "DE BROGLIE WAVELENGTH",
  introduction: "Electrons and neutrons are particles, yet they make interference fringes like light. Tune an electron beam to a chosen wavelength, space the fringes on a screen, and match a neutron's wavelength to an electron's.",
  instructions: "Predict, set the beam, then fire. Every particle has a wavelength set by its momentum, and where waves overlap they interfere, even when particles arrive one at a time.",
  formula: "λ = h/p  ·  λ = h/√(2meV)  ·  Δy = λL/d",
  formulaCaption: "h is Planck's constant, p the momentum, m the mass and V the accelerating voltage of an electron of charge e. Δy is the spacing of fringes on a screen at distance L behind slits a distance d apart.",
  explanation: "De Broglie proposed that matter has a wavelength λ = h/p, and electron diffraction proved it. A faster or heavier particle has more momentum and a shorter wavelength, so an electron accelerated through 150 V has a wavelength of 0.1 nm, comparable to atomic spacing, which is why crystals diffract electrons. A thrown baseball has a wavelength of about 10⁻³⁴ m, far too small to ever see. In a double-slit experiment each electron lands at one spot like a particle, but after thousands of arrivals the spots form the bright and dark fringes of a wave. A neutron 1839 times heavier than an electron needs a speed 1839 times smaller to have the same wavelength.",
  assumptions: "Non-relativistic momentum (valid for electrons below about 10 kV), idealized narrow slits, a distant screen, and a monoenergetic beam. The fringe formula holds for small angles.",
  learningObjectives: ["Calculate the de Broglie wavelength from momentum or voltage.", "Predict the fringe spacing of a matter-wave double slit.", "Compare the wavelengths of particles with different masses."],
  objective: { title: "Master matter waves", description: "Complete each experiment.", unit: "experiments" },
  controlsHeading: "Set up the beam",
  submitLabel: "Fire the beam",
  solvedLabel: "Experiment complete!",
  nextLabel: "Next experiment",
};

export const MATTER_ROUNDS: readonly MatterRound[] = Object.freeze([
  {
    id: "tune-the-electron", title: "Tune the electron", difficulty: "Beginner", kind: "voltage",
    situation: `Accelerate electrons from rest so that their de Broglie wavelength is 0.100 nm (± ${WAVELENGTH_TOLERANCE * 100} %), the spacing of atoms in a crystal. Choose the voltage.`,
    controls: [slider("volts", "Accelerating voltage", "V", 10, 500, 1, 50)],
    hint: "eV = p²/2m and λ = h/p, so V = h²/(2meλ²).",
  },
  {
    id: "space-the-fringes", title: "Space the fringes", difficulty: "Intermediate", kind: "fringes",
    situation: `An electron beam passes through two slits 1 µm apart onto a screen 1 m away. Choose the voltage so the bright fringes are 0.20 mm apart (± ${FRINGE_TOLERANCE * 100} %).`,
    controls: [fixed("slits", "Slit separation", "µm", 1), fixed("screen", "Screen distance", "m", 1), slider("volts", "Accelerating voltage", "V", 10, 200, 1, 100)],
    hint: "Fringes are λL/d apart, so λ = 0.2 mm × 1 µm / 1 m = 0.2 nm. Then find V for that wavelength.",
  },
  {
    id: "match-the-neutron", title: "Match the neutron", difficulty: "Advanced", kind: "neutron",
    situation: `Electrons accelerated through ${REFERENCE_VOLTS} V diffract from a crystal. Choose the speed of a neutron beam that has the same wavelength (± ${NEUTRON_TOLERANCE * 100} %).`,
    controls: [fixed("volts", "Electron voltage", "V", REFERENCE_VOLTS), slider("speed", "Neutron speed", "m/s", 500, 6000, 10, 2000)],
    hint: "Equal wavelengths mean equal momentum: v_n = m_e v_e / m_n, or use λ = h/(m v).",
  },
]);

export function runMatter(round: MatterRound, v: NumericControl): MatterOutcome {
  if (round.kind === "neutron") {
    const target = calculateElectronWavelengthFromVoltage(REFERENCE_VOLTS);
    const speed = v.speed as number;
    const wavelength = calculateWavelengthFromSpeed(NEUTRON_MASS, speed);
    const error = Math.abs(wavelength - target) / target;
    const success = error <= NEUTRON_TOLERANCE;
    return {
      wavelengthNm: wavelength * 1e9, targetWavelengthNm: target * 1e9, fringeSpacingMm: null, success, accuracyFraction: success ? 1 - error / NEUTRON_TOLERANCE : 0,
      predictionActual: calculateSpeedForWavelength(NEUTRON_MASS, target),
      feedback: success ? `A neutron at ${speed.toFixed(0)} m/s has λ = h/mv = ${(wavelength * 1e9).toFixed(4)} nm, equal to the ${REFERENCE_VOLTS} V electron's ${(target * 1e9).toFixed(4)} nm. Being ${(NEUTRON_MASS / ELECTRON_MASS).toFixed(0)} times heavier it moves much more slowly.`
        : `At ${speed.toFixed(0)} m/s the neutron's wavelength is ${(wavelength * 1e9).toFixed(4)} nm, ${wavelength > target ? "longer" : "shorter"} than the electron's ${(target * 1e9).toFixed(4)} nm.`,
    };
  }
  const volts = v.volts as number;
  const wavelength = calculateElectronWavelengthFromVoltage(volts);
  if (round.kind === "voltage") {
    const error = Math.abs(wavelength - WAVELENGTH_TARGET_M) / WAVELENGTH_TARGET_M;
    const success = error <= WAVELENGTH_TOLERANCE;
    return {
      wavelengthNm: wavelength * 1e9, targetWavelengthNm: WAVELENGTH_TARGET_M * 1e9, fringeSpacingMm: null, success, accuracyFraction: success ? 1 - error / WAVELENGTH_TOLERANCE : 0,
      predictionActual: calculateVoltageForWavelength(WAVELENGTH_TARGET_M),
      feedback: success ? `${volts} V gives the electrons p = √(2meV) and λ = h/p = ${(wavelength * 1e9).toFixed(4)} nm.`
        : `${volts} V gives λ = ${(wavelength * 1e9).toFixed(4)} nm, ${wavelength > WAVELENGTH_TARGET_M ? "too long: raise the voltage" : "too short: lower the voltage"}.`,
    };
  }
  const spacing = calculateMatterFringeSpacing(wavelength, SCREEN_DISTANCE_M, SLIT_SEPARATION_M);
  const error = Math.abs(spacing - FRINGE_TARGET_M) / FRINGE_TARGET_M;
  const success = error <= FRINGE_TOLERANCE;
  return {
    wavelengthNm: wavelength * 1e9, targetWavelengthNm: ((FRINGE_TARGET_M * SLIT_SEPARATION_M) / SCREEN_DISTANCE_M) * 1e9, fringeSpacingMm: spacing * 1000, success,
    accuracyFraction: success ? 1 - error / FRINGE_TOLERANCE : 0, predictionActual: calculateVoltageForWavelength((FRINGE_TARGET_M * SLIT_SEPARATION_M) / SCREEN_DISTANCE_M),
    feedback: success ? `${volts} V gives λ = ${(wavelength * 1e9).toFixed(3)} nm and fringes λL/d = ${(spacing * 1000).toFixed(3)} mm apart.`
      : `${volts} V gives fringes ${(spacing * 1000).toFixed(3)} mm apart, not 0.20 mm. ${spacing > FRINGE_TARGET_M ? "Raise the voltage to shorten λ" : "Lower the voltage to lengthen λ"}.`,
  };
}

export const waveOrParticle = defineNumericGame<MatterRound, MatterOutcome>({
  meta: MATTER_META,
  rounds: MATTER_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "neutron" ? { label: "Your prediction of the neutron speed", unit: "m/s", placeholder: "e.g. 3200", step: 1 }
    : { label: "Your prediction of the voltage needed", unit: "V", placeholder: "e.g. 150", step: 0.1 },
  evaluate: (round, values) => runMatter(round, values),
});
