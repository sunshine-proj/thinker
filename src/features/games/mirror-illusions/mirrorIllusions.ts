import { defineNumericGame, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateMirrorFocalLength, calculateMirrorImage, calculatePlaneMirrorCoverage } from "../../../physics/optics";

export type MirrorKind = "plane" | "concave" | "convex";

export interface MirrorRound extends NumericRound { readonly kind: MirrorKind }

export interface MirrorOutcome extends AttemptOutcome {
  readonly focalLengthMeters: number | null;
  readonly imageDistanceMeters: number | null;
  readonly magnification: number | null;
  readonly mirrorBottom: number | null;
  readonly mirrorTop: number | null;
}

export const EYE_HEIGHT = 1.7;
export const BODY_HEIGHT = 1.8;
const EPS = 1e-9;

export const MIRROR_META: RoundGameMeta = {
  id: "mirror-illusions",
  title: "Mirror Illusions",
  eyebrow: "OPTICS & LIGHT · MIRRORS",
  modelTag: "PLANE & SPHERICAL MIRRORS",
  introduction: "Choose and place mirrors to create useful illusions: a full-length view in the smallest mirror, a magnified shaving mirror, and a car mirror that shows a wide road.",
  instructions: "Predict the result, set the mirror, then test it. Rays reflect with the angle of incidence equal to the angle of reflection; curved mirrors follow the mirror equation.",
  formula: "dᵢ = dₒ (plane)  ·  1/f = 1/dₒ + 1/dᵢ  ·  f = R/2  ·  m = −dᵢ/dₒ",
  formulaCaption: "dₒ is the object distance and dᵢ the image distance (negative means a virtual image behind the mirror). f is positive for a concave mirror and negative for a convex one; m is the magnification.",
  explanation: "A plane mirror forms a virtual image as far behind the glass as the object is in front, so the light from your feet reaches your eyes by reflecting at a point halfway down: a mirror only half your height is enough to see all of you, if it is hung at the right level. A concave mirror brings light together; with the object inside the focal length it makes an upright, magnified virtual image, which is how a shaving mirror works. A convex mirror spreads light out and always makes an upright, reduced virtual image, trading size for a wide field of view, which is why it is used as a car side mirror.",
  assumptions: "Mirrors are perfectly reflecting, and spherical mirrors are used with small apertures near the axis, so there is no spherical aberration. The person's eyes are 1.70 m above the floor and their height is 1.80 m.",
  learningObjectives: ["Use the law of reflection to find the minimum plane mirror for a full-length view.", "Apply the mirror equation and magnification to concave mirrors.", "Explain why convex mirrors give a wide field of view with a smaller image."],
  objective: { title: "Create every illusion", description: "Meet each mirror goal.", unit: "mirrors" },
  controlsHeading: "Set up the mirror",
  submitLabel: "Look in the mirror",
  solvedLabel: "Illusion complete!",
  nextLabel: "Next mirror",
};

export const MIRROR_ROUNDS: readonly MirrorRound[] = Object.freeze([
  {
    id: "full-length", title: "Full-length view", difficulty: "Beginner", kind: "plane",
    situation: "A person 1.80 m tall, with eyes at 1.70 m, wants to see their whole body in a wall mirror. Choose the height of the mirror and where its lower edge hangs. Smaller is cheaper, so use the least mirror that works.",
    controls: [slider("bottom", "Height of the mirror's lower edge", "m", 0, 1.5, 0.01, 0.5), slider("height", "Mirror height", "m", 0.3, 2, 0.01, 1)],
    hint: "Light from the feet reflects halfway between the feet and the eyes; light from the top of the head reflects halfway between the eyes and the top. The mirror must cover both points.",
  },
  {
    id: "shaving-mirror", title: "The shaving mirror", difficulty: "Intermediate", kind: "concave",
    situation: "Design a concave shaving mirror that shows an upright image of a face magnified 2× (± 0.1). Choose the mirror's radius of curvature and how far the face is from it.",
    controls: [slider("radius", "Radius of curvature", "m", 0.2, 2, 0.01, 0.8), slider("distance", "Face distance", "m", 0.05, 0.6, 0.01, 0.3)],
    hint: "For a virtual image m = f/(f − dₒ). For m = 2, dₒ = f/2. Remember f = R/2.",
  },
  {
    id: "car-mirror", title: "The car mirror", difficulty: "Advanced", kind: "convex",
    situation: "A convex car mirror should show a following car as an image one-tenth of its size (0.09 to 0.11) while the image appears no more than 1.0 m behind the glass. Choose the radius of curvature and the distance of the car.",
    controls: [slider("radius", "Radius of curvature", "m", 0.5, 6, 0.05, 2), slider("distance", "Car distance", "m", 2, 30, 0.5, 10)],
    hint: "For a convex mirror m = |f|/(|f| + dₒ) and the image is at |dᵢ| = m dₒ behind it. Then R = 2|f|.",
  },
]);

