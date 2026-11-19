import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { ELECTRON_MASS, ELECTRON_VOLT } from "../../../physics/core";
import { calculateBarrierTransmissionEv, calculateBoxTransitionWavelength, calculateBoxWidthForWavelength, calculateWidthForTransmission } from "../../../physics/quantum";

export type TunnelKind = "dot" | "barrier" | "stm";
export interface TunnelRound extends NumericRound { readonly kind: TunnelKind }
export interface TunnelOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const DOT = { wavelengthNm: 600, tolerance: 0.01 } as const;
export const BARRIER = { energyEv: 1, heightEv: 5, low: 0.009, high: 0.011 } as const;
export const STM = { energyEv: 0.1, heightEv: 4.6, gapNm: 0.5, factor: 10, toleranceNm: 0.005 } as const;

/** Extra gap (nm) that makes the STM current ten times smaller (exact barrier formula). */
export function stmGapIncrease(): number {
  const base = calculateBarrierTransmissionEv(STM.energyEv, STM.heightEv, STM.gapNm, ELECTRON_MASS);
  const width = calculateWidthForTransmission(STM.energyEv * ELECTRON_VOLT, STM.heightEv * ELECTRON_VOLT, ELECTRON_MASS, base / STM.factor);
  return width * 1e9 - STM.gapNm;
}

export const TUNNEL_META: RoundGameMeta = {
  id: "quantum-tunnel",
  title: "Quantum Tunnel",
  eyebrow: "MODERN PHYSICS · QUANTUM MECHANICS",
  modelTag: "QUANTISATION & TUNNELLING",
  introduction: "In the quantum world, a trapped electron can only have certain energies, and it can pass through walls it does not have the energy to climb. Size a quantum dot so it glows orange, build a barrier that lets through exactly 1 % of electrons, and find how sensitive a scanning tunnelling microscope is.",
  instructions: "Predict, then set the width. An electron confined to a box behaves like a standing wave, so only certain energies fit. At a barrier, its wave does not stop dead but fades inside, and a little of it leaks through if the barrier is thin.",
  formula: "Eₙ = n² h² / (8 m L²)  ·  T = 1 / (1 + V² sinh²(κa) / (4E(V − E))), κ = √(2m(V − E))/ħ",
  formulaCaption: "Eₙ is the energy of level n in a box of width L, h Planck's constant, m the electron mass, T the chance of passing a barrier of height V and width a with energy E, and ħ = h/2π.",
  explanation: "A confined electron's wave must fit inside its box like a standing wave on a guitar string, so only certain wavelengths, and therefore energies, are allowed; the levels spread apart as the box shrinks, as 1/L². Quantum dots use this: a slightly smaller dot emits bluer light. At a barrier higher than its energy, a classical particle would always bounce back. The quantum wave instead decays exponentially inside the barrier, and whatever is left on the far side is the probability of tunnelling through. Because the decay is exponential, tiny changes in the barrier width change the current enormously: a scanning tunnelling microscope uses this to feel individual atoms.",
  assumptions: "One dimension, an infinitely deep box and a perfectly rectangular barrier, a free electron mass and no interactions. Real quantum dots, insulating layers and STM gaps are only approximately boxes and barriers, so the numbers show the physics, not device specifications.",
  learningObjectives: ["Relate a confined particle's energy levels to the size of its box.", "Use the exact barrier formula to find a tunnelling probability.", "Explain why tunnelling depends so strongly on barrier width."],
  objective: { title: "Tunnel through", description: "Solve each quantum problem.", unit: "problems" },
  controlsHeading: "Your width",
  submitLabel: "Fire the electrons",
  solvedLabel: "Quantum success!",
  nextLabel: "Next problem",
};

