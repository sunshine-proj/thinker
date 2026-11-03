import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateEscapeSpeedAt,
  calculateExcessToLeaveStar,
  calculateLaunchSpeedForExcess,
  calculateMaximumRadius,
  calculateSpecificEnergy,
} from "../../../physics/astronomy";
import {
  ASTRONOMICAL_UNIT,
  EARTH_GRAVITATIONAL_PARAMETER,
  EARTH_MEAN_RADIUS,
  MOON_GRAVITATIONAL_PARAMETER,
  MOON_MEAN_RADIUS,
  SUN_GRAVITATIONAL_PARAMETER,
} from "../../../physics/core";

export type EscapeKind = "moon" | "height" | "solar-system";

export interface EscapeRound extends NumericRound { readonly kind: EscapeKind }

export interface EscapeOutcome extends AttemptOutcome {
  readonly specificEnergy: number;
  readonly escapes: boolean;
  readonly requiredSpeed: number;
  readonly bodyEscapeSpeed: number;
  readonly maximumAltitudeMeters: number | null;
  readonly speedAtInfinity: number | null;
}

export const HEIGHT_TARGET_METERS = 1_000_000;
export const HEIGHT_TOLERANCE_METERS = 50_000;
export const ESCAPE_MARGIN = 0.1;
export const SOLAR_SYSTEM_MARGIN = 0.5;

export const SUN_ESCAPE_AT_EARTH = calculateEscapeSpeedAt(SUN_GRAVITATIONAL_PARAMETER, ASTRONOMICAL_UNIT);
export const EARTH_ORBITAL_SPEED = SUN_ESCAPE_AT_EARTH / Math.SQRT2;
export const SOLAR_SYSTEM_LAUNCH_SPEED = calculateLaunchSpeedForExcess(
  calculateExcessToLeaveStar(EARTH_ORBITAL_SPEED),
  EARTH_GRAVITATIONAL_PARAMETER,
  EARTH_MEAN_RADIUS,
);

export const ESCAPE_META: RoundGameMeta = {
  id: "escape-velocity",
  title: "Escape Velocity",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · ENERGY",
  modelTag: "ENERGY CONSERVATION",
  introduction: "How fast must you go to leave a world behind? Use conservation of energy to find the escape speed of the Moon, to launch a probe to a chosen height from Earth, and to work out what it takes to leave the whole Solar System.",
  instructions: "Predict, set the launch speed, then launch. A projectile escapes when its kinetic energy is at least as large as the gravitational potential energy binding it: total energy zero or more.",
  formula: "ε = v²/2 − μ/r  ·  v_esc = √(2μ/r)  ·  r_max = 2r / (2 − v²r/μ)  ·  v² = v∞² + v_esc²",
  formulaCaption: "ε is the energy per unit mass, μ = GM the gravitational parameter of the body, r the distance from its center and v the speed. r_max is the greatest distance reached by a straight-up launch that does not escape; v∞ is the speed left at infinity.",
  explanation: "Gravity's potential energy is −μ/r, always negative and rising toward zero at infinity. A projectile therefore has total energy ε = v²/2 − μ/r. If ε is negative it cannot reach infinity: it stops at r_max and falls back. If ε is zero or positive it escapes, so the escape speed is the speed for which ε = 0: v = √(2μ/r), whatever the direction. From the Moon this is only 2.4 km/s, from Earth 11.2 km/s. To leave the Solar System from Earth you also need the Sun's escape speed at 1 AU, 42.1 km/s; launching along Earth's own 29.8 km/s motion leaves 12.3 km/s to find, and combining that with Earth's escape speed in energy terms gives a launch speed of 16.7 km/s.",
  assumptions: "Point-mass bodies, no atmosphere or drag, no rotation of the body (a real launch eastward from the equator gets a head start of up to 0.46 km/s from Earth's spin), instantaneous acceleration at launch, and for the last case a patched approximation: the Sun's and Earth's gravity are treated one after the other, with Earth's orbit circular and the launch along its motion.",
  learningObjectives: ["Use energy conservation to find escape speed.", "Compute the greatest height of a launch that does not escape.", "Combine energies to find the launch speed that leaves a star."],
  objective: { title: "Escape every world", description: "Complete each launch.", unit: "launches" },
  controlsHeading: "Plan the launch",
  submitLabel: "Launch",
  solvedLabel: "Launch complete!",
  nextLabel: "Next launch",
};

