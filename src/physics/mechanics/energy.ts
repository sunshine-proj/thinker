import { STANDARD_GRAVITY, assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * Energy conservation for a roller-coaster car on a track, with a constant friction loss.
 *
 * Per unit mass, ½v² + g h is conserved except for the work against friction, taken as
 * μ g s for a path length s (a rolling-resistance model): v² = v₀² + 2g(h₀ − h) − 2 μ g s.
 * Around a vertical loop of radius R the car needs v² ≥ gR at the top to stay on the track;
 * the seat pushes with N = m(v²/R − g) at the top and N = m(g + v²/R) at the bottom.
 *
 * Limitations: a point mass on a track, a constant friction coefficient, no air drag, and
 * the loop is circular with the car entering at its lowest point.
 */
export function calculateSpeedSquared(
  startSpeed: number,
  startHeight: number,
  height: number,
  frictionCoefficient = 0,
  pathLength = 0,
  gravity = STANDARD_GRAVITY,
): number {
  assertNonNegative(startSpeed, "startSpeed");
  assertFiniteNumber(startHeight, "startHeight");
  assertFiniteNumber(height, "height");
  assertNonNegative(frictionCoefficient, "frictionCoefficient");
  assertNonNegative(pathLength, "pathLength");
  assertPositive(gravity, "gravity");
  return startSpeed ** 2 + 2 * gravity * (startHeight - height) - 2 * frictionCoefficient * gravity * pathLength;
}

/** Slowest speed at the top of a loop that keeps the car on the track: √(gR). */
export function calculateMinimumLoopTopSpeed(radius: number, gravity = STANDARD_GRAVITY): number {
  assertPositive(radius, "radius");
  assertPositive(gravity, "gravity");
  return Math.sqrt(gravity * radius);
}

/** Seat force as a multiple of weight (g-force) at the bottom of a loop at speed v. */
export function calculateBottomGForce(speed: number, radius: number, gravity = STANDARD_GRAVITY): number {
  assertNonNegative(speed, "speed");
  assertPositive(radius, "radius");
  return 1 + speed ** 2 / (gravity * radius);
}

/** Seat force as a multiple of weight at the top of a loop; below 0 the car would leave the track. */
export function calculateTopGForce(speed: number, radius: number, gravity = STANDARD_GRAVITY): number {
  assertNonNegative(speed, "speed");
  assertPositive(radius, "radius");
  return speed ** 2 / (gravity * radius) - 1;
}
