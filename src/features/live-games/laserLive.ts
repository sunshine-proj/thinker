import { Vector2 } from "../../physics/core";
import { traceRay, type OpticalElement, type OpticalScene } from "../../physics/optics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { circle, label, line, scaleOf, toScreen, type View } from "./drawing";

const SCENE_WIDTH = 1;
const SCENE_HEIGHT = 0.6;
const HOLD_SECONDS = 0.6;
const MIRROR_HALF_LENGTH = 0.06;

interface LaserLevel {
  readonly title: string;
  readonly goal: string;
  readonly source: Vector2;
  readonly direction: Vector2;
  readonly mirrors: readonly Vector2[];
  readonly extras: readonly OpticalElement[];
  readonly target: { readonly center: Vector2; readonly radius: number };
}

const LEVELS: readonly LaserLevel[] = [
  { title: "One mirror", goal: "Turn the mirror so the laser bounces up into the target.", source: new Vector2(0.02, 0.15), direction: new Vector2(1, 0), mirrors: [new Vector2(0.6, 0.15)], extras: [], target: { center: new Vector2(0.6, 0.55), radius: 0.03 } },
  { title: "Two mirrors", goal: "Use both mirrors to send the beam round the wall.", source: new Vector2(0.02, 0.1), direction: new Vector2(1, 0), mirrors: [new Vector2(0.3, 0.1), new Vector2(0.3, 0.5)], extras: [{ kind: "mirror", start: new Vector2(0.55, 0), end: new Vector2(0.55, 0.3) }], target: { center: new Vector2(0.85, 0.15), radius: 0.03 } },
  { title: "Through the glass", goal: "Aim through a glass block (n = 1.5): the beam bends as it enters and leaves.", source: new Vector2(0.02, 0.5), direction: new Vector2(1, 0), mirrors: [new Vector2(0.25, 0.5)], extras: [{ kind: "block", min: new Vector2(0.45, 0.15), max: new Vector2(0.65, 0.4), refractiveIndex: 1.5 }], target: { center: new Vector2(0.9, 0.12), radius: 0.025 } },
];

interface LaserState {
  readonly held: number;
  readonly closest: number | null;
  readonly hit: boolean;
}

function sceneFor(level: LaserLevel, angles: readonly number[]): OpticalScene {
  const mirrors: OpticalElement[] = level.mirrors.map((center, index) => {
    const angle = ((angles[index] ?? 45) * Math.PI) / 180;
    const half = new Vector2(Math.cos(angle) * MIRROR_HALF_LENGTH, Math.sin(angle) * MIRROR_HALF_LENGTH);
    return { kind: "mirror", start: center.subtract(half), end: center.add(half) };
  });
  return { elements: [...mirrors, ...level.extras], width: SCENE_WIDTH, height: SCENE_HEIGHT, target: level.target };
}

export function traceLevel(levelIndex: number, values: Readonly<Record<string, number>>) {
  const level = LEVELS[levelIndex] as LaserLevel;
  const angles = level.mirrors.map((_, index) => values[`mirror${index + 1}`] ?? 45);
  return traceRay(sceneFor(level, angles), level.source, level.direction);
}

