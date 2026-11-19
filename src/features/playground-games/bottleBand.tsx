import { ListenButtons } from "../../components/common";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { calculateJarFrequency, calculateSpeedOfSound, calculateWaterDepthForFrequency } from "../../physics/waves";
import { PLAYGROUND_COLOURS, badge, sky } from "./scenery";

export const JAR_HEIGHT = 0.25;
export const JAR_RADIUS = 0.03;
export const SOUND_SPEED = calculateSpeedOfSound(20);
const TOLERANCE = 0.015;
const MAX_WATER_CM = 22;

interface Note { readonly name: string; readonly hz: number }
interface Song { readonly title: string; readonly goal: string; readonly notes: readonly Note[] }

export const SONGS: readonly Song[] = [
  { title: "Tuning fork", goal: "Tune one jar to the note A (440 Hz), the note orchestras tune to.", notes: [{ name: "A4", hz: 440 }] },
  { title: "Happy chord", goal: "Tune three jars to C, E and G: together they make a happy major chord.", notes: [{ name: "C5", hz: 523.25 }, { name: "E5", hz: 659.26 }, { name: "G5", hz: 783.99 }] },
  { title: "Little tune", goal: "Tune four jars to C, D, E and G, then play your tune.", notes: [{ name: "C5", hz: 523.25 }, { name: "D5", hz: 587.33 }, { name: "E5", hz: 659.26 }, { name: "G5", hz: 783.99 }] },
];

export interface BandState {
  readonly checks: number;
  readonly tuned: readonly boolean[] | null;
}

export function jarFrequency(waterCm: number): number {
  return calculateJarFrequency(JAR_HEIGHT, waterCm / 100, JAR_RADIUS, SOUND_SPEED);
}

export function waterForNote(hz: number): number {
  return calculateWaterDepthForFrequency(JAR_HEIGHT, JAR_RADIUS, SOUND_SPEED, hz) * 100;
}

const JAR_COLOURS = ["#ff6b6b", "#ffa94d", "#51cf66", "#4dabf7"] as const;

