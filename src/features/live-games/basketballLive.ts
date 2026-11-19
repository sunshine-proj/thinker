import { advanceProjectile, launchProjectile, type ProjectileState } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { circle, ground, label, line, toScreen, type View } from "./drawing";

const RELEASE_HEIGHT = 2;
const RIM_HEIGHT = 3.05;
const RIM_RADIUS = 0.23;
const BALL_RADIUS = 0.12;
const BOARD_OFFSET = 0.38;
const BOARD_RESTITUTION = 0.6;
const MAX_SHOTS = 6;

interface CourtLevel { readonly title: string; readonly goal: string; readonly distance: number; readonly defender: { x: number; height: number } | null }
const LEVELS: readonly CourtLevel[] = [
  { title: "Free throw", goal: "Score from the free-throw line, 4.2 m from the hoop.", distance: 4.2, defender: null },
  { title: "Three-pointer", goal: "Score from 6.75 m.", distance: 6.75, defender: null },
  { title: "Over the defender", goal: "A 2.9 m-tall block stands 1 m in front of you. Loft the ball over it and score from 5 m.", distance: 5, defender: { x: 1, height: 2.9 } },
];

interface CourtState {
  readonly ball: ProjectileState | null;
  readonly trail: readonly { x: number; y: number }[];
  readonly shots: number;
  readonly scored: boolean;
  readonly lastResult: string | null;
}

