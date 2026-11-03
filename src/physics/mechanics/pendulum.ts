import { assertPositive } from "../core";

/**
 * Free fall and the pendulum under different gravity.
 *
 * Dropped from rest through a height h, an object takes t = √(2h/g) and hits at v = √(2gh). A simple pendulum of length
 * L has the small-angle period T₀ = 2π√(L/g), independent of its mass. For a release angle θ₀ the exact period is
 * T = (2/π) K(sin(θ₀/2)) T₀, with K the complete elliptic integral of the first kind, computed here with the
 * arithmetic-geometric mean K(k) = π / (2 AGM(1, √(1 − k²))); it is 1.7 % longer than T₀ at 20° and 7.4 % at 40°.
 *
 * Limitations: no air resistance, a point bob on a massless inextensible string, a uniform field and no friction at the
 * pivot. Free fall is vertical and the height is small compared with the planet's radius.
 */
export function calculateFallTime(heightMeters: number, gravity: number): number {
  assertPositive(heightMeters, "heightMeters");
  assertPositive(gravity, "gravity");
  return Math.sqrt((2 * heightMeters) / gravity);
}

export function calculateImpactSpeed(heightMeters: number, gravity: number): number {
  assertPositive(heightMeters, "heightMeters");
  assertPositive(gravity, "gravity");
  return Math.sqrt(2 * gravity * heightMeters);
}

export function calculatePendulumPeriod(lengthMeters: number, gravity: number): number {
  assertPositive(lengthMeters, "lengthMeters");
  assertPositive(gravity, "gravity");
  return 2 * Math.PI * Math.sqrt(lengthMeters / gravity);
}

export function calculateExactPendulumPeriod(lengthMeters: number, gravity: number, amplitudeDegrees: number): number {
  if (!(amplitudeDegrees > 0 && amplitudeDegrees < 180)) {
    throw new RangeError("The amplitude must be between 0 and 180 degrees.");
  }
  const k = Math.sin((amplitudeDegrees * Math.PI) / 360);
  let a = 1;
  let g = Math.sqrt(1 - k * k);
  for (let i = 0; i < 40; i += 1) {
    [a, g] = [(a + g) / 2, Math.sqrt(a * g)];
  }
  const complete = Math.PI / (2 * a);
  return ((2 / Math.PI) * complete) * calculatePendulumPeriod(lengthMeters, gravity);
}

/** Small-angle swing: θ(t) = θ₀ cos(2πt/T₀), in degrees. */
export function calculateSmallAngleSwing(lengthMeters: number, gravity: number, amplitudeDegrees: number, timeSeconds: number): number {
  return amplitudeDegrees * Math.cos((2 * Math.PI * timeSeconds) / calculatePendulumPeriod(lengthMeters, gravity));
}
