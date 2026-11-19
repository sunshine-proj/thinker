import { solveHangingSeparation } from "../../physics/electromagnetism";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

/** Charge moved by one good rub, in coulombs (a rubbed balloon carries tens to hundreds of nC). */
export const CHARGE_PER_RUB = 20e-9;
const BALLOON_KG = 0.003;
const STRING = 0.5;

interface Party {
  readonly title: string;
  readonly goal: string;
  /** Target gap between the balloon centres, in metres; [0, 0] means "touching". */
  readonly gap: readonly [number, number];
  readonly startA: number;
  readonly startB: number;
  readonly rubLimit: number;
}

export const PARTIES: readonly Party[] = [
  { title: "Push apart", goal: "Rub both balloons on your hair so they push each other 10–14 cm apart.", gap: [0.1, 0.14], startA: 0, startB: 0, rubLimit: 20 },
  { title: "Opposites attract", goal: "Make the balloons pull together until they touch. Hair and a plastic bag charge a balloon differently.", gap: [0, 0], startA: 0, startB: 0, rubLimit: 10 },
  { title: "Party trick", goal: "Balloon B already has 2 rubs. Rub what you need for a gap of 15–17 cm, in at most 12 rubs.", gap: [0.15, 0.17], startA: 0, startB: -2, rubLimit: 12 },
];

export interface BalloonState {
  /** Charges in units of one rub (negative: rubbed on hair). */
  readonly a: number;
  readonly b: number;
  readonly rubs: number;
  readonly grounds: number;
  readonly shown: number;
  readonly settledFor: number;
}

export function balloonGap(a: number, b: number): number {
  return solveHangingSeparation(a * CHARGE_PER_RUB, b * CHARGE_PER_RUB, BALLOON_KG, STRING);
}

const SETTLE_SECONDS = 1;

