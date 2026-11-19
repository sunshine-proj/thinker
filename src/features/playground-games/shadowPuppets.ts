import { calculatePenumbraWidth, calculateShadowSize } from "../../physics/optics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

/** Distance from the lamp to the screen, in metres. */
export const LAMP_TO_SCREEN = 3;

interface Show {
  readonly title: string;
  readonly goal: string;
  readonly puppet: string;
  readonly puppetCm: number;
  readonly shadowCm: readonly [number, number];
  /** Largest allowed blur at the shadow's edge, in cm. */
  readonly maxBlurCm: number | null;
  /** Fixed lamp size in cm, or null when the player chooses it. */
  readonly lampCm: number | null;
}

export const SHOWS: readonly Show[] = [
  { title: "Giant dragon", goal: "Make the 10 cm dragon's shadow 55–65 cm tall on the screen.", puppet: "🐉", puppetCm: 10, shadowCm: [55, 65], maxBlurCm: null, lampCm: 2 },
  { title: "Sharp mouse", goal: "A 15–18 cm mouse shadow with edges blurred by no more than 1.5 cm. Choose the lamp too.", puppet: "🐭", puppetCm: 8, shadowCm: [15, 18], maxBlurCm: 1.5, lampCm: null },
  { title: "The big show", goal: "A 30–33 cm rabbit with a 4 cm lamp, and the blur at most 9 cm.", puppet: "🐰", puppetCm: 10, shadowCm: [30, 33], maxBlurCm: 9, lampCm: 4 },
];

export function shadowFor(level: number, lampToPuppet: number, lampCm: number) {
  const show = SHOWS[level] as Show;
  const lamp = show.lampCm ?? lampCm;
  return {
    sizeCm: calculateShadowSize(show.puppetCm / 100, lampToPuppet, LAMP_TO_SCREEN) * 100,
    blurCm: calculatePenumbraWidth(lamp / 100, lampToPuppet, LAMP_TO_SCREEN) * 100,
    lampCm: lamp,
  };
}

export interface PuppetState { readonly lit: boolean; readonly shows: number; readonly distance: number; readonly lampCm: number; readonly passed: boolean }

