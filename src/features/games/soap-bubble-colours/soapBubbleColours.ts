import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateReinforcedWavelengths, calculateThinnestFilm, calculateTwoBeamFactor, hasOneInversion } from "../../../physics/optics";

export type FilmKind = "soap" | "coating" | "colour";
export interface FilmRound extends NumericRound { readonly kind: FilmKind }
export interface FilmOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const SOAP_INDEX = 1.33;
export const COATING_INDEX = 1.38;
export const GLASS_INDEX = 1.52;
export const GREEN = 550;
export const SOAP_TOLERANCE = 3;
export const COATING_TOLERANCE = 3;
export const COLOUR_THICKNESS = 300;
export const COLOUR_TOLERANCE = 8;

export const FILM_META: RoundGameMeta = {
  id: "soap-bubble-colours",
  title: "Soap Bubble Colours",
  eyebrow: "OPTICS & LIGHT · INTERFERENCE",
  modelTag: "THIN-FILM INTERFERENCE",
  introduction: "The swirling colours of a soap bubble are light waves interfering. Make a soap film glow green, design an anti-reflection coating for a camera lens, and predict the colour of a film from its thickness.",
  instructions: "Predict, then set the film thickness or the colour. Light reflects from both surfaces of a thin film; the two reflections add up or cancel depending on the extra distance travelled inside the film and on whether a reflection flips the wave.",
  formula: "2 n t = (m + ½) λ (bright, one flip)  ·  2 n t = m λ (bright, no flip or two flips)",
  formulaCaption: "n is the film's refractive index (soap 1.33, magnesium fluoride 1.38), t its thickness, λ the wavelength in air and m = 0, 1, 2… A reflection off a higher-index material flips the wave by half a wavelength.",
  explanation: "Some light reflects off the front of the film and some off the back. The back reflection travels an extra 2nt inside the film. When light reflects off a material with a higher refractive index, the wave is turned upside down; off a lower index, it is not. A soap film in air flips only the front reflection, so it reflects a colour strongly when 2nt is an odd number of half-wavelengths, and looks black when it is far thinner than a wavelength. A coating on glass flips both reflections, so the flips cancel and a quarter-wavelength coating makes the two reflections cancel: less glare, more light through the lens. As a bubble's film thins and thickens, different colours are reinforced, which is why the colours swirl.",
  assumptions: "Light hitting the film straight on, a film of uniform thickness and no absorption, and refractive indices that do not change with colour. The model gives the colours that are reinforced or cancelled, not the exact brightness.",
  learningObjectives: ["Use path difference and phase flips to predict thin-film colours.", "Design a quarter-wave anti-reflection coating.", "Explain why a very thin soap film looks black."],
  objective: { title: "Paint with light", description: "Solve each interference problem.", unit: "films" },
  controlsHeading: "Your film",
  submitLabel: "Shine the light",
  solvedLabel: "Beautiful colours!",
  nextLabel: "Next film",
};

export const FILM_ROUNDS: readonly FilmRound[] = Object.freeze([
  {
    id: "green-soap", title: "A green soap film", difficulty: "Beginner", kind: "soap",
    situation: `Find the thinnest soap film (n = ${SOAP_INDEX}) in air that reflects green light of ${GREEN} nm most strongly (± ${SOAP_TOLERANCE} nm).`,
    controls: [fixed("index", "Film index", "", SOAP_INDEX), slider("thickness", "Film thickness", "nm", 10, 400, 0.5, 200)],
    hint: "One flip (front surface): 2nt = ½λ for the thinnest film.",
  },
  {
    id: "lens-coating", title: "The lens coating", difficulty: "Intermediate", kind: "coating",
    situation: `A magnesium fluoride coating (n = ${COATING_INDEX}) on glass (n = ${GLASS_INDEX}) should cancel the reflection of ${GREEN} nm light. Choose the thinnest coating (± ${COATING_TOLERANCE} nm).`,
    controls: [fixed("index", "Coating index", "", COATING_INDEX), slider("thickness", "Coating thickness", "nm", 10, 400, 0.5, 200)],
    hint: "Both reflections flip, so the flips cancel: 2nt = ½λ makes the reflections cancel.",
  },
  {
    id: "what-colour", title: "What colour?", difficulty: "Advanced", kind: "colour",
    situation: `A soap film is ${COLOUR_THICKNESS} nm thick. Which visible wavelength (380–750 nm) does it reflect most strongly? (± ${COLOUR_TOLERANCE} nm)`,
    controls: [fixed("thickness", "Film thickness", "nm", COLOUR_THICKNESS), slider("wavelength", "Wavelength", "nm", 380, 750, 1, 600)],
    hint: "2nt = 798 nm = (m + ½)λ. Try m = 0, 1, 2 and keep the one in the visible range.",
  },
]);