export const ESCAPE_ROUNDS: readonly EscapeRound[] = Object.freeze([
  {
    id: "leave-the-moon", title: "Leave the Moon", difficulty: "Beginner", kind: "moon",
    situation: `Launch a probe from the Moon's surface so that it just escapes: at least the escape speed but no more than ${ESCAPE_MARGIN * 100} % above it, to save fuel. Moon: μ = 4.90×10¹² m³/s², radius 1737 km.`,
    controls: [slider("speed", "Launch speed", "km/s", 1, 5, 0.01, 2)],
    hint: "Set the energy to zero: v²/2 = μ/R, so v = √(2μ/R).",
  },
  {
    id: "a-thousand-kilometres-up", title: "A thousand kilometres up", difficulty: "Intermediate", kind: "height",
    situation: `Fire a rocket straight up from Earth's surface so that it reaches an altitude of 1000 km (± ${HEIGHT_TOLERANCE_METERS / 1000} km) before falling back. Ignore air resistance.`,
    controls: [slider("speed", "Launch speed", "km/s", 3, 11, 0.01, 6)],
    hint: "Energy is conserved: v²/2 − μ/R = −μ/r_max, with r_max = R + 1000 km. Solve for v.",
  },
  {
    id: "leave-the-solar-system", title: "Leave the Solar System", difficulty: "Advanced", kind: "solar-system",
    situation: `Launch from Earth along its orbital motion so the probe leaves the Sun's pull entirely. Choose the speed relative to Earth at launch, at most ${SOLAR_SYSTEM_MARGIN} km/s above the minimum. Earth moves at 29.8 km/s and the Sun's escape speed at 1 AU is 42.1 km/s.`,
    controls: [fixed("sun", "Sun's escape speed at 1 AU", "km/s", Number((SUN_ESCAPE_AT_EARTH / 1000).toFixed(1))), slider("speed", "Launch speed", "km/s", 10, 25, 0.05, 15)],
    hint: "After leaving Earth the probe needs 42.1 − 29.8 = 12.3 km/s relative to Earth at infinity. At launch, v² = v∞² + v_esc(Earth)², with v_esc = 11.2 km/s.",
  },
]);

function body(kind: EscapeKind) {
  return kind === "moon"
    ? { mu: MOON_GRAVITATIONAL_PARAMETER, radius: MOON_MEAN_RADIUS, name: "the Moon" }
    : { mu: EARTH_GRAVITATIONAL_PARAMETER, radius: EARTH_MEAN_RADIUS, name: "Earth" };
}

