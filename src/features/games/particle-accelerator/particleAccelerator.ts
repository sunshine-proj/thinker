import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { ELEMENTARY_CHARGE as Q, PROTON_MASS as M } from "../../../physics/core";
import {
  calculateClassicalExtractionEnergy, calculateCyclotronFrequencyHz, calculateRelativisticExtractionEnergy, joulesToMegaelectronvolts,
} from "../../../physics/electromagnetism";

export interface AcceleratorRound extends NumericRound {
  /** Frequency of the accelerating RF field, Hz; null in the relativistic round (no resonance requirement). */
  readonly rfFrequencyHertz: number | null;
  readonly resonanceTolerance: number;
  readonly targetEnergyMeV: number | null;
  readonly energyTolerance: number;
  /** Advanced mode: energy uses special relativity. */
  readonly relativistic: boolean;
}

export interface AcceleratorOutcome extends AttemptOutcome {
  readonly cyclotronFrequencyMHz: number;
  readonly resonanceError: number | null;
  readonly classicalEnergyMeV: number;
  readonly relativisticEnergyMeV: number;
  readonly energyMeV: number;
}

export const ACCELERATOR_META: RoundGameMeta = {
  id: "particle-accelerator",
  title: "Particle Accelerator Laboratory",
  eyebrow: "ELECTRICITY & MAGNETISM · ACCELERATORS",
  modelTag: "CYCLOTRON · RELATIVISTIC ADVANCED MODE",
  introduction: "Tune a proton cyclotron: match its magnetic field to the accelerating radio-frequency field, set the size, and reach a target beam energy. In the final round, switch to the advanced relativistic mode.",
  instructions: "Predict the beam energy, set the controls, then run the beam. The protons only gain energy if the RF frequency matches the cyclotron frequency (resonance).",
  formula: "f = qB/(2πm)  ·  E = (qBR)²/(2m)  ·  Eₖ = √((pc)² + (mc²)²) − mc²",
  formulaCaption: "q and m are the proton's charge and mass, B the field, R the extraction radius, p = qBR the momentum and c the speed of light. The last relation is the relativistic (advanced) form.",
  explanation: "In a magnetic field a proton circles with a frequency f = qB/(2πm) that does not depend on its speed. A voltage that alternates at exactly that frequency pushes the proton forward every half-turn, so it spirals outward gaining energy. At the largest radius R its momentum is p = qBR, which gives its final energy. At high energies relativity matters: the proton's effective mass grows, its frequency drops out of step with the RF, and the classical energy formula overestimates the beam energy. The advanced round uses the relativistic energy.",
  assumptions: "A uniform magnetic field, ideal RF timing, and a single proton with no space-charge or radiation. Rounds 1 and 2 use the classical (non-relativistic) model, valid when the energy is well below the proton's rest energy of 938 MeV. Round 3 is an explicitly labelled advanced relativistic mode.",
  learningObjectives: ["Find the resonance condition f = qB/(2πm) for a cyclotron.", "Relate the extraction radius and field to the beam energy.", "Recognise when relativistic corrections become important."],
  objective: { title: "Run every experiment", description: "Meet each beam specification.", unit: "runs" },
  controlsHeading: "Set up the accelerator",
  submitLabel: "Run the beam",
  solvedLabel: "Beam on target!",
  nextLabel: "Next run",
};

export const ACCELERATOR_ROUNDS: readonly AcceleratorRound[] = Object.freeze([
  {
    id: "resonance", title: "Find the resonance", difficulty: "Beginner", rfFrequencyHertz: 20e6, resonanceTolerance: 0.01, targetEnergyMeV: null, energyTolerance: 0, relativistic: false,
    situation: "The RF supply runs at 20 MHz. Set the magnetic field so the cyclotron frequency matches it to within 1%. The dee radius is 0.50 m.",
    controls: [slider("field", "Magnetic field", "T", 0.5, 2, 0.005, 1), fixed("radius", "Extraction radius", "m", 0.5)],
    hint: "Resonance means f = qB/(2πm) = 20 MHz, so B = 2πm f / q.",
  },
  {
    id: "ten-mev", title: "A 10 MeV beam", difficulty: "Intermediate", rfFrequencyHertz: 15e6, resonanceTolerance: 0.01, targetEnergyMeV: 10, energyTolerance: 0.06, relativistic: false,
    situation: "With a 15 MHz RF supply, produce a 10 MeV proton beam (± 6%). You must match the resonance (± 1%) and then choose the extraction radius.",
    controls: [slider("field", "Magnetic field", "T", 0.5, 2, 0.005, 1), slider("radius", "Extraction radius", "m", 0.2, 1, 0.01, 0.5)],
    hint: "First find B from the resonance. Then E = (qBR)²/(2m), so R = √(2mE)/(qB), with E = 10 MeV = 1.6 × 10⁻¹² J.",
  },
  {
    id: "relativistic", title: "Advanced: relativistic regime", difficulty: "Advanced", rfFrequencyHertz: null, resonanceTolerance: 0, targetEnergyMeV: 250, energyTolerance: 0.03, relativistic: true,
    situation: "Advanced mode. A synchrocyclotron adjusts its RF frequency as the protons gain mass, so only the field (1.5 T) and radius matter. Reach a 250 MeV beam (± 3%). Use the relativistic energy, because the classical formula would give the wrong radius.",
    controls: [fixed("field", "Magnetic field", "T", 1.5), slider("radius", "Extraction radius", "m", 0.5, 3, 0.01, 1.5)],
    hint: "p = qBR and Eₖ = √((pc)² + (mc²)²) − mc², with mc² = 938.3 MeV. Solve for pc = √(Eₖ² + 2Eₖ mc²), then R = pc/(c q B).",
  },
]);

