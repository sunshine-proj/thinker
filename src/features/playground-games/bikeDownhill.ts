import { STANDARD_GRAVITY } from "../../physics/core";
import { calculateBicycleSpeed, calculateDriveForce, calculateResistiveForce, calculateWheelTorque } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, cloud, sky, sun } from "./scenery";

const MASS = 80;
const DRAG_AREA = 0.5;
const ROLLING = 0.008;
const WHEEL_CIRCUMFERENCE = 2.1;
const FRONT_TEETH = 44;
export const REAR_TEETH = [32, 21, 14] as const;
const CADENCE = 90;
const PEDAL_TORQUE = 40;
const PEDAL_POWER = 250;

interface Piece { readonly length: number; readonly gradePercent: number; readonly cornerRadius: number | null }
interface Hill { readonly title: string; readonly goal: string; readonly pieces: readonly Piece[]; readonly grip: number; readonly brakeGrip: number; readonly timeLimit: number }
export const HILLS: readonly Hill[] = [
  { title: "Downhill dash", goal: "Race down the hill, brake for the hairpin bend, and finish in under 60 s.", pieces: [{ length: 300, gradePercent: -10, cornerRadius: null }, { length: 30, gradePercent: 0, cornerRadius: 15 }, { length: 120, gradePercent: 0, cornerRadius: null }], grip: 0.7, brakeGrip: 0.6, timeLimit: 60 },
  { title: "Twisty and steep", goal: "Two tight bends, then a short climb to the finish: pick a low gear for it. Under 75 s.", pieces: [{ length: 250, gradePercent: -12, cornerRadius: null }, { length: 25, gradePercent: -4, cornerRadius: 12 }, { length: 200, gradePercent: -8, cornerRadius: null }, { length: 25, gradePercent: 0, cornerRadius: 9 }, { length: 120, gradePercent: 6, cornerRadius: null }], grip: 0.7, brakeGrip: 0.6, timeLimit: 75 },
  { title: "Rainy race", goal: "The road is wet: the tyres grip less, so you must take the bends slower and brake earlier. Under 70 s.", pieces: [{ length: 300, gradePercent: -10, cornerRadius: null }, { length: 30, gradePercent: -2, cornerRadius: 14 }, { length: 200, gradePercent: -6, cornerRadius: null }, { length: 30, gradePercent: 0, cornerRadius: 20 }, { length: 80, gradePercent: 0, cornerRadius: null }], grip: 0.4, brakeGrip: 0.35, timeLimit: 70 },
];

export const hillLength = (hill: Hill) => hill.pieces.reduce((sum, piece) => sum + piece.length, 0);

export function pieceAt(hill: Hill, distance: number): { piece: Piece; start: number } {
  let start = 0;
  for (const piece of hill.pieces) {
    if (distance < start + piece.length) return { piece, start };
    start += piece.length;
  }
  return { piece: hill.pieces[hill.pieces.length - 1] as Piece, start: start - (hill.pieces[hill.pieces.length - 1] as Piece).length };
}

/** The bend you are in or the next one ahead: where it starts and its radius. */
export function nextBend(hill: Hill, distance: number): { start: number; radius: number } | null {
  let start = 0;
  for (const piece of hill.pieces) {
    if (piece.cornerRadius !== null && start + piece.length > distance) return { start, radius: piece.cornerRadius };
    start += piece.length;
  }
  return null;
}

/** Fastest speed through a bend before the tyres slide: friction supplies the centripetal force, v = √(μ g R). */
export const cornerLimit = (grip: number, radius: number) => Math.sqrt(grip * STANDARD_GRAVITY * radius);

/** Top speed you can pedal in a gear at 90 rpm, and the largest push the gear gives. */
export function gearFacts(gear: number) {
  const rear = REAR_TEETH[Math.min(REAR_TEETH.length - 1, Math.max(0, Math.round(gear) - 1))] as number;
  return {
    topSpeed: calculateBicycleSpeed(CADENCE, FRONT_TEETH, rear, WHEEL_CIRCUMFERENCE),
    maxForce: calculateDriveForce(calculateWheelTorque(PEDAL_TORQUE, FRONT_TEETH, rear), WHEEL_CIRCUMFERENCE / (2 * Math.PI)),
  };
}

