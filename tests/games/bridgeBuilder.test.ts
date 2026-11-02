import { describe, expect, it } from "vitest";
import { scoreStandardAttempt } from "../../src/game-engine/scoring/standardScoring";
import {
  BRIDGE_MATERIALS,
  BRIDGE_ROUNDS,
  SAFETY_FACTOR,
  type BridgeRound,
  type MaterialId,
} from "../../src/features/games/bridge-builder/bridgeBuilderData";
import {
  bridgeBuilder,
  evaluateBridge,
  getAllowableStress,
} from "../../src/features/games/bridge-builder/bridgeBuilderModel";
import { STANDARD_GRAVITY } from "../../src/physics/core";

const [village, dock, river] = BRIDGE_ROUNDS as [BridgeRound, BridgeRound, BridgeRound];

/** Depths (m) that satisfy strength, clearance and budget, scanned in 1 mm steps. */
function feasibleDepths(round: BridgeRound, material: MaterialId): number[] {
  const depths: number[] = [];
  for (let mm = Math.round(round.minimumHeightMeters * 1000); mm <= Math.round(round.maximumHeightMeters * 1000); mm += 1) {
    if (evaluateBridge(round, { material, heightMeters: mm / 1000 }).success) {
      depths.push(mm / 1000);
    }
  }
  return depths;
}

describe("Bridge Builder physics", () => {
  it("reports a midspan moment of PL/4 plus self weight", () => {
    const outcome = evaluateBridge(village, { material: "steel", heightMeters: 0.1 });
    const load = 2000 * STANDARD_GRAVITY;
    const selfWeight = 7850 * 0.2 * 0.1 * STANDARD_GRAVITY; // N/m
    const expected = (load * 6) / 4 + (selfWeight * 36) / 8;

    expect(outcome.maximumMomentNewtonMeters).toBeCloseTo(expected, 6);
    expect(outcome.maximumMomentPositionMeters).toBeCloseTo(3, 8);
    expect(outcome.reactions.leftNewtons).toBeCloseTo(load / 2 + (selfWeight * 6) / 2, 6);
  });

  it("matches a hand calculation of stress: σ = 6M / (b h²)", () => {
    const outcome = evaluateBridge(village, { material: "steel", heightMeters: 0.1 });
    expect(outcome.stressPascals).toBeCloseTo((6 * outcome.maximumMomentNewtonMeters) / (0.2 * 0.1 ** 2), 3);
  });

  it("puts the peak moment under the load for an off-centre truck", () => {
    const outcome = evaluateBridge(dock, { material: "steel", heightMeters: 0.1 });
    expect(outcome.maximumMomentPositionMeters).toBeGreaterThan(1.9);
    expect(outcome.maximumMomentPositionMeters).toBeLessThan(4);
  });

  it("uses the allowable stress yield / safety factor", () => {
    expect(getAllowableStress("steel")).toBeCloseTo(BRIDGE_MATERIALS.steel.yieldStrengthPascals / SAFETY_FACTOR, 6);
  });

  it("computes mass and cost from density, volume and price", () => {
    const outcome = evaluateBridge(village, { material: "aluminium", heightMeters: 0.08 });
    expect(outcome.massKilograms).toBeCloseTo(2700 * 0.2 * 0.08 * 6, 8);
    expect(outcome.cost).toBeCloseTo(outcome.massKilograms * 6, 8);
  });
});

describe("Bridge Builder rounds", () => {
  it("each have a window of working designs for steel and aluminium", () => {
    for (const round of BRIDGE_ROUNDS) {
      for (const material of ["steel", "aluminium"] as const) {
        expect(feasibleDepths(round, material).length).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("make timber fail the clearance rule in every round except by depth", () => {
    expect(feasibleDepths(village, "wood")).toEqual([]);
    expect(feasibleDepths(dock, "wood")).toEqual([]);
    expect(feasibleDepths(river, "wood")).toEqual([]);
  });

  it("let the budget bind: very deep beams are rejected as too expensive", () => {
    const deep = evaluateBridge(village, { material: "steel", heightMeters: 0.12 });
    expect(deep.failure).toBe("over-budget");
    expect(deep.success).toBe(false);
  });

  it("reject too-shallow beams as overstressed", () => {
    const shallow = evaluateBridge(village, { material: "steel", heightMeters: 0.05 });
    expect(shallow.failure).toBe("overstressed");
    expect(shallow.utilization).toBeGreaterThan(1);
    expect(shallow.feedback).toContain("overstressed");
  });

  it("reward efficient designs with more accuracy credit", () => {
    const depths = feasibleDepths(village, "steel");
    const efficient = evaluateBridge(village, { material: "steel", heightMeters: depths[0] as number });
    const wasteful = evaluateBridge(village, { material: "steel", heightMeters: depths.at(-1) as number });

    expect(efficient.accuracyFraction).toBeGreaterThan(wasteful.accuracyFraction);
    expect(efficient.accuracyFraction).toBeLessThanOrEqual(1);
  });

  it("need a deeper beam in steel than in aluminium in round 3, because aluminium is stronger", () => {
    expect(feasibleDepths(river, "steel")[0]).toBeGreaterThan(0.17);
    expect(feasibleDepths(river, "aluminium")[0]).toBeLessThan(0.17);
  });

  it("increase in difficulty", () => {
    expect(BRIDGE_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });

  it("reject depths outside the clearance", () => {
    expect(() => evaluateBridge(village, { material: "steel", heightMeters: 0.2 })).toThrow(/between/);
    expect(() => evaluateBridge(village, { material: "steel", heightMeters: Number.NaN })).toThrow(RangeError);
  });
});

describe("Bridge Builder scoring and persistence", () => {
  it("scores a working design out of 100 with a good prediction", () => {
    const depth = feasibleDepths(village, "steel")[0] as number;
    const outcome = bridgeBuilder.evaluate(village, { material: "steel", heightMeters: depth }, 20, 1);
    const points = scoreStandardAttempt({
      success: outcome.success,
      accuracyFraction: outcome.accuracyFraction,
      predicted: outcome.predictionActual,
      predictionActual: outcome.predictionActual,
      attemptNumber: 1,
    });

    expect(outcome.success).toBe(true);
    expect(points.predictionPoints).toBe(20);
    expect(points.score).toBeGreaterThan(70);
    expect(points.score).toBeLessThanOrEqual(100);
  });

  it("restores only valid saved controls", () => {
    expect(bridgeBuilder.parseControl({ material: "steel", heightMeters: 0.09 }, village))
      .toEqual({ material: "steel", heightMeters: 0.09 });
    expect(bridgeBuilder.parseControl({ material: "gold", heightMeters: 0.09 }, village)).toBeNull();
    expect(bridgeBuilder.parseControl({ material: "steel", heightMeters: 5 }, village)).toBeNull();
    expect(bridgeBuilder.parseControl(null, village)).toBeNull();
  });
});
