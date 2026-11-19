import { advanceDampedPendulum, calculatePendulumFrequency, calculateSwingAmplitude, pushPendulum, type PendulumState } from "../../physics/waves";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { circle, label, line } from "./drawing";

const LENGTH = 2.5;
const DAMPING = 0.01;
const KICK = 0.06;
const MAX_PUSHES = 40;

interface SwingLevel { readonly title: string; readonly goal: string; readonly start: number; readonly target: number; readonly brake: boolean }
const LEVELS: readonly SwingLevel[] = [
  { title: "Get swinging", goal: "Push the swing up to a 20° swing.", start: 0.02, target: 20, brake: false },
  { title: "Higher", goal: "Reach a 35° swing using as few pushes as you can.", start: 0.02, target: 35, brake: false },
  { title: "Bring it to rest", goal: "The swing is going at 30°. Use pushes against the motion to bring it below 3°.", start: (30 * Math.PI) / 180, target: 3, brake: true },
];

interface SwingState extends PendulumState {
  readonly pushes: number;
  readonly done: boolean;
}

const degrees = (radians: number) => (radians * 180) / Math.PI;

const fewestCache = new Map<number, number>();

/**
 * Pushes needed by the best strategy, a push (or brake) each time the swing passes the
 * bottom, where it moves fastest and each push changes its energy most. Found by running
 * that strategy, so air damping is included.
 */
export function fewestPushes(level: number): number {
  const cached = fewestCache.get(level);
  if (cached !== undefined) {
    return cached;
  }
  const goal = LEVELS[level] as SwingLevel;
  let state: PendulumState = { angle: goal.start, angularVelocity: 0 };
  let pushes = 0;
  const dt = 1 / 240;
  for (let t = 0; t < 600 && pushes < MAX_PUSHES; t += dt) {
    const before = state.angle;
    state = advanceDampedPendulum(state, LENGTH, DAMPING, dt);
    if (Math.sign(state.angle) !== Math.sign(before)) {
      pushes += 1;
      state = goal.brake
        ? { ...state, angularVelocity: state.angularVelocity - Math.sign(state.angularVelocity) * Math.min(KICK, Math.abs(state.angularVelocity)) }
        : pushPendulum(state, KICK);
    }
    const amplitude = degrees(calculateSwingAmplitude(state, LENGTH));
    if (goal.brake ? amplitude <= goal.target : amplitude >= goal.target) {
      break;
    }
  }
  fewestCache.set(level, pushes);
  return pushes;
}

