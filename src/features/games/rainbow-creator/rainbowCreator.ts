import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateDeviation, calculateMinimumDeviationIncidence, calculateRainbowAngle, calculateWaterRefractiveIndex,
} from "../../../physics/optics";

export type RainbowKind = "minimum" | "colour" | "secondary";

export interface RainbowRound extends NumericRound {
  readonly kind: RainbowKind;
  readonly targetAngle?: number;
  readonly toleranceDegrees: number;
}

export interface RainbowOutcome extends AttemptOutcome {
  readonly refractiveIndex: number;
  readonly reflections: number;
  readonly incidenceDegrees: number;
  readonly deviationDegrees: number;
  readonly minimumIncidenceDegrees: number;
  readonly rainbowAngleDegrees: number;
}

export const RAINBOW_META: RoundGameMeta = {
  id: "rainbow-creator",
  title: "Rainbow Creator",
  eyebrow: "OPTICS & LIGHT · REFRACTION & DISPERSION",
  modelTag: "RAINDROP OPTICS · MINIMUM DEVIATION",
  introduction: "Trace sunlight through a raindrop: it refracts in, reflects off the back, and refracts out. Discover why the light piles up at one angle, why each colour has its own bow, and why a second, fainter bow has reversed colours.",
  instructions: "Predict the angle, set the drop's incidence angle, light colour (wavelength) or number of internal reflections, then trace the ray. A rainbow appears at the angle of minimum deviation.",
  formula: "sin θᵢ = n sin θᵣ  ·  D = 180°k + 2θᵢ − 2(k+1)θᵣ  ·  cos²θᵢ = (n²−1)/(k(k+2))",
  formulaCaption: "θᵢ and θᵣ are the angles of incidence and refraction, n the water's refractive index (about 1.33, slightly larger for violet), k the number of internal reflections, and D the total deviation.",
  explanation: "Different rays entering a raindrop leave it at different angles, but near one particular entry angle the deviation barely changes, so many rays leave together in nearly the same direction. That concentrated light is the rainbow, seen about 42° from the point opposite the sun. Water bends blue and violet light slightly more than red (dispersion), so each colour has a slightly different angle: red is outside the primary bow, violet inside. A second internal reflection gives the fainter secondary bow near 51°, with its colours reversed.",
  assumptions: "A single spherical drop treated with geometric optics. There is no diffraction (so no supernumerary arcs), no polarisation or brightness model, and the refractive index follows a Cauchy formula fitted to water across the visible spectrum.",
  learningObjectives: ["Apply Snell's law at both surfaces of a raindrop.", "Find the angle of minimum deviation and see why it creates a bow.", "Explain how dispersion separates the colours and why the secondary bow is reversed."],
  objective: { title: "Paint every rainbow", description: "Reach each rainbow goal.", unit: "rainbows" },
  controlsHeading: "Trace the light",
  submitLabel: "Trace the ray",
  solvedLabel: "Rainbow found!",
  nextLabel: "Next rainbow",
};

export const RAINBOW_ROUNDS: readonly RainbowRound[] = Object.freeze([
  {
    id: "minimum-deviation", title: "Find the bright angle", difficulty: "Beginner", kind: "minimum", toleranceDegrees: 1.5,
    situation: "Sunlight enters a drop of water (n = 1.333) and reflects once inside. At which angle of incidence is the deviation smallest, so that the rays bunch up into a rainbow? Find it within 1.5°.",
    controls: [slider("incidence", "Angle of incidence", "°", 0, 90, 0.1, 45), fixed("wavelength", "Wavelength", "nm", 589), fixed("reflections", "Internal reflections", "", 1)],
    hint: "The minimum satisfies cos²θᵢ = (n² − 1)/3 for one internal reflection.",
  },
  {
    id: "choose-the-colour", title: "Choose the colour", difficulty: "Intermediate", kind: "colour", targetAngle: 41, toleranceDegrees: 0.2,
    situation: "Each colour makes its own bow. Choose the wavelength of light whose primary rainbow appears 41.0° (± 0.2°) from the antisolar point.",
    controls: [slider("wavelength", "Wavelength", "nm", 380, 750, 1, 550), fixed("reflections", "Internal reflections", "", 1)],
    hint: "Shorter wavelengths have a larger refractive index and a smaller bow angle (violet inside, red outside). Compute the bow angle for a few wavelengths and interpolate.",
  },
  {
    id: "double-rainbow", title: "The double rainbow", difficulty: "Advanced", kind: "secondary", targetAngle: 51.5, toleranceDegrees: 0.5,
    situation: "Make a bow 51.5° (± 0.5°) from the antisolar point. A primary bow cannot reach that far. Choose the number of internal reflections and the wavelength.",
    controls: [slider("wavelength", "Wavelength", "nm", 380, 750, 1, 550), slider("reflections", "Internal reflections", "", 1, 2, 1, 1)],
    hint: "Two internal reflections make the secondary bow, between about 50° and 54°. Its colours are reversed: red is now the inner edge.",
  },
]);

