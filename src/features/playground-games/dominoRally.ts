import { STANDARD_GRAVITY } from "../../physics/core";
import { calculateCollisionVelocities, calculateRunOutDistance } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky } from "./scenery";

const RAMP_ANGLE = 30;
const RESTITUTION = 0.9;
const BLOCK_FRICTION = 0.3;
/** Time the animation spends on the ball rolling and the bumps before the last block slides. */
const ROLL_SECONDS = 0.5;

interface Rally { readonly title: string; readonly goal: string; readonly blocks: number; readonly blockKg: number; readonly bellFrom: number; readonly bellTo: number; readonly fixedHeight?: number }
export const RALLIES: readonly Rally[] = [
  { title: "Ring the bell", goal: "Let the ball roll down, hit the block and slide it into the bell zone (1.5–2 m).", blocks: 1, blockKg: 0.2, bellFrom: 1.5, bellTo: 2 },
  { title: "Three in a row", goal: "The ball hits three blocks in a row. Each bump loses a little energy. Ring the bell 2–2.5 m away.", blocks: 3, blockKg: 0.2, bellFrom: 2, bellTo: 2.5 },
  { title: "The heavy block", goal: "The ramp is fixed at 0.8 m and the block weighs 0.5 kg. Pick the ball's mass to ring the bell 1–1.4 m away.", blocks: 1, blockKg: 0.5, bellFrom: 1, bellTo: 1.4, fixedHeight: 0.8 },
];

export interface RallyResult {
  readonly ballSpeed: number;
  readonly blockSpeed: number;
  readonly slide: number;
}

/** Ball speed at the foot of a frictionless ramp, then a chain of 1-D collisions, then friction. */
export function runRally(level: number, height: number, ballKg: number): RallyResult {
  const rally = RALLIES[level] as Rally;
  const ballSpeed = Math.sqrt(2 * STANDARD_GRAVITY * height);
  let speed = calculateCollisionVelocities(ballKg, ballSpeed, rally.blockKg, 0, RESTITUTION).velocityB;
  for (let i = 1; i < rally.blocks; i += 1) {
    speed = calculateCollisionVelocities(rally.blockKg, speed, rally.blockKg, 0, RESTITUTION).velocityB;
  }
  return { ballSpeed, blockSpeed: speed, slide: calculateRunOutDistance(speed, BLOCK_FRICTION) };
}

export interface RallyState {
  readonly released: boolean;
  readonly time: number;
  readonly result: RallyResult | null;
}

const slideTime = (result: RallyResult) => result.blockSpeed / (BLOCK_FRICTION * STANDARD_GRAVITY);
const slideAt = (result: RallyResult, t: number) => result.blockSpeed * t - 0.5 * BLOCK_FRICTION * STANDARD_GRAVITY * t * t;

