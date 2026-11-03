import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculatePlanetPropertiesFromEarthUnits, type PlanetProperties } from "../../../physics/astronomy";

export type PlanetKind = "gravity" | "atmosphere" | "gas-giant";

export interface PlanetRound extends NumericRound { readonly kind: PlanetKind }

export interface PlanetOutcome extends AttemptOutcome {
  readonly properties: PlanetProperties;
  readonly earthMasses: number;
  readonly earthRadii: number;
}

export const GRAVITY_TARGET = 9.82;
export const GRAVITY_TOLERANCE = 0.5;
export const LIVABLE_GRAVITY: readonly [number, number] = [8, 12];
export const MINIMUM_ESCAPE_SPEED = 13_000;
export const GIANT_DENSITY = 700;
export const GIANT_DENSITY_TOLERANCE = 100;
export const GIANT_ESCAPE_SPEED = 36_000;
export const GIANT_ESCAPE_TOLERANCE = 3_000;

export const PLANET_META: RoundGameMeta = {
  id: "planet-designer",
  title: "Planet Designer",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · PLANETS",
  modelTag: "MASS, RADIUS & GRAVITY",
  introduction: "Design worlds by choosing their mass and size. See how those two numbers decide surface gravity, density and how hard it is to leave, and build planets that match a brief.",
  instructions: "Predict, set the mass and radius, then build the planet. Everything else follows from the planet's mass and radius through Newton's law of gravitation.",
  formula: "g = GM/R²  ·  ρ = M / (4/3 π R³)  ·  v_esc = √(2GM/R)",
  formulaCaption: "G = 6.674×10⁻¹¹ N·m²/kg², M is the mass and R the radius of the planet. g is the surface gravity, ρ the mean density and v_esc the escape speed from the surface.",
  explanation: "Surface gravity grows with mass but falls with the square of the radius, so a planet twice as massive as Earth only has twice Earth's gravity if it is the same size; a bigger planet of the same mass has weaker gravity. Density is mass over volume, so the volume (R³) rises faster than gravity falls: a gas giant like Saturn can be 95 times Earth's mass and still less dense than water. The escape speed √(2GM/R) tells how hard it is for gas and rockets to leave: a world with a high escape speed holds on to an atmosphere, one with a low escape speed loses it.",
  assumptions: "Spherical planets of uniform density at the surface values, with no rotation (so no equatorial bulge or reduced effective gravity) and no atmosphere affecting the radius. The values are Earth-relative: Earth has mass 5.972×10²⁴ kg and radius 6371 km.",
  learningObjectives: ["Calculate surface gravity from mass and radius.", "Relate size and mass to mean density.", "Explain how escape speed controls whether a planet holds an atmosphere."],
  objective: { title: "Design every planet", description: "Meet each design brief.", unit: "planets" },
  controlsHeading: "Design the planet",
  submitLabel: "Build the planet",
  solvedLabel: "Planet built!",
  nextLabel: "Next planet",
};

export const PLANET_ROUNDS: readonly PlanetRound[] = Object.freeze([
  {
    id: "earth-like-gravity", title: "Earth-like gravity", difficulty: "Beginner", kind: "gravity",
    situation: `A rocky planet has twice the mass of Earth. Choose its radius so that the surface gravity is Earth-like: ${GRAVITY_TARGET} m/s² (± ${GRAVITY_TOLERANCE}).`,
    controls: [fixed("mass", "Mass", "Earth masses", 2), slider("radius", "Radius", "Earth radii", 0.8, 2, 0.01, 1)],
    hint: "g scales as M/R². For g equal to Earth's with M = 2 M⊕, R² must be 2 R⊕².",
  },
  {
    id: "a-world-that-holds-air", title: "A world that holds air", difficulty: "Intermediate", kind: "atmosphere",
    situation: "Design a rocky planet with a comfortable surface gravity between 8 and 12 m/s² and an escape speed of at least 13 km/s so it can keep a thick atmosphere.",
    controls: [slider("mass", "Mass", "Earth masses", 0.3, 5, 0.05, 1), slider("radius", "Radius", "Earth radii", 0.5, 2, 0.01, 1)],
    hint: "Since v_esc = √(2gR), a larger radius at the same gravity gives a higher escape speed. Try R above 1.3 R⊕ and set M = g R²/G, about R² × M⊕ for g = 1 g⊕.",
  },
  {
    id: "a-light-giant", title: "A light giant", difficulty: "Advanced", kind: "gas-giant",
    situation: `Design a gas giant lighter than water: mean density ${GIANT_DENSITY} ± ${GIANT_DENSITY_TOLERANCE} kg/m³ and an escape speed of ${GIANT_ESCAPE_SPEED / 1000} ± ${GIANT_ESCAPE_TOLERANCE / 1000} km/s.`,
    controls: [slider("mass", "Mass", "Earth masses", 5, 120, 0.5, 50), slider("radius", "Radius", "Earth radii", 2, 12, 0.05, 6)],
    hint: "Escape speed fixes the ratio M/R (v_esc = 11.19 km/s × √(M/R) in Earth units); density then fixes R: ρ = 5514 kg/m³ × M/R³.",
  },
]);