export interface BikeState { readonly distance: number; readonly speed: number; readonly time: number; readonly crashed: boolean }

export function stepBike(level: number, state: BikeState, pedalling: boolean, braking: boolean, gear: number, dt: number): BikeState {
  const hill = HILLS[level] as Hill;
  const { piece } = pieceAt(hill, state.distance);
  const grade = piece.gradePercent / 100;
  const resist = calculateResistiveForce(state.speed, { massKg: MASS, rollingResistance: ROLLING, dragArea: DRAG_AREA, grade });
  const facts = gearFacts(gear);
  const drive = pedalling && state.speed < facts.topSpeed ? Math.min(facts.maxForce, PEDAL_POWER / Math.max(state.speed, 0.5)) : 0;
  const brake = braking && state.speed > 0 ? hill.brakeGrip * MASS * STANDARD_GRAVITY * Math.cos(Math.atan(grade)) : 0;
  const speed = Math.max(0, state.speed + ((drive - resist - brake) / MASS) * dt);
  const distance = state.distance + speed * dt;
  const crashed = piece.cornerRadius !== null && speed > cornerLimit(hill.grip, piece.cornerRadius);
  return { distance, speed, time: state.time + dt, crashed };
}

export const bikeDownhill: LiveGameDefinition<BikeState> = {
  id: "bike-downhill",
  title: "Bike Downhill Race",
  worldId: "everyday",
  eyebrow: "PLAYGROUND · FRICTION AND BRAKING",
  modelTag: "v = √(μgR) · BRAKING DISTANCE v²/2a",
  introduction: "Zoom down the mountain road on your bike! Go fast on the straights, but brake in time for the bends, or you will skid off the road.",
  howToPlay: "Hold Pedal (↑ or W) and Brake (Space or ↓). Pick a gear with the slider: low gears push hard but only up to a slow speed; high gears go faster but push gently.",
  physics: "Going round a bend needs a sideways force toward the middle of the bend, and only the friction of your tyres can give it. That force grows with v², so every bend has a top speed, √(μgR): tighter bends and wet roads mean slower. Brakes also work through friction, so you need distance to slow down: the braking distance grows with the square of the speed. Gears trade force for speed.",
  assumptions: "An 80 kg rider and bike, rolling resistance 0.008, a drag area of 0.5 m², brakes giving a friction of μ_brake·m·g, bends taken at a steady radius with tyre grip μ, 250 W of pedalling at 90 rpm with 40 N·m on the pedals, and the slope of each section as given.",
  levels: HILLS.map((hill, index) => ({ id: `hill-${index + 1}`, title: hill.title, goal: hill.goal })),
  sliders: () => [{ key: "gear", label: "Gear (1 low – 3 high)", unit: "", minimum: 1, maximum: 3, step: 1, initial: 3 }],
  actions: [
    { id: "pedal", label: "Pedal", keys: ["ArrowUp", "w", "W"], hold: true },
    { id: "brake", label: "Brake", keys: [" ", "ArrowDown", "s", "S"], hold: true },
  ],
  timing: { fixedTimeStepSeconds: 1 / 60, timeScale: 1 },
  create: () => ({ distance: 0, speed: 0, time: 0, crashed: false }),
  step(state, input, dt, level) {
    if (state.crashed || state.distance >= hillLength(HILLS[level] as Hill)) return state;
    return stepBike(level, state, input.held.has("pedal"), input.held.has("brake"), input.values.gear ?? 3, dt);
  },
  verdict(state, level) {
    const hill = HILLS[level] as Hill;
    if (state.crashed) return { status: "lost", message: "Skid! You took the bend too fast and slid off the road. Brake earlier." };
    if (state.distance >= hillLength(hill)) {
      return state.time <= hill.timeLimit
        ? { status: "won", message: `Finished in ${state.time.toFixed(1)} s!` }
        : { status: "lost", message: `Finished in ${state.time.toFixed(1)} s: slower than ${hill.timeLimit} s.` };
    }
    if (state.time > hill.timeLimit) return { status: "lost", message: "Out of time." };
    const bend = nextBend(hill, state.distance);
    return { status: "playing", message: bend ? `Bend in ${Math.max(0, bend.start - state.distance).toFixed(0)} m: safe up to ${cornerLimit(hill.grip, bend.radius).toFixed(1)} m/s.` : "Pedal for the finish!" };
  },
  stars: (state, level) => {
    const hill = HILLS[level] as Hill;
    return state.time <= hill.timeLimit * 0.8 ? 3 : state.time <= hill.timeLimit * 0.9 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const hill = HILLS[level] as Hill;
    const { piece } = pieceAt(hill, state.distance);
    const facts = gearFacts(input.values.gear ?? 3);
    return [
      { label: "SPEED", value: `${state.speed.toFixed(1)} m/s (${(state.speed * 3.6).toFixed(0)} km/h)` },
      { label: "BRAKING DISTANCE", value: `${(state.speed ** 2 / (2 * hill.brakeGrip * STANDARD_GRAVITY)).toFixed(1)} m` },
      { label: "HERE", value: piece.cornerRadius ? `bend, safe up to ${cornerLimit(hill.grip, piece.cornerRadius).toFixed(1)} m/s` : `${piece.gradePercent > 0 ? "uphill" : piece.gradePercent < 0 ? "downhill" : "flat"} ${Math.abs(piece.gradePercent)} %` },
      { label: "GEAR", value: `pedal up to ${facts.topSpeed.toFixed(1)} m/s, push ${facts.maxForce.toFixed(0)} N` },
      { label: "TIME", value: `${state.time.toFixed(1)} s of ${hill.timeLimit} s` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const hill = HILLS[level] as Hill;
    sky(context, width, height);
    sun(context, width - 50, 40);
    cloud(context, 60, 50);
    const total = hillLength(hill);
    // Height profile from the slopes.
    const profile: { s: number; h: number; piece: Piece }[] = [];
    let h = 0;
    let s = 0;
    for (const piece of hill.pieces) {
      profile.push({ s, h, piece });
      s += piece.length;
      h += (piece.length * piece.gradePercent) / 100;
    }
    const heights = [...profile.map((point) => point.h), h];
    const top = Math.max(...heights);
    const bottom = Math.min(...heights);
    const sx = (value: number) => 20 + (value / total) * (width - 40);
    const sy = (value: number) => 60 + ((top - value) / Math.max(1, top - bottom)) * (height - 120);
    context.lineWidth = 8;
    profile.forEach((point) => {
      context.strokeStyle = point.piece.cornerRadius ? PLAYGROUND_COLOURS.enemy : "#495057";
      context.beginPath();
      context.moveTo(sx(point.s), sy(point.h));
      context.lineTo(sx(point.s + point.piece.length), sy(point.h + (point.piece.length * point.piece.gradePercent) / 100));
      context.stroke();
      if (point.piece.cornerRadius) badge(context, `bend ${cornerLimit(hill.grip, point.piece.cornerRadius).toFixed(0)} m/s`, sx(point.s) - 10, sy(point.h) - 16, "#c92a2a");
    });
    const { piece, start } = pieceAt(hill, Math.min(state.distance, total - 0.001));
    const riderH = profile.find((point) => point.s === start)!.h + ((Math.min(state.distance, total) - start) * piece.gradePercent) / 100;
    const x = sx(Math.min(state.distance, total));
    const y = sy(riderH) - 14;
    context.strokeStyle = PLAYGROUND_COLOURS.player;
    context.lineWidth = 3;
    for (const dx of [-8, 8]) {
      context.beginPath();
      context.arc(x + dx, y + 6, 6, 0, 2 * Math.PI);
      context.stroke();
    }
    context.fillStyle = PLAYGROUND_COLOURS.player;
    context.fillRect(x - 3, y - 14, 6, 14);
    if (input.held.has("brake")) badge(context, "BRAKE", x - 18, y - 22, PLAYGROUND_COLOURS.enemy);
    context.fillStyle = PLAYGROUND_COLOURS.ink;
    context.fillRect(sx(total) - 2, sy(h) - 40, 4, 40);
  },
  describe: (state, _input, level) => `${state.distance.toFixed(0)} of ${hillLength(HILLS[level] as Hill)} metres down the hill at ${state.speed.toFixed(1)} metres per second after ${state.time.toFixed(1)} seconds.`,
};
