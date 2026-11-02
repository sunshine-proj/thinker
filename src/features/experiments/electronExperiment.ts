import { Vector3, SPEED_OF_LIGHT } from "../../physics/core";
import {
  calculateCyclotronPeriod,
  getParticleSpecies,
} from "../../physics/electromagnetism";
import {
  createMeasurement,
  formatMeasurementValue,
  type ExperimentMeasurement,
} from "../../simulation/measurements";
import {
  getElectronTrajectoryMeasurements,
  getMagneticField,
  type ElectronTrajectoryParameters,
  type ElectronTrajectoryState,
} from "./electronTrajectoryModel";

export const ELECTRON_EXPERIMENT_ID = "electron-trajectory-lab";
export const ELECTRON_EXPERIMENT_NAME = "Electron Trajectory Lab";

/** Slider limits shared by the page controls and by validation of saved setups. */
export const ELECTRON_LIMITS = Object.freeze({
  maxFieldMicroteslas: 20,
  maxElectricFieldVoltsPerMeter: 20,
  maxEntryPositionMeters: 0.5,
  maxSpeedMetersPerSecond: 29_000_000,
});

/** Measurements of the current run, in a form that can be saved and compared. */
export function collectElectronMeasurements(
  state: ElectronTrajectoryState,
  parameters: ElectronTrajectoryParameters,
  timeSeconds: number,
): ExperimentMeasurement[] {
  const measured = getElectronTrajectoryMeasurements(state, parameters);
  const particle = getParticleSpecies(parameters.particle);

  return [
    createMeasurement("speed", "Particle speed", measured.speedMetersPerSecond, "m/s"),
    createMeasurement("force", "Lorentz force", measured.forceNewtons.magnitude, "N"),
    createMeasurement("gyroradius", "Gyroradius", measured.orbitRadiusMeters, "m"),
    createMeasurement(
      "period",
      "Cyclotron period",
      calculateCyclotronPeriod(
        particle.chargeCoulombs,
        particle.massKilograms,
        getMagneticField(parameters),
      ),
      "s",
    ),
    createMeasurement("energy", "Kinetic energy", measured.kineticEnergyJoules, "J"),
    createMeasurement("time", "Simulation time", timeSeconds, "s"),
  ];
}

export function serializeElectronParameters(
  parameters: ElectronTrajectoryParameters,
): Record<string, unknown> {
  return {
    particle: parameters.particle,
    speedMetersPerSecond: parameters.speedMetersPerSecond,
    pitchAngleDegrees: parameters.pitchAngleDegrees,
    magneticFieldMicroteslas: parameters.magneticFieldMicroteslas,
    magneticFieldReversed: parameters.magneticFieldReversed,
    electricFieldVoltsPerMeter: parameters.electricFieldVoltsPerMeter,
    initialPositionMeters: {
      x: parameters.initialPositionMeters.x,
      y: parameters.initialPositionMeters.y,
      z: parameters.initialPositionMeters.z,
    },
    targetChallengeEnabled: parameters.targetChallengeEnabled,
  };
}

function isNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

/** Rebuilds parameters from stored data; returns null for anything out of range. */
export function parseElectronParameters(
  raw: unknown,
): ElectronTrajectoryParameters | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const data = raw as Record<string, unknown>;
  const position = data.initialPositionMeters as Record<string, unknown> | undefined;
  const limit = ELECTRON_LIMITS.maxEntryPositionMeters;

  if (
    (data.particle !== "electron" && data.particle !== "proton") ||
    !isNumberInRange(data.speedMetersPerSecond, 0, ELECTRON_LIMITS.maxSpeedMetersPerSecond) ||
    !isNumberInRange(data.pitchAngleDegrees, 0, 90) ||
    !isNumberInRange(data.magneticFieldMicroteslas, 0, ELECTRON_LIMITS.maxFieldMicroteslas) ||
    typeof data.magneticFieldReversed !== "boolean" ||
    !isNumberInRange(
      data.electricFieldVoltsPerMeter,
      -ELECTRON_LIMITS.maxElectricFieldVoltsPerMeter,
      ELECTRON_LIMITS.maxElectricFieldVoltsPerMeter,
    ) ||
    typeof position !== "object" ||
    position === null ||
    !isNumberInRange(position.x, -limit, limit) ||
    !isNumberInRange(position.y, -limit, limit) ||
    !isNumberInRange(position.z, -limit, limit) ||
    typeof data.targetChallengeEnabled !== "boolean"
  ) {
    return null;
  }

  return {
    particle: data.particle,
    speedMetersPerSecond: data.speedMetersPerSecond,
    pitchAngleDegrees: data.pitchAngleDegrees,
    magneticFieldMicroteslas: data.magneticFieldMicroteslas,
    magneticFieldReversed: data.magneticFieldReversed,
    electricFieldVoltsPerMeter: data.electricFieldVoltsPerMeter,
    initialPositionMeters: new Vector3(position.x, position.y, position.z),
    targetChallengeEnabled: data.targetChallengeEnabled,
  };
}

export function describeElectronSetup(parameters: ElectronTrajectoryParameters): string {
  const field = `${parameters.magneticFieldReversed ? "−" : "+"}${parameters.magneticFieldMicroteslas.toFixed(1)} µT`;
  const electric =
    parameters.electricFieldVoltsPerMeter === 0
      ? ""
      : ` · E ${parameters.electricFieldVoltsPerMeter} V/m`;
  return `${parameters.particle === "electron" ? "Electron" : "Proton"} · ${formatMeasurementValue(parameters.speedMetersPerSecond, "m/s")} at ${parameters.pitchAngleDegrees}° · B ${field}${electric}`;
}

