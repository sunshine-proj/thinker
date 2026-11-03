import { GRAVITATIONAL_CONSTANT, Vector2, assertPositive } from "../core";

/**
 * Newtonian N-body gravity in two dimensions.
 *
 * Every pair of bodies attracts with a = G m / r² along the line between them. The system is advanced with the
 * kick-drift-kick leapfrog (velocity Verlet), a second-order, symplectic, time-reversible scheme, so total
 * energy oscillates around its true value instead of drifting, and linear momentum is conserved to rounding.
 * The time step is chosen each step as η √(r³ / G(mᵢ + mⱼ)) for the closest pair, so it shrinks automatically
 * when two bodies pass close together. It is validated in the tests against Kepler's third law
 * (T² ∝ a³) and against conservation of energy and angular momentum.
 *
 * Limitations: point masses with no collisions or merging, Newtonian gravity only (no relativity), no softening
 * (a very close pass costs many small steps and is cut off by `maximumSteps`), and 2D motion.
 */
export interface Body {
  readonly name: string;
  readonly mass: number;
  readonly position: Vector2;
  readonly velocity: Vector2;
}

export interface NBodyOptions {
  /** Step size relative to the dynamical time of the closest pair; default 0.005. */
  readonly stepFraction?: number;
  readonly maximumSteps?: number;
  /** Called after every step; return true to stop. */
  readonly onStep?: (time: number, bodies: readonly Body[]) => boolean | void;
}

export interface NBodyResult {
  readonly time: number;
  readonly bodies: readonly Body[];
  readonly steps: number;
  readonly stoppedBy: "duration" | "callback" | "step-limit";
}

function accelerations(bodies: readonly Body[]): Vector2[] {
  const result = bodies.map(() => Vector2.zero());
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i]!;
      const b = bodies[j]!;
      const offset = b.position.subtract(a.position);
      const r = offset.magnitude;
      if (r === 0) {
        throw new RangeError(`${a.name} and ${b.name} occupy the same position.`);
      }
      const factor = GRAVITATIONAL_CONSTANT / (r * r * r);
      result[i] = result[i]!.add(offset.scale(factor * b.mass));
      result[j] = result[j]!.add(offset.scale(-factor * a.mass));
    }
  }
  return result;
}

function stepSize(bodies: readonly Body[], fraction: number): number {
  let best = Infinity;
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i]!;
      const b = bodies[j]!;
      const r = a.position.distanceTo(b.position);
      best = Math.min(best, Math.sqrt((r * r * r) / (GRAVITATIONAL_CONSTANT * (a.mass + b.mass))));
    }
  }
  return fraction * best;
}

export function validateBodies(bodies: readonly Body[]): void {
  if (bodies.length < 2) {
    throw new RangeError("An N-body system needs at least two bodies.");
  }
  for (const body of bodies) {
    assertPositive(body.mass, `mass of ${body.name}`);
  }
}

export function integrateNBody(initial: readonly Body[], durationSeconds: number, options: NBodyOptions = {}): NBodyResult {
  validateBodies(initial);
  assertPositive(durationSeconds, "durationSeconds");
  const fraction = options.stepFraction ?? 0.005;
  const maximumSteps = options.maximumSteps ?? 1_000_000;
  assertPositive(fraction, "stepFraction");

  let bodies = initial;
  let acc = accelerations(bodies);
  let time = 0;
  let steps = 0;
  while (time < durationSeconds) {
    if (steps >= maximumSteps) {
      return { time, bodies, steps, stoppedBy: "step-limit" };
    }
    const dt = Math.min(stepSize(bodies, fraction), durationSeconds - time);
    const half = bodies.map((b, i) => b.velocity.add(acc[i]!.scale(dt / 2)));
    const moved = bodies.map((b, i) => ({ ...b, velocity: half[i]!, position: b.position.add(half[i]!.scale(dt)) }));
    acc = accelerations(moved);
    bodies = moved.map((b, i) => ({ ...b, velocity: half[i]!.add(acc[i]!.scale(dt / 2)) }));
    time += dt;
    steps += 1;
    if (options.onStep?.(time, bodies) === true) {
      return { time, bodies, steps, stoppedBy: "callback" };
    }
  }
  return { time, bodies, steps, stoppedBy: "duration" };
}

/** Total mechanical energy: Σ ½mv² − Σ_pairs G mᵢ mⱼ / r, in joules. */
export function calculateTotalEnergy(bodies: readonly Body[]): number {
  let energy = 0;
  for (let i = 0; i < bodies.length; i += 1) {
    const a = bodies[i]!;
    energy += 0.5 * a.mass * a.velocity.magnitudeSquared;
    for (let j = i + 1; j < bodies.length; j += 1) {
      const b = bodies[j]!;
      energy -= (GRAVITATIONAL_CONSTANT * a.mass * b.mass) / a.position.distanceTo(b.position);
    }
  }
  return energy;
}

export function calculateTotalMomentum(bodies: readonly Body[]): Vector2 {
  return bodies.reduce((sum, b) => sum.add(b.velocity.scale(b.mass)), Vector2.zero());
}

/** Total angular momentum about the origin (z component), kg·m²/s. */
export function calculateTotalAngularMomentum(bodies: readonly Body[]): number {
  return bodies.reduce((sum, b) => sum + b.mass * b.position.cross(b.velocity), 0);
}

/**
 * Orbital period of `bodies[index]` about `bodies[centerIndex]`, measured by integrating until the line joining them
 * has turned through a full 2π. Returns null if it does not complete one turn within `maximumSeconds`.
 */
export function measureOrbitalPeriod(
  initial: readonly Body[],
  index: number,
  centerIndex: number,
  maximumSeconds: number,
  options: Omit<NBodyOptions, "onStep"> = {},
): { period: number | null; path: Vector2[]; energyDrift: number } {
  const angleOf = (bodies: readonly Body[]) => {
    const offset = bodies[index]!.position.subtract(bodies[centerIndex]!.position);
    return Math.atan2(offset.y, offset.x);
  };
  const energy0 = calculateTotalEnergy(initial);
  let previous = angleOf(initial);
  let turned = 0;
  let period: number | null = null;
  let interpolated = 0;
  let lastTime = 0;
  const path: Vector2[] = [initial[index]!.position.subtract(initial[centerIndex]!.position)];
  let worstDrift = 0;
  const result = integrateNBody(initial, maximumSeconds, {
    ...options,
    onStep: (time, bodies) => {
      const angle = angleOf(bodies);
      let delta = angle - previous;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      const before = turned;
      turned += Math.abs(delta);
      previous = angle;
      path.push(bodies[index]!.position.subtract(bodies[centerIndex]!.position));
      worstDrift = Math.max(worstDrift, Math.abs(calculateTotalEnergy(bodies) - energy0));
      if (turned >= 2 * Math.PI) {
        const fractionOfStep = (2 * Math.PI - before) / (turned - before);
        interpolated = lastTime + fractionOfStep * (time - lastTime);
        period = interpolated;
        return true;
      }
      lastTime = time;
      return false;
    },
  });
  void result;
  return { period, path, energyDrift: Math.abs(energy0) > 0 ? worstDrift / Math.abs(energy0) : 0 };
}
