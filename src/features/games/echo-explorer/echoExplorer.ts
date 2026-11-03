import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateEchoDelay,
  calculateEchoDistance,
  calculateSpeedOfSound,
  calculateTemperatureFromSpeed,
} from "../../../physics/waves";

export type EchoKind = "distance" | "cold" | "temperature";

export interface EchoRound extends NumericRound { readonly kind: EchoKind }

export interface EchoOutcome extends AttemptOutcome {
  readonly speedOfSound: number;
  readonly distanceMeters: number;
  readonly delaySeconds: number;
  readonly temperatureCelsius: number;
}

export const CANYON_DELAY = 1.8;
export const COLD_DELAY = 2.4;
export const COLD_TEMPERATURE = -10;
export const WALL_DISTANCE = 100;
export const SOUND_DELAY = 0.573;
export const DISTANCE_TOLERANCE = 5;
export const COLD_TOLERANCE = 8;
export const TEMPERATURE_TOLERANCE = 1.5;

export const ECHO_META: RoundGameMeta = {
  id: "echo-explorer",
  title: "Echo Explorer",
  eyebrow: "WAVES & SOUND · ECHOES",
  modelTag: "SPEED OF SOUND & REFLECTION",
  introduction: "Shout at a canyon wall and time the echo. Find how far away it is, learn why a cold morning changes the answer, and use an echo to measure the air's temperature.",
  instructions: "Predict, then set your estimate and check it against the physics. Sound travels to the wall and back, so the echo covers twice the distance, and the speed of sound depends on the air temperature.",
  formula: "v = √(γRT/M)  ·  t = 2d / v",
  formulaCaption: "v is the speed of sound, γ = 1.4 the adiabatic index of air, R the gas constant, T the absolute temperature in kelvin, M the molar mass of air, d the distance to the wall and t the echo delay.",
  explanation: "An echo is a sound wave reflected from a surface. It travels to the wall and back, a total of 2d, at the speed of sound, so d = vt/2. Sound is a pressure disturbance passed between molecules, so its speed depends on how fast the molecules move: v = √(γRT/M), about 331 m/s at 0 °C and 343 m/s at 20 °C. In cold air the same delay therefore means a shorter distance, and a measured echo from a known wall can reveal the air temperature. To hear an echo as separate from the original sound the delay must be about 0.1 s or more, a wall at least 17 m away.",
  assumptions: "Dry air as an ideal gas, still air with no wind, a single flat wall that reflects perfectly, and the same temperature along the whole path. Humidity, which raises the speed slightly, is ignored.",
  learningObjectives: ["Use t = 2d/v to turn an echo delay into a distance.", "Explain how the speed of sound depends on air temperature.", "Use a known distance and a measured delay to find the temperature."],
  objective: { title: "Explore every echo", description: "Solve each echo problem.", unit: "echoes" },
  controlsHeading: "Make your estimate",
  submitLabel: "Check the echo",
  solvedLabel: "Echo explained!",
  nextLabel: "Next echo",
};

export const ECHO_ROUNDS: readonly EchoRound[] = Object.freeze([
  {
    id: "the-canyon", title: "The canyon wall", difficulty: "Beginner", kind: "distance",
    situation: `You shout across a canyon on a ${20} °C day and hear the echo after ${CANYON_DELAY} s. How far away is the wall? Be within ${DISTANCE_TOLERANCE} m.`,
    controls: [fixed("temperature", "Air temperature", "°C", 20), fixed("delay", "Echo delay", "s", CANYON_DELAY), slider("distance", "Estimated distance to the wall", "m", 50, 600, 1, 200)],
    hint: "Sound goes to the wall and back, so d = v t / 2. At 20 °C the speed of sound is about 343 m/s.",
  },
  {
    id: "the-cold-morning", title: "A cold morning", difficulty: "Intermediate", kind: "cold",
    situation: `On a frosty ${COLD_TEMPERATURE} °C morning the echo returns after ${COLD_DELAY} s. Sound is slower in cold air, so use the right speed and find the distance within ${COLD_TOLERANCE} m.`,
    controls: [fixed("temperature", "Air temperature", "°C", COLD_TEMPERATURE), fixed("delay", "Echo delay", "s", COLD_DELAY), slider("distance", "Estimated distance to the wall", "m", 100, 700, 1, 400)],
    hint: "v = 331.3 × √(1 + T/273.15) is about 325 m/s at −10 °C. Then d = v t / 2.",
  },
  {
    id: "the-thermometer", title: "The sound thermometer", difficulty: "Advanced", kind: "temperature",
    situation: `A wall is exactly ${WALL_DISTANCE} m away and its echo comes back after ${SOUND_DELAY} s. What is the air temperature, to within ${TEMPERATURE_TOLERANCE} °C?`,
    controls: [fixed("distance", "Distance to the wall", "m", WALL_DISTANCE), fixed("delay", "Echo delay", "s", SOUND_DELAY), slider("temperature", "Estimated air temperature", "°C", -20, 50, 0.5, 10)],
    hint: "First find the speed: v = 2d/t. Then solve v = √(γRT/M) for T, or compare with 343 m/s at 20 °C.",
  },
]);