export function runRainbow(round: RainbowRound, v: NumericControl): RainbowOutcome {
  const wavelength = v.wavelength as number;
  const reflections = v.reflections as number;
  const n = calculateWaterRefractiveIndex(wavelength);
  const minimum = calculateMinimumDeviationIncidence(n, reflections);
  const bow = calculateRainbowAngle(n, reflections);
  const incidence = round.kind === "minimum" ? (v.incidence as number) : minimum;
  const deviation = calculateDeviation(incidence, n, reflections);
  const base = { refractiveIndex: n, reflections, incidenceDegrees: incidence, deviationDegrees: deviation, minimumIncidenceDegrees: minimum, rainbowAngleDegrees: bow };

  if (round.kind === "minimum") {
    const error = Math.abs(incidence - minimum);
    const success = error <= round.toleranceDegrees;
    return {
      ...base, success, accuracyFraction: success ? 1 - error / round.toleranceDegrees : 0, predictionActual: deviation,
      feedback: success ? `Found it: the deviation is smallest (${deviation.toFixed(1)}°) near ${minimum.toFixed(1)}°, so rays pile up there and form the bow at ${bow.toFixed(1)}°.` : `At ${incidence}° the deviation is ${deviation.toFixed(1)}° and still changing quickly, so the rays spread out. The minimum is ${incidence < minimum ? "at a larger" : "at a smaller"} angle.`,
    };
  }
  const error = Math.abs(bow - (round.targetAngle as number));
  const success = error <= round.toleranceDegrees;
  return {
    ...base, success, accuracyFraction: success ? 1 - error / round.toleranceDegrees : 0, predictionActual: bow,
    feedback: success
      ? `${wavelength} nm light (n = ${n.toFixed(4)}) makes a ${reflections === 1 ? "primary" : "secondary"} bow at ${bow.toFixed(2)}°.`
      : `The bow is at ${bow.toFixed(2)}°, ${bow < (round.targetAngle as number) ? "too small" : "too large"} for the ${round.targetAngle}° target.${reflections === 1 && round.kind === "secondary" ? " One reflection can never reach 51°: you need a second." : ""}`,
  };
}

export function deviationCurve(v: NumericControl): { x: number; y: number }[] {
  const n = calculateWaterRefractiveIndex(v.wavelength as number);
  const k = v.reflections as number;
  return Array.from({ length: 90 }, (_, i) => {
    const x = 1 + i;
    return { x, y: calculateDeviation(Math.min(x, 89.9), n, k) };
  }).filter((p) => (k === 1 ? p.y < 200 : p.y > 150 && p.y < 340));
}

export const rainbowCreator = defineNumericGame<RainbowRound, RainbowOutcome>({
  meta: RAINBOW_META,
  rounds: RAINBOW_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "minimum"
      ? { label: "Your prediction of the total deviation at this incidence angle", unit: "°", placeholder: "e.g. 140", step: 0.1 }
      : { label: "Your prediction of the rainbow angle", unit: "°", placeholder: "e.g. 42", step: 0.1 },
  evaluate: (round, values) => runRainbow(round, values),
});
