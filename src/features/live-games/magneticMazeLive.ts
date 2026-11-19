import { PROTON_MASS, Vector3, ELEMENTARY_CHARGE } from "../../physics/core";
import { advanceChargedParticleBoris } from "../../physics/electromagnetism";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { circle, label, line, toScreen, type View } from "./drawing";

const WIDTH = 1;
const HEIGHT = 0.6;
const SPEED = 1e5;
const START = { x: 0.02, y: 0.3 };

interface Zone { readonly x1: number; readonly x2: number; readonly y1: number; readonly y2: number }
interface MazeLevel { readonly title: string; readonly goal: string; readonly exit: Zone; readonly walls: readonly Zone[]; readonly mustReachX?: number }

const LEVELS: readonly MazeLevel[] = [
  { title: "Turn upward", goal: "Steer the proton out through the gate in the top wall.", exit: { x1: 0.4, x2: 0.6, y1: HEIGHT - 0.001, y2: HEIGHT + 0.05 }, walls: [] },
  { title: "Through the gap", goal: "Dive through the low gap in the wall, then leave through the right-hand side.", exit: { x1: WIDTH - 0.001, x2: WIDTH + 0.05, y1: 0, y2: HEIGHT }, walls: [{ x1: 0.49, x2: 0.51, y1: 0.15, y2: HEIGHT }, { x1: 0.49, x2: 0.51, y1: 0, y2: 0.05 }] },
  { title: "U-turn", goal: "Fly at least halfway across, then turn round and leave through the gate at the top of the left wall.", exit: { x1: -0.05, x2: 0.001, y1: 0.45, y2: HEIGHT }, walls: [], mustReachX: 0.5 },
];

interface MazeState {
  readonly position: Vector3;
  readonly velocity: Vector3;
  readonly trail: readonly { x: number; y: number }[];
  readonly pathLength: number;
  readonly reachedX: number;
  readonly result: "flying" | "out" | "crashed";
}

const inside = (zone: Zone, x: number, y: number) => x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2;

