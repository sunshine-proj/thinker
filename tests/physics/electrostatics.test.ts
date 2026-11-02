import { describe, expect, it } from "vitest";
import { COULOMB_CONSTANT, VACUUM_PERMITTIVITY, Vector2 } from "../../src/physics/core";
import {
  calculateCoulombForceMagnitude,
  calculateDistanceFromForce,
  calculateElectricField,
  calculateElectricFieldFromCharge,
  calculateForceOnCharge,
} from "../../src/physics/electromagnetism";

const nC = 1e-9;

describe("constants", () => {
  it("derives the Coulomb constant from the permittivity", () => {
    expect(COULOMB_CONSTANT).toBeCloseTo(8.9875517923e9, -1);
    expect(COULOMB_CONSTANT * 4 * Math.PI * VACUUM_PERMITTIVITY).toBeCloseTo(1, 12);
  });
});

describe("Coulomb's law", () => {
  it("gives F = k q₁ q₂ / r² (textbook value: 1 µC and 1 µC at 1 m → 8.99 mN)", () => {
    expect(calculateCoulombForceMagnitude(1e-6, 1e-6, 1)).toBeCloseTo(8.9875517923e-3, 9);
  });

  it("follows the inverse-square law", () => {
    const near = calculateCoulombForceMagnitude(2 * nC, 3 * nC, 0.1);
    const far = calculateCoulombForceMagnitude(2 * nC, 3 * nC, 0.2);
    expect(near / far).toBeCloseTo(4, 10);
  });

  it("is symmetric in the charges and independent of their signs", () => {
    expect(calculateCoulombForceMagnitude(2 * nC, -3 * nC, 0.1)).toBeCloseTo(
      calculateCoulombForceMagnitude(-3 * nC, 2 * nC, 0.1),
      15,
    );
  });

  it("rejects zero separation and non-finite charges", () => {
    expect(() => calculateCoulombForceMagnitude(nC, nC, 0)).toThrow(RangeError);
    expect(() => calculateCoulombForceMagnitude(Number.NaN, nC, 1)).toThrow(RangeError);
  });
});

describe("electric field", () => {
  const origin = new Vector2(0, 0);

  it("points away from a positive charge and toward a negative one", () => {
    const point = new Vector2(0.3, 0);
    const positive = calculateElectricFieldFromCharge({ chargeCoulombs: 5 * nC, position: origin }, point);
    const negative = calculateElectricFieldFromCharge({ chargeCoulombs: -5 * nC, position: origin }, point);

    expect(positive.x).toBeGreaterThan(0);
    expect(negative.x).toBeLessThan(0);
    expect(positive.y).toBeCloseTo(0, 12);
  });

  it("has magnitude k q / r²", () => {
    const field = calculateElectricFieldFromCharge(
      { chargeCoulombs: 5 * nC, position: origin },
      new Vector2(0.3, 0.4), // r = 0.5 m
    );
    expect(field.magnitude).toBeCloseTo((COULOMB_CONSTANT * 5 * nC) / 0.25, 6);
  });

  it("is zero at the midpoint between equal like charges", () => {
    const field = calculateElectricField(
      [
        { chargeCoulombs: 2 * nC, position: new Vector2(-1, 0) },
        { chargeCoulombs: 2 * nC, position: new Vector2(1, 0) },
      ],
      origin,
    );
    expect(field.magnitude).toBeCloseTo(0, 9);
  });

  it("adds at the midpoint of a dipole", () => {
    const field = calculateElectricField(
      [
        { chargeCoulombs: 2 * nC, position: new Vector2(-1, 0) },
        { chargeCoulombs: -2 * nC, position: new Vector2(1, 0) },
      ],
      origin,
    );
    expect(field.x).toBeCloseTo(2 * COULOMB_CONSTANT * 2 * nC, 6);
  });

  it("matches the Coulomb force on a test charge: F = q E", () => {
    const point = new Vector2(0.3, 0);
    const field = calculateElectricFieldFromCharge({ chargeCoulombs: 5 * nC, position: origin }, point);
    const force = calculateForceOnCharge(nC, field);

    expect(force.magnitude).toBeCloseTo(calculateCoulombForceMagnitude(5 * nC, nC, 0.3), 12);
  });

  it("reverses with the sign of the test charge", () => {
    const field = new Vector2(10, 0);
    expect(calculateForceOnCharge(-nC, field).x).toBeLessThan(0);
  });

  it("is undefined at the source", () => {
    expect(() =>
      calculateElectricFieldFromCharge({ chargeCoulombs: nC, position: origin }, origin),
    ).toThrow(RangeError);
  });
});

describe("recovering distance from a measured force", () => {
  it("inverts Coulomb's law", () => {
    const force = calculateCoulombForceMagnitude(4 * nC, nC, 0.37);
    expect(calculateDistanceFromForce(4 * nC, nC, force)).toBeCloseTo(0.37, 10);
  });

  it("rejects zero charges and non-positive forces", () => {
    expect(() => calculateDistanceFromForce(0, nC, 1)).toThrow(RangeError);
    expect(() => calculateDistanceFromForce(nC, nC, 0)).toThrow(RangeError);
  });
});
