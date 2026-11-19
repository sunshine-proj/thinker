import { advanceProjectile, launchProjectile, type ProjectileState } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { circle, ground, label, line, toScreen, type View } from "./drawing";

const TARGETS = [20, 35, 50] as const;
const TARGET_HALF_WIDTH = 1.5;
const MAX_SHOTS = 5;

interface ShotState {
  readonly ball: ProjectileState | null;
  readonly trail: readonly { x: number; y: number }[];
  readonly shots: number;
  readonly lastLanding: number | null;
  readonly hit: boolean;
}

const viewOf = (width: number, height: number): View => ({ minX: -2, maxX: 60, minY: 0, maxY: 26, width, height });

export const projectileLive: LiveGameDefinition<ShotState> = {
  id: "projectile-master-live",
  title: "Projectile Master Live",
  worldId: "mechanics",
  relatedGameId: "projectile-master",
  eyebrow: "MECHANICS · PROJECTILE MOTION",
  modelTag: "CONSTANT GRAVITY, NO AIR",
  introduction: "Aim the launcher by dragging on the field, then fire. Land the ball on each target with as few shots as possible.",
  howToPlay: "Drag on the field to aim: the direction sets the angle and the distance sets the speed. Or use the sliders. Press Launch (Space or Enter) to fire.",
  physics: "Once launched, the ball is pulled down by gravity alone, so its horizontal speed never changes while its vertical speed falls by 9.81 m/s every second. On level ground the range is v² sin 2θ / g: doubling the speed quadruples the range, and for a given speed 45° goes farthest, with complementary angles such as 30° and 60° landing at the same spot.",
  assumptions: "Constant gravity g = 9.81 m/s², no air resistance or wind, and launch and landing at the same height. The step is exact for constant acceleration.",
  levels: TARGETS.map((distance, index) => ({ id: `target-${index + 1}`, title: `Target at ${distance} m`, goal: `Land within ${TARGET_HALF_WIDTH} m of the target ${distance} m away. You have ${MAX_SHOTS} shots.` })),
  sliders: () => [
    { key: "angle", label: "Launch angle", unit: "°", minimum: 10, maximum: 80, step: 1, initial: 45 },
    { key: "speed", label: "Launch speed", unit: "m/s", minimum: 5, maximum: 30, step: 0.5, initial: 12 },
  ],
  actions: [{ id: "launch", label: "Launch", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 120, timeScale: 1 },
  onDrag: (x, y) => ({
    angle: Math.round(Math.min(80, Math.max(10, (Math.atan2(y * 26, Math.max(0.01, x * 62)) * 180) / Math.PI))),
    speed: Math.round(Math.min(30, Math.max(5, 5 + 25 * Math.min(1, Math.hypot(x, y) / 1.1))) * 2) / 2,
  }),
  create: () => ({ ball: null, trail: [], shots: 0, lastLanding: null, hit: false }),
  step(state, input, dt, level) {
    if (state.hit) {
      return state;
    }
    if (!state.ball) {
      if (!input.pressed.has("launch") || state.shots >= MAX_SHOTS) {
        return state;
      }
      const ball = launchProjectile(0, 0, input.values.speed ?? 12, input.values.angle ?? 45);
      return { ...state, ball, trail: [{ x: 0, y: 0 }] };
    }
    const next = advanceProjectile(state.ball, dt);
    if (next.y > 0) {
      return { ...state, ball: next, trail: state.trail.length % 2 === 0 ? [...state.trail, { x: next.x, y: next.y }] : [...state.trail.slice(0, -1), { x: next.x, y: next.y }] };
    }
    // Interpolate the landing point between the last two steps.
    const fraction = state.ball.y / (state.ball.y - next.y);
    const landing = state.ball.x + fraction * (next.x - state.ball.x);
    const hit = Math.abs(landing - (TARGETS[level] as number)) <= TARGET_HALF_WIDTH;
    return { ball: null, trail: [...state.trail, { x: landing, y: 0 }], shots: state.shots + 1, lastLanding: landing, hit };
  },
  verdict(state, level) {
    const target = TARGETS[level] as number;
    if (state.hit) {
      return { status: "won", message: `Landed at ${state.lastLanding?.toFixed(1)} m, on the ${target} m target, in ${state.shots} shot${state.shots === 1 ? "" : "s"}.` };
    }
    if (state.shots >= MAX_SHOTS && !state.ball) {
      return { status: "lost", message: `Out of shots. The last landed at ${state.lastLanding?.toFixed(1)} m; the target is at ${target} m.` };
    }
    if (state.lastLanding !== null && !state.ball) {
      return { status: "playing", message: `Landed at ${state.lastLanding.toFixed(1)} m: ${state.lastLanding > target ? "too far" : "too short"} by ${Math.abs(state.lastLanding - target).toFixed(1)} m. ${MAX_SHOTS - state.shots} shots left.` };
    }
    return { status: "playing", message: state.ball ? "In flight…" : "Aim and launch." };
  },
  stars: (state) => (state.shots <= 1 ? 3 : state.shots <= 2 ? 2 : 1),
  readouts: (state, input) => {
    const speed = input.values.speed ?? 12;
    const angle = ((input.values.angle ?? 45) * Math.PI) / 180;
    return [
      { label: "PREDICTED RANGE v² sin2θ / g", value: `${((speed * speed * Math.sin(2 * angle)) / 9.80665).toFixed(1)} m` },
      { label: "SHOTS USED", value: `${state.shots} of ${MAX_SHOTS}` },
      { label: "LAST LANDING", value: state.lastLanding === null ? "—" : `${state.lastLanding.toFixed(1)} m` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const view = viewOf(width, height);
    ground(context, view);
    const target = TARGETS[level] as number;
    const left = toScreen(view, target - TARGET_HALF_WIDTH, 0);
    const right = toScreen(view, target + TARGET_HALF_WIDTH, 0);
    context.fillStyle = "#e88a2e";
    context.fillRect(left.x, left.y - 4, right.x - left.x, 8);
    label(context, `TARGET ${target} m`, left.x - 10, left.y - 10, "#a45a12");
    const angle = ((input.values.angle ?? 45) * Math.PI) / 180;
    const origin = toScreen(view, 0, 0);
    const aim = toScreen(view, Math.cos(angle) * (input.values.speed ?? 12) * 0.4, Math.sin(angle) * (input.values.speed ?? 12) * 0.4);
    line(context, [origin, aim], "#596be0", 4);
    line(context, state.trail.map((point) => toScreen(view, point.x, point.y)), "#596be0", 2, true);
    if (state.ball) {
      const ball = toScreen(view, state.ball.x, state.ball.y);
      circle(context, ball.x, ball.y, 6, "#5365d5", "#fff");
    }
    for (let x = 10; x <= 60; x += 10) {
      const tick = toScreen(view, x, 0);
      label(context, `${x} m`, tick.x - 10, tick.y + 14, "#4d566b", 10);
    }
  },
  describe: (state, input, level) =>
    `Launcher aimed at ${input.values.angle ?? 45} degrees with ${input.values.speed ?? 12} meters per second. Target at ${TARGETS[level]} meters. ${state.ball ? `Ball in flight at ${state.ball.x.toFixed(0)} meters, ${state.ball.y.toFixed(1)} meters high.` : state.lastLanding !== null ? `Last ball landed at ${state.lastLanding.toFixed(1)} meters.` : "No shot yet."}`,
};