export const basketballLive: LiveGameDefinition<CourtState> = {
  id: "basketball-challenge-live",
  title: "Basketball Challenge Live",
  worldId: "everyday",
  relatedGameId: "basketball-challenge",
  eyebrow: "EVERYDAY PHYSICS · SPORTS",
  modelTag: "PROJECTILE MOTION · BACKBOARD BOUNCE",
  introduction: "Aim and shoot. The ball follows a parabola from your hands to the hoop; a shot that hits the backboard bounces off it at reduced speed, which can still drop in.",
  howToPlay: "Drag on the court to aim (direction sets the angle, distance the speed) or use the sliders, then press Shoot (Space or Enter). Start begins the game.",
  physics: "After release the ball moves sideways at constant speed while gravity changes its vertical speed by 9.81 m/s every second. A steeper shot comes down more vertically, so the hoop looks bigger to the ball; a flatter one needs less speed but has little room for error. The backboard reverses the ball's horizontal velocity and keeps only part of it (coefficient of restitution about 0.6).",
  assumptions: "No air resistance or spin, release 2 m above the floor, a rim 3.05 m high and 46 cm across, the ball counted in when its centre drops through the rim with clearance for its radius, and rim bounces ignored.",
  levels: LEVELS.map((entry, index) => ({ id: `court-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [
    { key: "angle", label: "Release angle", unit: "°", minimum: 20, maximum: 75, step: 0.5, initial: 50 },
    { key: "speed", label: "Release speed", unit: "m/s", minimum: 4, maximum: 12, step: 0.05, initial: 7 },
  ],
  actions: [{ id: "shoot", label: "Shoot", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 240, timeScale: 1 },
  onDrag: (x, y) => ({
    angle: Math.round(Math.min(75, Math.max(20, (Math.atan2(y * 5, Math.max(0.01, x * 8)) * 180) / Math.PI)) * 2) / 2,
    speed: Math.round(Math.min(12, Math.max(4, 4 + 8 * Math.min(1, Math.hypot(x, y) / 1.2))) * 20) / 20,
  }),
  create: () => ({ ball: null, trail: [], shots: 0, scored: false, lastResult: null }),
  step(state, input, dt, level) {
    if (state.scored) {
      return state;
    }
    const court = LEVELS[level] as CourtLevel;
    if (!state.ball) {
      if (!input.pressed.has("shoot") || state.shots >= MAX_SHOTS) {
        return state;
      }
      return { ...state, ball: launchProjectile(0, RELEASE_HEIGHT, input.values.speed ?? 7, input.values.angle ?? 50), trail: [{ x: 0, y: RELEASE_HEIGHT }] };
    }
    let next = advanceProjectile(state.ball, dt);
    const board = court.distance + BOARD_OFFSET;
    if (next.x + BALL_RADIUS >= board && next.vx > 0 && next.y > RIM_HEIGHT - 0.1 && next.y < RIM_HEIGHT + 1.05) {
      next = { ...next, x: board - BALL_RADIUS, vx: -BOARD_RESTITUTION * next.vx };
    }
    const trail = [...state.trail, { x: next.x, y: next.y }];
    const crossedRim = state.ball.y > RIM_HEIGHT && next.y <= RIM_HEIGHT && next.vy < 0;
    if (crossedRim) {
      const fraction = (state.ball.y - RIM_HEIGHT) / (state.ball.y - next.y);
      const x = state.ball.x + fraction * (next.x - state.ball.x);
      if (Math.abs(x - court.distance) <= RIM_RADIUS - BALL_RADIUS) {
        return { ball: null, trail, shots: state.shots + 1, scored: true, lastResult: "Swish!" };
      }
    }
    if (court.defender && Math.abs(next.x - court.defender.x) < 0.15 && next.y < court.defender.height) {
      return { ball: null, trail, shots: state.shots + 1, scored: false, lastResult: "Blocked by the defender." };
    }
    if (next.y <= BALL_RADIUS || next.x > board + 1 || next.x < -2) {
      const short = next.x < court.distance;
      return { ball: null, trail, shots: state.shots + 1, scored: false, lastResult: short ? "Short of the hoop." : "Long: past the hoop." };
    }
    return { ...state, ball: next, trail };
  },
  verdict(state) {
    if (state.scored) {
      return { status: "won", message: `Scored with shot ${state.shots}.` };
    }
    if (state.shots >= MAX_SHOTS && !state.ball) {
      return { status: "lost", message: `Out of shots. ${state.lastResult ?? ""}` };
    }
    return { status: "playing", message: state.ball ? "Ball in the air…" : state.lastResult ? `${state.lastResult} ${MAX_SHOTS - state.shots} shots left.` : "Aim and shoot." };
  },
  stars: (state) => (state.shots <= 1 ? 3 : state.shots <= 3 ? 2 : 1),
  readouts: (state, input) => [
    { label: "RELEASE", value: `${(input.values.speed ?? 7).toFixed(2)} m/s at ${(input.values.angle ?? 50).toFixed(1)}°` },
    { label: "SHOTS", value: `${state.shots} of ${MAX_SHOTS}` },
    { label: "LAST SHOT", value: state.lastResult ?? "—" },
  ],
  draw(context, state, input, width, height, level) {
    const court = LEVELS[level] as CourtLevel;
    const view: View = { minX: -0.5, maxX: court.distance + 1.2, minY: 0, maxY: 5, width, height };
    ground(context, view, 0, "#e9d6b6");
    const rimLeft = toScreen(view, court.distance - RIM_RADIUS, RIM_HEIGHT);
    const rimRight = toScreen(view, court.distance + RIM_RADIUS, RIM_HEIGHT);
    line(context, [rimLeft, rimRight], "#e0571f", 4);
    const boardBottom = toScreen(view, court.distance + BOARD_OFFSET, RIM_HEIGHT - 0.1);
    const boardTop = toScreen(view, court.distance + BOARD_OFFSET, RIM_HEIGHT + 1.05);
    line(context, [boardBottom, boardTop], "#364057", 5);
    if (court.defender) {
      const base = toScreen(view, court.defender.x, 0);
      const top = toScreen(view, court.defender.x, court.defender.height);
      line(context, [base, top], "#8a4fc4", 10);
      label(context, "DEFENDER", top.x + 8, top.y + 12, "#6a3aa0");
    }
    const hands = toScreen(view, 0, RELEASE_HEIGHT);
    const angle = ((input.values.angle ?? 50) * Math.PI) / 180;
    line(context, [hands, toScreen(view, Math.cos(angle) * 0.6, RELEASE_HEIGHT + Math.sin(angle) * 0.6)], "#596be0", 4);
    line(context, state.trail.map((point) => toScreen(view, point.x, point.y)), "#e88a2e", 2, true);
    if (state.ball) {
      const ball = toScreen(view, state.ball.x, state.ball.y);
      circle(context, ball.x, ball.y, 8, "#e0571f", "#7a2a08");
    }
  },
  describe: (state, input, level) => `Hoop ${LEVELS[level]?.distance} metres away. Release ${(input.values.speed ?? 7).toFixed(1)} metres per second at ${(input.values.angle ?? 50).toFixed(0)} degrees. ${state.lastResult ?? ""}`,
};
