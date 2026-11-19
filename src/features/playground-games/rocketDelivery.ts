import { LUNAR_GRAVITY, MARS_GRAVITY, VESTA_GRAVITY } from "../../physics/core";
import { advanceLander, type LanderSpecification, type LanderState } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, stars } from "./scenery";

export const DELIVERY_ROCKET: LanderSpecification = { dryMassKilograms: 1000, maximumThrustNewtons: 8000, specificImpulseSeconds: 300 };
export const PIZZA_SAFE_SPEED = 2;
const LOST_ALTITUDE = 1500;

interface Stop { readonly title: string; readonly goal: string; readonly place: string; readonly gravity: number; readonly altitude: number; readonly velocity: number; readonly fuel: number; readonly ground: string }
export const STOPS: readonly Stop[] = [
  { title: "Moon pizza", goal: "Deliver a pizza to the Moon base: touch down slower than 2 m/s so the toppings stay on.", place: "the Moon", gravity: LUNAR_GRAVITY, altitude: 400, velocity: -15, fuel: 250, ground: "#adb5bd" },
  { title: "Mars pizza", goal: "Mars pulls more than twice as hard as the Moon. Your engine has less spare push: brake early!", place: "Mars", gravity: MARS_GRAVITY, altitude: 400, velocity: -15, fuel: 250, ground: "#d9480f" },
  { title: "Asteroid pizza", goal: "The asteroid Vesta barely pulls at all. Too much thrust and you fly off into space!", place: "Vesta", gravity: VESTA_GRAVITY, altitude: 200, velocity: -6, fuel: 60, ground: "#868e96" },
];

export interface DeliveryState extends LanderState { readonly landed: boolean; readonly touchdownSpeed: number | null; readonly thrusting: boolean }

