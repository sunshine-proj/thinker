import { PLANCK_CONSTANT, SPEED_OF_LIGHT, ELEMENTARY_CHARGE } from "../../physics/core";
import { calculateBohrEnergy, calculateTransitionWavelengthNm, findAbsorption } from "../../physics/quantum";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { circle, label, line } from "./drawing";

/** Shown lifetime of an excited state; real lifetimes are nanoseconds. */
const SHOWN_LIFETIME = 1.5;
const MAX_PHOTONS = 15;

interface AtomLevel { readonly title: string; readonly goal: string; readonly done: (state: AtomState) => boolean }
const LEVELS: readonly AtomLevel[] = [
  { title: "Excite to n = 2", goal: "Fire a photon that lifts the electron from n = 1 to n = 2.", done: (state) => state.highest >= 2 },
  { title: "Reach n = 4", goal: "Get the electron up to level 4, in one jump or several.", done: (state) => state.highest >= 4 },
  { title: "Make the red line", goal: "Make the atom emit the red 656 nm line of hydrogen (the jump from 3 to 2).", done: (state) => state.emitted.some((lambda) => Math.abs(lambda - 656.1) < 1) },
];

interface AtomState {
  readonly level: number | "ionised";
  readonly highest: number;
  readonly sinceExcited: number;
  readonly photons: number;
  readonly lastPhoton: { readonly wavelength: number; readonly absorbed: boolean } | null;
  readonly emitted: readonly number[];
}

const photonEv = (wavelengthNm: number) => (PLANCK_CONSTANT * SPEED_OF_LIGHT) / (wavelengthNm * 1e-9) / ELEMENTARY_CHARGE;

