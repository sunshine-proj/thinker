import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { measureOrbitalPeriod, type Body } from "../../../physics/astronomy";
import {
  ASTRONOMICAL_UNIT,
  GRAVITATIONAL_CONSTANT,
  JULIAN_YEAR,
  SUN_GRAVITATIONAL_PARAMETER,
  Vector2,
} from "../../../physics/core";

export type SystemKind = "year" | "star" | "comet";

export interface SystemRound extends NumericRound { readonly kind: SystemKind }

export interface SystemOutcome extends AttemptOutcome {
  readonly periodYears: number | null;
  readonly semiMajorAxisAu: number | null;
  /** Orbit path in AU relative to the star. */
  readonly path: readonly { x: number; y: number }[];
  readonly energyDrift: number;
}

export const SUN_MASS = SUN_GRAVITATIONAL_PARAMETER / GRAVITATIONAL_CONSTANT;
export const PLANET_MASS = 5.972e24;
export const COMET_MASS = 1e12;
export const YEAR_TARGET = 2;
export const YEAR_TOLERANCE = 0.05;
export const STAR_TARGET_PERIOD = 0.5;
export const STAR_TOLERANCE = 0.02;
export const COMET_TARGET = 8;
export const COMET_TOLERANCE = 0.4;

export const SYSTEM_META: RoundGameMeta = {
  id: "solar-system-builder",
  title: "Solar System Builder",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · N-BODY",
  modelTag: "N-BODY GRAVITY SIMULATION",
  introduction: "Build your own planetary system and let gravity run it. The simulation moves every body under mutual Newtonian attraction, and you check it against Kepler's laws: place a planet for a two-year orbit, choose a star's mass, and launch a comet.",
  instructions: "Predict, set up the system, then run the simulation. Orbital periods follow Kepler's third law: the square of the period is proportional to the cube of the orbit's size, and inversely to the mass of the star.",
  formula: "T² = 4π² a³ / G(M + m)  ·  F = G m₁ m₂ / r²  ·  v² = GM (2/r − 1/a)",
  formulaCaption: "T is the orbital period, a the semi-major axis of the orbit (the average of closest and furthest distance), M the star's mass and m the planet's. In solar units (years, AU, solar masses) this is T² = a³/M. The last equation (vis-viva) gives the speed v at distance r.",
  explanation: "Newton's law of gravitation lets us find the motion of every body in a system step by step: compute the pull on each from all the others, update the velocities and positions, and repeat. The simulation uses a symplectic leapfrog integrator, which keeps the energy of the orbit nearly constant. What comes out matches Kepler's laws: orbits are ellipses with the star at one focus, a planet sweeps equal areas in equal times, and T² ∝ a³. A heavier star pulls harder, so the same orbit is traversed faster. A comet on a highly elongated ellipse takes much longer than a planet at its closest distance, because its period depends on the semi-major axis, not on where it starts.",
  assumptions: "Point masses moving in a plane with Newtonian gravity only (no relativity, no other planets' pulls in the first two rounds, no collisions). The planet is Earth-mass and the comet's mass is negligible. Times use the Julian year of 365.25 days and the astronomical unit of 149.6 million km.",
  learningObjectives: ["Use Kepler's third law, T² = a³/M, to size an orbit.", "Explain how the central mass changes the orbital period.", "Relate launch speed to orbit shape and period with the vis-viva equation."],
  objective: { title: "Build every system", description: "Meet each orbital target.", unit: "systems" },
  controlsHeading: "Set up the system",
  submitLabel: "Run the simulation",
  solvedLabel: "System built!",
  nextLabel: "Next system",
};

export const SYSTEM_ROUNDS: readonly SystemRound[] = Object.freeze([
  {
    id: "a-two-year-planet", title: "A two-year planet", difficulty: "Beginner", kind: "year",
    situation: `Place a planet on a circular orbit around a Sun-like star so that its year lasts ${YEAR_TARGET} Earth years (± ${YEAR_TOLERANCE}).`,
    controls: [fixed("star", "Star mass", "Suns", 1), slider("distance", "Orbital radius", "AU", 0.5, 4, 0.01, 1)],
    hint: "In solar units T² = a³, so a = T^(2/3).",
  },
  {
    id: "a-heavier-star", title: "A heavier star", difficulty: "Intermediate", kind: "star",
    situation: `A planet orbits at 1 AU on a circular orbit. Choose the star's mass so that the planet's year is only ${STAR_TARGET_PERIOD} Earth years (± ${STAR_TOLERANCE}).`,
    controls: [slider("star", "Star mass", "Suns", 0.5, 6, 0.05, 1), fixed("distance", "Orbital radius", "AU", 1)],
    hint: "For a fixed orbit T² = a³/M, so M = a³/T². The planet launched at the circular speed √(GM/r) for whatever star mass you choose.",
  },
  {
    id: "a-returning-comet", title: "A returning comet", difficulty: "Advanced", kind: "comet",
    situation: `A comet is at its closest point to the Sun, 1 AU, and moving sideways. Choose its speed so it returns after ${COMET_TARGET} years (± ${COMET_TOLERANCE}). Earth's own speed there would be 29.8 km/s, and the escape speed is 42.1 km/s.`,
    controls: [fixed("star", "Star mass", "Suns", 1), fixed("distance", "Distance at launch", "AU", 1), slider("speed", "Launch speed", "km/s", 30, 42, 0.02, 36)],
    hint: "A period of 8 years means a semi-major axis a = 8^(2/3) = 4 AU. Use the vis-viva equation v² = GM(2/r − 1/a) with r = 1 AU.",
  },
]);

