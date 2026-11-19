import { assertPositive } from "../core";

/**
 * A probe moving under the gravity of a star fixed at the origin and of planets on
 * prescribed circular orbits around it (the restricted problem: the probe does not
 * pull on anything). A close pass behind a moving planet swings the probe forward and
 * raises its energy around the star: a gravity assist. In the planet's own frame the
 * pass only turns the probe's velocity; the gain comes from the planet's motion.
 *
 * Acceleration: a = −μ★ r/|r|³ − Σ μₚ (r − rₚ(t))/|r − rₚ(t)|³, integrated with
 * fourth-order Runge–Kutta, with the planets' positions evaluated at each stage time.
 *
 * Units are any consistent set; the game uses scaled units (μ★ = 1000). Limitations:
 * point masses, circular coplanar planet orbits, no softening, so steps must be small
 * compared with the closest approach time.
 */
export interface AssistPlanet {
  readonly mu: number;
  readonly orbitRadius: number;
  /** Angle of the planet at t = 0, radians. */
  readonly phase: number;
}

export interface ProbeState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly t: number;
}

export function planetPosition(planet: AssistPlanet, starMu: number, t: number): { x: number; y: number } {
  const omega = Math.sqrt(starMu / planet.orbitRadius ** 3);
  const angle = planet.phase + omega * t;
  return { x: planet.orbitRadius * Math.cos(angle), y: planet.orbitRadius * Math.sin(angle) };
}

function acceleration(x: number, y: number, t: number, starMu: number, planets: readonly AssistPlanet[]): [number, number] {
  const r = Math.hypot(x, y);
  let ax = (-starMu * x) / r ** 3;
  let ay = (-starMu * y) / r ** 3;
  for (const planet of planets) {
    const p = planetPosition(planet, starMu, t);
    const dx = x - p.x;
    const dy = y - p.y;
    const d = Math.hypot(dx, dy);
    ax -= (planet.mu * dx) / d ** 3;
    ay -= (planet.mu * dy) / d ** 3;
  }
  return [ax, ay];
}

export function stepProbe(state: ProbeState, dt: number, starMu: number, planets: readonly AssistPlanet[]): ProbeState {
  assertPositive(dt, "dt");
  assertPositive(starMu, "starMu");
  type Vec = readonly [number, number, number, number];
  const derivative = ([x, y, vx, vy]: Vec, t: number): Vec => {
    const [ax, ay] = acceleration(x, y, t, starMu, planets);
    return [vx, vy, ax, ay];
  };
  const add = (a: Vec, b: Vec, scale: number): Vec => [a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale, a[3] + b[3] * scale];
  const y0: Vec = [state.x, state.y, state.vx, state.vy];
  const k1 = derivative(y0, state.t);
  const k2 = derivative(add(y0, k1, dt / 2), state.t + dt / 2);
  const k3 = derivative(add(y0, k2, dt / 2), state.t + dt / 2);
  const k4 = derivative(add(y0, k3, dt), state.t + dt);
  const next = y0.map((value, i) => value + (dt / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!));
  return { x: next[0]!, y: next[1]!, vx: next[2]!, vy: next[3]!, t: state.t + dt };
}

/** Energy per unit mass around the star alone (planets left out): v²/2 − μ★/r. */
export function calculateStarEnergy(state: ProbeState, starMu: number): number {
  return (state.vx ** 2 + state.vy ** 2) / 2 - starMu / Math.hypot(state.x, state.y);
}
