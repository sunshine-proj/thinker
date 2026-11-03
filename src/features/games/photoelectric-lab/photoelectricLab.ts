import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateMaximumKineticEnergyEv,
  calculatePhotonEnergyEv,
  calculateStoppingPotential,
  calculateThresholdWavelengthNm,
  calculateWavelengthForKineticEnergy,
} from "../../../physics/quantum";

export type LabKind = "wavelength" | "stopping" | "metal";

export interface LabRound extends NumericRound { readonly kind: LabKind }

export interface LabOutcome extends AttemptOutcome {
  readonly photonEv: number;
  readonly workFunctionEv: number;
  readonly kineticEnergyEv: number;
  readonly stoppingVolts: number;
  readonly thresholdNm: number;
  readonly wavelengthNm: number;
}

export const SODIUM_WORK_FUNCTION = 2.28;
export const POTASSIUM_WORK_FUNCTION = 2.3;
export const KE_TARGET_EV = 1;
export const KE_TOLERANCE_EV = 0.1;
export const STOPPING_TOLERANCE_V = 0.05;
export const METAL_WAVELENGTH_NM = 400;
export const METAL_KE_TARGET_EV = 0.5;
export const METAL_TOLERANCE_EV = 0.05;

export const LAB_META: RoundGameMeta = {
  id: "photoelectric-lab",
  title: "Photoelectric Lab",
  eyebrow: "MODERN PHYSICS · LIGHT QUANTA",
  modelTag: "PHOTOELECTRIC EFFECT",
  introduction: "Shine light on a metal and measure the electrons it knocks out. Find the wavelength that gives electrons a set energy, measure the stopping voltage, and choose a metal to match the light you have.",
  instructions: "Predict, then experiment. Light arrives in photons whose energy depends only on its color. A photon either has enough energy to free an electron or it does not, however bright the beam.",
  formula: "E = hf = hc/λ  ·  K_max = hf − φ  ·  eV_s = K_max",
  formulaCaption: "E is the photon energy, φ the work function (the energy to free an electron from the metal), K_max the largest kinetic energy of the emitted electrons and V_s the stopping voltage. hc = 1239.84 eV·nm.",
  explanation: "Classical wave theory predicted that brighter light should free faster electrons and that any color would work given time. Experiments showed the opposite: below a threshold frequency no electrons come out however bright the light, and above it their maximum energy depends only on the frequency, rising linearly with it. Einstein explained this with quanta: each photon gives all its energy hf to one electron, which must spend φ to escape and keeps the rest. A brighter beam only means more photons, so more electrons but the same energy each. The stopping voltage, the reverse potential that just halts the fastest electrons, measures K_max directly.",
  assumptions: "Single-photon absorption, a clean metal surface at low temperature, and the maximum kinetic energy of electrons from the surface (electrons from deeper lose energy). Work functions are typical values: sodium 2.28 eV and potassium 2.30 eV. Space charge and contact potentials are ignored.",
  learningObjectives: ["Calculate photon energy from wavelength.", "Find the maximum kinetic energy and stopping voltage with K = hf − φ.", "Explain why brightness does not change the energy of the electrons."],
  objective: { title: "Complete the lab", description: "Finish each experiment.", unit: "experiments" },
  controlsHeading: "Set up the experiment",
  submitLabel: "Shine the light",
  solvedLabel: "Experiment complete!",
  nextLabel: "Next experiment",
};

export const LAB_ROUNDS: readonly LabRound[] = Object.freeze([
  {
    id: "tune-the-light", title: "Tune the light", difficulty: "Beginner", kind: "wavelength",
    situation: `Sodium has a work function of ${SODIUM_WORK_FUNCTION} eV. Choose the wavelength of light so that the fastest electrons have a kinetic energy of ${KE_TARGET_EV} eV (± ${KE_TOLERANCE_EV} eV).`,
    controls: [fixed("work", "Work function", "eV", SODIUM_WORK_FUNCTION), slider("wavelength", "Wavelength", "nm", 200, 700, 1, 500)],
    hint: "The photon needs φ + K = 2.28 + 1.0 eV. Then λ = 1240 eV·nm / E.",
  },
  {
    id: "measure-the-stopping-voltage", title: "Measure the stopping voltage", difficulty: "Intermediate", kind: "stopping",
    situation: `Ultraviolet light of 250 nm shines on potassium (work function ${POTASSIUM_WORK_FUNCTION} eV). Set the reverse voltage that just stops the fastest electrons (± ${STOPPING_TOLERANCE_V} V).`,
    controls: [fixed("work", "Work function", "eV", POTASSIUM_WORK_FUNCTION), fixed("wavelength", "Wavelength", "nm", 250), slider("voltage", "Reverse voltage", "V", 0, 5, 0.01, 1)],
    hint: "eV_s = hf − φ: find the photon energy of 250 nm light and subtract 2.30 eV.",
  },
  {
    id: "choose-the-metal", title: "Choose the metal", difficulty: "Advanced", kind: "metal",
    situation: `Light of ${METAL_WAVELENGTH_NM} nm is available. Choose a metal, by its work function, so the electrons leave with a maximum kinetic energy of ${METAL_KE_TARGET_EV} eV (± ${METAL_TOLERANCE_EV} eV).`,
    controls: [fixed("wavelength", "Wavelength", "nm", METAL_WAVELENGTH_NM), slider("work", "Work function of the metal", "eV", 1.5, 6, 0.05, 4)],
    hint: "φ = hf − K = 1240/400 − 0.5.",
  },
]);

