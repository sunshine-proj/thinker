import { describe, expect, it } from "vitest";
import {
  BOLTZMANN_CONSTANT,
  ELECTRON_CHARGE,
  ELECTRON_MASS,
  ELEMENTARY_CHARGE,
  GRAVITATIONAL_CONSTANT,
  PLANCK_CONSTANT,
  PROTON_MASS,
  SPEED_OF_LIGHT,
  STANDARD_GRAVITY,
  Vector2,
  Vector3,
  celsiusToKelvin,
  centimetersToMeters,
  clamp,
  degreesToRadians,
  gramsToKilograms,
  hoursToSeconds,
  kelvinToCelsius,
  kilometersPerHourToMetersPerSecond,
  kilometersToMeters,
  kilogramsToGrams,
  lerp,
  metersPerSecondToKilometersPerHour,
  metersToKilometers,
  millimetersToMeters,
  minutesToSeconds,
  nearlyEqual,
  radiansToDegrees,
} from "../../src/physics/core";

describe("Vector2", () => {
  it("calculates vector products, magnitudes, and distances", () => {
    const first = new Vector2(3, 4);
    const second = new Vector2(2, -1);

    expect(first.magnitude).toBe(5);
    expect(first.magnitudeSquared).toBe(25);
    expect(first.dot(second)).toBe(2);
    expect(first.cross(second)).toBe(-11);
    expect(first.distanceTo(second)).toBeCloseTo(Math.sqrt(26));
  });

  it("supports immutable arithmetic, interpolation, and normalization", () => {
    const first = new Vector2(3, 4);
    const second = new Vector2(7, 0);

    expect(first.add(second)).toEqual(new Vector2(10, 4));
    expect(first.subtract(second)).toEqual(new Vector2(-4, 4));
    expect(first.scale(2)).toEqual(new Vector2(6, 8));
    expect(first.normalize().magnitude).toBeCloseTo(1);
    expect(first.limit(2).magnitude).toBeCloseTo(2);
    expect(first.lerp(second, 0.5)).toEqual(new Vector2(5, 2));
    expect(Vector2.fromAngle(Math.PI / 2).x).toBeCloseTo(0);
    expect(new Vector2(1, 1).equals(new Vector2(1.01, 1), 0.02)).toBe(true);
    expect(first).toEqual(new Vector2(3, 4));
  });

  it("rejects non-finite components and normalization of the zero vector", () => {
    expect(() => new Vector2(Number.NaN, 0)).toThrow(RangeError);
    expect(() => new Vector2(0, 0).normalize()).toThrow(RangeError);
    expect(() => new Vector2(1, 1).limit(-1)).toThrow(RangeError);
  });
});

describe("Vector3", () => {
  it("calculates the right-handed cross product", () => {
    const xAxis = new Vector3(1, 0, 0);
    const yAxis = new Vector3(0, 1, 0);

    expect(xAxis.cross(yAxis)).toEqual(new Vector3(0, 0, 1));
    expect(yAxis.cross(xAxis)).toEqual(new Vector3(0, 0, -1));
  });

  it("supports arithmetic, distance, interpolation, and magnitude limits", () => {
    const first = new Vector3(1, 2, 2);

    expect(first.magnitude).toBe(3);
    expect(first.add(new Vector3(1, 1, 1))).toEqual(new Vector3(2, 3, 3));
    expect(first.subtract(new Vector3(1, 1, 1))).toEqual(
      new Vector3(0, 1, 1),
    );
    expect(first.scale(2)).toEqual(new Vector3(2, 4, 4));
    expect(first.dot(new Vector3(2, 0, 1))).toBe(4);
    expect(first.distanceTo(Vector3.zero())).toBe(3);
    expect(first.normalize().magnitude).toBeCloseTo(1);
    expect(first.limit(1).magnitude).toBeCloseTo(1);
    expect(first.lerp(new Vector3(3, 4, 4), 0.5)).toEqual(
      new Vector3(2, 3, 3),
    );
    expect(first.equals(new Vector3(1, 2, 2))).toBe(true);
  });

  it("rejects invalid components and zero-vector normalization", () => {
    expect(() => new Vector3(0, Infinity, 0)).toThrow(RangeError);
    expect(() => Vector3.zero().normalize()).toThrow(RangeError);
  });
});

describe("numeric helpers", () => {
  it("clamps values and interpolates without restricting the interpolation amount", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(lerp(2, 6, 0.5)).toBe(4);
    expect(lerp(2, 6, 2)).toBe(10);
    expect(nearlyEqual(1, 1 + Number.EPSILON)).toBe(true);
  });

  it("rejects invalid numeric ranges", () => {
    expect(() => clamp(1, 2, 0)).toThrow(RangeError);
    expect(() => lerp(0, 1, Infinity)).toThrow(RangeError);
    expect(() => nearlyEqual(1, 1, -1)).toThrow(RangeError);
  });
});

describe("SI conversions", () => {
  it("converts length, time, mass, and speed", () => {
    expect(kilometersToMeters(1.5)).toBe(1_500);
    expect(metersToKilometers(1_500)).toBe(1.5);
    expect(centimetersToMeters(125)).toBe(1.25);
    expect(millimetersToMeters(12)).toBe(0.012);
    expect(minutesToSeconds(2)).toBe(120);
    expect(hoursToSeconds(0.5)).toBe(1_800);
    expect(gramsToKilograms(250)).toBe(0.25);
    expect(kilogramsToGrams(0.25)).toBe(250);
    expect(kilometersPerHourToMetersPerSecond(36)).toBe(10);
    expect(metersPerSecondToKilometersPerHour(10)).toBe(36);
  });

  it("converts angles and absolute temperatures", () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15);
    expect(celsiusToKelvin(-273.15)).toBe(0);
    expect(kelvinToCelsius(273.15)).toBeCloseTo(0);
    expect(() => celsiusToKelvin(-273.151)).toThrow(RangeError);
    expect(() => kelvinToCelsius(-1)).toThrow(RangeError);
  });

  it("rejects non-finite conversion inputs", () => {
    expect(() => kilometersToMeters(Number.NaN)).toThrow(RangeError);
    expect(() => degreesToRadians(Infinity)).toThrow(RangeError);
  });
});

describe("physical constants", () => {
  it("exports recognized SI values and signed electron charge", () => {
    expect(SPEED_OF_LIGHT).toBe(299_792_458);
    expect(STANDARD_GRAVITY).toBe(9.80665);
    expect(GRAVITATIONAL_CONSTANT).toBe(6.6743e-11);
    expect(ELEMENTARY_CHARGE).toBe(1.602176634e-19);
    expect(ELECTRON_CHARGE).toBe(-ELEMENTARY_CHARGE);
    expect(ELECTRON_MASS).toBe(9.1093837139e-31);
    expect(PROTON_MASS).toBe(1.67262192595e-27);
    expect(BOLTZMANN_CONSTANT).toBe(1.380649e-23);
    expect(PLANCK_CONSTANT).toBe(6.62607015e-34);
  });
});
