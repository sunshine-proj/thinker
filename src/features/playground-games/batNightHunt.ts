import { calculateEchoDelay, calculateSpeedOfSound } from "../../physics/waves";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

const CATCH_WITHIN = 0.4;
const MISSES_ALLOWED = 3;

interface Cave { readonly title: string; readonly goal: string; readonly celsius: number; readonly moths: readonly number[]; readonly wall: number | null }
export const CAVES: readonly Cave[] = [
  { title: "First flight", goal: "Click, listen for the echo, work out how far away the moth is, and pounce. Catch 3 moths.", celsius: 20, moths: [3.4, 6.9, 10.3], wall: null },
  { title: "Echoes everywhere", goal: "The cave wall echoes too. The moth is always nearer than the wall, so its echo comes back first.", celsius: 20, moths: [5.1, 8.6, 2.6], wall: 15 },
  { title: "The hot cave", goal: "This cave is 40 °C. Warm air carries sound faster, so the same delay means a farther moth.", celsius: 40, moths: [4.4, 12, 7.7], wall: 18 },
];

export const soundSpeedIn = (level: number) => calculateSpeedOfSound((CAVES[level] as Cave).celsius);
export const mothEcho = (level: number, moth: number) => calculateEchoDelay((CAVES[level] as Cave).moths[moth] as number, soundSpeedIn(level));

export interface BatState { readonly caught: number; readonly misses: number; readonly clicks: number; readonly heard: boolean; readonly lastMiss: number | null }