export function runLab(round: LabRound, v: NumericControl): LabOutcome {
  const wavelength = v.wavelength as number;
  const work = v.work as number;
  const photon = calculatePhotonEnergyEv(wavelength);
  const kinetic = calculateMaximumKineticEnergyEv(wavelength, work);
  const common = { photonEv: photon, workFunctionEv: work, kineticEnergyEv: kinetic, stoppingVolts: calculateStoppingPotential(wavelength, work), thresholdNm: calculateThresholdWavelengthNm(work), wavelengthNm: wavelength };
  if (round.kind === "wavelength") {
    const error = Math.abs(kinetic - KE_TARGET_EV);
    const success = error <= KE_TOLERANCE_EV;
    return {
      ...common, success, accuracyFraction: success ? 1 - error / KE_TOLERANCE_EV : 0, predictionActual: calculatePhotonEnergyEv(calculateWavelengthForKineticEnergy(KE_TARGET_EV, work)),
      feedback: success ? `${wavelength} nm photons carry ${photon.toFixed(2)} eV; after paying ${work} eV the electrons keep ${kinetic.toFixed(2)} eV.`
        : kinetic === 0 ? `${wavelength} nm photons carry only ${photon.toFixed(2)} eV, less than the work function ${work} eV (threshold ${common.thresholdNm.toFixed(0)} nm): no electrons at all, however bright.`
        : `The electrons leave with ${kinetic.toFixed(2)} eV, ${kinetic > KE_TARGET_EV ? "too fast: use a longer wavelength" : "too slow: use a shorter wavelength"}.`,
    };
  }
  if (round.kind === "stopping") {
    const volts = v.voltage as number;
    const error = Math.abs(volts - common.stoppingVolts);
    const success = error <= STOPPING_TOLERANCE_V;
    return {
      ...common, success, accuracyFraction: success ? 1 - error / STOPPING_TOLERANCE_V : 0, predictionActual: common.stoppingVolts,
      feedback: success ? `Photons of ${photon.toFixed(2)} eV minus ${work} eV leave ${kinetic.toFixed(2)} eV, so ${volts.toFixed(2)} V stops the current. Doubling the brightness would not change this voltage.`
        : volts < common.stoppingVolts ? `${volts.toFixed(2)} V is too weak: electrons with up to ${kinetic.toFixed(2)} eV still reach the collector.` : `${volts.toFixed(2)} V is more than needed: the current stops at ${common.stoppingVolts.toFixed(2)} V.`,
    };
  }
  const error = Math.abs(kinetic - METAL_KE_TARGET_EV);
  const success = error <= METAL_TOLERANCE_EV;
  return {
    ...common, success, accuracyFraction: success ? 1 - error / METAL_TOLERANCE_EV : 0, predictionActual: calculatePhotonEnergyEv(METAL_WAVELENGTH_NM) - METAL_KE_TARGET_EV,
    feedback: success ? `A metal with φ = ${work} eV leaves ${kinetic.toFixed(2)} eV for each electron from ${photon.toFixed(2)} eV photons.`
      : kinetic === 0 ? `φ = ${work} eV is above the photon energy ${photon.toFixed(2)} eV: no electrons are emitted.`
      : `φ = ${work} eV leaves electrons with ${kinetic.toFixed(2)} eV, ${kinetic > METAL_KE_TARGET_EV ? "too much: use a higher work function" : "too little: use a lower work function"}.`,
  };
}

export const photoelectricLab = defineNumericGame<LabRound, LabOutcome>({
  meta: LAB_META,
  rounds: LAB_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "wavelength" ? { label: "Your prediction of the photon energy needed", unit: "eV", placeholder: "e.g. 3.3", step: 0.01 }
    : round.kind === "stopping" ? { label: "Your prediction of the stopping voltage", unit: "V", placeholder: "e.g. 2.7", step: 0.01 }
    : { label: "Your prediction of the work function needed", unit: "eV", placeholder: "e.g. 2.6", step: 0.01 },
  evaluate: (round, values) => runLab(round, values),
});
