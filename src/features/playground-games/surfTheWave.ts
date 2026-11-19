import { STANDARD_GRAVITY } from "../../physics/core";
import { calculateRelativeIntensity, calculateWavelength } from "../../physics/waves";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky, sun } from "./scenery";

/** The wave pool is 0.25 m deep; shallow-water waves all travel at √(g h). */
export const POOL_DEPTH = 0.25;
export const WAVE_SPEED = Math.sqrt(STANDARD_GRAVITY * POOL_DEPTH);
const CALM_HEIGHT = 0.3;

interface Pool { readonly title: string; readonly goal: string; readonly paddles: 1 | 2; readonly surferPath: number; readonly swimmerPath: number | null; readonly height: readonly [number, number] }
export const POOLS: readonly Pool[] = [
  { title: "Make a wave", goal: "Make waves 1.5–2 m from trough to crest for the surfer.", paddles: 1, surferPath: 0, swimmerPath: null, height: [1.5, 2] },
  { title: "Calm corner", goal: "Two paddles push together. Give the surfer 1.6–2.4 m waves, while the swimmers' corner (3 m farther from one paddle) stays calm.", paddles: 2, surferPath: 0, swimmerPath: 3, height: [1.6, 2.4] },
  { title: "Wave wizard", goal: "Now the surfer is 2 m farther from one paddle than the other, and the swimmers 5 m. Big waves for the surfer, calm for the swimmers!", paddles: 2, surferPath: 2, swimmerPath: 5, height: [1.6, 2.4] },
];

/** Crest-to-trough height (m) where the two paddles' waves have travelled paths differing by Δr. */
export function waveHeightAt(level: number, amplitude: number, frequency: number, pathDifference: number): number {
  const pool = POOLS[level] as Pool;
  if (pool.paddles === 1) return 2 * amplitude;
  const wavelength = calculateWavelength(frequency, WAVE_SPEED);
  // Two equal waves add to 2A|cos(πΔr/λ)|; the crest-to-trough height is twice that.
  return 4 * amplitude * Math.sqrt(calculateRelativeIntensity(pathDifference, wavelength));
}

export interface SurfState { readonly rides: number; readonly result: "none" | "surfed" | "too-small" | "wipeout" | "swimmers" ; readonly time: number }

export function judgeWaves(level: number, amplitude: number, frequency: number): SurfState["result"] {
  const pool = POOLS[level] as Pool;
  const surfer = waveHeightAt(level, amplitude, frequency, pool.surferPath);
  if (surfer < pool.height[0]) return "too-small";
  if (surfer > pool.height[1]) return "wipeout";
  if (pool.swimmerPath !== null && waveHeightAt(level, amplitude, frequency, pool.swimmerPath) > CALM_HEIGHT) return "swimmers";
  return "surfed";
}

