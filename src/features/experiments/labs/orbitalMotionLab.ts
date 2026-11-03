import { Vector2, EARTH_GRAVITATIONAL_PARAMETER, EARTH_MEAN_RADIUS, MOON_GRAVITATIONAL_PARAMETER, MOON_MEAN_RADIUS } from "../../../physics/core";
import { calculateCircularOrbitSpeed, calculateEscapeSpeed, calculateOrbitalElements, calculateOrbitalPeriod, integrateOrbit } from "../../../physics/astronomy";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition, LabValues } from "./labTypes";

export const ORBIT_LAB_ID = "orbital-motion-lab";

interface OrbitBody { readonly id: string; readonly name: string; readonly mu: number; readonly radius: number }
export const ORBIT_BODIES: readonly OrbitBody[] = Object.freeze([
  { id: "earth", name: "Earth", mu: EARTH_GRAVITATIONAL_PARAMETER, radius: EARTH_MEAN_RADIUS },
  { id: "moon", name: "Moon", mu: MOON_GRAVITATIONAL_PARAMETER, radius: MOON_MEAN_RADIUS },
  { id: "mars", name: "Mars", mu: 4.282837e13, radius: 3.3895e6 },
]);
const bodyOf = (v: LabValues) => ORBIT_BODIES.find((b) => b.id === v.body) ?? ORBIT_BODIES[0]!;

export const orbitalMotionLab: LabDefinition = {
  id: ORBIT_LAB_ID,
  name: "Orbital Motion",
  eyebrow: "EXPERIMENT LAB · ASTRONOMY",
  introduction: "Launch a satellite sideways from any height above Earth, the Moon or Mars. Change its speed relative to the circular-orbit speed and watch whether it traces a circle, an ellipse, falls into the surface or escapes.",
  assumptions: "Two-body motion around a point mass (no oblateness, atmosphere, drag, thrust or third bodies), launched horizontally at the start. The path is computed with the project's validated velocity-Verlet orbit integrator with an adaptive step; the energy drift is reported below. Radius and gravitational parameters are rounded literature values.",
  controls: [
    { kind: "choice", key: "body", label: "Central body", options: ORBIT_BODIES.map((b) => ({ value: b.id, label: b.name })), initial: "earth" },
    { kind: "number", key: "altitude", label: "Starting altitude", unit: "km", minimum: 100, maximum: 40000, step: 50, initial: 400 },
    { kind: "number", key: "ratio", label: "Launch speed ÷ circular speed", unit: "", minimum: 0.5, maximum: 1.5, step: 0.01, initial: 1.1 },
    { kind: "number", key: "periods", label: "Time to simulate", unit: "circular periods", minimum: 0.5, maximum: 3, step: 0.1, initial: 1.5 },
  ],
  describe: (v) => `${bodyOf(v).name} · ${v.altitude} km · ${(v.ratio as number).toFixed(2)} × circular speed`,
  run(v) {
    const body = bodyOf(v);
    const r0 = body.radius + (v.altitude as number) * 1000;
    const circular = calculateCircularOrbitSpeed(body.mu, r0);
    const escape = calculateEscapeSpeed(body.mu, r0);
    const speed = circular * (v.ratio as number);
    const position = new Vector2(r0, 0);
    const velocity = new Vector2(0, speed);
    const elements = calculateOrbitalElements(body.mu, position, velocity);
    const circularPeriod = calculateOrbitalPeriod(body.mu, r0);
    const result = integrateOrbit(body.mu, { position, velocity }, circularPeriod * (v.periods as number), {
      collisionRadius: body.radius, escapeRadius: 25 * r0, recordEvery: 2,
    });
    const finalEnergy = result.final.velocity.magnitudeSquared / 2 - body.mu / result.final.position.magnitude;
    const drift = Math.abs(finalEnergy - elements.specificEnergy) / Math.abs(elements.specificEnergy);
    const stride = Math.max(1, Math.floor(result.points.length / 500));
    const path = result.points.filter((_, i) => i % stride === 0).map((p) => ({ x: p.position.x / 1000, y: p.position.y / 1000 }));
    const extent = Math.max(body.radius / 1000, ...path.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) * 1.1;
    const disc = Array.from({ length: 73 }, (_, i) => ({ x: (body.radius / 1000) * Math.cos((i * Math.PI) / 36), y: (body.radius / 1000) * Math.sin((i * Math.PI) / 36) }));
    const outcome = result.stoppedBy === "collision" ? "crashes into the surface" : result.stoppedBy === "escape-radius" || !elements.bound ? "escapes" : elements.eccentricity < 0.01 ? "follows a circular orbit" : "follows an elliptical orbit";
    const periapsisAltitude = (elements.periapsis - body.radius) / 1000;
    return {
      measurements: [
        createMeasurement("circular", "Circular-orbit speed here", circular, "m/s"),
        createMeasurement("escape", "Escape speed here", escape, "m/s"),
        createMeasurement("speed", "Your launch speed", speed, "m/s"),
        createMeasurement("eccentricity", "Eccentricity", elements.eccentricity, ""),
        createMeasurement("periapsis", "Lowest altitude", periapsisAltitude, "km"),
        createMeasurement("apoapsis", "Highest altitude", elements.apoapsis === null ? null : (elements.apoapsis - body.radius) / 1000, "km"),
        createMeasurement("period", "Orbital period", elements.period, "s"),
        createMeasurement("drift", "Energy drift in the simulation", drift * 100, "%"),
      ],
      charts: [{
        title: "The orbit",
        description: `Path of the satellite around ${body.name}, drawn to scale with the body as a circle. The satellite ${outcome}. Eccentricity ${elements.eccentricity.toFixed(2)}.`,
        xLabel: "x (km)", yLabel: "y (km)",
        series: [{ label: body.name, points: disc }, { label: "Satellite", points: path }],
        xDomain: [-extent, extent], yDomain: [-extent, extent],
      }],
      explanations: [
        { title: `The satellite ${outcome}`, text: result.stoppedBy === "collision" ? `Its lowest point would be ${periapsisAltitude.toFixed(0)} km, below the surface, so it hits ${body.name} after ${(result.final.position.magnitude && (path.length > 1)) ? "less than one orbit" : "launch"}.` : elements.bound ? `At ${(v.ratio as number).toFixed(2)} × the circular speed the orbit is an ellipse with eccentricity ${elements.eccentricity.toFixed(3)}, from ${periapsisAltitude.toFixed(0)} km up to ${((elements.apoapsis! - body.radius) / 1000).toFixed(0)} km, and a period of ${(elements.period! / 60).toFixed(1)} minutes.` : `Above the escape speed (${(escape / 1000).toFixed(2)} km/s, which is √2 times the circular speed) the orbit is open: the satellite never returns.` },
        { title: "Speed decides the shape", text: "Exactly the circular speed gives a circle; faster, and the launch point becomes the lowest point of an ellipse that reaches higher on the far side; slower, and it becomes the highest point and the satellite swings closer to the body, possibly into it." },
        { title: "Kepler's laws", text: `The period of a bound orbit depends only on the semi-major axis: T = 2π√(a³/μ). A satellite that is faster than circular at ${(v.altitude as number)} km has a bigger a, so it takes longer than the circular period of ${(circularPeriod / 60).toFixed(1)} minutes. It also moves fastest at its lowest point and slowest at the highest (equal areas in equal times).` },
        { title: "Checking the numerics", text: `Total energy should stay constant. The numerical integration changes it by ${(drift * 100).toExponential(1)} %, which is the accuracy of the simulation.` },
      ],
    };
  },
};
