import { describe, expect, it } from "vitest";
import {
  BALANCE_CHALLENGE_ROUNDS,
  type BalanceRound,
} from "../../src/features/games/balance-challenge/balanceChallengeData";
import {
  evaluateBalanceAttempt,
  getBackgroundLoads,
  getControlRange,
  getControlledLoad,
  getToleranceNewtonMeters,
  solveRound,
  summarizeTorques,
} from "../../src/features/games/balance-challenge/balanceChallengeModel";
import { STANDARD_GRAVITY } from "../../src/physics/core";

const [classic, threeWeights, heavyBeam] = BALANCE_CHALLENGE_ROUNDS as [
  BalanceRound,
  BalanceRound,
  BalanceRound,
];

describe("Balance Challenge rounds", () => {
  it("have the analytical solutions worked out by hand", () => {
    expect(solveRound(classic)).toBeCloseTo(4, 10); // 4 kg × 2 m = 2 kg × 4 m
    expect(solveRound(threeWeights)).toBeCloseTo(3, 10); // (9 + 2 − 2) / 3 m
    expect(solveRound(heavyBeam)).toBeCloseTo(5.5, 10); // (15 − 4) / 2 kg
  });

  it("keep every solution inside its control range and on a reachable step", () => {
    for (const round of BALANCE_CHALLENGE_ROUNDS) {
      const solution = solveRound(round);
      const { minimum, maximum, step } = getControlRange(round);

      expect(solution).not.toBeNull();
      expect(solution as number).toBeGreaterThanOrEqual(minimum);
      expect(solution as number).toBeLessThanOrEqual(maximum);
      expect(
        Math.abs(
          ((solution as number) - minimum) / step -
            Math.round(((solution as number) - minimum) / step),
        ),
      ).toBeLessThan(1e-9);
    }
  });

  it("keep loads and the solution on the beam", () => {
    for (const round of BALANCE_CHALLENGE_ROUNDS) {
      for (const load of round.fixedLoads) {
        expect(load.positionMeters).toBeGreaterThanOrEqual(round.beamLeftMeters);
        expect(load.positionMeters).toBeLessThanOrEqual(round.beamRightMeters);
      }
      const { maximum } = getControlRange(round);
      if (round.control.kind === "position") {
        expect(maximum).toBeLessThanOrEqual(round.beamRightMeters);
      }
    }
  });

  it("treats a uniform beam as a weight at its centre", () => {
    const loads = getBackgroundLoads(heavyBeam);
    expect(loads).toContainEqual({ massKilograms: 4, positionMeters: 1 });
  });

  it("increase in difficulty", () => {
    expect(BALANCE_CHALLENGE_ROUNDS.map((round) => round.difficulty)).toEqual([
      "Beginner",
      "Intermediate",
      "Advanced",
    ]);
  });
});

describe("releasing the lever", () => {
  it("balances at the exact solution with full accuracy credit", () => {
    const result = evaluateBalanceAttempt(classic, 4, 4, 1);

    expect(result.balanced).toBe(true);
    expect(result.state).toBe("balanced");
    expect(result.netTorqueNewtonMeters).toBeCloseTo(0, 10);
    expect(result.accuracyPoints).toBe(60);
    expect(result.predictionPoints).toBe(20);
    expect(result.attemptPoints).toBe(20);
    expect(result.score).toBe(100);
    expect(result.supportForceNewtons).toBeCloseTo(6 * STANDARD_GRAVITY, 10);
  });

  it("tips toward the heavier torque and awards nothing", () => {
    const tooFar = evaluateBalanceAttempt(classic, 5, 4, 1);
    const tooNear = evaluateBalanceAttempt(classic, 2.5, 4, 1);

    expect(tooFar.state).toBe("clockwise");
    expect(tooFar.netTorqueNewtonMeters).toBeCloseTo(2 * STANDARD_GRAVITY, 10);
    expect(tooNear.state).toBe("counterclockwise");
    expect(tooFar.score).toBe(0);
    expect(tooNear.score).toBe(0);
  });

  it("accepts a nearby setting within tolerance but with less accuracy credit", () => {
    const near = evaluateBalanceAttempt(classic, 4.1, 4, 1);

    expect(near.balanced).toBe(true);
    expect(near.accuracyPoints).toBeGreaterThan(0);
    expect(near.accuracyPoints).toBeLessThan(60);
  });

  it("makes the tolerance reachable by one control step but not two", () => {
    for (const round of BALANCE_CHALLENGE_ROUNDS) {
      const solution = solveRound(round) as number;
      const { step } = getControlRange(round);
      const oneOff = evaluateBalanceAttempt(round, solution + step, solution, 1);
      const twoOff = evaluateBalanceAttempt(
        round,
        solution + 2 * step,
        solution,
        1,
      );

      expect(oneOff.balanced).toBe(true);
      expect(twoOff.balanced).toBe(false);
    }
  });

  it("scores the prediction by its distance from the exact answer", () => {
    const close = evaluateBalanceAttempt(classic, 4, 4.5, 1);
    const far = evaluateBalanceAttempt(classic, 4, 8, 1);

    expect(close.predictionPoints).toBeLessThan(20);
    expect(close.predictionPoints).toBeGreaterThan(0);
    expect(far.predictionPoints).toBe(0);
  });

  it("rewards fewer attempts without making them the main source of points", () => {
    const first = evaluateBalanceAttempt(classic, 4, 4, 1);
    const second = evaluateBalanceAttempt(classic, 4, 4, 2);
    const later = evaluateBalanceAttempt(classic, 4, 4, 5);

    expect([first.attemptPoints, second.attemptPoints, later.attemptPoints]).toEqual(
      [20, 10, 0],
    );
    expect(later.score).toBeGreaterThanOrEqual(80);
  });

  it("balances the mass-control round and the heavy-beam round", () => {
    expect(evaluateBalanceAttempt(threeWeights, 3, 3, 1).score).toBe(100);
    expect(evaluateBalanceAttempt(heavyBeam, 5.5, 5.5, 1).score).toBe(100);
    // Using the massless answer (15 / 2 = 7.5 m) would be off the beam entirely.
    expect(15 / 2).toBeGreaterThan(heavyBeam.beamRightMeters);
  });

  it("splits clockwise and counter-clockwise torque", () => {
    const { clockwiseNewtonMeters, counterClockwiseNewtonMeters } =
      summarizeTorques(classic, 4);

    expect(clockwiseNewtonMeters).toBeCloseTo(8 * STANDARD_GRAVITY, 10);
    expect(counterClockwiseNewtonMeters).toBeCloseTo(8 * STANDARD_GRAVITY, 10);
  });

  it("derives tolerance from the fixed torques", () => {
    expect(getToleranceNewtonMeters(classic)).toBeCloseTo(
      0.04 * 8 * STANDARD_GRAVITY,
      10,
    );
  });

  it("validates inputs", () => {
    expect(() => getControlledLoad(classic, 0)).toThrow(RangeError);
    expect(() => getControlledLoad(classic, 7)).toThrow(RangeError);
    expect(() => getControlledLoad(classic, Number.NaN)).toThrow(RangeError);
    expect(() => evaluateBalanceAttempt(classic, 4, -1, 1)).toThrow(RangeError);
    expect(() => evaluateBalanceAttempt(classic, 4, 4, 0)).toThrow(RangeError);
  });
});
