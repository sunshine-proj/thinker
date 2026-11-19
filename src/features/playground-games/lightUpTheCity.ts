import { wireCity, type CityReading } from "../../physics/electromagnetism";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky, stars } from "./scenery";

/** Each bulb is made for 12 V and 6 W, so its resistance is V²/P = 24 Ω. */
const BULB_OHMS = 24;
const GOOD_LIGHT = { minimum: 4.5, maximum: 8 } as const;
const BURN_OUT_WATTS = 12;

interface Town { readonly title: string; readonly goal: string; readonly volts: number; readonly houses: number; readonly fuseAmps: number }
export const TOWNS: readonly Town[] = [
  { title: "The little village", goal: "Light all 4 houses from a 12 V battery. Each bulb wants 12 V.", volts: 12, houses: 4, fuseAmps: 3 },
  { title: "The busy town", goal: "Light 6 houses from a 24 V battery without blowing the 2 A fuse.", volts: 24, houses: 6, fuseAmps: 2 },
  { title: "The big city", goal: "Light 9 houses from a 36 V battery. The fuse allows only 1.6 A.", volts: 36, houses: 9, fuseAmps: 1.6 },
];

export interface CityState {
  readonly switchedOn: boolean;
  readonly reading: CityReading | null;
  readonly attempts: number;
  readonly result: "none" | "dim" | "lit" | "bulb-blown" | "fuse-blown";
  readonly glow: number;
}

export function checkCity(level: number, perStreet: number) {
  const town = TOWNS[level] as Town;
  const reading = wireCity(town.volts, BULB_OHMS, town.houses, perStreet);
  const powers = reading.streets.map((street) => street.bulbPowerWatts);
  const result: CityState["result"] =
    reading.totalCurrentAmperes > town.fuseAmps ? "fuse-blown"
    : powers.some((power) => power > BURN_OUT_WATTS) ? "bulb-blown"
    : powers.every((power) => power >= GOOD_LIGHT.minimum && power <= GOOD_LIGHT.maximum) ? "lit"
    : "dim";
  return { reading, result };
}

