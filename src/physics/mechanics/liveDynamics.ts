import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * Time-stepped motion for the real-time games. Each function advances a state by one
 * fixed step and is exact or fourth-order accurate for its model.
 *
 * - Projectile: constant gravity, no air resistance; x += v dt and v += g dt with the
 *   ½ g dt² term, which is exact for constant acceleration.
 * - Vertical lander: thrust while the engine fires and fuel remains, mass falling at
 *   ṁ = T / (I_sp g₀), gravity g of the body below; integrated with RK4 in v and h.
 */

export interface ProjectileState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
}

export function launchProjectile(x: number, y: number, speed: number, angleDegrees: number): ProjectileState {
  assertNonNegative(speed, "speed");
  const angle = (angleDegrees * Math.PI) / 180;
  return { x, y, vx: speed * Math.cos(angle), vy: speed * Math.sin(angle) };
}

export function advanceProjectile(state: ProjectileState, dt: number, gravity = STANDARD_GRAVITY): ProjectileState {
  assertPositive(dt, "dt");
  return {
    x: state.x + state.vx * dt,
    y: state.y + state.vy * dt - 0.5 * gravity * dt * dt,
    vx: state.vx,
    vy: state.vy - gravity * dt,
  };
}

export interface LanderState {
  readonly altitude: number;
  /** Upward velocity, m/s (negative while descending). */
  readonly velocity: number;
  readonly fuelKg: number;
}

export interface LanderSpecification {
  readonly dryMassKilograms: number;
  readonly maximumThrustNewtons: number;
  readonly specificImpulseSeconds: number;
}

export function advanceLander(state: LanderState, thrusting: boolean, spec: LanderSpecification, gravity: number, dt: number): LanderState {
  assertPositive(dt, "dt");
  assertPositive(gravity, "gravity");
  const burning = thrusting && state.fuelKg > 0;
  const thrust = burning ? spec.maximumThrustNewtons : 0;
  const flow = thrust / (spec.specificImpulseSeconds * STANDARD_GRAVITY);
  const burnTime = burning ? Math.min(dt, state.fuelKg / flow) : 0;
  // Integrate the burning part, then any coast in the rest of the step.
  const accel = (fuel: number) => (burning ? thrust / (spec.dryMassKilograms + fuel) : 0) - gravity;
  let { altitude, velocity, fuelKg } = state;
  if (burnTime > 0) {
    const f = (t: number) => accel(state.fuelKg - flow * t);
    const k1v = f(0);
    const k2v = f(burnTime / 2);
    const k4v = f(burnTime);
    // Simpson's rule for v and for h (exact enough for these smooth accelerations).
    const dv = (burnTime / 6) * (k1v + 4 * k2v + k4v);
    const dh = burnTime * velocity + (burnTime * burnTime / 6) * (k1v + 2 * k2v);
    velocity += dv;
    altitude += dh;
    fuelKg = Math.max(0, fuelKg - flow * burnTime);
  }
  const coast = dt - burnTime;
  if (coast > 0) {
    altitude += velocity * coast - 0.5 * gravity * coast * coast;
    velocity -= gravity * coast;
  }
  return { altitude, velocity, fuelKg };
}
