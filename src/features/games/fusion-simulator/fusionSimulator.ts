import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateCoulombBarrierMeV,
  calculateEnergyPerKilogram,
  calculateKeVFromTemperature,
  calculateReactionEnergyMeV,
  calculateTemperatureFromKeV,
  findNuclide,
} from "../../../physics/nuclear";
import { NEUTRON_MASS_U } from "../../../physics/nuclear/nuclides";

export type FusionKind = "barrier" | "temperature" | "fuel";

export interface FusionRound extends NumericRound { readonly kind: FusionKind }

export interface FusionOutcome extends AttemptOutcome {
  readonly barrierKeV: number;
  readonly thermalKeV: number | null;
  readonly fuelEnergyPerKg: number;
  readonly fuelGrams: number | null;
  readonly truth: number;
}

const D = findNuclide("H-2").atomicMass;
const T = findNuclide("H-3").atomicMass;
const HE = findNuclide("He-4").atomicMass;
export const DT_Q_MEV = calculateReactionEnergyMeV([D, T], [HE, NEUTRON_MASS_U]);
export const DT_BARRIER_KEV = calculateCoulombBarrierMeV(1, 2, 1, 3) * 1000;
export const DT_ENERGY_PER_KG = calculateEnergyPerKilogram(DT_Q_MEV, D + T);
export const BARRIER_TOLERANCE_KEV = 15;
export const TARGET_KEV = 10;
export const TEMPERATURE_TOLERANCE = 0.05;
export const HEAT_TARGET_JOULES = 1e12;
export const FUEL_TOLERANCE = 0.03;

export const FUSION_META: RoundGameMeta = {
  id: "fusion-simulator",
  title: "Fusion Simulator",
  eyebrow: "NUCLEAR PHYSICS · FUSION",
  modelTag: "COULOMB BARRIER & FUSION ENERGY",
  introduction: "Fusion powers the stars, but two nuclei repel each other. Work out how hard deuterium and tritium must be thrown together to touch, how hot a plasma must be, and how little fuel a fusion plant needs.",
  instructions: "Predict, set your answer and check it. Both nuclei are positive, so a barrier of electric repulsion stands between them. Energy is released only once they get close enough for the strong force to take over.",
  formula: "U = 1.44 MeV·fm · Z₁Z₂ / r  ·  r = 1.2 fm (A₁^⅓ + A₂^⅓)  ·  Q = Δm c²  ·  kT: 1 keV = 11.6 MK",
  formulaCaption: "Z is the charge number and A the mass number of each nucleus, r their separation at contact. Q is the energy released, kT the typical thermal energy of a plasma at temperature T.",
  explanation: "The electric potential energy of two nuclei rises as they approach, to about 0.44 MeV for deuterium and tritium at contact. A plasma with that thermal energy would be at about five billion kelvin, yet fusion in the Sun happens at 15 million kelvin and in reactors at about 100 million. Quantum tunnelling lets nuclei through the barrier, and some of them are always much faster than average. Once fused, D + T → helium-4 + a neutron releases 17.6 MeV, because helium-4 is much more tightly bound. Per kilogram that is about four times what fission of uranium delivers, so a few grams of fuel give as much energy as tonnes of coal.",
  assumptions: "The barrier is the classical head-on value at the touching distance with r₀ = 1.2 fm; tunnelling, cross-sections and plasma confinement are not modelled. The thermal energy is taken as kT (1 keV = 11.6 million kelvin). The fuel energy counts the full 17.6 MeV per reaction and assumes complete burn-up, which a real reactor does not achieve.",
  learningObjectives: ["Calculate the height of the Coulomb barrier.", "Relate plasma temperature to particle energy.", "Compute the energy released by fusion and the fuel needed."],
  objective: { title: "Ignite the plasma", description: "Complete each fusion problem.", unit: "problems" },
  controlsHeading: "Your answer",
  submitLabel: "Check the fusion",
  solvedLabel: "Fusion achieved!",
  nextLabel: "Next problem",
};

