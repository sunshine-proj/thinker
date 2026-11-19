import { calculateCoulombBarrierMeV, calculateGamowEnergyKeV, calculateKeVFromTemperature, calculateTemperatureFromKeV, calculateTunnellingRateFactor } from "../../physics/nuclear";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, stars } from "./scenery";

/** The Sun's core temperature, K. */
export const SUN_CORE_KELVIN = 15.7e6;
const PROTON_GAMOW_KEV = calculateGamowEnergyKeV(1, 1, 0.5);
const PROTON_BARRIER_KEV = calculateCoulombBarrierMeV(1, 1, 1, 1) * 1000;

interface Star { readonly title: string; readonly goal: string; readonly brightness: readonly [number, number]; readonly colour: string }
export const STAR_ORDERS: readonly Star[] = [
  { title: "Light the Sun", goal: "Heat the core until hydrogen fuses as fast as in our Sun (½ to 2 times the Sun's rate).", brightness: [0.5, 2], colour: "#ffd43b" },
  { title: "Red dwarf", goal: "A small, cool star: make it shine at only 1–5 % of the Sun's fusion rate.", brightness: [0.01, 0.05], colour: "#ff6b6b" },
  { title: "Big bright star", goal: "A heavy star burns its hydrogen 30–100 times faster than the Sun.", brightness: [30, 100], colour: "#74c0fc" },
];

/** Hydrogen fusion rate compared with the Sun's core, from the temperature-dependent tunnelling factor. */
export const fusionRate = (kelvin: number) => calculateTunnellingRateFactor(PROTON_GAMOW_KEV, kelvin) / calculateTunnellingRateFactor(PROTON_GAMOW_KEV, SUN_CORE_KELVIN);
/** Temperature at which the typical thermal energy kT would equal the classical barrier. */
export const CLASSICAL_KELVIN = calculateTemperatureFromKeV(PROTON_BARRIER_KEV);

export interface FurnaceState { readonly tries: number; readonly rate: number | null }

export const starFurnace: LiveGameDefinition<FurnaceState> = {
  id: "star-furnace",
  title: "Star Furnace",
  worldId: "nuclear",
  eyebrow: "PLAYGROUND · NUCLEAR FUSION",
  modelTag: "COULOMB BARRIER · TUNNELLING",
  introduction: "Stars are giant fusion furnaces. Heat up the core so that hydrogen nuclei crash together and fuse, and make your star shine just right!",
  howToPlay: "Set the core temperature with the slider and press Ignite (Space or Enter). The readouts compare the protons' energy with the wall they must cross.",
  physics: "Two protons both have positive charge, so they push each other away: there is an energy wall (the Coulomb barrier) of about 550 keV. In the Sun's core the protons only have about 1.4 keV each, hundreds of times too little! They fuse anyway because of quantum tunnelling: now and then a proton slips through the wall. Hotter protons tunnel much more often, so the fusion rate climbs very steeply with temperature: heat the core by 20 % and the Sun would shine about twice as bright.",
  assumptions: "Proton–proton fusion only, the same density and amount of hydrogen in every star, the temperature dependence of the rate from the Gamow tunnelling factor τ²e^(−τ) with E_G ≈ 490 keV, and the Sun's core at 15.7 million K.",
  levels: STAR_ORDERS.map((order, index) => ({ id: `star-${index + 1}`, title: order.title, goal: order.goal })),
  sliders: () => [{ key: "megakelvin", label: "Core temperature", unit: "million K", minimum: 1, maximum: 60, step: 0.1, initial: 5 }],
  actions: [{ id: "ignite", label: "Ignite!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ tries: 0, rate: null }),
  step(state, input) {
    if (!input.pressed.has("ignite")) return state;
    return { tries: state.tries + 1, rate: fusionRate((input.values.megakelvin ?? 5) * 1e6) };
  },
  verdict(state, level) {
    const order = STAR_ORDERS[level] as Star;
    if (state.rate === null) return { status: "playing", message: "Heat the core, then ignite." };
    if (state.rate >= order.brightness[0] && state.rate <= order.brightness[1]) return { status: "won", message: `It shines! Fusion at ${formatRate(state.rate)} the Sun's rate.` };
    return { status: "playing", message: state.rate < order.brightness[0] ? `Only ${formatRate(state.rate)} the Sun's rate. Hotter!` : `${formatRate(state.rate)} the Sun's rate: too fierce. Cooler!` };
  },
  stars: (state) => (state.tries <= 2 ? 3 : state.tries <= 4 ? 2 : 1),
  readouts: (_state, input) => {
    const kelvin = (input.values.megakelvin ?? 5) * 1e6;
    return [
      { label: "PROTON ENERGY kT", value: `${calculateKeVFromTemperature(kelvin).toFixed(2)} keV` },
      { label: "COULOMB BARRIER", value: `${PROTON_BARRIER_KEV.toFixed(0)} keV` },
      { label: "WITHOUT TUNNELLING YOU WOULD NEED", value: `${(CLASSICAL_KELVIN / 1e9).toFixed(1)} billion K` },
      { label: "FUSION RATE", value: `${formatRate(fusionRate(kelvin))} the Sun's` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const order = STAR_ORDERS[level] as Star;
    context.fillStyle = "#05061a";
    context.fillRect(0, 0, width, height);
    stars(context, width, height);
    const rate = state.rate ?? 0;
    const glow = Math.min(1, Math.log10(1 + rate * 10) / 3);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const gradient = context.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * (1 + glow));
    gradient.addColorStop(0, state.rate === null ? "#495057" : order.colour);
    gradient.addColorStop(1, "rgb(0 0 0 / 0%)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(cx, cy, radius * (1 + glow), 0, 2 * Math.PI);
    context.fill();
    // Two protons approaching the barrier.
    const kT = calculateKeVFromTemperature((input.values.megakelvin ?? 5) * 1e6);
    const gap = Math.max(10, 60 - kT * 8);
    context.fillStyle = PLAYGROUND_COLOURS.enemy;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.arc(cx + side * gap, cy, 9, 0, 2 * Math.PI);
      context.fill();
    }
    badge(context, `${(input.values.megakelvin ?? 5).toFixed(1)} million K`, 12, 24, "#5f3dc4");
  },
  describe: (state, input) => `Core at ${(input.values.megakelvin ?? 5).toFixed(1)} million kelvin: fusion at ${formatRate(fusionRate((input.values.megakelvin ?? 5) * 1e6))} the Sun's rate. ${state.rate === null ? "Not ignited yet." : ""}`,
};

function formatRate(rate: number): string {
  return rate >= 10 ? `${rate.toFixed(0)}×` : rate >= 0.1 ? `${rate.toFixed(2)}×` : `${rate.toExponential(1)}×`;
}
