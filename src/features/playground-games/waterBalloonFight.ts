import { advanceProjectile, launchProjectile, type ProjectileState } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, burst, cloud, sky, sun } from "./scenery";

const THROW_HEIGHT = 1.2;
const SPLASH = 0.6;
const STEP = 1 / 120;

interface Platform { readonly x0: number; readonly x1: number; readonly height: number }
interface Garden { readonly title: string; readonly goal: string; readonly targets: readonly number[]; readonly fence: { x: number; height: number } | null; readonly balcony: Platform | null; readonly throws: number }
export const GARDENS: readonly Garden[] = [
  { title: "Garden splash", goal: "Splash both buckets, at 5 m and 8 m, with 5 water balloons.", targets: [5, 8], fence: null, balcony: null, throws: 5 },
  { title: "Over the fence", goal: "A 3 m fence stands 3 m away. Lob high to splash the targets behind it.", targets: [6, 7.5], fence: { x: 3, height: 3 }, balcony: null, throws: 5 },
  { title: "Balcony bucket", goal: "Splash the bucket on the 3 m-high balcony, then the one in the garden, over a 2.5 m fence.", targets: [7.2, 10], fence: { x: 4, height: 2.5 }, balcony: { x0: 6.4, x1: 8, height: 3 }, throws: 6 },
];

/** Height of the ground (or balcony floor) under x. */
export function surfaceAt(garden: Garden, x: number): number {
  return garden.balcony && x >= garden.balcony.x0 && x <= garden.balcony.x1 ? garden.balcony.height : 0;
}

export type Landing = { kind: "fence" | "ground" | "away"; x: number; y: number };

/** Steps the throw until the balloon hits the fence, lands, or leaves the garden. */
export function stepBalloon(garden: Garden, balloon: ProjectileState, dt: number): { balloon: ProjectileState; landing: Landing | null } {
  const next = advanceProjectile(balloon, dt);
  const fence = garden.fence;
  if (fence && balloon.x < fence.x && next.x >= fence.x) {
    const yAtFence = balloon.y + ((next.y - balloon.y) * (fence.x - balloon.x)) / (next.x - balloon.x);
    if (yAtFence <= fence.height) return { balloon: next, landing: { kind: "fence", x: fence.x, y: yAtFence } };
  }
  if (garden.balcony && next.vy < 0 && balloon.x < garden.balcony.x0 && next.x >= garden.balcony.x0 && next.y < garden.balcony.height) {
    return { balloon: next, landing: { kind: "fence", x: garden.balcony.x0, y: next.y } };
  }
  if (next.y <= surfaceAt(garden, next.x)) return { balloon: next, landing: { kind: "ground", x: next.x, y: surfaceAt(garden, next.x) } };
  if (next.x > 14 || next.x < -1) return { balloon: next, landing: { kind: "away", x: next.x, y: next.y } };
  return { balloon: next, landing: null };
}

export function simulateThrow(level: number, speed: number, angle: number): Landing {
  const garden = GARDENS[level] as Garden;
  let balloon = launchProjectile(0, THROW_HEIGHT, speed, angle);
  for (let i = 0; i < 10_000; i += 1) {
    const result = stepBalloon(garden, balloon, STEP);
    if (result.landing) return result.landing;
    balloon = result.balloon;
  }
  return { kind: "away", x: balloon.x, y: balloon.y };
}

export interface WaterState {
  readonly balloon: ProjectileState | null;
  readonly trail: readonly { x: number; y: number }[];
  readonly splashed: readonly boolean[];
  readonly thrown: number;
  readonly last: Landing | null;
  readonly age: number;
}

