import { describe, expect, it } from "vitest";
import {
  calculateBlurDiameter,
  calculateConjugatePositions,
  calculateFocalLength,
  calculateImageDistance,
  calculateMagnification,
} from "../../src/physics/optics";

describe("lensmaker's equation", () => {
  it("gives f = R for a symmetric biconvex lens with n = 1.5", () => {
    expect(calculateFocalLength(1.5, 10, -10)).toBeCloseTo(10, 10);
  });

  it("gives f = R / (n − 1) for a plano-convex lens", () => {
    expect(calculateFocalLength(1.5, 10, Infinity)).toBeCloseTo(20, 10);
  });

  it("makes a diverging lens (negative f) from a biconcave shape", () => {
    expect(calculateFocalLength(1.5, -10, 10)).toBeCloseTo(-10, 10);
  });

  it("gets shorter for a higher index or a tighter curve", () => {
    expect(calculateFocalLength(1.7, 10, -10)).toBeLessThan(calculateFocalLength(1.5, 10, -10));
    expect(calculateFocalLength(1.5, 5, -5)).toBeLessThan(calculateFocalLength(1.5, 10, -10));
  });

  it("rejects no-power and invalid surfaces", () => {
    expect(() => calculateFocalLength(1.5, Infinity, Infinity)).toThrow(/no focusing power/);
    expect(() => calculateFocalLength(1.5, 0, 10)).toThrow(RangeError);
    expect(() => calculateFocalLength(0, 10, -10)).toThrow(RangeError);
  });
});

describe("thin-lens equation and magnification", () => {
  it("images an object at 2f at 2f with m = −1", () => {
    const di = calculateImageDistance(10, 20) as number;
    expect(di).toBeCloseTo(20, 10);
    expect(calculateMagnification(20, di)).toBeCloseTo(-1, 10);
  });

  it("magnifies a close object: dₒ = 15, f = 10 → dᵢ = 30, m = −2", () => {
    const di = calculateImageDistance(10, 15) as number;
    expect(di).toBeCloseTo(30, 10);
    expect(calculateMagnification(15, di)).toBeCloseTo(-2, 10);
  });

  it("sends a distant object's image to the focal point", () => {
    expect(calculateImageDistance(10, 1e9) as number).toBeCloseTo(10, 6);
  });

  it("gives no image at the focal point", () => {
    expect(calculateImageDistance(10, 10)).toBeNull();
  });

  it("makes an upright, enlarged virtual image inside the focal length (magnifier)", () => {
    const di = calculateImageDistance(10, 5) as number;
    expect(di).toBeCloseTo(-10, 10); // virtual, on the object's side
    expect(calculateMagnification(5, di)).toBeCloseTo(2, 10); // upright (positive)
  });

  it("agrees with m = f / (f − dₒ)", () => {
    for (const objectDistance of [3, 7, 14, 25]) {
      const di = calculateImageDistance(10, objectDistance) as number;
      expect(calculateMagnification(objectDistance, di)).toBeCloseTo(10 / (10 - objectDistance), 10);
    }
  });

  it("makes a diverging lens form only a virtual, reduced image", () => {
    const di = calculateImageDistance(-10, 20) as number;
    expect(di).toBeLessThan(0);
    expect(Math.abs(calculateMagnification(20, di))).toBeLessThan(1);
  });

  it("validates inputs", () => {
    expect(() => calculateImageDistance(0, 10)).toThrow(RangeError);
    expect(() => calculateImageDistance(10, 0)).toThrow(RangeError);
    expect(() => calculateMagnification(0, 5)).toThrow(RangeError);
  });
});

describe("conjugate lens positions", () => {
  it("finds the two lens positions that focus an object onto a screen", () => {
    const positions = calculateConjugatePositions(10, 60);
    expect(positions).toHaveLength(2);
    expect(positions[0]).toBeCloseTo((60 - Math.sqrt(60 * 20)) / 2, 10);
    for (const p of positions) {
      const di = calculateImageDistance(10, p) as number;
      expect(p + di).toBeCloseTo(60, 8);
    }
  });

  it("is symmetric: the two positions swap object and image distances", () => {
    const [near, far] = calculateConjugatePositions(10, 60) as [number, number];
    expect(near + far).toBeCloseTo(60, 10);
  });

  it("has one position at exactly 4f and none below", () => {
    expect(calculateConjugatePositions(10, 40)).toEqual([20]);
    expect(calculateConjugatePositions(10, 39)).toEqual([]);
  });
});

describe("defocus blur", () => {
  it("is zero when the screen is at the image", () => {
    expect(calculateBlurDiameter(4, 47.3, 47.3)).toBe(0);
  });

  it("grows with the defocus and the aperture", () => {
    expect(calculateBlurDiameter(4, 40, 44)).toBeCloseTo(0.4, 10);
    expect(calculateBlurDiameter(8, 40, 44)).toBeCloseTo(0.8, 10);
    expect(calculateBlurDiameter(4, 40, 36)).toBeCloseTo(0.4, 10);
  });
});
