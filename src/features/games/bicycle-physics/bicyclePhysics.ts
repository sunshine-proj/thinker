import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateBicycleSpeed,
  calculateDriveForce,
  calculateRiderPower,
  calculateSpeedForPower,
  calculateWheelTorque,
  type RideParameters,
} from "../../../physics/mechanics";

export type BikeKind = "gear" | "climb" | "aero";

export interface BikeRound extends NumericRound { readonly kind: BikeKind }

export interface BikeOutcome extends AttemptOutcome {
  readonly speedKmh: number;
  readonly powerWatts: number | null;
  readonly wheelTorque: number;
  readonly driveForce: number;
}

export const FRONT_TEETH = 48;
export const CADENCE = 90;
export const WHEEL_CIRCUMFERENCE = 2.1;
export const WHEEL_RADIUS = 0.33;
export const PEDAL_TORQUE = 40;
export const GEAR_TARGET_KMH = 25;
export const GEAR_TOLERANCE_KMH = 1;
export const CLIMB: RideParameters = { massKg: 85, rollingResistance: 0.005, dragArea: 0.35, grade: 0.06 };
export const CLIMB_POWER = 200;
export const CLIMB_TOLERANCE = 10;
export const FLAT: Omit<RideParameters, "dragArea"> = { massKg: 80, rollingResistance: 0.004, grade: 0 };
export const FLAT_SPEED_KMH = 40;
export const FLAT_POWER = 250;
export const FLAT_TOLERANCE = 8;

export const BIKE_META: RoundGameMeta = {
  id: "bicycle-physics",
  title: "Bicycle Physics",
  eyebrow: "EVERYDAY PHYSICS · CYCLING",
  modelTag: "GEARS, TORQUE & POWER",
  introduction: "Ride by the numbers. Pick the sprocket that holds a target speed at a steady cadence, find the speed you can climb a hill on 200 W, and tuck into the right riding position to hold 40 km/h on 250 W.",
  instructions: "Predict, set the control and ride. Gears trade speed for force, and what limits you is power: you must overcome rolling resistance, gravity on a slope, and air drag, which grows as the cube of speed.",
  formula: "v = cadence × (T_f/T_r) × C  ·  τ_wheel = τ_pedal × T_f/T_r  ·  P = v (C_rr m g cosθ + m g sinθ + ½ρ C_dA v²)/η",
  formulaCaption: "T_f and T_r are the teeth on the front chainring and rear sprocket, C the wheel circumference, C_rr the rolling-resistance coefficient, m the mass of rider and bike, C_dA the drag area, ρ the air density and η the drivetrain efficiency.",
  explanation: "A bicycle gear works like a lever: a small rear sprocket makes the wheel turn faster for each pedal turn, so the speed rises but the torque at the wheel, and thus the push on the road, falls by the same ratio. The rider's limit is power, force times speed. On a climb most of it fights gravity, so the speed is low and almost proportional to the power. On the flat at speed, air drag takes over: its force rises as v² and so the power needed rises as v³, so doubling the speed takes eight times the power, which is why cyclists crouch to cut their drag area.",
  assumptions: "Steady speed with no acceleration, still air at 1.225 kg/m³, constant rolling resistance (0.005 climbing, 0.004 flat), a drivetrain efficiency of 97 %, and a 48-tooth chainring with a 2.10 m wheel at 90 rpm. Wind, braking, and the energy stored in the spinning wheels are ignored.",
  learningObjectives: ["Relate gear teeth, cadence and wheel size to speed.", "Explain how a gear trades speed against torque.", "Compute the power needed to overcome rolling resistance, gravity and air drag."],
  objective: { title: "Finish the ride", description: "Complete each stage.", unit: "stages" },
  controlsHeading: "Set up the bike",
  submitLabel: "Start riding",
  solvedLabel: "Stage complete!",
  nextLabel: "Next stage",
};

export const BIKE_ROUNDS: readonly BikeRound[] = Object.freeze([
  {
    id: "choose-the-gear", title: "Choose the gear", difficulty: "Beginner", kind: "gear",
    situation: `With the ${FRONT_TEETH}-tooth chainring, a cadence of ${CADENCE} rpm and a ${WHEEL_CIRCUMFERENCE} m wheel, choose the rear sprocket that gives a speed of ${GEAR_TARGET_KMH} km/h (± ${GEAR_TOLERANCE_KMH} km/h).`,
    controls: [fixed("front", "Chainring teeth", "", FRONT_TEETH), slider("rear", "Rear sprocket teeth", "", 11, 34, 1, 15)],
    hint: "v = (cadence/60)(T_f/T_r) C. Solve for T_r with v = 25/3.6 m/s.",
  },
  {
    id: "up-the-hill", title: "Up the hill", difficulty: "Intermediate", kind: "climb",
    situation: `A rider and bike of ${CLIMB.massKg} kg climb a ${CLIMB.grade * 100} % grade. At what steady speed does the rider need ${CLIMB_POWER} W at the pedals (± ${CLIMB_TOLERANCE} W)? C_rr = ${CLIMB.rollingResistance}, C_dA = ${CLIMB.dragArea} m².`,
    controls: [fixed("grade", "Gradient", "%", CLIMB.grade * 100), slider("speed", "Speed", "km/h", 3, 40, 0.1, 20)],
    hint: "At low speed the force is mostly m g sinθ ≈ 50 N, so P ≈ F v / 0.97 and v is about 3.5 m/s.",
  },
  {
    id: "the-time-trial", title: "The time trial", difficulty: "Advanced", kind: "aero",
    situation: `On a flat road a ${FLAT.massKg} kg rider must hold ${FLAT_SPEED_KMH} km/h on ${FLAT_POWER} W (± ${FLAT_TOLERANCE} W). Choose the riding position by its drag area C_dA.`,
    controls: [fixed("speed", "Speed", "km/h", FLAT_SPEED_KMH), slider("dragArea", "Drag area C_dA", "m²", 0.15, 0.5, 0.005, 0.4)],
    hint: "P·η = v (C_rr m g + ½ρ C_dA v²). Solve for C_dA with v = 11.1 m/s.",
  },
]);

