import { FRESH_WATER_DENSITY } from "../../physics/core";
import { calculateDraft, calculateHeelAngle, calculateMetacentricHeight } from "../../physics/fluids";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { label, line } from "./drawing";

const LENGTH = 20;
const BEAM = 6;
const DEPTH = 2.5;
const EMPTY_MASS = 40_000;
const EMPTY_KG = 1;
const DECK_LOAD_HEIGHT = DEPTH + 0.5;
const MIN_FREEBOARD = 0.3;
const MAX_HEEL = 5;
const CAPSIZE_HEEL = 15;

interface Crate { readonly massKg: number; readonly offset: number }
interface ShipLevel { readonly title: string; readonly goal: string; readonly targetTonnes: number }
const LEVELS: readonly ShipLevel[] = [
  { title: "First cargo", goal: "Load 30 t of crates onto the barge, keeping it within 5° of upright.", targetTonnes: 30 },
  { title: "A full deck", goal: "Load 80 t. Spread the crates so the barge stays level.", targetTonnes: 80 },
  { title: "Heavy and high", goal: "Load 120 t. Crates on deck raise the centre of gravity, so stability shrinks as you load.", targetTonnes: 120 },
];

interface ShipState {
  readonly crates: readonly Crate[];
  /** Displayed heel, easing toward the static equilibrium (drawing only). */
  readonly shownHeel: number;
}

export function bargeCondition(crates: readonly Crate[]) {
  const cargo = crates.reduce((sum, crate) => sum + crate.massKg, 0);
  const mass = EMPTY_MASS + cargo;
  const draft = calculateDraft(mass, LENGTH, BEAM, FRESH_WATER_DENSITY);
  const kg = (EMPTY_MASS * EMPTY_KG + cargo * DECK_LOAD_HEIGHT) / mass;
  const gm = calculateMetacentricHeight(draft, BEAM, kg);
  const moment = crates.reduce((sum, crate) => sum + crate.massKg * crate.offset, 0);
  const heel = moment === 0 ? 0 : Math.sign(moment) * calculateHeelAngle(Math.abs(moment), 1, mass, gm);
  return { cargo, mass, draft, freeboard: DEPTH - draft, gm, heel };
}

