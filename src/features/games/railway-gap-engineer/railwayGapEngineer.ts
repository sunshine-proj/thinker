import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateBimetalDeflection, calculateExpansionGap, calculateLinearExpansion, findExpansionMaterial } from "../../../physics/thermodynamics";

export type GapKind = "rail" | "bridge" | "bimetal";
export interface GapRound extends NumericRound { readonly kind: GapKind }
export interface GapOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const STEEL = findExpansionMaterial("steel");
export const CONCRETE = findExpansionMaterial("concrete");
export const BRASS = findExpansionMaterial("brass");
export const INVAR = findExpansionMaterial("invar");
export const RAIL = { length: 25, laying: 10, hottest: 40, toleranceMm: 0.5 } as const;
export const BRIDGE = { length: 120, coldest: -25, hottest: 45, toleranceMm: 3 } as const;
export const STRIP = { thickness: 1e-3, temperatureRise: 20, targetMm: 2, toleranceMm: 0.1 } as const;

export function bimetalTipMm(lengthMm: number): number {
  return calculateBimetalDeflection(lengthMm / 1000, STRIP.thickness, BRASS.alpha - INVAR.alpha, STRIP.temperatureRise) * 1000;
}

export const GAP_META: RoundGameMeta = {
  id: "railway-gap-engineer",
  title: "Railway Gap Engineer",
  eyebrow: "THERMODYNAMICS · THERMAL EXPANSION",
  modelTag: "LINEAR EXPANSION",
  introduction: "Steel and concrete grow on hot days and shrink on cold ones. Leave the right gap between rails so they never buckle, size the expansion joint of a long bridge, and design a bimetallic thermostat strip that bends just enough to switch a heater.",
  instructions: "Predict, then set the gap, the joint or the strip length. A solid's length changes in proportion to its length, its material's expansion coefficient and the temperature change.",
  formula: "ΔL = α L ΔT  ·  tip ≈ 3 Δα ΔT ℓ² / (4 h)",
  formulaCaption: "α is the coefficient of linear expansion (steel and concrete 12 × 10⁻⁶ /K, brass 19 × 10⁻⁶ /K, invar 1.2 × 10⁻⁶ /K), L the length, ΔT the temperature change, ℓ the strip length and h its total thickness.",
  explanation: "Heating makes the atoms in a solid vibrate more strongly, so on average they sit a little farther apart, and the whole object grows by the same fraction everywhere. The change is tiny per kelvin (12 millionths for steel) but adds up over long lengths and big temperature swings: a 120 m bridge grows about 10 cm between winter and summer. Without gaps, the rails or the deck would push against each other with enormous force and buckle. A bimetallic strip bonds two metals that expand differently; one side grows more than the other, so the strip curls. Thermostats, kettles and old car indicators use that bend to open or close a contact.",
  assumptions: "Constant expansion coefficients over the temperature range, free expansion with no restraint, uniform temperature through each part, and a bimetal strip of two equal-thickness layers with similar stiffness (Timoshenko's formula). Real rails are often continuously welded and held in tension instead of using gaps.",
  learningObjectives: ["Calculate the change in length from α, L and ΔT.", "Size expansion gaps for a temperature range.", "Explain how a bimetallic strip bends."],
  objective: { title: "Engineer for every season", description: "Solve each expansion problem.", unit: "designs" },
  controlsHeading: "Your design",
  submitLabel: "Test the summer heat",
  solvedLabel: "No buckling!",
  nextLabel: "Next design",
};

