import { ELECTRON_MASS, MUON_MASS } from "../../physics/core";
import { createSeededRandom } from "../../physics/nuclear";
import { calculateBarrierTransmissionEv } from "../../physics/quantum";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

export const GHOSTS_PER_RUN = 1000;
const GHOST_ENERGY_EV = 1;
const WALL_HEIGHT_EV = 3;

interface Maze { readonly title: string; readonly goal: string; readonly particle: "electron" | "muon"; readonly fixedWalls: readonly number[]; readonly arrive: readonly [number, number] }
export const MAZES: readonly Maze[] = [
  { title: "One ghost wall", goal: `Fire ${GHOSTS_PER_RUN} ghost electrons. Make the wall just thin enough that 80–120 of them slip through.`, particle: "electron", fixedWalls: [], arrive: [80, 120] },
  { title: "Two walls", goal: "There is already a 0.2 nm wall in the maze. Set the second wall so that 40–60 ghosts make it through both.", particle: "electron", fixedWalls: [0.2], arrive: [40, 60] },
  { title: "Heavy ghosts", goal: "Now the ghosts are muons, 207 times heavier than electrons. Get 80–120 of them through one wall.", particle: "muon", fixedWalls: [], arrive: [80, 120] },
];

const massOf = (maze: Maze) => (maze.particle === "muon" ? MUON_MASS : ELECTRON_MASS);

/** Chance that one ghost passes every wall: the walls are far apart, so their chances multiply. */
export function passChance(level: number, widthNm: number): number {
  const maze = MAZES[level] as Maze;
  return [...maze.fixedWalls, widthNm].reduce((chance, wall) => chance * calculateBarrierTransmissionEv(GHOST_ENERGY_EV, WALL_HEIGHT_EV, wall, massOf(maze)), 1);
}

/** Fires the ghosts one by one; each passes with the quantum chance. Seeded so a run can be replayed. */
export function fireGhosts(level: number, widthNm: number, seed: number): number {
  const chance = passChance(level, widthNm);
  const random = createSeededRandom(seed);
  let arrived = 0;
  for (let i = 0; i < GHOSTS_PER_RUN; i += 1) if (random() < chance) arrived += 1;
  return arrived;
}

export interface GhostState { readonly runs: number; readonly arrived: number | null; readonly widthNm: number }

