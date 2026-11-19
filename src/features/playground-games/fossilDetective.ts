import { calculateRemainingFraction } from "../../physics/nuclear";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

export const CLOCKS = [
  { name: "carbon-14", halfLifeYears: 5730 },
  { name: "potassium-40", halfLifeYears: 1.25e9 },
] as const;
/** Below or above these remaining fractions the lab cannot measure the change reliably. */
const MEASURABLE = { minimum: 0.001, maximum: 0.999 } as const;
const AGE_TOLERANCE = 0.1;

interface Find { readonly name: string; readonly emoji: string; readonly ageYears: number }
interface Case { readonly title: string; readonly goal: string; readonly finds: readonly Find[] }
export const CASES: readonly Case[] = [
  { title: "Ice-age bones", goal: "Use the carbon-14 clock. Each half-life, half of what is left decays.", finds: [{ name: "Mammoth bone", emoji: "🦣", ageYears: 5730 }, { name: "Sabre-tooth skull", emoji: "🐯", ageYears: 11_460 }, { name: "Cave campfire", emoji: "🔥", ageYears: 17_190 }] },
  { title: "Museum mysteries", goal: "Date the mummy, the Viking ship and the ice-age wolf to within 10 %.", finds: [{ name: "Mummy wrapping", emoji: "🧻", ageYears: 4500 }, { name: "Viking ship", emoji: "⛵", ageYears: 1100 }, { name: "Ice-age wolf", emoji: "🐺", ageYears: 30_000 }] },
  { title: "Choose your clock", goal: "Some finds are far too old for carbon-14. Pick the right clock for each.", finds: [{ name: "Dinosaur bone (in volcanic ash)", emoji: "🦖", ageYears: 66e6 }, { name: "Moon rock", emoji: "🌑", ageYears: 4.4e9 }, { name: "Mammoth tooth", emoji: "🦷", ageYears: 20_000 }] },
];

export const remainingIn = (find: Find, clock: number) => calculateRemainingFraction((CLOCKS[clock] ?? CLOCKS[0]).halfLifeYears, find.ageYears);

export type DatingResult = "right" | "wrong-age" | "all-gone" | "barely-changed";

export function dateFind(level: number, index: number, clock: number, halfLives: number): DatingResult {
  const find = (CASES[level] as Case).finds[index] as Find;
  const fraction = remainingIn(find, clock);
  if (fraction < MEASURABLE.minimum) return "all-gone";
  if (fraction > MEASURABLE.maximum) return "barely-changed";
  const guess = halfLives * (CLOCKS[clock] ?? CLOCKS[0]).halfLifeYears;
  return Math.abs(guess / find.ageYears - 1) <= AGE_TOLERANCE ? "right" : "wrong-age";
}

export function formatYears(years: number): string {
  if (years >= 1e9) return `${(years / 1e9).toFixed(2)} billion years`;
  if (years >= 1e6) return `${(years / 1e6).toFixed(1)} million years`;
  return `${Math.round(years).toLocaleString("en-GB")} years`;
}

export interface FossilState { readonly dated: number; readonly tries: number; readonly last: DatingResult | null }

