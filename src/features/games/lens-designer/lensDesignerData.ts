import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";

export type LensGoal =
  | {
      readonly kind: "screen";
      /** Largest acceptable blur circle on the screen, in cm. */
      readonly maximumBlurCm: number;
      /** When set, the image must also be this many times larger than the object. */
      readonly magnification?: { readonly target: number; readonly toleranceFraction: number };
    }
  | {
      readonly kind: "magnifier";
      /** Where the virtual image should appear, as a distance in front of the lens (cm). */
      readonly imageDistanceCm: number;
      readonly magnification: number;
      readonly toleranceFraction: number;
    };

export type PredictionKind = "imageDistance" | "imageHeight" | "magnification";

export interface LensRound extends RoundBase {
  readonly objectHeightCm: number;
  /** Object-to-screen distance for screen rounds; null for the magnifier. */
  readonly screenDistanceCm: number | null;
  readonly apertureCm: number;
  readonly refractiveIndex: number;
  /** Radius of curvature of both faces of the biconvex lens; fixed when `fixed` is set. */
  readonly radius: {
    readonly minimumCm: number;
    readonly maximumCm: number;
    readonly stepCm: number;
    readonly fixed: number | null;
  };
  /** Distance from the object to the lens. */
  readonly position: { readonly minimumCm: number; readonly maximumCm: number; readonly stepCm: number };
  readonly goal: LensGoal;
  readonly predictionKind: PredictionKind;
  /** Horizontal extent of the diagram, in cm from the object. */
  readonly view: { readonly minimumCm: number; readonly maximumCm: number };
}

export interface LensControl {
  readonly radiusCm: number;
  readonly positionCm: number;
}

export const LENS_DESIGNER_META: RoundGameMeta = {
  id: "lens-designer",
  title: "Lens Designer",
  eyebrow: "OPTICS & LIGHT · DESIGN",
  modelTag: "THIN LENS · PARAXIAL RAYS",
  introduction:
    "Design a converging lens and place it on the optical bench to form a sharp image on a screen, or to build a magnifying glass.",
  instructions:
    "Predict what the image will do, then set the lens curvature and its distance from the object. The ray diagram updates live; lock in your design when you think the image is where it should be.",
  formula: "1/f = 1/dₒ + 1/dᵢ  ·  m = −dᵢ/dₒ  ·  1/f = (n − 1)(1/R₁ − 1/R₂)",
  formulaCaption:
    "f is the focal length, dₒ the object distance, dᵢ the image distance (negative for a virtual image), m the magnification (negative = upside down), n the refractive index and R the surface radii.",
  explanation:
    "A converging lens bends light so that rays from one point on the object meet again at one point of the image. The thin-lens equation links where the object is to where the image forms, and the magnification m = −dᵢ/dₒ tells you its size and orientation. A shorter focal length means a more strongly curved lens (the lensmaker's equation). An object inside the focal length gives no real image: the lens makes an upright, enlarged virtual image, which is how a magnifying glass works.",
  assumptions:
    "Thin lenses and rays close to the axis only. There is no spherical or chromatic aberration, one refractive index (n = 1.50, a typical glass), and no diffraction. The sharpness test uses the geometric blur circle on the screen.",
  learningObjectives: [
    "Use the thin-lens equation to locate an image and the magnification equation to size it.",
    "Relate lens curvature and refractive index to focal length with the lensmaker's equation.",
    "Tell real inverted images from virtual upright ones, and see how a magnifying glass works.",
  ],
  objective: {
    title: "Form every image",
    description: "Meet the optical goal for each bench.",
    unit: "images",
  },
  controlsHeading: "Design the lens",
  submitLabel: "Lock in this design",
  solvedLabel: "Image formed!",
  nextLabel: "Next bench",
};

export const LENS_ROUNDS: readonly LensRound[] = Object.freeze([
  {
    id: "sharp-focus",
    title: "Find the focus",
    difficulty: "Beginner",
    situation:
      "A 10 cm focal-length lens is fixed. The screen is 60 cm from the object. Slide the lens along the bench until the image on the screen is sharp.",
    objectHeightCm: 2,
    screenDistanceCm: 60,
    apertureCm: 4,
    refractiveIndex: 1.5,
    radius: { minimumCm: 5, maximumCm: 20, stepCm: 0.5, fixed: 10 },
    position: { minimumCm: 5, maximumCm: 55, stepCm: 0.1 },
    goal: { kind: "screen", maximumBlurCm: 0.1 },
    predictionKind: "imageDistance",
    view: { minimumCm: -5, maximumCm: 65 },
    hint: "Use 1/f = 1/dₒ + 1/dᵢ with the condition dₒ + dᵢ = 60 cm. It has two solutions: one with the lens near the object and one near the screen.",
  },
  {
    id: "enlarged-image",
    title: "Make it three times bigger",
    difficulty: "Intermediate",
    situation:
      "Project a 2 cm object onto a screen 80 cm away as an image three times its size. Choose both the lens curvature and its position.",
    objectHeightCm: 2,
    screenDistanceCm: 80,
    apertureCm: 4,
    refractiveIndex: 1.5,
    radius: { minimumCm: 5, maximumCm: 25, stepCm: 0.5, fixed: null },
    position: { minimumCm: 5, maximumCm: 75, stepCm: 0.1 },
    goal: { kind: "screen", maximumBlurCm: 0.1, magnification: { target: 3, toleranceFraction: 0.1 } },
    predictionKind: "imageHeight",
    view: { minimumCm: -5, maximumCm: 85 },
    hint: "A magnification of 3 means dᵢ = 3 dₒ, and the two distances add to 80 cm. Find dₒ, then f from the thin-lens equation, then the radius (for n = 1.5, f equals R).",
  },
  {
    id: "magnifying-glass",
    title: "A magnifying glass",
    difficulty: "Advanced",
    situation:
      "Build a magnifier: an upright virtual image 25 cm in front of the lens, five times larger than the object. Choose the curvature and how close to hold the object.",
    objectHeightCm: 2,
    screenDistanceCm: null,
    apertureCm: 4,
    refractiveIndex: 1.5,
    radius: { minimumCm: 3, maximumCm: 15, stepCm: 0.05, fixed: null },
    position: { minimumCm: 1, maximumCm: 14, stepCm: 0.05 },
    goal: { kind: "magnifier", imageDistanceCm: 25, magnification: 5, toleranceFraction: 0.08 },
    predictionKind: "magnification",
    view: { minimumCm: -30, maximumCm: 25 },
    hint: "A virtual image has dᵢ = −25 cm. Magnification 5 means dₒ = 25/5 = 5 cm. Then 1/f = 1/dₒ + 1/dᵢ gives the focal length.",
  },
]);
