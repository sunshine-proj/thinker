import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateDefocus, calculateFarPoint, calculateNearPoint, type Eye } from "../../../physics/optics";

export interface VisionRound extends NumericRound {
  readonly eye: Eye;
  readonly farDistanceMeters: number;
  readonly nearDistanceMeters: number;
  readonly predictionKind: "farPoint" | "nearPoint";
}

export interface VisionOutcome extends AttemptOutcome {
  readonly farDefocus: number;
  readonly nearDefocus: number;
  readonly uncorrectedFarPoint: number;
  readonly uncorrectedNearPoint: number;
}

export const BLUR_TOLERANCE = 0.25;

export const VISION_META: RoundGameMeta = {
  id: "vision-simulator",
  title: "Vision Simulator",
  eyebrow: "OPTICS & LIGHT · THE EYE",
  modelTag: "THIN-LENS EYE · DIOPTERS",
  introduction: "Meet three eyes that cannot focus properly: a short-sighted eye, a long-sighted one, and an ageing eye that needs reading glasses. Prescribe the corrective lenses that give each person clear vision.",
  instructions: "Predict where each eye can focus, then choose the lens power in diopters (negative lenses diverge, positive lenses converge). The bands show the range of distances that are sharp. Both test distances must be within 0.25 D of sharp.",
  formula: "P = 1/f  ·  far point = 1/E  ·  near point = 1/(E + A)",
  formulaCaption: "Powers are in diopters (1/m). E is the eye's refractive error (positive = short-sighted), A its accommodation range. An object at distance d has vergence 1/d; the eye is sharp when that vergence lies inside its range once the lens power is added.",
  explanation: "The eye focuses by changing the power of its lens. A short-sighted (myopic) eye is too powerful when relaxed, so distant objects focus in front of the retina; a diverging (negative) lens cancels the excess. A long-sighted (hyperopic) eye is too weak, so close objects focus behind the retina; a converging (positive) lens adds the missing power. With age the lens loses its ability to accommodate (presbyopia), so a person may need one power for distance and an extra reading power for close work, as in a bifocal. In diopters the powers simply add, which makes prescriptions easy to reason about.",
  assumptions: "A thin-lens eye with the corrective lens placed right at the eye, no astigmatism, and a blur tolerance of 0.25 D to stand for the eye's depth of field.",
  learningObjectives: ["Relate power in diopters to focal length: P = 1/f.", "Find far and near points and the correction for short and long sight.", "Understand accommodation and why reading glasses are needed with age."],
  objective: { title: "Correct every eye", description: "Give each person clear vision.", unit: "patients" },
  controlsHeading: "Prescribe the lenses",
  submitLabel: "Test the prescription",
  solvedLabel: "Clear vision!",
  nextLabel: "Next patient",
};

const power = (key: string, label: string, initial: number) => slider(key, label, "D", -6, 6, 0.25, initial);

export const VISION_ROUNDS: readonly VisionRound[] = Object.freeze([
  {
    id: "short-sighted", title: "The short-sighted student", difficulty: "Beginner", predictionKind: "farPoint",
    eye: { refractiveErrorDiopters: 2, accommodationDiopters: 4 }, farDistanceMeters: 6, nearDistanceMeters: 0.4,
    situation: "A student cannot see clearly beyond 0.5 m (a 2 D error) and can accommodate by 4 D. Choose a lens so they can see both the board at 6 m and a book at 0.4 m clearly.",
    controls: [power("distance", "Lens power", 0), fixed("add", "Reading addition", "D", 0)],
    hint: "To bring the far point to infinity use P = −1/(far point) = −2 D. A slightly weaker lens still works, because the eye can accommodate and the board is not at infinity.",
  },
  {
    id: "long-sighted", title: "The long-sighted reader", difficulty: "Intermediate", predictionKind: "nearPoint",
    eye: { refractiveErrorDiopters: -2.5, accommodationDiopters: 3 }, farDistanceMeters: 1, nearDistanceMeters: 0.3,
    situation: "This reader's eye is too weak (−2.5 D) and can accommodate by 3 D. Choose reading glasses so that both a screen at 1 m and a page at 0.3 m are clear.",
    controls: [power("distance", "Lens power", 0), fixed("add", "Reading addition", "D", 0)],
    hint: "Without glasses the eye's clear range is only 0.5 D above infinity-focus. The 0.3 m page needs 3.33 D, so add enough positive power, but not so much that the screen at 1 m blurs.",
  },
  {
    id: "bifocal", title: "The bifocal wearer", difficulty: "Advanced", predictionKind: "farPoint",
    eye: { refractiveErrorDiopters: 1.5, accommodationDiopters: 1 }, farDistanceMeters: 6, nearDistanceMeters: 0.4,
    situation: "An older person is short-sighted (1.5 D) and has almost lost accommodation (1 D). One lens cannot serve both distances. Choose the distance lens power and a reading addition so that 6 m and 0.4 m are both clear.",
    controls: [power("distance", "Lens power (distance)", 0), slider("add", "Reading addition", "D", 0, 4, 0.25, 0)],
    hint: "The distance lens must fix the far view, about −1.5 D. For close work the total power (distance + addition) must bring the 2.5 D vergence of a 0.4 m page into the eye's range.",
  },
]);

export function runVision(round: VisionRound, v: NumericControl): VisionOutcome {
  const lens = v.distance as number;
  const add = v.add as number;
  const farDefocus = calculateDefocus(round.eye, lens, round.farDistanceMeters);
  const nearDefocus = calculateDefocus(round.eye, lens + add, round.nearDistanceMeters);
  const worst = Math.max(farDefocus, nearDefocus);
  const success = worst <= BLUR_TOLERANCE;
  const far = calculateFarPoint(round.eye);
  const near = calculateNearPoint(round.eye);
  const problems: string[] = [];
  if (farDefocus > BLUR_TOLERANCE) problems.push(`The ${round.farDistanceMeters} m object is blurred by ${farDefocus.toFixed(2)} D.`);
  if (nearDefocus > BLUR_TOLERANCE) problems.push(`The ${round.nearDistanceMeters} m object is blurred by ${nearDefocus.toFixed(2)} D.`);
  return {
    success, farDefocus, nearDefocus, uncorrectedFarPoint: far, uncorrectedNearPoint: near,
    accuracyFraction: success ? 1 - worst / BLUR_TOLERANCE : 0,
    predictionActual: round.predictionKind === "farPoint" ? (Number.isFinite(far) ? far : null) : (Number.isFinite(near) ? near : null),
    feedback: success ? `Both distances are sharp (blur ${farDefocus.toFixed(2)} D and ${nearDefocus.toFixed(2)} D).` : problems.join(" "),
  };
}

export const visionSimulator = defineNumericGame<VisionRound, VisionOutcome>({
  meta: VISION_META,
  rounds: VISION_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.predictionKind === "farPoint"
      ? { label: "Your prediction of the uncorrected far point", unit: "m", placeholder: "e.g. 0.5", step: 0.01 }
      : { label: "Your prediction of the uncorrected near point", unit: "m", placeholder: "e.g. 2", step: 0.01 },
  evaluate: (round, values) => runVision(round, values),
});
