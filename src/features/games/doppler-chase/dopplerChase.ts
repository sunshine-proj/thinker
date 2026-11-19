import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateDopplerFrequency, calculateRestFrequencyFromShift, calculateSourceSpeedFromShift, calculateSpeedOfSound } from "../../../physics/waves";

export type DopplerKind = "approach" | "passby" | "cyclist";
export interface DopplerRound extends NumericRound { readonly kind: DopplerKind }
export interface DopplerOutcome extends AttemptOutcome { readonly heardHz: number; readonly sourceHz: number }

export const AIR_TEMPERATURE = 20;
export const SOUND_SPEED = calculateSpeedOfSound(AIR_TEMPERATURE);
export const AMBULANCE = { sirenHz: 700, heardHz: 760, toleranceHz: 2 } as const;
export const PASSBY = { approachHz: 750, recedeHz: 650, toleranceMs: 0.5 } as const;
export const CYCLIST = { sirenHz: 500, heardHz: 520, toleranceMs: 0.3 } as const;

export const DOPPLER_META: RoundGameMeta = {
  id: "doppler-chase",
  title: "Doppler Chase",
  eyebrow: "WAVES & SOUND · DOPPLER EFFECT",
  modelTag: "MOVING SOURCES & OBSERVERS",
  introduction: "A siren's pitch rises as it comes towards you and falls as it rushes away. Use your ears like a speed gun: set an ambulance's speed to match the pitch you hear, work out how fast a car passed from two notes, and find how fast a cyclist rides towards an alarm.",
  instructions: "Predict, then set the speed. Listen with the play buttons if you like; every answer can also be found from the numbers. A source moving towards you squeezes its waves together, so you hear a higher frequency.",
  formula: "f′ = f (v + v_o) / (v − v_s)",
  formulaCaption: "f is the emitted frequency, f′ the frequency heard, v ≈ 343 m/s the speed of sound in air at 20 °C, v_o the observer's speed towards the source and v_s the source's speed towards the observer.",
  explanation: "Sound travels through the air at a fixed speed. A source moving towards you emits each crest a little closer to the previous one, so the waves arrive bunched up and the pitch is higher; moving away, they stretch out and the pitch drops. If you move towards the source, you meet the crests more often, which also raises the pitch, though by a slightly different formula. Comparing the approaching and receding notes of a passing car gives its speed without knowing the true siren pitch. Astronomers use the same effect for light: the red-shift of galaxies tells us how fast they recede.",
  assumptions: "Still air at 20 °C (sound at 343 m/s), motion along the straight line between source and listener, and speeds well below the speed of sound. Wind and the angle of a passing vehicle are ignored.",
  learningObjectives: ["Calculate the frequency heard from a moving source.", "Find a source's speed from approaching and receding pitches.", "Compare moving sources with moving observers."],
  objective: { title: "Catch the speeders", description: "Solve every Doppler case.", unit: "cases" },
  controlsHeading: "Your speed",
  submitLabel: "Listen",
  solvedLabel: "Speed confirmed!",
  nextLabel: "Next case",
};

export const DOPPLER_ROUNDS: readonly DopplerRound[] = Object.freeze([
  {
    id: "approaching-ambulance", title: "The approaching ambulance", difficulty: "Beginner", kind: "approach",
    situation: `An ambulance siren sounds at ${AMBULANCE.sirenHz} Hz. As it drives straight towards you, you hear ${AMBULANCE.heardHz} Hz. Set its speed so the pitch matches (± ${AMBULANCE.toleranceHz} Hz).`,
    controls: [fixed("siren", "Siren frequency", "Hz", AMBULANCE.sirenHz), slider("speed", "Ambulance speed", "m/s", 0, 60, 0.1, 10)],
    hint: "f′ = f v/(v − v_s), so v_s = v (1 − f/f′).",
  },
  {
    id: "passing-car", title: "The passing car", difficulty: "Intermediate", kind: "passby",
    situation: `A car's horn sounds ${PASSBY.approachHz} Hz as it approaches and ${PASSBY.recedeHz} Hz after it passes. How fast is it going? (± ${PASSBY.toleranceMs} m/s)`,
    controls: [slider("speed", "Car speed", "m/s", 0, 60, 0.1, 10)],
    hint: "Divide the two Doppler formulas: f_a/f_r = (v + v_s)/(v − v_s).",
  },
  {
    id: "riding-to-the-alarm", title: "Riding to the alarm", difficulty: "Advanced", kind: "cyclist",
    situation: `A fire alarm sounds at ${CYCLIST.sirenHz} Hz. A cyclist riding straight towards it hears ${CYCLIST.heardHz} Hz. How fast are they riding? (± ${CYCLIST.toleranceMs} m/s)`,
    controls: [fixed("siren", "Alarm frequency", "Hz", CYCLIST.sirenHz), slider("speed", "Cyclist speed", "m/s", 0, 30, 0.05, 5)],
    hint: "For a moving observer f′ = f (v + v_o)/v.",
  },
]);

