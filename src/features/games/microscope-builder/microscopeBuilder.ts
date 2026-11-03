import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateEyepieceMagnification,
  calculateMicroscopeMagnification,
  calculateObjectiveMagnification,
  calculateResolutionLimit,
  calculateSpecimenDistance,
  calculateUsefulMagnificationLimit,
} from "../../../physics/optics";

export type MicroscopeKind = "magnify" | "resolve" | "fit";

export interface MicroscopeRound extends NumericRound { readonly kind: MicroscopeKind }

export interface MicroscopeOutcome extends AttemptOutcome {
  readonly objectiveMagnification: number;
  readonly eyepieceMagnification: number;
  readonly totalMagnification: number;
  readonly specimenDistanceMm: number;
  readonly resolutionNanometers: number | null;
  readonly usefulLimit: number | null;
}

export const GREEN_LIGHT_METERS = 550e-9;
export const DETAIL_METERS = 0.5e-6;
/** The smallest feature the eye can comfortably see at the near point, m. */
export const EYE_DETAIL_METERS = 0.2e-3;
export const STAND_LIMIT_METERS = 0.2;

export const MICROSCOPE_META: RoundGameMeta = {
  id: "microscope-builder",
  title: "Microscope Builder",
  eyebrow: "OPTICS & LIGHT · MICROSCOPES",
  modelTag: "COMPOUND MICROSCOPE",
  introduction: "Combine an objective lens and an eyepiece to build a microscope: reach a target magnification, resolve a tiny structure, and fit the instrument on its stand.",
  instructions: "Predict the total magnification, choose the lenses, then look through the microscope. The two lenses multiply: the objective makes a real enlarged image and the eyepiece magnifies that image again.",
  formula: "M = (L / fₒ) × (25 cm / fₑ)  ·  d = 0.61 λ / NA  ·  useful M ≤ 1000 × NA",
  formulaCaption: "L is the tube length, fₒ and fₑ are the focal lengths of the objective and eyepiece, λ the wavelength and NA the numerical aperture of the objective. d is the smallest separation that can be resolved.",
  explanation: "The objective lens, with a very short focal length, sits just beyond the specimen and forms a real, inverted, enlarged image a tube length further along. The eyepiece works as a magnifying glass on that image. Magnifications multiply, so shorter focal lengths give more magnification. But magnification is not detail: light diffraction limits the smallest feature that can be told apart to d = 0.61 λ/NA, so only a larger numerical aperture (or shorter wavelength) sees finer structure. Enlarging beyond about 1000 × NA only makes a bigger blur.",
  assumptions: "Thin lenses without aberrations, paraxial rays, a relaxed eye with the final image at infinity and a 25 cm near point, and green light of 550 nm. Numerical aperture is chosen independently of the focal length here, although real objectives link them.",
  learningObjectives: ["Multiply objective and eyepiece magnifications to find the total.", "Use the diffraction limit to decide whether a detail can be resolved.", "Explain why too much magnification adds no new information."],
  objective: { title: "Build every microscope", description: "Meet each specification.", unit: "microscopes" },
  controlsHeading: "Choose the lenses",
  submitLabel: "Look through the microscope",
  solvedLabel: "Microscope ready!",
  nextLabel: "Next specimen",
};

export const MICROSCOPE_ROUNDS: readonly MicroscopeRound[] = Object.freeze([
  {
    id: "magnify-cell", title: "Magnify a cell", difficulty: "Beginner", kind: "magnify",
    situation: "A student needs a total magnification of 400× (within 5 %) to count the cells on a slide. The tube length is fixed at 160 mm. Choose the focal lengths of the objective and the eyepiece.",
    controls: [fixed("tube", "Tube length", "mm", 160), slider("objective", "Objective focal length", "mm", 2, 20, 0.5, 10), slider("eyepiece", "Eyepiece focal length", "mm", 10, 50, 1, 40)],
    hint: "The objective magnifies by L/fₒ and the eyepiece by 250 mm/fₑ. Their product must be 400, so fₒ × fₑ = 160 × 250 / 400 = 100 mm².",
  },
  {
    id: "resolve-bacterium", title: "Resolve the bacterium", difficulty: "Intermediate", kind: "resolve",
    situation: "Two features of a bacterium are 0.5 µm apart. With green light (550 nm) choose a numerical aperture that resolves them, and lenses whose total magnification makes the detail at least 0.2 mm in the image but does not exceed 1000 × NA.",
    controls: [fixed("tube", "Tube length", "mm", 160), slider("na", "Numerical aperture of the objective", "", 0.1, 1.4, 0.01, 0.5), slider("objective", "Objective focal length", "mm", 2, 10, 0.5, 8), slider("eyepiece", "Eyepiece focal length", "mm", 5, 25, 1, 20)],
    hint: "Resolving 0.5 µm needs NA ≥ 0.61 × 550 nm / 500 nm. The detail then must be magnified to 0.2 mm, so M ≥ 0.2 mm / 0.5 µm = 400, while M ≤ 1000 × NA.",
  },
  {
    id: "fit-the-stand", title: "Fit the stand", difficulty: "Advanced", kind: "fit",
    situation: "A lab microscope has a fixed 20 mm eyepiece. It must give a total magnification of 600× (within 3 %), and the tube may not be longer than 200 mm. Choose the objective's focal length and the tube length.",
    controls: [fixed("eyepiece", "Eyepiece focal length", "mm", 20), slider("objective", "Objective focal length", "mm", 2, 10, 0.25, 6), slider("tube", "Tube length", "mm", 100, 250, 5, 150)],
    hint: "The eyepiece gives 250/20 = 12.5×, so the objective must give 48× = L/fₒ. Pick fₒ, then L = 48 fₒ, and check that L ≤ 200 mm.",
  },
]);

