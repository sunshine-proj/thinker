import { describe, expect, it } from "vitest";
import { Vector2 } from "../../src/physics/core";
import {
  calculateCriticalAngleDegrees,
  calculateIncidenceAngleDegrees,
  calculateRefractionAngleDegrees,
  reflect,
  refract,
  traceRay,
  type OpticalScene,
} from "../../src/physics/optics";

const unit = (degrees: number) => Vector2.fromAngle((degrees * Math.PI) / 180);
const degreesOf = (v: Vector2) => (v.angleRadians * 180) / Math.PI;

describe("reflection", () => {
  it("obeys the law of reflection: angle in equals angle out", () => {
    const normal = new Vector2(0, 1);
    const incoming = unit(-30); // 60° from the normal, travelling down and right
    const outgoing = reflect(incoming, normal);

    expect(degreesOf(outgoing)).toBeCloseTo(30, 10);
    expect(calculateIncidenceAngleDegrees(incoming, normal)).toBeCloseTo(60, 10);
    expect(calculateIncidenceAngleDegrees(outgoing, normal)).toBeCloseTo(60, 10);
  });

  it("returns a ray hitting head-on straight back and preserves length", () => {
    const outgoing = reflect(new Vector2(0, -1), new Vector2(0, 1));
    expect(outgoing.x).toBeCloseTo(0, 12);
    expect(outgoing.y).toBeCloseTo(1, 12);
  });

  it("rejects a non-unit normal", () => {
    expect(() => reflect(new Vector2(1, 0), new Vector2(0, 2))).toThrow(RangeError);
  });
});

describe("refraction (Snell's law)", () => {
  it("bends toward the normal entering glass: 30° in air → 19.47° in n = 1.5", () => {
    expect(calculateRefractionAngleDegrees(30, 1, 1.5)).toBeCloseTo(19.4712, 3);
  });

  it("gives the same angle from the vector form and the scalar form", () => {
    const normal = new Vector2(-1, 0); // facing the incoming ray from the left
    const incoming = unit(30);
    const transmitted = refract(incoming, normal, 1, 1.5) as Vector2;

    expect(degreesOf(transmitted)).toBeCloseTo(19.4712, 3);
    expect(transmitted.magnitude).toBeCloseTo(1, 12);
  });

  it("does not bend at normal incidence or with equal indices", () => {
    expect(calculateRefractionAngleDegrees(0, 1, 1.5)).toBe(0);
    expect(calculateRefractionAngleDegrees(40, 1.33, 1.33)).toBeCloseTo(40, 10);
  });

  it("is reversible: refracting back returns the original angle", () => {
    const inside = calculateRefractionAngleDegrees(50, 1, 1.5) as number;
    expect(calculateRefractionAngleDegrees(inside, 1.5, 1)).toBeCloseTo(50, 10);
  });

  it("has a critical angle of 41.81° for glass to air and none for air to glass", () => {
    expect(calculateCriticalAngleDegrees(1.5, 1)).toBeCloseTo(41.8103, 3);
    expect(calculateCriticalAngleDegrees(1, 1.5)).toBeNull();
  });

  it("totally internally reflects above the critical angle only", () => {
    expect(calculateRefractionAngleDegrees(41, 1.5, 1)).not.toBeNull();
    expect(calculateRefractionAngleDegrees(42, 1.5, 1)).toBeNull();
    expect(refract(unit(-45), new Vector2(0, 1), 1.5, 1)).toBeNull();
  });

  it("validates inputs", () => {
    expect(() => calculateRefractionAngleDegrees(100, 1, 1.5)).toThrow(RangeError);
    expect(() => calculateRefractionAngleDegrees(10, 0, 1.5)).toThrow(RangeError);
    expect(() => refract(unit(30), new Vector2(1, 0), 1, 1.5)).toThrow(/face the incoming/);
  });
});

const arena = (elements: OpticalScene["elements"], target?: OpticalScene["target"]): OpticalScene => ({
  elements, width: 100, height: 100, target,
});
const mirrorAt = (center: Vector2, angleDegrees: number, length = 30) => {
  const half = unit(angleDegrees).scale(length / 2);
  return { kind: "mirror" as const, start: center.subtract(half), end: center.add(half) };
};

