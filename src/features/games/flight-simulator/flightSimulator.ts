import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { STANDARD_GRAVITY } from "../../../physics/core";
import {
  calculateBestGlideLiftCoefficient,
  calculateGlideRatio,
  calculateLevelFlightSpeed,
  calculateLift,
  calculateLiftCoefficient,
  calculateLiftSlope,
  calculateRequiredLiftCoefficient,
} from "../../../physics/fluids";

export type FlightKind = "takeoff" | "angle" | "glide";

export interface FlightRound extends NumericRound { readonly kind: FlightKind }

export interface FlightOutcome extends AttemptOutcome {
  readonly liftNewtons: number;
  readonly weightNewtons: number;
  readonly liftCoefficient: number;
  readonly requiredLiftCoefficient: number;
  readonly stalled: boolean;
  readonly glideRatio: number | null;
}

export const MASS = 1000;
export const WING_AREA = 16;
export const ASPECT_RATIO = 8;
export const MAXIMUM_LIFT_COEFFICIENT = 1.6;
export const PARASITIC_DRAG = 0.03;
export const EFFICIENCY = 0.8;
export const CRUISE_SPEED = 40;
export const STALL_SPEED = calculateLevelFlightSpeed(MASS, WING_AREA, MAXIMUM_LIFT_COEFFICIENT);
export const BEST_GLIDE_CL = calculateBestGlideLiftCoefficient(PARASITIC_DRAG, ASPECT_RATIO, EFFICIENCY);
export const BEST_GLIDE_SPEED = calculateLevelFlightSpeed(MASS, WING_AREA, BEST_GLIDE_CL);
export const BEST_GLIDE_RATIO = calculateGlideRatio(BEST_GLIDE_CL, PARASITIC_DRAG, ASPECT_RATIO, EFFICIENCY);
export const ANGLE_TOLERANCE_DEGREES = 0.3;
export const GLIDE_TOLERANCE = 0.98;

export const FLIGHT_META: RoundGameMeta = {
  id: "flight-simulator",
  title: "Flight Simulator",
  eyebrow: "FLUID MECHANICS · AERODYNAMICS",
  modelTag: "LIFT & DRAG OF A WING",
  introduction: "Fly a light aircraft by the numbers. Find the slowest speed at which the wing can lift the plane, the angle that holds it level at cruise speed, and the speed that makes it glide the farthest.",
  instructions: "Predict, set the controls and fly. The wing's lift must equal the plane's weight in level flight: faster air or a greater angle of attack both increase lift, until the wing stalls.",
  formula: "L = ½ρv²S·C_L  ·  C_L = a·α (α in radians, up to C_L,max)  ·  C_D = C_D0 + C_L²/(πeAR)",
  formulaCaption: "ρ is the air density, v the airspeed, S the wing area, α the angle of attack and AR the aspect ratio; the lift slope is a = 2π·AR/(AR+2). Drag has a part independent of lift (C_D0) and an induced part from producing lift, with span efficiency e.",
  explanation: "A wing lifts by turning the airflow downward, and the lift grows with the square of the speed and, up to the stall, in proportion to the angle of attack. To hold level flight at lower speed the pilot must raise the angle of attack, until the airflow separates from the wing at C_L,max and lift collapses: the stall. Drag has two parts: a parasitic part that rises with speed and an induced part, the price of making lift, that falls with speed. Flying slower than the speed where the two are equal wastes energy on induced drag, flying faster wastes it on parasitic drag, so there is a best-glide speed where the lift-to-drag ratio L/D is greatest.",
  assumptions: "A 1000 kg aircraft with a 16 m² wing of aspect ratio 8 in steady, level, low-speed flight at sea-level air density 1.225 kg/m³. A thin symmetric wing (no lift at zero angle), a sharp stall at C_L,max = 1.6, parasitic drag coefficient 0.03 and span efficiency 0.8. Propeller, fuselage, flaps and wind are not modelled; this is a teaching simplification, not a flight-test model.",
  learningObjectives: ["Use L = ½ρv²S·C_L to relate lift, speed and weight.", "Explain the stall and the role of angle of attack.", "Identify the best-glide speed from parasitic and induced drag."],
  objective: { title: "Complete the flight", description: "Pass every flight test.", unit: "tests" },
  controlsHeading: "Fly the aircraft",
  submitLabel: "Fly",
  solvedLabel: "Flight successful!",
  nextLabel: "Next flight",
};

