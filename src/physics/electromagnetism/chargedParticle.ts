import {
  ELECTRON_CHARGE,
  ELECTRON_MASS,
  PROTON_MASS,
  SPEED_OF_LIGHT,
  Vector3,
  assertFiniteNumber,
  assertPositive,
} from "../core";

export interface ChargedParticle {
  readonly position: Vector3;
  readonly velocity: Vector3;
}

export interface ElectromagneticField {
  readonly electric: Vector3;
  readonly magnetic: Vector3;
}

export interface ChargedParticleStepParameters
  extends ElectromagneticField {
  readonly chargeCoulombs: number;
  readonly massKilograms: number;
  readonly timeStepSeconds: number;
}

export interface ParticleSpecies {
  readonly chargeCoulombs: number;
  readonly massKilograms: number;
}

export const ELECTRON: ParticleSpecies = Object.freeze({
  chargeCoulombs: ELECTRON_CHARGE,
  massKilograms: ELECTRON_MASS,
});

export const PROTON: ParticleSpecies = Object.freeze({
  chargeCoulombs: -ELECTRON_CHARGE,
  massKilograms: PROTON_MASS,
});

export function getParticleSpecies(
  species: "electron" | "proton",
): ParticleSpecies {
  switch (species) {
    case "electron":
      return ELECTRON;
    case "proton":
      return PROTON;
    default:
      throw new RangeError(`Unsupported particle species: ${species}.`);
  }
}

export function calculateLorentzForce(
  chargeCoulombs: number,
  velocityMetersPerSecond: Vector3,
  electricFieldVoltsPerMeter: Vector3,
  magneticFieldTeslas: Vector3,
): Vector3 {
  assertFiniteNumber(chargeCoulombs, "chargeCoulombs");

  return electricFieldVoltsPerMeter
    .add(velocityMetersPerSecond.cross(magneticFieldTeslas))
    .scale(chargeCoulombs);
}

export function calculateParticleAcceleration(
  forceNewtons: Vector3,
  massKilograms: number,
): Vector3 {
  assertPositive(massKilograms, "massKilograms");
  return forceNewtons.scale(1 / massKilograms);
}

/**
 * Advances a non-relativistic charged particle by one SI time step.
 *
 * Boris rotation is time-centered and preserves speed to round-off in a
 * magnetic-only field. It assumes constant, spatially uniform fields over the
 * step; radiation, collisions, and relativistic effects are not modeled.
 */
