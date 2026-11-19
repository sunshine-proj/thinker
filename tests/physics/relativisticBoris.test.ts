import { describe, expect, it } from "vitest";
import { ELECTRON_CHARGE, ELECTRON_MASS, SPEED_OF_LIGHT, Vector3 } from "../../src/physics/core";
import {
  advanceChargedParticleBoris,
  advanceChargedParticleRelativisticBoris,
  calculateParticleLorentzFactor,
  calculateRelativisticCyclotronFrequency,
  calculateRelativisticOrbitRadius,
  calculateRelativisticParticleKineticEnergy,
} from "../../src/physics/electromagnetism";

const electron = { chargeCoulombs: ELECTRON_CHARGE, massKilograms: ELECTRON_MASS };
const zero = Vector3.zero();

describe("relativistic Boris integrator", () => {
  it("keeps the speed (and γ) constant in a pure magnetic field at 0.9c", () => {
    const B = new Vector3(0, 5e-3, 0);
    let particle = { position: zero, velocity: new Vector3(0.9 * SPEED_OF_LIGHT, 0, 0) };
    for (let i = 0; i < 20_000; i += 1) {
      particle = advanceChargedParticleRelativisticBoris(particle, { ...electron, electric: zero, magnetic: B, timeStepSeconds: 1e-12 });
    }
    expect(particle.velocity.magnitude / (0.9 * SPEED_OF_LIGHT)).toBeCloseTo(1, 12);
  });

  it("circles with the relativistic radius γmv/(|q|B), not the classical one", () => {
    const beta = 0.9;
    const B = new Vector3(0, 5e-3, 0);
    const velocity = new Vector3(beta * SPEED_OF_LIGHT, 0, 0);
    const expected = calculateRelativisticOrbitRadius(ELECTRON_MASS, ELECTRON_CHARGE, velocity, B)!;
    expect(expected).toBeCloseTo(2.294 * (ELECTRON_MASS * beta * SPEED_OF_LIGHT) / (1.602176634e-19 * 5e-3), 2);
    // Integrate half a turn; the farthest x–z distance from the start is the diameter.
    let particle = { position: zero, velocity };
    let diameter = 0;
    const period = 1 / calculateRelativisticCyclotronFrequency(ELECTRON_CHARGE, ELECTRON_MASS, B, velocity)!;
    const dt = period / 20_000;
    for (let i = 0; i < 10_000; i += 1) {
      particle = advanceChargedParticleRelativisticBoris(particle, { ...electron, electric: zero, magnetic: B, timeStepSeconds: dt });
      diameter = Math.max(diameter, particle.position.magnitude);
    }
    expect(diameter / (2 * expected)).toBeCloseTo(1, 4);
  });

  it("matches the classical Boris step at low speed", () => {
    const step = { ...electron, electric: new Vector3(0, 0, 3), magnetic: new Vector3(0, 1e-5, 0), timeStepSeconds: 2e-8 };
    const start = { position: zero, velocity: new Vector3(1e5, 0, 0) };
    const classical = advanceChargedParticleBoris(start, step);
    const relativistic = advanceChargedParticleRelativisticBoris(start, step);
    expect(relativistic.velocity.subtract(classical.velocity).magnitude / classical.velocity.magnitude).toBeLessThan(1e-6);
  });

  it("never exceeds c under a strong electric field, and gains energy qEd", () => {
    const E = new Vector3(1e7, 0, 0);
    let particle = { position: zero, velocity: zero };
    for (let i = 0; i < 2000; i += 1) {
      particle = advanceChargedParticleRelativisticBoris(particle, { chargeCoulombs: 1.602176634e-19, massKilograms: ELECTRON_MASS, electric: E, magnetic: zero, timeStepSeconds: 1e-11 });
      expect(particle.velocity.magnitude).toBeLessThan(SPEED_OF_LIGHT);
    }
    const work = 1.602176634e-19 * 1e7 * particle.position.x;
    const energy = calculateRelativisticParticleKineticEnergy(ELECTRON_MASS, particle.velocity);
    expect(energy / work).toBeCloseTo(1, 3);
    expect(calculateParticleLorentzFactor(particle.velocity)).toBeGreaterThan(10);
  });

  it("rejects a starting speed at or above c", () => {
    expect(() =>
      advanceChargedParticleRelativisticBoris(
        { position: zero, velocity: new Vector3(SPEED_OF_LIGHT, 0, 0) },
        { ...electron, electric: zero, magnetic: zero, timeStepSeconds: 1e-9 },
      ),
    ).toThrow(RangeError);
  });
});
