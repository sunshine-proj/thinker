import { Vector2 } from "../../physics/core";
import { traceRay, type OpticalScene, type TraceResult } from "../../physics/optics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

const ROOM = { width: 100, height: 60 } as const;
const MIRROR_LENGTH = 10;
const GEM_RADIUS = 3;
const GUARD_RADIUS = 4;

interface Point { readonly x: number; readonly y: number }
interface Vault { readonly title: string; readonly goal: string; readonly laser: Point; readonly mirrors: readonly Point[]; readonly gem: Point; readonly guards: readonly Point[] }
export const VAULTS: readonly Vault[] = [
  { title: "The first vault", goal: "Turn the mirror so the laser bounces up to the gem.", laser: { x: 5, y: 10 }, mirrors: [{ x: 60, y: 10 }], gem: { x: 60, y: 50 }, guards: [{ x: 85, y: 10 }, { x: 25, y: 40 }] },
  { title: "Around the corner", goal: "Two mirrors: guide the beam up, then across to the gem, avoiding the guards.", laser: { x: 5, y: 10 }, mirrors: [{ x: 40, y: 10 }, { x: 40, y: 50 }], gem: { x: 90, y: 50 }, guards: [{ x: 70, y: 10 }, { x: 65, y: 30 }] },
  { title: "The zigzag", goal: "Three mirrors, three guards. Up, across and back down to the gem.", laser: { x: 5, y: 10 }, mirrors: [{ x: 30, y: 10 }, { x: 30, y: 50 }, { x: 70, y: 50 }], gem: { x: 70, y: 10 }, guards: [{ x: 50, y: 10 }, { x: 50, y: 30 }, { x: 90, y: 50 }] },
];

export function mirrorAngles(values: Record<string, number>, count: number): number[] {
  return Array.from({ length: count }, (_, index) => values[`m${index + 1}`] ?? 20);
}

/** Traces the laser through the mirrors at the given angles (degrees from the floor). */
export function fireLaser(level: number, angles: readonly number[]): { trace: TraceResult; spotted: number | null } {
  const vault = VAULTS[level] as Vault;
  const scene: OpticalScene = {
    width: ROOM.width,
    height: ROOM.height,
    target: { center: new Vector2(vault.gem.x, vault.gem.y), radius: GEM_RADIUS },
    elements: vault.mirrors.map((mirror, index) => {
      const half = Vector2.fromAngle(((angles[index] ?? 0) * Math.PI) / 180, MIRROR_LENGTH / 2);
      const centre = new Vector2(mirror.x, mirror.y);
      return { kind: "mirror" as const, start: centre.subtract(half), end: centre.add(half) };
    }),
  };
  const trace = traceRay(scene, new Vector2(vault.laser.x, vault.laser.y), new Vector2(1, 0));
  // The first guard the beam passes (within the guard's radius of any segment) sets off the alarm.
  for (let i = 1; i < trace.points.length; i += 1) {
    const a = trace.points[i - 1] as Vector2;
    const b = trace.points[i] as Vector2;
    const spotted = vault.guards.findIndex((guard) => distanceToSegment(new Vector2(guard.x, guard.y), a, b) < GUARD_RADIUS);
    if (spotted >= 0) return { trace, spotted };
  }
  return { trace, spotted: null };
}

function distanceToSegment(point: Vector2, a: Vector2, b: Vector2): number {
  const edge = b.subtract(a);
  const length = edge.dot(edge);
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, point.subtract(a).dot(edge) / length));
  return point.distanceTo(a.add(edge.scale(t)));
}

export interface HeistState { readonly shots: number; readonly last: ReturnType<typeof fireLaser> | null }

