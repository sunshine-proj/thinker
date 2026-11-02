import { Vector2, assertFiniteNumber, assertPositive } from "../core";

/**
 * Two-body orbital mechanics around a fixed central mass.
 *
 * The satellite's acceleration is a = −μ r / |r|³ with μ = GM. Quantities:
 * specific orbital energy ε = v²/2 − μ/r (conserved), specific angular momentum
 * h = r × v (conserved), semi-major axis a = −μ/(2ε) for bound orbits, and
 * period T = 2π √(a³/μ) (Kepler's third law). Units: meters, seconds, m³/s².
 *
 * Numerical integration uses velocity Verlet (a second-order, time-reversible
 * scheme) with a step proportional to √(r³/μ), so the step shrinks near
 * periapsis where the satellite moves fastest.
 *
 * Limitations: a point-mass central body (no oblateness), no atmosphere or
 * drag, no third bodies, no thrust after the initial state, and non-relativistic.
 */
export interface OrbitState {
  readonly position: Vector2;
  readonly velocity: Vector2;
}

export interface OrbitalElements {
  /** Specific orbital energy, J/kg. */
  readonly specificEnergy: number;
  /** Specific angular momentum magnitude, m²/s. */
  readonly angularMomentum: number;
  readonly eccentricity: number;
  /** Null for parabolic or hyperbolic (unbound) orbits. */
  readonly semiMajorAxis: number | null;
  /** Distance of closest approach to the center, m. */
  readonly periapsis: number;
  /** Greatest distance, m; null if unbound. */
  readonly apoapsis: number | null;
  /** Orbital period, s; null if unbound. */
  readonly period: number | null;
  readonly bound: boolean;
}

/** Speed for a circular orbit at radius r: v = √(μ/r). */
export function calculateCircularOrbitSpeed(mu: number, radius: number): number {
  assertPositive(mu, "mu");
  assertPositive(radius, "radius");
  return Math.sqrt(mu / radius);
}

/** Escape speed at radius r: v = √(2μ/r). */
export function calculateEscapeSpeed(mu: number, radius: number): number {
  return Math.SQRT2 * calculateCircularOrbitSpeed(mu, radius);
}

/** Kepler's third law: T = 2π √(a³/μ). */
export function calculateOrbitalPeriod(mu: number, semiMajorAxis: number): number {
  assertPositive(mu, "mu");
  assertPositive(semiMajorAxis, "semiMajorAxis");
  return 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / mu);
}

/** Orbital speed at radius r on an orbit of semi-major axis a (vis-viva): v² = μ(2/r − 1/a). */
export function calculateVisViva(mu: number, radius: number, semiMajorAxis: number): number {
  assertPositive(mu, "mu");
  assertPositive(radius, "radius");
  assertPositive(semiMajorAxis, "semiMajorAxis");
  const squared = mu * (2 / radius - 1 / semiMajorAxis);
  if (squared < 0) {
    throw new RangeError("That radius lies outside the orbit.");
  }
  return Math.sqrt(squared);
}

/** Orbital elements from a position and velocity relative to the central mass. */
export function calculateOrbitalElements(
  mu: number,
  position: Vector2,
  velocity: Vector2,
): OrbitalElements {
  assertPositive(mu, "mu");
  const radius = position.magnitude;
  assertPositive(radius, "radius");
  assertFiniteNumber(velocity.magnitude, "speed");

  const specificEnergy = velocity.magnitudeSquared / 2 - mu / radius;
  const angularMomentum = Math.abs(position.cross(velocity));
  // Eccentricity vector e = ((v² − μ/r) r − (r·v) v) / μ
  const eccentricityVector = position
    .scale(velocity.magnitudeSquared - mu / radius)
    .subtract(velocity.scale(position.dot(velocity)))
    .scale(1 / mu);
  const eccentricity = eccentricityVector.magnitude;
  const bound = specificEnergy < 0;
  const semiLatusRectum = angularMomentum ** 2 / mu;
  const periapsis = semiLatusRectum / (1 + eccentricity);
  const semiMajorAxis = bound ? -mu / (2 * specificEnergy) : null;

  return {
    specificEnergy,
    angularMomentum,
    eccentricity,
    semiMajorAxis,
    periapsis,
    apoapsis: bound ? semiLatusRectum / (1 - eccentricity) : null,
    period: semiMajorAxis === null ? null : calculateOrbitalPeriod(mu, semiMajorAxis),
    bound,
  };
}

export interface OrbitPoint {
  readonly timeSeconds: number;
  readonly position: Vector2;
}

export type OrbitStop = "duration" | "collision" | "escape-radius" | "step-limit";

export interface OrbitIntegration {
  readonly points: readonly OrbitPoint[];
  readonly final: OrbitState;
  readonly stoppedBy: OrbitStop;
  readonly steps: number;
}

export interface OrbitIntegrationOptions {
  /** Step size as a fraction of √(r³/μ); smaller is more accurate. Default 0.01. */
  readonly stepFraction?: number;
  /** Stop with "collision" when the radius falls to this value (for example the planet's surface). */
  readonly collisionRadius?: number;
  /** Stop with "escape-radius" when the satellite gets this far away. */
  readonly escapeRadius?: number;
  readonly maximumSteps?: number;
  /** Record a point every this many steps (default 1). */
  readonly recordEvery?: number;
}

function acceleration(mu: number, position: Vector2): Vector2 {
  const r = position.magnitude;
  return position.scale(-mu / (r * r * r));
}

/** Integrates the orbit for `durationSeconds` with velocity Verlet and an adaptive step. */
export function integrateOrbit(
  mu: number,
  initial: OrbitState,
  durationSeconds: number,
  options: OrbitIntegrationOptions = {},
): OrbitIntegration {
  assertPositive(mu, "mu");
  assertPositive(durationSeconds, "durationSeconds");
  const stepFraction = options.stepFraction ?? 0.01;
  const maximumSteps = options.maximumSteps ?? 2_000_000;
  const recordEvery = options.recordEvery ?? 1;
  assertPositive(stepFraction, "stepFraction");
  if (initial.position.magnitude <= 0) {
    throw new RangeError("The satellite cannot start at the center.");
  }

  let position = initial.position;
  let velocity = initial.velocity;
  let time = 0;
  let steps = 0;
  let stoppedBy: OrbitStop = "duration";
  const points: OrbitPoint[] = [{ timeSeconds: 0, position }];
  let currentAcceleration = acceleration(mu, position);

  while (time < durationSeconds) {
    if (steps >= maximumSteps) {
      stoppedBy = "step-limit";
      break;
    }
    const r = position.magnitude;
    const dt = Math.min(stepFraction * Math.sqrt((r * r * r) / mu), durationSeconds - time);
    const half = velocity.add(currentAcceleration.scale(dt / 2));
    position = position.add(half.scale(dt));
    currentAcceleration = acceleration(mu, position);
    velocity = half.add(currentAcceleration.scale(dt / 2));
    time += dt;
    steps += 1;
    if (steps % recordEvery === 0) {
      points.push({ timeSeconds: time, position });
    }

    const radius = position.magnitude;
    if (options.collisionRadius !== undefined && radius <= options.collisionRadius) {
      stoppedBy = "collision";
      break;
    }
    if (options.escapeRadius !== undefined && radius >= options.escapeRadius) {
      stoppedBy = "escape-radius";
      break;
    }
  }

  if (points[points.length - 1]?.timeSeconds !== time) {
    points.push({ timeSeconds: time, position });
  }
  return { points, final: { position, velocity }, stoppedBy, steps };
}
