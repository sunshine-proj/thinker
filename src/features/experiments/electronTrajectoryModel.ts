import {
  advanceChargedParticleBoris,
  calculateKineticEnergy,
  calculateLorentzForce,
  calculateOrbitRadius,
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
  readonly electricFieldVoltsPerMeter: number;
  readonly initialPositionMeters: Vector3;
  readonly targetChallengeEnabled: boolean;
}

export interface ElectronTrajectoryState extends ChargedParticle {
  readonly trail: readonly Vector3[];
  readonly targetHit: boolean;
}

export const ELECTRON_TRAJECTORY_TIME_STEP_SECONDS = 2e-8;
export const MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND =
  SPEED_OF_LIGHT * 0.1;
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
    electricFieldVoltsPerMeter: 0,
    initialPositionMeters: Vector3.zero(),
    targetChallengeEnabled: false,
  });

export function getMagneticField(
  parameters: ElectronTrajectoryParameters,
): Vector3 {
  const sign = parameters.magneticFieldReversed ? -1 : 1;
  return new Vector3(
    0,
    sign * parameters.magneticFieldMicroteslas * 1e-6,
    0,
  );
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

  if (
    parameters.speedMetersPerSecond >=
    MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND
  ) {
    throw new RangeError(
      "Particle speed must remain below 0.1 times the speed of light in this classical model.",
    );
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
  const velocity = new Vector3(
    parameters.speedMetersPerSecond * Math.sin(angleRadians),
    parallelSpeed,
    0,
  );
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
      const next = advanceChargedParticleBoris(state, {
        chargeCoulombs: particle.chargeCoulombs,
        massKilograms: particle.massKilograms,
        electric: getElectricField(parameters),
        magnetic: getMagneticField(parameters),
        timeStepSeconds,
      });

      if (
        next.velocity.magnitude >=
        MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND
      ) {
        throw new RangeError(
          "The particle reached 0.1 times the speed of light. This simulation uses a non-relativistic model; reduce the electric field or reset the experiment.",
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
    orbitRadiusMeters: calculateOrbitRadius(
      particle.massKilograms,
      particle.chargeCoulombs,
      state.velocity,
      magneticField,
    ),
    kineticEnergyJoules: calculateKineticEnergy(
      particle.massKilograms,
      state.velocity,
    ),
  };
}