export const ghostParticleMaze: LiveGameDefinition<GhostState> = {
  id: "ghost-particle-maze",
  title: "Ghost Particle Maze",
  worldId: "modern-physics",
  eyebrow: "PLAYGROUND · QUANTUM TUNNELLING",
  modelTag: "TUNNELLING · T ≈ e^(−2κa)",
  introduction: "Tiny particles like electrons can do something spooky: sometimes they pass right through a wall that should stop them, like ghosts! Set the walls so the right number of ghosts gets through.",
  howToPlay: "Set the wall's thickness, then press Fire ghosts (Space or Enter). Each run fires 1000 ghosts; count how many arrive.",
  physics: "In the quantum world a particle is also a wave, and the wave leaks a little way into a wall. If the wall is thin enough, some of the wave reaches the other side, so there is a chance the particle appears there: quantum tunnelling. The chance falls off very fast as the wall gets thicker, and it is far smaller for heavier particles. You can never say which ghost will pass, only how many out of a thousand will.",
  assumptions: "Ghosts with 1 eV of energy hitting rectangular walls 3 eV high, the exact one-dimensional transmission formula, walls far enough apart that their chances simply multiply (no echoes between them), and 1000 ghosts per run chosen at random with a replayable seed.",
  levels: MAZES.map((maze, index) => ({ id: `maze-${index + 1}`, title: maze.title, goal: maze.goal })),
  sliders: (level) => [{ key: "width", label: "Wall thickness", unit: "nm", minimum: 0.005, maximum: (MAZES[level] as Maze).particle === "muon" ? 0.1 : 1, step: (MAZES[level] as Maze).particle === "muon" ? 0.0002 : 0.002, initial: (MAZES[level] as Maze).particle === "muon" ? 0.05 : 0.5 }],
  actions: [{ id: "fire", label: "Fire ghosts", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ runs: 0, arrived: null, widthNm: 0.5 }),
  step(state, input, _dt, level) {
    if (!input.pressed.has("fire")) return state;
    const widthNm = input.values.width ?? 0.5;
    return { runs: state.runs + 1, arrived: fireGhosts(level, widthNm, state.runs + 1), widthNm };
  },
  verdict(state, level) {
    const maze = MAZES[level] as Maze;
    if (state.arrived === null) return { status: "playing", message: "Set the wall, then fire the ghosts." };
    if (state.arrived >= maze.arrive[0] && state.arrived <= maze.arrive[1]) return { status: "won", message: `Spooky! ${state.arrived} of ${GHOSTS_PER_RUN} ghosts tunnelled through.` };
    return { status: "playing", message: state.arrived < maze.arrive[0] ? `Only ${state.arrived} got through. Make the wall thinner.` : `${state.arrived} got through: too many. Make the wall thicker.` };
  },
  stars: (state) => (state.runs <= 2 ? 3 : state.runs <= 4 ? 2 : 1),
  readouts: (state, input, level) => {
    const maze = MAZES[level] as Maze;
    const chance = passChance(level, input.values.width ?? 0.5);
    return [
      { label: "PARTICLE", value: maze.particle === "muon" ? "muon (207 × electron mass)" : "electron" },
      { label: "WALLS", value: [...maze.fixedWalls.map((wall) => `${wall} nm (fixed)`), `${(input.values.width ?? 0.5).toFixed(4)} nm (yours)`].join(" + ") },
      { label: "CHANCE TO PASS", value: chance >= 0.001 ? `${(chance * 100).toFixed(2)} %` : `${chance.toExponential(2)}` },
      { label: "LAST RUN", value: state.arrived === null ? "—" : `${state.arrived} of ${GHOSTS_PER_RUN} arrived (wanted ${maze.arrive[0]}–${maze.arrive[1]})` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const maze = MAZES[level] as Maze;
    context.fillStyle = "#1c1235";
    context.fillRect(0, 0, width, height);
    const walls = [...maze.fixedWalls, input.values.width ?? 0.5];
    const maxWall = maze.particle === "muon" ? 0.1 : 1;
    walls.forEach((wall, index) => {
      const x = width * (0.35 + index * 0.25);
      context.fillStyle = index === walls.length - 1 ? "#7950f2" : "#5c5f66";
      context.fillRect(x, 30, 6 + (wall / maxWall) * 60, height - 60);
    });
    // A quantum wave: big on the left, much smaller after each wall.
    context.strokeStyle = "#63e6be";
    context.lineWidth = 2;
    context.beginPath();
    let amplitude = 30;
    for (let x = 0; x <= width; x += 3) {
      const crossed = walls.filter((_, index) => x > width * (0.35 + index * 0.25)).length;
      amplitude = 30 * Math.sqrt(walls.slice(0, crossed).reduce((chance, wall) => chance * calculateBarrierTransmissionEv(GHOST_ENERGY_EV, WALL_HEIGHT_EV, wall, massOf(maze)), 1));
      const y = height / 2 + Math.sin(x / 12) * amplitude;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    const random = createSeededRandom(state.runs + 7);
    const shown = Math.min(40, state.arrived ?? 0);
    context.font = "18px sans-serif";
    for (let i = 0; i < shown; i += 1) context.fillText("👻", width * 0.82 + random() * width * 0.15, 40 + random() * (height - 80));
    badge(context, state.arrived === null ? "ready" : `${state.arrived} arrived`, width - 120, 24, PLAYGROUND_COLOURS.ink);
  },
  describe: (state, input, level) => `Wall ${(input.values.width ?? 0.5).toFixed(4)} nanometres thick; each ghost has a ${(passChance(level, input.values.width ?? 0.5) * 100).toFixed(3)} percent chance to pass. ${state.arrived === null ? "No ghosts fired yet." : `Last run: ${state.arrived} of ${GHOSTS_PER_RUN} arrived.`}`,
};
