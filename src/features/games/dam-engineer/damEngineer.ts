import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { CONCRETE_DENSITY, STANDARD_GRAVITY } from "../../../physics/core";
import {
  calculateOverturningMoment,
  calculateOverturningSafetyFactor,
  calculateResistingMoment,
  calculateThicknessForSafetyFactor,
  calculateWaterForce,
  type DamDesign,
} from "../../../physics/fluids";

export type DamKind = "lake" | "flood" | "uplift";

export interface DamRound extends NumericRound { readonly kind: DamKind }

export interface DamOutcome extends AttemptOutcome {
  readonly forceNewtons: number;
  readonly overturningMoment: number;
  readonly resistingMoment: number;
  readonly safetyFactor: number;
  readonly weightNewtons: number;
}

export const SAFETY_MINIMUM = 1.5;
export const SAFETY_MAXIMUM_LAKE = 2;
export const SAFETY_MAXIMUM_OTHER = 1.8;

export const DAM_META: RoundGameMeta = {
  id: "dam-engineer",
  title: "Dam Engineer",
  eyebrow: "FLUID MECHANICS · HYDROSTATIC FORCE",
  modelTag: "GRAVITY DAM",
  introduction: "Design a concrete gravity dam. Water pushes harder the deeper it is, and the push acts low on the wall, trying to tip the dam over. Choose a thickness whose weight resists it with a comfortable safety margin, without wasting concrete.",
  instructions: "Predict, set the thickness, then test the dam. The water's push and its lever arm give an overturning moment about the toe, and the dam's weight gives a resisting moment; their ratio is the safety factor.",
  formula: "F = ½ρgh²  ·  M_o = F·h/3  ·  M_r = ρ_c g b H · b/2  ·  SF = M_r/M_o",
  formulaCaption: "h is the water depth, H the dam height, b its thickness, ρ the density of water and ρ_c of concrete. F is the water force per meter of dam length, acting h/3 above the base. A safety factor of at least 1.5 is required.",
  explanation: "Water pressure increases linearly with depth, so the total push on the dam grows with the square of the depth and acts one third of the way up from the base. Its torque about the downstream toe, which grows as h³, tries to tip the dam. The dam resists with its own weight acting through its center, and a thicker dam is heavier and has a longer lever arm, so its resisting moment grows as b². That is why doubling the water depth demands more than doubling the thickness. Water that seeps under the dam pushes up on it, cutting the effective weight and the safety factor.",
  assumptions: "A rectangular concrete section of density 2400 kg/m³ per meter of length, a rigid foundation, tipping about the toe as the only failure mode (sliding is not checked), water at 1000 kg/m³, and a simple linear uplift model in the last round. Real dams are tapered and anchored.",
  learningObjectives: ["Calculate the water force and its line of action.", "Compare overturning and resisting moments.", "Explain how uplift reduces the stability of a dam."],
  objective: { title: "Build the dam", description: "Make every dam safe.", unit: "dams" },
  controlsHeading: "Design the dam",
  submitLabel: "Fill the reservoir",
  solvedLabel: "Dam holds!",
  nextLabel: "Next dam",
};

