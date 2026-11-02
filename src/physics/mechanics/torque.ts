import {
  STANDARD_GRAVITY,
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
} from "../core";

/**
 * Static torque balance of a rigid horizontal lever (seesaw) in uniform gravity.
 *
 * Model: planar, rigid, horizontal beam resting on a single pivot; weights act
 * vertically at point positions along the beam; a uniform beam's weight acts at
 * its geometric centre. Positions are signed distances along the beam in meters,
 * measured from the pivot with +x to the right. Torque about the pivot is
 *
 *   τ = m g (x − x_pivot)
 *
 * and is positive when it turns the beam clockwise (right side down). The beam is
 * in static equilibrium when Στ = 0.
 *
 * Limitations: statics only (no angular motion or friction), small deflection
 * (the lever arm is not shortened by tilt), and a pivot that supports the beam
 * at any tilt.
 */
export interface PointLoad {
  /** Mass in kilograms. */
  readonly massKilograms: number;
  /** Signed position along the beam, in meters from the pivot (+ right). */
  readonly positionMeters: number;
}

export type BalanceState = "balanced" | "clockwise" | "counterclockwise";

/** Torque (N·m) of one weight about the pivot; positive is clockwise. */
export function calculateTorque(
  load: PointLoad,
  gravityMetersPerSecondSquared = STANDARD_GRAVITY,
): number {
  assertNonNegative(load.massKilograms, "massKilograms");
  assertFiniteNumber(load.positionMeters, "positionMeters");
  assertPositive(gravityMetersPerSecondSquared, "gravity");

  const torque =
    load.massKilograms * gravityMetersPerSecondSquared * load.positionMeters;
  // Avoid reporting -0 for loads at the pivot.
  return torque === 0 ? 0 : torque;
}

/** Net torque (N·m) of several weights about the pivot; positive is clockwise. */
export function calculateNetTorque(
  loads: readonly PointLoad[],
  gravityMetersPerSecondSquared = STANDARD_GRAVITY,
): number {
  return loads.reduce(
    (total, load) =>
      total + calculateTorque(load, gravityMetersPerSecondSquared),
    0,
  );
}

/** Total weight (N) the pivot must support when the beam is at rest. */
export function calculateSupportForce(
  loads: readonly PointLoad[],
  gravityMetersPerSecondSquared = STANDARD_GRAVITY,
): number {
  assertPositive(gravityMetersPerSecondSquared, "gravity");
  return loads.reduce((total, load) => {
    assertNonNegative(load.massKilograms, "massKilograms");
    return total + load.massKilograms * gravityMetersPerSecondSquared;
  }, 0);
}

/** Point load equivalent to a uniform beam of the given mass centred at `centerPositionMeters`. */
export function createUniformBeamLoad(
  massKilograms: number,
  centerPositionMeters: number,
): PointLoad {
  assertNonNegative(massKilograms, "beam massKilograms");
  assertFiniteNumber(centerPositionMeters, "centerPositionMeters");
  return { massKilograms, positionMeters: centerPositionMeters };
}

/**
 * Position (m from the pivot) at which a mass must be placed so that the net
 * torque of all loads becomes zero. Returns null when the mass is zero.
 */
export function solveBalancePosition(
  otherLoads: readonly PointLoad[],
  massKilograms: number,
  gravityMetersPerSecondSquared = STANDARD_GRAVITY,
): number | null {
  assertNonNegative(massKilograms, "massKilograms");
  if (massKilograms === 0) {
    return null;
  }
  const otherTorque = calculateNetTorque(
    otherLoads,
    gravityMetersPerSecondSquared,
  );
  const position = -otherTorque / (massKilograms * gravityMetersPerSecondSquared);
  return position === 0 ? 0 : position;
}

/**
 * Mass (kg) that balances the other loads when placed at `positionMeters`.
 * Returns null when the position is at the pivot (no torque) or on the same
 * side as the existing net torque (no positive mass can balance it).
 */
export function solveBalanceMass(
  otherLoads: readonly PointLoad[],
  positionMeters: number,
  gravityMetersPerSecondSquared = STANDARD_GRAVITY,
): number | null {
  assertFiniteNumber(positionMeters, "positionMeters");
  if (positionMeters === 0) {
    return null;
  }
  const otherTorque = calculateNetTorque(
    otherLoads,
    gravityMetersPerSecondSquared,
  );
  const mass = -otherTorque / (positionMeters * gravityMetersPerSecondSquared);
  return mass >= 0 ? mass : null;
}

/** Classifies the net torque; |τ| ≤ tolerance counts as balanced. */
export function classifyBalance(
  netTorqueNewtonMeters: number,
  toleranceNewtonMeters: number,
): BalanceState {
  assertFiniteNumber(netTorqueNewtonMeters, "netTorqueNewtonMeters");
  assertNonNegative(toleranceNewtonMeters, "toleranceNewtonMeters");

  if (Math.abs(netTorqueNewtonMeters) <= toleranceNewtonMeters) {
    return "balanced";
  }
  return netTorqueNewtonMeters > 0 ? "clockwise" : "counterclockwise";
}