export function runMirror(round: MirrorRound, v: NumericControl): MirrorOutcome {
  const empty = { focalLengthMeters: null, imageDistanceMeters: null, magnification: null, mirrorBottom: null, mirrorTop: null };
  if (round.kind === "plane") {
    const need = calculatePlaneMirrorCoverage(EYE_HEIGHT, BODY_HEIGHT);
    const bottom = v.bottom as number;
    const top = bottom + (v.height as number);
    const feetOk = bottom <= need.lowest + EPS;
    const headOk = top >= need.highest - EPS;
    const success = feetOk && headOk;
    const minimum = need.highest - need.lowest;
    const problems: string[] = [];
    if (!feetOk) problems.push(`The lower edge at ${bottom.toFixed(2)} m is too high: you cannot see your feet (the mirror must reach down to ${need.lowest.toFixed(2)} m).`);
    if (!headOk) problems.push(`The upper edge at ${top.toFixed(2)} m is too low: you cannot see the top of your head (it must reach ${need.highest.toFixed(2)} m).`);
    return {
      ...empty, success, mirrorBottom: bottom, mirrorTop: top,
      accuracyFraction: success ? Math.max(0, 1 - ((v.height as number) - minimum) / minimum) : 0, predictionActual: minimum,
      feedback: success ? `You see yourself head to toe in a ${(v.height as number).toFixed(2)} m mirror; the least possible is ${minimum.toFixed(2)} m, half your height.` : problems.join(" "),
    };
  }

  const convex = round.kind === "convex";
  const f = calculateMirrorFocalLength(v.radius as number, convex);
  const image = calculateMirrorImage(f, v.distance as number);
  const common = { ...empty, focalLengthMeters: f, imageDistanceMeters: image.imageDistance, magnification: image.magnification };
  if (image.imageDistance === null || image.magnification === null) {
    return { ...common, success: false, accuracyFraction: 0, predictionActual: null, feedback: "The object is at the focal point, so the reflected rays are parallel and no image forms." };
  }
  const m = image.magnification;
  const di = image.imageDistance;
  if (!convex) {
    const virtual = di < 0;
    const error = Math.abs(m - 2);
    const success = virtual && error <= 0.1;
    return {
      ...common, success, accuracyFraction: success ? 1 - error / 0.1 : 0, predictionActual: Math.abs(di),
      feedback: success ? `An upright virtual image ${Math.abs(di).toFixed(2)} m behind the mirror, magnified ${m.toFixed(2)}×.` : !virtual ? `The face is beyond the focal length (f = ${f.toFixed(2)} m), so the image is real, inverted and ${Math.abs(m).toFixed(2)}× in size. Move closer than f.` : `The image is upright but magnified ${m.toFixed(2)}×, not 2×.`,
    };
  }
  const error = Math.abs(m - 0.1);
  const success = error <= 0.01 && Math.abs(di) <= 1.0;
  return {
    ...common, success, accuracyFraction: success ? 1 - error / 0.01 : 0, predictionActual: m,
    feedback: success ? `The image is ${m.toFixed(3)}× the size and appears ${Math.abs(di).toFixed(2)} m behind the glass.` : error > 0.01 ? `The image is ${m.toFixed(3)}× the size, not 0.10×.` : `The image appears ${Math.abs(di).toFixed(2)} m behind the glass, more than the 1.0 m allowed.`,
  };
}

export const mirrorIllusions = defineNumericGame<MirrorRound, MirrorOutcome>({
  meta: MIRROR_META,
  rounds: MIRROR_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "plane" ? { label: "Your prediction of the smallest mirror height", unit: "m", placeholder: "e.g. 0.9", step: 0.01 }
    : round.kind === "concave" ? { label: "Your prediction of the image distance behind the mirror", unit: "m", placeholder: "e.g. 0.3", step: 0.01 }
    : { label: "Your prediction of the magnification", unit: "×", placeholder: "e.g. 0.1", step: 0.001 },
  evaluate: (round, values) => runMirror(round, values),
});