export interface ResultExplanation {
  readonly title: string;
  readonly text: string;
}

/**
 * Explains what the current setup should do and why, using the learner's own
 * numbers. Statements follow from F = q(E + v × B) for the non-relativistic
 * uniform-field model used by the lab.
 */
export function explainElectronResult(
  parameters: ElectronTrajectoryParameters,
): ResultExplanation[] {
  const particle = getParticleSpecies(parameters.particle);
  const name = parameters.particle === "electron" ? "electron" : "proton";
  const speed = parameters.speedMetersPerSecond;
  const fieldTesla = parameters.magneticFieldMicroteslas * 1e-6;
  const electric = parameters.electricFieldVoltsPerMeter;
  const explanations: ResultExplanation[] = [];

  if (speed === 0 && electric === 0) {
    return [
      {
        title: "Nothing pushes the particle",
        text: "A particle at rest feels no magnetic force, because F = qv × B is zero when v = 0. With no electric field it stays where it started.",
      },
    ];
  }

  const perpendicularSpeed =
    speed * Math.sin((parameters.pitchAngleDegrees * Math.PI) / 180);
  const parallelSpeed =
    speed * Math.cos((parameters.pitchAngleDegrees * Math.PI) / 180);

  if (fieldTesla === 0) {
    explanations.push({
      title: electric === 0 ? "Straight line" : "Pushed by the electric field",
      text:
        electric === 0
          ? "With no magnetic or electric field there is no force, so Newton's first law applies: the particle keeps its velocity and travels in a straight line."
          : "With no magnetic field only the electric force qE acts, so the particle accelerates along the field line and its speed changes.",
    });
    return explanations;
  }

  const radius =
    (particle.massKilograms * perpendicularSpeed) /
    (Math.abs(particle.chargeCoulombs) * fieldTesla);
  const period = calculateCyclotronPeriod(
    particle.chargeCoulombs,
    particle.massKilograms,
    getMagneticField(parameters),
  );
  const pitch = period === null ? 0 : parallelSpeed * period;

  if (electric === 0) {
    if (perpendicularSpeed === 0) {
      explanations.push({
        title: "Moving along the field",
        text: `The velocity is parallel to B, so v × B = 0 and there is no magnetic force. The ${name} keeps moving in a straight line at ${formatMeasurementValue(speed, "m/s")}.`,
      });
    } else {
      explanations.push({
        title: parallelSpeed < 1e-9 * speed ? "Circular motion" : "Helical motion",
        text:
          parallelSpeed < 1e-9 * speed
            ? `The magnetic force is always perpendicular to the velocity, so it only turns the ${name}. Balancing it against the centripetal requirement gives r = mv/(|q|B) = ${formatMeasurementValue(radius, "m")}.`
            : `The velocity splits into v⊥ = ${formatMeasurementValue(perpendicularSpeed, "m/s")}, which circles with r = mv⊥/(|q|B) = ${formatMeasurementValue(radius, "m")}, and v∥ = ${formatMeasurementValue(parallelSpeed, "m/s")}, which is unaffected. Together they make a helix advancing ${formatMeasurementValue(pitch, "m")} per turn.`,
      });
      explanations.push({
        title: "Why the speed does not change",
        text: "The magnetic force does no work because it is perpendicular to the motion (W = F · d = 0). Kinetic energy stays constant; only the direction of the velocity changes.",
      });
    }
    explanations.push({
      title: "Sign of the charge",
      text:
        parameters.particle === "electron"
          ? "The electron is negative (q = −e), so the force qv × B points opposite to the direction a positive charge would be pushed. Reverse the field or switch to a proton to see the rotation direction flip."
          : "The proton is positive (q = +e), so it turns the opposite way to an electron in the same field. It is also about 1836 times heavier, so its orbit is much larger at the same speed.",
    });
    if (period !== null) {
      explanations.push({
        title: "Orbit time",
        text: `One turn takes T = 2πm/(|q|B) = ${formatMeasurementValue(period, "s")}. This does not depend on the speed: a faster particle moves on a larger circle in the same time.`,
      });
    }
    return explanations;
  }

  // Crossed fields. With B along ±Y and E along −Z, a beam entering along +X is
  // undeflected when E/B (signed) equals its speed perpendicular to B.
  const signedField = parameters.magneticFieldReversed ? -fieldTesla : fieldTesla;
  const driftSpeed = electric / signedField;
  const balanced =
    perpendicularSpeed > 0 &&
    Math.abs(driftSpeed - perpendicularSpeed) <= 0.02 * perpendicularSpeed;
  explanations.push({
    title: balanced ? "Forces balance" : "Crossed electric and magnetic fields",
    text: balanced
      ? `Here E/B = ${formatMeasurementValue(Math.abs(driftSpeed), "m/s")} matches the particle's speed across the field, so the electric and magnetic forces cancel (qE = qvB) and it travels in a nearly straight line. This is how a velocity selector works.`
      : `The electric force qE and magnetic force qv × B act together, so the path is neither a circle nor a straight line. For this field direction the two forces cancel only when the speed across B equals E/B = ${formatMeasurementValue(driftSpeed, "m/s")}${driftSpeed < 0 ? " (a negative value means they add instead of cancelling)" : ""}. Kinetic energy can change because the electric field does work on the particle.`,
  });
  if (Math.abs(driftSpeed) >= SPEED_OF_LIGHT * 0.1) {
    explanations.push({
      title: "Outside the classical model",
      text: "This balance speed is above 0.1 c, where relativistic effects matter. The lab's classical model would stop here.",
    });
  }
  return explanations;
}
