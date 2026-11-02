import { describe, expect, it } from "vitest";
import {
  calculateBendingMomentAt,
  calculateBendingStress,
  calculateMaximumBendingMoment,
  calculateReactions,
  calculateRectangularSecondMoment,
  calculateSelfWeightPerMeter,
  calculateShearAt,
  type SimplySupportedBeam,
} from "../../src/physics/mechanics";

const beam = (
  lengthMeters: number,
  pointLoads: { forceNewtons: number; positionMeters: number }[] = [],
  uniformLoadNewtonsPerMeter = 0,
): SimplySupportedBeam => ({ lengthMeters, pointLoads, uniformLoadNewtonsPerMeter });

describe("reactions", () => {
  it("splits a central load equally", () => {
    const r = calculateReactions(beam(6, [{ forceNewtons: 1000, positionMeters: 3 }]));
    expect(r.leftNewtons).toBeCloseTo(500, 10);
    expect(r.rightNewtons).toBeCloseTo(500, 10);
  });

  it("gives the nearer support more of an off-centre load", () => {
    const r = calculateReactions(beam(8, [{ forceNewtons: 800, positionMeters: 2 }]));
    expect(r.leftNewtons).toBeCloseTo(600, 10); // P (L − a) / L
    expect(r.rightNewtons).toBeCloseTo(200, 10); // P a / L
  });

  it("satisfies force balance for mixed loads", () => {
    const b = beam(10, [{ forceNewtons: 300, positionMeters: 1 }, { forceNewtons: 500, positionMeters: 7 }], 40);
    const r = calculateReactions(b);
    expect(r.leftNewtons + r.rightNewtons).toBeCloseTo(300 + 500 + 400, 10);
  });
});

describe("bending moment", () => {
  it("is PL/4 under a central point load", () => {
    const b = beam(6, [{ forceNewtons: 1000, positionMeters: 3 }]);
    const max = calculateMaximumBendingMoment(b);
    expect(max.momentNewtonMeters).toBeCloseTo((1000 * 6) / 4, 8);
    expect(max.positionMeters).toBeCloseTo(3, 10);
  });

  it("is wL²/8 at midspan for a uniform load", () => {
    const max = calculateMaximumBendingMoment(beam(10, [], 100));
    expect(max.momentNewtonMeters).toBeCloseTo((100 * 100) / 8, 8);
    expect(max.positionMeters).toBeCloseTo(5, 8);
  });

  it("is P a (L − a) / L under an off-centre load", () => {
    const max = calculateMaximumBendingMoment(beam(8, [{ forceNewtons: 800, positionMeters: 2 }]));
    expect(max.momentNewtonMeters).toBeCloseTo((800 * 2 * 6) / 8, 8);
    expect(max.positionMeters).toBeCloseTo(2, 10);
  });

  it("superposes a point load and a uniform load at midspan", () => {
    const max = calculateMaximumBendingMoment(beam(6, [{ forceNewtons: 1000, positionMeters: 3 }], 50));
    expect(max.momentNewtonMeters).toBeCloseTo(1500 + (50 * 36) / 8, 8);
  });

  it("is zero at both supports and agrees with a brute-force scan", () => {
    const b = beam(9, [{ forceNewtons: 400, positionMeters: 2 }, { forceNewtons: 900, positionMeters: 6 }], 75);
    expect(calculateBendingMomentAt(b, 0)).toBeCloseTo(0, 8);
    expect(calculateBendingMomentAt(b, 9)).toBeCloseTo(0, 8);

    let scanned = 0;
    for (let i = 0; i <= 90_000; i += 1) {
      scanned = Math.max(scanned, calculateBendingMomentAt(b, i / 10_000));
    }
    expect(calculateMaximumBendingMoment(b).momentNewtonMeters).toBeGreaterThanOrEqual(scanned - 1e-6);
    expect(calculateMaximumBendingMoment(b).momentNewtonMeters).toBeCloseTo(scanned, 1);
  });

  it("peaks where the shear force changes sign", () => {
    const b = beam(8, [{ forceNewtons: 800, positionMeters: 2 }]);
    expect(calculateShearAt(b, 1)).toBeCloseTo(600, 8);
    expect(calculateShearAt(b, 5)).toBeCloseTo(-200, 8);
  });

  it("rejects loads off the beam and invalid values", () => {
    expect(() => calculateReactions(beam(5, [{ forceNewtons: 1, positionMeters: 6 }]))).toThrow(RangeError);
    expect(() => calculateReactions(beam(0))).toThrow(RangeError);
    expect(() => calculateReactions(beam(5, [{ forceNewtons: -1, positionMeters: 1 }]))).toThrow(RangeError);
    expect(() => calculateBendingMomentAt(beam(5), 6)).toThrow(RangeError);
  });
});

describe("stress", () => {
  it("computes I = b h³/12 and σ = M c / I", () => {
    const inertia = calculateRectangularSecondMoment(0.2, 0.1);
    expect(inertia).toBeCloseTo(1.6667e-5, 9);
    // M = 10 kN·m, c = 0.05 m → σ = 10e3 · 0.05 / 1.6667e-5 = 30 MPa
    expect(calculateBendingStress(10_000, inertia, 0.05)).toBeCloseTo(30e6, -3);
  });

  it("falls with the square of beam height at fixed moment", () => {
    const stress = (h: number) =>
      calculateBendingStress(5000, calculateRectangularSecondMoment(0.2, h), h / 2);
    expect(stress(0.1) / stress(0.2)).toBeCloseTo(4, 8);
  });

  it("computes self weight per metre", () => {
    expect(calculateSelfWeightPerMeter(500, 0.2, 0.1, 10)).toBeCloseTo(100, 10);
    expect(() => calculateSelfWeightPerMeter(0, 0.2, 0.1)).toThrow(RangeError);
  });
});
