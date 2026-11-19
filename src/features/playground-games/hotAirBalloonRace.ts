import { STANDARD_GRAVITY, celsiusToKelvin } from "../../physics/core";
import { calculateAirDensity, calculateFloatTemperature } from "../../physics/fluids";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, cloud, sky, sun } from "./scenery";

export const ENVELOPE_VOLUME = 2800;
export const LOAD_KG = 500;
export const OUTSIDE_KELVIN = celsiusToKelvin(15);
const BURNER_WATTS = 2e6;
const AIR_SPECIFIC_HEAT = 1005;
/** Envelope cooling time constant, and the much faster one with the top vent open. */
const COOLING_SECONDS = 300;
const VENT_SECONDS = 40;
const DRAG_COEFFICIENT = 0.5;
const RADIUS = Math.cbrt((3 * ENVELOPE_VOLUME) / (4 * Math.PI));
const FRONTAL_AREA = Math.PI * RADIUS ** 2;
export const MAX_ENVELOPE_KELVIN = celsiusToKelvin(120);
const HARD_LANDING = 3;
/** Balloons must stay below this height here: aeroplanes fly above it. */
export const CEILING = 300;
const TIME_LIMIT = 900;

/** Wind blows faster higher up: 2 m/s at the ground, 1 m/s more every 40 m. */
export const windAt = (altitude: number) => 2 + Math.max(0, altitude) / 40;

interface Box { readonly x0: number; readonly x1: number; readonly bottom: number; readonly top: number; readonly kind: "hill" | "cloud" }
interface Course { readonly title: string; readonly goal: string; readonly length: number; readonly obstacles: readonly Box[]; readonly landing?: readonly [number, number] }
export const COURSES: readonly Course[] = [
  { title: "Over the hill", goal: "Climb over the hill and float past the finish flag.", length: 1000, obstacles: [{ x0: 400, x1: 600, bottom: 0, top: 120, kind: "hill" }] },
  {
    title: "Hills and clouds",
    goal: "Over the first hill, under the low storm cloud, then up over the second hill.",
    length: 1600,
    obstacles: [
      { x0: 300, x1: 450, bottom: 0, top: 140, kind: "hill" },
      { x0: 800, x1: 1000, bottom: 110, top: 600, kind: "cloud" },
      { x0: 1200, x1: 1350, bottom: 0, top: 140, kind: "hill" },
    ],
  },
  { title: "Land on the target", goal: "Cross the hill, then land gently on the big target.", length: 1400, obstacles: [{ x0: 300, x1: 500, bottom: 0, top: 130, kind: "hill" }], landing: [900, 1100] },
];

export interface BalloonRaceState {
  readonly x: number;
  readonly altitude: number;
  readonly climb: number;
  readonly insideKelvin: number;
  readonly time: number;
  readonly airborne: boolean;
  readonly outcome: "flying" | "crashed" | "too-high" | "overheated" | "hard-landing" | "finished" | "landed" | "wrong-landing";
}

const floatKelvin = calculateFloatTemperature(ENVELOPE_VOLUME, LOAD_KG, OUTSIDE_KELVIN);

/** One step of the balloon: heat balance of the envelope air, then buoyancy, weight and drag. */
export function stepBalloon(state: BalloonRaceState, burning: boolean, venting: boolean, dt: number): BalloonRaceState {
  const outsideDensity = calculateAirDensity(OUTSIDE_KELVIN);
  const insideDensity = calculateAirDensity(state.insideKelvin);
  const airMass = insideDensity * ENVELOPE_VOLUME;
  const heating = burning ? BURNER_WATTS / (airMass * AIR_SPECIFIC_HEAT) : 0;
  const cooling = (state.insideKelvin - OUTSIDE_KELVIN) * (1 / COOLING_SECONDS + (venting ? 1 / VENT_SECONDS : 0));
  const insideKelvin = state.insideKelvin + (heating - cooling) * dt;
  const lift = (outsideDensity - insideDensity) * ENVELOPE_VOLUME * STANDARD_GRAVITY;
  const drag = 0.5 * outsideDensity * DRAG_COEFFICIENT * FRONTAL_AREA * state.climb * Math.abs(state.climb);
  const inertia = LOAD_KG + airMass + 0.5 * outsideDensity * ENVELOPE_VOLUME;
  let climb = state.climb + ((lift - LOAD_KG * STANDARD_GRAVITY - drag) / inertia) * dt;
  let altitude = state.altitude + climb * dt;
  if (altitude <= 0) {
    altitude = 0;
    climb = Math.max(0, climb);
  }
  const x = state.x + (altitude > 0 ? windAt(altitude) : 0) * dt;
  return { ...state, x, altitude, climb, insideKelvin, time: state.time + dt, airborne: state.airborne || altitude > 2 };
}

