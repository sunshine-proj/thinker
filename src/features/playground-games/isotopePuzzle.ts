import { classifyLightNucleus, elementSymbol, type NucleusVerdict } from "../../physics/nuclear";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

const POPS_ALLOWED = 4;

interface Order { readonly label: string; readonly protons?: number; readonly massNumber?: number }
interface Puzzle { readonly title: string; readonly goal: string; readonly orders: readonly Order[] }
export const PUZZLES: readonly Puzzle[] = [
  { title: "First nuclei", goal: "Build helium-4 (2 protons, 2 neutrons), then carbon-12.", orders: [{ label: "helium-4", protons: 2, massNumber: 4 }, { label: "carbon-12", protons: 6, massNumber: 12 }] },
  { title: "Find the balance", goal: "Build any stable oxygen (8 protons), then any stable neon (10 protons). How many neutrons do they like?", orders: [{ label: "a stable oxygen", protons: 8 }, { label: "a stable neon", protons: 10 }] },
  { title: "Extra neutrons", goal: "Build a stable nucleus with exactly 13 particles, then the heaviest stable nitrogen.", orders: [{ label: "a stable nucleus with 13 particles", massNumber: 13 }, { label: "nitrogen-15", protons: 7, massNumber: 15 }] },
];

export const matches = (order: Order, protons: number, neutrons: number) => (order.protons === undefined || order.protons === protons) && (order.massNumber === undefined || order.massNumber === protons + neutrons);

export interface IsotopeState { readonly protons: number; readonly neutrons: number; readonly done: number; readonly pops: number; readonly last: NucleusVerdict | null; readonly matched: boolean }

const DECAY_WORDS: Record<NucleusVerdict, string> = {
  stable: "is stable",
  "beta-minus": "has too many neutrons: one turns into a proton (β⁻ decay)",
  "beta-plus": "has too many protons: one turns into a neutron (β⁺ decay)",
  "falls-apart": "falls apart at once: no nucleus with that many particles holds together",
};

