import { describe, expect, it } from "vitest";
import { EARTH_GRAVITATIONAL_PARAMETER as MU, EARTH_MEAN_RADIUS as R, Vector2 } from "../../src/physics/core";
import {
  calculateCircularOrbitSpeed,
  calculateEscapeSpeed,
  calculateOrbitalElements,
  calculateOrbitalPeriod,
  calculateVisViva,
  integrateOrbit,
} from "../../src/physics/astronomy";

const leo = R + 400e3;
const energy = (r: Vector2, v: Vector2) => v.magnitudeSquared / 2 - MU / r.magnitude;

describe("orbital formulas (textbook values)", () => {
  it("gives 7.67 km/s for a 400 km circular orbit", () => {
    expect(calculateCircularOrbitSpeed(MU, leo) / 1000).toBeCloseTo(7.669, 2);
  });

  it("gives an escape speed of √2 times the circular speed: 11.19 km/s at the surface", () => {
    expect(calculateEscapeSpeed(MU, R) / 1000).toBeCloseTo(11.186, 2);
    expect(calculateEscapeSpeed(MU, leo) / calculateCircularOrbitSpeed(MU, leo)).toBeCloseTo(Math.SQRT2, 12);
  });

  it("gives a 92.4 minute period at 400 km and a one-day period at geostationary radius", () => {
    expect(calculateOrbitalPeriod(MU, leo) / 60).toBeCloseTo(92.4, 0);
    // Geostationary radius 42,164 km → sidereal day 86,164 s.
    expect(calculateOrbitalPeriod(MU, 42_164e3)).toBeCloseTo(86_164, -2);
  });

  it("obeys Kepler's third law: T² ∝ a³", () => {
    const ratio = (a: number) => calculateOrbitalPeriod(MU, a) ** 2 / a ** 3;
    expect(ratio(7e6)).toBeCloseTo(ratio(3e7), 12);
  });

  it("matches vis-viva: speed at periapsis of an ellipse", () => {
    const rp = 7e6;
    const ra = 21e6;
    const a = (rp + ra) / 2;
    const vp = calculateVisViva(MU, rp, a);
    const elements = calculateOrbitalElements(MU, new Vector2(rp, 0), new Vector2(0, vp));

    expect(elements.eccentricity).toBeCloseTo((ra - rp) / (ra + rp), 10);
    expect(elements.apoapsis).toBeCloseTo(ra, 0);
    expect(elements.periapsis).toBeCloseTo(rp, 0);
    expect(elements.semiMajorAxis).toBeCloseTo(a, 0);
  });

  it("rejects non-physical inputs", () => {
    expect(() => calculateCircularOrbitSpeed(MU, 0)).toThrow(RangeError);
    expect(() => calculateOrbitalPeriod(0, 1e7)).toThrow(RangeError);
    expect(() => calculateVisViva(MU, 5e7, 1e7)).toThrow(/outside the orbit/);
  });
});

describe("orbital elements", () => {
  it("are circular (e ≈ 0) at the circular speed", () => {
    const e = calculateOrbitalElements(MU, new Vector2(leo, 0), new Vector2(0, calculateCircularOrbitSpeed(MU, leo)));
    expect(e.eccentricity).toBeCloseTo(0, 10);
    expect(e.bound).toBe(true);
    expect(e.periapsis).toBeCloseTo(leo, 0);
    expect(e.apoapsis).toBeCloseTo(leo, 0);
  });

  it("give e = r v² / μ − 1 for a tangential launch from periapsis", () => {
    const v = 9000;
    const e = calculateOrbitalElements(MU, new Vector2(leo, 0), new Vector2(0, v));
    expect(e.eccentricity).toBeCloseTo((leo * v * v) / MU - 1, 10);
  });

  it("find a launch below circular speed to be at apoapsis, with a lower periapsis", () => {
    const e = calculateOrbitalElements(MU, new Vector2(leo, 0), new Vector2(0, 7000));
    expect(e.apoapsis).toBeCloseTo(leo, 0);
    expect(e.periapsis).toBeLessThan(leo);
  });

  it("are unbound at and above escape speed", () => {
    const vEsc = calculateEscapeSpeed(MU, leo);
    const parabolic = calculateOrbitalElements(MU, new Vector2(leo, 0), new Vector2(0, vEsc));
    const hyperbolic = calculateOrbitalElements(MU, new Vector2(leo, 0), new Vector2(0, vEsc * 1.1));

    expect(parabolic.bound).toBe(false);
    expect(parabolic.eccentricity).toBeCloseTo(1, 8);
    expect(hyperbolic.eccentricity).toBeGreaterThan(1);
    expect(hyperbolic.period).toBeNull();
    expect(hyperbolic.apoapsis).toBeNull();
    expect(hyperbolic.semiMajorAxis).toBeNull();
  });
});

