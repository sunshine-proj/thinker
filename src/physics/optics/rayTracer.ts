import { Vector2, assertPositive } from "../core";
import {
  calculateIncidenceAngleDegrees,
  reflect,
  refract,
} from "./rayOptics";

/**
 * Traces a single ray through flat mirrors and rectangular glass blocks.
 * Uses the interface rules from rayOptics; coordinates are in arbitrary but
 * consistent length units (the games use centimeters).
 */
export interface MirrorElement {
  readonly kind: "mirror";
  readonly start: Vector2;
  readonly end: Vector2;
}

export interface BlockElement {
  readonly kind: "block";
  readonly min: Vector2;
  readonly max: Vector2;
  readonly refractiveIndex: number;
}

export type OpticalElement = MirrorElement | BlockElement;

export interface TargetDisc {
  readonly center: Vector2;
  readonly radius: number;
}

export interface OpticalScene {
  readonly elements: readonly OpticalElement[];
  readonly width: number;
  readonly height: number;
  readonly target?: TargetDisc;
}

export type TraceEventKind =
  | "reflection"
  | "refraction"
  | "total-internal-reflection";

export interface TraceEvent {
  readonly kind: TraceEventKind;
  readonly elementIndex: number;
  readonly point: Vector2;
  readonly incidenceDegrees: number;
  /** Angle in the second medium, or null for reflections. */
  readonly refractionDegrees: number | null;
}

export type TraceEnd = "target" | "boundary" | "max-interactions";

export interface TraceResult {
  readonly points: readonly Vector2[];
  readonly events: readonly TraceEvent[];
  readonly hitTarget: boolean;
  /** Smallest distance from the target's center to the beam, if there is a target. */
  readonly closestApproach: number | null;
  readonly end: TraceEnd;
}

interface Surface {
  readonly a: Vector2;
  readonly b: Vector2;
  readonly elementIndex: number;
  /** Outward unit normal for block faces; null for mirrors and walls. */
  readonly outward: Vector2 | null;
  readonly wall: boolean;
}

interface Hit {
  readonly distance: number;
  readonly surface: Surface;
  readonly point: Vector2;
}

const EPSILON = 1e-7;
export const AIR_INDEX = 1;

function surfacesOf(scene: OpticalScene): Surface[] {
  const surfaces: Surface[] = [];
  const { width, height } = scene;
  const corners = [new Vector2(0, 0), new Vector2(width, 0), new Vector2(width, height), new Vector2(0, height)];
  corners.forEach((corner, index) =>
    surfaces.push({
      a: corner,
      b: corners[(index + 1) % 4] as Vector2,
      elementIndex: -1,
      outward: null,
      wall: true,
    }),
  );

  scene.elements.forEach((element, elementIndex) => {
    if (element.kind === "mirror") {
      surfaces.push({ a: element.start, b: element.end, elementIndex, outward: null, wall: false });
      return;
    }
    const { min, max } = element;
    const faces: [Vector2, Vector2, Vector2][] = [
      [new Vector2(min.x, min.y), new Vector2(max.x, min.y), new Vector2(0, -1)],
      [new Vector2(max.x, min.y), new Vector2(max.x, max.y), new Vector2(1, 0)],
      [new Vector2(max.x, max.y), new Vector2(min.x, max.y), new Vector2(0, 1)],
      [new Vector2(min.x, max.y), new Vector2(min.x, min.y), new Vector2(-1, 0)],
    ];
    faces.forEach(([a, b, outward]) =>
      surfaces.push({ a, b, elementIndex, outward, wall: false }),
    );
  });
  return surfaces;
}

function intersect(origin: Vector2, direction: Vector2, surface: Surface): Hit | null {
  const edge = surface.b.subtract(surface.a);
  const denominator = direction.cross(edge);
  if (Math.abs(denominator) < 1e-12) {
    return null;
  }
  const offset = surface.a.subtract(origin);
  const distance = offset.cross(edge) / denominator;
  const along = offset.cross(direction) / denominator;
  if (distance <= EPSILON || along < -1e-9 || along > 1 + 1e-9) {
    return null;
  }
  return { distance, surface, point: origin.add(direction.scale(distance)) };
}