export function runEscape(round: EscapeRound, v: NumericControl): EscapeOutcome {
  const speed = (v.speed as number) * 1000;
  const { mu, radius, name } = body(round.kind);
  const energy = calculateSpecificEnergy(speed, mu, radius);
  const escapes = energy >= 0;
  const vEsc = calculateEscapeSpeedAt(mu, radius);
  const rMax = calculateMaximumRadius(speed, mu, radius);
  const altitude = rMax === null ? null : rMax - radius;
  const excess = escapes ? Math.sqrt(2 * energy) : null;
  const common = { specificEnergy: energy, escapes, maximumAltitudeMeters: altitude, speedAtInfinity: excess, bodyEscapeSpeed: vEsc };

  if (round.kind === "moon") {
    const success = escapes && speed <= vEsc * (1 + ESCAPE_MARGIN);
    return {
      ...common, requiredSpeed: vEsc, success, accuracyFraction: success ? 1 - (speed - vEsc) / (vEsc * ESCAPE_MARGIN) : 0, predictionActual: vEsc / 1000,
      feedback: success ? `${(speed / 1000).toFixed(2)} km/s gives non-negative energy (${(energy / 1e6).toFixed(2)} MJ/kg); the escape speed is ${(vEsc / 1000).toFixed(3)} km/s.`
        : !escapes ? `Energy is ${(energy / 1e6).toFixed(2)} MJ/kg, still negative: the probe rises to ${((altitude ?? 0) / 1000).toFixed(0)} km above ${name} and falls back. The escape speed is ${(vEsc / 1000).toFixed(3)} km/s.`
        : `That escapes, but ${(speed / 1000).toFixed(2)} km/s is ${((speed / vEsc - 1) * 100).toFixed(0)} % above the minimum of ${(vEsc / 1000).toFixed(3)} km/s: wasted fuel.`,
    };
  }
  if (round.kind === "height") {
    const vTarget = Math.sqrt(2 * mu * (1 / radius - 1 / (radius + HEIGHT_TARGET_METERS)));
    if (altitude === null) {
      return { ...common, requiredSpeed: vTarget, success: false, accuracyFraction: 0, predictionActual: vTarget / 1000, feedback: `At ${(speed / 1000).toFixed(2)} km/s the rocket has escaped Earth's gravity altogether and never falls back.` };
    }
    const error = Math.abs(altitude - HEIGHT_TARGET_METERS);
    const success = error <= HEIGHT_TOLERANCE_METERS;
    return {
      ...common, requiredSpeed: vTarget, success, accuracyFraction: success ? 1 - error / HEIGHT_TOLERANCE_METERS : 0, predictionActual: vTarget / 1000,
      feedback: success ? `The rocket reaches ${(altitude / 1000).toFixed(0)} km before falling back (energy ${(energy / 1e6).toFixed(2)} MJ/kg).`
        : `The rocket reaches ${(altitude / 1000).toFixed(0)} km, ${altitude > HEIGHT_TARGET_METERS ? "too high" : "short of the target"}. The speed for 1000 km is about ${(vTarget / 1000).toFixed(2)} km/s.`,
    };
  }
  const required = SOLAR_SYSTEM_LAUNCH_SPEED;
  const leavesEarth = escapes;
  const excessSun = leavesEarth ? Math.sqrt(speed ** 2 - vEsc ** 2) : 0;
  const leavesSun = excessSun + EARTH_ORBITAL_SPEED >= SUN_ESCAPE_AT_EARTH - 1e-6;
  const success = leavesSun && speed <= required + SOLAR_SYSTEM_MARGIN * 1000;
  return {
    ...common, requiredSpeed: required, success, accuracyFraction: success ? 1 - (speed - required) / (SOLAR_SYSTEM_MARGIN * 1000) : 0, predictionActual: required / 1000,
    feedback: success ? `After climbing out of Earth's gravity the probe keeps ${(excessSun / 1000).toFixed(1)} km/s, which added to Earth's 29.8 km/s reaches the Sun's escape speed of 42.1 km/s.`
      : !leavesEarth ? `${(speed / 1000).toFixed(2)} km/s is below Earth's escape speed of ${(vEsc / 1000).toFixed(1)} km/s: the probe falls back.`
      : !leavesSun ? `The probe leaves Earth with ${(excessSun / 1000).toFixed(1)} km/s to spare, so it travels at ${((excessSun + EARTH_ORBITAL_SPEED) / 1000).toFixed(1)} km/s around the Sun, short of the 42.1 km/s needed. It stays in orbit around the Sun.`
      : `That leaves the Solar System, but ${(speed / 1000).toFixed(2)} km/s is more than ${SOLAR_SYSTEM_MARGIN} km/s above the minimum of ${(required / 1000).toFixed(2)} km/s.`,
  };
}

/** Speed against distance for the straight-up part of the flight, in km/s, out to 10 radii or the turning point. */
export function speedCurve(round: EscapeRound, v: NumericControl): { x: number; y: number }[] {
  const speed = (v.speed as number) * 1000;
  const { mu, radius } = body(round.kind);
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 200; i += 1) {
    const r = radius * (1 + (9 * i) / 200);
    const squared = speed ** 2 - 2 * mu * (1 / radius - 1 / r);
    if (squared < 0) {
      break;
    }
    points.push({ x: r / radius, y: Math.sqrt(squared) / 1000 });
  }
  return points;
}

export const escapeVelocity = defineNumericGame<EscapeRound, EscapeOutcome>({
  meta: ESCAPE_META,
  rounds: ESCAPE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "moon" ? { label: "Your prediction of the Moon's escape speed", unit: "km/s", placeholder: "e.g. 2.4", step: 0.01 }
    : round.kind === "height" ? { label: "Your prediction of the launch speed needed", unit: "km/s", placeholder: "e.g. 4.1", step: 0.01 }
    : { label: "Your prediction of the launch speed needed", unit: "km/s", placeholder: "e.g. 16.6", step: 0.1 },
  evaluate: (round, values) => runEscape(round, values),
});
