import { Vector2, assertFiniteNumber, assertPositive } from "../core";

/**
 * Geometric (ray) optics at a flat interface.
 *
 * Reflection: the reflected ray makes the same angle with the normal as the
 * incident ray (angle of incidence = angle of reflection), r = d − 2 (d·n) n.
 * Refraction: Snell's law n₁ sin θ₁ = n₂ sin θ₂. When light goes from a denser
 * to a less dense medium and sin θ₂ would exceed 1 (θ₁ above the critical
 * angle), there is no refracted ray and the light is totally internally reflected.
 *
 * Limitations: rays only (no diffraction or interference), non-dispersive media
 * (a single refractive index), and no partial reflection (Fresnel coefficients):
 * at each interface the ray either reflects or refracts, never splits.
 * Angles are in degrees measured from the surface normal.
 */

function assertUnit(vector: Vector2, name: string): void {
  if (Math.abs(vector.magnitude - 1) > 1e-9) {
    throw new RangeError(`${name} must be a unit vector.`);
  }
}

/** Reflects a direction about a surface with the given unit normal. */
export function reflect(direction: Vector2, normal: Vector2): Vector2 {
  assertUnit(normal, "normal");
  return direction.subtract(normal.scale(2 * direction.dot(normal)));
}

/**
 * Refracts a unit direction at an interface. `normal` is the unit normal on the
 * side the ray comes from (so direction · normal < 0). Returns null when the
 * ray is totally internally reflected.
 */
export function refract(
  direction: Vector2,
  normal: Vector2,
  incidentIndex: number,
  transmittedIndex: number,
): Vector2 | null {
  assertUnit(direction, "direction");
  assertUnit(normal, "normal");
  assertPositive(incidentIndex, "incidentIndex");
  assertPositive(transmittedIndex, "transmittedIndex");
  const cosIncident = -normal.dot(direction);
  if (cosIncident < 0) {
    throw new RangeError("The normal must face the incoming ray.");
  }

  const ratio = incidentIndex / transmittedIndex;
  const discriminant = 1 - ratio * ratio * (1 - cosIncident * cosIncident);
  if (discriminant < 0) {
    return null;
  }
  return direction
    .scale(ratio)
    .add(normal.scale(ratio * cosIncident - Math.sqrt(discriminant)));
}

/** Angle between a ray and the normal, in degrees (0 = along the normal). */
export function calculateIncidenceAngleDegrees(
  direction: Vector2,
  normal: Vector2,
): number {
  assertUnit(direction, "direction");
  assertUnit(normal, "normal");
  const cosine = Math.min(1, Math.max(-1, Math.abs(direction.dot(normal))));
  return (Math.acos(cosine) * 180) / Math.PI;
}

/** Snell's law: angle of refraction in degrees, or null for total internal reflection. */
export function calculateRefractionAngleDegrees(
  incidenceDegrees: number,
  incidentIndex: number,
  transmittedIndex: number,
): number | null {
  assertFiniteNumber(incidenceDegrees, "incidenceDegrees");
  if (incidenceDegrees < 0 || incidenceDegrees > 90) {
    throw new RangeError("incidenceDegrees must be between 0 and 90.");
  }
  assertPositive(incidentIndex, "incidentIndex");
  assertPositive(transmittedIndex, "transmittedIndex");
  const sine =
    (incidentIndex * Math.sin((incidenceDegrees * Math.PI) / 180)) /
    transmittedIndex;
  return sine > 1 ? null : (Math.asin(sine) * 180) / Math.PI;
}

/** Critical angle in degrees for light going from index n₁ to a lower index n₂; null if n₁ ≤ n₂. */
export function calculateCriticalAngleDegrees(
  incidentIndex: number,
  transmittedIndex: number,
): number | null {
  assertPositive(incidentIndex, "incidentIndex");
  assertPositive(transmittedIndex, "transmittedIndex");
  return incidentIndex > transmittedIndex
    ? (Math.asin(transmittedIndex / incidentIndex) * 180) / Math.PI
    : null;
}
