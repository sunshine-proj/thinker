import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/physics/core";
import {
  ELECTRON,
  PROTON,
  advanceChargedParticleBoris,
  calculateCyclotronAngularFrequency,
  calculateCyclotronFrequency,
  calculateCyclotronPeriod,
  calculateKineticEnergy,
  calculateLorentzForce,
  calculateOrbitRadius,
  calculateParticleAcceleration,
  calculatePerpendicularSpeed,
} from "../../src/physics/electromagnetism";

describe("charged-particle electromagnetism", () => {
  const zeroField = Vector3.zero();

  it("uses the signed charge in the Lorentz-force direction", () => {
    const velocity = new Vector3(2, 0, 0);
    const magneticField = new Vector3(0, 3, 0);

    const electronForce = calculateLorentzForce(
      ELECTRON.chargeCoulombs,
      velocity,
      zeroField,
      magneticField,
    );
    const protonForce = calculateLorentzForce(
      PROTON.chargeCoulombs,
      velocity,
      zeroField,
      magneticField,
    );

    expect(electronForce.x).toBeCloseTo(0);
    expect(electronForce.y).toBeCloseTo(0);
    expect(electronForce.z).toBeLessThan(0);
    expect(protonForce.z).toBeGreaterThan(0);
    expect(electronForce.z).toBeCloseTo(-protonForce.z);
  });

  it("calculates electric force, acceleration, and classical kinetic energy", () => {
    const field = new Vector3(0, 0, -4);
    const force = calculateLorentzForce(
      ELECTRON.chargeCoulombs,
      Vector3.zero(),
      field,
      zeroField,
    );

    expect(force.z).toBeGreaterThan(0);
    expect(
      calculateParticleAcceleration(force, ELECTRON.massKilograms).z,
    ).toBeGreaterThan(0);
    expect(calculateKineticEnergy(2, new Vector3(3, 4, 0))).toBe(25);
    expect(() =>
      calculateParticleAcceleration(force, 0),
    ).toThrow(RangeError);
  });

  it("calculates perpendicular speed and analytical gyroradius", () => {
    const velocity = new Vector3(3, 4, 0);
    const magneticField = new Vector3(0, 5, 0);

    expect(calculatePerpendicularSpeed(velocity, magneticField)).toBe(3);
    expect(calculateOrbitRadius(2, 4, velocity, magneticField)).toBeCloseTo(
      0.3,
    );
    expect(calculateOrbitRadius(2, 4, new Vector3(0, 4, 0), magneticField)).toBe(
      0,
    );
    expect(calculateOrbitRadius(2, 4, velocity, zeroField)).toBeNull();
    expect(calculateOrbitRadius(2, 0, velocity, magneticField)).toBeNull();
  });

  it("calculates cyclotron frequencies and periods independently of charge sign", () => {
    const magneticField = new Vector3(0, 0.002, 0);
    const expectedAngularFrequency =
      (Math.abs(ELECTRON.chargeCoulombs) * magneticField.magnitude) /
      ELECTRON.massKilograms;
    const angularFrequency = calculateCyclotronAngularFrequency(
      ELECTRON.chargeCoulombs,
      ELECTRON.massKilograms,
      magneticField,
    );
    const frequency = calculateCyclotronFrequency(
      ELECTRON.chargeCoulombs,
      ELECTRON.massKilograms,
      magneticField,
    );
    const period = calculateCyclotronPeriod(
      ELECTRON.chargeCoulombs,
      ELECTRON.massKilograms,
      magneticField,
    );

    expect(angularFrequency).toBeCloseTo(expectedAngularFrequency, 10);
    expect(frequency).toBeCloseTo(expectedAngularFrequency / (2 * Math.PI), 10);
    expect(period).toBeCloseTo((2 * Math.PI) / expectedAngularFrequency, 10);
    expect(
      calculateCyclotronAngularFrequency(
        ELECTRON.chargeCoulombs,
        ELECTRON.massKilograms,
        zeroField,
      ),
    ).toBeNull();
    expect(
      calculateCyclotronPeriod(0, ELECTRON.massKilograms, magneticField),
    ).toBeNull();
  });

  it("moves in a straight line in zero fields", () => {
    const initial = {
      position: new Vector3(1, 2, 3),
      velocity: new Vector3(4, -2, 1),
    };
    const next = advanceChargedParticleBoris(initial, {
      chargeCoulombs: ELECTRON.chargeCoulombs,
      massKilograms: ELECTRON.massKilograms,
      electric: zeroField,
      magnetic: zeroField,
      timeStepSeconds: 0.5,
    });

    expect(next.velocity).toEqual(initial.velocity);
    expect(next.position).toEqual(new Vector3(3, 1, 3.5));
  });

  it("preserves magnetic-only speed over many integration steps", () => {
    let particle = {
      position: Vector3.zero(),
      velocity: new Vector3(2e6, 0, 0),
    };
    const initialSpeed = particle.velocity.magnitude;
    const parameters = {
      chargeCoulombs: ELECTRON.chargeCoulombs,
      massKilograms: ELECTRON.massKilograms,
      electric: zeroField,
      magnetic: new Vector3(0, 1e-5, 0),
      timeStepSeconds: 2e-8,
    };

    for (let step = 0; step < 20_000; step += 1) {
      particle = advanceChargedParticleBoris(particle, parameters);
    }

    expect(
      Math.abs(particle.velocity.magnitude - initialSpeed) / initialSpeed,
    ).toBeLessThan(1e-12);
    expect(particle.position.magnitude).toBeGreaterThan(0);
  });

  it("applies the charge sign to Boris rotation", () => {
    const initial = {
      position: Vector3.zero(),
      velocity: new Vector3(2e6, 0, 0),
    };
    const parameters = {
      massKilograms: ELECTRON.massKilograms,
      electric: zeroField,
      magnetic: new Vector3(0, 1e-5, 0),
      timeStepSeconds: 2e-8,
    };
    const electron = advanceChargedParticleBoris(initial, {
      ...parameters,
      chargeCoulombs: ELECTRON.chargeCoulombs,
    });
    const proton = advanceChargedParticleBoris(initial, {
      ...parameters,
      chargeCoulombs: PROTON.chargeCoulombs,
    });

    expect(electron.velocity.z).toBeLessThan(0);
    expect(proton.velocity.z).toBeGreaterThan(0);
  });

  it("rejects invalid integration inputs", () => {
    const particle = { position: Vector3.zero(), velocity: Vector3.zero() };
    const parameters = {
      chargeCoulombs: ELECTRON.chargeCoulombs,
      massKilograms: ELECTRON.massKilograms,
      electric: zeroField,
      magnetic: zeroField,
      timeStepSeconds: 0,
    };

    expect(() => advanceChargedParticleBoris(particle, parameters)).toThrow(
      RangeError,
    );
    expect(() =>
      calculateLorentzForce(Number.NaN, Vector3.zero(), zeroField, zeroField),
    ).toThrow(RangeError);
  });
});