export const magneticMazeLive: LiveGameDefinition<MazeState> = {
  id: "magnetic-maze-live",
  title: "Magnetic Maze Live",
  worldId: "electromagnetism",
  relatedGameId: "magnetic-maze",
  eyebrow: "ELECTRICITY & MAGNETISM · LORENTZ FORCE",
  modelTag: "BORIS INTEGRATOR · CLASSICAL",
  introduction: "A proton flies through a maze at 100 km/s. You control the magnetic field live: turn it up, down or reverse it to bend the proton's path through the gates.",
  howToPlay: "Drag up or down on the maze, or move the slider, to set the field. Positive field (out of the screen) curves the proton clockwise, negative field anticlockwise. Start with the Start button.",
  physics: "The magnetic force qv × B is always at right angles to the proton's velocity, so it bends the path without changing the speed. The tighter you want to turn, the stronger the field: the radius of the circle is r = mv/(qB). Reverse the field and the proton curves the other way.",
  assumptions: "A uniform field perpendicular to the maze that you can change instantly, a classical proton (100 km/s is far below light speed), no electric field, radiation or collisions. Slowed down two million times so you can steer.",
  levels: LEVELS.map((entry, index) => ({ id: `maze-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [{ key: "field", label: "Magnetic field (out of the screen)", unit: "mT", minimum: -10, maximum: 10, step: 0.1, initial: 0 }],
  actions: [],
  timing: { fixedTimeStepSeconds: 1e-8, timeScale: 2e-6, maxSubSteps: 64 },
  onDrag: (_x, y) => ({ field: Math.round((y - 0.5) * 2 * 10 * 10) / 10 }),
  create: () => ({ position: new Vector3(START.x, START.y, 0), velocity: new Vector3(SPEED, 0, 0), trail: [START], pathLength: 0, reachedX: START.x, result: "flying" }),
  step(state, input, dt, level) {
    if (state.result !== "flying") {
      return state;
    }
    const field = new Vector3(0, 0, (input.values.field ?? 0) * 1e-3);
    const next = advanceChargedParticleBoris(state, { chargeCoulombs: ELEMENTARY_CHARGE, massKilograms: PROTON_MASS, electric: Vector3.zero(), magnetic: field, timeStepSeconds: dt });
    const { x, y } = next.position;
    const maze = LEVELS[level] as MazeLevel;
    const reachedX = Math.max(state.reachedX, x);
    const moved = next.position.subtract(state.position).magnitude;
    const trail = state.pathLength + moved - (state.trail.length * 0.005) > 0 ? [...state.trail, { x, y }] : state.trail;
    if (inside(maze.exit, x, y) && reachedX >= (maze.mustReachX ?? 0)) {
      return { ...next, trail, pathLength: state.pathLength + moved, reachedX, result: "out" };
    }
    const hitWall = maze.walls.some((wall) => inside(wall, x, y));
    const left = x < 0 || x > WIDTH || y < 0 || y > HEIGHT;
    return { ...next, trail, pathLength: state.pathLength + moved, reachedX, result: hitWall || left ? "crashed" : "flying" };
  },
  verdict: (state) =>
    state.result === "out"
      ? { status: "won", message: `Through the gate after ${(state.pathLength * 100).toFixed(0)} cm of flight.` }
      : state.result === "crashed"
        ? { status: "lost", message: "The proton hit a wall. Change the field sooner, or more gently." }
        : { status: "playing", message: "Steer with the field." },
  stars: (state) => (state.pathLength < 1.2 ? 3 : state.pathLength < 2 ? 2 : 1),
  readouts: (state, input) => {
    const b = Math.abs((input.values.field ?? 0) * 1e-3);
    return [
      { label: "FIELD", value: `${(input.values.field ?? 0).toFixed(1)} mT` },
      { label: "TURNING RADIUS mv/(qB)", value: b === 0 ? "straight line" : `${((PROTON_MASS * SPEED) / (ELEMENTARY_CHARGE * b) * 100).toFixed(1)} cm` },
      { label: "SPEED (UNCHANGED)", value: `${(state.velocity.magnitude / 1000).toFixed(1)} km/s` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const view: View = { minX: 0, maxX: WIDTH, minY: 0, maxY: HEIGHT, width, height };
    const maze = LEVELS[level] as MazeLevel;
    const corner = toScreen(view, 0, HEIGHT);
    const far = toScreen(view, WIDTH, 0);
    context.strokeStyle = "#7180d8";
    context.lineWidth = 3;
    context.strokeRect(corner.x, corner.y, far.x - corner.x, far.y - corner.y);
    // Field markers: dots out of the screen, crosses into it.
    const field = input.values.field ?? 0;
    context.globalAlpha = 0.35;
    for (let gx = 0.05; gx < WIDTH; gx += 0.1) {
      for (let gy = 0.05; gy < HEIGHT; gy += 0.1) {
        const p = toScreen(view, gx, gy);
        if (field > 0) circle(context, p.x, p.y, 2.5, "#4b5bc4");
        else if (field < 0) line(context, [{ x: p.x - 4, y: p.y - 4 }, { x: p.x + 4, y: p.y + 4 }, { x: p.x, y: p.y }, { x: p.x + 4, y: p.y - 4 }, { x: p.x - 4, y: p.y + 4 }], "#4b5bc4", 1.5);
      }
    }
    context.globalAlpha = 1;
    for (const wall of maze.walls) {
      const a = toScreen(view, wall.x1, wall.y2);
      const b = toScreen(view, wall.x2, wall.y1);
      context.fillStyle = "#4d566b";
      context.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }
    const e1 = toScreen(view, Math.max(0, maze.exit.x1), Math.min(HEIGHT, maze.exit.y2));
    const e2 = toScreen(view, Math.min(WIDTH, maze.exit.x2), Math.max(0, maze.exit.y1));
    context.fillStyle = "rgb(42 171 131 / 35%)";
    context.fillRect(e1.x - 4, e1.y - 4, Math.max(8, e2.x - e1.x + 8), Math.max(8, e2.y - e1.y + 8));
    label(context, "EXIT", e1.x, e1.y - 8, "#1f7d5d");
    line(context, state.trail.map((point) => toScreen(view, point.x, point.y)), "#e27945", 2);
    const p = toScreen(view, state.position.x, state.position.y);
    circle(context, p.x, p.y, 6, "#e27945", "#fff");
  },
  describe: (state, input, level) => `${LEVELS[level]?.goal} Proton at ${(state.position.x * 100).toFixed(0)} centimetres across and ${(state.position.y * 100).toFixed(0)} up. Field ${(input.values.field ?? 0).toFixed(1)} millitesla.`,
};
