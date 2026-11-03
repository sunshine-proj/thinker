import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { STANDARD_GRAVITY } from "../../../physics/core";
import { TENNIS_BALL, calculateBallTerminalSpeed, calculateReboundHeight, calculateRestitution, simulateBallFlight } from "../../../physics/mechanics";

export type TennisKind = "serve" | "bounce" | "terminal";

export interface TennisRound extends NumericRound { readonly kind: TennisKind }

export interface TennisOutcome extends AttemptOutcome {
  readonly range: number | null;
  readonly rangeWithoutDrag: number | null;
  readonly landingSpeed: number | null;
  readonly reboundHeight: number | null;
  readonly terminalSpeed: number;
}

export const SERVE_HEIGHT = 2.6;
export const SERVE_ANGLE = -6;
export const SERVICE_LINE = 18.29;
export const SERVE_TOLERANCE = 0.5;
export const DROP_HEIGHT = 2.54;
export const REBOUND_LOW = 1.346;
export const REBOUND_HIGH = 1.473;
export const TERMINAL_TOLERANCE = 0.05;

export const TENNIS_META: RoundGameMeta = {
  id: "tennis-physics",
  title: "Tennis Physics",
  eyebrow: "EVERYDAY PHYSICS · SPORT",
  modelTag: "DRAG & RESTITUTION",
  introduction: "A tennis ball is light and fuzzy, so the air matters. Choose a serve speed that lands on the service line once drag is included, tune the ball's bounce to the official standard, and find the speed at which a falling ball stops accelerating.",
  instructions: "Predict, then play. Air drag grows with the square of the speed, so a fast serve loses a surprising amount of speed in flight, and a falling ball reaches a terminal speed where drag balances its weight.",
  formula: "F_drag = ½ρ C_d A v²  ·  v_t = √(2mg/(ρ C_d A))  ·  h' = e² h",
  formulaCaption: "ρ = 1.225 kg/m³ is the air density, C_d ≈ 0.55 the drag coefficient, A the cross-section area of the ball, m its mass (57 g) and v its speed. e is the coefficient of restitution of the bounce.",
  explanation: "Without air a serve is a parabola; with air the ball is slowed down continuously, so it travels shorter, drops more steeply and lands slower. The drag on a tennis ball is about as big as its weight at just 22 m/s, so a 60 m/s serve loses a quarter of its speed on the way. The official rules require a ball dropped from 254 cm to rebound between 135 cm and 147 cm, which fixes the coefficient of restitution at about 0.73 to 0.76: the ball keeps about three quarters of its speed in the bounce, but loses over 40 % of its energy.",
  assumptions: "Spin is ignored. A real serve has topspin that adds a downward Magnus force and makes the ball dip, so the speeds found here are an approximation. Constant drag coefficient 0.55, still air at 1.225 kg/m³, a serve from 2.6 m height at 6° below horizontal, and a flat, rigid court. The flight is integrated with a fourth-order Runge–Kutta step of 1 ms.",
  learningObjectives: ["Include quadratic drag in the flight of a ball.", "Use the drop test to find a coefficient of restitution.", "Calculate and interpret a terminal speed."],
  objective: { title: "Win the point", description: "Complete every challenge.", unit: "challenges" },
  controlsHeading: "Play the point",
  submitLabel: "Play",
  solvedLabel: "Ace!",
  nextLabel: "Next challenge",
};

export const TENNIS_ROUNDS: readonly TennisRound[] = Object.freeze([
  {
    id: "serve-it-in", title: "Serve it in", difficulty: "Intermediate", kind: "serve",
    situation: `Serve from ${SERVE_HEIGHT} m height, ${Math.abs(SERVE_ANGLE)}° below horizontal, so the ball lands on the service line ${SERVICE_LINE} m away (± ${SERVE_TOLERANCE} m). Air drag acts on the ball.`,
    controls: [fixed("angle", "Serve angle", "°", SERVE_ANGLE), slider("speed", "Serve speed", "m/s", 20, 80, 0.1, 40)],
    hint: "Try speeds and compare the landing point with and without drag in the chart: drag shortens the serve, so you need more speed than the no-air answer.",
  },
  {
    id: "the-regulation-bounce", title: "The regulation bounce", difficulty: "Beginner", kind: "bounce",
    situation: `The rules say a ball dropped from ${DROP_HEIGHT * 100} cm must rebound between ${REBOUND_LOW * 100} cm and ${REBOUND_HIGH * 100} cm. Choose a coefficient of restitution that passes.`,
    controls: [fixed("drop", "Drop height", "m", DROP_HEIGHT), slider("restitution", "Coefficient of restitution e", "", 0.5, 0.9, 0.001, 0.6)],
    hint: "Rebound = e² × 2.54 m, so e = √(1.346/2.54) to √(1.473/2.54).",
  },
  {
    id: "terminal-speed", title: "Terminal speed", difficulty: "Advanced", kind: "terminal",
    situation: `A tennis ball (57 g, 6.7 cm, C_d = 0.55) falls from a very high tower. At what speed does the air resistance equal its weight, so it stops speeding up? (± ${TERMINAL_TOLERANCE * 100} %)`,
    controls: [slider("speed", "Terminal speed", "m/s", 5, 60, 0.1, 30)],
    hint: "Set ½ρ C_d A v² = m g and solve for v.",
  },
]);

