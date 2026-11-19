import {
  advanceChargedParticleBoris,
  advanceChargedParticleRelativisticBoris,
  calculateKineticEnergy,
  calculateLorentzForce,
  calculateOrbitRadius,
  calculateRelativisticOrbitRadius,
  calculateRelativisticParticleKineticEnergy,
  getParticleSpecies,
  type ChargedParticle,
} from "../../physics/electromagnetism";
import {
  SPEED_OF_LIGHT,
  Vector3,
  assertFiniteNumber,
  assertNonNegative,
} from "../../physics/core";
import type { SimulationModel } from "../../simulation/engine";

export type ParticleKind = "electron" | "proton";

export interface ElectronTrajectoryParameters {
  readonly particle: ParticleKind;
  readonly speedMetersPerSecond: number;
  readonly pitchAngleDegrees: number;
  readonly magneticFieldMicroteslas: number;
  readonly magneticFieldReversed: boolean;
  /** Angle of B from the +Y axis, 0–180°. 0 keeps the original vertical field. */
  readonly fieldPolarDegrees: number;
  /** Direction of B's horizontal part, measured from +X toward +Z, 0–360°. */
  readonly fieldAzimuthDegrees: number;
  /** Advanced mode: relativistic Boris integration up to 0.99c (PRD §6.7). */
  readonly relativistic: boolean;
  readonly electricFieldVoltsPerMeter: number;
  readonly initialPositionMeters: Vector3;
  readonly targetChallengeEnabled: boolean;
}

export interface ElectronTrajectoryState extends ChargedParticle {
  readonly trail: readonly Vector3[];
  readonly targetHit: boolean;
}

export const ELECTRON_TRAJECTORY_TIME_STEP_SECONDS = 2e-8;
/** Classical playback: one wall-clock second shows one microsecond. */
export const CLASSICAL_TIME_SCALE = 1e-6;
/**
 * Relativistic mode uses stronger fields (up to 20 mT), so the cyclotron motion is
 * about a thousand times faster: the step and playback speed shrink by the same factor.
 */
export const RELATIVISTIC_TIME_STEP_SECONDS = 2e-11;
export const RELATIVISTIC_TIME_SCALE = 1e-9;
export const MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND =
  SPEED_OF_LIGHT * 0.1;
export const MAX_RELATIVISTIC_PARTICLE_SPEED_METERS_PER_SECOND =
  SPEED_OF_LIGHT * 0.99;

export function getSimulationTiming(parameters: Pick<ElectronTrajectoryParameters, "relativistic">) {
  return parameters.relativistic
    ? { fixedTimeStepSeconds: RELATIVISTIC_TIME_STEP_SECONDS, timeScale: RELATIVISTIC_TIME_SCALE }
    : { fixedTimeStepSeconds: ELECTRON_TRAJECTORY_TIME_STEP_SECONDS, timeScale: CLASSICAL_TIME_SCALE };
}
export const MAX_TRAJECTORY_POINTS = 1_200;
export const TARGET_POSITION_METERS = new Vector3(0.95, 0, -0.52);
export const TARGET_RADIUS_METERS = 0.07;

function isSegmentWithinTarget(start: Vector3, end: Vector3): boolean {
  const segment = end.subtract(start);
  const segmentLengthSquared = segment.magnitudeSquared;
  if (segmentLengthSquared === 0) {
    return start.distanceTo(TARGET_POSITION_METERS) <= TARGET_RADIUS_METERS;
  }

  const projection = TARGET_POSITION_METERS.subtract(start).dot(segment);
  const fraction = Math.min(1, Math.max(0, projection / segmentLengthSquared));
  const closestPoint = start.add(segment.scale(fraction));

  return closestPoint.distanceTo(TARGET_POSITION_METERS) <= TARGET_RADIUS_METERS;
}

export const DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS: ElectronTrajectoryParameters =
  Object.freeze({
    particle: "electron",
    speedMetersPerSecond: 2_000_000,
    pitchAngleDegrees: 90,
    magneticFieldMicroteslas: 10,
    magneticFieldReversed: false,
    fieldPolarDegrees: 0,
    fieldAzimuthDegrees: 0,
    relativistic: false,
    electricFieldVoltsPerMeter: 0,
    initialPositionMeters: Vector3.zero(),
    targetChallengeEnabled: false,
  });

/** Unit vector of the magnetic field direction (before reversal). */
export function getFieldDirection(
  parameters: Pick<ElectronTrajectoryParameters, "fieldPolarDegrees" | "fieldAzimuthDegrees">,
): Vector3 {
  const polar = (parameters.fieldPolarDegrees * Math.PI) / 180;
  const azimuth = (parameters.fieldAzimuthDegrees * Math.PI) / 180;
  return new Vector3(Math.sin(polar) * Math.cos(azimuth), Math.cos(polar), Math.sin(polar) * Math.sin(azimuth));
}

export function getMagneticField(
  parameters: ElectronTrajectoryParameters,
): Vector3 {
  const sign = parameters.magneticFieldReversed ? -1 : 1;
  return getFieldDirection(parameters).scale(sign * parameters.magneticFieldMicroteslas * 1e-6);
}

/**
 * Unit vectors for the launch: along the field axis b̂, and perpendicular to it p̂
 * (the part of +X across the field). For the default vertical field p̂ = +X, as
 * before. Reversing B does not move the launch, so a reversal changes only the
 * field and the learner sees the rotation flip.
 */
export function getLaunchBasis(parameters: ElectronTrajectoryParameters): { along: Vector3; across: Vector3 } {
  const along = getFieldDirection(parameters);
  const reference = Math.abs(along.x) > 0.999 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
  const across = reference.subtract(along.scale(reference.dot(along)));
  return { along, across: across.scale(1 / across.magnitude) };
}

