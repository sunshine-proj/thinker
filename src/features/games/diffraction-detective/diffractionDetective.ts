import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateGratingAngle, calculateMinimumPosition, calculateSpacingFromAngle, calculateWavelengthFromGrating } from "../../../physics/optics";

export type DiffractionKind = "laser" | "cd" | "hair";
export interface DiffractionRound extends NumericRound { readonly kind: DiffractionKind }
export interface DiffractionOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const GRATING_LINES_PER_MM = 600;
export const GRATING_SPACING = 1e-3 / GRATING_LINES_PER_MM;
export const LASER_ANGLE = 22.31;
export const LASER_TOLERANCE_NM = 5;
export const CD_LASER_NM = 650;
export const CD_ANGLE = 23.9;
export const CD_TOLERANCE_UM = 0.05;
export const HAIR_LASER_NM = 532;
export const SCREEN_DISTANCE = 2;
export const HAIR_MINIMUM_SPACING_CM = 2;
export const HAIR_TOLERANCE_UM = 4;

/** Hair width (m) that puts the first dark minima the measured distance apart. */
export function hairWidthFromPattern(): number {
  const y = (HAIR_MINIMUM_SPACING_CM / 100) / 2;
  const sine = Math.sin(Math.atan(y / SCREEN_DISTANCE));
  return (HAIR_LASER_NM * 1e-9) / sine;
}

export const DIFFRACTION_META: RoundGameMeta = {
  id: "diffraction-detective",
  title: "Diffraction Detective",
  eyebrow: "OPTICS & LIGHT · DIFFRACTION",
  modelTag: "GRATINGS & SINGLE SLITS",
  introduction: "Light bends round obstacles and through narrow gaps in a pattern that gives away tiny sizes. Identify a mystery laser with a grating, measure the track spacing of a CD with a red laser pointer, and find the width of a hair from its diffraction pattern.",
  instructions: "Predict, then set the wavelength, the spacing or the width. A grating sends light into sharp bright beams at angles set by d sinθ = mλ; a narrow slit or a thin hair spreads light with dark gaps at a sinθ = mλ.",
  formula: "d sinθ = m λ (grating)  ·  a sinθ = m λ (slit or hair, dark minima)",
  formulaCaption: "d is the line spacing (m), a the slit or hair width (m), θ the angle from the straight-through beam, m = 1, 2… the order and λ the wavelength.",
  explanation: "When light passes many evenly spaced lines, the waves from neighbouring lines reinforce only where their path difference d sinθ is a whole number of wavelengths, giving sharp bright beams; measure an angle and you can work out either the wavelength or the spacing. A single narrow gap spreads light out, with dark gaps where waves from the two halves of the gap cancel, at a sinθ = mλ. Babinet's principle says a thin obstacle such as a hair produces the same pattern as a slit of the same width, so a laser pointer and a ruler measure a hair to a few micrometres. The narrower the object, the wider the pattern: diffraction is how scientists measure things far too small to see.",
  assumptions: "Monochromatic laser light, far-field (Fraunhofer) diffraction with the screen far away, a perfect grating and a hair of uniform width. Angles are measured from the straight-through beam.",
  learningObjectives: ["Use the grating equation to find a wavelength or a spacing.", "Use single-slit minima and Babinet's principle to measure a width.", "Explain why narrower objects give wider patterns."],
  objective: { title: "Solve the case", description: "Identify every mystery measurement.", unit: "cases" },
  controlsHeading: "Your answer",
  submitLabel: "Check with the laser",
  solvedLabel: "Case solved!",
  nextLabel: "Next case",
};