export function runMicroscope(round: MicroscopeRound, v: NumericControl): MicroscopeOutcome {
  const tube = (v.tube as number) / 1000;
  const objective = (v.objective as number) / 1000;
  const eyepiece = (v.eyepiece as number) / 1000;
  const mo = calculateObjectiveMagnification(tube, objective);
  const me = calculateEyepieceMagnification(eyepiece);
  const total = calculateMicroscopeMagnification(tube, objective, eyepiece);
  const base = {
    objectiveMagnification: mo, eyepieceMagnification: me, totalMagnification: total,
    specimenDistanceMm: calculateSpecimenDistance(tube, objective) * 1000,
    resolutionNanometers: null as number | null, usefulLimit: null as number | null,
    predictionActual: total,
  };

  if (round.kind === "resolve") {
    const na = v.na as number;
    const d = calculateResolutionLimit(GREEN_LIGHT_METERS, na);
    const limit = calculateUsefulMagnificationLimit(na);
    const needed = EYE_DETAIL_METERS / DETAIL_METERS;
    const resolved = d <= DETAIL_METERS;
    const visible = total >= needed;
    const empty = total <= limit;
    const success = resolved && visible && empty;
    return {
      ...base, resolutionNanometers: d * 1e9, usefulLimit: limit, success, accuracyFraction: success ? 1 : 0,
      feedback: success ? `NA ${na.toFixed(2)} resolves ${(d * 1e9).toFixed(0)} nm, and ${total.toFixed(0)}× magnification lifts the detail to ${(DETAIL_METERS * total * 1000).toFixed(2)} mm without exceeding the useful limit of ${limit.toFixed(0)}×.`
        : !resolved ? `With NA ${na.toFixed(2)} the smallest resolvable separation is ${(d * 1e9).toFixed(0)} nm, which is coarser than 500 nm: the two features blur into one. More magnification cannot fix that; raise the numerical aperture.`
        : !visible ? `The detail is resolved, but ${total.toFixed(0)}× makes it only ${(DETAIL_METERS * total * 1000).toFixed(2)} mm in the image, too small to see. You need at least ${needed.toFixed(0)}×.`
        : `${total.toFixed(0)}× is beyond the useful limit of ${limit.toFixed(0)}× for NA ${na.toFixed(2)}: this is empty magnification, a larger blur with no new detail.`,
    };
  }

  const target = round.kind === "magnify" ? 400 : 600;
  const tolerance = round.kind === "magnify" ? 0.05 : 0.03;
  const error = Math.abs(total - target) / target;
  const tubeOk = round.kind !== "fit" || tube <= STAND_LIMIT_METERS + 1e-9;
  const success = error <= tolerance && tubeOk;
  return {
    ...base, success, accuracyFraction: success ? 1 - error / tolerance : 0,
    feedback: success ? `Objective ${mo.toFixed(1)}× times eyepiece ${me.toFixed(1)}× gives ${total.toFixed(0)}×, within ${(tolerance * 100).toFixed(0)} % of the ${target}× needed.`
      : error > tolerance ? `${mo.toFixed(1)}× × ${me.toFixed(1)}× = ${total.toFixed(0)}×, not the ${target}× required. ${total > target ? "Lengthen the focal length of a lens or shorten the tube." : "Shorten a focal length or lengthen the tube."}`
      : `The magnification is right, but a ${(tube * 1000).toFixed(0)} mm tube is longer than the 200 mm the stand allows. Use a shorter focal length objective with a shorter tube.`,
  };
}

export const microscopeBuilder = defineNumericGame<MicroscopeRound, MicroscopeOutcome>({
  meta: MICROSCOPE_META,
  rounds: MICROSCOPE_ROUNDS,
  prediction: (): PredictionSpec => ({ label: "Your prediction of the total magnification", unit: "×", placeholder: "e.g. 400", step: 1 }),
  evaluate: (round, values) => runMicroscope(round, values),
});
