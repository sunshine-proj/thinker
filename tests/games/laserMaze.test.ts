import { describe, expect, it } from "vitest";
import { LASER_ROUNDS, MIRROR_ANGLE_RANGE, type LaserRound } from "../../src/features/games/laser-maze/laserMazeData";
import {
  evaluateLaser,
  laserMaze,
  readPredictedQuantity,
  traceLaser,
} from "../../src/features/games/laser-maze/laserMazeModel";
import { calculateRefractionAngleDegrees } from "../../src/physics/optics";

const [one, two, glass] = LASER_ROUNDS as [LaserRound, LaserRound, LaserRound];

/** All mirror settings (in 0.5° steps) that hit the target for a single-mirror round. */
function solutions(round: LaserRound): number[] {
  const found: number[] = [];
  for (let a = MIRROR_ANGLE_RANGE.minimum; a <= MIRROR_ANGLE_RANGE.maximum; a += MIRROR_ANGLE_RANGE.step) {
    if (evaluateLaser(round, { mirrorAnglesDegrees: [a] }).success) found.push(a);
  }
  return found;
}

describe("Laser Maze rounds", () => {
  it("round 1 has the analytic solution: mirror at half the sum of beam directions", () => {
    // Incoming 0°, outgoing atan2(50, 20) = 68.2° → mirror at 34.1° (± a half-degree step).
    const found = solutions(one);
    const expected = (Math.atan2(50, 20) * 180) / Math.PI / 2;

    expect(found.length).toBeGreaterThanOrEqual(3);
    expect(found.some((a) => Math.abs(a - expected) <= 0.5)).toBe(true);
    expect(Math.abs(found[0]! - expected)).toBeLessThan(2.5);
    expect(evaluateLaser(one, { mirrorAnglesDegrees: [60] }).success).toBe(false);
  });

  it("round 1 reports incidence equal to 90° minus the angle between beam and mirror", () => {
    const outcome = evaluateLaser(one, { mirrorAnglesDegrees: [34] });
    expect(outcome.predictionActual).toBeCloseTo(90 - 34, 6);
  });

  it("round 2 needs both mirrors at 135° and 45° (to within the target size)", () => {
    expect(evaluateLaser(two, { mirrorAnglesDegrees: [135, 45] }).success).toBe(true);
    expect(evaluateLaser(two, { mirrorAnglesDegrees: [135, 45] }).predictionActual).toBeCloseTo(45, 6);
    expect(evaluateLaser(two, { mirrorAnglesDegrees: [135, 50] }).success).toBe(false);
    expect(evaluateLaser(two, { mirrorAnglesDegrees: [120, 45] }).success).toBe(false);
  });

  it("explains when an earlier mirror sends the beam away from a later one", () => {
    const outcome = evaluateLaser(two, { mirrorAnglesDegrees: [100, 45] });
    expect(outcome.success).toBe(false);
    expect(outcome.feedback).toMatch(/never reached mirror 2/);
  });

  it("round 3 refracts at 19.47° inside the glass whatever the mirror does", () => {
    const expected = calculateRefractionAngleDegrees(30, 1, 1.5) as number;
    for (const angle of [10, 90, 150]) {
      const trace = traceLaser(glass, { mirrorAnglesDegrees: [angle] });
      expect(readPredictedQuantity(glass, trace)).toBeCloseTo(expected, 6);
    }
  });

  it("round 3 has a working mirror setting, which needs the glass to be modelled", () => {
    const found = solutions(glass);
    expect(found.length).toBeGreaterThanOrEqual(2);

    // Aiming as if the beam went straight through (no glass) misses once the glass shifts it.
    const naive = solutions({ ...glass, blocks: [] });
    const naiveCentre = naive[Math.floor(naive.length / 2)] as number;
    expect(naive.length).toBeGreaterThan(0);
    expect(evaluateLaser(glass, { mirrorAnglesDegrees: [naiveCentre] }).success).toBe(false);
  });

  it("increase in difficulty", () => {
    expect(LASER_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});

describe("evaluation and scoring inputs", () => {
  it("gives more accuracy credit for a beam through the middle of the target", () => {
    const found = solutions(one);
    const centred = found.reduce((best, a) =>
      evaluateLaser(one, { mirrorAnglesDegrees: [a] }).accuracyFraction >
      evaluateLaser(one, { mirrorAnglesDegrees: [best] }).accuracyFraction ? a : best);
    const edge = found[0] as number;

    expect(evaluateLaser(one, { mirrorAnglesDegrees: [centred] }).accuracyFraction)
      .toBeGreaterThan(evaluateLaser(one, { mirrorAnglesDegrees: [edge] }).accuracyFraction);
  });

  it("scores nothing and explains a miss with the distance", () => {
    const outcome = evaluateLaser(one, { mirrorAnglesDegrees: [60] });
    expect(outcome.accuracyFraction).toBe(0);
    expect(outcome.feedback).toMatch(/missed the target by .* cm/);
  });

  it("validates mirror angles", () => {
    expect(() => evaluateLaser(one, { mirrorAnglesDegrees: [200] })).toThrow(/between/);
    expect(() => evaluateLaser(one, { mirrorAnglesDegrees: [] })).toThrow(/every mirror/);
    expect(() => evaluateLaser(one, { mirrorAnglesDegrees: [Number.NaN] })).toThrow(RangeError);
  });

  it("round-trips valid saved controls and rejects corrupt ones", () => {
    expect(laserMaze.parseControl({ mirrorAnglesDegrees: [135, 45] }, two)).toEqual({ mirrorAnglesDegrees: [135, 45] });
    expect(laserMaze.parseControl({ mirrorAnglesDegrees: [135] }, two)).toBeNull();
    expect(laserMaze.parseControl({ mirrorAnglesDegrees: [999, 1] }, two)).toBeNull();
    expect(laserMaze.parseControl(null, two)).toBeNull();
  });
});
