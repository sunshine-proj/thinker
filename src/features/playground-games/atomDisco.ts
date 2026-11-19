import { HC_EV_NM, calculateBohrEnergy, calculatePhotonEnergyEv, calculateTransitionWavelengthNm } from "../../physics/quantum";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge } from "./scenery";

/** How close a photon's wavelength must be to a line to be absorbed, nm (a game-sized line width). */
export const LINE_WIDTH_NM = 1;
const TOP_LEVEL = 8;
export const IONISE = 0;

interface Party { readonly title: string; readonly goal: string; readonly start: number; readonly targets: readonly number[]; readonly photons: number }
export const PARTIES: readonly Party[] = [
  { title: "Red light", goal: "The electron sits on step 2. Fire the one colour that lifts it to step 3, and the dance floor glows red.", start: 2, targets: [3], photons: 6 },
  { title: "Blue and violet", goal: "From step 2, lift the electron to step 4, then (after it falls back) to step 5.", start: 2, targets: [4, 5], photons: 6 },
  { title: "Ultraviolet ladder", goal: "Starting from the bottom step: lift it to step 2, to step 3, and finally knock it right out of the atom.", start: 1, targets: [2, 3, IONISE], photons: 8 },
];

/** Wavelength (nm) that lifts the electron from `lower` to `upper` in hydrogen. */
export const lineFor = (lower: number, upper: number) => calculateTransitionWavelengthNm(1, upper, lower);
/** Longest wavelength (nm) that frees an electron from level n: photon energy ≥ |Eₙ|. */
export const ionisationEdge = (level: number) => HC_EV_NM / -calculateBohrEnergy(1, level);

/** What a photon does to an electron on `level`: the level it reaches, IONISE, or null if it passes straight through. */
export function absorb(level: number, wavelengthNm: number): number | null {
  if (calculatePhotonEnergyEv(wavelengthNm) >= -calculateBohrEnergy(1, level)) return IONISE;
  for (let upper = level + 1; upper <= TOP_LEVEL; upper += 1) {
    if (Math.abs(lineFor(level, upper) - wavelengthNm) <= LINE_WIDTH_NM) return upper;
  }
  return null;
}

export function colourName(wavelengthNm: number): string {
  if (wavelengthNm < 400) return "ultraviolet";
  if (wavelengthNm < 450) return "violet";
  if (wavelengthNm < 495) return "blue";
  if (wavelengthNm < 570) return "green";
  if (wavelengthNm < 590) return "yellow";
  if (wavelengthNm < 620) return "orange";
  return "red";
}

export interface DiscoState { readonly done: number; readonly fired: number; readonly last: { readonly wavelength: number; readonly result: number | null } | null; readonly glow: number }

