import { LUNAR_GRAVITY, STANDARD_GRAVITY } from "../../physics/core";
import { advanceProjectile, launchProjectile, type ProjectileState } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, burst, cloud, sky, stars, sun } from "./scenery";

const FIELD_WIDTH = 100;
const PLAYER_X = 10;
const ENEMY_X = 85;
const HIT_RADIUS = 3;
const PLAYER_FLAGS = 3;
const ENEMY_FLAGS = 2;
const STEP = 1 / 120;
/** How far off the computer's aim is on its 1st, 2nd, 3rd… shot (fraction of launch speed). */
const ENEMY_AIM_ERRORS = [0.09, -0.07, 0.04, -0.02, 0.01, 0] as const;
const ENEMY_ANGLE = 50;

interface Battlefield {
  readonly title: string;
  readonly goal: string;
  readonly gravity: number;
  /** Steady sideways push of the wind, m/s² (positive toward the computer's tank). */
  readonly wind: number;
  readonly ground: (x: number) => number;
  readonly night: boolean;
}

export const BATTLEFIELDS: readonly Battlefield[] = [
  { title: "Training field", goal: "Knock down both of the red tank's flags. No wind today.", gravity: STANDARD_GRAVITY, wind: 0, ground: (x) => 3 + 2 * Math.sin(x / 14), night: false },
  { title: "Windy valley", goal: "A steady wind blows toward the red tank. Allow for it!", gravity: STANDARD_GRAVITY, wind: 1.2, ground: (x) => 4 + 3 * Math.sin(x / 11) + 2 * Math.sin(x / 5), night: false },
  { title: "Moon base", goal: "On the Moon gravity is six times weaker, and a big crater rim stands in the way.", gravity: LUNAR_GRAVITY, wind: 0, ground: (x) => 2 + 14 * Math.exp(-(((x - 48) / 9) ** 2)), night: true },
];

type Phase = "aim" | "player-shell" | "enemy-wait" | "enemy-shell" | "done";

export interface DuelState {
  readonly phase: Phase;
  readonly shell: ProjectileState | null;
  readonly trail: readonly { x: number; y: number }[];
  readonly playerFlags: number;
  readonly enemyFlags: number;
  readonly playerShots: number;
  readonly enemyShots: number;
  readonly wait: number;
  readonly blast: { readonly x: number; readonly y: number; readonly age: number } | null;
  readonly message: string;
}

/** Where a shell fired from (x, ground) lands on the terrain, by stepping the exact motion. */
export function simulateShot(level: number, fromX: number, speed: number, angleDegrees: number, direction: 1 | -1): { x: number; y: number } {
  const field = BATTLEFIELDS[level] as Battlefield;
  let shell = launchProjectile(fromX, field.ground(fromX) + 1, speed, angleDegrees);
  shell = { ...shell, vx: shell.vx * direction };
  for (let i = 0; i < 20_000; i += 1) {
    shell = advanceProjectile(shell, STEP, field.gravity, field.wind);
    if (shell.x < 0 || shell.x > FIELD_WIDTH || shell.y <= field.ground(shell.x)) {
      return { x: shell.x, y: shell.y };
    }
  }
  return { x: shell.x, y: shell.y };
}