export const waterBalloonFight: LiveGameDefinition<WaterState> = {
  id: "water-balloon-fight",
  title: "Water Balloon Fight",
  worldId: "everyday",
  eyebrow: "PLAYGROUND · THROWING",
  modelTag: "PROJECTILE MOTION",
  introduction: "It is a hot summer day: time for a water-balloon fight! Lob balloons over the fence to splash the buckets.",
  howToPlay: "Choose the throwing angle and speed, then press Throw (Space or Enter).",
  physics: "Once it leaves your hand, a water balloon moves sideways at a steady speed while gravity pulls it down, so it flies in a curve called a parabola. A steep throw goes high but not far; a flat throw stays low. To clear a tall fence close to you, throw steeply and a bit harder. Without air, 45° throws farthest on flat ground.",
  assumptions: "No air resistance (a heavy water balloon at a few metres per second is slowed only a little), thrown from 1.2 m high, g = 9.81 m/s², a thin fence, and a splash counting within 0.6 m of a bucket.",
  levels: GARDENS.map((garden, index) => ({ id: `garden-${index + 1}`, title: garden.title, goal: garden.goal })),
  sliders: () => [
    { key: "angle", label: "Throwing angle", unit: "°", minimum: 5, maximum: 85, step: 1, initial: 45 },
    { key: "speed", label: "Throwing speed", unit: "m/s", minimum: 2, maximum: 14, step: 0.1, initial: 7 },
  ],
  actions: [{ id: "throw", label: "Throw!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: STEP, timeScale: 1 },
  create: (level) => ({ balloon: null, trail: [], splashed: (GARDENS[level] as Garden).targets.map(() => false), thrown: 0, last: null, age: 0 }),
  step(state, input, dt, level) {
    const garden = GARDENS[level] as Garden;
    if (!state.balloon) {
      if (!input.pressed.has("throw") || state.thrown >= garden.throws) return { ...state, age: state.age + dt };
      const balloon = launchProjectile(0, THROW_HEIGHT, input.values.speed ?? 7, input.values.angle ?? 45);
      return { ...state, balloon, trail: [{ x: 0, y: THROW_HEIGHT }], thrown: state.thrown + 1, last: null };
    }
    const result = stepBalloon(garden, state.balloon, dt);
    const trail = [...state.trail, { x: result.balloon.x, y: result.balloon.y }];
    if (!result.landing) return { ...state, balloon: result.balloon, trail };
    const landing = result.landing;
    const splashed = state.splashed.map((done, index) => done || (landing.kind === "ground" && Math.abs(landing.x - (garden.targets[index] as number)) <= SPLASH && Math.abs(landing.y - surfaceAt(garden, garden.targets[index] as number)) < 0.01));
    return { ...state, balloon: null, trail, splashed, last: landing, age: 0 };
  },
  verdict(state, level) {
    const garden = GARDENS[level] as Garden;
    if (state.splashed.every(Boolean)) return { status: "won", message: `Splash! Every bucket soaked with ${state.thrown} balloons.` };
    if (!state.balloon && state.thrown >= garden.throws) return { status: "lost", message: "Out of water balloons!" };
    if (state.balloon) return { status: "playing", message: "Wheee…" };
    if (state.last?.kind === "fence") return { status: "playing", message: "Splat! It burst against the fence. Throw higher." };
    if (state.last) return { status: "playing", message: `It landed at ${state.last.x.toFixed(1)} m.` };
    return { status: "playing", message: "Aim, then throw!" };
  },
  stars: (state, level) => {
    const extra = state.thrown - (GARDENS[level] as Garden).targets.length;
    return extra <= 0 ? 3 : extra <= 1 ? 2 : 1;
  },
  readouts: (state, _input, level) => {
    const garden = GARDENS[level] as Garden;
    return [
      { label: "BALLOONS LEFT", value: String(garden.throws - state.thrown) },
      { label: "BUCKETS", value: garden.targets.map((x, index) => `${x} m ${state.splashed[index] ? "✓" : "○"}`).join(", ") },
      { label: "LAST LANDING", value: state.last ? `${state.last.x.toFixed(1)} m${state.last.kind === "fence" ? " (fence)" : ""}` : "—" },
    ];
  },
  draw(context, state, input, width, height, level) {
    const garden = GARDENS[level] as Garden;
    sky(context, width, height);
    sun(context, width - 50, 40);
    cloud(context, width * 0.3, 50);
    const scale = Math.min((width - 30) / 13, (height - 50) / 8);
    const at = (x: number, y: number) => ({ x: 20 + x * scale, y: height - 30 - y * scale });
    context.fillStyle = PLAYGROUND_COLOURS.grass;
    context.fillRect(0, at(0, 0).y, width, 30);
    if (garden.balcony) {
      const b = garden.balcony;
      context.fillStyle = "#e9c46a";
      context.fillRect(at(b.x0, 0).x, at(0, b.height).y, (b.x1 - b.x0) * scale, b.height * scale);
    }
    if (garden.fence) {
      context.fillStyle = "#8d6e63";
      context.fillRect(at(garden.fence.x, 0).x - 3, at(0, garden.fence.height).y, 6, garden.fence.height * scale);
    }
    garden.targets.forEach((x, index) => {
      const p = at(x, surfaceAt(garden, x));
      context.fillStyle = state.splashed[index] ? "#339af0" : "#f76707";
      context.fillRect(p.x - 10, p.y - 16, 20, 16);
      badge(context, state.splashed[index] ? "✓" : `${x} m`, p.x - 14, p.y - 22, state.splashed[index] ? "#1864ab" : "#d9480f");
    });
    context.fillStyle = PLAYGROUND_COLOURS.player;
    context.fillRect(at(0, 0).x - 6, at(0, 1.6).y, 12, 1.6 * scale);
    const angle = ((input.values.angle ?? 45) * Math.PI) / 180;
    context.strokeStyle = PLAYGROUND_COLOURS.ink;
    context.setLineDash([3, 4]);
    context.beginPath();
    context.moveTo(at(0, THROW_HEIGHT).x, at(0, THROW_HEIGHT).y);
    context.lineTo(at(0, THROW_HEIGHT).x + Math.cos(angle) * 40, at(0, THROW_HEIGHT).y - Math.sin(angle) * 40);
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = "rgb(51 154 240 / 60%)";
    context.lineWidth = 2;
    context.beginPath();
    state.trail.forEach((point, index) => {
      const p = at(point.x, point.y);
      if (index === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    });
    context.stroke();
    if (state.balloon) {
      const p = at(state.balloon.x, state.balloon.y);
      context.fillStyle = "#4dabf7";
      context.beginPath();
      context.arc(p.x, p.y, 7, 0, 2 * Math.PI);
      context.fill();
    } else if (state.last) {
      const p = at(state.last.x, state.last.y);
      burst(context, p.x, p.y, state.age, "#4dabf7");
    }
  },
  describe: (state, input, level) => {
    const garden = GARDENS[level] as Garden;
    return `Throwing at ${input.values.angle ?? 45} degrees and ${(input.values.speed ?? 7).toFixed(1)} metres per second. ${state.splashed.filter(Boolean).length} of ${garden.targets.length} buckets splashed, ${garden.throws - state.thrown} balloons left.`;
  },
};