/** Distance along the ray (within `limit`) at which it first enters the disc, or null. */
function firstDiscEntry(origin: Vector2, direction: Vector2, limit: number, disc: TargetDisc): number | null {
  const toCenter = disc.center.subtract(origin);
  const along = toCenter.dot(direction);
  const perpendicularSquared = toCenter.magnitudeSquared - along * along;
  const halfChordSquared = disc.radius ** 2 - perpendicularSquared;
  if (halfChordSquared < 0) {
    return null;
  }
  const entry = along - Math.sqrt(halfChordSquared);
  const exit = along + Math.sqrt(halfChordSquared);
  const start = Math.max(entry, 0);
  return exit >= 0 && start <= limit ? start : null;
}

function distanceToSegment(point: Vector2, a: Vector2, b: Vector2): number {
  const edge = b.subtract(a);
  const lengthSquared = edge.magnitudeSquared;
  const fraction = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, point.subtract(a).dot(edge) / lengthSquared));
  return point.distanceTo(a.add(edge.scale(fraction)));
}

/** Follows a ray from `origin` along `direction` until it hits the target, leaves the scene, or is capped. */
export function traceRay(
  scene: OpticalScene,
  origin: Vector2,
  direction: Vector2,
  maximumInteractions = 30,
): TraceResult {
  assertPositive(scene.width, "width");
  assertPositive(scene.height, "height");
  if (direction.magnitude === 0) {
    throw new RangeError("The ray direction must not be zero.");
  }

  const surfaces = surfacesOf(scene);
  const points: Vector2[] = [origin];
  const events: TraceEvent[] = [];
  let position = origin;
  let heading = direction.normalize();
  let closestApproach: number | null = null;
  let end: TraceEnd = "max-interactions";
  let hitTarget = false;

  for (let step = 0; step <= maximumInteractions; step += 1) {
    let nearest: Hit | null = null;
    for (const surface of surfaces) {
      const hit = intersect(position, heading, surface);
      if (hit && (nearest === null || hit.distance < nearest.distance)) {
        nearest = hit;
      }
    }
    if (nearest === null) {
      end = "boundary";
      break;
    }

    if (scene.target) {
      const entry = firstDiscEntry(position, heading, nearest.distance, scene.target);
      const closest = distanceToSegment(scene.target.center, position, nearest.point);
      closestApproach = closestApproach === null ? closest : Math.min(closestApproach, closest);
      if (entry !== null) {
        points.push(position.add(heading.scale(entry)));
        hitTarget = true;
        end = "target";
        break;
      }
    }

    points.push(nearest.point);
    const { surface } = nearest;
    if (surface.wall) {
      end = "boundary";
      break;
    }
    if (step === maximumInteractions) {
      break;
    }

    const element = scene.elements[surface.elementIndex] as OpticalElement;
    if (element.kind === "mirror") {
      const edge = surface.b.subtract(surface.a).normalize();
      let normal = new Vector2(-edge.y, edge.x);
      if (normal.dot(heading) > 0) {
        normal = normal.scale(-1);
      }
      events.push({
        kind: "reflection",
        elementIndex: surface.elementIndex,
        point: nearest.point,
        incidenceDegrees: calculateIncidenceAngleDegrees(heading, normal),
        refractionDegrees: null,
      });
      heading = reflect(heading, normal).normalize();
    } else {
      const outward = surface.outward as Vector2;
      const entering = heading.dot(outward) < 0;
      const facing = entering ? outward : outward.scale(-1);
      const n1 = entering ? AIR_INDEX : element.refractiveIndex;
      const n2 = entering ? element.refractiveIndex : AIR_INDEX;
      const incidence = calculateIncidenceAngleDegrees(heading, facing);
      const transmitted = refract(heading, facing, n1, n2);

      if (transmitted === null) {
        events.push({
          kind: "total-internal-reflection",
          elementIndex: surface.elementIndex,
          point: nearest.point,
          incidenceDegrees: incidence,
          refractionDegrees: null,
        });
        heading = reflect(heading, facing).normalize();
      } else {
        heading = transmitted.normalize();
        events.push({
          kind: "refraction",
          elementIndex: surface.elementIndex,
          point: nearest.point,
          incidenceDegrees: incidence,
          refractionDegrees: calculateIncidenceAngleDegrees(heading, facing.scale(-1)),
        });
      }
    }
    position = nearest.point;
  }

  return { points, events, hitTarget, closestApproach, end };
}
