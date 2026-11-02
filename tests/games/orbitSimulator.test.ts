import { describe, expect, it } from "vitest";
import { ORBIT_ROUNDS, type OrbitRound } from "../../src/features/games/orbit-simulator/orbitSimulatorData";
import {
  evaluateOrbit,
  orbitPath,
  orbitSimulator,
  resolveLaunch,
} from "../../src/features/games/orbit-simulator/orbitSimulatorModel";
import { EARTH_GRAVITATIONAL_PARAMETER as MU, EARTH_MEAN_RADIUS as R } from "../../src/physics/core";

const [leo, ellipse, threeHour] = ORBIT_ROUNDS as [OrbitRound, OrbitRound, OrbitRound];
/** Mission 1 with a wider speed range, so escape speeds (10.77 km/s at 500 km) can be tested. */
const wide: OrbitRound = { ...leo, speedKmPerSecond: { minimum: 6, maximum: 12, step: 0.01 } };

describe("Orbit Simulator missions (worked by hand)", () => {
  it("mission 1: √(μ/r) at 500 km is 7.62 km/s and gives a 94.6 minute orbit", () => {
    const speed = Math.sqrt(MU / (R + 500e3)) / 1000;
    const outcome = evaluateOrbit(leo, { altitudeKm: 500, speedKmPerSecond: Number(speed.toFixed(2)) });

    expect(speed).toBeCloseTo(7.616, 2);
    expect(outcome.success).toBe(true);
    expect(outcome.elements.eccentricity).toBeLessThan(0.002);
    expect(outcome.periodMinutes).toBeCloseTo(94.6, 0);
  });

  it("mission 1: slightly faster or slower is an ellipse; much slower re-enters; much faster escapes", () => {
    const faster = evaluateOrbit(leo, { altitudeKm: 500, speedKmPerSecond: 8.2 });
    expect(faster.success).toBe(false);
    expect(faster.feedback).toMatch(/ellipse/);

    const slow = evaluateOrbit(leo, { altitudeKm: 500, speedKmPerSecond: 6.5 });
    expect(slow.reEntry).toBe(true);
    expect(slow.feedback).toMatch(/re-enters/);

    const escape = evaluateOrbit(wide, { altitudeKm: 500, speedKmPerSecond: 11 });
    expect(escape.elements.bound).toBe(false);
    expect(escape.feedback).toMatch(/escape/);
  });

  it("mission 2: vis-viva gives 8.59 km/s for a 5,000 km apoapsis", () => {
    const rp = R + 400e3;
    const ra = R + 5000e3;
    const speed = Math.sqrt(MU * (2 / rp - 2 / (rp + ra))) / 1000;
    const outcome = evaluateOrbit(ellipse, { altitudeKm: 400, speedKmPerSecond: Number(speed.toFixed(2)) });

    expect(speed).toBeCloseTo(8.59, 2);
    expect(outcome.success).toBe(true);
    expect(outcome.apoapsisAltitudeKm).toBeCloseTo(5000, -2);
  });

  it("mission 2: too slow or too fast misses the apoapsis target with directions", () => {
    expect(evaluateOrbit(ellipse, { altitudeKm: 400, speedKmPerSecond: 8.2 }).feedback).toMatch(/Launch faster/);
    expect(evaluateOrbit(ellipse, { altitudeKm: 400, speedKmPerSecond: 9.0 }).feedback).toMatch(/Launch slower/);
  });

  it("mission 3: Kepler's third law gives a = 10,562 km, altitude 4,191 km, speed 6.14 km/s", () => {
    const a = Math.cbrt((MU * 10_800 ** 2) / (4 * Math.PI ** 2));
    const outcome = evaluateOrbit(threeHour, {
      altitudeKm: Math.round((a - R) / 1000 / 10) * 10,
      speedKmPerSecond: Number((Math.sqrt(MU / a) / 1000).toFixed(2)),
    });

    expect(a / 1000).toBeCloseTo(10_562, -1);
    expect(outcome.success).toBe(true);
    expect(outcome.periodMinutes).toBeCloseTo(180, 0);
  });

  it("mission 3: the right altitude with the wrong speed, or the reverse, fails with advice", () => {
    expect(evaluateOrbit(threeHour, { altitudeKm: 4190, speedKmPerSecond: 7 }).feedback).toMatch(/too elliptical/);
    const low = evaluateOrbit(threeHour, { altitudeKm: 800, speedKmPerSecond: 7.45 });
    expect(low.success).toBe(false);
    expect(low.feedback).toMatch(/A higher orbit takes longer/);
  });

  it("predicts the period (in minutes) for any bound orbit", () => {
    const outcome = evaluateOrbit(leo, { altitudeKm: 500, speedKmPerSecond: 7.62 });
    expect(outcome.predictionActual).toBeCloseTo(94.6, 0);
    expect(evaluateOrbit(wide, { altitudeKm: 500, speedKmPerSecond: 11 }).predictionActual).toBeNull();
  });

  it("gives more accuracy credit to a rounder orbit", () => {
    const exact = evaluateOrbit(leo, { altitudeKm: 500, speedKmPerSecond: 7.62 });
    const rough = evaluateOrbit(leo, { altitudeKm: 500, speedKmPerSecond: 7.68 });
    expect(rough.success).toBe(true);
    expect(exact.accuracyFraction).toBeGreaterThan(rough.accuracyFraction);
  });
});

describe("Orbit path (numerical simulation)", () => {
  it("traces a closed circle for the circular launch", () => {
    const path = orbitPath(leo, { altitudeKm: 500, speedKmPerSecond: 7.616 });
    for (const point of path.points) {
      expect(Math.abs(point.position.magnitude / (R + 500e3) - 1)).toBeLessThan(2e-3);
    }
    expect(path.stoppedBy).toBe("duration");
  });

  it("stops at the surface for a re-entry and far away for an escape", () => {
    expect(orbitPath(leo, { altitudeKm: 500, speedKmPerSecond: 6.5 }).stoppedBy).toBe("collision");
    expect(orbitPath(wide, { altitudeKm: 500, speedKmPerSecond: 11.5 }).stoppedBy).toBe("escape-radius");
  });

  it("agrees with the analytic apoapsis", () => {
    const control = { altitudeKm: 400, speedKmPerSecond: 8.59 };
    const path = orbitPath(ellipse, control);
    const farthest = Math.max(...path.points.map((p) => p.position.magnitude));
    const analytic = evaluateOrbit(ellipse, control).elements.apoapsis as number;
    expect(farthest / analytic).toBeCloseTo(1, 2);
  });
});

describe("controls and saved state", () => {
  it("lock the altitude where the mission fixes it, and validate ranges", () => {
    expect(resolveLaunch(leo, { altitudeKm: 9999, speedKmPerSecond: 7 }).altitudeKm).toBe(500);
    expect(() => resolveLaunch(threeHour, { altitudeKm: 20000, speedKmPerSecond: 7 })).toThrow(/altitude/);
    expect(() => resolveLaunch(leo, { altitudeKm: 500, speedKmPerSecond: 20 })).toThrow(/speed/);
  });

  it("round-trip and reject corrupt saved controls", () => {
    expect(orbitSimulator.parseControl({ altitudeKm: 500, speedKmPerSecond: 7.6 }, leo)).toEqual({ altitudeKm: 500, speedKmPerSecond: 7.6 });
    expect(orbitSimulator.parseControl({ altitudeKm: 500, speedKmPerSecond: 99 }, leo)).toBeNull();
    expect(orbitSimulator.parseControl([], leo)).toBeNull();
  });

  it("rise in difficulty", () => {
    expect(ORBIT_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});