export function runAccelerator(round: AcceleratorRound, v: NumericControl): AcceleratorOutcome {
  const B = v.field as number;
  const R = v.radius as number;
  const frequency = calculateCyclotronFrequencyHz(Q, M, B);
  const classical = joulesToMegaelectronvolts(calculateClassicalExtractionEnergy(Q, M, B, R));
  const relativistic = joulesToMegaelectronvolts(calculateRelativisticExtractionEnergy(Q, M, B, R));
  const energy = round.relativistic ? relativistic : classical;
  const resonanceError = round.rfFrequencyHertz === null ? null : Math.abs(frequency - round.rfFrequencyHertz) / round.rfFrequencyHertz;
  const resonant = resonanceError === null || resonanceError <= round.resonanceTolerance;
  const energyError = round.targetEnergyMeV === null ? 0 : Math.abs(energy - round.targetEnergyMeV) / round.targetEnergyMeV;
  const energyOk = round.targetEnergyMeV === null || energyError <= round.energyTolerance;
  const success = resonant && energyOk;
  const problems: string[] = [];
  if (!resonant) problems.push(`The cyclotron frequency is ${(frequency / 1e6).toFixed(2)} MHz but the RF is ${(round.rfFrequencyHertz! / 1e6).toFixed(0)} MHz: the protons fall out of step and gain no energy. ${frequency > round.rfFrequencyHertz! ? "Lower" : "Raise"} the field.`);
  if (resonant && !energyOk) problems.push(`The beam reaches ${energy.toFixed(1)} MeV, not ${round.targetEnergyMeV} MeV.${round.relativistic ? ` (The classical formula would say ${classical.toFixed(0)} MeV, which is wrong here.)` : ""}`);
  const accuracy = Math.min(resonanceError === null ? 1 : 1 - resonanceError / round.resonanceTolerance, round.targetEnergyMeV === null ? 1 : 1 - energyError / round.energyTolerance);
  return {
    success, cyclotronFrequencyMHz: frequency / 1e6, resonanceError, classicalEnergyMeV: classical, relativisticEnergyMeV: relativistic, energyMeV: energy,
    accuracyFraction: success ? Math.max(0, accuracy) : 0,
    predictionActual: energy,
    feedback: success ? `A ${energy.toFixed(1)} MeV beam${round.rfFrequencyHertz ? " in resonance" : ""}.` : problems.join(" "),
  };
}

export function energyCurve(round: AcceleratorRound, v: NumericControl, relativistic: boolean): { x: number; y: number }[] {
  const radiusSpec = round.controls.find((c) => c.key === "radius")!;
  const maximum = Math.max(radiusSpec.maximum, 1);
  return Array.from({ length: 41 }, (_, i) => {
    const radius = 0.05 + ((maximum - 0.05) * i) / 40;
    const out = runAccelerator({ ...round, controls: round.controls }, { ...v, radius });
    return { x: radius, y: relativistic ? out.relativisticEnergyMeV : out.classicalEnergyMeV };
  });
}

export const particleAccelerator = defineNumericGame<AcceleratorRound, AcceleratorOutcome>({
  meta: ACCELERATOR_META,
  rounds: ACCELERATOR_ROUNDS,
  prediction: () => ({ label: "Your prediction of the beam energy", unit: "MeV", placeholder: "e.g. 20", step: 0.1 }),
  evaluate: (round, values) => runAccelerator(round, values),
});