describe("ray tracer", () => {
  it("travels straight to the boundary with no elements", () => {
    const result = traceRay(arena([]), new Vector2(10, 50), new Vector2(1, 0));
    expect(result.end).toBe("boundary");
    expect(result.points.at(-1)?.x).toBeCloseTo(100, 8);
    expect(result.events).toHaveLength(0);
  });

  it("reflects off a 45° mirror by 90° and records the incidence angle", () => {
    const result = traceRay(arena([mirrorAt(new Vector2(60, 20), 45)]), new Vector2(10, 20), new Vector2(1, 0));

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.kind).toBe("reflection");
    expect(result.events[0]?.incidenceDegrees).toBeCloseTo(45, 8);
    expect(result.points.at(-1)?.y).toBeCloseTo(100, 8); // goes straight up
    expect(result.points.at(-1)?.x).toBeCloseTo(60, 8);
  });

  it("returns a ray antiparallel after two perpendicular mirrors (corner reflector)", () => {
    const scene = arena([mirrorAt(new Vector2(60, 50), 45), mirrorAt(new Vector2(60, 80), 135)]);
    const result = traceRay(scene, new Vector2(10, 50), new Vector2(1, 0));
    const last = result.points.at(-1) as Vector2;
    const before = result.points.at(-2) as Vector2;

    expect(result.events.map((e) => e.kind)).toEqual(["reflection", "reflection"]);
    expect(last.x).toBeLessThan(before.x); // heading back toward −x
    expect(last.y).toBeCloseTo(80, 8);
  });

  it("detects a hit on the target and stops there", () => {
    const scene = arena([], { center: new Vector2(80, 52), radius: 3 });
    const result = traceRay(scene, new Vector2(10, 50), new Vector2(1, 0));

    expect(result.hitTarget).toBe(true);
    expect(result.end).toBe("target");
    expect(result.closestApproach).toBeCloseTo(2, 8);
    expect(result.points.at(-1)?.x).toBeLessThan(80);
  });

  it("reports the closest approach on a miss", () => {
    const scene = arena([], { center: new Vector2(80, 60), radius: 3 });
    const result = traceRay(scene, new Vector2(10, 50), new Vector2(1, 0));

    expect(result.hitTarget).toBe(false);
    expect(result.closestApproach).toBeCloseTo(10, 8);
  });

  it("refracts into and out of a glass slab, leaving parallel to the incoming ray and displaced", () => {
    const block = { kind: "block" as const, min: new Vector2(35, 30), max: new Vector2(55, 70), refractiveIndex: 1.5 };
    const result = traceRay(arena([block]), new Vector2(10, 40), unit(30));
    const [enter, leave] = result.events;

    expect(enter?.kind).toBe("refraction");
    expect(enter?.incidenceDegrees).toBeCloseTo(30, 6);
    expect(enter?.refractionDegrees).toBeCloseTo(19.4712, 3);
    expect(leave?.kind).toBe("refraction");
    expect(leave?.incidenceDegrees).toBeCloseTo(19.4712, 3);
    expect(leave?.refractionDegrees).toBeCloseTo(30, 6);

    const after = result.points.at(-1)?.subtract(result.points.at(-2) as Vector2) as Vector2;
    expect(degreesOf(after)).toBeCloseTo(30, 6);
    // Lateral shift of a slab: the ray bends toward the normal inside the glass, so it leaves
    // below the undeviated line y = 40 + (x − 10) tan 30°.
    const exitPoint = leave?.point as Vector2;
    expect(exitPoint.y).toBeLessThan(40 + (exitPoint.x - 10) * Math.tan(Math.PI / 6));
  });

  it("totally internally reflects inside glass beyond the critical angle", () => {
    const block = { kind: "block" as const, min: new Vector2(20, 40), max: new Vector2(80, 60), refractiveIndex: 1.5 };
    // Enters the left face, then meets the top face at a steep angle.
    const result = traceRay(arena([block]), new Vector2(5, 45), unit(35));
    const kinds = result.events.map((e) => e.kind);

    expect(kinds[0]).toBe("refraction");
    expect(kinds).toContain("total-internal-reflection");
    const tir = result.events.find((e) => e.kind === "total-internal-reflection");
    expect(tir?.incidenceDegrees).toBeGreaterThan(41.81);
  });

  it("stops a ray trapped between mirrors at the interaction cap", () => {
    const scene = arena([mirrorAt(new Vector2(50, 20), 0, 400), mirrorAt(new Vector2(50, 80), 0, 400)]);
    const result = traceRay(scene, new Vector2(10, 50), unit(85), 8);

    expect(result.end).toBe("max-interactions");
    expect(result.events.length).toBeLessThanOrEqual(8);
  });

  it("rejects a zero direction", () => {
    expect(() => traceRay(arena([]), new Vector2(1, 1), Vector2.zero())).toThrow(RangeError);
  });
});