export const dominoRally: LiveGameDefinition<RallyState> = {
  id: "domino-rally",
  title: "Domino Rally",
  worldId: "mechanics",
  eyebrow: "PLAYGROUND · ENERGY AND MOMENTUM",
  modelTag: "ENERGY · COLLISIONS · FRICTION",
  introduction: "Build a chain reaction! A ball rolls down a ramp, bumps into blocks, and the last block slides along the floor. Stop it right at the bell to ring it.",
  howToPlay: "Set the ramp height (and the ball's mass on the last level), then press Release (Space or Enter).",
  physics: "On the ramp the ball's height energy becomes speed: v = √(2gh). When it hits a block, momentum passes from the ball to the block; a heavier ball pushes harder. Each bump loses a little energy, so a long chain needs more height. Friction then slows the sliding block, which stops after v²/(2μg).",
  assumptions: "A frictionless ramp with the ball treated as sliding (a rolling ball would be a little slower), head-on collisions with a coefficient of restitution of 0.9, blocks resting in a row, and kinetic friction μ = 0.3 for the last block on the floor.",
  levels: RALLIES.map((rally, index) => ({ id: `rally-${index + 1}`, title: rally.title, goal: rally.goal })),
  sliders: (level) => {
    const rally = RALLIES[level] as Rally;
    return rally.fixedHeight
      ? [{ key: "ball", label: "Ball mass", unit: "kg", minimum: 0.05, maximum: 0.5, step: 0.01, initial: 0.1 }]
      : [{ key: "height", label: "Ramp height", unit: "m", minimum: 0.1, maximum: 1.5, step: 0.01, initial: 0.3 }];
  },
  actions: [{ id: "go", label: "Release!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 60, timeScale: 1 },
  create: () => ({ released: false, time: 0, result: null }),
  step(state, input, dt, level) {
    const rally = RALLIES[level] as Rally;
    if (!state.released) {
      if (!input.pressed.has("go")) return state;
      const height = rally.fixedHeight ?? input.values.height ?? 0.3;
      return { released: true, time: 0, result: runRally(level, height, input.values.ball ?? 0.2) };
    }
    return { ...state, time: state.time + dt };
  },
  verdict(state, level) {
    const rally = RALLIES[level] as Rally;
    if (!state.result) return { status: "playing", message: "Set up and release the ball." };
    const done = state.time >= ROLL_SECONDS + slideTime(state.result);
    if (!done) return { status: "playing", message: "Here it goes…" };
    const slide = state.result.slide;
    if (slide >= rally.bellFrom && slide <= rally.bellTo) return { status: "won", message: `Ding! The block slid ${slide.toFixed(2)} m and rang the bell.` };
    return { status: "lost", message: slide < rally.bellFrom ? `The block stopped after ${slide.toFixed(2)} m, short of the bell. More energy!` : `The block slid ${slide.toFixed(2)} m and knocked the bell off the table. Less energy!` };
  },
  stars: (state, level) => {
    const rally = RALLIES[level] as Rally;
    const middle = (rally.bellFrom + rally.bellTo) / 2;
    const off = Math.abs((state.result?.slide ?? 0) - middle) / ((rally.bellTo - rally.bellFrom) / 2);
    return off <= 0.3 ? 3 : off <= 0.7 ? 2 : 1;
  },
  readouts: (_state, input, level) => {
    const rally = RALLIES[level] as Rally;
    const preview = runRally(level, rally.fixedHeight ?? input.values.height ?? 0.3, input.values.ball ?? 0.2);
    return [
      { label: "BALL SPEED AT THE BOTTOM √(2gh)", value: `${preview.ballSpeed.toFixed(2)} m/s` },
      { label: "LAST BLOCK'S SPEED", value: `${preview.blockSpeed.toFixed(2)} m/s` },
      { label: "BELL ZONE", value: `${rally.bellFrom}–${rally.bellTo} m` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const rally = RALLIES[level] as Rally;
    sky(context, width, height);
    const floor = height - 50;
    const scale = Math.min(width / 4.2, (height - 100) / 1.7);
    const rampHeight = rally.fixedHeight ?? input.values.height ?? 0.3;
    const foot = 20 + (rampHeight / Math.tan((RAMP_ANGLE * Math.PI) / 180)) * scale;
    context.fillStyle = "#c98b4f";
    context.fillRect(0, floor, width, height - floor);
    context.fillStyle = "#e599f7";
    context.beginPath();
    context.moveTo(20, floor - rampHeight * scale);
    context.lineTo(foot, floor);
    context.lineTo(20, floor);
    context.fill();
    const bellX = foot + 0.3 * scale + rally.blocks * 0.12 * scale;
    context.fillStyle = "rgb(81 207 102 / 50%)";
    context.fillRect(bellX + rally.bellFrom * scale, floor - 6, (rally.bellTo - rally.bellFrom) * scale, 6);
    context.fillStyle = PLAYGROUND_COLOURS.gold;
    context.beginPath();
    context.arc(bellX + rally.bellTo * scale, floor - 28, 14, Math.PI, 0);
    context.fill();
    badge(context, "BELL", bellX + rally.bellTo * scale - 18, floor - 48, "#a67c00");
    const slid = state.result && state.time > ROLL_SECONDS ? slideAt(state.result, Math.min(state.time - ROLL_SECONDS, slideTime(state.result))) : 0;
    for (let i = 0; i < rally.blocks; i += 1) {
      const last = i === rally.blocks - 1;
      const x = foot + 0.3 * scale + i * 0.12 * scale + (last ? Math.max(0, slid) * scale : 0);
      context.fillStyle = ["#ff6b6b", "#4dabf7", "#51cf66"][i % 3] as string;
      context.fillRect(x, floor - 0.1 * scale * (rally.blockKg / 0.2) ** (1 / 3), 0.08 * scale, 0.1 * scale * (rally.blockKg / 0.2) ** (1 / 3));
    }
    const ballX = state.released ? foot + 0.25 * scale : 26;
    const ballY = state.released ? floor - 8 : floor - rampHeight * scale - 8;
    context.fillStyle = PLAYGROUND_COLOURS.player;
    context.beginPath();
    context.arc(ballX, ballY, 6 + 10 * Math.cbrt(input.values.ball ?? 0.2), 0, 2 * Math.PI);
    context.fill();
  },
  describe: (state, input, level) => {
    const rally = RALLIES[level] as Rally;
    return `${rally.title}. Ramp ${(rally.fixedHeight ?? input.values.height ?? 0.3).toFixed(2)} metres high. ${state.result ? `The last block slides ${state.result.slide.toFixed(2)} metres; the bell zone is ${rally.bellFrom} to ${rally.bellTo} metres.` : "Not released yet."}`;
  },
};
