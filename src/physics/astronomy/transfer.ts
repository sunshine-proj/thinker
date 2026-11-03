import { assertFiniteNumber, assertPositive } from "../core";

/**
 * Hohmann transfer between two coplanar circular orbits around a body with gravitational parameter μ.
 *
 * The transfer ellipse touches the inner orbit r₁ at periapsis and the outer orbit r₂ at apoapsis, so its
 * semi-major axis is a = (r₁ + r₂)/2. Burns are tangential: Δv₁ = √(μ/r₁)(√(2r₂/(r₁+r₂)) − 1) and
 * Δv₂ = √(μ/r₂)(1 − √(2r₁/(r₁+r₂))). The coast takes half the ellipse's period, t = π√(a³/μ). A target on the outer
 * circular orbit moves at n₂ = √(μ/r₂³), so at departure it must lead the spacecraft by θ = π − n₂ t.
 *
 * Limitations: two-body motion about the central body only (no gravity of the departure or target body), circular
 * coplanar orbits, instantaneous burns, and no plane change.
 */
export interface HohmannTransfer {
  readonly semiMajorAxis: number;
  readonly departureDeltaV: number;
  readonly arrivalDeltaV: number;
  readonly totalDeltaV: number;
  readonly transferTime: number;
  /** Angle by which the target must lead the spacecraft at departure, radians (can be negative if the target is inside). */
  readonly leadAngle: number;
}

export function calculateHohmannTransfer(mu: number, r1: number, r2: number): HohmannTransfer {
  assertPositive(mu, "mu");
  assertPositive(r1, "r1");
  assertPositive(r2, "r2");
  const a = (r1 + r2) / 2;
  const departureDeltaV = Math.sqrt(mu / r1) * (Math.sqrt((2 * r2) / (r1 + r2)) - 1);
  const arrivalDeltaV = Math.sqrt(mu / r2) * (1 - Math.sqrt((2 * r1) / (r1 + r2)));
  const transferTime = Math.PI * Math.sqrt(a ** 3 / mu);
  return {
    semiMajorAxis: a,
    departureDeltaV,
    arrivalDeltaV,
    totalDeltaV: Math.abs(departureDeltaV) + Math.abs(arrivalDeltaV),
    transferTime,
    leadAngle: Math.PI - Math.sqrt(mu / r2 ** 3) * transferTime,
  };
}

/** Apoapsis radius reached after a tangential burn from a circular orbit of radius r₁ that leaves speed v at r₁. */
export function calculateApoapsisAfterBurn(mu: number, r1: number, speedAfterBurn: number): number | null {
  assertPositive(mu, "mu");
  assertPositive(r1, "r1");
  assertFiniteNumber(speedAfterBurn, "speedAfterBurn");
  const denominator = (2 * mu) / r1 - speedAfterBurn ** 2;
  if (denominator <= 0) {
    return null;
  }
  return (r1 * speedAfterBurn ** 2) / denominator;
}