export const TUNNEL_ROUNDS: readonly TunnelRound[] = Object.freeze([
  {
    id: "orange-dot", title: "The orange quantum dot", difficulty: "Beginner", kind: "dot",
    situation: `An electron in a tiny box jumps from level 2 to level 1 and emits a photon. Choose the box width so the photon is orange, ${DOT.wavelengthNm} nm (± ${DOT.tolerance * 100} %).`,
    controls: [slider("width", "Box width", "nm", 0.3, 2, 0.001, 1)],
    hint: "ΔE = (2² − 1²) h²/(8mL²) = hc/λ. Solve for L.",
  },
  {
    id: "one-percent-barrier", title: "The 1 % barrier", difficulty: "Intermediate", kind: "barrier",
    situation: `Electrons with ${BARRIER.energyEv} eV meet a ${BARRIER.heightEv} eV barrier. Choose its width so that between ${BARRIER.low * 100} % and ${BARRIER.high * 100} % of them tunnel through.`,
    controls: [fixed("height", "Barrier height", "eV", BARRIER.heightEv), slider("width", "Barrier width", "nm", 0.05, 1, 0.0005, 0.5)],
    hint: "For a wide barrier T ≈ 16E(V − E)/V² · e^(−2κa). Start there and adjust.",
  },
  {
    id: "stm-sensitivity", title: "The microscope's sensitivity", difficulty: "Advanced", kind: "stm",
    situation: `A scanning tunnelling microscope tip sits ${STM.gapNm} nm above a surface (barrier ${STM.heightEv} eV, electron energy ${STM.energyEv} eV). How much must the gap widen for the tunnelling current to fall ${STM.factor} times? (± ${STM.toleranceNm} nm)`,
    controls: [fixed("gap", "Starting gap", "nm", STM.gapNm), slider("increase", "Gap increase", "nm", 0.01, 0.5, 0.001, 0.2)],
    hint: "The current is proportional to T ≈ e^(−2κa), so Δa ≈ ln 10 / (2κ).",
  },
]);

export function runTunnel(round: TunnelRound, v: NumericControl): TunnelOutcome {
  if (round.kind === "dot") {
    const width = v.width as number;
    const lambda = calculateBoxTransitionWavelength(2, 1, ELECTRON_MASS, width * 1e-9) * 1e9;
    const truth = calculateBoxWidthForWavelength(2, 1, ELECTRON_MASS, DOT.wavelengthNm * 1e-9) * 1e9;
    const error = Math.abs(lambda - DOT.wavelengthNm) / DOT.wavelengthNm;
    const success = error <= DOT.tolerance;
    return {
      headline: lambda, unit: "nm", success, accuracyFraction: success ? 1 - error / DOT.tolerance : 0, predictionActual: truth,
      feedback: success
        ? `A ${width.toFixed(3)} nm box gives a ${lambda.toFixed(0)} nm photon, orange. A smaller box would push the levels apart and glow bluer.`
        : `A ${width.toFixed(3)} nm box emits ${lambda.toFixed(0)} nm, ${lambda > DOT.wavelengthNm ? "too red: make the box smaller" : "too blue: make the box larger"}.`,
    };
  }
  if (round.kind === "barrier") {
    const width = v.width as number;
    const transmission = calculateBarrierTransmissionEv(BARRIER.energyEv, BARRIER.heightEv, width, ELECTRON_MASS);
    const truth = calculateWidthForTransmission(BARRIER.energyEv * ELECTRON_VOLT, BARRIER.heightEv * ELECTRON_VOLT, ELECTRON_MASS, 0.01) * 1e9;
    const success = transmission >= BARRIER.low && transmission <= BARRIER.high;
    return {
      headline: transmission, unit: "", success, accuracyFraction: success ? 1 - Math.abs(transmission - 0.01) / 0.001 : 0, predictionActual: truth,
      feedback: success
        ? `A ${width.toFixed(4)} nm barrier lets ${(transmission * 100).toFixed(2)} % of the electrons through, although none has the energy to climb it.`
        : `A ${width.toFixed(4)} nm barrier lets ${(transmission * 100).toFixed(3)} % through, ${transmission > BARRIER.high ? "too many: widen it" : "too few: thin it"}.`,
    };
  }
  const increase = v.increase as number;
  const truth = stmGapIncrease();
  const before = calculateBarrierTransmissionEv(STM.energyEv, STM.heightEv, STM.gapNm, ELECTRON_MASS);
  const after = calculateBarrierTransmissionEv(STM.energyEv, STM.heightEv, STM.gapNm + increase, ELECTRON_MASS);
  const error = Math.abs(increase - truth);
  const success = error <= STM.toleranceNm;
  return {
    headline: before / after, unit: "×", success, accuracyFraction: success ? 1 - error / STM.toleranceNm : 0, predictionActual: truth,
    feedback: success
      ? `Widening the gap by just ${increase.toFixed(3)} nm, less than half an atom, cuts the current ${(before / after).toFixed(1)} times. That is how an STM feels single atoms.`
      : `A ${increase.toFixed(3)} nm increase changes the current ${(before / after).toFixed(1)} times, not 10.`,
  };
}

export const quantumTunnel = defineNumericGame<TunnelRound, TunnelOutcome>({
  meta: TUNNEL_META,
  rounds: TUNNEL_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "stm" ? { label: "Your prediction of the gap increase", unit: "nm", placeholder: "e.g. 0.2", step: 0.001 }
    : { label: "Your prediction of the width", unit: "nm", placeholder: "e.g. 0.5", step: 0.001 },
  evaluate: (round, values) => runTunnel(round, values),
});