export function runEcho(round: EchoRound, v: NumericControl): EchoOutcome {
  if (round.kind === "temperature") {
    const guess = v.temperature as number;
    const trueSpeed = (2 * (v.distance as number)) / (v.delay as number);
    const trueTemperature = calculateTemperatureFromSpeed(trueSpeed);
    const error = Math.abs(guess - trueTemperature);
    const success = error <= TEMPERATURE_TOLERANCE;
    const speed = calculateSpeedOfSound(guess);
    return {
      speedOfSound: speed, distanceMeters: v.distance as number, delaySeconds: v.delay as number, temperatureCelsius: guess,
      success, accuracyFraction: success ? 1 - error / TEMPERATURE_TOLERANCE : 0, predictionActual: trueSpeed,
      feedback: success ? `The echo gives v = 2 × ${v.distance} m / ${v.delay} s = ${trueSpeed.toFixed(1)} m/s, which is the speed of sound at ${trueTemperature.toFixed(1)} °C.`
        : `At ${guess.toFixed(1)} °C sound travels at ${speed.toFixed(1)} m/s, so a 100 m echo would take ${calculateEchoDelay(WALL_DISTANCE, speed).toFixed(3)} s, not ${SOUND_DELAY} s. The air is ${guess > trueTemperature ? "colder" : "warmer"} than that.`,
    };
  }
  const temperature = v.temperature as number;
  const delay = v.delay as number;
  const speed = calculateSpeedOfSound(temperature);
  const truth = calculateEchoDistance(delay, speed);
  const guess = v.distance as number;
  const tolerance = round.kind === "distance" ? DISTANCE_TOLERANCE : COLD_TOLERANCE;
  const error = Math.abs(guess - truth);
  const success = error <= tolerance;
  return {
    speedOfSound: speed, distanceMeters: guess, delaySeconds: delay, temperatureCelsius: temperature,
    success, accuracyFraction: success ? 1 - error / tolerance : 0, predictionActual: truth,
    feedback: success ? `At ${temperature} °C sound travels at ${speed.toFixed(1)} m/s, so in ${delay} s it covers ${(speed * delay).toFixed(0)} m there and back: the wall is ${truth.toFixed(0)} m away.`
      : `Your ${guess.toFixed(0)} m is ${error.toFixed(0)} m off. At ${temperature} °C the speed of sound is ${speed.toFixed(1)} m/s, so the wall is d = vt/2 = ${truth.toFixed(0)} m away${round.kind === "cold" && Math.abs(guess - (343 * delay) / 2) <= tolerance ? " (343 m/s is the speed at 20 °C, not today's)" : ""}.`,
  };
}

export const echoExplorer = defineNumericGame<EchoRound, EchoOutcome>({
  meta: ECHO_META,
  rounds: ECHO_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "temperature" ? { label: "Your prediction of the speed of sound", unit: "m/s", placeholder: "e.g. 349", step: 0.1 }
    : { label: "Your prediction of the distance to the wall", unit: "m", placeholder: "e.g. 300", step: 1 },
  evaluate: (round, values) => runEcho(round, values),
});
