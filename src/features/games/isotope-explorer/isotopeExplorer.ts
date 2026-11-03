import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateStableProtonNumber, countDecaysBetween, findNuclide, findNuclideByNumbers } from "../../../physics/nuclear";

export type IsotopeKind = "identify" | "daughter" | "series";

export interface IsotopeRound extends NumericRound { readonly kind: IsotopeKind }

export interface IsotopeOutcome extends AttemptOutcome {
  /** Nucleus shown on the chart: protons and neutrons. */
  readonly protons: number;
  readonly neutrons: number;
  readonly symbol: string | null;
  readonly decays: { alphas: number; betas: number } | null;
}

export const COBALT = findNuclide("Co-60");
export const IODINE = findNuclide("I-131");
export const XENON = findNuclide("Xe-131");
export const URANIUM = findNuclide("U-238");
export const LEAD = findNuclide("Pb-206");

export const ISOTOPE_META: RoundGameMeta = {
  id: "isotope-explorer",
  title: "Isotope Explorer",
  eyebrow: "NUCLEAR PHYSICS · CHART OF NUCLIDES",
  modelTag: "ISOTOPES & DECAY MODES",
  introduction: "Explore the chart of nuclides, where every nucleus has a place by its numbers of protons and neutrons. Find a medical isotope, follow a beta decay to its daughter, and count the decays in the uranium series.",
  instructions: "Predict, then place the nucleus. Isotopes share the proton number but differ in neutrons. A nucleus far from the valley of stability decays toward it: alpha decay lowers Z by 2 and A by 4, beta-minus raises Z by 1 at the same A.",
  formula: "A = Z + N  ·  α: (Z, A) → (Z−2, A−4)  ·  β⁻: (Z, A) → (Z+1, A)  ·  β⁺: (Z, A) → (Z−1, A)",
  formulaCaption: "Z is the number of protons, N the number of neutrons and A = Z + N the mass number. Charge and nucleon number are conserved in every decay.",
  explanation: "The chart of nuclides plots every nucleus by neutron and proton number. Stable nuclei lie in a narrow valley that starts at N = Z for light elements and bends toward more neutrons as electric repulsion grows. A nucleus with too many neutrons turns one into a proton by beta-minus decay, moving up and to the left; a very heavy nucleus sheds an alpha particle, moving down by two protons and two neutrons. Uranium-238 reaches stable lead-206 only through a chain of 8 alpha and 6 beta decays, passing through radium and radon on the way.",
  assumptions: "The nuclide data are literature values (rounded half-lives), the valley of stability line is the minimum of the liquid-drop mass formula (not exact: it ignores shell effects), and only the main decay path is followed. Each decay is treated as ending in the ground state of the daughter.",
  learningObjectives: ["Describe a nucleus by Z, N and A.", "Predict the daughter of an alpha or beta decay.", "Count the alpha and beta decays in a radioactive series."],
  objective: { title: "Chart the nuclei", description: "Place every nucleus.", unit: "nuclei" },
  controlsHeading: "Place the nucleus",
  submitLabel: "Check the chart",
  solvedLabel: "Nucleus placed!",
  nextLabel: "Next nucleus",
};

export const ISOTOPE_ROUNDS: readonly IsotopeRound[] = Object.freeze([
  {
    id: "find-cobalt-60", title: "Find cobalt-60", difficulty: "Beginner", kind: "identify",
    situation: "Cobalt-60, a gamma source used in radiotherapy (half-life 5.27 years), has the atomic number of cobalt, 27, and a mass number of 60. Place it on the chart: how many protons and neutrons does it have?",
    controls: [slider("protons", "Protons Z", "", 1, 92, 1, 20), slider("neutrons", "Neutrons N", "", 0, 150, 1, 20)],
    hint: "Cobalt has 27 protons. The mass number A = Z + N = 60, so N = 33.",
  },
  {
    id: "follow-the-beta-decay", title: "Follow the beta decay", difficulty: "Intermediate", kind: "daughter",
    situation: "Iodine-131 (Z = 53, A = 131) has too many neutrons and decays by beta-minus emission, used to treat thyroid disease. Give the proton number and mass number of the daughter nucleus.",
    controls: [fixed("parentZ", "Parent Z", "", IODINE.protons), fixed("parentA", "Parent A", "", IODINE.massNumber), slider("protons", "Daughter protons Z", "", 1, 92, 1, 53), slider("mass", "Daughter mass number A", "", 1, 240, 1, 131)],
    hint: "In beta-minus decay a neutron becomes a proton: Z increases by 1 and A stays the same.",
  },
  {
    id: "down-the-uranium-series", title: "Down the uranium series", difficulty: "Advanced", kind: "series",
    situation: "Uranium-238 (Z = 92) ends as stable lead-206 (Z = 82). How many alpha decays and how many beta-minus decays take place along the way?",
    controls: [fixed("parentZ", "Parent Z", "", URANIUM.protons), fixed("parentA", "Parent A", "", URANIUM.massNumber), slider("alphas", "Alpha decays", "", 0, 12, 1, 4), slider("betas", "Beta-minus decays", "", 0, 12, 1, 4)],
    hint: "Each alpha removes 4 from A: (238 − 206)/4 alphas. Then use the change in Z: −2 per alpha and +1 per beta.",
  },
]);

