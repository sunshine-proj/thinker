import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * The physics behind phone sensors.
 *
 * An accelerometer measures specific force: the acceleration of its proof mass relative to the case, which equals
 * a − g for a phone with acceleration a in gravity g. At rest it reads g upward, in free fall it reads zero, and in an
 * elevator accelerating upward at a it reads g + a. Tilted by θ from flat, the component along an in-plane axis is
 * g sinθ. A gyroscope reports angular velocity ω, so a rotation through an angle θ = ∫ω dt. A light sensor measures
 * illuminance, which for a small source of luminous intensity I falls as E = I cosφ / d² (inverse-square law) at
 * distance d and angle φ from the sensor's normal.
 *
 * Limitations: ideal noise-free sensors, constant angular rate, point-like light source in a dark room.
 */
export function calculateTiltedAccelerometerReading(tiltDegrees: number): number {
  return STANDARD_GRAVITY * Math.sin((tiltDegrees * Math.PI) / 180);
}

export function calculateTiltFromReading(readingMetersPerSecondSquared: number): number {
  if (!(Math.abs(readingMetersPerSecondSquared) <= STANDARD_GRAVITY)) {
    throw new RangeError("A reading above g cannot come from tilt alone.");
  }
  return (Math.asin(readingMetersPerSecondSquared / STANDARD_GRAVITY) * 180) / Math.PI;
}

/** Vertical reading of a phone lying flat in an elevator accelerating upward at `acceleration` (negative = downward). */
export function calculateElevatorReading(acceleration: number): number {
  return STANDARD_GRAVITY + acceleration;
}

export function calculateRotationAngleDegrees(angularRateDegreesPerSecond: number, durationSeconds: number): number {
  assertNonNegative(durationSeconds, "durationSeconds");
  return angularRateDegreesPerSecond * durationSeconds;
}

export function calculateIlluminance(luminousIntensityCandela: number, distanceMeters: number, incidenceDegrees = 0): number {
  assertPositive(luminousIntensityCandela, "luminousIntensityCandela");
  assertPositive(distanceMeters, "distanceMeters");
  if (incidenceDegrees < 0 || incidenceDegrees >= 90) {
    throw new RangeError("The incidence angle must be in [0, 90) degrees.");
  }
  return (luminousIntensityCandela * Math.cos((incidenceDegrees * Math.PI) / 180)) / distanceMeters ** 2;
}

export function calculateDistanceForIlluminance(luminousIntensityCandela: number, illuminanceLux: number): number {
  assertPositive(luminousIntensityCandela, "luminousIntensityCandela");
  assertPositive(illuminanceLux, "illuminanceLux");
  return Math.sqrt(luminousIntensityCandela / illuminanceLux);
}