function buildSystem(round: SystemRound, v: NumericControl): Body[] {
  const starMass = (v.star as number) * SUN_MASS;
  const distance = (v.distance as number) * ASTRONOMICAL_UNIT;
  const speed = round.kind === "comet" ? (v.speed as number) * 1000 : Math.sqrt((GRAVITATIONAL_CONSTANT * starMass) / distance);
  return [
    { name: "Star", mass: starMass, position: Vector2.zero(), velocity: Vector2.zero() },
    { name: round.kind === "comet" ? "Comet" : "Planet", mass: round.kind === "comet" ? COMET_MASS : PLANET_MASS, position: new Vector2(distance, 0), velocity: new Vector2(0, speed) },
  ];
}

export function runSystem(round: SystemRound, v: NumericControl): SystemOutcome {
  const bodies = buildSystem(round, v);
  // The star moves slightly about the barycentre; start with zero total momentum.
  const planet = bodies[1]!;
  const recoil = planet.velocity.scale(-planet.mass / bodies[0]!.mass);
  const system: Body[] = [{ ...bodies[0]!, velocity: recoil }, planet];
  const measured = measureOrbitalPeriod(system, 1, 0, 40 * JULIAN_YEAR);
  const periodYears = measured.period === null ? null : measured.period / JULIAN_YEAR;
  const step = Math.max(1, Math.floor(measured.path.length / 400));
  const path = measured.path.filter((_, i) => i % step === 0).map((p) => ({ x: p.x / ASTRONOMICAL_UNIT, y: p.y / ASTRONOMICAL_UNIT }));
  const starSuns = v.star as number;
  const target = round.kind === "year" ? YEAR_TARGET : round.kind === "star" ? STAR_TARGET_PERIOD : COMET_TARGET;
  const tolerance = round.kind === "year" ? YEAR_TOLERANCE : round.kind === "star" ? STAR_TOLERANCE : COMET_TOLERANCE;
  const semiMajorAxisAu = periodYears === null ? null : (starSuns * periodYears ** 2) ** (1 / 3);
  const answer = round.kind === "year" ? YEAR_TARGET ** (2 / 3) : round.kind === "star" ? 1 / STAR_TARGET_PERIOD ** 2 : 4;
  const common = { periodYears, semiMajorAxisAu, path, energyDrift: measured.energyDrift, predictionActual: answer };
  if (periodYears === null) {
    return { ...common, success: false, accuracyFraction: 0, feedback: "The comet does not come back within 40 years: it is moving fast enough to leave the Solar System." };
  }
  const error = Math.abs(periodYears - target);
  const success = error <= tolerance;
  return {
    ...common, success, accuracyFraction: success ? 1 - error / tolerance : 0,
    feedback: success ? `The simulated period is ${periodYears.toFixed(3)} years on an orbit with a = ${semiMajorAxisAu?.toFixed(2)} AU: T²/a³ = ${(periodYears ** 2 / (semiMajorAxisAu ?? 1) ** 3 * starSuns).toFixed(3)} in solar units, as Kepler's third law says.`
      : `The simulated period is ${periodYears.toFixed(3)} years, not ${target}. ${periodYears > target ? "The orbit is too slow: " : "The orbit is too quick: "}${round.kind === "year" ? "change the orbital radius" : round.kind === "star" ? "change the star's mass" : "change the launch speed"}.`,
  };
}

export const solarSystemBuilder = defineNumericGame<SystemRound, SystemOutcome>({
  meta: SYSTEM_META,
  rounds: SYSTEM_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "year" ? { label: "Your prediction of the orbital radius needed", unit: "AU", placeholder: "e.g. 1.59", step: 0.01 }
    : round.kind === "star" ? { label: "Your prediction of the star's mass needed", unit: "Suns", placeholder: "e.g. 4", step: 0.05 }
    : { label: "Your prediction of the semi-major axis", unit: "AU", placeholder: "e.g. 4", step: 0.1 },
  evaluate: (round, values) => runSystem(round, values),
});