export const shipLive: LiveGameDefinition<ShipState> = {
  id: "ship-designer-live",
  title: "Ship Designer Live",
  worldId: "fluids",
  relatedGameId: "ship-designer",
  eyebrow: "FLUID MECHANICS · BUOYANCY AND STABILITY",
  modelTag: "ARCHIMEDES · METACENTRIC HEIGHT",
  introduction: "Load crates onto a river barge one at a time. Watch it settle deeper and heel over, and keep it upright and afloat until the cargo target is reached.",
  howToPlay: "Choose a crate's mass and where to place it across the deck (drag left or right on the picture, or use the sliders), then press Load (Space or L). Press Start first.",
  physics: "Every crate pushes the barge deeper until it displaces water weighing as much as barge and cargo together (Archimedes). A crate off the centreline tips the barge until the buoyancy, which shifts toward the low side, balances it: tanφ = m d / (Δ·GM). The metacentric height GM measures stability, and loading heavy crates high on deck raises the centre of gravity and shrinks GM, so the same off-centre crate tips a heavily loaded barge much more.",
  assumptions: "A box-shaped barge 20 m × 6 m × 2.5 m in fresh water, 40 t empty with its centre of gravity 1 m above the keel, crates with their centres 0.5 m above the deck, and the small-angle heel formula. Waves, wind and water on deck are ignored.",
  levels: LEVELS.map((entry, index) => ({ id: `cargo-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [
    { key: "mass", label: "Crate mass", unit: "t", minimum: 1, maximum: 15, step: 0.5, initial: 5 },
    { key: "offset", label: "Position across the deck", unit: "m", minimum: -2.5, maximum: 2.5, step: 0.1, initial: 0 },
  ],
  actions: [
    { id: "load", label: "Load crate", keys: [" ", "l", "L"] },
    { id: "unload", label: "Remove last crate", keys: ["u", "U"] },
  ],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  onDrag: (x) => ({ offset: Math.round((x * 5 - 2.5) * 10) / 10 }),
  create: () => ({ crates: [], shownHeel: 0 }),
  step(state, input, dt) {
    let crates = state.crates;
    if (input.pressed.has("load")) {
      crates = [...crates, { massKg: (input.values.mass ?? 5) * 1000, offset: input.values.offset ?? 0 }];
    }
    if (input.pressed.has("unload")) {
      crates = crates.slice(0, -1);
    }
    const heel = bargeCondition(crates).heel;
    // The picture eases toward the static heel; the physics uses the equilibrium value.
    const shownHeel = state.shownHeel + (heel - state.shownHeel) * Math.min(1, dt * 3);
    return { crates, shownHeel };
  },
  verdict(state, level) {
    const condition = bargeCondition(state.crates);
    const target = (LEVELS[level] as ShipLevel).targetTonnes;
    if (condition.freeboard < 0) {
      return { status: "lost", message: "Water poured over the deck: the barge was too heavily loaded." };
    }
    if (condition.gm <= 0 || Math.abs(condition.heel) > CAPSIZE_HEEL) {
      return { status: "lost", message: `The barge heeled past ${CAPSIZE_HEEL}° and capsized. Spread the load evenly.` };
    }
    if (condition.cargo >= target * 1000 && Math.abs(condition.heel) <= MAX_HEEL && condition.freeboard >= MIN_FREEBOARD) {
      return { status: "won", message: `${(condition.cargo / 1000).toFixed(1)} t loaded, heel ${Math.abs(condition.heel).toFixed(1)}°, ${condition.freeboard.toFixed(2)} m of freeboard.` };
    }
    return { status: "playing", message: `${(condition.cargo / 1000).toFixed(1)} of ${target} t loaded · heel ${condition.heel.toFixed(1)}°${Math.abs(condition.heel) > MAX_HEEL ? " (too much!)" : ""}.` };
  },
  stars: (state) => {
    const heel = Math.abs(bargeCondition(state.crates).heel);
    return heel <= 1 ? 3 : heel <= 3 ? 2 : 1;
  },
  readouts: (state) => {
    const condition = bargeCondition(state.crates);
    return [
      { label: "CARGO", value: `${(condition.cargo / 1000).toFixed(1)} t` },
      { label: "DRAFT", value: `${condition.draft.toFixed(2)} m` },
      { label: "FREEBOARD", value: `${condition.freeboard.toFixed(2)} m` },
      { label: "METACENTRIC HEIGHT GM", value: `${condition.gm.toFixed(2)} m` },
      { label: "HEEL", value: `${condition.heel.toFixed(1)}°` },
    ];
  },
  draw(context, state, input, width, height) {
    const condition = bargeCondition(state.crates);
    const scale = Math.min(width / 9, height / 6);
    const waterY = height * 0.55;
    context.fillStyle = "rgb(110 170 230 / 40%)";
    context.fillRect(0, waterY, width, height - waterY);
    context.save();
    context.translate(width / 2, waterY + (condition.draft - DEPTH / 2) * scale);
    context.rotate((state.shownHeel * Math.PI) / 180);
    context.fillStyle = "#7a5a3a";
    context.fillRect((-BEAM / 2) * scale, (-DEPTH / 2) * scale, BEAM * scale, DEPTH * scale);
    for (const [index, crate] of state.crates.entries()) {
      const size = Math.cbrt(crate.massKg / 1000) * 0.45 * scale;
      context.fillStyle = index % 2 === 0 ? "#e88a2e" : "#d0702a";
      context.fillRect(crate.offset * scale - size / 2, (-DEPTH / 2) * scale - size * (1 + (index % 3) * 0.05), size, size);
    }
    const marker = (input.values.offset ?? 0) * scale;
    line(context, [{ x: marker, y: (-DEPTH / 2) * scale - 50 }, { x: marker, y: (-DEPTH / 2) * scale - 10 }], "#5365d5", 2, true);
    context.restore();
    label(context, `heel ${condition.heel.toFixed(1)}°`, 16, 22);
    label(context, `freeboard ${condition.freeboard.toFixed(2)} m`, 16, 38);
  },
  describe: (state) => {
    const condition = bargeCondition(state.crates);
    return `${state.crates.length} crates, ${(condition.cargo / 1000).toFixed(1)} tonnes. The barge floats ${condition.draft.toFixed(2)} metres deep and heels ${condition.heel.toFixed(1)} degrees.`;
  },
};
