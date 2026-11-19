import { SEAWATER_DENSITY } from "../../physics/core";
import { calculateDraft, calculateHeelAngle, calculateMetacentricHeight } from "../../physics/fluids";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, cloud, sea, sky, sun } from "./scenery";

const LENGTH = 24;
const BEAM = 5.5;
const DEPTH = 3;
const EMPTY_TONNES = 60;
const EMPTY_KG = 1.2;
const DECK_HEIGHT = DEPTH + 0.5;
const CAPSIZE = 15;
const MIN_FREEBOARD = 0.3;

interface Item { readonly name: string; readonly tonnes: number; readonly colour: string }
const GOLD: Item = { name: "Gold chest", tonnes: 6, colour: "#f2b705" };
const CANNON: Item = { name: "Cannon", tonnes: 4, colour: "#495057" };
const BARREL: Item = { name: "Rum barrel", tonnes: 2, colour: "#a0522d" };
const BIG_GOLD: Item = { name: "Royal treasure", tonnes: 12, colour: "#ffd43b" };

interface Voyage { readonly title: string; readonly goal: string; readonly cargo: readonly Item[]; readonly maxHeel: number; readonly storm: boolean }
export const VOYAGES: readonly Voyage[] = [
  { title: "Calm harbour", goal: "Load all the cargo and keep the ship within 5° of upright.", cargo: [GOLD, GOLD, BARREL, BARREL], maxHeel: 5, storm: false },
  { title: "Cannon day", goal: "Load cannons, gold and barrels one at a time. The ship must never tip past 15°, and end within 4°.", cargo: [CANNON, GOLD, CANNON, BARREL, BARREL, GOLD], maxHeel: 4, storm: false },
  { title: "Storm coming!", goal: "A storm is coming: the royal treasure is heavy and the ship must end within 2° of upright.", cargo: [BIG_GOLD, GOLD, GOLD, CANNON, CANNON, BARREL], maxHeel: 2, storm: true },
];

export interface Placed { readonly item: Item; readonly offset: number }
export interface PirateState {
  readonly placed: readonly Placed[];
  readonly shownHeel: number;
  readonly time: number;
}

export function shipCondition(placed: readonly Placed[]) {
  const cargo = placed.reduce((sum, entry) => sum + entry.item.tonnes * 1000, 0);
  const mass = EMPTY_TONNES * 1000 + cargo;
  const draft = calculateDraft(mass, LENGTH, BEAM, SEAWATER_DENSITY);
  const kg = (EMPTY_TONNES * 1000 * EMPTY_KG + cargo * DECK_HEIGHT) / mass;
  const gm = calculateMetacentricHeight(draft, BEAM, kg);
  const moment = placed.reduce((sum, entry) => sum + entry.item.tonnes * 1000 * entry.offset, 0);
  const heel = moment === 0 ? 0 : Math.sign(moment) * calculateHeelAngle(Math.abs(moment), 1, mass, gm);
  return { cargoTonnes: cargo / 1000, draft, freeboard: DEPTH - draft, gm, heel };
}

