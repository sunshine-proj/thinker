import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * A swing as a damped pendulum, θ'' = −(g/L) sinθ − 2ζω₀ θ', integrated with RK4. A push
 * is a short tangential impulse that changes the angular speed by Δω; pushing in the
 * direction of motion adds energy, pushing against it removes energy.
 *
 * Inputs: radians, rad/s, metres, seconds. Assumptions: a rigid, massless rope and
 * linear (air-drag-like) damping; the full sinθ restoring term is kept, so large swings
 * are slower than small ones.
 */

export interface PendulumState {
  readonly angle: number;
  readonly angularVelocity: number;
}

export function advanceDampedPendulum(state: PendulumState, lengthMeters: number, dampingRatio: number, dt: number, gravity = STANDARD_GRAVITY): PendulumState {
  assertPositive(lengthMeters, "lengthMeters");
  assertNonNegative(dampingRatio, "dampingRatio");
  assertPositive(dt, "dt");
  const w0 = Math.sqrt(gravity / lengthMeters);
  const f = (angle: number, omega: number) => -w0 * w0 * Math.sin(angle) - 2 * dampingRatio * w0 * omega;
  const { angle: a, angularVelocity: w } = state;
  const k1a = w;
  const k1w = f(a, w);
  const k2a = w + (dt / 2) * k1w;
  const k2w = f(a + (dt / 2) * k1a, k2a);
  const k3a = w + (dt / 2) * k2w;
  const k3w = f(a + (dt / 2) * k2a, k3a);
  const k4a = w + dt * k3w;
  const k4w = f(a + dt * k3a, k4a);
  return {
    angle: a + (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a),
    angularVelocity: w + (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w),
  };
}

/** A push in the current direction of motion (or forward from rest) of angular-speed change Δω. */
export function pushPendulum(state: PendulumState, deltaAngularVelocity: number): PendulumState {
  const direction = state.angularVelocity === 0 ? 1 : Math.sign(state.angularVelocity);
  return { ...state, angularVelocity: state.angularVelocity + direction * deltaAngularVelocity };
}

/** Amplitude (rad) the swing would reach with its current energy: cos θ_max = cos θ − ω² L / (2g). */
export function calculateSwingAmplitude(state: PendulumState, lengthMeters: number, gravity = STANDARD_GRAVITY): number {
  const cosine = Math.cos(state.angle) - (state.angularVelocity ** 2 * lengthMeters) / (2 * gravity);
  return Math.acos(Math.max(-1, Math.min(1, cosine)));
}
