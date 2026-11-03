import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { createWaveGrid, gaussianPulse, simulateWave, stepsForDuration, type WaveGrid } from "../../../physics/waves";

export type WaveKind = "echo" | "sum" | "cancel";

export interface WaveRound extends NumericRound { readonly kind: WaveKind }

export interface WaveOutcome extends AttemptOutcome {
  /** Displacement snapshot (x in m, u relative) at the moment of interest. */
  readonly profile: readonly { x: number; y: number }[];
  /** Headline quantity of the round: echo time (s), centre displacement, or residual displacement. */
  readonly measured: number;
  readonly steps: number;
  readonly timeStep: number;
}

export const STRING_LENGTH = 12;
export const GRID: WaveGrid = createWaveGrid(STRING_LENGTH, 240);
export const PULSE_WIDTH = 0.5;
export const ECHO_TARGET_SECONDS = 3;
export const ECHO_TOLERANCE_SECONDS = 0.1;
export const SUM_TARGET = 0.8;
export const SUM_TOLERANCE = 0.05;
export const CANCEL_TOLERANCE = 0.05;
const PULSE_DISTANCE = 18; // from x = 3 to the far end and back

export const WAVE_META: RoundGameMeta = {
  id: "wave-simulator",
  title: "Wave Simulator",
  eyebrow: "WAVES & SOUND · PROPAGATION",
  modelTag: "1-D WAVE EQUATION",
  introduction: "Send pulses along a string and watch them travel, reflect and pass through each other. The simulator solves the wave equation numerically, so you can time an echo and make pulses add up or cancel.",
  instructions: "Predict, set the controls, then run the simulation. Pulses travel at the wave speed, reflect inverted from a fixed end, and add together (superpose) where they overlap.",
  formula: "∂²u/∂t² = c² ∂²u/∂x²  ·  u(x,t) = f(x − ct) + g(x + ct)  ·  u = u₁ + u₂",
  formulaCaption: "u is the displacement of the string, c the wave speed, x the position and t the time. The first term is a pulse travelling right, the second one travelling left. Two waves present together simply add.",
  explanation: "The wave equation says a point on the string accelerates in proportion to how much the string curves there. Its solutions are shapes that move without changing form at speed c. A pulse that hits a fixed end must have zero displacement there, so it comes back upside down. Because the equation is linear, two pulses crossing simply add where they overlap, and then each continues unchanged: with opposite signs they cancel completely for a moment. The simulation uses a leapfrog finite-difference scheme with Courant number 1, for which pulses are carried without distortion.",
  assumptions: "An ideal uniform string with small displacements, no damping and no dispersion, fixed at both ends, simulated on a 240-interval grid with a Courant number of 1 (the scheme is exact for travelling pulses at that value, and unstable above it).",
  learningObjectives: ["Relate wave speed to the time a pulse takes to travel and reflect.", "Describe the inverted reflection from a fixed end.", "Apply the superposition principle to predict constructive and destructive overlap."],
  objective: { title: "Master the string", description: "Complete each wave challenge.", unit: "challenges" },
  controlsHeading: "Set up the string",
  submitLabel: "Run the simulation",
  solvedLabel: "Wave mastered!",
  nextLabel: "Next challenge",
};

export const WAVE_ROUNDS: readonly WaveRound[] = Object.freeze([
  {
    id: "time-the-echo", title: "Time the echo", difficulty: "Beginner", kind: "echo",
    situation: `A pulse is sent from x = 3 m along a 12 m string toward the fixed far end. Choose the wave speed so the inverted echo is back at x = 3 m after ${ECHO_TARGET_SECONDS.toFixed(1)} s (± ${ECHO_TOLERANCE_SECONDS} s).`,
    controls: [slider("speed", "Wave speed", "m/s", 1, 12, 0.1, 3)],
    hint: "The pulse travels 9 m to the end and 9 m back: 18 m in 3 s.",
  },
  {
    id: "add-the-pulses", title: "Add the pulses", difficulty: "Intermediate", kind: "sum",
    situation: `A pulse of height 0.5 starts at x = 3 m moving right, and one of height A starts at x = 9 m moving left; the speed is 3 m/s. When they meet at x = 6 m (t = 1 s) the string should reach a height of ${SUM_TARGET} (± ${SUM_TOLERANCE}). Choose A.`,
    controls: [fixed("speed", "Wave speed", "m/s", 3), slider("amplitude", "Height of the second pulse", "", -1, 1, 0.01, 0.5)],
    hint: "At the instant they overlap exactly the displacements add: 0.5 + A = 0.8.",
  },
  {
    id: "cancel-the-pulses", title: "Cancel the pulses", difficulty: "Advanced", kind: "cancel",
    situation: `A pulse of height 0.5 starts at x = 2 m moving right at 3 m/s. A second pulse starts to its right, moving left. Choose its starting position and height so the string at x = 6 m never moves more than ${CANCEL_TOLERANCE} while they pass.`,
    controls: [fixed("speed", "Wave speed", "m/s", 3), slider("start", "Start of the second pulse", "m", 5, 10.5, 0.1, 8), slider("amplitude", "Height of the second pulse", "", -1, 1, 0.01, 0.5)],
    hint: "The pulses must reach x = 6 m at the same moment, so the second one starts as far to the right of 6 m as the first is to the left, and its height must be opposite.",
  },
]);