export function runDoppler(round: DopplerRound, v: NumericControl): DopplerOutcome {
  const speed = v.speed as number;
  if (round.kind === "approach") {
    const heard = calculateDopplerFrequency(AMBULANCE.sirenHz, SOUND_SPEED, 0, speed);
    const truth = SOUND_SPEED * (1 - AMBULANCE.sirenHz / AMBULANCE.heardHz);
    const error = Math.abs(heard - AMBULANCE.heardHz);
    const success = error <= AMBULANCE.toleranceHz;
    return {
      heardHz: heard, sourceHz: AMBULANCE.sirenHz, success, accuracyFraction: success ? 1 - error / AMBULANCE.toleranceHz : 0, predictionActual: truth,
      feedback: success
        ? `At ${speed.toFixed(1)} m/s (${(speed * 3.6).toFixed(0)} km/h) the waves bunch up to ${heard.toFixed(1)} Hz, matching what you hear.`
        : `At ${speed.toFixed(1)} m/s you would hear ${heard.toFixed(1)} Hz, ${heard > AMBULANCE.heardHz ? "too high: slower" : "too low: faster"}.`,
    };
  }
  if (round.kind === "passby") {
    const truth = calculateSourceSpeedFromShift(PASSBY.approachHz, PASSBY.recedeHz, SOUND_SPEED);
    const rest = calculateRestFrequencyFromShift(PASSBY.approachHz, PASSBY.recedeHz);
    const approach = calculateDopplerFrequency(rest, SOUND_SPEED, 0, speed);
    const error = Math.abs(speed - truth);
    const success = error <= PASSBY.toleranceMs;
    return {
      heardHz: approach, sourceHz: rest, success, accuracyFraction: success ? 1 - error / PASSBY.toleranceMs : 0, predictionActual: truth,
      feedback: success
        ? `${truth.toFixed(1)} m/s (${(truth * 3.6).toFixed(0)} km/h) turns a ${rest.toFixed(0)} Hz horn into ${PASSBY.approachHz} Hz coming and ${PASSBY.recedeHz} Hz going.`
        : `At ${speed.toFixed(1)} m/s the horn would drop from ${approach.toFixed(0)} Hz to ${calculateDopplerFrequency(rest, SOUND_SPEED, 0, -speed).toFixed(0)} Hz, a ${speed > truth ? "bigger" : "smaller"} change than you heard.`,
    };
  }
  const heard = calculateDopplerFrequency(CYCLIST.sirenHz, SOUND_SPEED, speed, 0);
  const truth = SOUND_SPEED * (CYCLIST.heardHz / CYCLIST.sirenHz - 1);
  const error = Math.abs(speed - truth);
  const success = error <= CYCLIST.toleranceMs;
  return {
    heardHz: heard, sourceHz: CYCLIST.sirenHz, success, accuracyFraction: success ? 1 - error / CYCLIST.toleranceMs : 0, predictionActual: truth,
    feedback: success
      ? `Riding at ${speed.toFixed(2)} m/s the cyclist meets the crests ${((heard / CYCLIST.sirenHz - 1) * 100).toFixed(1)} % more often: ${heard.toFixed(1)} Hz.`
      : `At ${speed.toFixed(2)} m/s the cyclist hears ${heard.toFixed(1)} Hz, ${heard > CYCLIST.heardHz ? "too high" : "too low"}.`,
  };
}

export const dopplerChase = defineNumericGame<DopplerRound, DopplerOutcome>({
  meta: DOPPLER_META,
  rounds: DOPPLER_ROUNDS,
  prediction: (): PredictionSpec => ({ label: "Your prediction of the speed", unit: "m/s", placeholder: "e.g. 20", step: 0.1 }),
  evaluate: (round, values) => runDoppler(round, values),
});