export const rocketDelivery: LiveGameDefinition<DeliveryState> = {
  id: "rocket-delivery",
  title: "Rocket Delivery",
  worldId: "astronomy",
  eyebrow: "PLAYGROUND · THRUST AND WEIGHT",
  modelTag: "F = T − m g · DIFFERENT GRAVITY",
  introduction: "Space Pizza Express! Fly the delivery rocket down to the Moon, Mars and an asteroid, and land so gently that the pizza arrives perfect.",
  howToPlay: "Hold Thrust (Space or ↑) to fire the engine and slow down. Let go to fall. Land slower than 2 m/s.",
  physics: "Your weight is m·g, and g is different on every world: 1.6 m/s² on the Moon, 3.7 on Mars, only 0.25 on the asteroid Vesta. The engine always pushes with the same force, so on Mars there is less spare push to slow down with, and on Vesta even a short burn sends you back up. As fuel burns, the rocket gets lighter and the same push slows it more.",
  assumptions: "Straight-down flight only, a 1000 kg rocket plus fuel with an 8 kN engine and I_sp = 300 s, constant gravity near each surface, no air (Mars's thin atmosphere would help a little), and no sideways motion.",
  levels: STOPS.map((stop, index) => ({ id: `stop-${index + 1}`, title: stop.title, goal: stop.goal })),
  sliders: () => [],
  actions: [{ id: "thrust", label: "Thrust 🔥", keys: [" ", "ArrowUp", "w", "W"], hold: true }],
  timing: { fixedTimeStepSeconds: 1 / 60, timeScale: 1 },
  create: (level) => {
    const stop = STOPS[level] as Stop;
    return { altitude: stop.altitude, velocity: stop.velocity, fuelKg: stop.fuel, landed: false, touchdownSpeed: null, thrusting: false };
  },
  step(state, input, dt, level) {
    if (state.landed || state.altitude > LOST_ALTITUDE) return state;
    const stop = STOPS[level] as Stop;
    const thrusting = input.held.has("thrust") && state.fuelKg > 0;
    const next = advanceLander(state, thrusting, DELIVERY_ROCKET, stop.gravity, dt);
    if (next.altitude <= 0) return { ...next, altitude: 0, velocity: 0, landed: true, touchdownSpeed: Math.abs(next.velocity), thrusting };
    return { ...next, landed: false, touchdownSpeed: null, thrusting };
  },
  verdict(state, level) {
    const stop = STOPS[level] as Stop;
    if (state.altitude > LOST_ALTITUDE) return { status: "lost", message: "Oops, the rocket flew away from the asteroid. Its gravity is so weak that a little thrust goes a long way." };
    if (state.landed && state.touchdownSpeed !== null) {
      return state.touchdownSpeed <= PIZZA_SAFE_SPEED
        ? { status: "won", message: `Pizza delivered to ${stop.place} at ${state.touchdownSpeed.toFixed(1)} m/s. Still hot!` }
        : { status: "lost", message: `Splat! You hit ${stop.place} at ${state.touchdownSpeed.toFixed(1)} m/s and the pizza flipped over.` };
    }
    return { status: "playing", message: state.fuelKg <= 0 ? "Out of fuel! Fingers crossed…" : `Falling at ${Math.max(0, -state.velocity).toFixed(1)} m/s.` };
  },
  stars: (state, level) => {
    const left = state.fuelKg / (STOPS[level] as Stop).fuel;
    return left >= 0.4 ? 3 : left >= 0.2 ? 2 : 1;
  },
  readouts: (state, _input, level) => {
    const stop = STOPS[level] as Stop;
    const mass = DELIVERY_ROCKET.dryMassKilograms + state.fuelKg;
    return [
      { label: "HEIGHT", value: `${state.altitude.toFixed(0)} m` },
      { label: "SPEED", value: `${Math.abs(state.velocity).toFixed(1)} m/s ${state.velocity < 0 ? "down" : state.velocity > 0 ? "up" : ""}` },
      { label: "WEIGHT m·g vs ENGINE", value: `${(mass * stop.gravity).toFixed(0)} N vs ${DELIVERY_ROCKET.maximumThrustNewtons} N` },
      { label: "FUEL", value: `${state.fuelKg.toFixed(0)} kg` },
    ];
  },
  draw(context, state, _input, width, height, level) {
    const stop = STOPS[level] as Stop;
    context.fillStyle = level === 1 ? "#5c2b1f" : "#0b0d26";
    context.fillRect(0, 0, width, height);
    stars(context, width, height);
    const ground = height - 40;
    context.fillStyle = stop.ground;
    context.fillRect(0, ground, width, 40);
    context.fillStyle = PLAYGROUND_COLOURS.gold;
    context.fillRect(width / 2 - 40, ground - 4, 80, 4);
    badge(context, "PIZZA PAD", width / 2 - 34, ground + 22, "#a67c00");
    const scale = (ground - 40) / Math.max(stop.altitude * 1.2, 50);
    const y = ground - Math.min(state.altitude, stop.altitude * 1.25) * scale;
    const x = width / 2;
    context.fillStyle = "#f8f9fa";
    context.beginPath();
    context.moveTo(x, y - 46);
    context.lineTo(x + 12, y - 20);
    context.lineTo(x + 12, y);
    context.lineTo(x - 12, y);
    context.lineTo(x - 12, y - 20);
    context.fill();
    context.fillStyle = PLAYGROUND_COLOURS.enemy;
    context.fillRect(x - 18, y - 10, 6, 10);
    context.fillRect(x + 12, y - 10, 6, 10);
    if (state.thrusting) {
      context.fillStyle = "#ff922b";
      context.beginPath();
      context.moveTo(x - 8, y);
      context.lineTo(x, y + 22);
      context.lineTo(x + 8, y);
      context.fill();
    }
    context.font = "16px sans-serif";
    context.fillText("🍕", x - 9, y - 22);
    badge(context, `g = ${stop.gravity} m/s²`, 12, 24, "#364fc7");
  },
  describe: (state, _input, level) => `Descending to ${(STOPS[level] as Stop).place}: ${state.altitude.toFixed(0)} metres up, ${Math.abs(state.velocity).toFixed(1)} metres per second ${state.velocity < 0 ? "downward" : "upward"}, ${state.fuelKg.toFixed(0)} kilograms of fuel.`,
};
