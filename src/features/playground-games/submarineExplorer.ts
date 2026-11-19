import { SEAWATER_DENSITY, STANDARD_GRAVITY } from "../../physics/core";
import { calculateGaugePressure } from "../../physics/fluids";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky } from "./scenery";

export const HULL_VOLUME = 12;
export const DRY_MASS = 10_000;
export const BALLAST_MAX = 3000;
const PUMP_RATE = 40;
const DRAG_AREA = 3;
const DRAG_COEFFICIENT = 1;
const HOLD_SECONDS = 4;
const HOLD_RANGE = 1.5;
const HOLD_SPEED = 0.15;
const BUMP_SPEED = 1;
const TIME_LIMIT = 600;
/** Ballast that makes the submarine exactly as heavy as the water it pushes aside. */
export const NEUTRAL_BALLAST = SEAWATER_DENSITY * HULL_VOLUME - DRY_MASS;

interface Station { readonly depth: number; readonly creature: string }
interface Dive { readonly title: string; readonly goal: string; readonly stations: readonly Station[]; readonly seabed: number; readonly crushDepth: number }
export const DIVES: readonly Dive[] = [
  { title: "Meet the fish", goal: "Flood the tanks to sink, then hover beside the fish at 10 m for 4 seconds.", stations: [{ depth: 10, creature: "🐟" }], seabed: 30, crushDepth: 80 },
  { title: "Octopus and turtle", goal: "Visit the octopus at 25 m, then come back up to the turtle at 12 m.", stations: [{ depth: 25, creature: "🐙" }, { depth: 12, creature: "🐢" }], seabed: 40, crushDepth: 80 },
  { title: "Into the deep", goal: "The anglerfish lives at 45 m. Your hull is crushed below 55 m, where the water presses with 5.5 atmospheres!", stations: [{ depth: 45, creature: "🐡" }], seabed: 70, crushDepth: 55 },
];

export interface SubState { readonly depth: number; readonly velocity: number; readonly ballast: number; readonly station: number; readonly held: number; readonly time: number; readonly outcome: "diving" | "crushed" | "bumped" | "done" }

/** One step of the dive: weight of hull and ballast against buoyancy ρVg, with quadratic water drag. */
export function stepSubmarine(state: SubState, flooding: boolean, blowing: boolean, dt: number): Pick<SubState, "depth" | "velocity" | "ballast"> {
  const ballast = Math.min(BALLAST_MAX, Math.max(0, state.ballast + (flooding ? PUMP_RATE * dt : 0) - (blowing ? PUMP_RATE * dt : 0)));
  const weight = (DRY_MASS + ballast) * STANDARD_GRAVITY;
  const buoyancy = SEAWATER_DENSITY * HULL_VOLUME * STANDARD_GRAVITY;
  const drag = 0.5 * SEAWATER_DENSITY * DRAG_COEFFICIENT * DRAG_AREA * state.velocity * Math.abs(state.velocity);
  // Moving the hull also moves water with it: an added mass of about half the displaced water.
  const inertia = DRY_MASS + ballast + 0.5 * SEAWATER_DENSITY * HULL_VOLUME;
  let velocity = state.velocity + ((weight - buoyancy - drag) / inertia) * dt;
  let depth = state.depth + velocity * dt;
  if (depth < 0) {
    depth = 0;
    velocity = Math.max(0, velocity);
  }
  return { depth, velocity, ballast };
}

