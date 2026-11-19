import {
  COULOMB_CONSTANT,
  STANDARD_GRAVITY,
  Vector2,
  assertFiniteNumber,
  assertPositive,
} from "../core";

/**
 * Electrostatics of point charges in a plane, in a vacuum.
 *
 * Coulomb's law: the force between two point charges has magnitude
 * F = k |q₁ q₂| / r², along the line joining them, repulsive for like signs and
 * attractive for opposite signs. The electric field of a point charge q is
 * E = k q / r² pointing away from a positive charge; fields add as vectors
 * (superposition). Units: coulombs (C), meters (m), newtons (N), N/C.
 *
 * Limitations: static charges only (no magnetic effects or motion), point
 * charges with no size, no conductors or dielectrics, and the field diverges
 * at the charge itself, so positions at the source are rejected.
 */
export interface PointCharge {
  readonly chargeCoulombs: number;
  readonly position: Vector2;
}

/** Magnitude of the Coulomb force between two point charges, in newtons. */
export function calculateCoulombForceMagnitude(
  chargeOneCoulombs: number,
  chargeTwoCoulombs: number,
  separationMeters: number,
): number {
  assertFiniteNumber(chargeOneCoulombs, "chargeOneCoulombs");
  assertFiniteNumber(chargeTwoCoulombs, "chargeTwoCoulombs");
  assertPositive(separationMeters, "separationMeters");
  return (
    (COULOMB_CONSTANT * Math.abs(chargeOneCoulombs * chargeTwoCoulombs)) /
    separationMeters ** 2
  );
}

/** Electric field (N/C) at `point` due to one point charge. */
export function calculateElectricFieldFromCharge(
  source: PointCharge,
  point: Vector2,
): Vector2 {
  assertFiniteNumber(source.chargeCoulombs, "chargeCoulombs");
  const offset = point.subtract(source.position);
  const distance = offset.magnitude;
  if (distance === 0) {
    throw new RangeError("The field is undefined at the position of the charge.");
  }
  return offset.scale(
    (COULOMB_CONSTANT * source.chargeCoulombs) / distance ** 3,
  );
}

/** Net electric field (N/C) at `point` from several charges, by superposition. */
export function calculateElectricField(
  sources: readonly PointCharge[],
  point: Vector2,
): Vector2 {
  return sources.reduce(
    (total, source) => total.add(calculateElectricFieldFromCharge(source, point)),
    Vector2.zero(),
  );
}

/** Force (N) on a test charge placed in a field: F = q E. */
export function calculateForceOnCharge(
  testChargeCoulombs: number,
  field: Vector2,
): Vector2 {
  assertFiniteNumber(testChargeCoulombs, "testChargeCoulombs");
  return field.scale(testChargeCoulombs);
}

/** Distance (m) at which a charge q produces a force of the given magnitude on a test charge. */
export function calculateDistanceFromForce(
  sourceChargeCoulombs: number,
  testChargeCoulombs: number,
  forceNewtons: number,
): number {
  assertFiniteNumber(sourceChargeCoulombs, "sourceChargeCoulombs");
  assertFiniteNumber(testChargeCoulombs, "testChargeCoulombs");
  assertPositive(forceNewtons, "forceNewtons");
  if (sourceChargeCoulombs === 0 || testChargeCoulombs === 0) {
    throw new RangeError("Both charges must be non-zero.");
  }
  return Math.sqrt(
    (COULOMB_CONSTANT * Math.abs(sourceChargeCoulombs * testChargeCoulombs)) /
      forceNewtons,
  );
}

/**
 * Two charged balloons hanging from one point on strings of length L repel each other.
 * In equilibrium each string tilts by θ with tanθ = F/(m g), where F = k q₁ q₂ / d² and
 * the separation is d = 2 L sinθ. Solved by bisection on d. Equal masses are assumed, so
 * both strings tilt by the same angle even when the charges differ (Newton's third law).
 */
export function solveHangingSeparation(chargeA: number, chargeB: number, massKg: number, stringMeters: number, gravity = STANDARD_GRAVITY): number {
  if (!(massKg > 0) || !(stringMeters > 0)) {
    throw new RangeError("Mass and string length must be positive.");
  }
  const product = chargeA * chargeB;
  if (product <= 0) {
    return 0;
  }
  const k = COULOMB_CONSTANT;
  // f(d) = 2L sin(atan(F/mg)) − d decreases from positive to negative over (0, 2L).
  const f = (d: number) => 2 * stringMeters * Math.sin(Math.atan((k * product) / (d * d) / (massKg * gravity))) - d;
  let low = 1e-6;
  let high = 2 * stringMeters;
  for (let i = 0; i < 200; i += 1) {
    const middle = (low + high) / 2;
    if (f(middle) > 0) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
