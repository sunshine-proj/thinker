import { calculateCrownGlassIndex, calculatePrismDeviation } from "../../physics/optics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

export const APEX_DEGREES = 60;
const VIEW = { from: 37, to: 46 } as const;

export const COLOURS = [
  { name: "violet", from: 400, to: 450, css: "#7048e8" },
  { name: "blue", from: 450, to: 495, css: "#1c7ed6" },
  { name: "green", from: 495, to: 570, css: "#37b24d" },
  { name: "yellow", from: 570, to: 590, css: "#fcc419" },
  { name: "orange", from: 590, to: 620, css: "#fd7e14" },
  { name: "red", from: 620, to: 700, css: "#e03131" },
] as const;
export type ColourName = (typeof COLOURS)[number]["name"];

interface Spot { readonly label: string; readonly colour: ColourName; readonly deviation: number }
interface Picture { readonly title: string; readonly goal: string; readonly spots: readonly Spot[]; readonly paints: number }
export const PICTURES: readonly Picture[] = [
  {
    title: "A flower",
    goal: "Paint the petal red, the middle yellow and the leaf green. Turn the prism so the right colour lands on each spot.",
    spots: [{ label: "petal", colour: "red", deviation: 42 }, { label: "middle", colour: "yellow", deviation: 41.5 }, { label: "leaf", colour: "green", deviation: 43 }],
    paints: 6,
  },
  {
    title: "Rainbow arch",
    goal: "Paint all six colours of the rainbow, in order, with only 9 drops of paint.",
    spots: [
      { label: "outer band", colour: "red", deviation: 40.5 }, { label: "band 2", colour: "orange", deviation: 41 }, { label: "band 3", colour: "yellow", deviation: 41.5 },
      { label: "band 4", colour: "green", deviation: 42 }, { label: "band 5", colour: "blue", deviation: 42.5 }, { label: "inner band", colour: "violet", deviation: 43 },
    ],
    paints: 9,
  },
  {
    title: "The lowest spot",
    goal: "One spot is so low that some colours can never bend that little. Paint the picture with 6 drops.",
    spots: [{ label: "sunset", colour: "red", deviation: 38.6 }, { label: "sea", colour: "blue", deviation: 40 }, { label: "grass", colour: "green", deviation: 39 }, { label: "night sky", colour: "violet", deviation: 40.5 }],
    paints: 6,
  },
];

/** Deviation (degrees) of light of one wavelength through the prism, or null if it cannot get out. */
export function deviationFor(incidence: number, wavelengthNm: number): number | null {
  return calculatePrismDeviation(incidence, APEX_DEGREES, calculateCrownGlassIndex(wavelengthNm));
}