export function advanceChargedParticleBoris(
  particle: ChargedParticle,
  parameters: ChargedParticleStepParameters,
): ChargedParticle {
  const {
    chargeCoulombs,
    massKilograms,
    electric,
    magnetic,
    timeStepSeconds,
  } = parameters;
  assertFiniteNumber(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  assertPositive(timeStepSeconds, "timeStepSeconds");

  const halfAcceleration = (chargeCoulombs / massKilograms) *
    (timeStepSeconds / 2);
  const velocityMinus = particle.velocity.add(
    electric.scale(halfAcceleration),
  );
  const rotation = magnetic.scale(
    (chargeCoulombs / massKilograms) * (timeStepSeconds / 2),
  );
  const rotationScale = rotation.scale(
    2 / (1 + rotation.magnitudeSquared),
  );
  const velocityPrime = velocityMinus.add(velocityMinus.cross(rotation));
  const velocityPlus = velocityMinus.add(velocityPrime.cross(rotationScale));
  const velocity = velocityPlus.add(electric.scale(halfAcceleration));

  return {
    position: particle.position.add(
      particle.velocity.add(velocity).scale(timeStepSeconds / 2),
    ),
    velocity,
  };
}

export function calculatePerpendicularSpeed(
  velocityMetersPerSecond: Vector3,
  magneticFieldTeslas: Vector3,
): number {
  const fieldMagnitude = magneticFieldTeslas.magnitude;

  if (fieldMagnitude === 0) {
    return 0;
  }

  const fieldDirection = magneticFieldTeslas.scale(1 / fieldMagnitude);
  const parallelVelocity = fieldDirection.scale(
    velocityMetersPerSecond.dot(fieldDirection),
  );

  return velocityMetersPerSecond.subtract(parallelVelocity).magnitude;
}

/** Returns null when the magnetic field is zero. */
export function calculateCyclotronAngularFrequency(
  chargeCoulombs: number,
  massKilograms: number,
  magneticFieldTeslas: Vector3,
): number | null {
  assertFiniteNumber(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  const fieldMagnitude = magneticFieldTeslas.magnitude;

  return fieldMagnitude === 0
    ? null
    : (Math.abs(chargeCoulombs) * fieldMagnitude) / massKilograms;
}

/** Returns null when the magnetic field is zero. */
export function calculateCyclotronFrequency(
  chargeCoulombs: number,
  massKilograms: number,
  magneticFieldTeslas: Vector3,
): number | null {
  const angularFrequency = calculateCyclotronAngularFrequency(
    chargeCoulombs,
    massKilograms,
    magneticFieldTeslas,
  );

  return angularFrequency === null
    ? null
    : angularFrequency / (2 * Math.PI);
}

/** Returns null when the magnetic field or particle charge is zero. */
export function calculateCyclotronPeriod(
  chargeCoulombs: number,
  massKilograms: number,
  magneticFieldTeslas: Vector3,
): number | null {
  const angularFrequency = calculateCyclotronAngularFrequency(
    chargeCoulombs,
    massKilograms,
    magneticFieldTeslas,
  );

  return angularFrequency === null || angularFrequency === 0
    ? null
    : (2 * Math.PI) / angularFrequency;
}

/**
 * Calculates instantaneous gyroradius for a uniform field and classical speed.
 * The radius is zero when there is no perpendicular velocity.
 */
export function calculateOrbitRadius(
  massKilograms: number,
  chargeCoulombs: number,
  velocityMetersPerSecond: Vector3,
  magneticFieldTeslas: Vector3,
): number | null {
  assertPositive(massKilograms, "massKilograms");
  assertFiniteNumber(chargeCoulombs, "chargeCoulombs");
  const fieldMagnitude = magneticFieldTeslas.magnitude;

  if (fieldMagnitude === 0) {
    return null;
  }

  if (chargeCoulombs === 0) {
    return null;
  }

  const perpendicularSpeed = calculatePerpendicularSpeed(
    velocityMetersPerSecond,
    magneticFieldTeslas,
  );

  return (
    (massKilograms * perpendicularSpeed) /
    (Math.abs(chargeCoulombs) * fieldMagnitude)
  );
}

export function calculateKineticEnergy(
  massKilograms: number,
  velocityMetersPerSecond: Vector3,
): number {
  assertPositive(massKilograms, "massKilograms");
  return 0.5 * massKilograms * velocityMetersPerSecond.magnitudeSquared;
}

/**
 * Advances a charged particle by one step with the relativistic Boris scheme.
 *
 * Works with u = γv (momentum per unit rest mass): half electric kick, magnetic
 * rotation with t = qB Δt/(2γm) using γ of the half-kicked momentum, second half
 * kick. In a pure magnetic field |u|, and so the speed and γ, are preserved to
 * round-off; in any field the speed stays below c. Reduces to the classical Boris
 * step when v ≪ c. Assumptions as for the classical step (uniform, constant fields
 * over the step; no radiation reaction). The state velocity is ordinary v = u/γ.
 */
export function advanceChargedParticleRelativisticBoris(
  particle: ChargedParticle,
  parameters: ChargedParticleStepParameters,
): ChargedParticle {
  const { chargeCoulombs, massKilograms, electric, magnetic, timeStepSeconds } = parameters;
  assertFiniteNumber(chargeCoulombs, "chargeCoulombs");
  assertPositive(massKilograms, "massKilograms");
  assertPositive(timeStepSeconds, "timeStepSeconds");
  const c2 = SPEED_OF_LIGHT ** 2;
  const speedSquared = particle.velocity.magnitudeSquared;
  if (speedSquared >= c2) {
    throw new RangeError("A particle with mass must move slower than light.");
  }
  const gammaOf = (u: Vector3) => Math.sqrt(1 + u.magnitudeSquared / c2);
  const u = particle.velocity.scale(1 / Math.sqrt(1 - speedSquared / c2));
  const halfKick = (chargeCoulombs / massKilograms) * (timeStepSeconds / 2);
  const uMinus = u.add(electric.scale(halfKick));
  const rotation = magnetic.scale(halfKick / gammaOf(uMinus));
  const rotationScale = rotation.scale(2 / (1 + rotation.magnitudeSquared));
  const uPrime = uMinus.add(uMinus.cross(rotation));
  const uPlus = uMinus.add(uPrime.cross(rotationScale));
  const uNext = uPlus.add(electric.scale(halfKick));
  const velocity = uNext.scale(1 / gammaOf(uNext));
  return {
    position: particle.position.add(particle.velocity.add(velocity).scale(timeStepSeconds / 2)),
    velocity,
  };
}

/** Lorentz factor of a velocity, 1/√(1 − v²/c²). */
export function calculateParticleLorentzFactor(velocityMetersPerSecond: Vector3): number {
  const beta2 = velocityMetersPerSecond.magnitudeSquared / SPEED_OF_LIGHT ** 2;
  if (beta2 >= 1) {
    throw new RangeError("A particle with mass must move slower than light.");
  }
  return 1 / Math.sqrt(1 - beta2);
}

/** Relativistic gyroradius γ m v⊥ / (|q| B); null when the field is zero. */
export function calculateRelativisticOrbitRadius(
  massKilograms: number,
  chargeCoulombs: number,
  velocityMetersPerSecond: Vector3,
  magneticFieldTeslas: Vector3,
): number | null {
  const classical = calculateOrbitRadius(massKilograms, chargeCoulombs, velocityMetersPerSecond, magneticFieldTeslas);
  return classical === null ? null : classical * calculateParticleLorentzFactor(velocityMetersPerSecond);
}

/** Relativistic kinetic energy (γ − 1) m c², J. */
export function calculateRelativisticParticleKineticEnergy(massKilograms: number, velocityMetersPerSecond: Vector3): number {
  assertPositive(massKilograms, "massKilograms");
  return (calculateParticleLorentzFactor(velocityMetersPerSecond) - 1) * massKilograms * SPEED_OF_LIGHT ** 2;
}

/** Relativistic cyclotron frequency |q| B / (2π γ m), Hz; null when the field is zero. */
export function calculateRelativisticCyclotronFrequency(
  chargeCoulombs: number,
  massKilograms: number,
  magneticFieldTeslas: Vector3,
  velocityMetersPerSecond: Vector3,
): number | null {
  const classical = calculateCyclotronFrequency(chargeCoulombs, massKilograms, magneticFieldTeslas);
  return classical === null ? null : classical / calculateParticleLorentzFactor(velocityMetersPerSecond);
}