/** Launch speed that lands a shell on `toX` at the given angle (bisection on the simulated shot). */
export function solveShotSpeed(level: number, fromX: number, toX: number, angleDegrees: number): number {
  const direction = toX > fromX ? 1 : -1;
  let low = 1;
  let high = 80;
  for (let i = 0; i < 60; i += 1) {
    const middle = (low + high) / 2;
    const landing = simulateShot(level, fromX, middle, angleDegrees, direction).x;
    if ((landing - toX) * direction < 0) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}

function fire(level: number, fromX: number, speed: number, angle: number, direction: 1 | -1): ProjectileState {
  const field = BATTLEFIELDS[level] as Battlefield;
  const shell = launchProjectile(fromX, field.ground(fromX) + 1, speed, angle);
  return { ...shell, vx: shell.vx * direction };
}

export const tankDuel: LiveGameDefinition<DuelState> = {
  id: "tank-duel",
  title: "Tank Duel",
  worldId: "mechanics",
  eyebrow: "PLAYGROUND · PROJECTILE MOTION",
  modelTag: "GRAVITY + WIND, NO AIR DRAG",
  introduction: "Your blue tank faces the red tank across the hills. Take turns firing: set the angle and the power, and land your shell on the red tank before it lands one on you.",
  howToPlay: "Drag on the battlefield to aim (the direction sets the angle, the distance sets the power) or use the sliders. Press Fire (Space or Enter). Then watch out: the red tank fires back!",
  physics: "A shell flies on a curved path called a parabola. Gravity pulls it down a little more every second while it keeps moving sideways, so a faster shell flies farther and 45° goes farthest on flat ground. Wind adds a steady sideways push. On the Moon gravity is weaker, so the same shot flies about six times as far.",
  assumptions: "No air resistance, wind as a constant sideways acceleration, the shell starting 1 m above the ground at the tank, and a hit counted within 3 m of a tank. The red tank aims with a little error that shrinks with every shot.",
  levels: BATTLEFIELDS.map((field, index) => ({ id: `field-${index + 1}`, title: field.title, goal: field.goal })),
  sliders: () => [
    { key: "angle", label: "Barrel angle", unit: "°", minimum: 10, maximum: 80, step: 1, initial: 45 },
    { key: "power", label: "Power (launch speed)", unit: "m/s", minimum: 5, maximum: 45, step: 0.5, initial: 20 },
  ],
  actions: [{ id: "fire", label: "Fire!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: STEP, timeScale: 1.5 },
  onDrag: (x, y) => ({
    angle: Math.round(Math.min(80, Math.max(10, (Math.atan2(y, Math.max(0.01, x)) * 180) / Math.PI))),
    power: Math.round(Math.min(45, Math.max(5, 5 + 40 * Math.min(1, Math.hypot(x, y) / 1.2))) * 2) / 2,
  }),
  create: () => ({ phase: "aim", shell: null, trail: [], playerFlags: PLAYER_FLAGS, enemyFlags: ENEMY_FLAGS, playerShots: 0, enemyShots: 0, wait: 0, blast: null, message: "Your turn: aim and fire!" }),
  step(state, input, dt, level) {
    const field = BATTLEFIELDS[level] as Battlefield;
    const blast = state.blast && state.blast.age < 1 ? { ...state.blast, age: state.blast.age + dt * 1.5 } : null;
    if (state.phase === "done") {
      return { ...state, blast };
    }
    if (state.phase === "aim") {
      if (!input.pressed.has("fire")) {
        return { ...state, blast };
      }
      const shell = fire(level, PLAYER_X, input.values.power ?? 20, input.values.angle ?? 45, 1);
      return { ...state, phase: "player-shell", shell, trail: [{ x: shell.x, y: shell.y }], playerShots: state.playerShots + 1, blast, message: "Shell away!" };
    }
    if (state.phase === "enemy-wait") {
      if (state.wait > 0) {
        return { ...state, wait: state.wait - dt, blast };
      }
      const error = ENEMY_AIM_ERRORS[Math.min(state.enemyShots, ENEMY_AIM_ERRORS.length - 1)] as number;
      const speed = solveShotSpeed(level, ENEMY_X, PLAYER_X, ENEMY_ANGLE) * (1 + error);
      const shell = fire(level, ENEMY_X, speed, ENEMY_ANGLE, -1);
      return { ...state, phase: "enemy-shell", shell, trail: [{ x: shell.x, y: shell.y }], enemyShots: state.enemyShots + 1, blast, message: "The red tank fires!" };
    }
    // A shell is flying.
    const shell = advanceProjectile(state.shell as ProjectileState, dt, field.gravity, field.wind);
    const trail = [...state.trail, { x: shell.x, y: shell.y }];
    const landed = shell.x < 0 || shell.x > FIELD_WIDTH || shell.y <= field.ground(shell.x);
    if (!landed) {
      return { ...state, shell, trail, blast };
    }
    const impact = { x: Math.min(FIELD_WIDTH, Math.max(0, shell.x)), y: field.ground(Math.min(FIELD_WIDTH, Math.max(0, shell.x))), age: 0 };
    if (state.phase === "player-shell") {
      const hit = Math.abs(impact.x - ENEMY_X) <= HIT_RADIUS;
      const enemyFlags = state.enemyFlags - (hit ? 1 : 0);
      if (enemyFlags === 0) {
        return { ...state, phase: "done", shell: null, trail, enemyFlags, blast: impact, message: "Direct hit! The red tank is out of flags." };
      }
      const miss = impact.x - ENEMY_X;
      return {
        ...state, phase: "enemy-wait", wait: 0.8, shell: null, trail, enemyFlags, blast: impact,
        message: hit ? "Direct hit! One flag down." : `Missed: ${Math.abs(miss).toFixed(0)} m ${miss > 0 ? "too far" : "too short"}.`,
      };
    }
    const hit = Math.abs(impact.x - PLAYER_X) <= HIT_RADIUS;
    const playerFlags = state.playerFlags - (hit ? 1 : 0);
    return {
      ...state, phase: playerFlags === 0 ? "done" : "aim", shell: null, trail, playerFlags, blast: impact,
      message: playerFlags === 0 ? "Your tank is out of flags." : hit ? "Ouch, you lost a flag! Your turn." : "The red tank missed. Your turn!",
    };
  },
  verdict: (state) =>
    state.phase === "done"
      ? state.enemyFlags === 0
        ? { status: "won", message: `You won in ${state.playerShots} shot${state.playerShots === 1 ? "" : "s"}!` }
        : { status: "lost", message: "The red tank won this time. Try a different angle or power." }
      : { status: "playing", message: state.message },
  stars: (state) => (state.playerShots <= ENEMY_FLAGS ? 3 : state.playerShots <= ENEMY_FLAGS + 2 ? 2 : 1),
  readouts: (state, input, level) => {
    const field = BATTLEFIELDS[level] as Battlefield;
    const speed = input.values.power ?? 20;
    const angle = ((input.values.angle ?? 45) * Math.PI) / 180;
    return [
      { label: "YOUR FLAGS", value: `${"⚑ ".repeat(state.playerFlags)}(${state.playerFlags})` },
      { label: "RED TANK FLAGS", value: `${"⚑ ".repeat(state.enemyFlags)}(${state.enemyFlags})` },
      { label: "FLAT-GROUND RANGE v² sin2θ / g", value: `${((speed * speed * Math.sin(2 * angle)) / field.gravity).toFixed(0)} m` },
      { label: "WIND", value: field.wind === 0 ? "calm" : `${field.wind} m/s² → toward red` },
      { label: "GRAVITY", value: `${field.gravity.toFixed(2)} m/s²` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const field = BATTLEFIELDS[level] as Battlefield;
    sky(context, width, height, field.night);
    if (field.night) {
      stars(context, width, height);
    } else {
      sun(context, width - 50, 45);
      cloud(context, width * 0.2, 50);
      cloud(context, width * 0.55, 80, 0.8);
    }
    const scale = width / FIELD_WIDTH;
    const toScreen = (x: number, y: number) => ({ x: x * scale, y: height - 20 - y * scale });
    context.beginPath();
    context.moveTo(0, height);
    for (let x = 0; x <= FIELD_WIDTH; x += 0.5) {
      const p = toScreen(x, field.ground(x));
      context.lineTo(p.x, p.y);
    }
    context.lineTo(width, height);
    context.fillStyle = field.night ? "#b9b9c9" : PLAYGROUND_COLOURS.grass;
    context.fill();
    context.strokeStyle = field.night ? "#7c7c92" : PLAYGROUND_COLOURS.grassDark;
    context.lineWidth = 3;
    context.stroke();
    const tank = (x: number, colour: string, flags: number, facing: 1 | -1, angle: number) => {
      const base = toScreen(x, field.ground(x));
      context.fillStyle = colour;
      context.beginPath();
      context.roundRect(base.x - 16, base.y - 14, 32, 14, 5);
      context.fill();
      context.fillStyle = PLAYGROUND_COLOURS.ink;
      context.fillRect(base.x - 16, base.y - 4, 32, 5);
      const rad = (angle * Math.PI) / 180;
      context.strokeStyle = colour;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(base.x, base.y - 12);
      context.lineTo(base.x + facing * Math.cos(rad) * 22, base.y - 12 - Math.sin(rad) * 22);
      context.stroke();
      for (let i = 0; i < flags; i += 1) {
        context.fillStyle = PLAYGROUND_COLOURS.gold;
        context.fillRect(base.x - 14 + i * 10, base.y - 34, 7, 6);
        context.fillStyle = PLAYGROUND_COLOURS.ink;
        context.fillRect(base.x - 14 + i * 10, base.y - 34, 1.5, 16);
      }
    };
    tank(PLAYER_X, PLAYGROUND_COLOURS.player, state.playerFlags, 1, input.values.angle ?? 45);
    tank(ENEMY_X, PLAYGROUND_COLOURS.enemy, state.enemyFlags, -1, ENEMY_ANGLE);
    badge(context, "YOU", toScreen(PLAYER_X, field.ground(PLAYER_X)).x - 18, toScreen(PLAYER_X, field.ground(PLAYER_X)).y + 22, PLAYGROUND_COLOURS.player);
    badge(context, "RED", toScreen(ENEMY_X, field.ground(ENEMY_X)).x - 18, toScreen(ENEMY_X, field.ground(ENEMY_X)).y + 22, PLAYGROUND_COLOURS.enemy);
    if (state.trail.length > 1) {
      context.setLineDash([5, 5]);
      context.strokeStyle = "rgb(29 36 64 / 60%)";
      context.lineWidth = 2;
      context.beginPath();
      state.trail.forEach((point, index) => {
        const p = toScreen(point.x, point.y);
        if (index === 0) context.moveTo(p.x, p.y);
        else context.lineTo(p.x, p.y);
      });
      context.stroke();
      context.setLineDash([]);
    }
    if (state.shell) {
      const p = toScreen(state.shell.x, state.shell.y);
      context.beginPath();
      context.arc(p.x, p.y, 5, 0, 2 * Math.PI);
      context.fillStyle = PLAYGROUND_COLOURS.ink;
      context.fill();
    }
    if (state.blast) {
      const p = toScreen(state.blast.x, state.blast.y);
      burst(context, p.x, p.y, state.blast.age);
    }
    if (field.wind !== 0) {
      badge(context, `WIND → ${field.wind} m/s²`, 12, 24, "#1e7a8c");
    }
  },
  describe: (state, input, level) =>
    `${BATTLEFIELDS[level]?.title}. Your barrel is at ${input.values.angle ?? 45} degrees with power ${input.values.power ?? 20} metres per second. You have ${state.playerFlags} flags; the red tank has ${state.enemyFlags}. ${state.message}`,
};
