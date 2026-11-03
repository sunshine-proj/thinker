import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateBohrEnergy,
  calculateIonizationEnergy,
  calculateTransitionEnergy,
  calculateTransitionWavelengthNm,
  classifyWavelength,
} from "../../../physics/quantum";

export type AtomKind = "balmer" | "binding" | "line";

export interface AtomRound extends NumericRound { readonly kind: AtomKind }

export interface AtomOutcome extends AttemptOutcome {
  readonly atomicNumber: number;
  readonly upper: number;
  readonly lower: number;
  readonly photonEv: number | null;
  readonly wavelengthNm: number | null;
  readonly bindingEv: number;
  readonly region: string | null;
}

export const RED_TARGET_NM = 656;
export const BLUE_TARGET_NM = 486;
export const LINE_TOLERANCE_NM = 3;
export const BINDING_TARGET_EV = 3.4;
export const BINDING_TOLERANCE_EV = 0.1;

export const ATOM_META: RoundGameMeta = {
  id: "atom-builder",
  title: "Atom Builder",
  eyebrow: "MODERN PHYSICS · ATOMS",
  modelTag: "BOHR MODEL",
  introduction: "Build atoms from a nucleus and one electron and see their energy levels. Choose electron jumps to produce a specific color of light, and choose a nucleus and level that bind the electron with a given energy.",
  instructions: "Predict, then set the atom. An electron can only occupy certain energy levels, and light is emitted in whole photons when it drops from a higher level to a lower one.",
  formula: "Eₙ = −13.6 eV · Z²/n²  ·  E_photon = Eᵢ − E_f  ·  λ = hc / E_photon",
  formulaCaption: "Z is the number of protons in the nucleus and n the level of the electron (n = 1 is the ground state). Energies are in electron-volts; hc = 1239.84 eV·nm.",
  explanation: "In the Bohr model an electron orbiting a nucleus can only have certain energies, and the more positive the nuclear charge, the more tightly it is bound (energy scales as Z²). When the electron drops between levels the atom emits a single photon carrying the energy difference, so every element glows only at its own set of colors. For hydrogen, jumps down to n = 2 (the Balmer series) are visible: 3→2 is red at 656 nm, 4→2 blue-green at 486 nm. Larger drops, like all those to n = 1, are in the ultraviolet. A photon with at least the binding energy removes the electron entirely: ionization.",
  assumptions: "Only one-electron atoms and ions (H, He⁺, Li²⁺, Be³⁺), with an infinitely heavy nucleus. The Bohr model gives correct energy levels for these but treats electrons as orbiting like planets; real electrons are described by wave functions and probability clouds, and the model fails for atoms with several electrons.",
  learningObjectives: ["Calculate the energy levels of a hydrogen-like atom.", "Find the wavelength of the photon emitted in a transition.", "Compare binding energies for different nuclei and levels."],
  objective: { title: "Build every atom", description: "Meet each specification.", unit: "atoms" },
  controlsHeading: "Build the atom",
  submitLabel: "Excite the atom",
  solvedLabel: "Atom built!",
  nextLabel: "Next atom",
};

export const ATOM_ROUNDS: readonly AtomRound[] = Object.freeze([
  {
    id: "the-red-line", title: "The red line", difficulty: "Beginner", kind: "balmer",
    situation: `A hydrogen electron drops to level n = 2 and emits red light of ${RED_TARGET_NM} nm (± ${LINE_TOLERANCE_NM} nm). Choose the level it drops from.`,
    controls: [fixed("z", "Protons Z", "", 1), fixed("lower", "Lower level", "", 2), slider("upper", "Upper level", "", 2, 7, 1, 4)],
    hint: "E = 13.6 eV (1/2² − 1/n²) and λ = 1240 eV·nm / E. Try n = 3.",
  },
  {
    id: "bound-by-3-4-ev", title: "Bound by 3.4 eV", difficulty: "Intermediate", kind: "binding",
    situation: `Choose a nucleus and a level so that the electron's binding energy (the energy needed to free it) is ${BINDING_TARGET_EV} eV (± ${BINDING_TOLERANCE_EV} eV).`,
    controls: [slider("z", "Protons Z", "", 1, 4, 1, 1), slider("upper", "Electron level n", "", 1, 6, 1, 1), fixed("lower", "Lower level", "", 1)],
    hint: "Binding energy = 13.6 eV × Z²/n². Several combinations work: look for Z²/n² = 1/4.",
  },
  {
    id: "the-blue-green-line", title: "The blue-green line", difficulty: "Advanced", kind: "line",
    situation: `Choose the jump in hydrogen that emits light of ${BLUE_TARGET_NM} nm (± ${LINE_TOLERANCE_NM} nm). It lies in the visible Balmer series.`,
    controls: [fixed("z", "Protons Z", "", 1), slider("upper", "Upper level", "", 2, 7, 1, 3), slider("lower", "Lower level", "", 1, 6, 1, 1)],
    hint: "Visible hydrogen light comes from jumps down to n = 2. Compare E = 13.6 (1/4 − 1/n²) for n = 3, 4, 5.",
  },
]);

