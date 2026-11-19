import { LUNAR_GRAVITY } from "../../physics/core";
import { advanceLander, type LanderState } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { LANDER } from "../games/moon-landing/moonLandingData";
import { arrow, circle, ground, label, toScreen, type View } from "./drawing";

const SAFE_SPEED = 3;

interface LanderLevel { readonly title: string; readonly goal: string; readonly altitude: number; readonly velocity: number; readonly fuel: number }
const LEVELS: readonly LanderLevel[] = [
  { title: "First landing", goal: "Touch down below 3 m/s. You start 300 m up, falling at 20 m/s, with 300 kg of fuel.", altitude: 300, velocity: -20, fuel: 300 },
  { title: "Low fuel", goal: "Same descent with only 60 kg of fuel: burn late and decisively.", altitude: 300, velocity: -20, fuel: 60 },
  { title: "Fast approach", goal: "Starting 500 m up at 40 m/s with 120 kg of fuel.", altitude: 500, velocity: -40, fuel: 120 },
];

interface FlightState extends LanderState {
  readonly landed: boolean;
  readonly touchdownSpeed: number | null;
  readonly thrusting: boolean;
}

export const landerLive: LiveGameDefinition<FlightState> = {
  id: "moon-landing-live",
  title: "Moon Landing Live",
  worldId: "astronomy",
  relatedGameId: "moon-landing",
  eyebrow: "ASTRONOMY · THRUST AND GRAVITY",
  modelTag: "ROCKET THRUST · LUNAR GRAVITY",
  introduction: "You have the controls. Hold the engine to slow your fall and touch down gently on the Moon before the fuel runs out.",
  howToPlay: "Hold Thrust (Space or the up arrow, or press and hold the button) to fire the engine. Release to coast. Start begins the descent.",
  physics: "Without the engine the lander speeds up by 1.62 m/s every second. The engine's 9 kN push gives a net upward acceleration of (T/m) − g, which grows as fuel burns and the lander gets lighter. Fuel is used at T/(I_sp g₀), so the most efficient landing burns hard and late rather than hovering.",
  assumptions: "Vertical motion only, lunar gravity 1.62 m/s², no atmosphere, full thrust whenever the engine fires, a 1500 kg lander with I_sp = 311 s, and real time (1 s of play = 1 s of flight).",
  levels: LEVELS.map((entry, index) => ({ id: `landing-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [],
  actions: [{ id: "thrust", label: "Thrust", keys: [" ", "ArrowUp"], hold: true }],
  timing: { fixedTimeStepSeconds: 1 / 60, timeScale: 1 },
  create: (level) => {
    const start = LEVELS[level] as LanderLevel;
    return { altitude: start.altitude, velocity: start.velocity, fuelKg: start.fuel, landed: false, touchdownSpeed: null, thrusting: false };
  },
  step(state, input, dt) {
    if (state.landed) {
      return state;
    }
    const thrusting = input.held.has("thrust") && state.fuelKg > 0;
    const next = advanceLander(state, thrusting, LANDER, LUNAR_GRAVITY, dt);
    if (next.altitude <= 0) {
      // Speed at the moment the altitude reaches zero (interpolated within the step).
      const fraction = state.altitude / Math.max(1e-9, state.altitude - next.altitude);
      const speed = Math.abs(state.velocity + fraction * (next.velocity - state.velocity));
      return { ...next, altitude: 0, velocity: 0, landed: true, touchdownSpeed: speed, thrusting: false };
    }
    return { ...next, landed: false, touchdownSpeed: null, thrusting };
  },
  verdict(state) {
    if (state.landed) {
      return (state.touchdownSpeed ?? 99) <= SAFE_SPEED
        ? { status: "won", message: `Touchdown at ${state.touchdownSpeed?.toFixed(2)} m/s with ${state.fuelKg.toFixed(0)} kg of fuel left.` }
        : { status: "lost", message: `Crashed at ${state.touchdownSpeed?.toFixed(1)} m/s. Fire the engine earlier.` };
    }
    return { status: "playing", message: state.fuelKg <= 0 ? "Out of fuel!" : state.thrusting ? "Engine firing…" : "Coasting." };
  },
  stars: (state, level) => {
    const fuelFraction = state.fuelKg / (LEVELS[level] as LanderLevel).fuel;
    const speed = state.touchdownSpeed ?? 99;
    return speed <= 1.5 && fuelFraction >= 0.2 ? 3 : speed <= 2.2 ? 2 : 1;
  },
  readouts: (state) => [
    { label: "ALTITUDE", value: `${state.altitude.toFixed(1)} m` },
    { label: "VERTICAL SPEED", value: `${state.velocity.toFixed(2)} m/s` },
    { label: "FUEL", value: `${state.fuelKg.toFixed(1)} kg` },
    { label: "ACCELERATION WITH ENGINE", value: `${(LANDER.maximumThrustNewtons / (LANDER.dryMassKilograms + state.fuelKg) - LUNAR_GRAVITY).toFixed(2)} m/s² up` },
  ],
  draw(context, state, _input, width, height, level) {
    const top = (LEVELS[level] as LanderLevel).altitude * 1.05;
    const view: View = { minX: -50, maxX: 50, minY: -5, maxY: top, width, height };
    ground(context, view, 0, "#d8d8dc");
    const craft = toScreen(view, 0, Math.max(0, state.altitude));
    context.fillStyle = "#596be0";
    context.fillRect(craft.x - 14, craft.y - 26, 28, 20);
    label(context, "LANDER", craft.x + 18, craft.y - 14, "#364057");
    if (state.thrusting) {
      context.fillStyle = "#ef9a32";
      context.beginPath();
      context.moveTo(craft.x - 8, craft.y - 6);
      context.lineTo(craft.x + 8, craft.y - 6);
      context.lineTo(craft.x, craft.y + 18);
      context.fill();
    }
    arrow(context, { x: craft.x + 40, y: craft.y - 16 }, { x: craft.x + 40, y: craft.y - 16 - Math.max(-40, Math.min(40, state.velocity * 2)) }, "#d6304f");
    label(context, "v", craft.x + 46, craft.y - 20, "#d6304f");
    const fuelWidth = 120 * (state.fuelKg / Math.max(1, (LEVELS[level] as LanderLevel).fuel));
    context.fillStyle = "#e8ebf2";
    context.fillRect(16, 16, 120, 10);
    context.fillStyle = "#2aab83";
    context.fillRect(16, 16, fuelWidth, 10);
    label(context, "FUEL", 142, 25, "#364057", 10);
    circle(context, width - 40, 40, 14, "#c9ccd6");
  },
  describe: (state) => `Altitude ${state.altitude.toFixed(0)} metres, vertical speed ${state.velocity.toFixed(1)} metres per second, ${state.fuelKg.toFixed(0)} kilograms of fuel, engine ${state.thrusting ? "on" : "off"}.`,
};
