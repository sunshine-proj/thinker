import { describe, expect, it } from "vitest";
import { scoreStandardAttempt } from "../../src/game-engine/scoring/standardScoring";

const base = { success: true, accuracyFraction: 1, predicted: 10, predictionActual: 10, attemptNumber: 1 };

describe("standard scoring", () => {
  it("awards 100 for an exact first attempt with a perfect prediction", () => {
    expect(scoreStandardAttempt(base)).toEqual({ accuracyPoints: 60, predictionPoints: 20, attemptPoints: 20, score: 100 });
  });

  it("awards nothing unless the attempt succeeds", () => {
    expect(scoreStandardAttempt({ ...base, success: false }).score).toBe(0);
  });

  it("scales accuracy credit and clamps out-of-range fractions", () => {
    expect(scoreStandardAttempt({ ...base, accuracyFraction: 0.5 }).accuracyPoints).toBe(30);
    expect(scoreStandardAttempt({ ...base, accuracyFraction: 2 }).accuracyPoints).toBe(60);
    expect(scoreStandardAttempt({ ...base, accuracyFraction: -1 }).accuracyPoints).toBe(0);
  });

  it("gives partial prediction credit inside the 25% window and none outside", () => {
    expect(scoreStandardAttempt({ ...base, predicted: 11.25 }).predictionPoints).toBe(10);
    expect(scoreStandardAttempt({ ...base, predicted: 12.5 }).predictionPoints).toBe(0);
    expect(scoreStandardAttempt({ ...base, predicted: 30 }).predictionPoints).toBe(0);
  });

  it("requires an exact prediction when the true value is zero", () => {
    expect(scoreStandardAttempt({ ...base, predicted: 0, predictionActual: 0 }).predictionPoints).toBe(20);
    expect(scoreStandardAttempt({ ...base, predicted: 1, predictionActual: 0 }).predictionPoints).toBe(0);
  });

  it("rewards fewer attempts but never makes them the main source of points", () => {
    const points = [1, 2, 3, 9].map((n) => scoreStandardAttempt({ ...base, attemptNumber: n }).attemptPoints);
    expect(points).toEqual([20, 10, 0, 0]);
    expect(scoreStandardAttempt({ ...base, attemptNumber: 9 }).score).toBe(80);
  });

  it("gives the prediction's points to accuracy when the game asks for no prediction", () => {
    const result = scoreStandardAttempt({ ...base, predicted: null, predictionActual: null });
    expect(result).toEqual({ accuracyPoints: 80, predictionPoints: 0, attemptPoints: 20, score: 100 });
  });

  it("rejects an invalid attempt number", () => {
    expect(() => scoreStandardAttempt({ ...base, attemptNumber: 0 })).toThrow(RangeError);
  });
});