export const batNightHunt: LiveGameDefinition<BatState> = {
  id: "bat-night-hunt",
  title: "Bat Night Hunt",
  worldId: "waves",
  eyebrow: "PLAYGROUND · ECHOES",
  modelTag: "ECHO · d = v t / 2",
  introduction: "You are a bat in a pitch-dark cave. You cannot see the moths, but you can hear them: click, and listen for the echo bouncing back!",
  howToPlay: "Press Click (C) to send a sound and see when the echo comes back. Work out the moth's distance, set it with the slider, then press Pounce (Space or Enter).",
  physics: "Sound travels through the air at about 343 m/s at 20 °C. Your click flies out to the moth, bounces off and flies back, so it travels the distance twice: distance = speed × time ÷ 2. In warmer air the molecules move faster and pass the sound along faster, so sound speeds up (about 0.6 m/s for every °C).",
  assumptions: `Sound speed from the ideal-gas formula v = √(γRT/M) for dry air, a moth that stays still, echoes straight back along the same path, and a pounce that catches the moth within ${CATCH_WITHIN} m.`,
  levels: CAVES.map((cave, index) => ({ id: `cave-${index + 1}`, title: cave.title, goal: cave.goal })),
  sliders: () => [{ key: "distance", label: "Pounce distance", unit: "m", minimum: 0.5, maximum: 20, step: 0.1, initial: 5 }],
  actions: [
    { id: "click", label: "Click!", keys: ["c", "C"] },
    { id: "pounce", label: "Pounce", keys: [" ", "Enter"] },
  ],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ caught: 0, misses: 0, clicks: 0, heard: false, lastMiss: null }),
  step(state, input, _dt, level) {
    const cave = CAVES[level] as Cave;
    if (state.caught >= cave.moths.length) return state;
    if (input.pressed.has("click")) return { ...state, clicks: state.clicks + 1, heard: true };
    if (!input.pressed.has("pounce")) return state;
    const moth = cave.moths[state.caught] as number;
    const guess = input.values.distance ?? 5;
    return Math.abs(guess - moth) <= CATCH_WITHIN
      ? { ...state, caught: state.caught + 1, heard: false, lastMiss: null }
      : { ...state, misses: state.misses + 1, lastMiss: guess - moth };
  },
  verdict(state, level) {
    const cave = CAVES[level] as Cave;
    if (state.caught >= cave.moths.length) return { status: "won", message: `Crunch! All ${cave.moths.length} moths caught with ${state.misses} miss${state.misses === 1 ? "" : "es"}.` };
    if (state.misses >= MISSES_ALLOWED) return { status: "lost", message: "The moths flew away. Remember: the echo travels there and back." };
    if (state.lastMiss !== null) return { status: "playing", message: state.lastMiss > 0 ? "Whoosh! You flew past it: the moth is nearer." : "Too short! The moth is farther away." };
    return { status: "playing", message: state.heard ? `Echo heard. Moth ${state.caught + 1}: how far?` : `Moth ${state.caught + 1}: click to listen.` };
  },
  stars: (state) => (state.misses === 0 ? 3 : state.misses === 1 ? 2 : 1),
  readouts: (state, _input, level) => {
    const cave = CAVES[level] as Cave;
    const done = state.caught >= cave.moths.length;
    return [
      { label: "SPEED OF SOUND", value: `${soundSpeedIn(level).toFixed(1)} m/s at ${cave.celsius} °C` },
      { label: "MOTH ECHO", value: state.heard && !done ? `${(mothEcho(level, state.caught) * 1000).toFixed(1)} ms` : "click to listen" },
      ...(cave.wall !== null ? [{ label: "WALL ECHO", value: state.heard && !done ? `${(calculateEchoDelay(cave.wall, soundSpeedIn(level)) * 1000).toFixed(1)} ms` : "—" }] : []),
      { label: "MOTHS CAUGHT", value: `${state.caught} of ${cave.moths.length}` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const cave = CAVES[level] as Cave;
    context.fillStyle = "#120d24";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#2b2150";
    for (let i = 0; i < 14; i += 1) {
      const x = (i / 14) * width;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + width / 28, 18 + (i % 3) * 12);
      context.lineTo(x + width / 14, 0);
      context.fill();
    }
    const scale = (width - 80) / 20;
    const y = height * 0.5;
    const batX = 30;
    context.fillStyle = "#9775fa";
    context.beginPath();
    context.moveTo(batX - 18, y - 8);
    context.lineTo(batX, y);
    context.lineTo(batX + 18, y - 8);
    context.lineTo(batX, y + 6);
    context.fill();
    // Echo rings for the latest click.
    if (state.heard) {
      context.strokeStyle = "rgb(151 117 250 / 50%)";
      for (let ring = 1; ring <= 4; ring += 1) {
        context.beginPath();
        context.arc(batX, y, ring * 18, -0.6, 0.6);
        context.stroke();
      }
    }
    if (cave.wall !== null) {
      context.fillStyle = "#3b2f74";
      context.fillRect(batX + cave.wall * scale, 30, 14, height - 60);
    }
    cave.moths.forEach((moth, index) => {
      if (index >= state.caught) return;
      badge(context, "✓ moth", batX + moth * scale - 20, y + 40 + index * 18, "#2b8a3e");
    });
    const guess = input.values.distance ?? 5;
    context.strokeStyle = PLAYGROUND_COLOURS.gold;
    context.setLineDash([4, 4]);
    context.beginPath();
    context.moveTo(batX + guess * scale, y - 30);
    context.lineTo(batX + guess * scale, y + 30);
    context.stroke();
    context.setLineDash([]);
    badge(context, `${guess.toFixed(1)} m`, batX + guess * scale - 18, y - 36, "#a67c00");
  },
  describe: (state, input, level) => {
    const cave = CAVES[level] as Cave;
    return `Cave at ${cave.celsius} degrees Celsius. ${state.caught} of ${cave.moths.length} moths caught. ${state.heard && state.caught < cave.moths.length ? `The moth's echo returned after ${(mothEcho(level, state.caught) * 1000).toFixed(1)} milliseconds.` : "No echo heard yet."} Pounce distance set to ${(input.values.distance ?? 5).toFixed(1)} metres.`;
  },
};