function pulsesFor(round: WaveRound, v: NumericControl) {
  if (round.kind === "echo") {
    return [{ profile: gaussianPulse(1, 3, PULSE_WIDTH), direction: 1 as const }];
  }
  if (round.kind === "sum") {
    return [
      { profile: gaussianPulse(0.5, 3, PULSE_WIDTH), direction: 1 as const },
      { profile: gaussianPulse(v.amplitude as number, 9, PULSE_WIDTH), direction: -1 as const },
    ];
  }
  return [
    { profile: gaussianPulse(0.5, 2, PULSE_WIDTH), direction: 1 as const },
    { profile: gaussianPulse(v.amplitude as number, v.start as number, PULSE_WIDTH), direction: -1 as const },
  ];
}

function toProfile(u: Float64Array): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < u.length; i += 2) {
    points.push({ x: i * GRID.dx, y: u[i]! });
  }
  return points;
}

/** The starting shape of the string, before the simulation runs. */
export function initialProfile(round: WaveRound, v: NumericControl): { x: number; y: number }[] {
  const speed = v.speed as number;
  return toProfile(simulateWave(GRID, speed, 1, 0, pulsesFor(round, v)).displacement);
}

export function runWave(round: WaveRound, v: NumericControl): WaveOutcome {
  const speed = v.speed as number;
  const pulses = pulsesFor(round, v);
  const dt = GRID.dx / speed;

  if (round.kind === "echo") {
    const probe = Math.round(3 / GRID.dx);
    const steps = stepsForDuration(GRID, speed, 1, (1.1 * PULSE_DISTANCE) / speed);
    const snapshotStep = Math.round(ECHO_TARGET_SECONDS / dt);
    let lobeMinimum = 0;
    let echoTime = Number.NaN;
    let finished = false;
    let snapshot = new Float64Array(GRID.points);
    let stepIndex = 0;
    simulateWave(GRID, speed, 1, steps, pulses, (state) => {
      stepIndex += 1;
      const u = state.displacement[probe]!;
      if (!finished) {
        if (u < -0.5) {
          if (u < lobeMinimum) {
            lobeMinimum = u;
            echoTime = state.time;
          }
        } else if (lobeMinimum < 0) {
          finished = true;
        }
      }
      if (stepIndex === snapshotStep) {
        snapshot = Float64Array.from(state.displacement);
      }
    });
    const error = Math.abs(echoTime - ECHO_TARGET_SECONDS);
    const success = error <= ECHO_TOLERANCE_SECONDS;
    return {
      profile: toProfile(snapshot), measured: echoTime, steps, timeStep: dt,
      success, accuracyFraction: success ? 1 - error / ECHO_TOLERANCE_SECONDS : 0, predictionActual: PULSE_DISTANCE / ECHO_TARGET_SECONDS,
      feedback: success ? `At ${speed.toFixed(1)} m/s the pulse travelled 18 m and its inverted echo reached x = 3 m after ${echoTime.toFixed(2)} s.`
        : `The echo arrived after ${echoTime.toFixed(2)} s, ${echoTime > ECHO_TARGET_SECONDS ? "too late: the wave is too slow" : "too early: the wave is too fast"}. Speed = distance / time.`,
    };
  }

  if (round.kind === "sum") {
    const steps = stepsForDuration(GRID, speed, 1, 1);
    const final = simulateWave(GRID, speed, 1, steps, pulses);
    const centre = final.displacement[Math.round(6 / GRID.dx)]!;
    const error = Math.abs(centre - SUM_TARGET);
    const success = error <= SUM_TOLERANCE;
    return {
      profile: toProfile(final.displacement), measured: centre, steps, timeStep: dt,
      success, accuracyFraction: success ? 1 - error / SUM_TOLERANCE : 0, predictionActual: SUM_TARGET - 0.5,
      feedback: success ? `At t = 1 s the pulses overlap at x = 6 m and the displacements add: 0.5 + ${(v.amplitude as number).toFixed(2)} = ${centre.toFixed(2)}.`
        : `The string reaches ${centre.toFixed(2)} at the meeting point, not ${SUM_TARGET}. The heights simply add: 0.5 + ${(v.amplitude as number).toFixed(2)}.`,
    };
  }

  const probe = Math.round(6 / GRID.dx);
  const steps = stepsForDuration(GRID, speed, 1, 3.5);
  let residual = 0;
  const final = simulateWave(GRID, speed, 1, steps, pulses, (state) => {
    residual = Math.max(residual, Math.abs(state.displacement[probe]!));
  });
  const success = residual <= CANCEL_TOLERANCE;
  return {
    profile: toProfile(final.displacement), measured: residual, steps, timeStep: dt,
    success, accuracyFraction: success ? 1 - residual / CANCEL_TOLERANCE : 0, predictionActual: 10,
    feedback: success ? `The two pulses reached x = 6 m together with opposite heights, so the string there never moved more than ${residual.toFixed(3)}.`
      : `The string at x = 6 m moved as much as ${residual.toFixed(2)}: the pulses did not cancel. They must arrive together (equal distances from x = 6 m) and have opposite heights.`,
  };
}

export const waveSimulator = defineNumericGame<WaveRound, WaveOutcome>({
  meta: WAVE_META,
  rounds: WAVE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "echo" ? { label: "Your prediction of the wave speed needed", unit: "m/s", placeholder: "e.g. 6", step: 0.1 }
    : round.kind === "sum" ? { label: "Your prediction of the second pulse's height", unit: "", placeholder: "e.g. 0.3", step: 0.01 }
    : { label: "Your prediction of the start position needed", unit: "m", placeholder: "e.g. 10", step: 0.1 },
  evaluate: (round, values) => runWave(round, values),
});
