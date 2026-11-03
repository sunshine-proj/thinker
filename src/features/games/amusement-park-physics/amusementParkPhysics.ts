import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { STANDARD_GRAVITY } from "../../../physics/core";
import {
  calculateBrakingGForce,
  calculateCentripetalAcceleration,
  calculateFreeFallSpeed,
  calculatePeriodForAcceleration,
  calculateRotorMinimumAngularSpeed,
  calculateWallGForce,
  rpmToRadiansPerSecond,
} from "../../../physics/mechanics";

export type RideKind = "carousel" | "tower" | "rotor";

export interface RideRound extends NumericRound { readonly kind: RideKind }

export interface RideOutcome extends AttemptOutcome {
  readonly gForce: number;
  readonly speed: number | null;
  readonly minimumRpm: number | null;
}

export const CAROUSEL_RADIUS = 5;
export const CAROUSEL_G = 0.5;
export const CAROUSEL_TOLERANCE = 0.2;
export const TOWER_HEIGHT = 40;
export const TOWER_TARGET_G = 3;
export const TOWER_TOLERANCE = 1.5;
export const ROTOR_RADIUS = 2.5;
export const ROTOR_FRICTION = 0.4;
export const ROTOR_MARGIN = 0.1;

export const RIDE_META: RoundGameMeta = {
  id: "amusement-park-physics",
  title: "Amusement Park Physics",
  eyebrow: "EVERYDAY PHYSICS · RIDES",
  modelTag: "CIRCULAR MOTION & G-FORCES",
  introduction: "Engineer the thrills. Time a carousel so riders feel a gentle half a g, stop a drop tower so the brakes squeeze with exactly three times weight, and spin the Rotor just fast enough for riders to stick to the wall.",
  instructions: "Predict, set the ride and run it. What riders feel is the push of the seat or wall on them, measured against their weight, so circular motion and braking both change the g-force.",
  formula: "a = 4π²r/T² = ω²r  ·  ω ≥ √(g/(μr))  ·  g-force = 1 + v²/(2sg)",
  formulaCaption: "r is the radius, T the period of rotation, ω the angular speed and a the centripetal acceleration. μ is the friction coefficient between rider and wall. v is the speed at the start of braking and s the braking distance of the drop tower.",
  explanation: "Going round a circle needs a force toward the center, which on a carousel comes from the seat and on a Rotor from the wall. The faster the spin or the larger the radius, the larger the force: a = ω²r. On the Rotor the wall pushes inward with mω²r and friction carries the rider's weight when μmω²r ≥ mg, so the floor can drop away once ω is at least √(g/μr), whatever the rider's mass. On the drop tower free fall is weightless; the brakes must then remove v = √(2gh) over a stopping distance s, which needs a deceleration v²/2s, and the riders feel that on top of their normal 1 g.",
  assumptions: "Uniform circular motion, riders as point masses at the stated radius, a constant friction coefficient of 0.4 between clothing and wall, constant braking deceleration and no air resistance on the tower. Real rides limit the g-force and its duration for safety.",
  learningObjectives: ["Calculate the centripetal acceleration from radius and period.", "Find the minimum spin rate that keeps riders on a Rotor wall.", "Combine free fall and braking to find the g-force on a drop tower."],
  objective: { title: "Open the park", description: "Make every ride safe and fun.", unit: "rides" },
  controlsHeading: "Set up the ride",
  submitLabel: "Start the ride",
  solvedLabel: "Ride approved!",
  nextLabel: "Next ride",
};

export const RIDE_ROUNDS: readonly RideRound[] = Object.freeze([
  {
    id: "the-carousel", title: "The carousel", difficulty: "Beginner", kind: "carousel",
    situation: `Riders sit ${CAROUSEL_RADIUS} m from the center of a carousel. Choose the time for one revolution so that they feel a centripetal acceleration of ${CAROUSEL_G} g (± ${CAROUSEL_TOLERANCE} s in the period).`,
    controls: [fixed("radius", "Radius", "m", CAROUSEL_RADIUS), slider("period", "Time per revolution", "s", 2, 15, 0.05, 10)],
    hint: "T = 2π√(r/a) with a = 0.5 × 9.81 m/s².",
  },
  {
    id: "the-drop-tower", title: "The drop tower", difficulty: "Intermediate", kind: "tower",
    situation: `Riders free-fall ${TOWER_HEIGHT} m, then magnetic brakes stop them. Choose the braking distance so they feel ${TOWER_TARGET_G} g (± ${TOWER_TOLERANCE} m of distance).`,
    controls: [fixed("height", "Free-fall height", "m", TOWER_HEIGHT), slider("distance", "Braking distance", "m", 5, 40, 0.1, 10)],
    hint: "After falling 40 m, v² = 2gh = 784. The g-force is 1 + v²/(2sg); for 3 g the deceleration is 2g, so s = v²/(4g).",
  },
  {
    id: "the-rotor", title: "The Rotor", difficulty: "Advanced", kind: "rotor",
    situation: `Riders stand against the wall of a drum of radius ${ROTOR_RADIUS} m (μ = ${ROTOR_FRICTION}). Set the spin rate in rpm so that the floor can drop safely: fast enough to hold everyone by friction, but no more than ${ROTOR_MARGIN * 100} % above the minimum to keep the g-force comfortable.`,
    controls: [fixed("radius", "Radius", "m", ROTOR_RADIUS), slider("rpm", "Spin rate", "rpm", 10, 60, 0.1, 20)],
    hint: "Friction μ m ω² r must at least equal m g, so ω = √(g/(μ r)); convert to rpm with 60/2π.",
  },
]);

