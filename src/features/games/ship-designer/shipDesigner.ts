import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { FRESH_WATER_DENSITY, SEAWATER_DENSITY } from "../../../physics/core";
import { calculateDraft, calculateMetacentricHeight } from "../../../physics/fluids";

export type ShipKind = "river" | "sea" | "stability";

export interface ShipRound extends NumericRound { readonly kind: ShipKind }

export interface ShipOutcome extends AttemptOutcome {
  readonly draftMeters: number;
  readonly freeboardMeters: number;
  readonly metacentricHeight: number | null;
  readonly massTonnes: number;
}

export const LENGTH = 20;
export const BEAM = 6;
export const HULL_DEPTH = 4;
export const HULL_MASS_T = 100;
export const RIVER_DRAFT = 2;
export const RIVER_TOLERANCE = 0.05;
export const SEA_DRAFT_LIMIT = 3;
export const SEA_DRAFT_LOW = 2.9;
export const STABILITY_MASS_T = 120;
export const STABILITY_KG = 1.5;
export const GM_LOW = 0.8;
export const GM_HIGH = 1.5;

export const SHIP_META: RoundGameMeta = {
  id: "ship-designer",
  title: "Ship Designer",
  eyebrow: "FLUID MECHANICS · BUOYANCY",
  modelTag: "FLOATING BOX HULL",
  introduction: "Design a cargo barge that floats safely. Load it to the right depth in river water, fill it to the limit in the sea, and choose a hull width that keeps it upright.",
  instructions: "Predict, then load and test. A ship floats when the weight of water it pushes aside equals its own weight, and it stays upright only if its metacentric height is positive.",
  formula: "d = m/(ρ l w)  ·  GM = d/2 + w²/(12d) − KG",
  formulaCaption: "d is the draft (depth below the waterline), m the total mass, ρ the water density, l the length and w the beam. GM is the metacentric height and KG the height of the center of gravity above the keel. A ship is stable if GM > 0.",
  explanation: "Archimedes' principle says the upward buoyant force equals the weight of the displaced fluid, so a barge sinks until the water it displaces weighs as much as the barge and its cargo: the draft is m/(ρlw). Fresh water is less dense than seawater, so the same load sinks deeper in a river. Staying upright is another matter. When the barge tilts, the shape of the underwater part shifts the center of buoyancy sideways; the effect, summed up by the metacentric height GM = KB + BM − KG, creates a restoring torque only if the metacenter lies above the center of gravity. A wider hull has a larger BM and is more stable, but too much GM makes the ship roll quickly and uncomfortably.",
  assumptions: "A rectangular box hull in calm water, small angles of heel, a uniform water density (fresh 1000, sea 1025 kg/m³), and the center of gravity at a fixed height. Real hulls have curved shapes, trim and waves.",
  learningObjectives: ["Use Archimedes' principle to find the draft of a loaded hull.", "Compare floating in fresh and salt water.", "Judge stability with the metacentric height."],
  objective: { title: "Launch the barge", description: "Meet each design requirement.", unit: "designs" },
  controlsHeading: "Design the barge",
  submitLabel: "Launch",
  solvedLabel: "Barge afloat!",
  nextLabel: "Next design",
};

export const SHIP_ROUNDS: readonly ShipRound[] = Object.freeze([
  {
    id: "load-on-the-river", title: "Load on the river", difficulty: "Beginner", kind: "river",
    situation: `A 20 m × 6 m barge with an empty mass of ${HULL_MASS_T} t floats in a river (fresh water, ${FRESH_WATER_DENSITY} kg/m³). Load cargo so that the draft is ${RIVER_DRAFT.toFixed(1)} m (± ${RIVER_TOLERANCE} m).`,
    controls: [fixed("density", "Water density", "kg/m³", FRESH_WATER_DENSITY), slider("cargo", "Cargo", "t", 0, 300, 1, 100)],
    hint: "Displaced water must weigh as much as the barge: ρ l w d = hull + cargo.",
  },
  {
    id: "load-to-the-line", title: "Load to the line", difficulty: "Intermediate", kind: "sea",
    situation: `In the sea (${SEAWATER_DENSITY} kg/m³) the same barge may be loaded until the draft reaches ${SEA_DRAFT_LIMIT.toFixed(1)} m without going beyond. Load as much cargo as possible with the draft between ${SEA_DRAFT_LOW} and ${SEA_DRAFT_LIMIT} m.`,
    controls: [fixed("density", "Water density", "kg/m³", SEAWATER_DENSITY), slider("cargo", "Cargo", "t", 0, 400, 1, 150)],
    hint: `The maximum total mass is ρ l w d = 1025 × 20 × 6 × 3 = 369 t; subtract the hull.`,
  },
  {
    id: "stay-upright", title: "Stay upright", difficulty: "Advanced", kind: "stability",
    situation: `A loaded barge of ${STABILITY_MASS_T} t, 20 m long, has its center of gravity ${STABILITY_KG} m above the keel and floats in the sea. Choose its beam so the metacentric height is between ${GM_LOW} and ${GM_HIGH} m: stable, but not so stiff that it rolls violently.`,
    controls: [fixed("density", "Water density", "kg/m³", SEAWATER_DENSITY), slider("beam", "Beam", "m", 3, 10, 0.05, 4)],
    hint: "Draft d = m/(ρ l w), then GM = d/2 + w²/(12 d) − 1.5. Try a few beams.",
  },
]);

