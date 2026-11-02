import { describe, expect, it } from "vitest";
import { LENS_ROUNDS, type LensRound } from "../../src/features/games/lens-designer/lensDesignerData";
import {
  calculateLensGeometry,
  evaluateLens,
  lensDesigner,
} from "../../src/features/games/lens-designer/lensDesignerModel";
import { calculateConjugatePositions } from "../../src/physics/optics";

const [focus, enlarge, magnifier] = LENS_ROUNDS as [LensRound, LensRound, LensRound];

describe("Lens Designer geometry", () => {
  it("uses f = R for a symmetric biconvex n = 1.5 lens", () => {
    const geometry = calculateLensGeometry(enlarge, { radiusCm: 15, positionCm: 20 });
    expect(geometry.focalLengthCm).toBeCloseTo(15, 10);
    expect(geometry.imageDistanceCm).toBeCloseTo(60, 8);
    expect(geometry.magnification).toBeCloseTo(-3, 8);
    expect(geometry.imageHeightCm).toBeCloseTo(-6, 8);
    expect(geometry.isReal).toBe(true);
  });

  it("makes an upright virtual image inside the focal length", () => {
    const geometry = calculateLensGeometry(magnifier, { radiusCm: 6.25, positionCm: 5 });
    expect(geometry.imageDistanceCm).toBeCloseTo(-25, 8);
    expect(geometry.magnification).toBeCloseTo(5, 8);
    expect(geometry.isReal).toBe(false);
  });

  it("rejects settings outside the bench", () => {
    expect(() => calculateLensGeometry(focus, { radiusCm: 10, positionCm: 70 })).toThrow(/cm from the object/);
    expect(() => calculateLensGeometry(enlarge, { radiusCm: 100, positionCm: 20 })).toThrow(/radius/);
  });

  it("keeps the first round's lens fixed whatever the control says", () => {
    expect(calculateLensGeometry(focus, { radiusCm: 20, positionCm: 20 }).focalLengthCm).toBeCloseTo(10, 10);
  });
});

describe("Lens Designer rounds", () => {
  it("round 1: both conjugate positions focus the image; others blur it", () => {
    const [near, far] = calculateConjugatePositions(10, 60) as [number, number];
    for (const p of [near, far]) {
      const outcome = evaluateLens(focus, { radiusCm: 10, positionCm: Number(p.toFixed(1)) });
      expect(outcome.success).toBe(true);
      expect(outcome.blurCm).toBeLessThanOrEqual(0.1);
    }
    const blurred = evaluateLens(focus, { radiusCm: 10, positionCm: 30 });
    expect(blurred.success).toBe(false);
    expect(blurred.feedback).toMatch(/blurred/);
  });

  it("round 1: object distance 12.7 cm gives image distance 47.3 cm", () => {
    const outcome = evaluateLens(focus, { radiusCm: 10, positionCm: 12.7 });
    expect(outcome.geometry.imageDistanceCm).toBeCloseTo(47.3, 0);
    expect(outcome.predictionActual).toBeCloseTo(47.3, 0);
  });

  it("round 2: needs both a sharp image and magnification 3", () => {
    expect(evaluateLens(enlarge, { radiusCm: 15, positionCm: 20 }).success).toBe(true);
    // Sharp but at the other conjugate position (magnification 1/3): wrong size.
    const small = evaluateLens(enlarge, { radiusCm: 15, positionCm: 60 });
    expect(small.blurCm).toBeLessThanOrEqual(0.1);
    expect(small.success).toBe(false);
    expect(small.feedback).toMatch(/not 3/);
    // Right focal length, wrong position: blurred.
    expect(evaluateLens(enlarge, { radiusCm: 15, positionCm: 25 }).success).toBe(false);
    expect(evaluateLens(enlarge, { radiusCm: 15, positionCm: 20 }).predictionActual).toBeCloseTo(6, 8);
  });

  it("round 3: needs the object inside the focal length at the right curvature and distance", () => {
    expect(evaluateLens(magnifier, { radiusCm: 6.25, positionCm: 5 }).success).toBe(true);
    expect(evaluateLens(magnifier, { radiusCm: 6.25, positionCm: 5 }).predictionActual).toBeCloseTo(5, 8);
    expect(evaluateLens(magnifier, { radiusCm: 6.25, positionCm: 7 }).feedback).toMatch(/real and inverted/);
    expect(evaluateLens(magnifier, { radiusCm: 6.25, positionCm: 4 }).success).toBe(false);
  });

  it("reports no image with the object exactly at the focal point", () => {
    const outcome = evaluateLens(magnifier, { radiusCm: 5, positionCm: 5 });
    expect(outcome.success).toBe(false);
    expect(outcome.geometry.imageDistanceCm).toBeNull();
    expect(outcome.feedback).toMatch(/no image forms/);
    expect(outcome.predictionActual).toBeNull();
  });

  it("explains that a virtual image cannot land on a screen", () => {
    const outcome = evaluateLens(focus, { radiusCm: 10, positionCm: 8 });
    expect(outcome.success).toBe(false);
    expect(outcome.feedback).toMatch(/virtual image that cannot be caught/);
  });

  it("gives more accuracy for a sharper focus", () => {
    const exact = calculateConjugatePositions(10, 60)[0] as number;
    const sharp = evaluateLens(focus, { radiusCm: 10, positionCm: Number(exact.toFixed(1)) });
    const soft = evaluateLens(focus, { radiusCm: 10, positionCm: Number((exact + 0.3).toFixed(1)) });
    expect(sharp.accuracyFraction).toBeGreaterThan(soft.accuracyFraction);
  });

  it("ask a different question each round and rise in difficulty", () => {
    expect(LENS_ROUNDS.map((r) => lensDesigner.prediction(r)?.label)).toEqual([
      "Your prediction of the image distance",
      "Your prediction of the image height",
      "Your prediction of the magnification",
    ]);
    expect(LENS_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });

  it("round-trips and rejects corrupt saved controls", () => {
    expect(lensDesigner.parseControl({ radiusCm: 15, positionCm: 20 }, enlarge)).toEqual({ radiusCm: 15, positionCm: 20 });
    expect(lensDesigner.parseControl({ radiusCm: 15, positionCm: 500 }, enlarge)).toBeNull();
    expect(lensDesigner.parseControl("x", enlarge)).toBeNull();
  });
});
