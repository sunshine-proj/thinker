import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * Circular motion and g-forces on rides.
 *
 * A rider moving in a circle of radius r with period T has the centripetal acceleration a = 4π²r/T² = ω²r toward the
 * center, supplied by the seat or wall. The g-force felt is the normal force divided by weight. On a rotating
 * drum (a "Rotor") the wall pushes inward with N = mω²r and friction μN must carry the weight mg, so riders
 * stay stuck while ω ≥ √(g/(μ r)). When a falling car is braked from speed v over a distance s the deceleration is
 * v²/(2s) and the rider feels 1 + a/g times their weight at the bottom.
 *
 * Limitations: uniform circular motion, a rigid rider, constant friction coefficient and constant braking deceleration.
 */
export function calculateCentripetalAcceleration(radius: number, periodSeconds: number): number {
  assertPositive(radius, "radius");
  assertPositive(periodSeconds, "periodSeconds");
  return (4 * Math.PI ** 2 * radius) / periodSeconds ** 2;
}

export function calculatePeriodForAcceleration(radius: number, acceleration: number): number {
  assertPositive(radius, "radius");
  assertPositive(acceleration, "acceleration");
  return 2 * Math.PI * Math.sqrt(radius / acceleration);
}

export function calculateRotorMinimumAngularSpeed(radius: number, friction: number): number {
  assertPositive(radius, "radius");
  assertPositive(friction, "friction");
  return Math.sqrt(STANDARD_GRAVITY / (friction * radius));
}

export function calculateWallGForce(radius: number, angularSpeed: number): number {
  assertPositive(radius, "radius");
  assertNonNegative(angularSpeed, "angularSpeed");
  return (angularSpeed ** 2 * radius) / STANDARD_GRAVITY;
}

export function calculateFreeFallSpeed(height: number): number {
  assertNonNegative(height, "height");
  return Math.sqrt(2 * STANDARD_GRAVITY * height);
}

/** g-force felt at the bottom while braking from `speed` over `distance`. */
export function calculateBrakingGForce(speed: number, distance: number): number {
  assertPositive(speed, "speed");
  assertPositive(distance, "distance");
  return 1 + speed ** 2 / (2 * distance * STANDARD_GRAVITY);
}

export function rpmToRadiansPerSecond(rpm: number): number {
  return (rpm * 2 * Math.PI) / 60;
}