export const surfTheWave: LiveGameDefinition<SurfState> = {
  id: "surf-the-wave",
  title: "Surf the Wave",
  worldId: "waves",
  eyebrow: "PLAYGROUND · WAVES AND INTERFERENCE",
  modelTag: "λ = v / f · SUPERPOSITION",
  introduction: "Run the wave machine at the surf park! Make big waves for the surfer, but keep the swimmers' corner calm.",
  howToPlay: "Set how far the paddles push (amplitude) and how often (frequency), then press Surf's up (Space or Enter).",
  physics: "A bigger push makes a taller wave: that is the amplitude. Pushing more often makes the waves closer together: wavelength = speed ÷ frequency. When two waves meet they add up. Where crest meets crest the water rises twice as high (constructive interference); where crest meets trough they cancel and the water stays calm (destructive interference). That depends on how much farther one wave has travelled, measured in wavelengths.",
  assumptions: `Shallow-water waves in a pool 25 cm deep, all travelling at √(gh) ≈ ${WAVE_SPEED.toFixed(2)} m/s whatever their frequency, two identical paddles moving in step, waves that do not shrink as they spread, simple sine waves, and calm water meaning less than ${CALM_HEIGHT} m from trough to crest.`,
  levels: POOLS.map((pool, index) => ({ id: `pool-${index + 1}`, title: pool.title, goal: pool.goal })),
  sliders: () => [
    { key: "amplitude", label: "Paddle push (amplitude)", unit: "m", minimum: 0.1, maximum: 1.5, step: 0.05, initial: 0.3 },
    { key: "frequency", label: "Pushes per second (frequency)", unit: "Hz", minimum: 0.1, maximum: 3, step: 0.01, initial: 0.5 },
  ],
  actions: [{ id: "surf", label: "Surf's up!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ rides: 0, result: "none", time: 0 }),
  step(state, input, dt, level) {
    if (input.pressed.has("surf")) return { rides: state.rides + 1, result: judgeWaves(level, input.values.amplitude ?? 0.3, input.values.frequency ?? 0.5), time: state.time + dt };
    return { ...state, time: state.time + dt };
  },
  verdict(state) {
    switch (state.result) {
      case "surfed":
        return { status: "won", message: "Cowabunga! The surfer rides all the way to the beach." };
      case "wipeout":
        return { status: "lost", message: "Wipeout! The waves were too big for the surfer." };
      case "too-small":
        return { status: "playing", message: "Those waves are too small to surf. Push harder, or make the waves meet crest to crest." };
      case "swimmers":
        return { status: "playing", message: "Splash! The swimmers' corner got big waves too. Change the frequency so the waves cancel there." };
      default:
        return { status: "playing", message: "Set the wave machine and shout 'Surf's up!'" };
    }
  },
  stars: (state) => (state.rides <= 1 ? 3 : state.rides <= 3 ? 2 : 1),
  readouts: (_state, input, level) => {
    const pool = POOLS[level] as Pool;
    const amplitude = input.values.amplitude ?? 0.3;
    const frequency = input.values.frequency ?? 0.5;
    return [
      { label: "WAVELENGTH λ = v / f", value: `${calculateWavelength(frequency, WAVE_SPEED).toFixed(2)} m` },
      { label: "PATH DIFFERENCE AT THE SURFER", value: pool.paddles === 1 ? "one paddle" : `${pool.surferPath} m = ${(pool.surferPath / calculateWavelength(frequency, WAVE_SPEED)).toFixed(2)} λ` },
      ...(pool.swimmerPath !== null ? [{ label: "PATH DIFFERENCE AT THE SWIMMERS", value: `${pool.swimmerPath} m = ${(pool.swimmerPath / calculateWavelength(frequency, WAVE_SPEED)).toFixed(2)} λ` }] : []),
      { label: "SURFER'S WAVES", value: `${waveHeightAt(level, amplitude, frequency, pool.surferPath).toFixed(2)} m (needs ${pool.height[0]}–${pool.height[1]} m)` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const pool = POOLS[level] as Pool;
    sky(context, width, height);
    sun(context, width - 50, 40);
    const amplitude = input.values.amplitude ?? 0.3;
    const frequency = input.values.frequency ?? 0.5;
    const wavelength = calculateWavelength(frequency, WAVE_SPEED);
    const sea = height * 0.55;
    const scaleY = 30;
    const scaleX = width / 20;
    const local = (x: number) => (pool.paddles === 1 ? 2 * amplitude : waveHeightAt(level, amplitude, frequency, (x / 20) * (pool.swimmerPath ?? 0) * 1.4)) / 2;
    context.fillStyle = PLAYGROUND_COLOURS.seaTop;
    context.beginPath();
    context.moveTo(0, height);
    for (let px = 0; px <= width; px += 4) {
      const x = px / scaleX;
      context.lineTo(px, sea - local(x) * scaleY * Math.sin((2 * Math.PI * (x - WAVE_SPEED * state.time)) / wavelength));
    }
    context.lineTo(width, height);
    context.fill();
    context.fillStyle = PLAYGROUND_COLOURS.sand;
    context.fillRect(width - 40, sea - 10, 40, height - sea + 10);
    const surfer = judgeWaves(level, amplitude, frequency);
    context.fillStyle = "#ff6b6b";
    context.fillRect(width * 0.35, sea - 30, 30, 6);
    context.fillStyle = PLAYGROUND_COLOURS.ink;
    context.fillRect(width * 0.35 + 12, sea - 52, 6, 22);
    badge(context, "surfer", width * 0.35 - 6, sea - 60);
    if (pool.swimmerPath !== null) badge(context, "swimmers", width * 0.7, sea - 40, surfer === "swimmers" ? PLAYGROUND_COLOURS.enemy : "#1864ab");
    badge(context, `λ ${wavelength.toFixed(2)} m`, 12, 24);
  },
  describe: (_state, input, level) => {
    const pool = POOLS[level] as Pool;
    const amplitude = input.values.amplitude ?? 0.3;
    const frequency = input.values.frequency ?? 0.5;
    return `Amplitude ${amplitude.toFixed(2)} metres at ${frequency.toFixed(2)} hertz: the surfer gets ${waveHeightAt(level, amplitude, frequency, pool.surferPath).toFixed(2)} metre waves${pool.swimmerPath !== null ? ` and the swimmers ${waveHeightAt(level, amplitude, frequency, pool.swimmerPath).toFixed(2)} metres` : ""}.`;
  },
};