export const DIFFRACTION_ROUNDS: readonly DiffractionRound[] = Object.freeze([
  {
    id: "mystery-laser", title: "The mystery laser", difficulty: "Beginner", kind: "laser",
    situation: `A ${GRATING_LINES_PER_MM} lines/mm grating sends the first-order beam of a mystery laser out at ${LASER_ANGLE}°. What is its wavelength? (± ${LASER_TOLERANCE_NM} nm)`,
    controls: [fixed("angle", "First-order angle", "°", LASER_ANGLE), slider("wavelength", "Wavelength", "nm", 380, 750, 0.5, 550)],
    hint: "d = 1 mm / 600, then λ = d sinθ.",
  },
  {
    id: "cd-tracks", title: "The CD tracks", difficulty: "Intermediate", kind: "cd",
    situation: `A ${CD_LASER_NM} nm laser reflects off a CD and the first-order beam leaves at ${CD_ANGLE}°. How far apart are the CD's tracks? (± ${CD_TOLERANCE_UM} µm)`,
    controls: [fixed("wavelength", "Laser wavelength", "nm", CD_LASER_NM), slider("spacing", "Track spacing", "µm", 0.5, 5, 0.01, 2)],
    hint: "The tracks act as a reflection grating: d = λ / sinθ.",
  },
  {
    id: "width-of-a-hair", title: "The width of a hair", difficulty: "Advanced", kind: "hair",
    situation: `A ${HAIR_LASER_NM} nm green laser shines on a hair. On a wall ${SCREEN_DISTANCE} m away, the two first dark gaps either side of the centre are ${HAIR_MINIMUM_SPACING_CM} cm apart. How wide is the hair? (± ${HAIR_TOLERANCE_UM} µm)`,
    controls: [fixed("distance", "Distance to the wall", "m", SCREEN_DISTANCE), slider("width", "Hair width", "µm", 20, 200, 0.5, 60)],
    hint: "Each first minimum is 1 cm from the centre: a = λL/y for small angles (Babinet's principle).",
  },
]);

export function runDiffraction(round: DiffractionRound, v: NumericControl): DiffractionOutcome {
  if (round.kind === "laser") {
    const guess = v.wavelength as number;
    const truth = calculateWavelengthFromGrating(GRATING_SPACING, LASER_ANGLE) * 1e9;
    const angle = calculateGratingAngle(GRATING_SPACING, guess * 1e-9);
    const error = Math.abs(guess - truth);
    const success = error <= LASER_TOLERANCE_NM;
    return {
      headline: angle, unit: "°", success, accuracyFraction: success ? 1 - error / LASER_TOLERANCE_NM : 0, predictionActual: truth,
      feedback: success
        ? `λ = d sinθ = ${truth.toFixed(1)} nm: a red helium–neon laser.`
        : `${guess} nm would leave at ${angle.toFixed(2)}°, not ${LASER_ANGLE}°: ${angle > LASER_ANGLE ? "the wavelength is shorter" : "the wavelength is longer"}.`,
    };
  }
  if (round.kind === "cd") {
    const guess = v.spacing as number;
    const truth = calculateSpacingFromAngle(CD_LASER_NM * 1e-9, CD_ANGLE) * 1e6;
    const angle = calculateGratingAngle(guess * 1e-6, CD_LASER_NM * 1e-9);
    const error = Math.abs(guess - truth);
    const success = error <= CD_TOLERANCE_UM;
    return {
      headline: angle, unit: "°", success, accuracyFraction: success ? 1 - error / CD_TOLERANCE_UM : 0, predictionActual: truth,
      feedback: success
        ? `d = λ / sinθ = ${truth.toFixed(2)} µm, the standard 1.6 µm CD track pitch: about 625 tracks in every millimetre.`
        : `Tracks ${guess.toFixed(2)} µm apart would send the beam out at ${angle.toFixed(1)}°, not ${CD_ANGLE}°.`,
    };
  }
  const width = v.width as number;
  const truth = hairWidthFromPattern() * 1e6;
  const spacing = 2 * calculateMinimumPosition(width * 1e-6, HAIR_LASER_NM * 1e-9, SCREEN_DISTANCE) * 100;
  const error = Math.abs(width - truth);
  const success = error <= HAIR_TOLERANCE_UM;
  return {
    headline: spacing, unit: "cm", success, accuracyFraction: success ? 1 - error / HAIR_TOLERANCE_UM : 0, predictionActual: truth,
    feedback: success
      ? `A ${truth.toFixed(0)} µm hair puts the first dark gaps ${HAIR_MINIMUM_SPACING_CM} cm apart, a typical human hair.`
      : `A ${width} µm hair would put the dark gaps ${spacing.toFixed(2)} cm apart: ${spacing > HAIR_MINIMUM_SPACING_CM ? "too narrow" : "too wide"}. Narrower objects spread light more.`,
  };
}

export const diffractionDetective = defineNumericGame<DiffractionRound, DiffractionOutcome>({
  meta: DIFFRACTION_META,
  rounds: DIFFRACTION_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "laser" ? { label: "Your prediction of the wavelength", unit: "nm", placeholder: "e.g. 600", step: 0.5 }
    : round.kind === "cd" ? { label: "Your prediction of the track spacing", unit: "µm", placeholder: "e.g. 2", step: 0.01 }
    : { label: "Your prediction of the hair width", unit: "µm", placeholder: "e.g. 80", step: 0.5 },
  evaluate: (round, values) => runDiffraction(round, values),
});