export function runShip(round: ShipRound, v: NumericControl): ShipOutcome {
  const density = v.density as number;
  if (round.kind === "stability") {
    const beam = v.beam as number;
    const draft = calculateDraft(STABILITY_MASS_T * 1000, LENGTH, beam, density);
    const gm = calculateMetacentricHeight(draft, beam, STABILITY_KG);
    const success = gm >= GM_LOW && gm <= GM_HIGH;
    return {
      draftMeters: draft, freeboardMeters: HULL_DEPTH - draft, metacentricHeight: gm, massTonnes: STABILITY_MASS_T, success,
      accuracyFraction: success ? 1 - Math.abs(gm - (GM_LOW + GM_HIGH) / 2) / ((GM_HIGH - GM_LOW) / 2) : 0, predictionActual: gm,
      feedback: success ? `Beam ${beam.toFixed(2)} m gives a draft of ${draft.toFixed(2)} m and GM = ${gm.toFixed(2)} m: stable with a comfortable roll.`
        : gm <= 0 ? `GM = ${gm.toFixed(2)} m is not positive: the barge capsizes at the slightest heel. Widen the hull.`
        : gm < GM_LOW ? `GM = ${gm.toFixed(2)} m is stable but marginal (needs at least ${GM_LOW} m). Widen the hull a little.`
        : `GM = ${gm.toFixed(2)} m is too stiff: it will snap back and roll fast. Narrow the hull.`,
    };
  }
  const cargo = v.cargo as number;
  const mass = HULL_MASS_T + cargo;
  const draft = calculateDraft(mass * 1000, LENGTH, BEAM, density);
  const freeboard = HULL_DEPTH - draft;
  const common = { draftMeters: draft, freeboardMeters: freeboard, metacentricHeight: null, massTonnes: mass };
  if (round.kind === "river") {
    const error = Math.abs(draft - RIVER_DRAFT);
    const success = error <= RIVER_TOLERANCE;
    return {
      ...common, success, accuracyFraction: success ? 1 - error / RIVER_TOLERANCE : 0, predictionActual: density * LENGTH * BEAM * RIVER_DRAFT / 1000 - HULL_MASS_T,
      feedback: success ? `${mass} t displaces ${mass} m³·(ρ/1000) of water: the draft is ${draft.toFixed(2)} m, with ${freeboard.toFixed(2)} m of freeboard.`
        : draft >= HULL_DEPTH ? `At ${draft.toFixed(2)} m the draft exceeds the ${HULL_DEPTH} m hull: the barge sinks.` : `The draft is ${draft.toFixed(2)} m, ${draft > RIVER_DRAFT ? "too deep: unload some cargo" : "too shallow: add cargo"}.`,
    };
  }
  const success = draft >= SEA_DRAFT_LOW - 1e-9 && draft <= SEA_DRAFT_LIMIT + 1e-9;
  return {
    ...common, success, accuracyFraction: success ? 1 - (SEA_DRAFT_LIMIT - draft) / (SEA_DRAFT_LIMIT - SEA_DRAFT_LOW) : 0, predictionActual: density * LENGTH * BEAM * SEA_DRAFT_LIMIT / 1000 - HULL_MASS_T,
    feedback: success ? `${cargo} t of cargo gives a draft of ${draft.toFixed(2)} m, just inside the ${SEA_DRAFT_LIMIT} m load line.`
      : draft > SEA_DRAFT_LIMIT ? `The draft ${draft.toFixed(2)} m is past the ${SEA_DRAFT_LIMIT} m load line: the barge is overloaded${draft >= HULL_DEPTH ? " and sinks" : ""}.`
      : `The draft ${draft.toFixed(2)} m is safe but the barge is under-loaded: add cargo up to the ${SEA_DRAFT_LIMIT} m line.`,
  };
}

export const shipDesigner = defineNumericGame<ShipRound, ShipOutcome>({
  meta: SHIP_META,
  rounds: SHIP_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "stability" ? { label: "Your prediction of the metacentric height", unit: "m", placeholder: "e.g. 1.2", step: 0.01 }
    : { label: "Your prediction of the cargo needed", unit: "t", placeholder: "e.g. 140", step: 1 },
  evaluate: (round, values) => runShip(round, values),
});
