import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky, stars } from "./scenery";

const WIDTH = 20;
const HEIGHT = 12;
const PUFF_IMPULSE = 1;
const GATE_RADIUS = 0.9;
const STOP_SPEED = 0.3;
const TIME_LIMIT = 150;

interface Rink { readonly title: string; readonly goal: string; readonly massKg: number; readonly gates: readonly { x: number; y: number }[]; readonly goalAt: { x: number; y: number }; readonly puffs: number }
export const RINKS: readonly Rink[] = [
  { title: "First glide", goal: "Puff through the star, then stop in the goal circle.", massKg: 2, gates: [{ x: 10, y: 6 }], goalAt: { x: 17, y: 3 }, puffs: 30 },
  { title: "Star slalom", goal: "Pass through all three stars in order, then stop in the goal.", massKg: 2, gates: [{ x: 6, y: 9 }, { x: 11, y: 3 }, { x: 15, y: 9 }], goalAt: { x: 18, y: 6 }, puffs: 40 },
  { title: "Heavy puck", goal: "This puck is twice as heavy, so each puff changes its speed by half as much.", massKg: 4, gates: [{ x: 7, y: 3 }, { x: 13, y: 9 }], goalAt: { x: 18, y: 3 }, puffs: 60 },
];

export interface HockeyState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly next: number;
  readonly puffs: number;
  readonly time: number;
  readonly crashed: boolean;
  readonly trail: readonly { x: number; y: number }[];
}

const PUFFS = { left: [-1, 0], right: [1, 0], up: [0, 1], down: [0, -1] } as const;