/** The wavelength that lands at `deviation` for this incidence, or null if no visible light does. */
export function wavelengthAt(incidence: number, deviation: number): number | null {
  const violet = deviationFor(incidence, 400);
  const red = deviationFor(incidence, 700);
  if (violet === null || red === null || deviation > violet || deviation < red) return null;
  // Shorter wavelengths bend more, so the deviation falls steadily from violet to red.
  let low = 400;
  let high = 700;
  for (let i = 0; i < 50; i += 1) {
    const middle = (low + high) / 2;
    if ((deviationFor(incidence, middle) as number) > deviation) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function colourOf(wavelengthNm: number): ColourName {
  return (COLOURS.find((colour) => wavelengthNm < colour.to) ?? COLOURS[COLOURS.length - 1]!).name;
}

export interface PainterState {
  readonly painted: number;
  readonly drops: number;
  /** The colour that landed on the spot after a wrong paint (null: no light), or undefined after a good one. */
  readonly miss: ColourName | null | undefined;
}

const cssOf = (name: ColourName) => COLOURS.find((colour) => colour.name === name)!.css;

export const rainbowPainter: LiveGameDefinition<PainterState> = {
  id: "rainbow-painter",
  title: "Rainbow Painter",
  worldId: "optics",
  eyebrow: "PLAYGROUND · DISPERSION",
  modelTag: "PRISM · n DEPENDS ON COLOUR",
  introduction: "White light is secretly every colour mixed together. Shine it through a glass prism to split it into a rainbow, then use the colours to paint a picture!",
  howToPlay: "Turn the prism with the slider (the angle the light hits it), watch where each colour lands on the screen, then press Paint (Space or Enter) to paint the glowing spot with the colour that falls on it.",
  physics: "Glass slows light down and bends it. Violet light is slowed a little more than red light, so it bends more: the prism fans white light out into a spectrum (dispersion). Turning the prism changes how much all the colours bend. There is a smallest bend, the minimum deviation, so very low spots can only be reached by the colours that bend least.",
  assumptions: "A 60° crown-glass prism with the refractive index n(λ) = 1.5046 + 4200 nm²/λ² (Cauchy's formula), light in one plane, a screen curved around the prism so spots are set by their angle, and simple colour names for wavelength bands.",
  levels: PICTURES.map((picture, index) => ({ id: `picture-${index + 1}`, title: picture.title, goal: picture.goal })),
  sliders: () => [{ key: "incidence", label: "Light hits the prism at", unit: "°", minimum: 30, maximum: 80, step: 0.05, initial: 60 }],
  actions: [{ id: "paint", label: "Paint!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ painted: 0, drops: 0, miss: undefined }),
  step(state, input, _dt, level) {
    const picture = PICTURES[level] as Picture;
    if (!input.pressed.has("paint") || state.painted >= picture.spots.length) return state;
    const spot = picture.spots[state.painted] as Spot;
    const wavelength = wavelengthAt(input.values.incidence ?? 60, spot.deviation);
    const colour = wavelength === null ? null : colourOf(wavelength);
    return colour === spot.colour
      ? { painted: state.painted + 1, drops: state.drops + 1, miss: undefined }
      : { painted: state.painted, drops: state.drops + 1, miss: colour };
  },
  verdict(state, level) {
    const picture = PICTURES[level] as Picture;
    if (state.painted >= picture.spots.length) return { status: "won", message: `Masterpiece! Painted with ${state.drops} drops.` };
    if (state.drops >= picture.paints) return { status: "lost", message: "Out of paint! Watch where each colour lands before you paint." };
    const spot = picture.spots[state.painted] as Spot;
    if (state.miss !== undefined) {
      return { status: "playing", message: state.miss ? `Oops, that was ${state.miss}. The ${spot.label} needs ${spot.colour}.` : `No light reached the ${spot.label}. Turn the prism.` };
    }
    return { status: "playing", message: `Paint the ${spot.label} ${spot.colour}.` };
  },
  stars: (state, level) => {
    const wasted = state.drops - (PICTURES[level] as Picture).spots.length;
    return wasted <= 0 ? 3 : wasted <= 1 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const picture = PICTURES[level] as Picture;
    const spot = picture.spots[Math.min(state.painted, picture.spots.length - 1)] as Spot;
    const incidence = input.values.incidence ?? 60;
    const wavelength = wavelengthAt(incidence, spot.deviation);
    return [
      { label: "SPOT", value: `${spot.label}: needs ${spot.colour}` },
      { label: "LIGHT ON THE SPOT", value: wavelength === null ? "none" : `${colourOf(wavelength)} (${wavelength.toFixed(0)} nm)` },
      { label: "RED / VIOLET BEND", value: `${deviationFor(incidence, 650)?.toFixed(2) ?? "—"}° / ${deviationFor(incidence, 420)?.toFixed(2) ?? "—"}°` },
      { label: "PAINT LEFT", value: `${picture.paints - state.drops} drops` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const picture = PICTURES[level] as Picture;
    context.fillStyle = "#212529";
    context.fillRect(0, 0, width, height);
    const prism = { x: width * 0.25, y: height * 0.55, size: Math.min(110, height * 0.35) };
    const screenX = width - 60;
    const yOf = (deviation: number) => 30 + ((VIEW.to - deviation) / (VIEW.to - VIEW.from)) * (height - 60);
    const incidence = input.values.incidence ?? 60;
    // Incoming white beam.
    context.strokeStyle = PLAYGROUND_COLOURS.white;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(0, prism.y + 40 - (incidence - 60) * 2);
    context.lineTo(prism.x, prism.y);
    context.stroke();
    // Fan of colours from the prism to the screen.
    for (let wavelength = 400; wavelength <= 700; wavelength += 5) {
      const deviation = deviationFor(incidence, wavelength);
      if (deviation === null) continue;
      context.strokeStyle = cssOf(colourOf(wavelength));
      context.globalAlpha = 0.55;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(prism.x + 10, prism.y);
      context.lineTo(screenX, yOf(deviation));
      context.stroke();
    }
    context.globalAlpha = 1;
    context.fillStyle = "rgb(165 216 255 / 55%)";
    context.beginPath();
    context.moveTo(prism.x, prism.y - prism.size / 2);
    context.lineTo(prism.x + prism.size / 2, prism.y + prism.size / 2);
    context.lineTo(prism.x - prism.size / 2, prism.y + prism.size / 2);
    context.closePath();
    context.fill();
    context.fillStyle = "#f8f9fa";
    context.fillRect(screenX, 20, 30, height - 40);
    picture.spots.forEach((spot, index) => {
      const y = yOf(spot.deviation);
      context.fillStyle = index < state.painted ? cssOf(spot.colour) : "#dee2e6";
      context.beginPath();
      context.arc(screenX + 15, y, 8, 0, 2 * Math.PI);
      context.fill();
      context.strokeStyle = index === state.painted ? PLAYGROUND_COLOURS.gold : "#495057";
      context.lineWidth = index === state.painted ? 3 : 1;
      context.stroke();
      if (index === state.painted) badge(context, `${spot.label}: ${spot.colour}`, screenX - 130, y + 4, "#495057");
    });
  },
  describe: (state, input, level) => {
    const picture = PICTURES[level] as Picture;
    const spot = picture.spots[Math.min(state.painted, picture.spots.length - 1)] as Spot;
    const wavelength = wavelengthAt(input.values.incidence ?? 60, spot.deviation);
    return `Light hits the prism at ${(input.values.incidence ?? 60).toFixed(2)} degrees. ${state.painted} of ${picture.spots.length} spots painted. The ${spot.label} needs ${spot.colour}; ${wavelength === null ? "no light lands on it" : `${colourOf(wavelength)} light lands on it`}.`;
  },
};