export function runTennis(round: TennisRound, v: NumericControl): TennisOutcome {
  const terminal = calculateBallTerminalSpeed(TENNIS_BALL);
  const none = { range: null, rangeWithoutDrag: null, landingSpeed: null, reboundHeight: null, terminalSpeed: terminal };
  if (round.kind === "serve") {
    const launch = { speed: v.speed as number, angleDegrees: SERVE_ANGLE, height: SERVE_HEIGHT };
    const flight = simulateBallFlight(TENNIS_BALL, launch, true);
    const free = simulateBallFlight(TENNIS_BALL, launch, false);
    const error = Math.abs(flight.range - SERVICE_LINE);
    const success = error <= SERVE_TOLERANCE;
    return {
      ...none, range: flight.range, rangeWithoutDrag: free.range, landingSpeed: flight.landingSpeed, success, accuracyFraction: success ? 1 - error / SERVE_TOLERANCE : 0, predictionActual: SERVE_SPEED_ANSWER(),
      feedback: success ? `With drag the serve lands at ${flight.range.toFixed(2)} m after ${flight.flightTime.toFixed(2)} s, at ${flight.landingSpeed.toFixed(1)} m/s (it started at ${launch.speed}). Without air it would have gone ${free.range.toFixed(1)} m.`
        : `The serve lands ${flight.range.toFixed(1)} m away (${flight.range > SERVICE_LINE ? "long" : "short"}); without drag it would have been ${free.range.toFixed(1)} m.`,
    };
  }
  if (round.kind === "bounce") {
    const e = v.restitution as number;
    const rebound = calculateReboundHeight(DROP_HEIGHT, e);
    const success = rebound >= REBOUND_LOW && rebound <= REBOUND_HIGH;
    const middle = calculateRestitution(DROP_HEIGHT, (REBOUND_LOW + REBOUND_HIGH) / 2);
    return {
      ...none, reboundHeight: rebound, success, accuracyFraction: success ? 1 - Math.abs(e - middle) / 0.02 : 0, predictionActual: middle,
      feedback: success ? `e = ${e.toFixed(3)} gives a rebound of ${(rebound * 100).toFixed(0)} cm, inside the legal ${REBOUND_LOW * 100}–${REBOUND_HIGH * 100} cm. The bounce keeps ${(e * e * 100).toFixed(0)} % of the energy.`
        : `A rebound of ${(rebound * 100).toFixed(0)} cm is ${rebound > REBOUND_HIGH ? "too lively" : "too dead"} for the standard.`,
    };
  }
  const guess = v.speed as number;
  const error = Math.abs(guess - terminal) / terminal;
  const success = error <= TERMINAL_TOLERANCE;
  return {
    ...none, success, accuracyFraction: success ? 1 - error / TERMINAL_TOLERANCE : 0, predictionActual: terminal,
    feedback: success ? `v_t = √(2mg/(ρ C_d A)) = ${terminal.toFixed(1)} m/s, about ${(terminal * 3.6).toFixed(0)} km/h. A ball hit faster than this slows down.`
      : `${guess} m/s is ${guess > terminal ? "above" : "below"} the speed (${terminal.toFixed(1)} m/s) where ½ρC_dAv² equals the weight ${(TENNIS_BALL.massKg * STANDARD_GRAVITY).toFixed(2)} N.`,
  };
}

let cachedAnswer: number | null = null;
/** Serve speed (m/s) that lands on the service line with drag, found by bisection. */
export function SERVE_SPEED_ANSWER(): number {
  if (cachedAnswer !== null) return cachedAnswer;
  let low = 20;
  let high = 80;
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const range = simulateBallFlight(TENNIS_BALL, { speed: mid, angleDegrees: SERVE_ANGLE, height: SERVE_HEIGHT }, true, 0.002).range;
    if (range < SERVICE_LINE) low = mid; else high = mid;
  }
  cachedAnswer = (low + high) / 2;
  return cachedAnswer;
}

export const tennisPhysics = defineNumericGame<TennisRound, TennisOutcome>({
  meta: TENNIS_META,
  rounds: TENNIS_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "serve" ? { label: "Your prediction of the serve speed", unit: "m/s", placeholder: "e.g. 30", step: 0.1 }
    : round.kind === "bounce" ? { label: "Your prediction of the coefficient of restitution", unit: "", placeholder: "e.g. 0.74", step: 0.001 }
    : { label: "Your prediction of the terminal speed", unit: "m/s", placeholder: "e.g. 22", step: 0.1 },
  evaluate: (round, values) => runTennis(round, values),
});
