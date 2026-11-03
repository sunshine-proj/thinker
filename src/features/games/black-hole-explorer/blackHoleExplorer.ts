import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  SOLAR_MASS,
  calculateIscoRadius,
  calculateMassFromSchwarzschildRadius,
  calculateSchwarzschildRadius,
  calculateTimeDilationFactor,
  classifyCircularOrbit,
  type OrbitClass,
} from "../../../physics/astronomy";

export type HoleKind = "horizon" | "time" | "orbit";

export interface HoleRound extends NumericRound { readonly kind: HoleKind }

export interface HoleOutcome extends AttemptOutcome {
  readonly horizonKm: number;
  readonly radiusKm: number;
  readonly timeFactor: number | null;
  readonly orbit: OrbitClass;
  readonly iscoKm: number;
}

export const FIXED_MASS = 10;
export const HORIZON_TARGET_KM = 30;
export const HORIZON_TOLERANCE_KM = 1;
export const FACTOR_TARGET = 0.5;
export const FACTOR_TOLERANCE = 0.02;
export const ISCO_TOLERANCE_KM = 3;

export const HOLE_META: RoundGameMeta = {
  id: "black-hole-explorer",
  title: "Black Hole Explorer",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · RELATIVITY",
  modelTag: "SCHWARZSCHILD BLACK HOLE",
  introduction: "Explore the geometry of a non-rotating black hole: how large its horizon is for a given mass, how much slower clocks tick near it, and where a spacecraft can safely orbit.",
  instructions: "Predict, set the controls and test. Relativity matters here: Newtonian formulas fail near the horizon, so use the exact Schwarzschild results.",
  formula: "r_s = 2GM/c²  ·  clock rate = √(1 − r_s/r)  ·  photon sphere 1.5 r_s  ·  ISCO = 3 r_s",
  formulaCaption: "G is the gravitational constant, M the mass, c the speed of light and r the Schwarzschild radius coordinate. The clock rate compares a clock held at rest at radius r with one far away. ISCO is the innermost stable circular orbit.",
  explanation: "A black hole's event horizon sits at r_s = 2GM/c², about 2.95 km per solar mass; nothing inside can send a signal out. Near the horizon, time itself runs slower as seen from far away: a clock at 4/3 r_s ticks at half the distant rate. Light can circle the hole at 1.5 r_s, but this orbit is unstable, and for matter circular orbits are stable only beyond 3 r_s. Closer than that, a nudge sends a spacecraft either outward or plunging into the horizon, so a safe station keeps to the ISCO or farther.",
  assumptions: "A non-rotating, uncharged black hole in empty space (the Schwarzschild solution), observers far from other masses, and the Schwarzschild radial coordinate. Real black holes spin, which moves the ISCO and the horizon, and have accretion disks. Classical gravity is not valid here, so relativistic results are labeled as such.",
  learningObjectives: ["Compute the Schwarzschild radius from mass.", "Describe gravitational time dilation near a horizon.", "Locate the photon sphere and the innermost stable orbit."],
  objective: { title: "Explore the hole", description: "Complete each investigation.", unit: "investigations" },
  controlsHeading: "Set the black hole",
  submitLabel: "Run the observation",
  solvedLabel: "Observation complete!",
  nextLabel: "Next investigation",
};

export const HOLE_ROUNDS: readonly HoleRound[] = Object.freeze([
  {
    id: "size-of-the-horizon", title: "Size of the horizon", difficulty: "Beginner", kind: "horizon",
    situation: `A black hole must have an event horizon of radius ${HORIZON_TARGET_KM} km (± ${HORIZON_TOLERANCE_KM} km). Choose its mass in solar masses.`,
    controls: [slider("mass", "Mass", "solar masses", 1, 100, 0.1, 5)],
    hint: "r_s = 2GM/c² is about 2.95 km for every solar mass.",
  },
  {
    id: "slow-clocks", title: "Slow clocks", difficulty: "Intermediate", kind: "time",
    situation: `A 10 solar-mass black hole. Hold a clock at rest at a radius where it ticks at ${FACTOR_TARGET} of the rate of a distant clock (± ${FACTOR_TOLERANCE}).`,
    controls: [fixed("mass", "Mass", "solar masses", FIXED_MASS), slider("radius", "Radius of the clock", "km", 20, 300, 0.5, 100)],
    hint: "Solve √(1 − r_s/r) = 0.5 for r in units of r_s, then convert with r_s = 29.5 km.",
  },
  {
    id: "the-safe-station", title: "The safe station", difficulty: "Advanced", kind: "orbit",
    situation: `Place a station on the closest stable circular orbit around a 10 solar-mass black hole (± ${ISCO_TOLERANCE_KM} km). Closer in, orbits are unstable or do not exist.`,
    controls: [fixed("mass", "Mass", "solar masses", FIXED_MASS), slider("radius", "Orbital radius", "km", 20, 150, 0.5, 60)],
    hint: "The innermost stable circular orbit of a Schwarzschild black hole is at 3 r_s.",
  },
]);