export const FLIGHT_ROUNDS: readonly FlightRound[] = Object.freeze([
  {
    id: "lift-off", title: "Lift-off", difficulty: "Beginner", kind: "takeoff",
    situation: `At full flaps the wing reaches C_L = ${MAXIMUM_LIFT_COEFFICIENT}. Choose a takeoff speed that lifts the 1000 kg aircraft but not more than 1.5 m/s faster than the minimum (the stall speed).`,
    controls: [fixed("cl", "Lift coefficient", "", MAXIMUM_LIFT_COEFFICIENT), slider("speed", "Takeoff speed", "m/s", 10, 60, 0.5, 20)],
    hint: "Lift equals weight: ½ρv²S·C_L = m g. Solve for v.",
  },
  {
    id: "hold-the-altitude", title: "Hold the altitude", difficulty: "Intermediate", kind: "angle",
    situation: `At ${CRUISE_SPEED} m/s choose the angle of attack that gives exactly enough lift for level flight (± ${ANGLE_TOLERANCE_DEGREES}°). Too steep and the wing stalls.`,
    controls: [fixed("speed", "Airspeed", "m/s", CRUISE_SPEED), slider("angle", "Angle of attack", "°", 0, 20, 0.1, 3)],
    hint: "The needed C_L is 2mg/(ρv²S) ≈ 0.63; the wing gives C_L = 5.03 α for α in radians.",
  },
  {
    id: "the-longest-glide", title: "The longest glide", difficulty: "Advanced", kind: "glide",
    situation: `The engine has failed. Choose the airspeed that gives the best lift-to-drag ratio (within ${Math.round((1 - GLIDE_TOLERANCE) * 100)} % of the maximum) to glide the farthest. C_D0 = ${PARASITIC_DRAG}, e = ${EFFICIENCY}.`,
    controls: [slider("speed", "Airspeed", "m/s", 20, 80, 0.5, 50)],
    hint: "L/D is greatest when induced drag equals parasitic drag, at C_L = √(π e AR C_D0); then find the speed that gives that C_L in level flight.",
  },
]);

