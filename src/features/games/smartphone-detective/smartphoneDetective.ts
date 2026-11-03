import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateDistanceForIlluminance,
  calculateIlluminance,
  calculateRotationAngleDegrees,
  calculateTiltFromReading,
  calculateTiltedAccelerometerReading,
} from "../../../physics/mechanics";

export type SensorKind = "tilt" | "gyro" | "light";

export interface SensorRound extends NumericRound { readonly kind: SensorKind }

export interface SensorOutcome extends AttemptOutcome {
  readonly reading: number;
  readonly unit: string;
  readonly truth: number;
}

export const TILT_READING = 4.9;
export const TILT_TOLERANCE = 1;
export const GYRO_RATE = 90;
export const GYRO_TIME = 2;
export const GYRO_TOLERANCE = 3;
export const LIGHT_INTENSITY = 400;
export const LIGHT_TARGET = 100;
export const LIGHT_TOLERANCE = 0.03;

export const SENSOR_META: RoundGameMeta = {
  id: "smartphone-detective",
  title: "Smartphone Detective",
  eyebrow: "EVERYDAY PHYSICS · SENSORS",
  modelTag: "ACCELEROMETER, GYROSCOPE & LIGHT SENSOR",
  introduction: "Your phone is full of physics. Work out how it is tilted from its accelerometer, how far it turned from its gyroscope, and how far it is from a lamp from its light sensor.",
  instructions: "Predict, then solve the case. Each sensor measures one physical quantity: the accelerometer a force per mass, the gyroscope a rotation rate, and the light sensor the illuminance. Reason from the reading back to the situation.",
  formula: "a_x = g sinθ  ·  θ = ω t  ·  E = I cosφ / d²",
  formulaCaption: "a_x is the accelerometer reading along an axis of a phone tilted by θ, ω the gyroscope's angular rate, t the time and θ the angle turned. E is the illuminance in lux of a lamp of intensity I at distance d, seen at an angle φ from the sensor's normal.",
  explanation: "An accelerometer is a tiny mass on springs: it measures the force needed to keep the mass accelerating with the phone, which is why a phone lying still reads 1 g upward, and one in free fall reads zero. Tilting the phone moves part of that reading onto another axis, so a reading of half of g means a tilt of 30°. A gyroscope measures how fast the phone turns, and adding up the rate over time gives the angle. A light sensor measures how much light falls on it per area; for a small lamp this falls with the square of the distance, so doubling the distance gives a quarter of the light.",
  assumptions: "Ideal noise-free sensors without drift, a phone that is not accelerating while tilted, a constant rotation rate, a point-like lamp in a dark room, and a sensor facing the lamp (so cos φ = 1). Real gyroscopes drift and accelerometers are corrected by sensor fusion in the phone.",
  learningObjectives: ["Interpret an accelerometer reading as a tilt angle.", "Integrate an angular rate to find a rotation angle.", "Apply the inverse-square law to a light sensor reading."],
  objective: { title: "Crack the cases", description: "Solve every sensor case.", unit: "cases" },
  controlsHeading: "Your deduction",
  submitLabel: "Check the deduction",
  solvedLabel: "Case solved!",
  nextLabel: "Next case",
};

export const SENSOR_ROUNDS: readonly SensorRound[] = Object.freeze([
  {
    id: "the-tilted-phone", title: "The tilted phone", difficulty: "Beginner", kind: "tilt",
    situation: `The phone rests on a ramp. Its accelerometer reads ${TILT_READING} m/s² along the long edge (the phone is not accelerating). By what angle is the ramp tilted? (± ${TILT_TOLERANCE}°)`,
    controls: [fixed("reading", "Accelerometer reading", "m/s²", TILT_READING), slider("angle", "Tilt angle", "°", 0, 90, 0.1, 10)],
    hint: "a = g sinθ, so θ = arcsin(4.9/9.81).",
  },
  {
    id: "the-turning-phone", title: "The turning phone", difficulty: "Intermediate", kind: "gyro",
    situation: `The gyroscope reads a steady ${GYRO_RATE}°/s for ${GYRO_TIME} s while a phone is turned in a game. Through what angle did the phone rotate? (± ${GYRO_TOLERANCE}°)`,
    controls: [fixed("rate", "Gyroscope reading", "°/s", GYRO_RATE), fixed("time", "Duration", "s", GYRO_TIME), slider("angle", "Rotation angle", "°", 0, 400, 1, 100)],
    hint: "Angle = rate × time.",
  },
  {
    id: "the-lamp-distance", title: "The lamp distance", difficulty: "Advanced", kind: "light",
    situation: `A lamp of intensity ${LIGHT_INTENSITY} cd gives ${LIGHT_INTENSITY} lx at 1 m. Where must you hold the phone for its light sensor to read ${LIGHT_TARGET} lx (± ${LIGHT_TOLERANCE * 100} % in distance)?`,
    controls: [fixed("intensity", "Lamp intensity", "cd", LIGHT_INTENSITY), slider("distance", "Distance from the lamp", "m", 0.5, 5, 0.01, 1)],
    hint: "E = I/d². Four times less light means twice the distance.",
  },
]);