export const hotAirBalloonRace: LiveGameDefinition<BalloonRaceState> = {
  id: "hot-air-balloon-race",
  title: "Hot Air Balloon Race",
  worldId: "thermodynamics",
  eyebrow: "PLAYGROUND · HOT AIR AND BUOYANCY",
  modelTag: "ρ = PM/RT · LIFT = (ρout − ρin) V g",
  introduction: "Fire the burner and float away! Climb over hills, duck under storm clouds, and ride the wind to the finish.",
  howToPlay: "Hold Burn (Space or ↑) to heat the air in the balloon. Hold Vent (V or ↓) to let hot air out of the top. The balloon reacts slowly, so plan ahead! Higher up, the wind blows you faster, but stay below the 300 m line.",
  physics: "Hot air is lighter than cold air: its particles move faster and spread out, so the same space holds less air (ρ = PM/RT). The balloon floats when the cold air it pushes aside weighs more than the hot air inside plus the basket. Heat the air to rise; let it cool to sink. It takes time to heat a whole balloon of air, so the balloon is slow to respond.",
  assumptions: "A 2800 m³ envelope carrying 500 kg, outside air at 15 °C and sea-level pressure at every height, the envelope air at one temperature heated by a 2 MW burner and cooling with a 5-minute time constant (40 s extra with the vent open), quadratic drag on a sphere with half its volume of air moving with it, and the balloon drifting at the wind speed.",
  levels: COURSES.map((course, index) => ({ id: `course-${index + 1}`, title: course.title, goal: course.goal })),
  sliders: () => [],
  actions: [
    { id: "burn", label: "Burn 🔥", keys: [" ", "ArrowUp", "w", "W"], hold: true },
    { id: "vent", label: "Vent", keys: ["v", "V", "ArrowDown", "s", "S"], hold: true },
  ],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 4 },
  create: () => ({ x: 0, altitude: 0, climb: 0, insideKelvin: floatKelvin - 5, time: 0, airborne: false, outcome: "flying" }),
  step(state, input, dt, level) {
    if (state.outcome !== "flying") return state;
    const course = COURSES[level] as Course;
    const previousClimb = state.climb;
    const next = stepBalloon(state, input.held.has("burn"), input.held.has("vent"), dt);
    let outcome: BalloonRaceState["outcome"] = "flying";
    if (next.insideKelvin > MAX_ENVELOPE_KELVIN) outcome = "overheated";
    else if (next.altitude > CEILING) outcome = "too-high";
    else if (course.obstacles.some((box) => next.x >= box.x0 && next.x <= box.x1 && next.altitude >= box.bottom && next.altitude <= box.top)) outcome = "crashed";
    else if (next.airborne && next.altitude === 0 && state.altitude > 0) {
      if (-previousClimb > HARD_LANDING) outcome = "hard-landing";
      else if (course.landing) outcome = next.x >= course.landing[0] && next.x <= course.landing[1] ? "landed" : "wrong-landing";
    } else if (!course.landing && next.x >= course.length) outcome = "finished";
    else if (course.landing && next.x > course.length) outcome = "wrong-landing";
    return { ...next, outcome };
  },
  verdict(state, level) {
    const course = COURSES[level] as Course;
    switch (state.outcome) {
      case "finished":
        return { status: "won", message: `Past the finish flag in ${(state.time / 60).toFixed(1)} minutes!` };
      case "landed":
        return { status: "won", message: "Touchdown on the target! A perfect balloon landing." };
      case "crashed":
        return { status: "lost", message: "Oops! The balloon bumped into an obstacle. Change height earlier: the balloon reacts slowly." };
      case "too-high":
        return { status: "lost", message: `Too high! Balloons must stay below ${CEILING} m here, where aeroplanes fly.` };
      case "overheated":
        return { status: "lost", message: "The envelope got hotter than 120 °C. Burn in short bursts!" };
      case "hard-landing":
        return { status: "lost", message: "Bump! That landing was too fast. Let the balloon sink slowly." };
      case "wrong-landing":
        return { status: "lost", message: "That is not the landing target." };
      default:
        if (state.time > TIME_LIMIT) return { status: "lost", message: "The race is over: too slow." };
        return { status: "playing", message: !state.airborne ? "Hold Burn to take off." : course.landing ? "Head for the landing target." : "Ride the wind to the finish." };
    }
  },
  stars: (state, level) => {
    const course = COURSES[level] as Course;
    const minutes = state.time / 60;
    const par = course.length / 250;
    return minutes <= par ? 3 : minutes <= par * 1.4 ? 2 : 1;
  },
  readouts: (state) => [
    { label: "AIR INSIDE", value: `${(state.insideKelvin - 273.15).toFixed(0)} °C (floats at ${(floatKelvin - 273.15).toFixed(0)} °C)` },
    { label: "HEIGHT", value: `${state.altitude.toFixed(0)} m` },
    { label: "CLIMBING", value: `${state.climb.toFixed(1)} m/s` },
    { label: "WIND", value: `${windAt(state.altitude).toFixed(1)} m/s` },
  ],
  draw(context, state, input, width, height, level) {
    const course = COURSES[level] as Course;
    sky(context, width, height);
    sun(context, width - 50, 40);
    const view = 600;
    const left = Math.max(0, state.x - view * 0.35);
    const scaleX = width / view;
    const scaleY = (height - 40) / (CEILING + 20);
    const px = (x: number) => (x - left) * scaleX;
    const py = (altitude: number) => height - 30 - altitude * scaleY;
    context.fillStyle = PLAYGROUND_COLOURS.grass;
    context.fillRect(0, py(0), width, height - py(0));
    for (const box of course.obstacles) {
      if (box.kind === "hill") {
        context.fillStyle = PLAYGROUND_COLOURS.grassDark;
        context.beginPath();
        context.moveTo(px(box.x0), py(0));
        context.lineTo(px(box.x0 + (box.x1 - box.x0) * 0.2), py(box.top));
        context.lineTo(px(box.x1 - (box.x1 - box.x0) * 0.2), py(box.top));
        context.lineTo(px(box.x1), py(0));
        context.fill();
      } else {
        context.fillStyle = "rgb(73 80 87 / 85%)";
        context.fillRect(px(box.x0), py(Math.min(box.top, CEILING + 20)), (box.x1 - box.x0) * scaleX, py(box.bottom) - py(Math.min(box.top, CEILING + 20)));
        badge(context, "STORM", px(box.x0) + 6, py(box.bottom) - 8, "#343a40");
      }
    }
    if (course.landing) {
      const middle = px((course.landing[0] + course.landing[1]) / 2);
      for (const [radius, colour] of [[(course.landing[1] - course.landing[0]) / 2, "#e03131"], [60, "#ffffff"], [25, "#e03131"]] as const) {
        context.fillStyle = colour;
        context.beginPath();
        context.ellipse(middle, py(0) + 6, radius * scaleX, 6, 0, 0, 2 * Math.PI);
        context.fill();
      }
    } else {
      context.fillStyle = PLAYGROUND_COLOURS.ink;
      context.fillRect(px(course.length), py(60), 3, 60 * scaleY);
      context.fillStyle = PLAYGROUND_COLOURS.gold;
      context.fillRect(px(course.length) + 3, py(60), 26, 16);
    }
    context.strokeStyle = "rgb(224 49 49 / 70%)";
    context.setLineDash([8, 6]);
    context.beginPath();
    context.moveTo(0, py(CEILING));
    context.lineTo(width, py(CEILING));
    context.stroke();
    context.setLineDash([]);
    cloud(context, px(200) % width, 60);
    const bx = px(state.x);
    const by = py(state.altitude);
    context.fillStyle = "#8b5a2b";
    context.fillRect(bx - 8, by - 12, 16, 12);
    const envelope = context.createLinearGradient(bx - 26, 0, bx + 26, 0);
    envelope.addColorStop(0, "#ff6b6b");
    envelope.addColorStop(0.5, "#ffd43b");
    envelope.addColorStop(1, "#4dabf7");
    context.fillStyle = envelope;
    context.beginPath();
    context.ellipse(bx, by - 50, 26, 32, 0, 0, 2 * Math.PI);
    context.fill();
    if (input.held.has("burn")) {
      context.fillStyle = "#ff922b";
      context.beginPath();
      context.moveTo(bx - 5, by - 14);
      context.lineTo(bx, by - 30);
      context.lineTo(bx + 5, by - 14);
      context.fill();
    }
    badge(context, `${state.altitude.toFixed(0)} m`, bx + 30, by - 50);
  },
  describe: (state) => `The balloon is ${state.altitude.toFixed(0)} metres up, ${state.x.toFixed(0)} metres along, climbing at ${state.climb.toFixed(1)} metres per second, with the air inside at ${(state.insideKelvin - 273.15).toFixed(0)} degrees Celsius.`,
};