export function runPlanet(round: PlanetRound, v: NumericControl): PlanetOutcome {
  const mass = v.mass as number;
  const radius = v.radius as number;
  const p = calculatePlanetPropertiesFromEarthUnits(mass, radius);
  const base = { properties: p, earthMasses: mass, earthRadii: radius };

  if (round.kind === "gravity") {
    const error = Math.abs(p.surfaceGravity - GRAVITY_TARGET);
    const success = error <= GRAVITY_TOLERANCE;
    return {
      ...base, success, accuracyFraction: success ? 1 - error / GRAVITY_TOLERANCE : 0, predictionActual: Math.sqrt(2),
      feedback: success ? `g = GM/R² = ${p.surfaceGravity.toFixed(2)} m/s², within ${error.toFixed(2)} of Earth's. The planet is more massive than Earth but larger, so its gravity matches.`
        : `This planet has g = ${p.surfaceGravity.toFixed(2)} m/s², ${p.surfaceGravity > GRAVITY_TARGET ? "too strong: make it bigger" : "too weak: make it smaller"}.`,
    };
  }
  if (round.kind === "atmosphere") {
    const [low, high] = LIVABLE_GRAVITY;
    const gravityOk = p.surfaceGravity >= low && p.surfaceGravity <= high;
    const escapeOk = p.escapeSpeed >= MINIMUM_ESCAPE_SPEED;
    const success = gravityOk && escapeOk;
    return {
      ...base, success, accuracyFraction: success ? 1 : 0, predictionActual: p.escapeSpeed / 1000,
      feedback: success ? `Gravity ${p.surfaceGravity.toFixed(1)} m/s² is comfortable, and the escape speed of ${(p.escapeSpeed / 1000).toFixed(1)} km/s is high enough to keep an atmosphere.`
        : !gravityOk ? `Surface gravity ${p.surfaceGravity.toFixed(1)} m/s² is outside the ${low}–${high} m/s² range.`
        : `The escape speed ${(p.escapeSpeed / 1000).toFixed(1)} km/s is below ${MINIMUM_ESCAPE_SPEED / 1000} km/s: the atmosphere would slowly leak away. A bigger planet at the same gravity has a higher escape speed.`,
    };
  }
  const densityError = Math.abs(p.meanDensity - GIANT_DENSITY) / GIANT_DENSITY_TOLERANCE;
  const escapeError = Math.abs(p.escapeSpeed - GIANT_ESCAPE_SPEED) / GIANT_ESCAPE_TOLERANCE;
  const success = densityError <= 1 && escapeError <= 1;
  return {
    ...base, success, accuracyFraction: success ? 1 - Math.max(densityError, escapeError) : 0, predictionActual: p.meanDensity,
    feedback: success ? `Density ${p.meanDensity.toFixed(0)} kg/m³ is less than water's 1000, and the escape speed is ${(p.escapeSpeed / 1000).toFixed(1)} km/s.`
      : `Density ${p.meanDensity.toFixed(0)} kg/m³ (target ${GIANT_DENSITY}) and escape speed ${(p.escapeSpeed / 1000).toFixed(1)} km/s (target ${GIANT_ESCAPE_SPEED / 1000}) are not both on target.`,
  };
}

export const planetDesigner = defineNumericGame<PlanetRound, PlanetOutcome>({
  meta: PLANET_META,
  rounds: PLANET_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "gravity" ? { label: "Your prediction of the radius needed", unit: "Earth radii", placeholder: "e.g. 1.41", step: 0.01 }
    : round.kind === "atmosphere" ? { label: "Your prediction of the escape speed", unit: "km/s", placeholder: "e.g. 13", step: 0.1 }
    : { label: "Your prediction of the mean density", unit: "kg/m³", placeholder: "e.g. 700", step: 10 },
  evaluate: (round, values) => runPlanet(round, values),
});