describe("numerical integration (velocity Verlet)", () => {
  const circularSpeed = calculateCircularOrbitSpeed(MU, leo);
  const start = { position: new Vector2(leo, 0), velocity: new Vector2(0, circularSpeed) };
  const period = calculateOrbitalPeriod(MU, leo);

  it("keeps a circular orbit at constant radius", () => {
    const run = integrateOrbit(MU, start, 3 * period);
    for (const point of run.points) {
      expect(Math.abs(point.position.magnitude / leo - 1)).toBeLessThan(1e-4);
    }
    expect(run.stoppedBy).toBe("duration");
  });

  it("returns to the starting point after one analytic period", () => {
    const run = integrateOrbit(MU, start, period);
    expect(run.final.position.distanceTo(start.position)).toBeLessThan(2_000); // metres, on a 6.8e6 m radius
  });

  it("conserves energy and angular momentum on an eccentric orbit over several periods", () => {
    const eccentric = { position: new Vector2(leo, 0), velocity: new Vector2(0, 9000) };
    const elements = calculateOrbitalElements(MU, eccentric.position, eccentric.velocity);
    const run = integrateOrbit(MU, eccentric, 4 * (elements.period as number));
    const e0 = energy(eccentric.position, eccentric.velocity);
    const h0 = eccentric.position.cross(eccentric.velocity);

    expect(Math.abs(energy(run.final.position, run.final.velocity) / e0 - 1)).toBeLessThan(1e-4);
    expect(Math.abs(run.final.position.cross(run.final.velocity) / h0 - 1)).toBeLessThan(1e-9);
  });

  it("reproduces the analytic period of an eccentric orbit (returns near periapsis)", () => {
    const eccentric = { position: new Vector2(leo, 0), velocity: new Vector2(0, 9000) };
    const elements = calculateOrbitalElements(MU, eccentric.position, eccentric.velocity);
    const run = integrateOrbit(MU, eccentric, elements.period as number);
    expect(run.final.position.distanceTo(eccentric.position) / (elements.apoapsis as number)).toBeLessThan(2e-3);
  });

  it("reaches the analytic apoapsis half a period after periapsis", () => {
    const eccentric = { position: new Vector2(leo, 0), velocity: new Vector2(0, 9000) };
    const elements = calculateOrbitalElements(MU, eccentric.position, eccentric.velocity);
    const run = integrateOrbit(MU, eccentric, (elements.period as number) / 2);
    expect(run.final.position.magnitude / (elements.apoapsis as number)).toBeCloseTo(1, 3);
  });

  it("becomes more accurate with a smaller step", () => {
    const eccentric = { position: new Vector2(leo, 0), velocity: new Vector2(0, 9000) };
    const elements = calculateOrbitalElements(MU, eccentric.position, eccentric.velocity);
    const error = (stepFraction: number) =>
      integrateOrbit(MU, eccentric, elements.period as number, { stepFraction }).final.position.distanceTo(eccentric.position);
    expect(error(0.002)).toBeLessThan(error(0.02));
  });

  it("stops on collision with the planet and when escaping far away", () => {
    const plunging = integrateOrbit(MU, { position: new Vector2(leo, 0), velocity: new Vector2(0, 5000) }, 3 * period, { collisionRadius: R });
    expect(plunging.stoppedBy).toBe("collision");
    expect(plunging.final.position.magnitude).toBeLessThanOrEqual(R);

    const escaping = integrateOrbit(MU, { position: new Vector2(leo, 0), velocity: new Vector2(0, calculateEscapeSpeed(MU, leo) * 1.05) }, 40 * period, { escapeRadius: 1e8 });
    expect(escaping.stoppedBy).toBe("escape-radius");
  });

  it("guards against runaway loops and invalid input", () => {
    expect(integrateOrbit(MU, start, 10 * period, { maximumSteps: 50 }).stoppedBy).toBe("step-limit");
    expect(() => integrateOrbit(MU, { position: Vector2.zero(), velocity: new Vector2(1, 0) }, 10)).toThrow(RangeError);
    expect(() => integrateOrbit(MU, start, 0)).toThrow(RangeError);
  });
});