export const bottleBand: LiveGameDefinition<BandState> = {
  id: "bottle-band",
  title: "Bottle Band",
  worldId: "waves",
  eyebrow: "PLAYGROUND · SOUND AND PITCH",
  modelTag: "AIR COLUMN · f = v / 4L",
  introduction: "Blow across a jar and the air inside hums. Pour in water to change the note, tune your jars to a song and play it!",
  howToPlay: "Set the water in each jar with its slider (arrow keys for small steps). Use the play buttons to hear each jar, then press Check tuning (Space or Enter).",
  physics: "Blowing across the top makes the air in the jar vibrate. The air column fits a quarter of a sound wave, so a longer column of air plays a lower note: f = v / (4L), where v is the speed of sound (343 m/s). Pouring in water shortens the air column, so the note goes up. Doubling the frequency raises the note by an octave.",
  assumptions: "Straight-sided jars 25 cm tall and 6 cm wide, blown across the top, the air at 20 °C, the open-end correction 0.6 r, and only the lowest note. Real bottles with narrow necks behave differently and sound lower. Tuned means within 1.5 % of the note.",
  levels: SONGS.map((song, index) => ({ id: `song-${index + 1}`, title: song.title, goal: song.goal })),
  sliders: (level) =>
    (SONGS[level] as Song).notes.map((note, index) => ({ key: `jar${index + 1}`, label: `Water in jar ${index + 1} (for ${note.name})`, unit: "cm", minimum: 0, maximum: MAX_WATER_CM, step: 0.1, initial: 2 })),
  actions: [{ id: "check", label: "Check tuning", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ checks: 0, tuned: null }),
  step(state, input, _dt, level) {
    if (!input.pressed.has("check")) {
      return state;
    }
    const song = SONGS[level] as Song;
    const tuned = song.notes.map((note, index) => Math.abs(jarFrequency(input.values[`jar${index + 1}`] ?? 0) / note.hz - 1) <= TOLERANCE);
    return { checks: state.checks + 1, tuned };
  },
  verdict(state, level) {
    const song = SONGS[level] as Song;
    if (!state.tuned) {
      return { status: "playing", message: "Fill the jars, listen, then check your tuning." };
    }
    if (state.tuned.every(Boolean)) {
      return { status: "won", message: `In tune! Your jars play ${song.notes.map((note) => note.name).join(", ")}.` };
    }
    const off = state.tuned.flatMap((ok, index) => (ok ? [] : [index + 1]));
    return { status: "playing", message: `Jar${off.length > 1 ? "s" : ""} ${off.join(" and ")} ${off.length > 1 ? "are" : "is"} out of tune. Listen and adjust.` };
  },
  stars: (state) => (state.checks <= 1 ? 3 : state.checks <= 3 ? 2 : 1),
  readouts: (_state, input, level) =>
    (SONGS[level] as Song).notes.map((note, index) => {
      const f = jarFrequency(input.values[`jar${index + 1}`] ?? 0);
      const off = (f / note.hz - 1) * 100;
      return { label: `JAR ${index + 1} → ${note.name} (${note.hz.toFixed(0)} Hz)`, value: `${f.toFixed(0)} Hz · ${Math.abs(off) <= TOLERANCE * 100 ? "in tune" : off > 0 ? "too high" : "too low"}` };
    }),
  draw(context, state, input, width, height, level) {
    const song = SONGS[level] as Song;
    sky(context, width, height);
    context.fillStyle = "#c98b4f";
    context.fillRect(0, height - 40, width, 40);
    const count = song.notes.length;
    const jarWidth = Math.min(90, width / (count * 2));
    const jarHeight = Math.min(height - 110, 220);
    song.notes.forEach((note, index) => {
      const x = width / 2 + (index - (count - 1) / 2) * jarWidth * 1.8 - jarWidth / 2;
      const top = height - 40 - jarHeight;
      const water = (input.values[`jar${index + 1}`] ?? 0) / (JAR_HEIGHT * 100);
      context.fillStyle = JAR_COLOURS[index % 4] as string;
      context.globalAlpha = 0.75;
      context.fillRect(x, top + jarHeight * (1 - water), jarWidth, jarHeight * water);
      context.globalAlpha = 1;
      context.strokeStyle = PLAYGROUND_COLOURS.ink;
      context.lineWidth = 3;
      context.strokeRect(x, top, jarWidth, jarHeight);
      const f = jarFrequency(input.values[`jar${index + 1}`] ?? 0);
      badge(context, `${note.name} · ${f.toFixed(0)} Hz`, x - 4, top - 10, state.tuned?.[index] ? "#2b8a3e" : PLAYGROUND_COLOURS.ink);
      // Sound waves above the jar: closer together for higher notes.
      context.strokeStyle = "rgb(29 36 64 / 50%)";
      context.lineWidth = 2;
      context.beginPath();
      for (let i = 0; i <= 30; i += 1) {
        const px = x + (i / 30) * jarWidth;
        const py = top - 34 + Math.sin((i / 30) * Math.PI * 2 * (f / 220)) * 6;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.stroke();
    });
  },
  describe: (state, input, level) =>
    (SONGS[level] as Song).notes
      .map((note, index) => `Jar ${index + 1} has ${(input.values[`jar${index + 1}`] ?? 0).toFixed(1)} centimetres of water and plays ${jarFrequency(input.values[`jar${index + 1}`] ?? 0).toFixed(0)} hertz; the target is ${note.name}${state.tuned ? (state.tuned[index] ? ", in tune" : ", out of tune") : ""}.`)
      .join(" "),
  extras: (_state, input, level) => (
    <ListenButtons
      tones={(SONGS[level] as Song).notes.flatMap((note, index) => [
        { label: `Jar ${index + 1}`, frequency: jarFrequency(input.values[`jar${index + 1}`] ?? 0), durationSeconds: 0.6, type: "sine" as const },
        { label: `Target ${note.name}`, frequency: note.hz, durationSeconds: 0.6, type: "triangle" as const },
      ])}
    />
  ),
};