export const DAM_ROUNDS: readonly DamRound[] = Object.freeze([
  {
    id: "the-small-lake", title: "The small lake", difficulty: "Beginner", kind: "lake",
    situation: `A 10 m high dam holds a 10 m deep lake. Choose its thickness so that the safety factor against overturning is between ${SAFETY_MINIMUM} and ${SAFETY_MAXIMUM_LAKE}: safe, but not wasteful.`,
    controls: [fixed("waterDepth", "Water depth", "m", 10), fixed("damHeight", "Dam height", "m", 10), slider("thickness", "Dam thickness", "m", 1, 10, 0.05, 3)],
    hint: "SF = (ρ_c g b H · b/2) / (ρ g h³/6) grows as b². Solve for b when SF = 1.5.",
  },
  {
    id: "the-flood", title: "The flood", difficulty: "Intermediate", kind: "flood",
    situation: `A flood raises the lake to 14 m behind a 15 m high dam. Choose a thickness giving a safety factor between ${SAFETY_MINIMUM} and ${SAFETY_MAXIMUM_OTHER}.`,
    controls: [fixed("waterDepth", "Water depth", "m", 14), fixed("damHeight", "Dam height", "m", 15), slider("thickness", "Dam thickness", "m", 2, 12, 0.05, 4)],
    hint: "The overturning moment grows as the cube of the depth, so the thickness must grow much more than the depth does.",
  },
  {
    id: "water-under-the-dam", title: "Water under the dam", difficulty: "Advanced", kind: "uplift",
    situation: `Water seeps beneath an 11 m dam holding back 10 m of water, pushing up with a pressure that falls from ρgh at the heel to zero at the toe. Choose a thickness giving a safety factor between ${SAFETY_MINIMUM} and ${SAFETY_MAXIMUM_OTHER} including the uplift.`,
    controls: [fixed("waterDepth", "Water depth", "m", 10), fixed("damHeight", "Dam height", "m", 11), slider("thickness", "Dam thickness", "m", 2, 12, 0.05, 4)],
    hint: "Uplift U = ½ρgh·b acts 2b/3 from the toe and reduces the resisting moment. Both moments still scale as b², so SF ∝ b².",
  },
]);

function design(round: DamRound, v: NumericControl): DamDesign {
  return { waterDepth: v.waterDepth as number, damHeight: v.damHeight as number, thickness: v.thickness as number, uplift: round.kind === "uplift" };
}

export function runDam(round: DamRound, v: NumericControl): DamOutcome {
  const d = design(round, v);
  const resisting = calculateResistingMoment(d);
  const overturning = calculateOverturningMoment(d.waterDepth);
  const sf = calculateOverturningSafetyFactor(d);
  const maximum = round.kind === "lake" ? SAFETY_MAXIMUM_LAKE : SAFETY_MAXIMUM_OTHER;
  const success = sf >= SAFETY_MINIMUM && sf <= maximum;
  const mid = (SAFETY_MINIMUM + maximum) / 2;
  const half = (maximum - SAFETY_MINIMUM) / 2;
  return {
    forceNewtons: calculateWaterForce(d.waterDepth), overturningMoment: overturning, resistingMoment: resisting, safetyFactor: sf,
    weightNewtons: CONCRETE_DENSITY * STANDARD_GRAVITY * d.thickness * d.damHeight, success,
    accuracyFraction: success ? 1 - Math.abs(sf - mid) / half : 0,
    predictionActual: calculateThicknessForSafetyFactor({ waterDepth: d.waterDepth, damHeight: d.damHeight, uplift: d.uplift }, SAFETY_MINIMUM),
    feedback: success ? `The water pushes with ${(calculateWaterForce(d.waterDepth) / 1000).toFixed(0)} kN per meter, giving an overturning moment of ${(overturning / 1000).toFixed(0)} kN·m; the dam resists ${(resisting / 1000).toFixed(0)} kN·m. Safety factor ${sf.toFixed(2)}.`
      : sf < SAFETY_MINIMUM ? `Safety factor ${sf.toFixed(2)} is below ${SAFETY_MINIMUM}: the dam could tip over. Make it thicker.`
      : `Safety factor ${sf.toFixed(2)} is safe but wasteful (above ${maximum}). Use less concrete.`,
  };
}

export const damEngineer = defineNumericGame<DamRound, DamOutcome>({
  meta: DAM_META,
  rounds: DAM_ROUNDS,
  prediction: (): PredictionSpec => ({ label: "Your prediction of the thickness for a safety factor of 1.5", unit: "m", placeholder: "e.g. 4.5", step: 0.01 }),
  evaluate: (round, values) => runDam(round, values),
});