function maximumSpeed(parameters: Pick<ElectronTrajectoryParameters, "relativistic">): number {
  return parameters.relativistic
    ? MAX_RELATIVISTIC_PARTICLE_SPEED_METERS_PER_SECOND
    : MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND;
}

export function getElectricField(
  parameters: ElectronTrajectoryParameters,
): Vector3 {
  return new Vector3(
    0,
    0,
    parameters.electricFieldVoltsPerMeter === 0
      ? 0
      : -parameters.electricFieldVoltsPerMeter,
  );
}

export function createInitialElectronTrajectoryState(
  parameters: ElectronTrajectoryParameters,
): ElectronTrajectoryState {
  assertNonNegative(
    parameters.speedMetersPerSecond,
    "speedMetersPerSecond",
  );

  if (parameters.relativistic) {
    if (parameters.speedMetersPerSecond > MAX_RELATIVISTIC_PARTICLE_SPEED_METERS_PER_SECOND) {
      throw new RangeError("Particle speed must stay at or below 0.99 times the speed of light.");
    }
  } else if (
    parameters.speedMetersPerSecond >=
    MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND
  ) {
    throw new RangeError(
      "Particle speed must remain below 0.1 times the speed of light in this classical model.",
    );
  }
  for (const [value, name, max] of [
    [parameters.fieldPolarDegrees, "fieldPolarDegrees", 180],
    [parameters.fieldAzimuthDegrees, "fieldAzimuthDegrees", 360],
  ] as const) {
    assertFiniteNumber(value, name);
    if (value < 0 || value > max) {
      throw new RangeError(`${name} must be between 0 and ${max}.`);
    }
  }

  assertFiniteNumber(parameters.pitchAngleDegrees, "pitchAngleDegrees");

  if (
    parameters.pitchAngleDegrees < 0 ||
    parameters.pitchAngleDegrees > 90
  ) {
    throw new RangeError("pitchAngleDegrees must be between 0 and 90.");
  }

  assertNonNegative(
    parameters.magneticFieldMicroteslas,
    "magneticFieldMicroteslas",
  );
  assertFiniteNumber(
    parameters.electricFieldVoltsPerMeter,
    "electricFieldVoltsPerMeter",
  );

  const angleRadians = (parameters.pitchAngleDegrees * Math.PI) / 180;
  const parallelSpeed =
    parameters.pitchAngleDegrees === 90
      ? 0
      : parameters.speedMetersPerSecond * Math.cos(angleRadians);
  const perpendicularSpeed = parameters.speedMetersPerSecond * Math.sin(angleRadians);
  // The launch is set relative to the field: across it (p̂) and along it (b̂).
  const { along, across } = getLaunchBasis(parameters);
  const velocity = across.scale(perpendicularSpeed).add(along.scale(parallelSpeed));
  const targetHit =
    parameters.targetChallengeEnabled &&
    isSegmentWithinTarget(
      parameters.initialPositionMeters,
      parameters.initialPositionMeters,
    );

  return {
    position: parameters.initialPositionMeters,
    velocity,
    trail: [parameters.initialPositionMeters],
    targetHit,
  };
}

export function createElectronTrajectoryModel(): SimulationModel<
  ElectronTrajectoryState,
  ElectronTrajectoryParameters
> {
  return {
    createInitialState: createInitialElectronTrajectoryState,
    step: (state, parameters, timeStepSeconds) => {
      const particle = getParticleSpecies(parameters.particle);
      const advance = parameters.relativistic
        ? advanceChargedParticleRelativisticBoris
        : advanceChargedParticleBoris;
      const next = advance(state, {
        chargeCoulombs: particle.chargeCoulombs,
        massKilograms: particle.massKilograms,
        electric: getElectricField(parameters),
        magnetic: getMagneticField(parameters),
        timeStepSeconds,
      });

      if (
        !parameters.relativistic &&
        next.velocity.magnitude >= maximumSpeed(parameters)
      ) {
        throw new RangeError(
          "The particle reached 0.1 times the speed of light. This simulation uses a non-relativistic model; reduce the electric field, switch on relativistic mode or reset the experiment.",
        );
      }

      const targetHit =
        parameters.targetChallengeEnabled &&
        isSegmentWithinTarget(state.position, next.position);
      const trail =
        state.trail.length >= MAX_TRAJECTORY_POINTS
          ? [...state.trail.slice(-MAX_TRAJECTORY_POINTS + 1), next.position]
          : [...state.trail, next.position];

      return {
        ...next,
        trail,
        targetHit: state.targetHit || targetHit,
      };
    },
    isComplete: (state, parameters) =>
      parameters.targetChallengeEnabled && state.targetHit,
  };
}

export function getElectronTrajectoryMeasurements(
  state: ElectronTrajectoryState,
  parameters: ElectronTrajectoryParameters,
) {
  const particle = getParticleSpecies(parameters.particle);
  const magneticField = getMagneticField(parameters);
  const electricField = getElectricField(parameters);

  return {
    speedMetersPerSecond: state.velocity.magnitude,
    forceNewtons: calculateLorentzForce(
      particle.chargeCoulombs,
      state.velocity,
      electricField,
      magneticField,
    ),
    orbitRadiusMeters: (parameters.relativistic ? calculateRelativisticOrbitRadius : calculateOrbitRadius)(
      particle.massKilograms,
      particle.chargeCoulombs,
      state.velocity,
      magneticField,
    ),
    kineticEnergyJoules: parameters.relativistic
      ? calculateRelativisticParticleKineticEnergy(particle.massKilograms, state.velocity)
      : calculateKineticEnergy(particle.massKilograms, state.velocity),
  };
}