export const submarineExplorer: LiveGameDefinition<SubState> = {
  id: "submarine-explorer",
  title: "Submarine Explorer",
  worldId: "fluids",
  eyebrow: "PLAYGROUND · PRESSURE AND BUOYANCY",
  modelTag: "BUOYANCY ρVg · PRESSURE ρgh",
  introduction: "Dive, dive, dive! Pilot a little yellow submarine down to visit sea creatures. Fill the tanks with water to sink, and blow them out to rise.",
  howToPlay: "Hold Flood (↓ or S) to let water into the ballast tanks and Blow (↑ or W) to push it out. Hover beside each creature, nearly still, for 4 seconds.",
  physics: "Water pushes up on the submarine with a force equal to the weight of water it pushes aside (Archimedes). If the submarine is heavier than that, it sinks; lighter, it rises; the same, it hovers. Flooding the tanks makes it heavier without changing its size. The deeper you go, the more water presses on the hull: pressure grows by about one atmosphere every 10 m (p = ρgh).",
  assumptions: "A rigid 12 m³ hull of 10 t with up to 3 t of ballast water pumped at 40 kg/s, sea water of 1025 kg/m³ at every depth (it barely compresses), quadratic drag with C_d = 1 on 3 m², an added mass of half the displaced water, and vertical motion only.",
  levels: DIVES.map((dive, index) => ({ id: `dive-${index + 1}`, title: dive.title, goal: dive.goal })),
  sliders: () => [],
  actions: [
    { id: "flood", label: "Flood tanks", keys: ["ArrowDown", "s", "S"], hold: true },
    { id: "blow", label: "Blow tanks", keys: ["ArrowUp", "w", "W"], hold: true },
  ],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 2 },
  create: () => ({ depth: 0, velocity: 0, ballast: NEUTRAL_BALLAST - 100, station: 0, held: 0, time: 0, outcome: "diving" }),
  step(state, input, dt, level) {
    if (state.outcome !== "diving") return state;
    const dive = DIVES[level] as Dive;
    const next = stepSubmarine(state, input.held.has("flood"), input.held.has("blow"), dt);
    if (next.depth > dive.crushDepth) return { ...state, ...next, outcome: "crushed" };
    if (next.depth >= dive.seabed) return { ...state, ...next, depth: dive.seabed, velocity: 0, outcome: next.velocity > BUMP_SPEED ? "bumped" : state.outcome };
    const target = dive.stations[state.station] as Station;
    const holding = Math.abs(next.depth - target.depth) <= HOLD_RANGE && Math.abs(next.velocity) <= HOLD_SPEED;
    const held = holding ? state.held + dt : 0;
    const station = held >= HOLD_SECONDS ? state.station + 1 : state.station;
    return { ...next, station, held: station > state.station ? 0 : held, time: state.time + dt, outcome: station >= dive.stations.length ? "done" : "diving" };
  },
  verdict(state, level) {
    const dive = DIVES[level] as Dive;
    if (state.outcome === "done") return { status: "won", message: `You visited every creature in ${(state.time / 60).toFixed(1)} minutes!` };
    if (state.outcome === "crushed") return { status: "lost", message: `Creak… crunch! Below ${dive.crushDepth} m the water pressure crushed the hull.` };
    if (state.outcome === "bumped") return { status: "lost", message: "Bonk! You hit the seabed too fast." };
    if (state.time > TIME_LIMIT) return { status: "lost", message: "The air is running low: time to go home." };
    const target = dive.stations[state.station] as Station;
    return { status: "playing", message: state.held > 0 ? `Hold still… ${(HOLD_SECONDS - state.held).toFixed(1)} s` : `Head for the ${target.creature} at ${target.depth} m.` };
  },
  stars: (state) => (state.time <= 180 ? 3 : state.time <= 300 ? 2 : 1),
  readouts: (state) => [
    { label: "DEPTH", value: `${state.depth.toFixed(1)} m` },
    { label: "WATER PRESSURE ρgh", value: `${(calculateGaugePressure(state.depth, SEAWATER_DENSITY) / 101_325).toFixed(2)} atm above the air's` },
    { label: "SINKING", value: `${state.velocity.toFixed(2)} m/s ${state.velocity > 0.01 ? "down" : state.velocity < -0.01 ? "up" : ""}` },
    { label: "BALLAST", value: `${state.ballast.toFixed(0)} kg (${state.ballast > NEUTRAL_BALLAST ? "heavier" : "lighter"} than the water it displaces by ${Math.abs(state.ballast - NEUTRAL_BALLAST).toFixed(0)} kg)` },
  ],
  draw(context, state, _input, width, height, level) {
    const dive = DIVES[level] as Dive;
    sky(context, width, 40);
    const scale = (height - 50) / dive.seabed;
    const yOf = (depth: number) => 40 + depth * scale;
    const water = context.createLinearGradient(0, 40, 0, height);
    water.addColorStop(0, "#4dabf7");
    water.addColorStop(1, "#0b1d51");
    context.fillStyle = water;
    context.fillRect(0, 40, width, height - 40);
    context.fillStyle = PLAYGROUND_COLOURS.sand;
    context.fillRect(0, yOf(dive.seabed) - 6, width, 20);
    if (dive.crushDepth < dive.seabed) {
      context.strokeStyle = "rgb(255 107 107 / 80%)";
      context.setLineDash([6, 6]);
      context.beginPath();
      context.moveTo(0, yOf(dive.crushDepth));
      context.lineTo(width, yOf(dive.crushDepth));
      context.stroke();
      context.setLineDash([]);
      badge(context, "crush depth", 8, yOf(dive.crushDepth) - 6, "#c92a2a");
    }
    context.font = "26px sans-serif";
    dive.stations.forEach((station, index) => {
      context.globalAlpha = index < state.station ? 0.4 : 1;
      context.fillText(station.creature, width * 0.62, yOf(station.depth) + 9);
      context.globalAlpha = 1;
      badge(context, `${station.depth} m`, width * 0.62 + 34, yOf(station.depth) + 4, "#1864ab");
    });
    const y = yOf(state.depth);
    context.fillStyle = PLAYGROUND_COLOURS.gold;
    context.beginPath();
    context.ellipse(width * 0.35, y, 46, 18, 0, 0, 2 * Math.PI);
    context.fill();
    context.fillRect(width * 0.35 - 8, y - 30, 16, 14);
    context.fillStyle = "#74c0fc";
    const fill = state.ballast / BALLAST_MAX;
    context.fillRect(width * 0.35 - 30, y + 2, 60 * fill, 8);
    context.strokeStyle = PLAYGROUND_COLOURS.ink;
    context.strokeRect(width * 0.35 - 30, y + 2, 60, 8);
    badge(context, `${state.depth.toFixed(1)} m`, width * 0.35 - 100, y + 4);
  },
  describe: (state) => `The submarine is at ${state.depth.toFixed(1)} metres, moving ${state.velocity.toFixed(2)} metres per second ${state.velocity >= 0 ? "down" : "up"}, with ${state.ballast.toFixed(0)} kilograms of ballast water.`,
};