export function runFilm(round: FilmRound, v: NumericControl): FilmOutcome {
  if (round.kind === "soap" || round.kind === "coating") {
    const soap = round.kind === "soap";
    const index = soap ? SOAP_INDEX : COATING_INDEX;
    const one = soap ? hasOneInversion(1, SOAP_INDEX, 1) : hasOneInversion(1, COATING_INDEX, GLASS_INDEX);
    const truth = calculateThinnestFilm(GREEN, index, one, !soap);
    const thickness = v.thickness as number;
    const reflection = calculateTwoBeamFactor(thickness, index, GREEN, one);
    const tolerance = soap ? SOAP_TOLERANCE : COATING_TOLERANCE;
    const error = Math.abs(thickness - truth);
    const success = error <= tolerance;
    return {
      headline: reflection, unit: "", success, accuracyFraction: success ? 1 - error / tolerance : 0, predictionActual: truth,
      feedback: success
        ? soap
          ? `At ${thickness.toFixed(1)} nm the back reflection travels ${(2 * index * thickness).toFixed(0)} nm extra, half a wavelength, and the flipped front reflection lines up with it: bright green.`
          : `At ${thickness.toFixed(1)} nm the two reflections, both flipped, arrive half a wavelength apart and cancel: the lens loses almost no green light to glare.`
        : `At ${thickness.toFixed(1)} nm the green reflection is ${(reflection * 100).toFixed(0)} % of its maximum; the ${soap ? "thinnest bright" : "thinnest cancelling"} film is ${truth.toFixed(1)} nm.`,
    };
  }
  const wavelength = v.wavelength as number;
  const reinforced = calculateReinforcedWavelengths(COLOUR_THICKNESS, SOAP_INDEX, true, 380, 750);
  const truth = reinforced[0] ?? 0;
  const error = Math.abs(wavelength - truth);
  const success = error <= COLOUR_TOLERANCE;
  return {
    headline: truth, unit: "nm", success, accuracyFraction: success ? 1 - error / COLOUR_TOLERANCE : 0, predictionActual: truth,
    feedback: success
      ? `2nt = ${(2 * SOAP_INDEX * COLOUR_THICKNESS).toFixed(0)} nm = 1.5 × ${truth.toFixed(0)} nm: the film glows green. The m = 0 order (${(2 * 2 * SOAP_INDEX * COLOUR_THICKNESS).toFixed(0)} nm) is infrared and m = 2 is ultraviolet.`
      : `${wavelength} nm is not reinforced: its reflection is ${(calculateTwoBeamFactor(COLOUR_THICKNESS, SOAP_INDEX, wavelength, true) * 100).toFixed(0)} % of the maximum.`,
  };
}

export const soapBubbleColours = defineNumericGame<FilmRound, FilmOutcome>({
  meta: FILM_META,
  rounds: FILM_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "colour" ? { label: "Your prediction of the wavelength", unit: "nm", placeholder: "e.g. 500", step: 1 }
    : { label: "Your prediction of the thickness", unit: "nm", placeholder: "e.g. 150", step: 0.5 },
  evaluate: (round, values) => runFilm(round, values),
});
