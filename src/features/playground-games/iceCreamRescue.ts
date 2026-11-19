import { SPECIFIC_HEAT_ICE } from "../../physics/core";
import { CONDUCTORS, calculateRoomTemperature, calculateThermalConductance } from "../../physics/thermodynamics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky, sun } from "./scenery";

const ICE_CREAM_KG = 20;
const START_CELSIUS = -18;
/** Above this the ice cream turns soft and starts to melt. */
export const SOFT_CELSIUS = -8;
const BOX_AREA = 2;
/** Real seconds the animated journey takes, whatever its length. */
const DRIVE_SECONDS = 8;

export const INSULATORS = ["steel", "glass", "wood", "foam"].map((id) => CONDUCTORS.find((material) => material.id === id)!);

interface Journey { readonly title: string; readonly goal: string; readonly hours: number; readonly outsideCelsius: number; readonly maxThicknessCm: number }
export const JOURNEYS: readonly Journey[] = [
  { title: "To the park", goal: "Deliver the ice cream on a 30-minute drive at 30 °C, still colder than −8 °C.", hours: 0.5, outsideCelsius: 30, maxThicknessCm: 10 },
  { title: "Seaside trip", goal: "A 2-hour drive at 35 °C, and the van walls can hold only 8 cm of insulation.", hours: 2, outsideCelsius: 35, maxThicknessCm: 8 },
  { title: "Desert dash", goal: "A 4-hour drive across the desert at 40 °C. Up to 16 cm of insulation.", hours: 4, outsideCelsius: 40, maxThicknessCm: 16 },
];

export function iceCreamTemperature(level: number, materialIndex: number, thicknessCm: number, hoursDriven: number): number {
  const journey = JOURNEYS[level] as Journey;
  const material = INSULATORS[materialIndex] ?? INSULATORS[0]!;
  return calculateRoomTemperature(
    {
      outsideTemperatureCelsius: journey.outsideCelsius,
      heaterPowerWatts: 0,
      conductanceWattsPerKelvin: calculateThermalConductance(material.conductivity, BOX_AREA, thicknessCm / 100),
      heatCapacityJoulesPerKelvin: ICE_CREAM_KG * SPECIFIC_HEAT_ICE,
      initialTemperatureCelsius: START_CELSIUS,
    },
    hoursDriven * 3600,
  );
}

export interface IceCreamState { readonly driving: boolean; readonly progress: number; readonly material: number; readonly thicknessCm: number; readonly melted: boolean }

