import { defineNumericGame, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateBindingEnergyMeV,
  calculateBindingEnergyPerNucleon,
  calculateReactionEnergyMeV,
  calculateSemiEmpiricalBindingEnergy,
  calculateStableProtonNumber,
  findNuclide,
} from "../../../physics/nuclear";
import { NEUTRON_MASS_U } from "../../../physics/nuclear/nuclides";

export type NuclearKind = "peak" | "helium" | "fission";

export interface NuclearRound extends NumericRound { readonly kind: NuclearKind }

export interface NuclearOutcome extends AttemptOutcome {
  /** Binding energy per nucleon of the chosen mass number (MeV), where relevant. */
  readonly perNucleon: number | null;
  readonly truth: number;
}

export const PEAK_TOLERANCE = 0.05;
export const HELIUM_TOLERANCE_MEV = 0.5;
export const FISSION_TOLERANCE_MEV = 3;
export const HELIUM_BINDING = calculateBindingEnergyMeV(findNuclide("He-4"));
export const FISSION_Q = calculateReactionEnergyMeV(
  [findNuclide("U-235").atomicMass, NEUTRON_MASS_U],
  [findNuclide("Ba-141").atomicMass, findNuclide("Kr-92").atomicMass, 3 * NEUTRON_MASS_U],
);

/** Liquid-drop binding energy per nucleon along the valley of stability. */
export function bindingPerNucleonAt(massNumber: number): number {
  const z = calculateStableProtonNumber(massNumber);
  return calculateSemiEmpiricalBindingEnergy(z, massNumber) / massNumber;
}

export const PEAK_VALUE = Math.max(...Array.from({ length: 247 }, (_, i) => bindingPerNucleonAt(i + 4)));

export const NUCLEAR_META: RoundGameMeta = {
  id: "nuclear-puzzle",
  title: "Nuclear Puzzle",
  eyebrow: "NUCLEAR PHYSICS · STRUCTURE",
  modelTag: "BINDING ENERGY",
  introduction: "A nucleus weighs less than the protons and neutrons it is made of; the missing mass is the energy that binds it. Find the most tightly bound nuclei, compute the binding energy of helium, and work out how much energy a uranium nucleus releases when it splits.",
  instructions: "Predict, set your answer and check it. Energy is released when nucleons end up more tightly bound than they started, so look at the binding energy per nucleon.",
  formula: "B = (Z m_H + N m_n − M_atom) c²  ·  Q = (Σm_in − Σm_out) c²  ·  1 u = 931.494 MeV/c²",
  formulaCaption: "Z and N are the numbers of protons and neutrons, m_H and m_n the masses of a hydrogen atom and a neutron, M_atom the mass of the neutral atom and u the atomic mass unit. Q is the energy a nuclear reaction releases.",
  explanation: "The strong nuclear force pulls nucleons together, so a nucleus is lighter than its separated parts, and the mass difference times c² is its binding energy. The binding energy per nucleon rises quickly for light nuclei, peaks near iron and nickel at about 8.8 MeV (A ≈ 56–62), and slowly declines for heavy nuclei because the protons' electric repulsion grows. This is why energy comes from fusing light nuclei and from splitting heavy ones: both end in more tightly bound nuclei. A uranium-235 nucleus holds 7.6 MeV per nucleon and its fragments about 8.5, so about 0.9 MeV × 235 ≈ 200 MeV is released per fission.",
  assumptions: "Binding energies come from measured atomic masses where nuclides are tabulated (He-4, U-235, Ba-141, Kr-92) and from the liquid-drop (semi-empirical) mass formula elsewhere, which captures the trend to within a few percent for A > 20 but ignores shell effects such as the extra stability of helium-4 and oxygen-16. Neutron energies and neutrinos are not counted in the fission balance.",
  learningObjectives: ["Calculate a binding energy from a mass defect.", "Explain the binding-energy-per-nucleon curve and where it peaks.", "Use mass differences to find the energy released in fission."],
  objective: { title: "Solve the nucleus", description: "Complete each puzzle.", unit: "puzzles" },
  controlsHeading: "Your answer",
  submitLabel: "Check the nucleus",
  solvedLabel: "Puzzle solved!",
  nextLabel: "Next puzzle",
};

