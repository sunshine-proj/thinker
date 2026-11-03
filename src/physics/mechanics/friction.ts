import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * Static and kinetic friction on a flat or inclined surface.
 *
 * A block of mass m on a slope of angle θ has the weight component m g sinθ down the slope and the normal force
 * N = m g cosθ. Friction opposes any sliding tendency. Up to the limit μ_s N it matches whatever force is needed to hold
 * the block still (static friction, a "just enough" force); once the net push along the slope exceeds μ_s N the block
 * slides and friction drops to the kinetic value μ_k N, with acceleration a = (net force − μ_k N)/m. A block on a bare
 * slope starts to slide at the angle tanθ = μ_s.
 *
 * Limitations: dry Coulomb friction with constant coefficients (independent of area and speed), a rigid block and a
 * flat slope. Real coefficients vary with surface condition and are only typical values here.
 */
export interface Surface {
  readonly id: string;
  readonly name: string;
  readonly staticCoefficient: number;
  readonly kineticCoefficient: number;
}

export const SURFACES: readonly Surface[] = Object.freeze([
  { id: "rubber-concrete", name: "Rubber on dry concrete", staticCoefficient: 1.0, kineticCoefficient: 0.8 },
  { id: "wood-wood", name: "Wood on wood", staticCoefficient: 0.5, kineticCoefficient: 0.3 },
  { id: "steel-steel", name: "Steel on steel", staticCoefficient: 0.74, kineticCoefficient: 0.57 },
  { id: "ice-ice", name: "Ice on ice", staticCoefficient: 0.1, kineticCoefficient: 0.03 },
  { id: "teflon-steel", name: "Teflon on steel", staticCoefficient: 0.04, kineticCoefficient: 0.04 },
]);

export interface FrictionState {
  readonly normalForce: number;
  readonly maximumStaticFriction: number;
  readonly kineticFriction: number;
  /** Weight component along the slope, N (positive down the slope). */
  readonly slopeForce: number;
  readonly moving: boolean;
  /** Friction force magnitude acting now, N. */
  readonly frictionForce: number;
  /** Acceleration along the slope, m/s², positive up the slope. */
  readonly acceleration: number;
}

export function calculateFriction(
  surface: Surface, massKg: number, slopeDegrees: number, appliedUpSlopeNewtons: number,
): FrictionState {
  assertPositive(massKg, "massKg");
  assertNonNegative(appliedUpSlopeNewtons, "appliedUpSlopeNewtons");
  if (!(slopeDegrees >= 0 && slopeDegrees < 90)) {
    throw new RangeError("The slope must be between 0 and 90 degrees.");
  }
  const angle = (slopeDegrees * Math.PI) / 180;
  const normal = massKg * STANDARD_GRAVITY * Math.cos(angle);
  const slopeForce = massKg * STANDARD_GRAVITY * Math.sin(angle);
  const maxStatic = surface.staticCoefficient * normal;
  const kinetic = surface.kineticCoefficient * normal;
  const net = appliedUpSlopeNewtons - slopeForce;
  if (Math.abs(net) <= maxStatic) {
    return { normalForce: normal, maximumStaticFriction: maxStatic, kineticFriction: kinetic, slopeForce, moving: false, frictionForce: Math.abs(net), acceleration: 0 };
  }
  const acceleration = (Math.abs(net) - kinetic) / massKg;
  return {
    normalForce: normal, maximumStaticFriction: maxStatic, kineticFriction: kinetic, slopeForce, moving: true,
    frictionForce: kinetic, acceleration: net > 0 ? acceleration : -acceleration,
  };
}

/** Angle in degrees at which a block on a bare slope starts to slide: atan(μ_s). */
export function calculateCriticalAngle(surface: Surface): number {
  return (Math.atan(surface.staticCoefficient) * 180) / Math.PI;
}

export function calculateSlideTime(distanceMeters: number, accelerationMagnitude: number): number {
  assertPositive(distanceMeters, "distanceMeters");
  assertPositive(accelerationMagnitude, "accelerationMagnitude");
  return Math.sqrt((2 * distanceMeters) / accelerationMagnitude);
}
