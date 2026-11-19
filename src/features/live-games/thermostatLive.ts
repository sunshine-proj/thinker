import { calculateRoomTemperature } from "../../physics/thermodynamics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { label, line, toScreen, type View } from "./drawing";

const NIGHT_SECONDS = 6 * 3600;
const HEAT_CAPACITY = 2e6;
const BAND = { low: 19, high: 23 } as const;
const MAX_OUTSIDE_MINUTES = 30;

interface NightLevel { readonly title: string; readonly outside: (t: number) => number; readonly conductance: (t: number) => number; readonly goal: string }

const LEVELS: readonly NightLevel[] = [
  { title: "A mild night", goal: "Keep the cabin between 19 °C and 23 °C all night while the outside cools from 5 °C to −5 °C and warms again.", outside: (t) => -5 * Math.sin((Math.PI * t) / NIGHT_SECONDS) + 5 * Math.cos((Math.PI * t) / NIGHT_SECONDS) ** 2, conductance: () => 100 },
  { title: "A freezing night", goal: "The same cabin, but outside it falls to −15 °C.", outside: (t) => -15 * Math.sin((Math.PI * t) / NIGHT_SECONDS), conductance: () => 100 },
  { title: "Storm at midnight", goal: "At midnight a storm's wind makes the cabin lose heat 60 % faster. React in time.", outside: (t) => -8 * Math.sin((Math.PI * t) / NIGHT_SECONDS), conductance: (t) => (t > NIGHT_SECONDS / 2 ? 160 : 100) },
];

interface CabinState {
  readonly time: number;
  readonly temperature: number;
  readonly outsideSeconds: number;
  readonly history: readonly { t: number; inside: number; outside: number }[];
}

export const thermostatLive: LiveGameDefinition<CabinState> = {
  id: "temperature-control-live",
  title: "Temperature Control Live",
  worldId: "thermodynamics",
  relatedGameId: "temperature-control",
  eyebrow: "THERMODYNAMICS · HEAT TRANSFER",
  modelTag: "HEAT BALANCE C dT/dt = P − G(T − T_out)",
  introduction: "You are the cabin's thermostat for a six-hour night, played in one minute. Adjust the heater as the outside temperature changes and keep the cabin comfortable.",
  howToPlay: "Move the heater slider (keyboard arrows work on it) while the night runs. Press Start to begin; the night takes about a minute.",
  physics: "Heat leaks out through the walls at a rate G(T − T_out), proportional to the temperature difference. The heater must replace it: the cabin warms when the heater power is larger than the loss and cools when it is smaller. Because the cabin stores a lot of heat (C), it responds slowly, with a time constant C/G of several hours, so a good thermostat acts before the temperature drifts out of range.",
  assumptions: "A well-mixed cabin with one heat capacity (2 MJ/K), wall conductance 100 W/K (160 W/K in the storm), the outside temperature changing smoothly, and an ideal heater. Each step uses the exact exponential solution for constant inputs. Six hours are played in about one minute.",
  levels: LEVELS.map((entry, index) => ({ id: `night-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [{ key: "heater", label: "Heater power", unit: "W", minimum: 0, maximum: 5000, step: 50, initial: 1600 }],
  actions: [],
  timing: { fixedTimeStepSeconds: 10, timeScale: 360, maxSubSteps: 64 },
  onDrag: (_x, y) => ({ heater: Math.round((y * 5000) / 50) * 50 }),
  create: () => ({ time: 0, temperature: 21, outsideSeconds: 0, history: [] }),
  step(state, input, dt, level) {
    if (state.time >= NIGHT_SECONDS) {
      return state;
    }
    const night = LEVELS[level] as NightLevel;
    const mid = state.time + dt / 2;
    const temperature = calculateRoomTemperature(
      { outsideTemperatureCelsius: night.outside(mid), heaterPowerWatts: input.values.heater ?? 0, conductanceWattsPerKelvin: night.conductance(mid), heatCapacityJoulesPerKelvin: HEAT_CAPACITY, initialTemperatureCelsius: state.temperature },
      dt,
    );
    const time = state.time + dt;
    const outsideSeconds = state.outsideSeconds + (temperature < BAND.low || temperature > BAND.high ? dt : 0);
    const history = Math.floor(time / 300) > Math.floor(state.time / 300) ? [...state.history, { t: time, inside: temperature, outside: night.outside(time) }] : state.history;
    return { time, temperature, outsideSeconds, history };
  },
  verdict(state) {
    const minutes = state.outsideSeconds / 60;
    if (minutes > MAX_OUTSIDE_MINUTES) {
      return { status: "lost", message: `The cabin was out of the comfort band for more than ${MAX_OUTSIDE_MINUTES} minutes.` };
    }
    if (state.time >= NIGHT_SECONDS) {
      return { status: "won", message: `Morning! Only ${minutes.toFixed(0)} minutes outside 19–23 °C.` };
    }
    return { status: "playing", message: `${(state.time / 3600).toFixed(1)} h into the night · ${minutes.toFixed(0)} min out of the band so far.` };
  },
  stars: (state) => (state.outsideSeconds === 0 ? 3 : state.outsideSeconds <= 600 ? 2 : 1),
  readouts: (state, input, level) => {
    const night = LEVELS[level] as NightLevel;
    const loss = night.conductance(state.time) * (state.temperature - night.outside(state.time));
    return [
      { label: "CABIN", value: `${state.temperature.toFixed(1)} °C` },
      { label: "OUTSIDE", value: `${night.outside(state.time).toFixed(1)} °C` },
      { label: "HEAT LOSS NOW", value: `${loss.toFixed(0)} W` },
      { label: "HEATER", value: `${(input.values.heater ?? 0).toFixed(0)} W` },
    ];
  },
  draw(context, state, _input, width, height, level) {
    const view: View = { minX: 0, maxX: 6, minY: -16, maxY: 28, width, height };
    const night = LEVELS[level] as NightLevel;
    const low = toScreen(view, 0, BAND.low);
    const high = toScreen(view, 6, BAND.high);
    context.fillStyle = "rgb(42 171 131 / 18%)";
    context.fillRect(low.x, high.y, high.x - low.x, low.y - high.y);
    label(context, "COMFORT 19–23 °C", low.x + 6, high.y - 6, "#1f7d5d");
    const outside = Array.from({ length: 61 }, (_, i) => toScreen(view, (6 * i) / 60, night.outside((NIGHT_SECONDS * i) / 60)));
    line(context, outside, "#7180d8", 2, true);
    label(context, "OUTSIDE", outside[2]!.x, outside[2]!.y - 6, "#4b5bc4");
    line(context, [toScreen(view, 0, 21), ...state.history.map((point) => toScreen(view, point.t / 3600, point.inside)), toScreen(view, state.time / 3600, state.temperature)], "#e27945", 3);
    for (let h = 0; h <= 6; h += 1) {
      const tick = toScreen(view, h, -16);
      label(context, `${h} h`, tick.x - 8, tick.y - 4, "#4d566b", 10);
    }
  },
  describe: (state, input, level) => `${(state.time / 3600).toFixed(1)} hours into the night. Cabin ${state.temperature.toFixed(1)} degrees, outside ${(LEVELS[level] as NightLevel).outside(state.time).toFixed(1)} degrees, heater ${input.values.heater ?? 0} watts.`,
};