export const atomDisco: LiveGameDefinition<DiscoState> = {
  id: "atom-disco",
  title: "Atom Disco",
  worldId: "modern-physics",
  eyebrow: "PLAYGROUND · ENERGY LEVELS",
  modelTag: "E = hf · HYDROGEN LADDER",
  introduction: "Inside a hydrogen atom, the electron can only stand on certain steps of an energy ladder. Fire photons of light at it: only exactly the right colours make it jump, and light up the disco!",
  howToPlay: "Choose the photon's colour (wavelength) with the slider and press Fire (Space or Enter). Shorter wavelengths carry more energy.",
  physics: "Light comes in tiny packets called photons, each with energy E = hc/λ: blue light carries more than red. The electron in a hydrogen atom can only have certain energies, Eₙ = −13.6 eV/n². A photon is swallowed only if its energy exactly matches the gap between two steps; any other colour passes straight through. With enough energy (13.6 eV from the bottom step) the electron escapes the atom completely: ionisation. When the electron falls back, it gives out light of the same colour.",
  assumptions: `The Bohr model of hydrogen (exact energies for hydrogen, ignoring tiny fine-structure shifts), one photon at a time, steps up to n = ${TOP_LEVEL}, an absorption window of ±${LINE_WIDTH_NM} nm (real lines are far narrower), and an electron that falls straight back to its starting step after each jump.`,
  levels: PARTIES.map((party, index) => ({ id: `party-${index + 1}`, title: party.title, goal: party.goal })),
  sliders: () => [{ key: "wavelength", label: "Photon wavelength", unit: "nm", minimum: 80, maximum: 700, step: 0.1, initial: 550 }],
  actions: [{ id: "fire", label: "Fire photon", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ done: 0, fired: 0, last: null, glow: 0 }),
  step(state, input, dt, level) {
    const party = PARTIES[level] as Party;
    if (!input.pressed.has("fire") || state.done >= party.targets.length) return { ...state, glow: Math.max(0, state.glow - dt) };
    const wavelength = input.values.wavelength ?? 550;
    const result = absorb(party.start, wavelength);
    const hit = result === party.targets[state.done];
    return { done: state.done + (hit ? 1 : 0), fired: state.fired + 1, last: { wavelength, result }, glow: result === null ? 0 : 1 };
  },
  verdict(state, level) {
    const party = PARTIES[level] as Party;
    if (state.done >= party.targets.length) return { status: "won", message: `The whole disco is lit, using ${state.fired} photons!` };
    if (state.fired >= party.photons) return { status: "lost", message: "Out of photons. Work out the energy gap, then the colour." };
    const target = party.targets[state.done] as number;
    const want = target === IONISE ? "knock the electron out of the atom" : `lift the electron from step ${party.start} to step ${target}`;
    if (!state.last) return { status: "playing", message: `Next: ${want}.` };
    const { result, wavelength } = state.last;
    if (result === null) return { status: "playing", message: `The ${wavelength.toFixed(1)} nm photon passed straight through: wrong energy. Next: ${want}.` };
    if (result === IONISE && target !== IONISE) return { status: "playing", message: `Too much energy: that photon knocked the electron right out! Next: ${want}.` };
    return { status: "playing", message: result === target ? `Yes! Next: ${want}.` : `That lifted it to step ${result}, not the one we want. Next: ${want}.` };
  },
  stars: (state, level) => {
    const extra = state.fired - (PARTIES[level] as Party).targets.length;
    return extra <= 0 ? 3 : extra <= 2 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const party = PARTIES[level] as Party;
    const wavelength = input.values.wavelength ?? 550;
    return [
      { label: "PHOTON ENERGY E = hc/λ", value: `${calculatePhotonEnergyEv(wavelength).toFixed(2)} eV (${colourName(wavelength)})` },
      { label: `ELECTRON ON STEP ${party.start}`, value: `${calculateBohrEnergy(1, party.start).toFixed(2)} eV` },
      { label: "STEP ENERGIES", value: [1, 2, 3, 4, 5].map((n) => `${n}: ${calculateBohrEnergy(1, n).toFixed(2)}`).join(" · ") + " eV" },
      { label: "PHOTONS LEFT", value: String(party.photons - state.fired) },
    ];
  },
  draw(context, state, input, width, height, level) {
    const party = PARTIES[level] as Party;
    context.fillStyle = "#190b28";
    context.fillRect(0, 0, width, height);
    // Dance floor tiles light up with the colours already won.
    const tile = width / 8;
    for (let i = 0; i < 8; i += 1) {
      const target = party.targets[i % party.targets.length] as number;
      const lit = i % party.targets.length < state.done;
      const wavelength = target === IONISE ? 0 : lineFor(party.start, target);
      context.fillStyle = lit ? (target === IONISE ? "#e599f7" : wavelengthColour(wavelength)) : "#2b1d3f";
      context.fillRect(i * tile + 2, height - 40, tile - 4, 36);
    }
    // Energy ladder.
    const ladderX = width * 0.55;
    const top = 30;
    const bottom = height - 70;
    const yOf = (energy: number) => top + (energy / -13.6) * (bottom - top);
    context.strokeStyle = "rgb(255 255 255 / 60%)";
    context.lineWidth = 2;
    for (let n = 1; n <= 6; n += 1) {
      const y = yOf(calculateBohrEnergy(1, n));
      context.beginPath();
      context.moveTo(ladderX, y);
      context.lineTo(ladderX + 120, y);
      context.stroke();
      context.fillStyle = PLAYGROUND_COLOURS.white;
      context.fillText(`n = ${n}`, ladderX + 126, y + 4);
    }
    context.strokeStyle = "#ffd43b";
    context.setLineDash([4, 4]);
    context.beginPath();
    context.moveTo(ladderX, top);
    context.lineTo(ladderX + 120, top);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = PLAYGROUND_COLOURS.white;
    context.fillText("free (0 eV)", ladderX + 126, top + 4);
    const reached = state.glow > 0 && state.last?.result ? state.last.result : party.start;
    const electronY = reached === IONISE ? top - 10 : yOf(calculateBohrEnergy(1, reached));
    context.fillStyle = "#74c0fc";
    context.beginPath();
    context.arc(ladderX + 60, electronY, 8, 0, 2 * Math.PI);
    context.fill();
    // The photon about to be fired.
    const wavelength = input.values.wavelength ?? 550;
    context.strokeStyle = wavelengthColour(wavelength);
    context.lineWidth = 3;
    context.beginPath();
    for (let x = 0; x <= ladderX - 20; x += 2) {
      const y = height * 0.45 + Math.sin((x / Math.max(6, wavelength / 20)) * 2 * Math.PI) * 8;
      if (x === 0) context.moveTo(x + 10, y);
      else context.lineTo(x + 10, y);
    }
    context.stroke();
    badge(context, `${wavelength.toFixed(1)} nm · ${colourName(wavelength)}`, 12, 24, "#5f3dc4");
  },
  describe: (state, input, level) => {
    const party = PARTIES[level] as Party;
    return `Electron on step ${party.start}. Photon set to ${(input.values.wavelength ?? 550).toFixed(1)} nanometres, ${calculatePhotonEnergyEv(input.values.wavelength ?? 550).toFixed(2)} electronvolts. ${state.done} of ${party.targets.length} jumps done, ${party.photons - state.fired} photons left.`;
  },
};

function wavelengthColour(wavelengthNm: number): string {
  const name = colourName(wavelengthNm);
  return { ultraviolet: "#cc5de8", violet: "#7048e8", blue: "#1c7ed6", green: "#37b24d", yellow: "#fcc419", orange: "#fd7e14", red: "#e03131" }[name] ?? "#ffffff";
}