export const FUSION_ROUNDS: readonly FusionRound[] = Object.freeze([
  {
    id: "climb-the-barrier", title: "Climb the barrier", difficulty: "Intermediate", kind: "barrier",
    situation: `A deuteron (Z = 1, A = 2) is fired head-on at a triton (Z = 1, A = 3). Taking the nuclear radius as 1.2 fm × A^⅓ for each, what kinetic energy in keV (total, in the center-of-mass frame) is needed to just reach contact? (± ${BARRIER_TOLERANCE_KEV} keV)`,
    controls: [slider("energy", "Energy to reach contact", "keV", 50, 1500, 1, 200)],
    hint: "Contact distance r = 1.2 fm (2^⅓ + 3^⅓) = 3.24 fm; then U = 1.44 MeV·fm / r.",
  },
  {
    id: "heat-the-plasma", title: "Heat the plasma", difficulty: "Beginner", kind: "temperature",
    situation: `A fusion reactor needs a plasma with a typical thermal energy kT of ${TARGET_KEV} keV. What temperature is that, in millions of kelvin? (± ${TEMPERATURE_TOLERANCE * 100} %)`,
    controls: [slider("temperature", "Plasma temperature", "MK", 1, 500, 1, 50)],
    hint: "kT = 10 keV = 10 000 × 1.602×10⁻¹⁹ J; divide by k = 1.381×10⁻²³ J/K.",
  },
  {
    id: "how-much-fuel", title: "How much fuel?", difficulty: "Advanced", kind: "fuel",
    situation: `A D–T reaction releases ${DT_Q_MEV.toFixed(2)} MeV from a deuteron (2.0141 u) and a triton (3.0160 u). How many grams of D–T fuel release 1 TJ of heat (10¹² J)? (± ${FUEL_TOLERANCE * 100} %)`,
    controls: [fixed("energy", "Energy wanted", "TJ", 1), slider("grams", "Fuel mass", "g", 0.1, 10, 0.01, 5)],
    hint: "Energy per kg = Q / (mass of reactants) = 17.6 MeV / 5.03 u. Then m = E / (energy per kg).",
  },
]);

export function runFusion(round: FusionRound, v: NumericControl): FusionOutcome {
  const base = { barrierKeV: DT_BARRIER_KEV, fuelEnergyPerKg: DT_ENERGY_PER_KG };
  if (round.kind === "barrier") {
    const guess = v.energy as number;
    const error = Math.abs(guess - DT_BARRIER_KEV);
    const success = error <= BARRIER_TOLERANCE_KEV;
    return {
      ...base, thermalKeV: null, fuelGrams: null, truth: DT_BARRIER_KEV, success, accuracyFraction: success ? 1 - error / BARRIER_TOLERANCE_KEV : 0, predictionActual: DT_BARRIER_KEV,
      feedback: success ? `U = 1.44 MeV·fm/3.24 fm = ${DT_BARRIER_KEV.toFixed(0)} keV. A plasma would need kT = ${DT_BARRIER_KEV.toFixed(0)} keV, ${(calculateTemperatureFromKeV(DT_BARRIER_KEV) / 1e9).toFixed(1)} billion kelvin, to do this on average; tunnelling and fast particles in the tail make fusion happen far cooler.`
        : `${guess} keV is ${guess > DT_BARRIER_KEV ? "more than needed" : "not enough"}: the barrier at 3.24 fm is ${DT_BARRIER_KEV.toFixed(0)} keV.`,
    };
  }
  if (round.kind === "temperature") {
    const truth = calculateTemperatureFromKeV(TARGET_KEV) / 1e6;
    const guess = v.temperature as number;
    const error = Math.abs(guess - truth) / truth;
    const success = error <= TEMPERATURE_TOLERANCE;
    return {
      ...base, thermalKeV: calculateKeVFromTemperature(guess * 1e6), fuelGrams: null, truth, success, accuracyFraction: success ? 1 - error / TEMPERATURE_TOLERANCE : 0, predictionActual: truth,
      feedback: success ? `T = E/k = ${truth.toFixed(1)} million kelvin: ${guess} MK gives kT = ${calculateKeVFromTemperature(guess * 1e6).toFixed(2)} keV.`
        : `${guess} MK gives kT = ${calculateKeVFromTemperature(guess * 1e6).toFixed(2)} keV, ${guess > truth ? "hotter" : "cooler"} than the 10 keV target (${truth.toFixed(1)} MK).`,
    };
  }
  const truth = (HEAT_TARGET_JOULES / DT_ENERGY_PER_KG) * 1000;
  const guess = v.grams as number;
  const error = Math.abs(guess - truth) / truth;
  const success = error <= FUEL_TOLERANCE;
  return {
    ...base, thermalKeV: null, fuelGrams: guess, truth, success, accuracyFraction: success ? 1 - error / FUEL_TOLERANCE : 0, predictionActual: truth,
    feedback: success ? `D–T fuel releases ${(DT_ENERGY_PER_KG / 1e14).toFixed(2)}×10¹⁴ J/kg, so ${truth.toFixed(2)} g gives 1 TJ: the heat from about 34 tonnes of coal.`
      : `${guess} g releases ${((guess / 1000) * DT_ENERGY_PER_KG / 1e12).toFixed(2)} TJ, ${guess > truth ? "more" : "less"} than 1 TJ. You need ${truth.toFixed(2)} g.`,
  };
}

export const fusionSimulator = defineNumericGame<FusionRound, FusionOutcome>({
  meta: FUSION_META,
  rounds: FUSION_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "barrier" ? { label: "Your prediction of the barrier height", unit: "keV", placeholder: "e.g. 440", step: 1 }
    : round.kind === "temperature" ? { label: "Your prediction of the temperature", unit: "MK", placeholder: "e.g. 116", step: 0.1 }
    : { label: "Your prediction of the fuel mass", unit: "g", placeholder: "e.g. 3", step: 0.01 },
  evaluate: (round, values) => runFusion(round, values),
});
