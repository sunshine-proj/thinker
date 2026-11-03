import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * Basketball shots and bouncing balls.
 *
 * Without air resistance a ball launched at speed v and angle θ from height y₀ is at height
 * y(x) = y₀ + x tanθ − g x² / (2 v² cos²θ) when it has travelled x horizontally, and its vertical velocity there is
 * v_y = v sinθ − g x/(v cosθ). A shot goes in if y(x_hoop) is within a small margin of the rim height while the ball
 * is descending (v_y < 0). A ball striking the floor at speed u leaves it at e·u, where e is the coefficient of
 * restitution, so it rebounds to a height e² h after a drop from h.
 *
 * Limitations: no air drag or spin, a point-like ball (the margin stands in for the difference between ball and rim
 * sizes), and a floor that does not move.
 */
export function calculateHeightAtDistance(
  speed: number, angleDegrees: number, releaseHeight: number, distance: number, gravity = STANDARD_GRAVITY,
): number {
  assertPositive(speed, "speed");
  assertPositive(gravity, "gravity");
  assertNonNegative(releaseHeight, "releaseHeight");
  assertNonNegative(distance, "distance");
  const angle = (angleDegrees * Math.PI) / 180;
  if (!(angle > 0 && angle < Math.PI / 2)) {
    throw new RangeError("The angle must be between 0 and 90 degrees.");
  }
  return releaseHeight + distance * Math.tan(angle) - (gravity * distance ** 2) / (2 * speed ** 2 * Math.cos(angle) ** 2);
}

export function calculateVerticalVelocityAtDistance(
  speed: number, angleDegrees: number, distance: number, gravity = STANDARD_GRAVITY,
): number {
  assertPositive(speed, "speed");
  const angle = (angleDegrees * Math.PI) / 180;
  return speed * Math.sin(angle) - (gravity * distance) / (speed * Math.cos(angle));
}

/** Launch angles (degrees) that pass through the point (distance, targetHeight), lower first; empty if out of reach. */
export function calculateLaunchAngles(
  speed: number, releaseHeight: number, distance: number, targetHeight: number, gravity = STANDARD_GRAVITY,
): number[] {
  assertPositive(speed, "speed");
  assertPositive(distance, "distance");
  assertPositive(gravity, "gravity");
  const a = (gravity * distance ** 2) / (2 * speed ** 2);
  const discriminant = distance ** 2 - 4 * a * (targetHeight - releaseHeight + a);
  if (discriminant < 0) {
    return [];
  }
  const root = Math.sqrt(discriminant);
  return [(distance - root) / (2 * a), (distance + root) / (2 * a)].map((t) => (Math.atan(t) * 180) / Math.PI);
}

/** Launch speed that reaches the target with the angle fixed. */
export function calculateLaunchSpeed(
  angleDegrees: number, releaseHeight: number, distance: number, targetHeight: number, gravity = STANDARD_GRAVITY,
): number {
  const angle = (angleDegrees * Math.PI) / 180;
  const drop = releaseHeight + distance * Math.tan(angle) - targetHeight;
  if (drop <= 0) {
    throw new RangeError("The target cannot be reached at that angle.");
  }
  return Math.sqrt((gravity * distance ** 2) / (2 * Math.cos(angle) ** 2 * drop));
}

export function calculateReboundHeight(dropHeight: number, restitution: number): number {
  assertPositive(dropHeight, "dropHeight");
  if (!(restitution >= 0 && restitution <= 1)) {
    throw new RangeError("The coefficient of restitution must be between 0 and 1.");
  }
  return restitution ** 2 * dropHeight;
}

export function calculateRestitution(dropHeight: number, reboundHeight: number): number {
  assertPositive(dropHeight, "dropHeight");
  assertNonNegative(reboundHeight, "reboundHeight");
  if (reboundHeight > dropHeight) {
    throw new RangeError("A ball cannot rebound higher than it was dropped.");
  }
  return Math.sqrt(reboundHeight / dropHeight);
}