export function runAtom(round: AtomRound, v: NumericControl): AtomOutcome {
  const z = v.z as number;
  const upper = v.upper as number;
  const lower = v.lower as number;
  const binding = calculateIonizationEnergy(z, upper);
  if (round.kind === "binding") {
    const error = Math.abs(binding - BINDING_TARGET_EV);
    const success = error <= BINDING_TOLERANCE_EV;
    return {
      atomicNumber: z, upper, lower: 0, photonEv: null, wavelengthNm: null, bindingEv: binding, region: null, success,
      accuracyFraction: success ? 1 - error / BINDING_TOLERANCE_EV : 0, predictionActual: BINDING_TARGET_EV,
      feedback: success ? `Z = ${z}, n = ${upper}: E = ${calculateBohrEnergy(z, upper).toFixed(2)} eV, so ${binding.toFixed(2)} eV frees the electron.`
        : `Z = ${z}, n = ${upper} binds the electron with ${binding.toFixed(2)} eV, not ${BINDING_TARGET_EV} eV (Z²/n² = ${(z * z / (upper * upper)).toFixed(3)}, it should be 0.25).`,
    };
  }
  if (upper <= lower) {
    return {
      atomicNumber: z, upper, lower, photonEv: null, wavelengthNm: null, bindingEv: binding, region: null, success: false, accuracyFraction: 0,
      predictionActual: round.kind === "balmer" ? calculateTransitionWavelengthNm(1, 3, 2) : calculateTransitionEnergy(1, 4, 2),
      feedback: "No light is emitted: the electron must drop from a higher level to a lower one.",
    };
  }
  const energy = calculateTransitionEnergy(z, upper, lower);
  const nm = calculateTransitionWavelengthNm(z, upper, lower);
  const target = round.kind === "balmer" ? RED_TARGET_NM : BLUE_TARGET_NM;
  const error = Math.abs(nm - target);
  const success = error <= LINE_TOLERANCE_NM;
  return {
    atomicNumber: z, upper, lower, photonEv: energy, wavelengthNm: nm, bindingEv: binding, region: classifyWavelength(nm), success,
    accuracyFraction: success ? 1 - error / LINE_TOLERANCE_NM : 0,
    predictionActual: round.kind === "balmer" ? calculateTransitionWavelengthNm(1, 3, 2) : calculateTransitionEnergy(1, 4, 2),
    feedback: success ? `The jump ${upper}→${lower} releases ${energy.toFixed(3)} eV, a photon of ${nm.toFixed(1)} nm.`
      : `The jump ${upper}→${lower} releases ${energy.toFixed(2)} eV: ${nm.toFixed(1)} nm, which is ${classifyWavelength(nm)} light, not ${target} nm.`,
  };
}

export const atomBuilder = defineNumericGame<AtomRound, AtomOutcome>({
  meta: ATOM_META,
  rounds: ATOM_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "balmer" ? { label: "Your prediction of the red line's wavelength", unit: "nm", placeholder: "e.g. 656", step: 1 }
    : round.kind === "binding" ? { label: "Your prediction of the binding energy", unit: "eV", placeholder: "e.g. 3.4", step: 0.1 }
    : { label: "Your prediction of the photon energy", unit: "eV", placeholder: "e.g. 2.55", step: 0.01 },
  evaluate: (round, values) => runAtom(round, values),
});
