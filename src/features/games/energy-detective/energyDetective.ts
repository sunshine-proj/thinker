import { defineNumericGame, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { SPEED_OF_LIGHT } from "../../../physics/core";
import { calculateConvertedFraction, calculateEnergyFromMass, calculateMassFromEnergy, calculateReactionEnergyMeV, findNuclide } from "../../../physics/nuclear";
import { HYDROGEN_ATOM_MASS_U, NEUTRON_MASS_U } from "../../../physics/nuclear/nuclides";

export type EnergyKind = "sun" | "hydrogen" | "reaction";

export interface EnergyRound extends NumericRound { readonly kind: EnergyKind }

export interface EnergyOutcome extends AttemptOutcome {
  readonly truth: number;
  readonly unit: string;
  readonly convertedFraction: number | null;
}

export const SOLAR_LUMINOSITY = 3.828e26;
export const SUN_TARGET_TONNES = calculateMassFromEnergy(SOLAR_LUMINOSITY) / 1e9;
export const SUN_TOLERANCE = 0.1;
export const HYDROGEN_FRACTION = calculateConvertedFraction(4 * HYDROGEN_ATOM_MASS_U, findNuclide("He-4").atomicMass);
export const HYDROGEN_TERAJOULES = calculateEnergyFromMass(HYDROGEN_FRACTION) / 1e12;
export const HYDROGEN_TOLERANCE = 15;
export const REACTION_Q = calculateReactionEnergyMeV([findNuclide("H-2").atomicMass, findNuclide("H-3").atomicMass], [findNuclide("He-4").atomicMass, NEUTRON_MASS_U]);
export const REACTION_TOLERANCE = 0.2;

export const ENERGY_META: RoundGameMeta = {
  id: "energy-detective",
  title: "Energy Detective",
  eyebrow: "NUCLEAR PHYSICS · MASS-ENERGY",
  modelTag: "E = Δm c²",
  introduction: "Where does the Sun's light come from? Hunt for the missing mass: weigh what the Sun loses every second, what one kilogram of hydrogen gives when it fuses, and what a single fusion reaction releases.",
  instructions: "Predict, then solve the case. When a system gives off energy its rest mass drops by the energy divided by c². The change is tiny per reaction, but c² is huge, so a little mass is a lot of energy.",
  formula: "E = Δm c²  ·  Δm = E/c²  ·  c = 3.00×10⁸ m/s",
  formulaCaption: "E is the energy released, Δm the loss of rest mass and c the speed of light. One atomic mass unit is equivalent to 931.494 MeV.",
  explanation: "Einstein's relation E = mc² says mass is a form of energy. When nuclei fuse into a more tightly bound nucleus, the products weigh slightly less than the reactants and the missing mass leaves as the energy of light and motion. The Sun radiates 3.8×10²⁶ W, which costs it 4.3 million tonnes of mass every second, and it has lost only a tiny fraction of its mass in 4.6 billion years. Fusing hydrogen into helium converts 0.71 % of the mass into energy: a kilogram of hydrogen yields 6.4×10¹⁴ J, millions of times more than burning a kilogram of coal.",
  assumptions: "Energies are the total released, including kinetic energy of the products and the radiation; the neutrinos that escape the Sun carry about 2 % extra which is ignored. Masses are neutral atomic masses; the small electron-positron annihilation corrections are absorbed by using atomic masses. The solar luminosity is treated as constant.",
  learningObjectives: ["Use E = Δmc² in both directions.", "Compute the fraction of mass converted in hydrogen fusion.", "Find the energy released by a nuclear reaction from the masses."],
  objective: { title: "Solve the cases", description: "Close every case.", unit: "cases" },
  controlsHeading: "Your answer",
  submitLabel: "Check the energy",
  solvedLabel: "Case closed!",
  nextLabel: "Next case",
};

export const ENERGY_ROUNDS: readonly EnergyRound[] = Object.freeze([
  {
    id: "the-sun-loses-weight", title: "The Sun loses weight", difficulty: "Beginner", kind: "sun",
    situation: `The Sun radiates ${SOLAR_LUMINOSITY.toExponential(3)} W. How much mass does it lose each second, in millions of tonnes? (± ${SUN_TOLERANCE})`,
    controls: [slider("answer", "Mass lost per second", "million tonnes", 0.1, 10, 0.01, 1)],
    hint: "Energy per second is the power, so m = P/c² per second, with c² = 9.0×10¹⁶ m²/s².",
  },
  {
    id: "a-kilogram-of-hydrogen", title: "A kilogram of hydrogen", difficulty: "Intermediate", kind: "hydrogen",
    situation: `Four hydrogen atoms (1.007825 u each) fuse into one helium-4 atom (4.002603 u). How much energy, in terajoules (10¹² J), is released by fusing 1 kg of hydrogen? (± ${HYDROGEN_TOLERANCE} TJ)`,
    controls: [slider("answer", "Energy released", "TJ", 0, 1000, 1, 100)],
    hint: "The fraction of mass lost is (4×1.007825 − 4.002603)/(4×1.007825); multiply by 1 kg and c².",
  },
  {
    id: "weigh-a-reaction", title: "Weigh a reaction", difficulty: "Advanced", kind: "reaction",
    situation: `In D + T → ⁴He + n the masses are 2.014102 u + 3.016049 u → 4.002603 u + 1.008665 u. Find the energy released in MeV (± ${REACTION_TOLERANCE} MeV).`,
    controls: [slider("answer", "Energy released", "MeV", 0, 30, 0.01, 10)],
    hint: "Δm = (2.014102 + 3.016049) − (4.002603 + 1.008665) u, and 1 u = 931.494 MeV.",
  },
]);

export function runEnergy(round: EnergyRound, v: NumericControl): EnergyOutcome {
  const guess = v.answer as number;
  let truth: number;
  let tolerance: number;
  let unit: string;
  let fraction: number | null = null;
  let explanation: string;
  if (round.kind === "sun") {
    truth = SUN_TARGET_TONNES; tolerance = SUN_TOLERANCE; unit = "million tonnes";
    explanation = `m = L/c² = ${SOLAR_LUMINOSITY.toExponential(3)} / ${(SPEED_OF_LIGHT ** 2).toExponential(3)} = ${(truth * 1e9).toExponential(2)} kg each second`;
  } else if (round.kind === "hydrogen") {
    truth = HYDROGEN_TERAJOULES; tolerance = HYDROGEN_TOLERANCE; unit = "TJ"; fraction = HYDROGEN_FRACTION;
    explanation = `${(HYDROGEN_FRACTION * 100).toFixed(2)} % of the mass is converted: E = ${HYDROGEN_FRACTION.toFixed(5)} × 1 kg × c²`;
  } else {
    truth = REACTION_Q; tolerance = REACTION_TOLERANCE; unit = "MeV";
    explanation = `Δm = ${(REACTION_Q / 931.494).toFixed(5)} u, and 1 u = 931.494 MeV`;
  }
  const error = Math.abs(guess - truth);
  const success = error <= tolerance;
  return {
    truth, unit, convertedFraction: fraction, success, accuracyFraction: success ? 1 - error / tolerance : 0, predictionActual: truth,
    feedback: success ? `${explanation}: ${truth.toFixed(round.kind === "sun" ? 2 : round.kind === "reaction" ? 2 : 0)} ${unit}.` : `${guess} ${unit} is ${guess > truth ? "too much" : "too little"}: ${explanation}.`,
  };
}

export const energyDetective = defineNumericGame<EnergyRound, EnergyOutcome>({
  meta: ENERGY_META,
  rounds: ENERGY_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "sun" ? { label: "Your prediction of the mass lost per second", unit: "million tonnes", placeholder: "e.g. 4", step: 0.01 }
    : round.kind === "hydrogen" ? { label: "Your prediction of the energy", unit: "TJ", placeholder: "e.g. 640", step: 1 }
    : { label: "Your prediction of the energy", unit: "MeV", placeholder: "e.g. 17.6", step: 0.01 },
  evaluate: (round, values) => runEnergy(round, values),
});