export const laserLive: LiveGameDefinition<LaserState> = {
  id: "laser-maze-live",
  title: "Laser Maze Live",
  worldId: "optics",
  relatedGameId: "laser-maze",
  eyebrow: "OPTICS & LIGHT · REFLECTION AND REFRACTION",
  modelTag: "RAY OPTICS · SNELL'S LAW",
  introduction: "The laser is on. Rotate the mirrors and watch the beam move in real time. Hold it on the target to complete the level.",
  howToPlay: "Drag left and right on the scene to turn the first mirror, or use the sliders (arrow keys work on them). Keep the beam on the target for a moment.",
  physics: "At a mirror the angle of reflection equals the angle of incidence, so turning a mirror by an angle turns the reflected beam by twice that angle. Entering glass the beam slows down and bends toward the normal (n₁ sinθ₁ = n₂ sinθ₂), and it bends away again as it leaves.",
  assumptions: "Ideal flat mirrors, a glass block of index 1.5 in air, light as straight rays (no diffraction), and no light lost at surfaces.",
  levels: LEVELS.map((entry, index) => ({ id: `laser-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: (levelIndex) =>
    (LEVELS[levelIndex] as LaserLevel).mirrors.map((_, index) => ({ key: `mirror${index + 1}`, label: `Mirror ${index + 1} angle`, unit: "°", minimum: 0, maximum: 180, step: 0.5, initial: index === 0 ? 30 : 120 })),
  actions: [],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  onDrag: (x) => ({ mirror1: Math.round(x * 180 * 2) / 2 }),
  create: () => ({ held: 0, closest: null, hit: false }),
  step(state, input, dt, level) {
    if (state.hit) {
      return state;
    }
    const trace = traceLevel(level, input.values);
    const held = trace.hitTarget ? state.held + dt : 0;
    return { held, closest: trace.closestApproach, hit: held >= HOLD_SECONDS };
  },
  verdict: (state) =>
    state.hit
      ? { status: "won", message: "The beam is locked on the target." }
      : { status: "playing", message: state.held > 0 ? "On target, hold it…" : "Turn the mirrors." },
  stars: (state, level) => {
    const ratio = (state.closest ?? 1) / (LEVELS[level] as LaserLevel).target.radius;
    return ratio <= 0.25 ? 3 : ratio <= 0.6 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const trace = traceLevel(level, input.values);
    return [
      { label: "REFLECTIONS AND REFRACTIONS", value: String(trace.events.length) },
      { label: "MISS DISTANCE", value: trace.closestApproach === null ? "—" : `${(trace.closestApproach * 100).toFixed(1)} cm` },
      { label: "ON TARGET", value: trace.hitTarget ? `yes (${state.held.toFixed(1)} s)` : "no" },
    ];
  },
  draw(context, _state, input, width, height, levelIndex) {
    const view: View = { minX: 0, maxX: SCENE_WIDTH, minY: 0, maxY: SCENE_HEIGHT, width, height };
    const level = LEVELS[levelIndex] as LaserLevel;
    const scene = sceneFor(level, level.mirrors.map((_, index) => input.values[`mirror${index + 1}`] ?? 45));
    for (const element of scene.elements) {
      if (element.kind === "mirror") {
        line(context, [toScreen(view, element.start.x, element.start.y), toScreen(view, element.end.x, element.end.y)], "#364057", 5);
      } else {
        const a = toScreen(view, element.min.x, element.max.y);
        const b = toScreen(view, element.max.x, element.min.y);
        context.fillStyle = "rgb(110 170 230 / 35%)";
        context.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
        label(context, "GLASS n = 1.5", a.x + 4, a.y + 14, "#2c5f8e");
      }
    }
    const target = toScreen(view, level.target.center.x, level.target.center.y);
    circle(context, target.x, target.y, Math.max(6, level.target.radius * scaleOf(view)), "rgb(232 138 46 / 30%)", "#e88a2e");
    label(context, "TARGET", target.x + 10, target.y - 8, "#a45a12");
    const trace = traceRay(scene, level.source, level.direction);
    line(context, trace.points.map((point) => toScreen(view, point.x, point.y)), "#d6304f", 2.5);
    const source = toScreen(view, level.source.x, level.source.y);
    circle(context, source.x, source.y, 5, "#d6304f");
  },
  describe: (_state, input, level) => {
    const trace = traceLevel(level, input.values);
    return `${LEVELS[level]?.goal} The beam makes ${trace.events.length} reflections or refractions and ${trace.hitTarget ? "hits" : "misses"} the target${trace.closestApproach === null ? "" : `, passing ${(trace.closestApproach * 100).toFixed(1)} centimetres from its centre`}.`;
  },
};