export function runSensor(round: SensorRound, v: NumericControl): SensorOutcome {
  if (round.kind === "tilt") {
    const truth = calculateTiltFromReading(TILT_READING);
    const angle = v.angle as number;
    const reading = calculateTiltedAccelerometerReading(angle);
    const error = Math.abs(angle - truth);
    const success = error <= TILT_TOLERANCE;
    return {
      reading, unit: "m/s²", truth, success, accuracyFraction: success ? 1 - error / TILT_TOLERANCE : 0, predictionActual: truth,
      feedback: success ? `g sin ${angle.toFixed(1)}° = ${reading.toFixed(2)} m/s², matching the ${TILT_READING} m/s² reading: a ${truth.toFixed(1)}° tilt. Lying flat the phone would read 0 on this axis, and standing upright 9.81.`
        : `A ${angle.toFixed(1)}° tilt would read ${reading.toFixed(2)} m/s², ${reading > TILT_READING ? "more" : "less"} than the ${TILT_READING} m/s² measured.`,
    };
  }
  if (round.kind === "gyro") {
    const truth = calculateRotationAngleDegrees(GYRO_RATE, GYRO_TIME);
    const angle = v.angle as number;
    const error = Math.abs(angle - truth);
    const success = error <= GYRO_TOLERANCE;
    return {
      reading: GYRO_RATE, unit: "°/s", truth, success, accuracyFraction: success ? 1 - error / GYRO_TOLERANCE : 0, predictionActual: truth,
      feedback: success ? `${GYRO_RATE}°/s for ${GYRO_TIME} s is ${truth}°: half a turn.` : `${angle}° does not match ${GYRO_RATE}°/s × ${GYRO_TIME} s = ${truth}°.`,
    };
  }
  const truth = calculateDistanceForIlluminance(LIGHT_INTENSITY, LIGHT_TARGET);
  const distance = v.distance as number;
  const lux = calculateIlluminance(LIGHT_INTENSITY, distance);
  const error = Math.abs(distance - truth) / truth;
  const success = error <= LIGHT_TOLERANCE;
  return {
    reading: lux, unit: "lx", truth, success, accuracyFraction: success ? 1 - error / LIGHT_TOLERANCE : 0, predictionActual: truth,
    feedback: success ? `At ${distance.toFixed(2)} m the sensor reads ${lux.toFixed(0)} lx: E = I/d² = 400/${(distance * distance).toFixed(2)}.`
      : `At ${distance.toFixed(2)} m the sensor reads ${lux.toFixed(0)} lx, ${lux > LIGHT_TARGET ? "too bright: move away" : "too dim: come closer"}.`,
  };
}

export const smartphoneDetective = defineNumericGame<SensorRound, SensorOutcome>({
  meta: SENSOR_META,
  rounds: SENSOR_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "tilt" ? { label: "Your prediction of the tilt angle", unit: "°", placeholder: "e.g. 30", step: 0.1 }
    : round.kind === "gyro" ? { label: "Your prediction of the rotation angle", unit: "°", placeholder: "e.g. 180", step: 1 }
    : { label: "Your prediction of the distance", unit: "m", placeholder: "e.g. 2", step: 0.01 },
  evaluate: (round, values) => runSensor(round, values),
});