export const pirateCargoShip: LiveGameDefinition<PirateState> = {
  id: "pirate-cargo-ship",
  title: "Pirate Cargo Ship",
  worldId: "fluids",
  eyebrow: "PLAYGROUND · BUOYANCY AND STABILITY",
  modelTag: "ARCHIMEDES · METACENTRIC HEIGHT",
  introduction: "Ahoy! Load the pirate ship with treasure, cannons and barrels, one at a time, and keep it floating upright all the way to Treasure Island.",
  howToPlay: "Choose where the next item goes on the deck by dragging left or right, or with the slider, then press Load (Space or L). Unload (U) takes the last item off again.",
  physics: "The ship floats because it pushes aside its own weight of water (Archimedes). Every item makes it sit deeper. An item off the middle tips the ship toward that side until the water pushing up on the lower side balances it. Heavy items need a heavy partner on the other side, or a place in the middle.",
  assumptions: "A box-shaped hull 24 m × 5.5 m × 3 m in sea water (1025 kg/m³), 60 t empty with its centre of gravity 1.2 m up, items 0.5 m above the deck, and the small-angle heel formula tanφ = m d / (Δ·GM). Waves are drawn but not simulated.",
  levels: VOYAGES.map((voyage, index) => ({ id: `voyage-${index + 1}`, title: voyage.title, goal: voyage.goal })),
  sliders: () => [{ key: "offset", label: "Position across the deck (left − / right +)", unit: "m", minimum: -3, maximum: 3, step: 0.1, initial: 0 }],
  actions: [
    { id: "load", label: "Load next item", keys: [" ", "l", "L"] },
    { id: "unload", label: "Unload last item", keys: ["u", "U"] },
  ],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  onDrag: (x) => ({ offset: Math.round((x * 6 - 3) * 10) / 10 }),
  create: () => ({ placed: [], shownHeel: 0, time: 0 }),
  step(state, input, dt, level) {
    const voyage = VOYAGES[level] as Voyage;
    let placed = state.placed;
    if (input.pressed.has("load") && placed.length < voyage.cargo.length) {
      placed = [...placed, { item: voyage.cargo[placed.length] as Item, offset: input.values.offset ?? 0 }];
    }
    if (input.pressed.has("unload")) {
      placed = placed.slice(0, -1);
    }
    const target = shipCondition(placed).heel;
    return { placed, shownHeel: state.shownHeel + (target - state.shownHeel) * Math.min(1, dt * 3), time: state.time + dt };
  },
  verdict(state, level) {
    const voyage = VOYAGES[level] as Voyage;
    const condition = shipCondition(state.placed);
    if (condition.freeboard < 0) {
      return { status: "lost", message: "Glug glug! Water poured over the deck." };
    }
    if (condition.gm <= 0 || Math.abs(condition.heel) > CAPSIZE) {
      return { status: "lost", message: `The ship rolled past ${CAPSIZE}° and capsized! Balance the load as you go.` };
    }
    const next = voyage.cargo[state.placed.length];
    if (!next) {
      return Math.abs(condition.heel) <= voyage.maxHeel && condition.freeboard >= MIN_FREEBOARD
        ? { status: "won", message: `All aboard and upright (${Math.abs(condition.heel).toFixed(1)}°)! Set sail for Treasure Island!` }
        : { status: "playing", message: `Everything is aboard, but the ship leans ${Math.abs(condition.heel).toFixed(1)}°. Unload and rebalance to within ${voyage.maxHeel}°.` };
    }
    return { status: "playing", message: `Next: ${next.name} (${next.tonnes} t). The ship leans ${condition.heel.toFixed(1)}°.` };
  },
  stars: (state) => {
    const heel = Math.abs(shipCondition(state.placed).heel);
    return heel <= 0.5 ? 3 : heel <= 1.5 ? 2 : 1;
  },
  readouts: (state, _input, level) => {
    const voyage = VOYAGES[level] as Voyage;
    const condition = shipCondition(state.placed);
    const next = voyage.cargo[state.placed.length];
    return [
      { label: "NEXT ITEM", value: next ? `${next.name}, ${next.tonnes} t` : "all loaded" },
      { label: "CARGO", value: `${condition.cargoTonnes} t` },
      { label: "LEAN (HEEL)", value: `${condition.heel.toFixed(1)}° ${condition.heel > 0.05 ? "to the right" : condition.heel < -0.05 ? "to the left" : ""}` },
      { label: "HEIGHT ABOVE WATER", value: `${condition.freeboard.toFixed(2)} m` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const voyage = VOYAGES[level] as Voyage;
    const condition = shipCondition(state.placed);
    sky(context, width, height, false);
    if (voyage.storm) {
      context.fillStyle = "rgb(60 70 90 / 45%)";
      context.fillRect(0, 0, width, height);
    } else {
      sun(context, width - 50, 45);
    }
    cloud(context, width * 0.15, 45);
    const scale = Math.min(width / 12, height / 7);
    const waterY = height * 0.62;
    context.save();
    context.translate(width / 2, waterY + (condition.draft - DEPTH / 2) * scale);
    context.rotate((state.shownHeel * Math.PI) / 180 + (voyage.storm ? Math.sin(state.time * 2) * 0.02 : 0));
    // Hull.
    context.fillStyle = "#8b4f2c";
    context.beginPath();
    context.moveTo((-BEAM / 2 - 0.6) * scale, (-DEPTH / 2) * scale);
    context.lineTo((BEAM / 2 + 0.6) * scale, (-DEPTH / 2) * scale);
    context.lineTo((BEAM / 2) * scale, (DEPTH / 2) * scale);
    context.lineTo((-BEAM / 2) * scale, (DEPTH / 2) * scale);
    context.closePath();
    context.fill();
    // Mast, sail and flag.
    context.fillStyle = "#5b3a2a";
    context.fillRect(-4, (-DEPTH / 2 - 5.5) * scale, 8, 5.5 * scale);
    context.fillStyle = "#f8f9fa";
    context.fillRect(6, (-DEPTH / 2 - 5) * scale, 2.6 * scale, 3 * scale);
    context.fillStyle = PLAYGROUND_COLOURS.ink;
    context.fillRect(-4, (-DEPTH / 2 - 6.1) * scale, 1.4 * scale, 0.7 * scale);
    // Cargo on deck.
    state.placed.forEach((entry, index) => {
      const size = Math.cbrt(entry.item.tonnes) * 0.45 * scale;
      context.fillStyle = entry.item.colour;
      context.fillRect(entry.offset * scale - size / 2, (-DEPTH / 2) * scale - size * (1 + (index % 2) * 0.1), size, size);
    });
    const marker = (input.values.offset ?? 0) * scale;
    context.strokeStyle = PLAYGROUND_COLOURS.player;
    context.setLineDash([5, 4]);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(marker, (-DEPTH / 2) * scale - 60);
    context.lineTo(marker, (-DEPTH / 2) * scale - 8);
    context.stroke();
    context.setLineDash([]);
    context.restore();
    sea(context, waterY, width, height, state.time * (voyage.storm ? 3 : 1));
    badge(context, `lean ${condition.heel.toFixed(1)}°`, 12, 24);
  },
  describe: (state, input) => {
    const condition = shipCondition(state.placed);
    return `${state.placed.length} items aboard, ${condition.cargoTonnes} tonnes. The ship leans ${condition.heel.toFixed(1)} degrees and has ${condition.freeboard.toFixed(2)} metres of hull above the water. The next item will go ${(input.values.offset ?? 0).toFixed(1)} metres from the middle.`;
  },
};