export function runBike(round: BikeRound, v: NumericControl): BikeOutcome {
  const common = (ratioRear: number) => ({ wheelTorque: calculateWheelTorque(PEDAL_TORQUE, FRONT_TEETH, ratioRear), driveForce: calculateDriveForce(calculateWheelTorque(PEDAL_TORQUE, FRONT_TEETH, ratioRear), WHEEL_RADIUS) });
  if (round.kind === "gear") {
    const rear = v.rear as number;
    const speed = calculateBicycleSpeed(CADENCE, FRONT_TEETH, rear, WHEEL_CIRCUMFERENCE) * 3.6;
    const error = Math.abs(speed - GEAR_TARGET_KMH);
    const success = error <= GEAR_TOLERANCE_KMH;
    return {
      speedKmh: speed, powerWatts: null, ...common(rear), success, accuracyFraction: success ? 1 - error / GEAR_TOLERANCE_KMH : 0,
      predictionActual: (CADENCE / 60) * FRONT_TEETH * WHEEL_CIRCUMFERENCE / (GEAR_TARGET_KMH / 3.6),
      feedback: success ? `${FRONT_TEETH}/${rear} turns the wheel ${(FRONT_TEETH / rear).toFixed(2)} times per pedal turn: ${speed.toFixed(1)} km/h. The wheel torque is ${(PEDAL_TORQUE * FRONT_TEETH / rear).toFixed(0)} N·m for ${PEDAL_TORQUE} N·m at the pedals.`
        : `${FRONT_TEETH}/${rear} gives ${speed.toFixed(1)} km/h, ${speed > GEAR_TARGET_KMH ? "too fast: use a bigger sprocket" : "too slow: use a smaller sprocket"}.`,
    };
  }
  if (round.kind === "climb") {
    const speed = (v.speed as number) / 3.6;
    const power = calculateRiderPower(speed, CLIMB);
    const error = Math.abs(power - CLIMB_POWER);
    const success = error <= CLIMB_TOLERANCE;
    return {
      speedKmh: speed * 3.6, powerWatts: power, ...common(22), success, accuracyFraction: success ? 1 - error / CLIMB_TOLERANCE : 0, predictionActual: calculateSpeedForPower(CLIMB_POWER, CLIMB) * 3.6,
      feedback: success ? `At ${(speed * 3.6).toFixed(1)} km/h the rider overcomes gravity, rolling and drag with ${power.toFixed(0)} W, using about ${(CLIMB.massKg * 9.80665 * Math.sin(Math.atan(CLIMB.grade)) * speed / 0.97).toFixed(0)} W just to lift the weight.`
        : `${(speed * 3.6).toFixed(1)} km/h needs ${power.toFixed(0)} W, ${power > CLIMB_POWER ? "more" : "less"} than the 200 W available.`,
    };
  }
  const dragArea = v.dragArea as number;
  const speed = (v.speed as number) / 3.6;
  const power = calculateRiderPower(speed, { ...FLAT, dragArea });
  const error = Math.abs(power - FLAT_POWER);
  const truth = (2 * ((FLAT_POWER * 0.97) / speed - FLAT.rollingResistance * FLAT.massKg * 9.80665)) / (1.225 * speed ** 2);
  const success = error <= FLAT_TOLERANCE;
  return {
    speedKmh: speed * 3.6, powerWatts: power, ...common(15), success, accuracyFraction: success ? 1 - error / FLAT_TOLERANCE : 0, predictionActual: truth,
    feedback: success ? `With C_dA = ${dragArea.toFixed(3)} m² the air drag is ${(0.5 * 1.225 * dragArea * speed ** 2).toFixed(1)} N, and holding ${FLAT_SPEED_KMH} km/h takes ${power.toFixed(0)} W.`
      : `C_dA = ${dragArea.toFixed(3)} m² needs ${power.toFixed(0)} W at ${FLAT_SPEED_KMH} km/h, ${power > FLAT_POWER ? "too much: tuck in tighter" : "less than needed"}.`,
  };
}

export const bicyclePhysics = defineNumericGame<BikeRound, BikeOutcome>({
  meta: BIKE_META,
  rounds: BIKE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "gear" ? { label: "Your prediction of the sprocket teeth", unit: "", placeholder: "e.g. 22", step: 0.1 }
    : round.kind === "climb" ? { label: "Your prediction of the climbing speed", unit: "km/h", placeholder: "e.g. 12", step: 0.1 }
    : { label: "Your prediction of the drag area", unit: "m²", placeholder: "e.g. 0.25", step: 0.001 },
  evaluate: (round, values) => runBike(round, values),
});