export const spaceHockey: LiveGameDefinition<HockeyState> = {
  id: "space-hockey",
  title: "Space Hockey",
  worldId: "mechanics",
  eyebrow: "PLAYGROUND · NEWTON'S LAWS",
  modelTag: "NO FRICTION IN SPACE · F Δt = m Δv",
  introduction: "Your puck floats on a space rink with nothing to slow it down. Each thruster puff gives it a little push. Steer through the stars and stop gently in the goal.",
  howToPlay: "Puff with the arrow keys (or W A S D, or the buttons): each puff pushes the puck the way the arrow points. Remember: to stop, you must puff against the motion!",
  physics: "Newton's first law: with no force, the puck keeps gliding in a straight line at the same speed, forever. Newton's second law: a puff is a force for a short time, and it changes the velocity by Δv = F·Δt / m. A heavier puck needs more puffs for the same change. To stop, push the other way.",
  assumptions: "No friction or air, puffs as short impulses of 1 N·s each, a flat 20 m × 12 m rink, and stars and goal counted when the puck's centre is within 0.9 m.",
  levels: RINKS.map((rink, index) => ({ id: `rink-${index + 1}`, title: rink.title, goal: rink.goal })),
  sliders: () => [],
  actions: [
    { id: "up", label: "Puff ▲", keys: ["ArrowUp", "w", "W"] },
    { id: "down", label: "Puff ▼", keys: ["ArrowDown", "s", "S"] },
    { id: "left", label: "Puff ◀", keys: ["ArrowLeft", "a", "A"] },
    { id: "right", label: "Puff ▶", keys: ["ArrowRight", "d", "D"] },
  ],
  timing: { fixedTimeStepSeconds: 1 / 60, timeScale: 1 },
  create: (level) => ({ x: 2, y: 6, vx: 0, vy: 0, next: 0, puffs: (RINKS[level] as Rink).puffs, time: 0, crashed: false, trail: [{ x: 2, y: 6 }] }),
  step(state, input, dt, level) {
    const rink = RINKS[level] as Rink;
    if (state.crashed) return state;
    let { vx, vy, puffs } = state;
    for (const [id, [dx, dy]] of Object.entries(PUFFS)) {
      if (input.pressed.has(id) && puffs > 0) {
        vx += (dx * PUFF_IMPULSE) / rink.massKg;
        vy += (dy * PUFF_IMPULSE) / rink.massKg;
        puffs -= 1;
      }
    }
    const x = state.x + vx * dt;
    const y = state.y + vy * dt;
    const gate = rink.gates[state.next];
    const next = gate && Math.hypot(x - gate.x, y - gate.y) <= GATE_RADIUS ? state.next + 1 : state.next;
    const crashed = x < 0 || x > WIDTH || y < 0 || y > HEIGHT;
    const trail = Math.floor((state.time + dt) * 4) > Math.floor(state.time * 4) ? [...state.trail.slice(-200), { x, y }] : state.trail;
    return { x, y, vx, vy, next, puffs, time: state.time + dt, crashed, trail };
  },
  verdict(state, level) {
    const rink = RINKS[level] as Rink;
    if (state.crashed) return { status: "lost", message: "Bonk! The puck hit the wall. Puff against the motion to slow down." };
    const speed = Math.hypot(state.vx, state.vy);
    const inGoal = Math.hypot(state.x - rink.goalAt.x, state.y - rink.goalAt.y) <= GATE_RADIUS;
    if (state.next >= rink.gates.length && inGoal && speed < STOP_SPEED) {
      return { status: "won", message: `Parked in the goal with ${state.puffs} puffs to spare!` };
    }
    if (state.time > TIME_LIMIT) return { status: "lost", message: "Time is up." };
    return { status: "playing", message: state.next < rink.gates.length ? `Head for star ${state.next + 1}.` : inGoal ? "In the goal: now stop! Puff against the motion." : "All stars passed. Now stop in the goal." };
  },
  stars: (state, level) => {
    const used = (RINKS[level] as Rink).puffs - state.puffs;
    const budget = 6 + 4 * (RINKS[level] as Rink).gates.length * ((RINKS[level] as Rink).massKg / 2);
    return used <= budget ? 3 : used <= budget * 1.6 ? 2 : 1;
  },
  readouts: (state, _input, level) => [
    { label: "SPEED", value: `${Math.hypot(state.vx, state.vy).toFixed(2)} m/s` },
    { label: "EACH PUFF CHANGES SPEED BY", value: `${(PUFF_IMPULSE / (RINKS[level] as Rink).massKg).toFixed(2)} m/s` },
    { label: "PUFFS LEFT", value: String(state.puffs) },
    { label: "STARS", value: `${state.next} of ${(RINKS[level] as Rink).gates.length}` },
  ],
  draw(context, state, _input, width, height, level) {
    const rink = RINKS[level] as Rink;
    sky(context, width, height, true);
    stars(context, width, height);
    const scale = Math.min(width / WIDTH, height / HEIGHT);
    const at = (x: number, y: number) => ({ x: x * scale, y: height - y * scale });
    context.strokeStyle = "#91a7ff";
    context.lineWidth = 3;
    context.strokeRect(1, height - HEIGHT * scale + 1, WIDTH * scale - 2, HEIGHT * scale - 2);
    rink.gates.forEach((gate, index) => {
      const p = at(gate.x, gate.y);
      context.fillStyle = index < state.next ? "#51cf66" : PLAYGROUND_COLOURS.gold;
      context.font = `${Math.round(GATE_RADIUS * scale * 1.5)}px sans-serif`;
      context.fillText("★", p.x - GATE_RADIUS * scale * 0.55, p.y + GATE_RADIUS * scale * 0.5);
      badge(context, String(index + 1), p.x + 10, p.y - 12, "#5f3dc4");
    });
    const goal = at(rink.goalAt.x, rink.goalAt.y);
    context.strokeStyle = "#ff8787";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(goal.x, goal.y, GATE_RADIUS * scale, 0, 2 * Math.PI);
    context.stroke();
    badge(context, "GOAL", goal.x - 20, goal.y - GATE_RADIUS * scale - 6, "#c92a2a");
    context.strokeStyle = "rgb(255 255 255 / 40%)";
    context.lineWidth = 2;
    context.beginPath();
    state.trail.forEach((point, index) => (index === 0 ? context.moveTo(at(point.x, point.y).x, at(point.x, point.y).y) : context.lineTo(at(point.x, point.y).x, at(point.x, point.y).y)));
    context.stroke();
    const puck = at(state.x, state.y);
    context.fillStyle = "#74c0fc";
    context.beginPath();
    context.arc(puck.x, puck.y, Math.max(8, 0.35 * scale * Math.sqrt(rink.massKg / 2)), 0, 2 * Math.PI);
    context.fill();
  },
  describe: (state, _input, level) => `Puck at ${state.x.toFixed(1)}, ${state.y.toFixed(1)} metres moving at ${Math.hypot(state.vx, state.vy).toFixed(2)} metres per second. ${state.next} of ${(RINKS[level] as Rink).gates.length} stars passed; ${state.puffs} puffs left.`,
};