export const isotopePuzzle: LiveGameDefinition<IsotopeState> = {
  id: "isotope-puzzle",
  title: "Isotope Puzzle",
  worldId: "nuclear",
  eyebrow: "PLAYGROUND · NUCLEAR STABILITY",
  modelTag: "PROTONS + NEUTRONS · STABLE ISOTOPES",
  introduction: "Build atomic nuclei out of protons and neutrons! Get the mix right and the nucleus holds together; get it wrong and… pop!",
  howToPlay: "Add or remove protons (P / O keys) and neutrons (N / M keys), then press Test (Space or Enter).",
  physics: "A nucleus is made of protons, which repel each other electrically, and neutrons, which have no charge. The strong nuclear force glues them all together, but only at very short range. Neutrons add glue without adding push, so a nucleus needs the right balance: light ones like about as many neutrons as protons. With too many neutrons, a neutron turns into a proton (β⁻ decay); with too many protons, the opposite (β⁺). The number of protons decides which element it is; nuclei of one element with different numbers of neutrons are isotopes.",
  assumptions: "Measured data for every stable nucleus up to magnesium (12 protons), simple decay labels for the unstable ones (some really emit a proton or neutron instead), and very long-lived nuclei counted as unstable unless they are in the stable list.",
  levels: PUZZLES.map((puzzle, index) => ({ id: `puzzle-${index + 1}`, title: puzzle.title, goal: puzzle.goal })),
  sliders: () => [],
  actions: [
    { id: "addP", label: "+ proton", keys: ["p", "P"] },
    { id: "removeP", label: "− proton", keys: ["o", "O"] },
    { id: "addN", label: "+ neutron", keys: ["n", "N"] },
    { id: "removeN", label: "− neutron", keys: ["m", "M"] },
    { id: "test", label: "Test it!", keys: [" ", "Enter"] },
  ],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ protons: 1, neutrons: 0, done: 0, pops: 0, last: null, matched: false }),
  step(state, input, _dt, level) {
    const puzzle = PUZZLES[level] as Puzzle;
    let { protons, neutrons } = state;
    if (input.pressed.has("addP")) protons = Math.min(12, protons + 1);
    if (input.pressed.has("removeP")) protons = Math.max(1, protons - 1);
    if (input.pressed.has("addN")) neutrons = Math.min(14, neutrons + 1);
    if (input.pressed.has("removeN")) neutrons = Math.max(0, neutrons - 1);
    if (!input.pressed.has("test") || state.done >= puzzle.orders.length) return { ...state, protons, neutrons };
    const verdict = classifyLightNucleus(protons, neutrons);
    const matched = verdict === "stable" && matches(puzzle.orders[state.done] as Order, protons, neutrons);
    return { protons, neutrons, done: state.done + (matched ? 1 : 0), pops: state.pops + (verdict === "stable" ? 0 : 1), last: verdict, matched };
  },
  verdict(state, level) {
    const puzzle = PUZZLES[level] as Puzzle;
    if (state.done >= puzzle.orders.length) return { status: "won", message: `Every nucleus built, with ${state.pops} pop${state.pops === 1 ? "" : "s"}!` };
    if (state.pops >= POPS_ALLOWED) return { status: "lost", message: "Too many pops! Look at the stable nuclei you know: light ones have about as many neutrons as protons." };
    const order = puzzle.orders[state.done] as Order;
    const name = `${elementSymbol(state.protons)}-${state.protons + state.neutrons}`;
    if (state.last === null) return { status: "playing", message: `Build ${order.label}.` };
    if (state.last === "stable") return { status: "playing", message: state.matched ? `Yes, ${name} is stable! Next: build ${order.label}.` : `${name} is stable, but it is not ${order.label}.` };
    return { status: "playing", message: `Pop! ${name} ${DECAY_WORDS[state.last]}.` };
  },
  stars: (state) => (state.pops === 0 ? 3 : state.pops <= 1 ? 2 : 1),
  readouts: (state, _input, level) => {
    const puzzle = PUZZLES[level] as Puzzle;
    return [
      { label: "NUCLEUS", value: `${elementSymbol(state.protons)}-${state.protons + state.neutrons}` },
      { label: "PROTONS / NEUTRONS", value: `${state.protons} / ${state.neutrons}` },
      { label: "BUILD", value: puzzle.orders[Math.min(state.done, puzzle.orders.length - 1)]!.label },
      { label: "POPS", value: `${state.pops} of ${POPS_ALLOWED}` },
    ];
  },
  draw(context, state, _input, width, height) {
    context.fillStyle = "#fff9db";
    context.fillRect(0, 0, width, height);
    const total = state.protons + state.neutrons;
    const cx = width / 2;
    const cy = height / 2;
    const ball = Math.min(18, height / 12);
    // Mix protons and neutrons evenly, then pack them in a spiral so the nucleus grows as a round cluster.
    const kinds: boolean[] = [];
    for (let p = 0, n = 0; p + n < total; ) {
      const takeProton = n >= state.neutrons || (p < state.protons && p * state.neutrons <= n * state.protons);
      kinds.push(takeProton);
      if (takeProton) p += 1;
      else n += 1;
    }
    for (let i = 0; i < total; i += 1) {
      const angle = i * 2.4;
      const radius = ball * 0.9 * Math.sqrt(i);
      const proton = kinds[i] as boolean;
      context.fillStyle = proton ? PLAYGROUND_COLOURS.enemy : "#868e96";
      context.beginPath();
      context.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, ball, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = PLAYGROUND_COLOURS.white;
      context.fillText(proton ? "+" : "n", cx + Math.cos(angle) * radius - 4, cy + Math.sin(angle) * radius + 4);
    }
    badge(context, `${elementSymbol(state.protons)}-${total}`, 12, 24, PLAYGROUND_COLOURS.ink);
    if (state.last && state.last !== "stable") badge(context, "POP!", cx - 20, 40, PLAYGROUND_COLOURS.enemy);
    if (state.matched) badge(context, "STABLE ✓", cx - 30, 40, "#2b8a3e");
  },
  describe: (state) => `A nucleus of ${state.protons} protons and ${state.neutrons} neutrons: ${elementSymbol(state.protons)}-${state.protons + state.neutrons}. ${state.pops} pops so far.`,
};