export const iceCreamRescue: LiveGameDefinition<IceCreamState> = {
  id: "ice-cream-rescue",
  title: "Ice Cream Rescue",
  worldId: "thermodynamics",
  eyebrow: "PLAYGROUND · HEAT AND INSULATION",
  modelTag: "CONDUCTION · P = kAΔT/d",
  introduction: "The ice-cream van has a long, hot drive ahead. Line its freezer box with the right insulation so the ice cream arrives frozen!",
  howToPlay: "Choose the material and how thick it is, then press Drive (Space or Enter). The thermometer shows the ice cream warming on the way.",
  physics: "Heat always flows from hot to cold. It leaks through the walls by conduction, faster through a good conductor like steel and slower through a poor one like foam, which is full of trapped air. Thicker walls slow it down more: the heat flow is P = k A ΔT / d. As the ice cream warms up, the difference ΔT shrinks, so it warms more slowly.",
  assumptions: "20 kg of ice cream with the specific heat of ice (2090 J/kg·K) at one temperature, a box with 2 m² of walls, heat entering only by conduction through the walls (no door opening, sunshine or air leaks), and soft ice cream above −8 °C, so the latent heat of melting is not reached.",
  levels: JOURNEYS.map((journey, index) => ({ id: `journey-${index + 1}`, title: journey.title, goal: journey.goal })),
  sliders: (level) => [
    { key: "material", label: `Insulation (${INSULATORS.map((material, index) => `${index + 1} ${material.name.toLowerCase()}`).join(", ")})`, unit: "", minimum: 1, maximum: INSULATORS.length, step: 1, initial: 1 },
    { key: "thickness", label: "Thickness", unit: "cm", minimum: 1, maximum: (JOURNEYS[level] as Journey).maxThicknessCm, step: 0.5, initial: 2 },
  ],
  actions: [{ id: "drive", label: "Drive!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ driving: false, progress: 0, material: 0, thicknessCm: 2, melted: false }),
  step(state, input, dt, level) {
    if (!state.driving) {
      if (!input.pressed.has("drive")) return state;
      return { driving: true, progress: 0, material: Math.round(input.values.material ?? 1) - 1, thicknessCm: input.values.thickness ?? 2, melted: false };
    }
    const progress = Math.min(1, state.progress + dt / DRIVE_SECONDS);
    const temperature = iceCreamTemperature(level, state.material, state.thicknessCm, progress * (JOURNEYS[level] as Journey).hours);
    return { ...state, progress, melted: temperature > SOFT_CELSIUS };
  },
  verdict(state, level) {
    const journey = JOURNEYS[level] as Journey;
    if (!state.driving) return { status: "playing", message: "Pick the insulation and set off." };
    const temperature = iceCreamTemperature(level, state.material, state.thicknessCm, state.progress * journey.hours);
    if (state.melted) return { status: "lost", message: `Drip, drip… The ice cream reached ${temperature.toFixed(1)} °C after ${(state.progress * journey.hours).toFixed(1)} h. Try a better insulator or thicker walls.` };
    if (state.progress >= 1) return { status: "won", message: `Delivered at ${temperature.toFixed(1)} °C. Ice cream for everyone!` };
    return { status: "playing", message: `On the road: ${temperature.toFixed(1)} °C.` };
  },
  stars: (state, level) => {
    const end = iceCreamTemperature(level, state.material, state.thicknessCm, (JOURNEYS[level] as Journey).hours);
    return end <= SOFT_CELSIUS - 2 ? 3 : end <= SOFT_CELSIUS - 1 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const journey = JOURNEYS[level] as Journey;
    const material = state.driving ? state.material : Math.round(input.values.material ?? 1) - 1;
    const thickness = state.driving ? state.thicknessCm : input.values.thickness ?? 2;
    const conductance = calculateThermalConductance((INSULATORS[material] ?? INSULATORS[0]!).conductivity, BOX_AREA, thickness / 100);
    return [
      { label: "INSULATION", value: `${(INSULATORS[material] ?? INSULATORS[0]!).name}, ${thickness} cm` },
      { label: "HEAT LEAKING IN AT THE START", value: `${(conductance * (journey.outsideCelsius - START_CELSIUS)).toFixed(0)} W` },
      { label: "ICE CREAM", value: `${iceCreamTemperature(level, material, thickness, state.progress * journey.hours).toFixed(1)} °C` },
      { label: "JOURNEY", value: `${(state.progress * journey.hours).toFixed(1)} of ${journey.hours} h at ${journey.outsideCelsius} °C` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const journey = JOURNEYS[level] as Journey;
    sky(context, width, height);
    sun(context, width - 60, 50, 22 + journey.outsideCelsius / 3);
    const road = height - 50;
    context.fillStyle = level === 2 ? PLAYGROUND_COLOURS.sand : PLAYGROUND_COLOURS.grass;
    context.fillRect(0, road - 20, width, 20);
    context.fillStyle = "#495057";
    context.fillRect(0, road, width, 50);
    const x = 20 + state.progress * (width - 200);
    const material = state.driving ? state.material : Math.round(input.values.material ?? 1) - 1;
    const thickness = state.driving ? state.thicknessCm : input.values.thickness ?? 2;
    context.fillStyle = "#ffc9de";
    context.fillRect(x, road - 90, 150, 70);
    context.strokeStyle = ["#868e96", "#a5d8ff", "#a0522d", "#fff3bf"][material] as string;
    context.lineWidth = 2 + thickness * 1.2;
    context.strokeRect(x + 8, road - 82, 100, 54);
    context.fillStyle = "#74c0fc";
    context.fillRect(x + 112, road - 70, 34, 30);
    context.fillStyle = PLAYGROUND_COLOURS.ink;
    for (const wheel of [x + 30, x + 120]) {
      context.beginPath();
      context.arc(wheel, road - 16, 14, 0, 2 * Math.PI);
      context.fill();
    }
    const temperature = iceCreamTemperature(level, material, thickness, state.progress * journey.hours);
    // Thermometer: fill from −20 °C to 0 °C.
    const fill = Math.min(1, Math.max(0, (temperature + 20) / 20));
    context.fillStyle = PLAYGROUND_COLOURS.white;
    context.fillRect(width - 40, 100, 16, 140);
    context.fillStyle = temperature > SOFT_CELSIUS ? PLAYGROUND_COLOURS.enemy : PLAYGROUND_COLOURS.player;
    context.fillRect(width - 40, 100 + 140 * (1 - fill), 16, 140 * fill);
    const soft = 100 + 140 * (1 - (SOFT_CELSIUS + 20) / 20);
    context.fillStyle = PLAYGROUND_COLOURS.ink;
    context.fillRect(width - 46, soft, 28, 2);
    badge(context, `${temperature.toFixed(1)} °C`, width - 110, 92);
    if (state.melted) badge(context, "MELTED!", x + 30, road - 104, PLAYGROUND_COLOURS.enemy);
  },
  describe: (state, input, level) => {
    const journey = JOURNEYS[level] as Journey;
    const material = state.driving ? state.material : Math.round(input.values.material ?? 1) - 1;
    const thickness = state.driving ? state.thicknessCm : input.values.thickness ?? 2;
    return `${(INSULATORS[material] ?? INSULATORS[0]!).name} insulation ${thickness} centimetres thick. The ice cream is at ${iceCreamTemperature(level, material, thickness, state.progress * journey.hours).toFixed(1)} degrees Celsius, ${(state.progress * 100).toFixed(0)} percent of the way.`;
  },
};