export const shadowPuppets: LiveGameDefinition<PuppetState> = {
  id: "shadow-puppets",
  title: "Shadow Puppet Theatre",
  worldId: "optics",
  eyebrow: "PLAYGROUND · LIGHT AND SHADOWS",
  modelTag: "STRAIGHT LINES · SIMILAR TRIANGLES",
  introduction: "Welcome to the shadow theatre! Move the lamp to make the puppet's shadow just the right size for the show.",
  howToPlay: "Set how far the lamp is from the puppet (and the lamp's size on level 2), predict the shadow, then press Lights on (Space or Enter). Moving anything turns the lights off again.",
  physics: "Light travels in straight lines, so the puppet blocks a cone of light and leaves a shadow. The shadow is bigger the closer the lamp is to the puppet: shadow size = puppet size × (lamp-to-screen distance) ÷ (lamp-to-puppet distance), from similar triangles. A big lamp sends light past the edges from slightly different directions, so the edge is fuzzy (the penumbra); a tiny lamp gives sharp shadows.",
  assumptions: "A flat puppet facing a flat screen 3 m from the lamp, a round lamp of the stated width shining evenly, light travelling in straight lines (no diffraction), and the blur measured as the width of the penumbra.",
  levels: SHOWS.map((show, index) => ({ id: `show-${index + 1}`, title: show.title, goal: show.goal })),
  sliders: (level) => [
    { key: "distance", label: "Lamp to puppet", unit: "m", minimum: 0.2, maximum: 2.9, step: 0.01, initial: 1.5 },
    ...((SHOWS[level] as Show).lampCm === null ? [{ key: "lamp", label: "Lamp size", unit: "cm", minimum: 0.5, maximum: 10, step: 0.1, initial: 5 }] : []),
  ],
  actions: [{ id: "lights", label: "Lights on", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  onDrag: (x, _y, values) => ({ ...values, distance: Math.round(Math.min(2.9, Math.max(0.2, x * LAMP_TO_SCREEN)) * 100) / 100 }),
  create: () => ({ lit: false, shows: 0, distance: 1.5, lampCm: 5, passed: false }),
  step(state, input, _dt, level) {
    const distance = input.values.distance ?? 1.5;
    const lampCm = input.values.lamp ?? 5;
    if (input.pressed.has("lights")) {
      const show = SHOWS[level] as Show;
      const shadow = shadowFor(level, distance, lampCm);
      const passed = shadow.sizeCm >= show.shadowCm[0] && shadow.sizeCm <= show.shadowCm[1] && (show.maxBlurCm === null || shadow.blurCm <= show.maxBlurCm);
      return { lit: true, shows: state.shows + 1, distance, lampCm, passed };
    }
    if (state.lit && (distance !== state.distance || lampCm !== state.lampCm)) return { ...state, lit: false, passed: false };
    return state;
  },
  verdict(state, level) {
    const show = SHOWS[level] as Show;
    if (!state.lit) return { status: "playing", message: state.shows === 0 ? "Place the lamp, predict the shadow, then turn the lights on." : "Lights off. Adjust, then turn them on again." };
    const shadow = shadowFor(level, state.distance, state.lampCm);
    if (state.passed) return { status: "won", message: `Bravo! A ${shadow.sizeCm.toFixed(1)} cm shadow with ${shadow.blurCm.toFixed(1)} cm of blur.` };
    if (shadow.sizeCm < show.shadowCm[0]) return { status: "playing", message: `The shadow is only ${shadow.sizeCm.toFixed(1)} cm. Bring the lamp closer to the puppet.` };
    if (shadow.sizeCm > show.shadowCm[1]) return { status: "playing", message: `The shadow is ${shadow.sizeCm.toFixed(1)} cm, too big. Move the lamp away from the puppet.` };
    return { status: "playing", message: `Right size, but the edges are blurred by ${shadow.blurCm.toFixed(1)} cm. ${show.lampCm === null ? "Try a smaller lamp." : "A bigger shadow is also blurrier."}` };
  },
  stars: (state) => (state.shows <= 1 ? 3 : state.shows <= 3 ? 2 : 1),
  readouts: (state, _input, level) => {
    const show = SHOWS[level] as Show;
    const shadow = shadowFor(level, state.distance, state.lampCm);
    return [
      { label: "PUPPET", value: `${show.puppetCm} cm` },
      { label: "TARGET SHADOW", value: `${show.shadowCm[0]}–${show.shadowCm[1]} cm${show.maxBlurCm === null ? "" : `, blur ≤ ${show.maxBlurCm} cm`}` },
      { label: "SHADOW", value: state.lit ? `${shadow.sizeCm.toFixed(1)} cm (blur ${shadow.blurCm.toFixed(1)} cm)` : "lights off" },
    ];
  },
  draw(context, state, input, width, height, level) {
    const show = SHOWS[level] as Show;
    context.fillStyle = state.lit ? "#3b2f2f" : "#1a1414";
    context.fillRect(0, 0, width, height);
    // Curtains.
    context.fillStyle = "#c92a2a";
    context.fillRect(0, 0, 24, height);
    context.fillRect(width - 24, 0, 24, height);
    const left = 50;
    const screenX = width - 70;
    const scale = (screenX - left) / LAMP_TO_SCREEN;
    const middle = height / 2;
    const vertical = Math.min(3, (height - 40) / 80);
    const distance = input.values.distance ?? 1.5;
    const lampCm = (SHOWS[level] as Show).lampCm ?? input.values.lamp ?? 5;
    context.fillStyle = "#f1f3f5";
    context.fillRect(screenX, 20, 14, height - 40);
    const puppetX = left + distance * scale;
    context.fillStyle = PLAYGROUND_COLOURS.gold;
    context.beginPath();
    context.arc(left, middle, Math.max(3, lampCm * 1.5), 0, 2 * Math.PI);
    context.fill();
    context.fillStyle = "#8d6e63";
    context.fillRect(puppetX - 2, middle - (show.puppetCm * vertical) / 2, 4, show.puppetCm * vertical);
    context.font = "20px sans-serif";
    context.fillText(show.puppet, puppetX - 10, middle - (show.puppetCm * vertical) / 2 - 6);
    if (state.lit) {
      const shadow = shadowFor(level, state.distance, state.lampCm);
      context.strokeStyle = "rgb(255 236 153 / 35%)";
      context.lineWidth = 1;
      for (const sign of [-1, 1]) {
        context.beginPath();
        context.moveTo(left, middle);
        context.lineTo(screenX, middle + (sign * shadow.sizeCm * vertical) / 2);
        context.stroke();
      }
      context.fillStyle = "rgb(20 20 30 / 50%)";
      context.fillRect(screenX, middle - ((shadow.sizeCm + shadow.blurCm) * vertical) / 2, 14, (shadow.sizeCm + shadow.blurCm) * vertical);
      context.fillStyle = "#141420";
      context.fillRect(screenX, middle - ((shadow.sizeCm - shadow.blurCm) * vertical) / 2, 14, Math.max(0, (shadow.sizeCm - shadow.blurCm) * vertical));
      badge(context, `${shadow.sizeCm.toFixed(1)} cm`, screenX - 70, 30, state.passed ? "#2b8a3e" : PLAYGROUND_COLOURS.ink);
    }
    context.strokeStyle = "rgb(81 207 102 / 80%)";
    context.setLineDash([4, 4]);
    for (const size of show.shadowCm) {
      context.beginPath();
      context.moveTo(screenX - 8, middle - (size * vertical) / 2);
      context.lineTo(screenX + 22, middle - (size * vertical) / 2);
      context.stroke();
    }
    context.setLineDash([]);
  },
  describe: (state, input, level) => {
    const show = SHOWS[level] as Show;
    return `The lamp is ${(input.values.distance ?? 1.5).toFixed(2)} metres from the ${show.puppetCm} centimetre puppet and ${LAMP_TO_SCREEN} metres from the screen. ${state.lit ? `The shadow is ${shadowFor(level, state.distance, state.lampCm).sizeCm.toFixed(1)} centimetres tall.` : "The lights are off."}`;
  },
};