export const balloonStaticParty: LiveGameDefinition<BalloonState> = {
  id: "balloon-static-party",
  title: "Balloon Static Party",
  worldId: "electromagnetism",
  eyebrow: "PLAYGROUND · STATIC ELECTRICITY",
  modelTag: "COULOMB'S LAW · F = k q₁ q₂ / r²",
  introduction: "Two party balloons hang from one hook. Rub them to charge them, and watch them push apart or pull together, without touching them!",
  howToPlay: "Rub a balloon on your hair (H for A, J for B) or on a plastic bag (B), or touch both to the ground to remove their charge (G). The game checks the gap once the balloons settle.",
  physics: "Rubbing moves tiny electrons. A balloon rubbed on hair takes electrons and becomes negative; one rubbed on a plastic bag gives electrons away and becomes positive. Like charges push apart and opposite charges pull together. The force gets stronger with more charge and weaker with distance (Coulomb's law), so the balloons swing out until the push balances gravity and the pull of the strings.",
  assumptions: "Point charges at the balloon centres, 3 g balloons on 50 cm strings from one hook, each rub moving 20 nC, no charge leaking away, no air currents, and balloons small compared with their gap. Balloons touching do not share charge (rubber is an insulator).",
  levels: PARTIES.map((party, index) => ({ id: `party-${index + 1}`, title: party.title, goal: party.goal })),
  sliders: () => [],
  actions: [
    { id: "hairA", label: "Rub A on hair", keys: ["h", "H"] },
    { id: "hairB", label: "Rub B on hair", keys: ["j", "J"] },
    { id: "bagB", label: "Rub B on a plastic bag", keys: ["b", "B"] },
    { id: "ground", label: "Touch to the ground", keys: ["g", "G"] },
  ],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: (level) => {
    const party = PARTIES[level] as Party;
    return { a: party.startA, b: party.startB, rubs: 0, grounds: 0, shown: balloonGap(party.startA, party.startB), settledFor: 0 };
  },
  step(state, input, dt, level) {
    const party = PARTIES[level] as Party;
    let { a, b, rubs, grounds } = state;
    if (input.pressed.has("hairA")) { a -= 1; rubs += 1; }
    if (input.pressed.has("hairB")) { b -= 1; rubs += 1; }
    if (input.pressed.has("bagB")) { b += 1; rubs += 1; }
    if (input.pressed.has("ground")) { a = party.startA; b = party.startB; grounds += 1; }
    const target = balloonGap(a, b);
    const changed = a !== state.a || b !== state.b;
    const shown = state.shown + (target - state.shown) * Math.min(1, dt * 4);
    return { a, b, rubs, grounds, shown, settledFor: changed ? 0 : state.settledFor + dt };
  },
  verdict(state, level) {
    const party = PARTIES[level] as Party;
    if (state.rubs > party.rubLimit) return { status: "lost", message: `Your arm is tired: that was more than ${party.rubLimit} rubs.` };
    const gap = balloonGap(state.a, state.b);
    const settled = state.settledFor >= SETTLE_SECONDS && (state.rubs > 0 || state.grounds > 0);
    if (!settled) return { status: "playing", message: "Rub a balloon, then let them settle." };
    if (party.gap[1] === 0) {
      return state.a * state.b < 0
        ? { status: "won", message: "Snap! A negative and a positive balloon pull together and touch." }
        : { status: "playing", message: state.a * state.b > 0 ? "Both balloons have the same kind of charge, so they push apart." : "One balloon has no charge yet." };
    }
    if (gap >= party.gap[0] && gap <= party.gap[1]) return { status: "won", message: `The balloons hang ${(gap * 100).toFixed(1)} cm apart. Party perfect!` };
    return { status: "playing", message: gap < party.gap[0] ? `Gap ${(gap * 100).toFixed(1)} cm: they need a stronger push.` : `Gap ${(gap * 100).toFixed(1)} cm: too far. Ground them and try again.` };
  },
  stars: (state, level) => {
    const party = PARTIES[level] as Party;
    const spare = party.rubLimit - state.rubs;
    return state.grounds === 0 && spare >= party.rubLimit / 3 ? 3 : state.grounds <= 1 ? 2 : 1;
  },
  readouts: (state) => [
    { label: "BALLOON A", value: `${(state.a * CHARGE_PER_RUB * 1e9).toFixed(0)} nC` },
    { label: "BALLOON B", value: `${(state.b * CHARGE_PER_RUB * 1e9).toFixed(0)} nC` },
    { label: "GAP", value: `${(balloonGap(state.a, state.b) * 100).toFixed(1)} cm` },
    { label: "RUBS", value: String(state.rubs) },
  ],
  draw(context, state, _input, width, height) {
    const wall = context.createLinearGradient(0, 0, 0, height);
    wall.addColorStop(0, "#fff0f6");
    wall.addColorStop(1, "#e7f5ff");
    context.fillStyle = wall;
    context.fillRect(0, 0, width, height);
    for (let i = 0; i < 12; i += 1) {
      context.fillStyle = ["#ff8787", "#ffd43b", "#69db7c", "#74c0fc"][i % 4] as string;
      context.beginPath();
      context.moveTo((i * width) / 12, 0);
      context.lineTo(((i + 0.5) * width) / 12, 24);
      context.lineTo(((i + 1) * width) / 12, 0);
      context.fill();
    }
    const hook = { x: width / 2, y: 40 };
    const scale = (height - 120) / STRING;
    const half = Math.min(state.shown / 2, STRING);
    const angle = Math.asin(Math.min(1, half / STRING));
    const balloons = [
      { side: -1, charge: state.a, colour: "#e64980", label: "A" },
      { side: 1, charge: state.b, colour: "#4c6ef5", label: "B" },
    ];
    for (const balloon of balloons) {
      const x = hook.x + balloon.side * Math.sin(angle) * STRING * scale;
      const y = hook.y + Math.cos(angle) * STRING * scale;
      context.strokeStyle = PLAYGROUND_COLOURS.ink;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(hook.x, hook.y);
      context.lineTo(x, y);
      context.stroke();
      context.fillStyle = balloon.colour;
      context.beginPath();
      context.ellipse(x, y + 26, 22, 28, 0, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = PLAYGROUND_COLOURS.white;
      context.font = "bold 14px sans-serif";
      const sign = balloon.charge < 0 ? "−" : balloon.charge > 0 ? "+" : "";
      context.fillText(`${balloon.label} ${sign.repeat(Math.min(5, Math.abs(balloon.charge)))}`, x - 18, y + 31);
    }
    badge(context, `gap ${(state.shown * 100).toFixed(1)} cm`, 12, height - 20);
  },
  describe: (state) => `Balloon A has ${state.a * 20} nanocoulombs, balloon B has ${state.b * 20} nanocoulombs. They hang ${(balloonGap(state.a, state.b) * 100).toFixed(1)} centimetres apart after ${state.rubs} rubs.`,
};
