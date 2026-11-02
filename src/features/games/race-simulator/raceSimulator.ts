import { defineNumericGame, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateDistanceAtTime,
  calculateStoppingDistance,
  calculateTimeToCoverDistance,
} from "../../../physics/mechanics";

export type RaceKind = "sprint" | "chase" | "brake";

export interface RaceRound extends NumericRound {
  readonly kind: RaceKind;
  readonly distanceMeters: number;
  /** Sprint and chase: the car's top speed (m/s). Brake: speed when the driver sees the wall. */
  readonly speedMetersPerSecond: number;
  readonly targetTimeSeconds?: number;
  readonly toleranceSeconds?: number;
  readonly rivalHeadStartMeters?: number;
  readonly rivalSpeedMetersPerSecond?: number;
  readonly reactionTimeSeconds?: number;
  readonly gapRangeMeters?: readonly [number, number];
}

export interface RaceOutcome extends AttemptOutcome {
  readonly timeSeconds: number | null;
  readonly stoppingDistanceMeters: number | null;
  readonly gapMeters: number | null;
  readonly curve: readonly { x: number; y: number }[];
  readonly rivalCurve: readonly { x: number; y: number }[];
}

export const RACE_META: RoundGameMeta = {
  id: "race-simulator",
  title: "Race Simulator",
  eyebrow: "MECHANICS · KINEMATICS",
  modelTag: "CONSTANT ACCELERATION",
  introduction: "Tune a car's acceleration and braking to win a drag race, beat a rival to the line, and stop just short of a wall.",
  instructions: "Predict the result, choose the acceleration (or braking), then start the race. The graph shows position against time.",
  formula: "x = ½at²  ·  v = at  ·  d = v²/(2a)",
  formulaCaption: "x is distance, a acceleration, t time and v speed. A car that reaches its top speed then travels at constant speed, so t = d/v + v/(2a).",
  explanation: "With constant acceleration the distance grows with the square of the time, so doubling the acceleration shortens a race by only a factor of √2. Once a car reaches its top speed it stops accelerating and covers equal distances in equal times. Braking is acceleration in the opposite direction: the stopping distance v²/(2a) grows with the square of the speed, and the distance travelled during the driver's reaction time is added on top.",
  assumptions: "The car moves in a straight line with constant acceleration (no drag, traction limits or gear changes) up to an optional top speed. The rival moves at constant speed and braking is constant, starting after a fixed reaction time.",
  learningObjectives: [
    "Use x = ½at² and v² = 2ax to relate acceleration, distance, time and speed.",
    "Handle a top-speed limit by splitting motion into acceleration and cruising.",
    "Compute stopping distance including reaction time.",
  ],
  objective: { title: "Win every race", description: "Meet the goal of each race.", unit: "races" },
  controlsHeading: "Tune the car",
  submitLabel: "Start the race",
  solvedLabel: "Race won!",
  nextLabel: "Next race",
};

export const RACE_ROUNDS: readonly RaceRound[] = Object.freeze([
  {
    id: "drag-race", title: "The drag strip", difficulty: "Beginner", kind: "sprint",
    situation: "A car starts from rest on a 400 m strip. Choose its acceleration so it crosses the line in exactly 10 s (± 0.2 s).",
    distanceMeters: 400, speedMetersPerSecond: Number.POSITIVE_INFINITY, targetTimeSeconds: 10, toleranceSeconds: 0.2,
    controls: [slider("acceleration", "Acceleration", "m/s²", 2, 15, 0.1, 6)],
    hint: "From rest, d = ½at², so a = 2d/t².",
  },
  {
    id: "photo-finish", title: "Photo finish", difficulty: "Intermediate", kind: "chase",
    situation: "A rival starts 300 m ahead of you and drives at a steady 40 m/s toward a finish line 1,000 m from your start. Your car tops out at 70 m/s. Beat the rival, but by less than a second.",
    distanceMeters: 1000, speedMetersPerSecond: 70, rivalHeadStartMeters: 300, rivalSpeedMetersPerSecond: 40, targetTimeSeconds: 17.5, toleranceSeconds: 1,
    controls: [slider("acceleration", "Acceleration", "m/s²", 3, 20, 0.1, 8)],
    hint: "The rival needs (1000 − 300)/40 = 17.5 s. Your car accelerates to 70 m/s, then cruises: t = d/v + v/(2a).",
  },
  {
    id: "brake-in-time", title: "Stop before the wall", difficulty: "Advanced", kind: "brake",
    situation: "At 50 m/s the driver sees a wall 200 m ahead and reacts after 1.0 s. Choose the braking deceleration that stops the car between 5 m and 15 m short of the wall.",
    distanceMeters: 200, speedMetersPerSecond: 50, reactionTimeSeconds: 1, gapRangeMeters: [5, 15],
    controls: [slider("deceleration", "Braking deceleration", "m/s²", 3, 12, 0.05, 6)],
    hint: "In the reaction time the car travels 50 m at full speed. The rest, v²/(2a), must fit in the remaining distance minus the gap.",
  },
]);

