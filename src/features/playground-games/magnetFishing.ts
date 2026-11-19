import { STANDARD_GRAVITY } from "../../physics/core";
import { calculateCoilResistance, calculateHeatingPower, calculateMagneticPullForce, calculateSolenoidField } from "../../physics/electromagnetism";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, cloud, sky, sun } from "./scenery";

/** The crane's electromagnet: an iron core 10 cm long with 1 cm² pole faces. */
const CORE_LENGTH = 0.1;
/** Effective permeability of the core with the small air gap to the fish. */
const CORE_PERMEABILITY = 50;
const POLE_AREA = 2e-5;
const TURN_LENGTH = 0.15;
const WIRE_AREA = 1e-6;

type Material = "steel" | "iron" | "nickel" | "brass" | "aluminium" | "plastic";
export const MAGNETIC: ReadonlySet<Material> = new Set(["steel", "iron", "nickel"]);
interface Catch { readonly name: string; readonly material: Material; readonly massKg: number; readonly colour: string }
interface Pond { readonly title: string; readonly goal: string; readonly items: readonly Catch[]; readonly maxWatts: number }

export const PONDS: readonly Pond[] = [
  {
    title: "The toy pond",
    goal: "Catch every fish the magnet can pick up. Not everything metal is magnetic!",
    items: [
      { name: "Steel fish", material: "steel", massKg: 0.3, colour: "#74c0fc" },
      { name: "Brass goldfish", material: "brass", massKg: 0.4, colour: "#ffd43b" },
      { name: "Steel fish", material: "steel", massKg: 0.5, colour: "#4dabf7" },
      { name: "Rubber duck", material: "plastic", massKg: 0.1, colour: "#ffe066" },
    ],
    maxWatts: 30,
  },
  {
    title: "Treasure lake",
    goal: "Catch the magnetic treasure. The coil overheats above 20 W.",
    items: [
      { name: "Iron anchor charm", material: "iron", massKg: 1, colour: "#868e96" },
      { name: "Aluminium can", material: "aluminium", massKg: 0.2, colour: "#ced4da" },
      { name: "Nickel coin fish", material: "nickel", massKg: 0.6, colour: "#adb5bd" },
      { name: "Steel shark", material: "steel", massKg: 1.5, colour: "#1c7ed6" },
    ],
    maxWatts: 20,
  },
  {
    title: "The big catch",
    goal: "The heaviest fish yet, and the coil overheats above 12 W. More turns of wire give the same pull with less heat.",
    items: [
      { name: "Steel whale", material: "steel", massKg: 2, colour: "#1864ab" },
      { name: "Copper crab", material: "brass", massKg: 0.5, colour: "#e8590c" },
      { name: "Iron octopus", material: "iron", massKg: 2.5, colour: "#495057" },
    ],
    maxWatts: 12,
  },
];

export interface MagnetReading { readonly field: number; readonly pull: number; readonly ohms: number; readonly watts: number }

/** Field, pull, coil resistance and heating for a coil of `turns` carrying `amps`. */
export function magnetReading(turns: number, amps: number): MagnetReading {
  const field = calculateSolenoidField(turns, amps, CORE_LENGTH, CORE_PERMEABILITY);
  const ohms = calculateCoilResistance(turns, TURN_LENGTH, WIRE_AREA);
  return { field, pull: calculateMagneticPullForce(field, POLE_AREA), ohms, watts: calculateHeatingPower(amps, ohms) };
}

/** Smallest current (A) whose pull lifts `massKg` with a coil of `turns`, or null beyond saturation. */
export function currentToLift(turns: number, massKg: number): number | null {
  const pull = (amps: number) => magnetReading(turns, amps).pull;
  if (pull(1000) < massKg * STANDARD_GRAVITY) return null;
  let low = 0;
  let high = 1000;
  for (let i = 0; i < 80; i += 1) {
    const middle = (low + high) / 2;
    if (pull(middle) >= massKg * STANDARD_GRAVITY) high = middle;
    else low = middle;
  }
  return high;
}

export type FishOutcome = "caught" | "not-magnetic" | "too-weak" | "overheated";
export interface FishingState {
  readonly caught: readonly boolean[];
  readonly tries: number;
  readonly last: { readonly spot: number; readonly outcome: FishOutcome } | null;
  readonly lift: number;
}

