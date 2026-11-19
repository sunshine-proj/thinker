import { calculateRoomTemperature, calculateThermalConductance } from "../../physics/thermodynamics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky, stars } from "./scenery";

/** Packed snow conducts heat poorly: about 0.15 W/(m·K). */
export const SNOW_CONDUCTIVITY = 0.15;
/** Heat given off by one resting emperor penguin, in watts. */
export const PENGUIN_WATTS = 60;
const FLOOR_PER_PENGUIN = 0.5;
/** Heat capacity of the air and the inner snow surface that warm up, in J/K. */
const HEAT_CAPACITY = 5e4;
const NIGHT_HOURS = 12;
const NIGHT_SECONDS = 10;
const MELT_CELSIUS = 0;

interface Night { readonly title: string; readonly goal: string; readonly penguins: number; readonly outsideCelsius: number; readonly snowM3: number; readonly cosyFrom: number }
export const NIGHTS: readonly Night[] = [
  { title: "First night", goal: "Build an igloo for 4 penguins. By morning it must be between −10 °C and 0 °C inside (above 0 °C the igloo melts!).", penguins: 4, outsideCelsius: -30, snowM3: 1, cosyFrom: -10 },
  { title: "Blizzard", goal: "Only 2 penguins and −40 °C outside, with just 0.4 m³ of snow. Get them to −12 °C or warmer.", penguins: 2, outsideCelsius: -40, snowM3: 0.4, cosyFrom: -12 },
  { title: "Penguin party", goal: "10 penguins make a lot of heat! Keep the igloo between −8 °C and 0 °C so it does not melt.", penguins: 10, outsideCelsius: -20, snowM3: 1.5, cosyFrom: -8 },
];

export interface IglooDesign { readonly radius: number; readonly wallCm: number }

/** A hemispherical dome: wall area 2πr², snow volume ≈ 2πr²·d, floor πr². Heat escapes only through the dome. */
export function iglooFacts(level: number, design: IglooDesign) {
  const night = NIGHTS[level] as Night;
  const wall = 2 * Math.PI * design.radius ** 2;
  const snow = wall * (design.wallCm / 100);
  const floor = Math.PI * design.radius ** 2;
  const conductance = calculateThermalConductance(SNOW_CONDUCTIVITY, wall, design.wallCm / 100);
  const heat = night.penguins * PENGUIN_WATTS;
  return { snow, floor, fits: floor >= night.penguins * FLOOR_PER_PENGUIN, enoughSnow: snow <= night.snowM3, conductance, heat, steady: night.outsideCelsius + heat / conductance };
}

export function iglooTemperature(level: number, design: IglooDesign, hours: number): number {
  const night = NIGHTS[level] as Night;
  const facts = iglooFacts(level, design);
  return calculateRoomTemperature(
    { outsideTemperatureCelsius: night.outsideCelsius, heaterPowerWatts: facts.heat, conductanceWattsPerKelvin: facts.conductance, heatCapacityJoulesPerKelvin: HEAT_CAPACITY, initialTemperatureCelsius: night.outsideCelsius },
    hours * 3600,
  );
}

export interface IglooState { readonly built: IglooDesign | null; readonly progress: number; readonly problem: "none" | "too-small" | "no-snow" | "melted" }