function sampleCurve(duration: number, fn: (t: number) => number): { x: number; y: number }[] {
  return Array.from({ length: 61 }, (_, i) => ({ x: (duration * i) / 60, y: fn((duration * i) / 60) }));
}

export function runRace(round: RaceRound, values: NumericControl): RaceOutcome {
  const empty = { timeSeconds: null, stoppingDistanceMeters: null, gapMeters: null, curve: [], rivalCurve: [] };
  if (round.kind === "brake") {
    const decel = values.deceleration as number;
    const reaction = round.reactionTimeSeconds as number;
    const v = round.speedMetersPerSecond;
    const stopping = v * reaction + calculateStoppingDistance(v, decel);
    const gap = round.distanceMeters - stopping;
    const [low, high] = round.gapRangeMeters as [number, number];
    const success = gap >= low && gap <= high;
    const stopTime = reaction + v / decel;
    const curve = sampleCurve(stopTime, (t) => (t <= reaction ? v * t : v * reaction + v * (t - reaction) - 0.5 * decel * (t - reaction) ** 2));
    return {
      ...empty, success, curve, stoppingDistanceMeters: stopping, gapMeters: gap,
      accuracyFraction: success ? 1 - Math.abs(gap - (low + high) / 2) / ((high - low) / 2) : 0,
      predictionActual: stopping,
      feedback: success
        ? `The car stops ${gap.toFixed(1)} m short of the wall.`
        : gap < 0
          ? `Crash! The car needs ${stopping.toFixed(0)} m to stop but the wall is ${round.distanceMeters} m away. Brake harder.`
          : gap < low ? `The car stops only ${gap.toFixed(1)} m from the wall: too close. Brake a little harder.` : `The car stops ${gap.toFixed(1)} m from the wall: too far back. Brake a little more gently.`,
    };
  }

  const a = values.acceleration as number;
  const top = round.speedMetersPerSecond;
  const time = calculateTimeToCoverDistance(round.distanceMeters, a, top);
  const curve = sampleCurve(time, (t) => calculateDistanceAtTime(a, t, top));
  const target = round.targetTimeSeconds as number;
  const tolerance = round.toleranceSeconds as number;

  if (round.kind === "sprint") {
    const error = Math.abs(time - target);
    const success = error <= tolerance;
    return {
      ...empty, success, curve, timeSeconds: time, accuracyFraction: success ? 1 - error / tolerance : 0, predictionActual: time,
      feedback: success ? `Finished in ${time.toFixed(2)} s.` : `Finished in ${time.toFixed(2)} s, ${time > target ? "too slow" : "too fast"} for the ${target} s goal.`,
    };
  }

  const rivalSpeed = round.rivalSpeedMetersPerSecond as number;
  const head = round.rivalHeadStartMeters as number;
  const rivalCurve = sampleCurve(time, (t) => head + rivalSpeed * t);
  const margin = target - time; // positive: you win by this many seconds
  const success = margin >= 0 && margin <= tolerance;
  return {
    ...empty, success, curve, rivalCurve, timeSeconds: time, accuracyFraction: success ? 1 - margin / tolerance : 0, predictionActual: time,
    feedback: success
      ? `You finish in ${time.toFixed(2)} s, ${margin.toFixed(2)} s ahead of the rival.`
      : margin < 0 ? `The rival wins: you take ${time.toFixed(2)} s against its ${target} s.` : `You win by ${margin.toFixed(1)} s, more than a photo finish: use less acceleration.`,
  };
}

export const raceSimulator = defineNumericGame<RaceRound, RaceOutcome>({
  meta: RACE_META,
  rounds: RACE_ROUNDS,
  prediction: (round) =>
    round.kind === "brake"
      ? { label: "Your prediction of the total stopping distance", unit: "m", placeholder: "e.g. 190", step: 0.1 }
      : { label: "Your prediction of your finish time", unit: "s", placeholder: "e.g. 12", step: 0.1 },
  evaluate: (round, values) => runRace(round, values),
});