export const laserHeist: LiveGameDefinition<HeistState> = {
  id: "laser-heist",
  title: "Laser Heist",
  worldId: "optics",
  eyebrow: "PLAYGROUND · REFLECTION",
  modelTag: "ANGLE IN = ANGLE OUT",
  introduction: "The museum's gem sits behind laser alarms and sleepy guards. Turn the mirrors so your laser beam bounces to the gem, and never let it touch a guard!",
  howToPlay: "Turn each mirror with its slider, predict where the beam will go, then press Fire (Space or Enter). The beam is only shown once you fire.",
  physics: "Light travels in straight lines until it hits something. A flat mirror reflects it so that the angle going in equals the angle coming out, both measured from the line at right angles to the mirror (the normal). A mirror at 45° turns a beam through a right angle; turning the mirror by some angle turns the reflected beam by twice that angle.",
  assumptions: "Flat, perfectly reflecting double-sided mirrors 10 cm long, a thin laser beam in a 100 cm × 60 cm room seen from above, a gem 3 cm in radius, and guards who notice the beam within 4 cm of their centre.",
  levels: VAULTS.map((vault, index) => ({ id: `vault-${index + 1}`, title: vault.title, goal: vault.goal })),
  sliders: (level) => (VAULTS[level] as Vault).mirrors.map((_, index) => ({ key: `m${index + 1}`, label: `Mirror ${index + 1} angle`, unit: "°", minimum: 0, maximum: 180, step: 1, initial: 20 })),
  actions: [{ id: "fire", label: "Fire laser", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ shots: 0, last: null }),
  step(state, input, _dt, level) {
    if (!input.pressed.has("fire")) return state;
    return { shots: state.shots + 1, last: fireLaser(level, mirrorAngles(input.values, (VAULTS[level] as Vault).mirrors.length)) };
  },
  verdict(state) {
    if (!state.last) return { status: "playing", message: "Aim the mirrors, then fire." };
    if (state.last.spotted !== null) return { status: "lost", message: `Alarm! Guard ${state.last.spotted + 1} saw the beam.` };
    if (state.last.trace.hitTarget) return { status: "won", message: `The gem sparkles! You reached it with ${state.shots} shot${state.shots === 1 ? "" : "s"}.` };
    return { status: "playing", message: `Missed: the beam passed ${state.last.trace.closestApproach?.toFixed(0)} cm from the gem. Adjust and fire again.` };
  },
  stars: (state) => (state.shots <= 1 ? 3 : state.shots <= 3 ? 2 : 1),
  readouts: (state, input, level) => [
    ...mirrorAngles(input.values, (VAULTS[level] as Vault).mirrors.length).map((angle, index) => ({ label: `MIRROR ${index + 1}`, value: `${angle}°` })),
    { label: "SHOTS", value: String(state.shots) },
  ],
  draw(context, state, input, width, height, level) {
    const vault = VAULTS[level] as Vault;
    context.fillStyle = "#1b1f3b";
    context.fillRect(0, 0, width, height);
    const scale = Math.min(width / ROOM.width, height / ROOM.height);
    const at = (x: number, y: number) => ({ x: x * scale, y: height - y * scale });
    context.strokeStyle = "rgb(255 255 255 / 8%)";
    for (let x = 0; x <= ROOM.width; x += 10) {
      context.beginPath();
      context.moveTo(at(x, 0).x, at(x, 0).y);
      context.lineTo(at(x, ROOM.height).x, at(x, ROOM.height).y);
      context.stroke();
    }
    const gem = at(vault.gem.x, vault.gem.y);
    context.fillStyle = "#63e6be";
    context.beginPath();
    context.moveTo(gem.x, gem.y - GEM_RADIUS * scale);
    context.lineTo(gem.x + GEM_RADIUS * scale, gem.y);
    context.lineTo(gem.x, gem.y + GEM_RADIUS * scale);
    context.lineTo(gem.x - GEM_RADIUS * scale, gem.y);
    context.fill();
    vault.guards.forEach((guard, index) => {
      const p = at(guard.x, guard.y);
      context.fillStyle = state.last?.spotted === index ? PLAYGROUND_COLOURS.enemy : "#5c7cfa";
      context.beginPath();
      context.arc(p.x, p.y, GUARD_RADIUS * scale * 0.8, 0, 2 * Math.PI);
      context.fill();
      badge(context, `guard ${index + 1}`, p.x - 26, p.y - GUARD_RADIUS * scale - 4, "#364fc7");
    });
    const angles = mirrorAngles(input.values, vault.mirrors.length);
    vault.mirrors.forEach((mirror, index) => {
      const half = Vector2.fromAngle(((angles[index] ?? 0) * Math.PI) / 180, MIRROR_LENGTH / 2);
      const a = at(mirror.x - half.x, mirror.y - half.y);
      const b = at(mirror.x + half.x, mirror.y + half.y);
      context.strokeStyle = "#e9ecef";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
      badge(context, String(index + 1), at(mirror.x, mirror.y).x + 8, at(mirror.x, mirror.y).y + 20, "#495057");
    });
    const laser = at(vault.laser.x, vault.laser.y);
    context.fillStyle = PLAYGROUND_COLOURS.enemy;
    context.fillRect(laser.x - 10, laser.y - 6, 14, 12);
    context.strokeStyle = "#ff6b6b";
    context.lineWidth = 3;
    context.beginPath();
    if (state.last) {
      state.last.trace.points.forEach((point, index) => {
        const p = at(point.x, point.y);
        if (index === 0) context.moveTo(p.x, p.y);
        else context.lineTo(p.x, p.y);
      });
    } else {
      context.setLineDash([4, 6]);
      context.moveTo(laser.x, laser.y);
      context.lineTo(laser.x + 6 * scale, laser.y);
    }
    context.stroke();
    context.setLineDash([]);
  },
  describe: (state, input, level) => {
    const vault = VAULTS[level] as Vault;
    const angles = mirrorAngles(input.values, vault.mirrors.length);
    return `Mirrors at ${angles.map((angle) => `${angle} degrees`).join(", ")}. ${state.last ? (state.last.trace.hitTarget ? "The beam reaches the gem." : state.last.spotted !== null ? `The beam passes guard ${state.last.spotted + 1}.` : "The beam misses the gem.") : "Not fired yet."}`;
  },
};