export const penguinIgloo: LiveGameDefinition<IglooState> = {
  id: "penguin-igloo",
  title: "Penguin Igloo Builder",
  worldId: "thermodynamics",
  eyebrow: "PLAYGROUND · HEAT LOSS AND BALANCE",
  modelTag: "THERMAL EQUILIBRIUM · T = T_out + P/U",
  introduction: "A freezing night is coming to the South Pole. Build a snow igloo so the penguins' own body heat keeps them cosy until morning, but not so warm that the igloo melts!",
  howToPlay: "Choose the igloo's size and how thick its snow walls are, then press Start the night (Space or Enter). You have only so much snow, and every penguin needs floor space.",
  physics: "Each penguin gives off about 60 W of heat. Heat leaks out through the snow walls; thicker walls and a smaller igloo let out less. The inside warms up until the heat leaking out equals the heat the penguins make: that balance is thermal equilibrium, at T = T_outside + P/U. A smaller igloo is warmer because there is less wall for heat to escape through.",
  assumptions: "A hemispherical dome of packed snow (k = 0.15 W/m·K) with thin walls, no heat lost through the floor or the entrance, still air inside at one temperature, a heat capacity of 50 kJ/K for the air and the inner snow surface, steady penguin heat of 60 W each, and 0.5 m² of floor per penguin.",
  levels: NIGHTS.map((night, index) => ({ id: `night-${index + 1}`, title: night.title, goal: night.goal })),
  sliders: () => [
    { key: "radius", label: "Igloo radius", unit: "m", minimum: 0.5, maximum: 2.5, step: 0.05, initial: 1.5 },
    { key: "wall", label: "Wall thickness", unit: "cm", minimum: 5, maximum: 50, step: 1, initial: 10 },
  ],
  actions: [{ id: "night", label: "Start the night", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ built: null, progress: 0, problem: "none" }),
  step(state, input, dt, level) {
    if (!state.built) {
      if (!input.pressed.has("night")) return state;
      const design = { radius: input.values.radius ?? 1.5, wallCm: input.values.wall ?? 10 };
      const facts = iglooFacts(level, design);
      if (!facts.fits) return { ...state, problem: "too-small" };
      if (!facts.enoughSnow) return { ...state, problem: "no-snow" };
      return { built: design, progress: 0, problem: "none" };
    }
    const progress = Math.min(1, state.progress + dt / NIGHT_SECONDS);
    return { ...state, progress, problem: iglooTemperature(level, state.built, progress * NIGHT_HOURS) > MELT_CELSIUS ? "melted" : "none" };
  },
  verdict(state, level) {
    const night = NIGHTS[level] as Night;
    if (state.problem === "too-small") return { status: "playing", message: `The penguins do not fit: ${night.penguins} penguins need ${night.penguins * FLOOR_PER_PENGUIN} m² of floor.` };
    if (state.problem === "no-snow") return { status: "playing", message: `There is not enough snow: you have ${night.snowM3} m³.` };
    if (!state.built) return { status: "playing", message: "Design the igloo, then start the night." };
    const temperature = iglooTemperature(level, state.built, state.progress * NIGHT_HOURS);
    if (state.problem === "melted") return { status: "lost", message: "Drip! The penguins made it warmer than 0 °C and the igloo started to melt. Make it bigger or the walls thinner." };
    if (state.progress < 1) return { status: "playing", message: `${(state.progress * NIGHT_HOURS).toFixed(0)} hours into the night: ${temperature.toFixed(1)} °C inside.` };
    return temperature >= night.cosyFrom
      ? { status: "won", message: `Good morning! The penguins slept at a cosy ${temperature.toFixed(1)} °C.` }
      : { status: "lost", message: `Brrr! Only ${temperature.toFixed(1)} °C inside by morning. Make the igloo smaller or the walls thicker.` };
  },
  stars: (state, level) => {
    if (!state.built) return 1;
    const night = NIGHTS[level] as Night;
    const end = iglooTemperature(level, state.built, NIGHT_HOURS);
    const middle = (night.cosyFrom + MELT_CELSIUS) / 2;
    const off = Math.abs(end - middle) / ((MELT_CELSIUS - night.cosyFrom) / 2);
    return off <= 0.4 ? 3 : off <= 0.8 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const night = NIGHTS[level] as Night;
    const design = state.built ?? { radius: input.values.radius ?? 1.5, wallCm: input.values.wall ?? 10 };
    const facts = iglooFacts(level, design);
    return [
      { label: "PENGUIN HEAT", value: `${facts.heat} W` },
      { label: "SNOW USED", value: `${facts.snow.toFixed(2)} of ${night.snowM3} m³` },
      { label: "FLOOR", value: `${facts.floor.toFixed(1)} m² (need ${night.penguins * FLOOR_PER_PENGUIN} m²)` },
      { label: "INSIDE", value: state.built ? `${iglooTemperature(level, state.built, state.progress * NIGHT_HOURS).toFixed(1)} °C` : `${night.outsideCelsius} °C now` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const night = NIGHTS[level] as Night;
    sky(context, width, height, true);
    stars(context, width, height);
    const ground = height - 40;
    context.fillStyle = "#e7f5ff";
    context.fillRect(0, ground, width, 40);
    const design = state.built ?? { radius: input.values.radius ?? 1.5, wallCm: input.values.wall ?? 10 };
    const scale = Math.min((width - 40) / 5.5, (height - 80) / 2.8);
    const cx = width / 2;
    const outer = (design.radius + design.wallCm / 100) * scale;
    const inner = design.radius * scale;
    context.fillStyle = "#f8f9fa";
    context.beginPath();
    context.arc(cx, ground, outer, Math.PI, 0);
    context.fill();
    const temperature = state.built ? iglooTemperature(level, state.built, state.progress * NIGHT_HOURS) : night.outsideCelsius;
    const warmth = Math.min(1, Math.max(0, (temperature - night.outsideCelsius) / -night.outsideCelsius));
    context.fillStyle = `rgb(${120 + 135 * warmth} ${150 + 40 * warmth} ${230 - 150 * warmth})`;
    context.beginPath();
    context.arc(cx, ground, inner, Math.PI, 0);
    context.fill();
    for (let i = 0; i < night.penguins; i += 1) {
      const x = cx + (i - (night.penguins - 1) / 2) * Math.min(26, (inner * 1.6) / night.penguins);
      context.fillStyle = PLAYGROUND_COLOURS.ink;
      context.beginPath();
      context.ellipse(x, ground - 18, 9, 18, 0, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = PLAYGROUND_COLOURS.white;
      context.beginPath();
      context.ellipse(x, ground - 14, 5, 12, 0, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = "#fab005";
      context.fillRect(x - 2, ground - 30, 4, 3);
    }
    badge(context, `inside ${temperature.toFixed(1)} °C`, cx - 50, ground - outer - 12, temperature > MELT_CELSIUS ? PLAYGROUND_COLOURS.enemy : PLAYGROUND_COLOURS.ink);
    badge(context, `outside ${night.outsideCelsius} °C`, 12, 24, "#364fc7");
    if (state.built) badge(context, `${(state.progress * NIGHT_HOURS).toFixed(0)} h`, width - 60, 24, "#364fc7");
  },
  describe: (state, input, level) => {
    const design = state.built ?? { radius: input.values.radius ?? 1.5, wallCm: input.values.wall ?? 10 };
    const facts = iglooFacts(level, design);
    return `Igloo of radius ${design.radius.toFixed(2)} metres with ${design.wallCm} centimetre walls, using ${facts.snow.toFixed(2)} cubic metres of snow. It would settle at ${facts.steady.toFixed(1)} degrees Celsius inside.`;
  },
};