export const NUCLEAR_ROUNDS: readonly NuclearRound[] = Object.freeze([
  {
    id: "the-most-stable-nucleus", title: "The most stable nucleus", difficulty: "Beginner", kind: "peak",
    situation: `Choose the mass number A of a stable nucleus (with its natural number of protons) whose binding energy per nucleon is within ${PEAK_TOLERANCE} MeV of the maximum. The curve is drawn below.`,
    controls: [slider("mass", "Mass number A", "", 4, 250, 1, 20)],
    hint: "The curve rises steeply from helium, peaks, then falls slowly toward uranium. Look at the top of the curve.",
  },
  {
    id: "weigh-the-helium", title: "Weigh the helium", difficulty: "Intermediate", kind: "helium",
    situation: `Helium-4 has an atomic mass of 4.002603 u. A hydrogen atom has 1.007825 u and a neutron 1.008665 u. Find the binding energy of helium-4 in MeV (± ${HELIUM_TOLERANCE_MEV} MeV).`,
    controls: [slider("energy", "Binding energy", "MeV", 0, 60, 0.1, 20)],
    hint: "Mass defect = 2(1.007825) + 2(1.008665) − 4.002603 u, then multiply by 931.5 MeV/u.",
  },
  {
    id: "split-the-uranium", title: "Split the uranium", difficulty: "Advanced", kind: "fission",
    situation: `A uranium-235 nucleus (235.043930 u) absorbs a neutron (1.008665 u) and splits into barium-141 (140.914411 u), krypton-92 (91.926156 u) and three neutrons. How much energy is released, in MeV (± ${FISSION_TOLERANCE_MEV} MeV)?`,
    controls: [slider("energy", "Energy released", "MeV", 100, 300, 1, 200)],
    hint: "Subtract the total mass after from the total mass before, then multiply by 931.5 MeV/u.",
  },
]);

export function runNuclear(round: NuclearRound, v: NumericControl): NuclearOutcome {
  if (round.kind === "peak") {
    const a = v.mass as number;
    const value = bindingPerNucleonAt(a);
    const error = PEAK_VALUE - value;
    const success = error <= PEAK_TOLERANCE;
    return {
      perNucleon: value, truth: PEAK_VALUE, success, accuracyFraction: success ? 1 - error / PEAK_TOLERANCE : 0, predictionActual: PEAK_VALUE,
      feedback: success ? `A = ${a} binds ${value.toFixed(2)} MeV per nucleon, at the top of the curve (${PEAK_VALUE.toFixed(2)} MeV): fusing lighter nuclei or splitting heavier ones toward it releases energy.`
        : `A = ${a} binds ${value.toFixed(2)} MeV per nucleon, ${error.toFixed(2)} MeV below the maximum. ${a < 40 ? "Heavier nuclei are more tightly bound." : "Lighter nuclei are more tightly bound."}`,
    };
  }
  const energy = v.energy as number;
  const truth = round.kind === "helium" ? HELIUM_BINDING : FISSION_Q;
  const tolerance = round.kind === "helium" ? HELIUM_TOLERANCE_MEV : FISSION_TOLERANCE_MEV;
  const error = Math.abs(energy - truth);
  const success = error <= tolerance;
  return {
    perNucleon: round.kind === "helium" ? calculateBindingEnergyPerNucleon(findNuclide("He-4")) : null, truth, success, accuracyFraction: success ? 1 - error / tolerance : 0, predictionActual: truth,
    feedback: success ? round.kind === "helium" ? `Δm = 0.030377 u, so B = ${truth.toFixed(2)} MeV, or ${(truth / 4).toFixed(2)} MeV per nucleon.` : `Δm = ${(truth / 931.494).toFixed(4)} u converts to ${truth.toFixed(1)} MeV, about 3×10⁻¹¹ J per fission.`
      : `${energy} MeV is ${energy > truth ? "too much" : "too little"}: the mass difference gives ${truth.toFixed(1)} MeV.`,
  };
}

export const nuclearPuzzle = defineNumericGame<NuclearRound, NuclearOutcome>({
  meta: NUCLEAR_META,
  rounds: NUCLEAR_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "peak" ? { label: "Your prediction of the peak binding energy per nucleon", unit: "MeV", placeholder: "e.g. 8.8", step: 0.01 }
    : round.kind === "helium" ? { label: "Your prediction of the binding energy", unit: "MeV", placeholder: "e.g. 28", step: 0.1 }
    : { label: "Your prediction of the energy released", unit: "MeV", placeholder: "e.g. 173", step: 0.1 },
  evaluate: (round, values) => runNuclear(round, values),
});
