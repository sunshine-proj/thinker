import { assertFiniteNumber } from "../../../physics/core";
import {
  calculateBendingStress,
  calculateMaximumBendingMoment,
  calculateReactions,
  calculateRectangularSecondMoment,
  calculateSelfWeightPerMeter,
  type BeamReactions,
  type SimplySupportedBeam,
} from "../../../physics/mechanics";
import type { AttemptOutcome, RoundGameDefinition } from "../../../game-engine/rounds/types";
import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import {
  BRIDGE_BUILDER_META,
  BRIDGE_MATERIALS,
  BRIDGE_ROUNDS,
  SAFETY_FACTOR,
  type BridgeControl,
  type BridgeRound,
  type MaterialId,
} from "./bridgeBuilderData";

export type BridgeFailure = "none" | "overstressed" | "over-budget";

export interface BridgeOutcome extends AttemptOutcome {
  readonly beam: SimplySupportedBeam;
  readonly reactions: BeamReactions;
  readonly maximumMomentNewtonMeters: number;
  readonly maximumMomentPositionMeters: number;
  readonly stressPascals: number;
  readonly allowableStressPascals: number;
  /** Stress as a fraction of the allowable stress (1 = at the limit). */
  readonly utilization: number;
  readonly massKilograms: number;
  readonly cost: number;
  readonly failure: BridgeFailure;
}

export function getAllowableStress(material: MaterialId): number {
  return BRIDGE_MATERIALS[material].yieldStrengthPascals / SAFETY_FACTOR;
}

export function buildBeam(round: BridgeRound, control: BridgeControl): SimplySupportedBeam {
  const material = BRIDGE_MATERIALS[control.material];
  return {
    lengthMeters: round.spanMeters,
    pointLoads: round.vehicleLoads,
    uniformLoadNewtonsPerMeter:
      round.deckLoadNewtonsPerMeter +
      calculateSelfWeightPerMeter(
        material.densityKilogramsPerCubicMeter,
        round.widthMeters,
        control.heightMeters,
      ),
  };
}

function validateControl(round: BridgeRound, control: BridgeControl): void {
  assertFiniteNumber(control.heightMeters, "heightMeters");
  if (!(control.material in BRIDGE_MATERIALS)) {
    throw new RangeError("Choose one of the available materials.");
  }
  if (
    control.heightMeters < round.minimumHeightMeters ||
    control.heightMeters > round.maximumHeightMeters
  ) {
    throw new RangeError(
      `Beam depth must be between ${round.minimumHeightMeters * 100} and ${round.maximumHeightMeters * 100} cm for this bridge.`,
    );
  }
}

/** Loads the bridge with the learner's design and checks strength, clearance and budget. */
export function evaluateBridge(
  round: BridgeRound,
  control: BridgeControl,
): BridgeOutcome {
  validateControl(round, control);
  const material = BRIDGE_MATERIALS[control.material];
  const beam = buildBeam(round, control);
  const reactions = calculateReactions(beam);
  const maximum = calculateMaximumBendingMoment(beam);
  const stressPascals = calculateBendingStress(
    maximum.momentNewtonMeters,
    calculateRectangularSecondMoment(round.widthMeters, control.heightMeters),
    control.heightMeters / 2,
  );
  const allowableStressPascals = getAllowableStress(control.material);
  const utilization = stressPascals / allowableStressPascals;
  const massKilograms =
    material.densityKilogramsPerCubicMeter *
    round.widthMeters *
    control.heightMeters *
    round.spanMeters;
  const cost = massKilograms * material.costPerKilogram;

  const failure: BridgeFailure =
    utilization > 1 ? "overstressed" : cost > round.budget ? "over-budget" : "none";
  const stressMPa = (stressPascals / 1e6).toFixed(0);
  const limitMPa = (allowableStressPascals / 1e6).toFixed(0);
  const feedback =
    failure === "overstressed"
      ? `The ${material.name.toLowerCase()} beam is overstressed: ${stressMPa} MPa against an allowable ${limitMPa} MPa. Increase the depth or choose a stronger material.`
      : failure === "over-budget"
        ? `The beam is strong enough (${stressMPa} of ${limitMPa} MPa) but costs ${Math.round(cost)} credits, over the ${round.budget} budget. A lighter or cheaper design will do.`
        : `Peak stress is ${stressMPa} MPa, ${(utilization * 100).toFixed(0)}% of the ${limitMPa} MPa allowable, for ${Math.round(cost)} credits.`;

  return {
    success: failure === "none",
    // Rewards efficient use of material: close to the limit is best.
    accuracyFraction: failure === "none" ? utilization : 0,
    predictionActual: maximum.momentNewtonMeters / 1000,
    feedback,
    beam,
    reactions,
    maximumMomentNewtonMeters: maximum.momentNewtonMeters,
    maximumMomentPositionMeters: maximum.positionMeters,
    stressPascals,
    allowableStressPascals,
    utilization,
    massKilograms,
    cost,
    failure,
  };
}

export const bridgeBuilder: RoundGameDefinition<BridgeRound, BridgeControl, BridgeOutcome> = {
  meta: BRIDGE_BUILDER_META,
  rounds: BRIDGE_ROUNDS,
  createControl: (round) => ({
    material: "wood",
    heightMeters: Number(((round.minimumHeightMeters + round.maximumHeightMeters) / 2).toFixed(3)),
  }),
  parseControl: (raw, round) => {
    if (!isRecord(raw) || typeof raw.material !== "string" || !(raw.material in BRIDGE_MATERIALS)) {
      return null;
    }
    const heightMeters = readNumber(raw, "heightMeters", round.minimumHeightMeters, round.maximumHeightMeters);
    return heightMeters === null ? null : { material: raw.material as MaterialId, heightMeters };
  },
  prediction: () => ({
    label: "Your maximum bending moment prediction",
    unit: "kN·m",
    placeholder: "e.g. 30",
    step: 0.1,
  }),
  evaluate: (round, control) => evaluateBridge(round, control),
};