export const lightUpTheCity: LiveGameDefinition<CityState> = {
  id: "light-up-the-city",
  title: "Light Up the City",
  worldId: "electromagnetism",
  eyebrow: "PLAYGROUND · ELECTRIC CIRCUITS",
  modelTag: "SERIES & PARALLEL · OHM'S LAW",
  introduction: "Night is falling. Wire the houses into streets so that every window glows brightly, without burning out a bulb or blowing the town's fuse.",
  howToPlay: "Choose how many houses share each street with the slider, then press Switch on (Space or Enter). Houses on the same street are in series; every street connects straight to the battery, in parallel.",
  physics: "Bulbs on one street share the battery's voltage, so two bulbs in series each get half of it and glow dimly. Each street that connects straight to the battery gets the full voltage, but adds its own current, so the battery has to supply more. A bulb's brightness is its power P = I²R: too little and it is dim, too much and it burns out. The fuse melts if the total current is too large.",
  assumptions: "An ideal battery and wires, identical 24 Ω bulbs (made for 12 V, 6 W) whose resistance does not change as they heat, a good glow between 4.5 W and 8 W, burn-out above 12 W, and a fuse that blows above its rating.",
  levels: TOWNS.map((town, index) => ({ id: `town-${index + 1}`, title: town.title, goal: town.goal })),
  sliders: (level) => [{ key: "perStreet", label: "Houses on each street (in series)", unit: "", minimum: 1, maximum: (TOWNS[level] as Town).houses, step: 1, initial: 1 }],
  actions: [{ id: "switch", label: "Switch on", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ switchedOn: false, reading: null, attempts: 0, result: "none", glow: 0 }),
  step(state, input, dt, level) {
    if (input.pressed.has("switch")) {
      const { reading, result } = checkCity(level, Math.round(input.values.perStreet ?? 1));
      return { switchedOn: true, reading, attempts: state.attempts + 1, result, glow: 0 };
    }
    return state.switchedOn ? { ...state, glow: Math.min(1, state.glow + dt * 2) } : state;
  },
  verdict(state, level) {
    const town = TOWNS[level] as Town;
    switch (state.result) {
      case "lit":
        return { status: "won", message: `Every house glows! The battery supplies ${state.reading?.totalCurrentAmperes.toFixed(2)} A.` };
      case "bulb-blown":
        return { status: "lost", message: "Pop! A bulb got too much power and burned out. Put more houses on each street." };
      case "fuse-blown":
        return { status: "lost", message: `The fuse blew: the streets together drew ${state.reading?.totalCurrentAmperes.toFixed(2)} A, more than ${town.fuseAmps} A.` };
      case "dim":
        return { status: "playing", message: "Some houses are too dim. Change the streets and switch on again." };
      default:
        return { status: "playing", message: "Wire the town, then switch on." };
    }
  },
  stars: (state) => (state.attempts <= 1 ? 3 : state.attempts <= 2 ? 2 : 1),
  readouts: (state, input, level) => {
    const town = TOWNS[level] as Town;
    const perStreet = Math.round(input.values.perStreet ?? 1);
    const preview = wireCity(town.volts, BULB_OHMS, town.houses, perStreet);
    return [
      { label: "BATTERY", value: `${town.volts} V` },
      { label: "STREETS", value: `${preview.streets.length} (${preview.streets.map((street) => street.bulbs).join(" + ")} houses)` },
      { label: "BULB POWER", value: state.reading ? state.reading.streets.map((street) => `${street.bulbPowerWatts.toFixed(1)} W`).join(", ") : "switch on to measure" },
      { label: "TOTAL CURRENT", value: state.reading ? `${state.reading.totalCurrentAmperes.toFixed(2)} A (fuse ${town.fuseAmps} A)` : `fuse ${town.fuseAmps} A` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const town = TOWNS[level] as Town;
    sky(context, width, height, true);
    stars(context, width, height);
    context.fillStyle = "#f5f1c9";
    context.beginPath();
    context.arc(width - 60, 50, 20, 0, 2 * Math.PI);
    context.fill();
    const perStreet = Math.round(input.values.perStreet ?? 1);
    const layout = state.reading ?? wireCity(town.volts, BULB_OHMS, town.houses, perStreet);
    const rows = layout.streets.length;
    const rowHeight = (height - 90) / Math.max(rows, 1);
    // Battery on the left.
    context.fillStyle = "#3d4760";
    context.fillRect(18, height / 2 - 30, 26, 60);
    context.fillStyle = PLAYGROUND_COLOURS.gold;
    context.fillRect(24, height / 2 - 36, 14, 8);
    badge(context, `${town.volts} V`, 8, height / 2 + 50, "#3d4760");
    layout.streets.forEach((street, row) => {
      const y = 60 + row * rowHeight + rowHeight / 2;
      context.strokeStyle = "#f2b705";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(44, height / 2);
      context.lineTo(70, y);
      context.lineTo(width - 30, y);
      context.stroke();
      const brightness = state.reading ? Math.min(1, street.bulbPowerWatts / 6) * state.glow : 0;
      const blown = state.reading && street.bulbPowerWatts > BURN_OUT_WATTS;
      for (let i = 0; i < street.bulbs; i += 1) {
        const x = 100 + i * Math.min(90, (width - 160) / Math.max(1, street.bulbs));
        context.fillStyle = ["#e86f6f", "#6fa8e8", "#8bd66b", "#e8b86f", "#b98be8"][(row + i) % 5] as string;
        context.fillRect(x, y - 34, 44, 30);
        context.fillStyle = "#5b3a2a";
        context.beginPath();
        context.moveTo(x - 4, y - 34);
        context.lineTo(x + 22, y - 52);
        context.lineTo(x + 48, y - 34);
        context.fill();
        context.fillStyle = blown ? "#444" : `rgb(255 ${200 + 55 * brightness} ${80 + 100 * brightness} / ${0.25 + 0.75 * brightness})`;
        context.fillRect(x + 14, y - 26, 16, 14);
        if (blown) {
          context.fillStyle = PLAYGROUND_COLOURS.white;
          context.fillText("✕", x + 18, y - 15);
        }
      }
    });
    if (state.result === "fuse-blown") {
      badge(context, "FUSE BLOWN", width / 2 - 40, 30, PLAYGROUND_COLOURS.enemy);
    }
  },
  describe: (state, input, level) => {
    const town = TOWNS[level] as Town;
    const perStreet = Math.round(input.values.perStreet ?? 1);
    return `${town.houses} houses on streets of ${perStreet}. ${state.reading ? `Bulbs get ${state.reading.streets.map((street) => `${street.bulbPowerWatts.toFixed(1)} watts`).join(", ")}; total current ${state.reading.totalCurrentAmperes.toFixed(2)} amperes.` : "The town is dark."}`;
  },
};
