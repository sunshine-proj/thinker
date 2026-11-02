import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";
import type { BeamPointLoad } from "../../../physics/mechanics";

export type MaterialId = "wood" | "aluminium" | "steel";

export interface BridgeMaterial {
  readonly id: MaterialId;
  readonly name: string;
  /** Density in kg/m³. */
  readonly densityKilogramsPerCubicMeter: number;
  /** Bending yield (or characteristic) strength in Pa. */
  readonly yieldStrengthPascals: number;
  /** Game currency per kilogram of material. */
  readonly costPerKilogram: number;
}

/** Typical handbook values, rounded: structural pine, 6061-T6 aluminium, A36 steel. */
export const BRIDGE_MATERIALS: Readonly<Record<MaterialId, BridgeMaterial>> = Object.freeze({
  wood: { id: "wood", name: "Pine timber", densityKilogramsPerCubicMeter: 500, yieldStrengthPascals: 40e6, costPerKilogram: 1 },
  aluminium: { id: "aluminium", name: "Aluminium 6061-T6", densityKilogramsPerCubicMeter: 2700, yieldStrengthPascals: 240e6, costPerKilogram: 6 },
  steel: { id: "steel", name: "Structural steel", densityKilogramsPerCubicMeter: 7850, yieldStrengthPascals: 250e6, costPerKilogram: 2 },
});

/** Allowable stress is the yield strength divided by this factor. */
export const SAFETY_FACTOR = 1.5;

export interface BridgeRound extends RoundBase {
  readonly spanMeters: number;
  readonly widthMeters: number;
  /** Vehicle loads in newtons at positions along the span. */
  readonly vehicleLoads: readonly BeamPointLoad[];
  /** Road surface and railings, in N/m, on top of the beam's own weight. */
  readonly deckLoadNewtonsPerMeter: number;
  /** Greatest beam depth that fits under the road. */
  readonly maximumHeightMeters: number;
  readonly minimumHeightMeters: number;
  readonly budget: number;
}

export interface BridgeControl {
  readonly material: MaterialId;
  readonly heightMeters: number;
}

export const BRIDGE_BUILDER_META: RoundGameMeta = {
  id: "bridge-builder",
  title: "Bridge Builder",
  eyebrow: "MECHANICS · CONSTRUCTION",
  modelTag: "BEAM BENDING · STATIC",
  introduction:
    "Choose the material and depth of a beam bridge so it carries its traffic safely, fits under the road, and stays within budget.",
  instructions:
    "Predict the largest bending moment, choose a material and beam depth, then load the bridge. The beam must stay below its allowable stress, fit the clearance, and cost no more than the budget.",
  formula: "M = P a (L − a) / L  ·  σ = M c / I  ·  I = b h³ / 12",
  formulaCaption:
    "M is the bending moment, σ the bending stress, c = h/2 the distance to the outer fibre, I the second moment of area, b the width and h the depth of the beam.",
  explanation:
    "Loads on a beam are carried to the supports by internal bending. The bending moment is largest where the shear force changes sign, and the outer fibres of the beam carry the stress σ = M c / I. Because I grows with the cube of depth, a deeper beam is far stronger for little extra material: doubling the depth cuts the stress by four. A stronger material allows a shallower beam, but heavier materials add their own weight to the load.",
  assumptions:
    "The beam is a solid rectangle in the linear elastic range on two simple supports, loaded statically. Only bending stress is checked: shear, deflection, buckling, connections, fatigue and moving-load effects are ignored. Material strengths are rounded handbook values, and costs are in game credits per kilogram.",
  learningObjectives: [
    "Find support reactions and the maximum bending moment from equilibrium.",
    "Apply the flexure formula σ = M c / I to a rectangular beam.",
    "See why beam depth matters more than width, and weigh strength against cost and weight.",
  ],
  objective: {
    title: "Build every bridge",
    description: "Carry each load safely within clearance and budget.",
    unit: "bridges",
  },
  controlsHeading: "Design the beam",
  submitLabel: "Load the bridge",
  solvedLabel: "Bridge holds!",
  nextLabel: "Next bridge",
};

export const BRIDGE_ROUNDS: readonly BridgeRound[] = Object.freeze([
  {
    id: "village-bridge",
    title: "Village footbridge",
    difficulty: "Beginner",
    situation:
      "A 6 m span must carry a 2,000 kg truck at midspan. The beam is 0.20 m wide and only 0.12 m of depth fits under the road. Budget: 1,700 credits.",
    spanMeters: 6,
    widthMeters: 0.2,
    vehicleLoads: [{ forceNewtons: 2000 * 9.80665, positionMeters: 3 }],
    deckLoadNewtonsPerMeter: 0,
    minimumHeightMeters: 0.03,
    maximumHeightMeters: 0.12,
    budget: 1700,
    hint: "Timber is cheap but weak, so it needs more depth than fits. Try a stronger material and find the depth where the stress just reaches the allowable limit.",
  },
  {
    id: "off-centre-load",
    title: "The loading dock",
    difficulty: "Intermediate",
    situation:
      "A 3,000 kg truck stops 2 m from one end of an 8 m span. The beam is 0.25 m wide with 0.15 m of clearance. Budget: 3,000 credits.",
    spanMeters: 8,
    widthMeters: 0.25,
    vehicleLoads: [{ forceNewtons: 3000 * 9.80665, positionMeters: 2 }],
    deckLoadNewtonsPerMeter: 0,
    minimumHeightMeters: 0.03,
    maximumHeightMeters: 0.15,
    budget: 3000,
    hint: "The largest moment sits under the load, not at midspan: M = P a (L − a) / L. Do not forget the beam's own weight.",
  },
  {
    id: "river-crossing",
    title: "River crossing",
    difficulty: "Advanced",
    situation:
      "Two 4,000 kg trucks stand 4 m and 8 m along a 12 m span, and the deck adds 1,500 N/m. The beam is 0.30 m wide with 0.35 m of clearance. Budget: 12,000 credits.",
    spanMeters: 12,
    widthMeters: 0.3,
    vehicleLoads: [
      { forceNewtons: 4000 * 9.80665, positionMeters: 4 },
      { forceNewtons: 4000 * 9.80665, positionMeters: 8 },
    ],
    deckLoadNewtonsPerMeter: 1500,
    minimumHeightMeters: 0.05,
    maximumHeightMeters: 0.35,
    budget: 12_000,
    hint: "Add the moments from the trucks and the distributed deck weight. A heavy material adds its own weight to the load, so check the cost as well as the stress.",
  },
]);