export function runRide(round: RideRound, v: NumericControl): RideOutcome {
  if (round.kind === "carousel") {
    const period = v.period as number;
    const a = calculateCentripetalAcceleration(CAROUSEL_RADIUS, period);
    const truth = calculatePeriodForAcceleration(CAROUSEL_RADIUS, CAROUSEL_G * STANDARD_GRAVITY);
    const error = Math.abs(period - truth);
    const success = error <= CAROUSEL_TOLERANCE;
    return {
      gForce: a / STANDARD_GRAVITY, speed: (2 * Math.PI * CAROUSEL_RADIUS) / period, minimumRpm: null, success, accuracyFraction: success ? 1 - error / CAROUSEL_TOLERANCE : 0, predictionActual: truth,
      feedback: success ? `A ${period.toFixed(2)} s revolution moves riders at ${((2 * Math.PI * CAROUSEL_RADIUS) / period).toFixed(1)} m/s and gives a = 4π²r/T² = ${a.toFixed(2)} m/s², ${(a / STANDARD_GRAVITY).toFixed(2)} g.`
        : `${period.toFixed(2)} s gives ${(a / STANDARD_GRAVITY).toFixed(2)} g, ${a > CAROUSEL_G * STANDARD_GRAVITY ? "too intense: slow the carousel" : "too gentle: speed it up"}.`,
    };
  }
  if (round.kind === "tower") {
    const speed = calculateFreeFallSpeed(TOWER_HEIGHT);
    const distance = v.distance as number;
    const g = calculateBrakingGForce(speed, distance);
    const truth = speed ** 2 / (2 * (TOWER_TARGET_G - 1) * STANDARD_GRAVITY);
    const error = Math.abs(distance - truth);
    const success = error <= TOWER_TOLERANCE;
    return {
      gForce: g, speed, minimumRpm: null, success, accuracyFraction: success ? 1 - error / TOWER_TOLERANCE : 0, predictionActual: truth,
      feedback: success ? `After ${TOWER_HEIGHT} m of free fall the riders move at ${speed.toFixed(1)} m/s; braking over ${distance.toFixed(1)} m takes ${((speed ** 2) / (2 * distance * STANDARD_GRAVITY)).toFixed(1)} g of deceleration, so they feel ${g.toFixed(1)} g.`
        : `Braking over ${distance.toFixed(1)} m gives ${g.toFixed(1)} g, ${g > TOWER_TARGET_G ? "too harsh: lengthen the brake run" : "gentler than wanted: shorten it"}.`,
    };
  }
  const minimum = calculateRotorMinimumAngularSpeed(ROTOR_RADIUS, ROTOR_FRICTION);
  const minimumRpm = (minimum * 60) / (2 * Math.PI);
  const rpm = v.rpm as number;
  const g = calculateWallGForce(ROTOR_RADIUS, rpmToRadiansPerSecond(rpm));
  const success = rpm >= minimumRpm && rpm <= minimumRpm * (1 + ROTOR_MARGIN);
  return {
    gForce: g, speed: rpmToRadiansPerSecond(rpm) * ROTOR_RADIUS, minimumRpm, success, accuracyFraction: success ? 1 - (rpm - minimumRpm) / (minimumRpm * ROTOR_MARGIN) : 0, predictionActual: minimumRpm,
    feedback: success ? `At ${rpm.toFixed(1)} rpm the wall pushes with ${g.toFixed(2)} g and friction ${ROTOR_FRICTION} × ${g.toFixed(2)} = ${(ROTOR_FRICTION * g).toFixed(2)} weights holds everyone up. The minimum is ${minimumRpm.toFixed(1)} rpm.`
      : rpm < minimumRpm ? `At ${rpm.toFixed(1)} rpm friction supports only ${(ROTOR_FRICTION * g).toFixed(2)} of a rider's weight: they would slide down. The minimum is ${minimumRpm.toFixed(1)} rpm.`
      : `${rpm.toFixed(1)} rpm holds the riders, but at ${g.toFixed(2)} g it is more than ${ROTOR_MARGIN * 100} % faster than needed.`,
  };
}

export const amusementParkPhysics = defineNumericGame<RideRound, RideOutcome>({
  meta: RIDE_META,
  rounds: RIDE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "carousel" ? { label: "Your prediction of the period", unit: "s", placeholder: "e.g. 6.3", step: 0.01 }
    : round.kind === "tower" ? { label: "Your prediction of the braking distance", unit: "m", placeholder: "e.g. 20", step: 0.1 }
    : { label: "Your prediction of the minimum spin rate", unit: "rpm", placeholder: "e.g. 30", step: 0.1 },
  evaluate: (round, values) => runRide(round, values),
});