export function runFlight(round: FlightRound, v: NumericControl): FlightOutcome {
  const weight = MASS * STANDARD_GRAVITY;
  if (round.kind === "takeoff") {
    const speed = v.speed as number;
    const cl = v.cl as number;
    const lift = calculateLift(speed, WING_AREA, cl);
    const success = speed >= STALL_SPEED && speed <= STALL_SPEED + 1.5;
    return {
      liftNewtons: lift, weightNewtons: weight, liftCoefficient: cl, requiredLiftCoefficient: calculateRequiredLiftCoefficient(MASS, speed, WING_AREA), stalled: false, glideRatio: null,
      success, accuracyFraction: success ? 1 - (speed - STALL_SPEED) / 1.5 : 0, predictionActual: STALL_SPEED,
      feedback: success ? `At ${speed} m/s the wing produces ${(lift / 1000).toFixed(2)} kN against a weight of ${(weight / 1000).toFixed(2)} kN. The stall speed is ${STALL_SPEED.toFixed(1)} m/s.`
        : speed < STALL_SPEED ? `Lift is only ${(lift / 1000).toFixed(2)} kN, less than the ${(weight / 1000).toFixed(2)} kN weight: the aircraft cannot leave the ground at ${speed} m/s.`
        : `The aircraft lifts off, but ${speed} m/s is ${(speed - STALL_SPEED).toFixed(1)} m/s above the minimum of ${STALL_SPEED.toFixed(1)} m/s: a needlessly long runway.`,
    };
  }
  if (round.kind === "angle") {
    const speed = v.speed as number;
    const angle = v.angle as number;
    const required = calculateRequiredLiftCoefficient(MASS, speed, WING_AREA);
    const { value, stalled } = calculateLiftCoefficient((angle * Math.PI) / 180, ASPECT_RATIO, MAXIMUM_LIFT_COEFFICIENT);
    const target = (required / calculateLiftSlope(ASPECT_RATIO)) * (180 / Math.PI);
    const error = Math.abs(angle - target);
    const success = !stalled && error <= ANGLE_TOLERANCE_DEGREES;
    return {
      liftNewtons: calculateLift(speed, WING_AREA, value), weightNewtons: weight, liftCoefficient: value, requiredLiftCoefficient: required, stalled, glideRatio: null,
      success, accuracyFraction: success ? 1 - error / ANGLE_TOLERANCE_DEGREES : 0, predictionActual: target,
      feedback: success ? `C_L = ${value.toFixed(3)} at ${angle.toFixed(1)}° gives lift ${(calculateLift(speed, WING_AREA, value) / 1000).toFixed(2)} kN, matching the weight: level flight.`
        : stalled ? `${angle.toFixed(1)}° is beyond the stall angle (${((MAXIMUM_LIFT_COEFFICIENT / calculateLiftSlope(ASPECT_RATIO)) * (180 / Math.PI)).toFixed(1)}°): the airflow separates and lift collapses.`
        : `C_L = ${value.toFixed(3)} gives ${(calculateLift(speed, WING_AREA, value) / 1000).toFixed(2)} kN of lift: the aircraft ${value < required ? "sinks" : "climbs"}. It needs C_L = ${required.toFixed(3)}.`,
    };
  }
  const speed = v.speed as number;
  const cl = calculateRequiredLiftCoefficient(MASS, speed, WING_AREA);
  const stalled = cl > MAXIMUM_LIFT_COEFFICIENT;
  const ratio = stalled ? 0 : calculateGlideRatio(cl, PARASITIC_DRAG, ASPECT_RATIO, EFFICIENCY);
  const success = !stalled && ratio >= GLIDE_TOLERANCE * BEST_GLIDE_RATIO;
  return {
    liftNewtons: weight, weightNewtons: weight, liftCoefficient: cl, requiredLiftCoefficient: cl, stalled, glideRatio: stalled ? null : ratio,
    success, accuracyFraction: success ? 1 - Math.abs(speed - BEST_GLIDE_SPEED) / 4 : 0, predictionActual: BEST_GLIDE_SPEED,
    feedback: success ? `At ${speed} m/s, C_L = ${cl.toFixed(2)} and L/D = ${ratio.toFixed(1)}, within ${Math.round((1 - GLIDE_TOLERANCE) * 100)} % of the best ${BEST_GLIDE_RATIO.toFixed(1)}: from 1000 m the plane glides ${(ratio).toFixed(1)} km.`
      : stalled ? `At ${speed} m/s the wing would need C_L = ${cl.toFixed(2)}, above its maximum ${MAXIMUM_LIFT_COEFFICIENT}: the plane stalls.`
      : `L/D = ${ratio.toFixed(1)} at ${speed} m/s, ${speed > BEST_GLIDE_SPEED ? "too fast: parasitic drag dominates" : "too slow: induced drag dominates"}. The best is ${BEST_GLIDE_RATIO.toFixed(1)}.`,
  };
}

export const flightSimulator = defineNumericGame<FlightRound, FlightOutcome>({
  meta: FLIGHT_META,
  rounds: FLIGHT_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "takeoff" ? { label: "Your prediction of the stall speed", unit: "m/s", placeholder: "e.g. 25", step: 0.1 }
    : round.kind === "angle" ? { label: "Your prediction of the angle of attack", unit: "°", placeholder: "e.g. 7", step: 0.1 }
    : { label: "Your prediction of the best-glide speed", unit: "m/s", placeholder: "e.g. 36", step: 0.1 },
  evaluate: (round, values) => runFlight(round, values),
});
