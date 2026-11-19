import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculatePeakWavelength, calculateSolarLuminosity, calculateSolarRadius, calculateTemperatureFromPeak, classifySpectralType } from "../../../physics/astronomy";

export type StarKind = "colour" | "giant" | "dwarf";
export interface StarRound extends NumericRound { readonly kind: StarKind }
export interface StarOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const HOT_STAR_PEAK_NM = 290;
export const HOT_TOLERANCE = 0.02;
export const GIANT = { temperature: 3600, luminosity: 1e5, tolerance: 0.05 } as const;
export const DWARF = { temperature: 25_000, radius: 0.0084, tolerance: 0.05 } as const;

export const STAR_META: RoundGameMeta = {
  id: "star-classifier",
  title: "Star Classifier",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · STARS",
  modelTag: "BLACKBODY STARS",
  introduction: "A star's colour is a thermometer and its brightness a measuring tape. Read the temperature of a blue-white star from its colour, find how enormous a red supergiant must be to shine so brightly, and discover why a white-hot dwarf is so faint.",
  instructions: "Predict, then set the temperature, radius or luminosity. Hotter stars glow bluer and radiate far more from every square metre; a star's total output also depends on its surface area.",
  formula: "λ_max = b / T  ·  L/L☉ = (R/R☉)² (T/T☉)⁴",
  formulaCaption: "λ_max is the peak wavelength, b = 2.898 × 10⁻³ m·K Wien's constant, T the surface temperature (K), L the luminosity and R the radius, in units of the Sun's (T☉ = 5772 K).",
  explanation: "Stars shine roughly like black bodies: the hotter the surface, the shorter the wavelength where their light peaks, so cool stars look red and hot ones blue-white. Each square metre of a star radiates σT⁴, so doubling the temperature multiplies it sixteen times. A star's total luminosity is that times its surface area, 4πR². That is why a cool red supergiant like Betelgeuse can outshine the Sun a hundred thousand times: it is hundreds of times wider. A white dwarf is the opposite: very hot but only the size of Earth, so its total output is tiny. Plotting stars by temperature and luminosity (the Hertzsprung–Russell diagram) sorts them into the main sequence, giants and white dwarfs.",
  assumptions: "Stars radiate as black bodies at their effective temperature, and the Sun has T = 5772 K and L = 3.828 × 10²⁶ W (IAU nominal values). Real spectra have absorption lines, and the luminosities of Betelgeuse and Sirius B are approximate.",
  learningObjectives: ["Use Wien's law to find a star's temperature.", "Use the Stefan–Boltzmann law in solar units.", "Place giants and dwarfs on the Hertzsprung–Russell diagram."],
  objective: { title: "Classify the stars", description: "Solve each star.", unit: "stars" },
  controlsHeading: "Your answer",
  submitLabel: "Point the telescope",
  solvedLabel: "Star classified!",
  nextLabel: "Next star",
};

export const STAR_ROUNDS: readonly StarRound[] = Object.freeze([
  {
    id: "colour-thermometer", title: "The colour thermometer", difficulty: "Beginner", kind: "colour",
    situation: `A blue-white star's light peaks at ${HOT_STAR_PEAK_NM} nm, in the ultraviolet. What is its surface temperature? (± ${HOT_TOLERANCE * 100} %)`,
    controls: [fixed("peak", "Peak wavelength", "nm", HOT_STAR_PEAK_NM), slider("temperature", "Surface temperature", "K", 2000, 40_000, 10, 6000)],
    hint: "T = b / λ_max with b = 2.898 × 10⁻³ m·K.",
  },
  {
    id: "red-supergiant", title: "The red supergiant", difficulty: "Intermediate", kind: "giant",
    situation: `A red supergiant has a surface temperature of ${GIANT.temperature} K yet shines ${GIANT.luminosity.toLocaleString("en")} times as brightly as the Sun. How many times the Sun's radius is it? (± ${GIANT.tolerance * 100} %)`,
    controls: [fixed("temperature", "Surface temperature", "K", GIANT.temperature), slider("radius", "Radius", "R☉", 50, 2000, 1, 300)],
    hint: "R/R☉ = √(L/L☉) × (T☉/T)².",
  },
  {
    id: "white-dwarf", title: "The white dwarf", difficulty: "Advanced", kind: "dwarf",
    situation: `A white dwarf has a surface temperature of ${DWARF.temperature.toLocaleString("en")} K but a radius of only ${DWARF.radius} R☉, about Earth's size. How luminous is it, in solar units? (± ${DWARF.tolerance * 100} %)`,
    controls: [fixed("radius", "Radius", "R☉", DWARF.radius), slider("luminosity", "Luminosity", "L☉", 0.001, 0.1, 0.0001, 0.05)],
    hint: "L/L☉ = (R/R☉)² (T/T☉)⁴.",
  },
]);