export function runHole(round: HoleRound, v: NumericControl): HoleOutcome {
  const massSuns = v.mass as number;
  const rs = calculateSchwarzschildRadius(massSuns * SOLAR_MASS);
  const horizonKm = rs / 1000;
  const isco = calculateIscoRadius(rs) / 1000;
  if (round.kind === "horizon") {
    const error = Math.abs(horizonKm - HORIZON_TARGET_KM);
    const success = error <= HORIZON_TOLERANCE_KM;
    return {
      horizonKm, radiusKm: horizonKm, timeFactor: null, orbit: "inside-horizon", iscoKm: isco, success,
      accuracyFraction: success ? 1 - error / HORIZON_TOLERANCE_KM : 0, predictionActual: calculateMassFromSchwarzschildRadius(HORIZON_TARGET_KM * 1000) / SOLAR_MASS,
      feedback: success ? `${massSuns.toFixed(1)} solar masses give r_s = 2GM/c² = ${horizonKm.toFixed(1)} km: the whole mass sits inside a sphere about the size of a city.`
        : `${massSuns.toFixed(1)} solar masses give a horizon of ${horizonKm.toFixed(1)} km, ${horizonKm > HORIZON_TARGET_KM ? "too large" : "too small"}.`,
    };
  }
  const radiusKm = v.radius as number;
  const orbit = classifyCircularOrbit(radiusKm * 1000, rs);
  const factor = radiusKm * 1000 > rs ? calculateTimeDilationFactor(radiusKm * 1000, rs) : null;
  const common = { horizonKm, radiusKm, timeFactor: factor, orbit, iscoKm: isco };
  if (round.kind === "time") {
    const targetKm = (horizonKm / (1 - FACTOR_TARGET ** 2));
    if (factor === null) {
      return { ...common, success: false, accuracyFraction: 0, predictionActual: targetKm, feedback: `${radiusKm} km is at or inside the event horizon (${horizonKm.toFixed(1)} km): no clock can be held at rest there.` };
    }
    const error = Math.abs(factor - FACTOR_TARGET);
    const success = error <= FACTOR_TOLERANCE;
    return {
      ...common, success, accuracyFraction: success ? 1 - error / FACTOR_TOLERANCE : 0, predictionActual: targetKm,
      feedback: success ? `At ${radiusKm} km (${(radiusKm / horizonKm).toFixed(2)} r_s) a clock ticks at ${factor.toFixed(3)} of the distant rate: one hour there is ${(1 / factor).toFixed(2)} hours far away.`
        : `A clock at ${radiusKm} km runs at ${factor.toFixed(3)} of the distant rate, ${factor > FACTOR_TARGET ? "too fast: go closer" : "too slow: move out"}.`,
    };
  }
  const error = Math.abs(radiusKm - isco);
  const success = orbit === "stable" && error <= ISCO_TOLERANCE_KM;
  return {
    ...common, success, accuracyFraction: success ? 1 - error / ISCO_TOLERANCE_KM : 0, predictionActual: isco,
    feedback: success ? `${radiusKm} km is 3 r_s: the closest radius where a circular orbit is stable.`
      : orbit === "inside-horizon" ? "That radius is inside the event horizon: nothing can orbit there."
      : orbit === "no-orbit" ? "Between the horizon and the photon sphere (1.5 r_s) no circular orbit exists at all: even a rocket must fall in."
      : orbit === "unstable" ? `At ${(radiusKm / horizonKm).toFixed(2)} r_s a circular orbit exists but is unstable (inside 3 r_s): the slightest nudge sends the station plunging in or flying out.`
      : `That orbit is stable, but ${radiusKm} km is far outside the closest stable orbit at ${isco.toFixed(1)} km.`,
  };
}

export const blackHoleExplorer = defineNumericGame<HoleRound, HoleOutcome>({
  meta: HOLE_META,
  rounds: HOLE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "horizon" ? { label: "Your prediction of the mass needed", unit: "solar masses", placeholder: "e.g. 10", step: 0.1 }
    : round.kind === "time" ? { label: "Your prediction of the radius needed", unit: "km", placeholder: "e.g. 40", step: 0.1 }
    : { label: "Your prediction of the innermost stable orbit", unit: "km", placeholder: "e.g. 88", step: 0.1 },
  evaluate: (round, values) => runHole(round, values),
});
