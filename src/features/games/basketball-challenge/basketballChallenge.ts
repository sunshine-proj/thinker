import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateHeightAtDistance,
  calculateLaunchAngles,
  calculateLaunchSpeed,
  calculateReboundHeight,
  calculateRestitution,
  calculateVerticalVelocityAtDistance,
} from "../../../physics/mechanics";

export type ShotKind = "speed" | "angle" | "bounce";

export interface ShotRound extends NumericRound { readonly kind: ShotKind }

export interface ShotOutcome extends AttemptOutcome {
  readonly heightAtHoop: number | null;
  readonly verticalVelocity: number | null;
  readonly reboundHeight: number | null;
}

export const RELEASE_HEIGHT = 2.1;
export const HOOP_DISTANCE = 4.2;
export const HOOP_HEIGHT = 3.05;
export const HOOP_MARGIN = 0.12;
export const SHOT_ANGLE = 52;
export const FIXED_SPEED = 7.5;
export const DROP_HEIGHT = 1.8;
export const REBOUND_TARGET = 1.2;
export const RESTITUTION_TOLERANCE = 0.02;

export const SHOT_META: RoundGameMeta = {
  id: "basketball-challenge",
  title: "Basketball Challenge",
  eyebrow: "EVERYDAY PHYSICS · SPORT",
  modelTag: "PROJECTILE MOTION & BOUNCE",
  introduction: "Sink free throws with physics. Choose the launch speed for a fixed angle, find the launch angle that works at a fixed speed, and set the bounciness of a ball so that it rebounds to the right height.",
  instructions: "Predict, then shoot. The ball flies along a parabola set by its launch speed, angle and release height, and it must be coming down when it reaches the hoop. A bouncing ball keeps only a fraction of its speed each time it hits the floor.",
  formula: "y = y₀ + x tanθ − g x² / (2v² cos²θ)  ·  h' = e² h",
  formulaCaption: "x is the horizontal distance from the shooter, y₀ the release height, v the launch speed and θ the angle above horizontal. e is the coefficient of restitution of a ball and h the height from which it is dropped.",
  explanation: "Horizontal and vertical motion are independent: the ball moves at constant speed sideways while gravity pulls it down, so its path is a parabola. For a given distance a faster shot needs a flatter angle, and at a fixed speed there are two angles that reach the hoop, a low one and a high one; the high one comes in steeper, so the ball has a bigger target to fall through. A bouncing ball leaves the floor with the fraction e of its impact speed, and since height goes with the square of speed, it rebounds to e² times its drop height.",
  assumptions: "No air resistance and no spin; a point-like ball with a margin of 0.12 m standing in for the difference between the ball and the hoop (a real free throw has about 0.2 m of room); release 2.1 m above the floor and 4.2 m horizontally from the hoop center at 3.05 m. The floor is rigid and the ball bounces straight up and down.",
  learningObjectives: ["Use the projectile equation to find the launch speed or angle for a target.", "Explain why a steeper shot has a larger effective target.", "Relate rebound height to the coefficient of restitution."],
  objective: { title: "Win the game", description: "Make every shot.", unit: "shots" },
  controlsHeading: "Take the shot",
  submitLabel: "Shoot",
  solvedLabel: "Swish!",
  nextLabel: "Next shot",
};

export const SHOT_ROUNDS: readonly ShotRound[] = Object.freeze([
  {
    id: "the-free-throw", title: "The free throw", difficulty: "Beginner", kind: "speed",
    situation: `Shoot from ${RELEASE_HEIGHT} m height at ${SHOT_ANGLE}° toward a hoop ${HOOP_DISTANCE} m away at ${HOOP_HEIGHT} m. Choose the launch speed so that the ball passes the hoop within ${HOOP_MARGIN} m of its center, coming down.`,
    controls: [fixed("angle", "Launch angle", "°", SHOT_ANGLE), slider("speed", "Launch speed", "m/s", 5, 10, 0.01, 6)],
    hint: "Solve y(4.2 m) = 3.05 m for v: v² = g x² / (2 cos²θ (y₀ + x tanθ − 3.05)).",
  },
  {
    id: "the-right-angle", title: "The right angle", difficulty: "Intermediate", kind: "angle",
    situation: `You can only throw at ${FIXED_SPEED} m/s. Choose a launch angle that sinks the shot. Two angles work; the ball must be descending at the hoop (within ${HOOP_MARGIN} m of the center).`,
    controls: [fixed("speed", "Launch speed", "m/s", FIXED_SPEED), slider("angle", "Launch angle", "°", 30, 80, 0.1, 45)],
    hint: "The equation is quadratic in tanθ and has two solutions: roughly 41° and 62°. The steeper one lands more softly.",
  },
  {
    id: "the-bounce-pass", title: "The bounce pass", difficulty: "Advanced", kind: "bounce",
    situation: `A ball dropped from ${DROP_HEIGHT} m should rebound to ${REBOUND_TARGET} m. Choose its coefficient of restitution e (± ${RESTITUTION_TOLERANCE}) by adjusting the air pressure.`,
    controls: [fixed("drop", "Drop height", "m", DROP_HEIGHT), slider("restitution", "Coefficient of restitution e", "", 0.5, 0.95, 0.005, 0.7)],
    hint: "Rebound height = e² × drop height, so e = √(1.2/1.8).",
  },
]);