function relativeCheck(value: number, truth: number, tolerance: number) {
  const error = Math.abs(value - truth) / truth;
  const success = error <= tolerance;
  return { success, accuracyFraction: success ? 1 - error / tolerance : 0 };
}

export function runStar(round: StarRound, v: NumericControl): StarOutcome {
  if (round.kind === "colour") {
    const temperature = v.temperature as number;
    const truth = calculateTemperatureFromPeak(HOT_STAR_PEAK_NM * 1e-9);
    const peak = calculatePeakWavelength(temperature) * 1e9;
    const check = relativeCheck(temperature, truth, HOT_TOLERANCE);
    return {
      headline: peak, unit: "nm", ...check, predictionActual: truth,
      feedback: check.success
        ? `${temperature.toLocaleString("en")} K: a class ${classifySpectralType(truth)} star, nearly twice as hot as the Sun, like Vega.`
        : `At ${temperature.toLocaleString("en")} K the light would peak at ${peak.toFixed(0)} nm, ${peak > HOT_STAR_PEAK_NM ? "too red: hotter" : "too blue: cooler"}.`,
    };
  }
  if (round.kind === "giant") {
    const radius = v.radius as number;
    const truth = calculateSolarRadius(GIANT.luminosity, GIANT.temperature);
    const luminosity = calculateSolarLuminosity(radius, GIANT.temperature);
    const check = relativeCheck(radius, truth, GIANT.tolerance);
    return {
      headline: luminosity, unit: "L☉", ...check, predictionActual: truth,
      feedback: check.success
        ? `About ${truth.toFixed(0)} R☉: put it where the Sun is and it would swallow the orbits of Mercury, Venus, Earth and Mars. Each square metre is cooler than the Sun's, but there are vastly more of them.`
        : `At ${radius} R☉ it would shine ${luminosity.toExponential(2)} times the Sun: ${luminosity > GIANT.luminosity ? "too bright" : "too faint"}.`,
    };
  }
  const luminosity = v.luminosity as number;
  const truth = calculateSolarLuminosity(DWARF.radius, DWARF.temperature);
  const check = relativeCheck(luminosity, truth, DWARF.tolerance);
  return {
    headline: truth, unit: "L☉", ...check, predictionActual: truth,
    feedback: check.success
      ? `L = ${truth.toFixed(4)} L☉: each square metre is ${((DWARF.temperature / 5772) ** 4).toFixed(0)} times brighter than the Sun's, but the star is ${(1 / DWARF.radius).toFixed(0)} times smaller across.`
      : `${luminosity.toFixed(4)} L☉ is ${luminosity > truth ? "too bright" : "too faint"}: remember the radius is squared and the temperature raised to the fourth power.`,
  };
}

export const starClassifier = defineNumericGame<StarRound, StarOutcome>({
  meta: STAR_META,
  rounds: STAR_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "colour" ? { label: "Your prediction of the temperature", unit: "K", placeholder: "e.g. 8000", step: 10 }
    : round.kind === "giant" ? { label: "Your prediction of the radius", unit: "R☉", placeholder: "e.g. 500", step: 1 }
    : { label: "Your prediction of the luminosity", unit: "L☉", placeholder: "e.g. 0.01", step: 0.0001 },
  evaluate: (round, values) => runStar(round, values),
});