export const atomLive: LiveGameDefinition<AtomState> = {
  id: "atom-builder-live",
  title: "Atom Builder Live",
  worldId: "modern-physics",
  relatedGameId: "atom-builder",
  eyebrow: "MODERN PHYSICS · ATOMIC STRUCTURE",
  modelTag: "BOHR MODEL OF HYDROGEN",
  introduction: "Tune a laser and fire single photons at a hydrogen atom. Only photons with exactly the right energy are absorbed; watch the electron jump and the light it gives out as it falls back.",
  howToPlay: "Set the photon wavelength with the slider (arrow keys for fine steps), then press Fire (Space or F). Start begins the experiment.",
  physics: "In the Bohr model the electron can only have energies Eₙ = −13.6 eV/n². A photon is absorbed only if its energy hc/λ equals the gap between two levels, so the atom ignores most colours. An excited electron soon falls back, emitting a photon whose wavelength is set by the jump: falling from 3 to 2 gives hydrogen's red 656 nm line. A photon with more than the 13.6 eV ionisation energy frees the electron completely.",
  assumptions: "The Bohr model of hydrogen, absorption within 0.5 % of a line (real lines are narrower), excited states shown lasting 1.5 s (really nanoseconds), and each fall going down one level at a time.",
  levels: LEVELS.map((entry, index) => ({ id: `atom-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [{ key: "wavelength", label: "Photon wavelength", unit: "nm", minimum: 80, maximum: 700, step: 0.1, initial: 400 }],
  actions: [{ id: "fire", label: "Fire photon", keys: [" ", "f", "F"] }],
  timing: { fixedTimeStepSeconds: 1 / 60, timeScale: 1 },
  create: () => ({ level: 1, highest: 1, sinceExcited: 0, photons: 0, lastPhoton: null, emitted: [] }),
  step(state, input, dt) {
    let next = state;
    if (input.pressed.has("fire") && next.photons < MAX_PHOTONS && next.level !== "ionised") {
      const wavelength = input.values.wavelength ?? 400;
      const result = findAbsorption(1, next.level, photonEv(wavelength));
      next = {
        ...next,
        photons: next.photons + 1,
        lastPhoton: { wavelength, absorbed: result !== null },
        level: result ?? next.level,
        highest: typeof result === "number" ? Math.max(next.highest, result) : next.highest,
        sinceExcited: result !== null ? 0 : next.sinceExcited,
      };
    }
    if (typeof next.level === "number" && next.level > 1) {
      const since = next.sinceExcited + dt;
      if (since >= SHOWN_LIFETIME) {
        const emitted = calculateTransitionWavelengthNm(1, next.level, next.level - 1);
        return { ...next, level: next.level - 1, sinceExcited: 0, emitted: [...next.emitted, emitted] };
      }
      return { ...next, sinceExcited: since };
    }
    return next;
  },
  verdict(state, level) {
    if ((LEVELS[level] as AtomLevel).done(state)) {
      return { status: "won", message: `Done with ${state.photons} photon${state.photons === 1 ? "" : "s"}.` };
    }
    if (state.level === "ionised") {
      return { status: "lost", message: "The photon had enough energy to ionise the atom: the electron has gone." };
    }
    if (state.photons >= MAX_PHOTONS) {
      return { status: "lost", message: "Out of photons. Work out the energy gap first: λ = hc/ΔE." };
    }
    return {
      status: "playing",
      message: state.lastPhoton
        ? `${state.lastPhoton.wavelength.toFixed(1)} nm photon ${state.lastPhoton.absorbed ? "absorbed" : "passed straight through"}.`
        : "Choose a wavelength and fire.",
    };
  },
  stars: (state) => (state.photons <= 1 ? 3 : state.photons <= 3 ? 2 : 1),
  readouts: (state, input) => [
    { label: "ELECTRON LEVEL", value: state.level === "ionised" ? "ionised" : `n = ${state.level} (${calculateBohrEnergy(1, state.level).toFixed(2)} eV)` },
    { label: "PHOTON ENERGY", value: `${photonEv(input.values.wavelength ?? 400).toFixed(2)} eV` },
    { label: "EMITTED SO FAR", value: state.emitted.length === 0 ? "—" : state.emitted.slice(-3).map((lambda) => `${lambda.toFixed(0)} nm`).join(", ") },
    { label: "PHOTONS FIRED", value: `${state.photons} of ${MAX_PHOTONS}` },
  ],
  draw(context, state, _input, width, height) {
    const centre = { x: width * 0.38, y: height / 2 };
    const radius = (n: number) => Math.min(height * 0.11, width * 0.05) * n;
    for (let n = 1; n <= 5; n += 1) {
      context.beginPath();
      context.arc(centre.x, centre.y, radius(n), 0, 2 * Math.PI);
      context.strokeStyle = "#c6ccdb";
      context.lineWidth = 1;
      context.stroke();
      label(context, `n=${n}`, centre.x + radius(n) + 2, centre.y - 2, "#4d566b", 9);
    }
    circle(context, centre.x, centre.y, 7, "#d6304f");
    if (state.level !== "ionised") {
      circle(context, centre.x + radius(state.level), centre.y, 6, "#5365d5", "#fff");
    }
    const bars = width * 0.72;
    for (let n = 1; n <= 6; n += 1) {
      const y = height - 20 - ((calculateBohrEnergy(1, n) + 13.6) / 13.6) * (height - 40);
      line(context, [{ x: bars, y }, { x: width - 20, y }], state.level === n ? "#5365d5" : "#9aa4bb", state.level === n ? 3 : 1.5);
      label(context, `${calculateBohrEnergy(1, n).toFixed(1)} eV`, bars - 52, y + 4, "#4d566b", 9);
    }
  },
  describe: (state) => `Hydrogen atom with the electron ${state.level === "ionised" ? "removed" : `in level ${state.level}`}. ${state.photons} photons fired. ${state.emitted.length > 0 ? `Last emitted wavelength ${state.emitted[state.emitted.length - 1]?.toFixed(0)} nanometres.` : ""}`,
};