export function runShot(round: ShotRound, v: NumericControl): ShotOutcome {
  if (round.kind === "bounce") {
    const e = v.restitution as number;
    const rebound = calculateReboundHeight(DROP_HEIGHT, e);
    const truth = calculateRestitution(DROP_HEIGHT, REBOUND_TARGET);
    const error = Math.abs(e - truth);
    const success = error <= RESTITUTION_TOLERANCE;
    return {
      heightAtHoop: null, verticalVelocity: null, reboundHeight: rebound, success, accuracyFraction: success ? 1 - error / RESTITUTION_TOLERANCE : 0, predictionActual: truth,
      feedback: success ? `e = ${e.toFixed(3)} sends the ball back up with ${(e * 100).toFixed(1)} % of its speed, to e² × 1.8 m = ${rebound.toFixed(2)} m.`
        : `The ball rebounds to ${rebound.toFixed(2)} m, ${rebound > REBOUND_TARGET ? "too high: let some air out" : "too low: pump it up"}. Needed e = ${truth.toFixed(3)}.`,
    };
  }
  const speed = v.speed as number;
  const angle = v.angle as number;
  const height = calculateHeightAtDistance(speed, angle, RELEASE_HEIGHT, HOOP_DISTANCE);
  const vy = calculateVerticalVelocityAtDistance(speed, angle, HOOP_DISTANCE);
  const error = Math.abs(height - HOOP_HEIGHT);
  const descending = vy < 0;
  const success = error <= HOOP_MARGIN && descending;
  const truth = round.kind === "speed"
    ? calculateLaunchSpeed(SHOT_ANGLE, RELEASE_HEIGHT, HOOP_DISTANCE, HOOP_HEIGHT)
    : (calculateLaunchAngles(FIXED_SPEED, RELEASE_HEIGHT, HOOP_DISTANCE, HOOP_HEIGHT)[1] ?? 0);
  return {
    heightAtHoop: height, verticalVelocity: vy, reboundHeight: null, success, accuracyFraction: success ? 1 - error / HOOP_MARGIN : 0, predictionActual: truth,
    feedback: success ? `The ball is ${height.toFixed(2)} m high when it reaches the hoop and falling at ${Math.abs(vy).toFixed(1)} m/s: swish.`
      : error <= HOOP_MARGIN ? `The ball reaches the hoop at the right height (${height.toFixed(2)} m) but it is still rising, so it cannot drop through.`
      : `The ball arrives ${Math.abs(height - HOOP_HEIGHT).toFixed(2)} m ${height > HOOP_HEIGHT ? "above" : "below"} the hoop: ${height > HOOP_HEIGHT ? "too much speed or angle" : "not enough"}.`,
  };
}

export const basketballChallenge = defineNumericGame<ShotRound, ShotOutcome>({
  meta: SHOT_META,
  rounds: SHOT_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "speed" ? { label: "Your prediction of the launch speed", unit: "m/s", placeholder: "e.g. 7.2", step: 0.01 }
    : round.kind === "angle" ? { label: "Your prediction of the steeper angle", unit: "°", placeholder: "e.g. 60", step: 0.1 }
    : { label: "Your prediction of the coefficient of restitution", unit: "", placeholder: "e.g. 0.82", step: 0.001 },
  evaluate: (round, values) => runShot(round, values),
});