export function tryCatch(level: number, spot: number, turns: number, amps: number): FishOutcome {
  const pond = PONDS[level] as Pond;
  const item = pond.items[spot] as Catch;
  const reading = magnetReading(turns, amps);
  if (reading.watts > pond.maxWatts) return "overheated";
  if (!MAGNETIC.has(item.material)) return "not-magnetic";
  return reading.pull >= item.massKg * STANDARD_GRAVITY ? "caught" : "too-weak";
}

const magneticCount = (pond: Pond) => pond.items.filter((item) => MAGNETIC.has(item.material)).length;

export const magnetFishing: LiveGameDefinition<FishingState> = {
  id: "magnet-fishing",
  title: "Magnet Fishing",
  worldId: "electromagnetism",
  eyebrow: "PLAYGROUND · ELECTROMAGNETS",
  modelTag: "B = μ₀μᵣNI/L · F = B²A/μ₀",
  introduction: "Your fishing crane has an electromagnet on its line: a coil of wire around an iron core. Switch on the current and it becomes a magnet. Catch all the magnetic fish!",
  howToPlay: "Choose a spot, the number of turns of wire and the current, then press Catch (Space or Enter). Watch the coil's heating: too much and it burns out.",
  physics: "Electric current in a coil makes a magnetic field, and an iron core makes it much stronger. More current or more turns make a stronger magnet; the pull grows with the field squared. Only iron, steel, nickel and cobalt are pulled; brass, copper, aluminium and plastic are not. The wire also heats up (P = I²R): with more turns you need less current for the same pull, so the coil stays cooler.",
  assumptions: "A uniform field in an iron core with an effective relative permeability of 50 (the small gap to the fish weakens it), saturation at 1.6 T, two pole faces of 0.2 cm² each touching the fish, copper wire of 1 mm² cross-section with 15 cm per turn, and the pull compared with the fish's weight in air (water's buoyancy is ignored).",
  levels: PONDS.map((pond, index) => ({ id: `pond-${index + 1}`, title: pond.title, goal: pond.goal })),
  sliders: (level) => [
    { key: "spot", label: "Fishing spot", unit: "", minimum: 1, maximum: (PONDS[level] as Pond).items.length, step: 1, initial: 1 },
    { key: "turns", label: "Turns of wire", unit: "", minimum: 100, maximum: 1000, step: 10, initial: 200 },
    { key: "amps", label: "Current", unit: "A", minimum: 0, maximum: 5, step: 0.05, initial: 1 },
  ],
  actions: [{ id: "catch", label: "Catch!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  onDrag: (x, _y, _values, level) => ({ spot: Math.min((PONDS[level] as Pond).items.length, Math.max(1, Math.ceil(x * (PONDS[level] as Pond).items.length))) }),
  create: (level) => ({ caught: (PONDS[level] as Pond).items.map(() => false), tries: 0, last: null, lift: 0 }),
  step(state, input, dt, level) {
    if (!input.pressed.has("catch")) return { ...state, lift: Math.min(1, state.lift + dt * 1.5) };
    const spot = Math.round(input.values.spot ?? 1) - 1;
    if (state.caught[spot]) return state;
    const outcome = tryCatch(level, spot, input.values.turns ?? 200, input.values.amps ?? 1);
    return {
      caught: state.caught.map((value, index) => value || (index === spot && outcome === "caught")),
      tries: state.tries + 1,
      last: { spot, outcome },
      lift: 0,
    };
  },
  verdict(state, level) {
    const pond = PONDS[level] as Pond;
    if (state.last?.outcome === "overheated") return { status: "lost", message: `Fizz! The coil got hotter than ${pond.maxWatts} W and burned out. Try more turns and less current.` };
    if (state.caught.filter(Boolean).length === magneticCount(pond)) return { status: "won", message: `Every magnetic fish is in the bucket, in ${state.tries} tries!` };
    const last = state.last;
    if (!last) return { status: "playing", message: "Pick a spot, set the magnet and press Catch." };
    const item = pond.items[last.spot] as Catch;
    switch (last.outcome) {
      case "caught":
        return { status: "playing", message: `Got the ${item.name.toLowerCase()}!` };
      case "not-magnetic":
        return { status: "playing", message: `Nothing happened: the ${item.name.toLowerCase()} is made of ${item.material}, which magnets do not pull.` };
      default:
        return { status: "playing", message: `The ${item.name.toLowerCase()} is too heavy for that pull. Make the magnet stronger.` };
    }
  },
  stars: (state, level) => {
    const extra = state.tries - magneticCount(PONDS[level] as Pond);
    return extra <= 0 ? 3 : extra <= 2 ? 2 : 1;
  },
  readouts: (_state, input, level) => {
    const pond = PONDS[level] as Pond;
    const reading = magnetReading(input.values.turns ?? 200, input.values.amps ?? 1);
    const item = pond.items[Math.round(input.values.spot ?? 1) - 1] as Catch;
    return [
      { label: "MAGNETIC FIELD", value: `${reading.field.toFixed(2)} T` },
      { label: "PULL", value: `${reading.pull.toFixed(1)} N` },
      { label: "FISH AT THIS SPOT", value: `${item.name}, weight ${(item.massKg * STANDARD_GRAVITY).toFixed(1)} N` },
      { label: "COIL HEATING I²R", value: `${reading.watts.toFixed(1)} W (limit ${pond.maxWatts} W)` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const pond = PONDS[level] as Pond;
    sky(context, width, height);
    sun(context, width - 50, 40);
    cloud(context, 40, 40);
    const water = height * 0.45;
    context.fillStyle = PLAYGROUND_COLOURS.grass;
    context.fillRect(0, water - 14, width, 14);
    const gradient = context.createLinearGradient(0, water, 0, height);
    gradient.addColorStop(0, PLAYGROUND_COLOURS.seaTop);
    gradient.addColorStop(1, PLAYGROUND_COLOURS.seaBottom);
    context.fillStyle = gradient;
    context.fillRect(0, water, width, height - water);
    const slot = width / pond.items.length;
    const spot = Math.round(input.values.spot ?? 1) - 1;
    const reading = magnetReading(input.values.turns ?? 200, input.values.amps ?? 1);
    pond.items.forEach((item, index) => {
      const x = slot * (index + 0.5);
      const raised = state.last?.spot === index && state.last.outcome === "caught" ? state.lift : state.caught[index] ? 1 : 0;
      const y = height - 40 - raised * (height - 40 - water + 50);
      context.fillStyle = item.colour;
      context.beginPath();
      context.ellipse(x, y, 20 + item.massKg * 6, 10 + item.massKg * 3, 0, 0, 2 * Math.PI);
      context.fill();
      context.beginPath();
      context.moveTo(x + 18 + item.massKg * 6, y);
      context.lineTo(x + 32 + item.massKg * 6, y - 10);
      context.lineTo(x + 32 + item.massKg * 6, y + 10);
      context.fill();
      badge(context, String(index + 1), x - 6, height - 12, MAGNETIC.has(item.material) || !state.last ? PLAYGROUND_COLOURS.ink : "#868e96");
    });
    const craneX = slot * (spot + 0.5);
    context.strokeStyle = PLAYGROUND_COLOURS.ink;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(craneX, 0);
    context.lineTo(craneX, water + 20);
    context.stroke();
    context.fillStyle = "#c92a2a";
    context.fillRect(craneX - 14, water + 20, 28, 24);
    context.strokeStyle = `rgb(255 140 0 / ${Math.min(1, reading.watts / pond.maxWatts)})`;
    context.lineWidth = 4;
    context.strokeRect(craneX - 16, water + 18, 32, 28);
    // Field lines grow with the field strength.
    context.strokeStyle = "rgb(255 255 255 / 60%)";
    context.lineWidth = 1.5;
    for (let i = 1; i <= Math.round(reading.field * 4); i += 1) {
      context.beginPath();
      context.ellipse(craneX, water + 50, 8 * i, 5 * i, 0, 0, Math.PI);
      context.stroke();
    }
  },
  describe: (state, input, level) => {
    const pond = PONDS[level] as Pond;
    const reading = magnetReading(input.values.turns ?? 200, input.values.amps ?? 1);
    return `Magnet over spot ${Math.round(input.values.spot ?? 1)}, pulling ${reading.pull.toFixed(1)} newtons and heating ${reading.watts.toFixed(1)} watts. Caught ${state.caught.filter(Boolean).length} of ${magneticCount(pond)} magnetic fish.`;
  },
};