export const fossilDetective: LiveGameDefinition<FossilState> = {
  id: "fossil-detective",
  title: "Fossil Detective",
  worldId: "nuclear",
  eyebrow: "PLAYGROUND · HALF-LIFE",
  modelTag: "N = N₀ (½)^(t / T½)",
  introduction: "The museum needs a detective! Find out how old each mystery object is by reading its radioactive clock.",
  howToPlay: "Pick a clock, read how much of it is left, set how many half-lives have passed, and press Date it (Space or Enter).",
  physics: "Some atoms are radioactive: they decay at random, but in a big crowd of them exactly half decay every half-life. Living things take in carbon-14 from the air; when they die it is no longer replaced, so measuring how much is left tells you when they died. After 1 half-life ½ is left, after 2 a quarter, after 3 an eighth. Carbon-14 (5730 years) is used up after about 50 000 years, so for dinosaurs and rocks we use slow clocks like potassium-40 (1.25 billion years) in volcanic ash.",
  assumptions: "The object started with the same carbon-14 as living things do today, nothing was added or lost since, the potassium-40 clock starts when volcanic rock sets, perfect measurements between 0.1 % and 99.9 % remaining, and an answer within 10 % of the true age.",
  levels: CASES.map((entry, index) => ({ id: `case-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: (level) => [
    ...(level === 2 ? [{ key: "clock", label: "Clock (1 carbon-14, 2 potassium-40)", unit: "", minimum: 1, maximum: 2, step: 1, initial: 1 }] : []),
    { key: "halfLives", label: "Half-lives that have passed", unit: "", minimum: 0, maximum: 6, step: 0.001, initial: 1 },
  ],
  actions: [{ id: "date", label: "Date it!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ dated: 0, tries: 0, last: null }),
  step(state, input, _dt, level) {
    if (!input.pressed.has("date") || state.dated >= (CASES[level] as Case).finds.length) return state;
    const result = dateFind(level, state.dated, Math.round(input.values.clock ?? 1) - 1, input.values.halfLives ?? 1);
    return { dated: state.dated + (result === "right" ? 1 : 0), tries: state.tries + 1, last: result };
  },
  verdict(state, level) {
    const entry = CASES[level] as Case;
    if (state.dated >= entry.finds.length) return { status: "won", message: `Case closed! All ${entry.finds.length} finds dated in ${state.tries} tries.` };
    const find = entry.finds[state.dated] as Find;
    switch (state.last) {
      case "right":
        return { status: "playing", message: `Correct! Next: the ${find.name.toLowerCase()}.` };
      case "wrong-age":
        return { status: "playing", message: "Not quite. Check: how many halvings give the fraction that is left?" };
      case "all-gone":
        return { status: "playing", message: "Almost none of that clock is left: it ran out long ago. Try a slower clock." };
      case "barely-changed":
        return { status: "playing", message: "That clock has hardly ticked: almost all of it is still there. Try a faster clock." };
      default:
        return { status: "playing", message: `Date the ${find.name.toLowerCase()}.` };
    }
  },
  stars: (state, level) => {
    const extra = state.tries - (CASES[level] as Case).finds.length;
    return extra <= 0 ? 3 : extra <= 2 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const entry = CASES[level] as Case;
    const find = entry.finds[Math.min(state.dated, entry.finds.length - 1)] as Find;
    const clock = Math.round(input.values.clock ?? 1) - 1;
    const fraction = remainingIn(find, clock);
    const halfLives = input.values.halfLives ?? 1;
    return [
      { label: "MYSTERY OBJECT", value: find.name },
      { label: `${(CLOCKS[clock] ?? CLOCKS[0]).name.toUpperCase()} LEFT`, value: fraction < MEASURABLE.minimum ? "too little to measure" : fraction > MEASURABLE.maximum ? "almost all (too little change to measure)" : `${(fraction * 100).toFixed(2)} %` },
      { label: "YOUR GUESS", value: `${halfLives.toFixed(3)} half-lives → ${(100 * 0.5 ** halfLives).toFixed(2)} % left, ${formatYears(halfLives * (CLOCKS[clock] ?? CLOCKS[0]).halfLifeYears)}` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const entry = CASES[level] as Case;
    context.fillStyle = "#f4e3c1";
    context.fillRect(0, 0, width, height);
    context.font = "44px sans-serif";
    entry.finds.forEach((find, index) => {
      const x = width * (0.2 + index * 0.3);
      context.globalAlpha = index === state.dated ? 1 : 0.45;
      context.fillText(find.emoji, x - 22, height * 0.4);
      context.globalAlpha = 1;
      badge(context, index < state.dated ? `✓ ${formatYears(find.ageYears)}` : find.name, x - 40, height * 0.4 + 30, index < state.dated ? "#2b8a3e" : "#7c5c2e");
    });
    // A bar of atoms: the fraction left, and the guess.
    const find = entry.finds[Math.min(state.dated, entry.finds.length - 1)] as Find;
    const clock = Math.round(input.values.clock ?? 1) - 1;
    const fraction = remainingIn(find, clock);
    const barY = height * 0.72;
    context.fillStyle = "#dee2e6";
    context.fillRect(30, barY, width - 60, 20);
    context.fillStyle = "#51cf66";
    context.fillRect(30, barY, (width - 60) * fraction, 20);
    const guess = 0.5 ** (input.values.halfLives ?? 1);
    context.fillStyle = PLAYGROUND_COLOURS.ink;
    context.fillRect(30 + (width - 60) * guess - 2, barY - 6, 4, 32);
    badge(context, "left now", 30, barY - 10, "#2b8a3e");
  },
  describe: (state, input, level) => {
    const entry = CASES[level] as Case;
    const find = entry.finds[Math.min(state.dated, entry.finds.length - 1)] as Find;
    const clock = Math.round(input.values.clock ?? 1) - 1;
    return `${find.name}: ${(remainingIn(find, clock) * 100).toFixed(3)} percent of its ${(CLOCKS[clock] ?? CLOCKS[0]).name} is left. Your guess is ${(input.values.halfLives ?? 1).toFixed(3)} half-lives.`;
  },
};
