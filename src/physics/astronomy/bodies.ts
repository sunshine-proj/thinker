/**
 * Surface gravity of selected Solar System bodies, m/s² (NASA planetary fact sheets, rounded). Gravity is GM/R² and
 * ignores the small reduction at the equator caused by rotation.
 */
export interface Body_ {
  readonly id: string;
  readonly name: string;
  readonly surfaceGravity: number;
}

export const SURFACE_BODIES: readonly Body_[] = Object.freeze([
  { id: "earth", name: "Earth", surfaceGravity: 9.80665 },
  { id: "moon", name: "Moon", surfaceGravity: 1.62 },
  { id: "mars", name: "Mars", surfaceGravity: 3.71 },
  { id: "venus", name: "Venus", surfaceGravity: 8.87 },
  { id: "jupiter", name: "Jupiter (cloud tops)", surfaceGravity: 24.79 },
  { id: "titan", name: "Titan", surfaceGravity: 1.35 },
]);

export function findSurfaceBody(id: string): Body_ {
  const found = SURFACE_BODIES.find((body) => body.id === id);
  if (!found) {
    throw new RangeError(`Unknown body ${id}.`);
  }
  return found;
}
