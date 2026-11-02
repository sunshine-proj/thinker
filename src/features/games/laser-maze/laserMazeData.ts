import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";

export interface MirrorSpec {
  readonly centerXCm: number;
  readonly centerYCm: number;
  readonly lengthCm: number;
}

export interface GlassBlockSpec {
  readonly minXCm: number;
  readonly minYCm: number;
  readonly maxXCm: number;
  readonly maxYCm: number;
  readonly refractiveIndex: number;
}

export interface LaserRound extends RoundBase {
  readonly laser: { readonly xCm: number; readonly yCm: number; readonly angleDegrees: number };
  /** Every mirror's angle is set by the learner. */
  readonly mirrors: readonly MirrorSpec[];
  readonly blocks: readonly GlassBlockSpec[];
  readonly target: { readonly xCm: number; readonly yCm: number; readonly radiusCm: number };
  /** The angle the learner is asked to predict, read from the n-th matching event. */
  readonly predictionEvent: {
    readonly kind: "reflection" | "refraction";
    readonly occurrence: number;
    readonly quantity: "incidence" | "refraction";
    readonly label: string;
  };
}

export interface LaserControl {
  /** Mirror surface angles in degrees, counter-clockwise from +x, one per mirror. */
  readonly mirrorAnglesDegrees: readonly number[];
}

export const ARENA_CM = 100;
export const MIRROR_ANGLE_RANGE = { minimum: 0, maximum: 180, step: 0.5 } as const;

export const LASER_MAZE_META: RoundGameMeta = {
  id: "laser-maze",
  title: "Laser Maze",
  eyebrow: "OPTICS & LIGHT · PUZZLE",
  modelTag: "RAY OPTICS · REFLECTION & REFRACTION",
  introduction:
    "Steer a laser beam to its target by turning mirrors, and bend it through glass using the laws of reflection and refraction.",
  instructions:
    "Predict an angle, then turn the mirrors. The beam is drawn live; when you think it will strike the target, lock in your setting.",
  formula: "θᵢ = θᵣ  ·  n₁ sin θ₁ = n₂ sin θ₂",
  formulaCaption:
    "Angles are measured from the normal (the line perpendicular to the surface). θᵢ is the angle of incidence, θᵣ of reflection, and n the refractive index (1.00 for air, 1.50 for this glass).",
  explanation:
    "A mirror reflects a ray so that the angle of reflection equals the angle of incidence, both measured from the normal. Turning a mirror by an angle turns the reflected beam by twice that angle, which is why small adjustments move the spot a long way. When light enters glass it slows down and bends toward the normal according to Snell's law, n₁ sin θ₁ = n₂ sin θ₂, and it bends back when it leaves, so a slab shifts the beam sideways without changing its direction.",
  assumptions:
    "The model uses geometric rays: no diffraction, interference or dispersion, and a single refractive index for the glass. Each surface either reflects or refracts the ray and never splits it (partial reflection is ignored), mirrors are perfect and flat, and total internal reflection is applied when it occurs.",
  learningObjectives: [
    "Apply the law of reflection: the angle of incidence equals the angle of reflection.",
    "Use Snell's law to find the bending of light entering and leaving glass.",
    "See that rotating a mirror by θ turns the reflected beam by 2θ.",
  ],
  objective: {
    title: "Light every target",
    description: "Guide the beam into each target disc.",
    unit: "targets",
  },
  controlsHeading: "Aim the beam",
  submitLabel: "Lock in this setting",
  solvedLabel: "Target hit!",
  nextLabel: "Next maze",
};

export const LASER_ROUNDS: readonly LaserRound[] = Object.freeze([
  {
    id: "one-mirror",
    title: "One mirror",
    difficulty: "Beginner",
    situation:
      "The laser fires along the bench at the mirror. Turn the mirror so the reflected beam strikes the target.",
    laser: { xCm: 10, yCm: 20, angleDegrees: 0 },
    mirrors: [{ centerXCm: 60, centerYCm: 20, lengthCm: 30 }],
    blocks: [],
    target: { xCm: 80, yCm: 70, radiusCm: 3 },
    predictionEvent: { kind: "reflection", occurrence: 1, quantity: "incidence", label: "Your prediction of the angle of incidence at the mirror" },
    hint: "The normal bisects the angle between the incoming and outgoing beams. Aim from the mirror to the target and turn the mirror halfway between the two beam directions.",
  },
  {
    id: "two-mirrors",
    title: "Two mirrors",
    difficulty: "Intermediate",
    situation:
      "The beam must zig-zag: first mirror down, second mirror back toward the target. Both mirrors can be turned.",
    laser: { xCm: 10, yCm: 80, angleDegrees: 0 },
    mirrors: [
      { centerXCm: 70, centerYCm: 80, lengthCm: 30 },
      { centerXCm: 70, centerYCm: 20, lengthCm: 30 },
    ],
    blocks: [],
    target: { xCm: 15, yCm: 20, radiusCm: 3 },
    predictionEvent: { kind: "reflection", occurrence: 2, quantity: "incidence", label: "Your prediction of the angle of incidence at the second mirror" },
    hint: "Set the first mirror so the beam heads straight down, then the second so it heads straight back. A mirror at 45° turns a beam by 90°.",
  },
  {
    id: "through-glass",
    title: "Through the glass",
    difficulty: "Advanced",
    situation:
      "The beam crosses a glass block (n = 1.50) before it reaches the mirror. Glass bends the beam and shifts it sideways, so aim with care.",
    laser: { xCm: 10, yCm: 40, angleDegrees: 30 },
    mirrors: [{ centerXCm: 75, centerYCm: 73, lengthCm: 24 }],
    blocks: [{ minXCm: 35, minYCm: 30, maxXCm: 55, maxYCm: 70, refractiveIndex: 1.5 }],
    target: { xCm: 80, yCm: 15, radiusCm: 3 },
    predictionEvent: { kind: "refraction", occurrence: 1, quantity: "refraction", label: "Your prediction of the angle of refraction inside the glass" },
    hint: "Use Snell's law at the first face: sin θ₂ = sin 30° / 1.5. The beam leaves the glass parallel to its original direction, only shifted, so find where it meets the mirror.",
  },
]);