export const swingLive: LiveGameDefinition<SwingState> = {
  id: "resonance-swing-live",
  title: "Resonance Swing Live",
  worldId: "waves",
  relatedGameId: "resonance-swing",
  eyebrow: "WAVES & SOUND · RESONANCE",
  modelTag: "DAMPED PENDULUM · RK4",
  introduction: "Give the swing short pushes. Time them with its natural rhythm and the swing climbs higher and higher; push at the wrong moment and you waste the effort.",
  howToPlay: "Press Push (Space or P) to give a short shove in the direction of motion. In the last level use Brake (B) to push against the motion. Start begins the swing.",
  physics: "A push changes the swing's speed by the same small amount each time, but the energy it adds is m v Δv: largest when the swing is moving fastest, at the bottom. Pushing once per swing, in step with its natural frequency f₀ = (1/2π)√(g/L), adds energy every cycle: that is resonance. Pushing against the motion removes energy the same way.",
  assumptions: "A 2.5 m rope with a little air damping (ζ = 0.01), short pushes of equal size, and the full pendulum equation (large swings are slightly slower).",
  levels: LEVELS.map((entry, index) => ({ id: `swing-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [],
  actions: [
    { id: "push", label: "Push", keys: [" ", "p", "P"] },
    { id: "brake", label: "Brake", keys: ["b", "B"] },
  ],
  timing: { fixedTimeStepSeconds: 1 / 240, timeScale: 1 },
  create: (level) => ({ angle: (LEVELS[level] as SwingLevel).start, angularVelocity: 0, pushes: 0, done: false }),
  step(state, input, dt, level) {
    if (state.done) {
      return state;
    }
    const goal = LEVELS[level] as SwingLevel;
    let next: SwingState = state;
    if (input.pressed.has("push") && next.pushes < MAX_PUSHES) {
      next = { ...pushPendulum(next, KICK), pushes: next.pushes + 1, done: false };
    }
    if (input.pressed.has("brake") && next.pushes < MAX_PUSHES && next.angularVelocity !== 0) {
      next = { ...next, angularVelocity: next.angularVelocity - Math.sign(next.angularVelocity) * Math.min(KICK, Math.abs(next.angularVelocity)), pushes: next.pushes + 1 };
    }
    const moved = advanceDampedPendulum(next, LENGTH, DAMPING, dt);
    const amplitude = degrees(calculateSwingAmplitude(moved, LENGTH));
    const done = goal.brake ? amplitude <= goal.target : amplitude >= goal.target;
    return { ...moved, pushes: next.pushes, done };
  },
  verdict(state, level) {
    const goal = LEVELS[level] as SwingLevel;
    if (state.done) {
      return { status: "won", message: `${goal.brake ? "Stopped" : `Reached ${goal.target}°`} with ${state.pushes} pushes.` };
    }
    if (state.pushes >= MAX_PUSHES) {
      return { status: "lost", message: "Out of pushes. Time them with the swing's own rhythm." };
    }
    return { status: "playing", message: `Swing ${degrees(calculateSwingAmplitude(state, LENGTH)).toFixed(1)}° · ${state.pushes} pushes used.` };
  },
  stars: (state, level) => {
    const best = fewestPushes(level);
    return state.pushes <= best + 2 ? 3 : state.pushes <= best * 1.5 ? 2 : 1;
  },
  readouts: (state) => [
    { label: "SWING ANGLE", value: `${degrees(calculateSwingAmplitude(state, LENGTH)).toFixed(1)}°` },
    { label: "NATURAL RHYTHM", value: `one swing every ${(1 / calculatePendulumFrequency(LENGTH)).toFixed(2)} s` },
    { label: "PUSHES USED", value: `${state.pushes} of ${MAX_PUSHES}` },
  ],
  draw(context, state, _input, width, height, level) {
    const pivot = { x: width / 2, y: 30 };
    const length = Math.min(height - 70, width * 0.45);
    const bob = { x: pivot.x + length * Math.sin(state.angle), y: pivot.y + length * Math.cos(state.angle) };
    const target = ((LEVELS[level] as SwingLevel).target * Math.PI) / 180;
    for (const side of [-1, 1]) {
      line(context, [pivot, { x: pivot.x + side * length * Math.sin(target), y: pivot.y + length * Math.cos(target) }], "#2aab83", 1.5, true);
    }
    label(context, `${(LEVELS[level] as SwingLevel).target}°`, pivot.x + length * Math.sin(target) + 6, pivot.y + length * Math.cos(target), "#1f7d5d");
    line(context, [{ x: pivot.x - 60, y: pivot.y }, { x: pivot.x + 60, y: pivot.y }], "#4d566b", 4);
    line(context, [pivot, bob], "#7a5a3a", 3);
    context.fillStyle = "#e27945";
    context.fillRect(bob.x - 22, bob.y - 6, 44, 12);
    circle(context, bob.x, bob.y - 18, 10, "#5365d5");
  },
  describe: (state, _input, level) => `${LEVELS[level]?.goal} The swing is at ${degrees(state.angle).toFixed(0)} degrees, moving ${state.angularVelocity > 0 ? "right" : state.angularVelocity < 0 ? "left" : "nowhere"}. ${state.pushes} pushes used.`,
};