export const GAP_ROUNDS: readonly GapRound[] = Object.freeze([
  {
    id: "rail-gap", title: "The rail gap", difficulty: "Beginner", kind: "rail",
    situation: `${RAIL.length} m steel rails are laid at ${RAIL.laying} °C. Leave the gap between them so that it just closes on the hottest day, at ${RAIL.hottest} °C (± ${RAIL.toleranceMm} mm).`,
    controls: [fixed("length", "Rail length", "m", RAIL.length), slider("gapMm", "Gap at laying", "mm", 0, 30, 0.1, 5)],
    hint: "ΔL = α L ΔT with α = 12 × 10⁻⁶ /K and ΔT = 30 K.",
  },
  {
    id: "bridge-joint", title: "The bridge joint", difficulty: "Intermediate", kind: "bridge",
    situation: `A ${BRIDGE.length} m concrete bridge deck sees temperatures from ${BRIDGE.coldest} °C to ${BRIDGE.hottest} °C. How much movement must its expansion joint allow between the coldest and the hottest day? (± ${BRIDGE.toleranceMm} mm)`,
    controls: [fixed("length", "Deck length", "m", BRIDGE.length), slider("travelMm", "Joint movement", "mm", 0, 250, 0.5, 50)],
    hint: "The whole range counts: ΔT = 45 − (−25) = 70 K.",
  },
  {
    id: "thermostat-strip", title: "The thermostat strip", difficulty: "Advanced", kind: "bimetal",
    situation: `A thermostat uses a brass–invar strip ${STRIP.thickness * 1000} mm thick, clamped at one end. Its tip must move ${STRIP.targetMm} mm when it warms by ${STRIP.temperatureRise} K. How long must the strip be? (tip movement ± ${STRIP.toleranceMm} mm)`,
    controls: [fixed("thickness", "Total thickness", "mm", STRIP.thickness * 1000), slider("lengthMm", "Strip length", "mm", 10, 150, 0.5, 40)],
    hint: "Curvature 3 Δα ΔT / (2h); tip deflection ≈ curvature × ℓ² / 2.",
  },
]);

export function runGap(round: GapRound, v: NumericControl): GapOutcome {
  if (round.kind === "rail") {
    const gap = v.gapMm as number;
    const growth = calculateExpansionGap(RAIL.length, STEEL.alpha, RAIL.laying, RAIL.hottest) * 1000;
    const error = Math.abs(gap - growth);
    const success = error <= RAIL.toleranceMm;
    return {
      headline: gap - growth, unit: "mm", success, accuracyFraction: success ? 1 - error / RAIL.toleranceMm : 0, predictionActual: growth,
      feedback: success
        ? `Each rail grows ${growth.toFixed(1)} mm by ${RAIL.hottest} °C, so a ${gap.toFixed(1)} mm gap just closes. On a −20 °C night it opens to ${(gap + RAIL.length * STEEL.alpha * 30 * 1000).toFixed(1)} mm.`
        : gap < growth ? `The rails grow ${growth.toFixed(1)} mm: a ${gap.toFixed(1)} mm gap closes early and the track buckles.` : `A ${gap.toFixed(1)} mm gap is wider than needed (${growth.toFixed(1)} mm): the wheels bang over it.`,
    };
  }
  if (round.kind === "bridge") {
    const travel = v.travelMm as number;
    const truth = calculateLinearExpansion(BRIDGE.length, CONCRETE.alpha, BRIDGE.hottest - BRIDGE.coldest) * 1000;
    const error = Math.abs(travel - truth);
    const success = error <= BRIDGE.toleranceMm;
    return {
      headline: truth, unit: "mm", success, accuracyFraction: success ? 1 - error / BRIDGE.toleranceMm : 0, predictionActual: truth,
      feedback: success
        ? `The deck's length changes by ${truth.toFixed(1)} mm over the ${BRIDGE.hottest - BRIDGE.coldest} K range: your joint allows ${travel.toFixed(1)} mm.`
        : `${travel.toFixed(1)} mm is ${travel > truth ? "more" : "less"} than the ${truth.toFixed(1)} mm the deck moves.`,
    };
  }
  const length = v.lengthMm as number;
  const tip = bimetalTipMm(length);
  const truth = Math.sqrt((STRIP.targetMm / bimetalTipMm(1)));
  const error = Math.abs(tip - STRIP.targetMm);
  const success = error <= STRIP.toleranceMm;
  return {
    headline: tip, unit: "mm", success, accuracyFraction: success ? 1 - error / STRIP.toleranceMm : 0, predictionActual: truth,
    feedback: success
      ? `A ${length.toFixed(1)} mm strip bends ${tip.toFixed(2)} mm at its tip for a ${STRIP.temperatureRise} K rise: brass grows ${((BRASS.alpha / INVAR.alpha)).toFixed(0)} times more than invar.`
      : `A ${length.toFixed(1)} mm strip bends ${tip.toFixed(2)} mm, ${tip > STRIP.targetMm ? "too much: shorten it" : "too little: lengthen it"}. The bend grows as the length squared.`,
  };
}

export const railwayGapEngineer = defineNumericGame<GapRound, GapOutcome>({
  meta: GAP_META,
  rounds: GAP_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "bimetal" ? { label: "Your prediction of the strip length", unit: "mm", placeholder: "e.g. 50", step: 0.5 }
    : { label: "Your prediction of the expansion", unit: "mm", placeholder: "e.g. 10", step: 0.1 },
  evaluate: (round, values) => runGap(round, values),
});
