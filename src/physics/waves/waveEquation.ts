import { assertPositive } from "../core";

/**
 * One-dimensional wave equation u_tt = c² u_xx on a string with fixed ends, solved by the explicit leapfrog
 * finite-difference scheme
 *     uⁿ⁺¹ᵢ = 2uⁿᵢ − uⁿ⁻¹ᵢ + C² (uⁿᵢ₊₁ − 2uⁿᵢ + uⁿᵢ₋₁),   C = c Δt / Δx.
 *
 * Accuracy and stability: the scheme is second order in Δx and Δt and is stable only for the Courant number
 * C ≤ 1 (we reject C > 1). For C = 1 it reproduces d'Alembert's travelling-wave solution exactly on the grid,
 * so pulses keep their shape; for C < 1 short wavelengths travel slightly too slowly (numerical dispersion).
 * Because the equation is linear, solutions superpose exactly. A fixed end reflects a pulse inverted.
 *
 * Limitations: no damping or dispersion in the medium itself, uniform string, small displacements.
 */
export interface WaveGrid {
  readonly length: number;
  readonly points: number;
  readonly dx: number;
}

export interface WaveSimulation {
  readonly grid: WaveGrid;
  readonly dt: number;
  readonly courant: number;
  readonly time: number;
  readonly displacement: Float64Array;
}

export type WaveProfile = (x: number) => number;

export function createWaveGrid(lengthMeters: number, intervals: number): WaveGrid {
  assertPositive(lengthMeters, "lengthMeters");
  if (!Number.isInteger(intervals) || intervals < 4) {
    throw new RangeError("The grid needs at least 4 intervals.");
  }
  return { length: lengthMeters, points: intervals + 1, dx: lengthMeters / intervals };
}

/** Gaussian pulse of height `amplitude`, standard deviation `width`, centred at `center`. */
export function gaussianPulse(amplitude: number, center: number, width: number): WaveProfile {
  assertPositive(width, "width");
  return (x) => amplitude * Math.exp(-((x - center) ** 2) / (2 * width * width));
}

/**
 * Simulates `steps` time steps. `pulses` are initial displacement profiles with a direction: +1 moves toward
 * larger x, −1 toward smaller x. Initial velocity is set so each profile travels one way (u_t = −d c f′).
 */
export function simulateWave(
  grid: WaveGrid,
  speed: number,
  courant: number,
  steps: number,
  pulses: readonly { profile: WaveProfile; direction: 1 | -1 }[],
  onStep?: (state: WaveSimulation) => void,
): WaveSimulation {
  assertPositive(speed, "speed");
  assertPositive(courant, "courant");
  if (courant > 1 + 1e-12) {
    throw new RangeError("The scheme is unstable for a Courant number above 1.");
  }
  if (!Number.isInteger(steps) || steps < 0) {
    throw new RangeError("steps must be a non-negative integer.");
  }
  const { points, dx } = grid;
  const dt = (courant * dx) / speed;
  const c2 = courant * courant;
  let previous = new Float64Array(points);
  let current = new Float64Array(points);
  const velocity = new Float64Array(points);
  for (let i = 1; i < points - 1; i += 1) {
    for (const { profile, direction } of pulses) {
      current[i]! += profile(i * dx);
      const slope = (profile((i + 1) * dx) - profile((i - 1) * dx)) / (2 * dx);
      velocity[i]! += -direction * speed * slope;
    }
  }
  // First step from a Taylor expansion: u¹ = u⁰ + dt·u_t + ½ dt² c² u_xx.
  const first = new Float64Array(points);
  for (let i = 1; i < points - 1; i += 1) {
    const curvature = current[i + 1]! - 2 * current[i]! + current[i - 1]!;
    first[i] = current[i]! + dt * velocity[i]! + 0.5 * c2 * curvature;
  }
  previous = current;
  current = first;
  let time = steps === 0 ? 0 : dt;
  if (steps === 0) {
    current = previous;
  }
  const snapshot = (): WaveSimulation => ({ grid, dt, courant, time, displacement: current });
  onStep?.(snapshot());
  for (let n = 1; n < steps; n += 1) {
    const next = new Float64Array(points);
    for (let i = 1; i < points - 1; i += 1) {
      next[i] = 2 * current[i]! - previous[i]! + c2 * (current[i + 1]! - 2 * current[i]! + current[i - 1]!);
    }
    previous = current;
    current = next;
    time += dt;
    onStep?.(snapshot());
  }
  return snapshot();
}

/** Number of time steps whose total duration is closest to `durationSeconds`. */
export function stepsForDuration(grid: WaveGrid, speed: number, courant: number, durationSeconds: number): number {
  assertPositive(durationSeconds, "durationSeconds");
  return Math.round(durationSeconds / ((courant * grid.dx) / speed));
}

/** Time for a pulse to travel `distanceMeters` at the wave speed (analytic, for checking the simulation). */
export function calculateTravelTime(distanceMeters: number, speed: number): number {
  assertPositive(speed, "speed");
  if (distanceMeters < 0) {
    throw new RangeError("distanceMeters must not be negative.");
  }
  return distanceMeters / speed;
}