export function runIsotope(round: IsotopeRound, v: NumericControl): IsotopeOutcome {
  if (round.kind === "identify") {
    const z = v.protons as number;
    const n = v.neutrons as number;
    const a = z + n;
    const found = findNuclideByNumbers(z, a);
    const success = z === COBALT.protons && a === COBALT.massNumber;
    return {
      protons: z, neutrons: n, symbol: found?.symbol ?? null, decays: null, success, accuracyFraction: success ? 1 : 0, predictionActual: COBALT.massNumber - COBALT.protons,
      feedback: success ? `Z = 27 and N = 33 give A = 60: cobalt-60, a beta-minus emitter with a half-life of 5.27 years that decays to stable nickel-60.`
        : z !== COBALT.protons ? `Z = ${z} is not cobalt. The element is set by the number of protons: 27.`
        : `Z = 27 with N = ${n} gives A = ${a}${found ? ` (${found.symbol})` : ""}, not 60. Cobalt-60 needs ${COBALT.massNumber - COBALT.protons} neutrons.`,
    };
  }
  if (round.kind === "daughter") {
    const z = v.protons as number;
    const a = v.mass as number;
    const success = z === XENON.protons && a === XENON.massNumber;
    return {
      protons: z, neutrons: Math.max(0, a - z), symbol: findNuclideByNumbers(z, a)?.symbol ?? null, decays: null, success, accuracyFraction: success ? 1 : 0, predictionActual: XENON.protons,
      feedback: success ? "A neutron becomes a proton, so the daughter has Z = 54 and the same A = 131: stable xenon-131, one step toward the valley of stability."
        : a !== IODINE.massNumber ? `Beta decay does not change the mass number: A stays ${IODINE.massNumber}, not ${a}.`
        : `Beta-minus decay raises Z by 1, from 53 to 54, not ${z}.`,
    };
  }
  const alphas = v.alphas as number;
  const betas = v.betas as number;
  const finalZ = URANIUM.protons - 2 * alphas + betas;
  const finalA = URANIUM.massNumber - 4 * alphas;
  const needed = countDecaysBetween({ protons: URANIUM.protons, massNumber: URANIUM.massNumber }, { protons: LEAD.protons, massNumber: LEAD.massNumber });
  const success = finalZ === LEAD.protons && finalA === LEAD.massNumber;
  return {
    protons: finalZ, neutrons: Math.max(0, finalA - finalZ), symbol: findNuclideByNumbers(finalZ, finalA)?.symbol ?? null, decays: needed, success, accuracyFraction: success ? 1 : 0, predictionActual: needed?.alphas ?? 8,
    feedback: success ? `${alphas} alphas take A from 238 to ${finalA}, and with ${betas} betas Z goes 92 − ${2 * alphas} + ${betas} = ${finalZ}: lead-206.`
      : finalA !== LEAD.massNumber ? `${alphas} alpha decays leave A = ${finalA}, but lead-206 needs A = 206: only alphas change A, by 4 each.`
      : `With ${alphas} alphas and ${betas} betas the nucleus ends at Z = ${finalZ}, not 82. Each beta-minus adds one proton.`,
  };
}

export const isotopeExplorer = defineNumericGame<IsotopeRound, IsotopeOutcome>({
  meta: ISOTOPE_META,
  rounds: ISOTOPE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "identify" ? { label: "Your prediction of the number of neutrons", unit: "", placeholder: "e.g. 33", step: 1 }
    : round.kind === "daughter" ? { label: "Your prediction of the daughter's proton number", unit: "", placeholder: "e.g. 54", step: 1 }
    : { label: "Your prediction of the number of alpha decays", unit: "", placeholder: "e.g. 8", step: 1 },
  evaluate: (round, values) => runIsotope(round, values),
});

export const VALLEY: readonly { x: number; y: number }[] = Array.from({ length: 120 }, (_, i) => {
  const a = 2 + 2 * i;
  const z = calculateStableProtonNumber(a);
  return { x: a - z, y: z };
});
