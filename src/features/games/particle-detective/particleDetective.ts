import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { ELECTRON_MASS, ELEMENTARY_CHARGE, PROTON_MASS } from "../../../physics/core";
import {
  ELECTRON_REST_ENERGY_MEV,
  calculateClassicalKineticEnergyMeV,
  calculateGyroradius,
  calculateKineticEnergyMeV,
  calculateMomentumFromKineticEnergy,
  calculateMomentumFromRadius,
} from "../../../physics/quantum";

export type TrackKind = "mass" | "nucleus" | "energy";

export interface TrackRound extends NumericRound { readonly kind: TrackKind }

export interface TrackOutcome extends AttemptOutcome {
  /** Radius of the track your particle would make, m. */
  readonly radiusMeters: number;
  /** Radius that was measured in the detector, m. */
  readonly measuredRadiusMeters: number;
  readonly momentumMeVc: number | null;
}

export const FIELD_TESLA = 0.01;
export const SPEED = 1e6;
export const PROTON_ELECTRON_RATIO = PROTON_MASS / ELECTRON_MASS;
export const PROTON_TRACK_RADIUS = calculateGyroradius(PROTON_MASS, ELEMENTARY_CHARGE, SPEED, FIELD_TESLA);
export const ALPHA_TRACK_RADIUS = 2 * PROTON_TRACK_RADIUS;
export const MASS_TOLERANCE = 0.03;
export const ELECTRON_FIELD = 0.5;
export const ELECTRON_RADIUS = 0.1;
export const ELECTRON_ENERGY_MEV = calculateKineticEnergyMeV(calculateMomentumFromRadius(ELEMENTARY_CHARGE, ELECTRON_FIELD, ELECTRON_RADIUS), ELECTRON_REST_ENERGY_MEV);
export const ENERGY_TOLERANCE_MEV = 0.5;

export const TRACK_META: RoundGameMeta = {
  id: "particle-detective",
  title: "Particle Detective",
  eyebrow: "MODERN PHYSICS · PARTICLES",
  modelTag: "CURVED TRACKS IN A MAGNETIC FIELD",
  introduction: "Identify unknown particles from the curved tracks they leave in a detector. A magnetic field bends each track; its radius reveals the particle's mass, charge and energy.",
  instructions: "Predict, then deduce. The same field bends a heavier or faster particle less, and a more highly charged one more. Combine the track radius with other clues to pin down what passed through.",
  formula: "r = p/(qB) = γmv/(qB)  ·  p = qBr  ·  T = √((pc)² + (mc²)²) − mc²",
  formulaCaption: "r is the radius of the track, p the momentum, q the charge, B the magnetic field, m the mass and v the speed of the particle, γ = 1/√(1 − v²/c²). T is the kinetic energy and c the speed of light.",
  explanation: "A charged particle moving across a magnetic field feels a force at right angles to its motion, so it travels in a circle. The momentum measured from the radius, p = qBr, is the key quantity. For a given speed and field, the radius is proportional to mass over charge: a proton's track is 1836 times wider than an electron's, and an alpha particle (4 mass units, charge 2) curves half as much as a proton. Charge also shows as how densely the track ionizes the gas (proportional to q²). At high speeds the kinetic energy must be found relativistically: a 15 MeV electron travels almost at the speed of light, and the classical formula would be wrong by a factor of fifteen.",
  assumptions: "A uniform magnetic field perpendicular to the motion, a vacuum or thin gas so the particle loses negligible energy (real tracks spiral inward), and no electric field. Rest energies are taken from standard values.",
  learningObjectives: ["Relate the track radius to momentum and charge-to-mass ratio.", "Combine track curvature with ionization to identify a nucleus.", "Calculate kinetic energy relativistically from momentum."],
  objective: { title: "Identify every track", description: "Solve each detector case.", unit: "tracks" },
  controlsHeading: "Your identification",
  submitLabel: "Identify the particle",
  solvedLabel: "Particle identified!",
  nextLabel: "Next track",
};

export const TRACK_ROUNDS: readonly TrackRound[] = Object.freeze([
  {
    id: "light-or-heavy", title: "Light or heavy?", difficulty: "Beginner", kind: "mass",
    situation: `A particle with charge +e moving at 1000 km/s through a ${FIELD_TESLA} T field makes a circular track of radius ${PROTON_TRACK_RADIUS.toFixed(3)} m. What is its mass, in electron masses (within ${MASS_TOLERANCE * 100} %)?`,
    controls: [fixed("field", "Magnetic field", "T", FIELD_TESLA), slider("mass", "Mass of the particle", "electron masses", 1, 4000, 1, 1000)],
    hint: "r = mv/(eB), so m = eBr/v. Compare with the electron's mass of 9.11×10⁻³¹ kg.",
  },
  {
    id: "the-heavy-nucleus", title: "The heavy nucleus", difficulty: "Intermediate", kind: "nucleus",
    situation: `A nucleus at the same speed and field makes a track of radius ${ALPHA_TRACK_RADIUS.toFixed(3)} m, twice a proton's. Its ionization trail is 4 times a proton's, so charge² = 4. Identify its charge (in e) and mass (in proton masses).`,
    controls: [fixed("field", "Magnetic field", "T", FIELD_TESLA), slider("charge", "Charge", "e", 1, 4, 1, 1), slider("mass", "Mass number", "proton masses", 1, 8, 1, 1)],
    hint: "The radius is proportional to mass/charge: A/q = 2. Ionization ∝ q² = 4 fixes q.",
  },
  {
    id: "fast-electron", title: "A fast electron", difficulty: "Advanced", kind: "energy",
    situation: `An electron makes a track of radius ${ELECTRON_RADIUS} m in a ${ELECTRON_FIELD} T field. What is its kinetic energy in MeV (within ${ENERGY_TOLERANCE_MEV} MeV)? Its rest energy is ${ELECTRON_REST_ENERGY_MEV.toFixed(3)} MeV.`,
    controls: [fixed("field", "Magnetic field", "T", ELECTRON_FIELD), slider("energy", "Kinetic energy", "MeV", 1, 300, 0.1, 50)],
    hint: "p = eBr gives pc = 15.0 MeV (pc in MeV = 299.79 × B × r). Then T = √((pc)² + (mc²)²) − mc².",
  },
]);

export function runTrack(round: TrackRound, v: NumericControl): TrackOutcome {
  if (round.kind === "mass") {
    const ratio = v.mass as number;
    const radius = calculateGyroradius(ratio * ELECTRON_MASS, ELEMENTARY_CHARGE, SPEED, FIELD_TESLA);
    const error = Math.abs(ratio - PROTON_ELECTRON_RATIO) / PROTON_ELECTRON_RATIO;
    const success = error <= MASS_TOLERANCE;
    return {
      radiusMeters: radius, measuredRadiusMeters: PROTON_TRACK_RADIUS, momentumMeVc: null, success, accuracyFraction: success ? 1 - error / MASS_TOLERANCE : 0, predictionActual: PROTON_ELECTRON_RATIO,
      feedback: success ? `${ratio.toFixed(0)} electron masses curve with a radius of ${radius.toFixed(3)} m, matching the track: it is a proton (1836 electron masses).`
        : `${ratio.toFixed(0)} electron masses would bend with a radius of ${radius.toFixed(3)} m, ${radius > PROTON_TRACK_RADIUS ? "wider" : "tighter"} than the measured ${PROTON_TRACK_RADIUS.toFixed(3)} m.`,
    };
  }
  if (round.kind === "nucleus") {
    const q = v.charge as number;
    const a = v.mass as number;
    const radius = calculateGyroradius(a * PROTON_MASS, q * ELEMENTARY_CHARGE, SPEED, FIELD_TESLA);
    const success = q === 2 && a === 4;
    return {
      radiusMeters: radius, measuredRadiusMeters: ALPHA_TRACK_RADIUS, momentumMeVc: null, success, accuracyFraction: success ? 1 : 0, predictionActual: 4,
      feedback: success ? "Charge 2e and mass 4 u: a helium-4 nucleus, an alpha particle. Its track radius is 2 × a proton's."
        : q !== 2 ? `A charge of ${q}e would ionize ${q * q} times as strongly as a proton, but the trail is 4 times: the charge must be 2e.`
        : `Charge 2e is right, but mass ${a} gives a radius of ${radius.toFixed(3)} m instead of ${ALPHA_TRACK_RADIUS.toFixed(3)} m.`,
    };
  }
  const energy = v.energy as number;
  const p = calculateMomentumFromKineticEnergy(energy, ELECTRON_REST_ENERGY_MEV);
  const radius = p / (ELEMENTARY_CHARGE * ELECTRON_FIELD);
  const error = Math.abs(energy - ELECTRON_ENERGY_MEV);
  const success = error <= ENERGY_TOLERANCE_MEV;
  const classical = calculateClassicalKineticEnergyMeV(calculateMomentumFromRadius(ELEMENTARY_CHARGE, ELECTRON_FIELD, ELECTRON_RADIUS), ELECTRON_MASS);
  return {
    radiusMeters: radius, measuredRadiusMeters: ELECTRON_RADIUS, momentumMeVc: (p * 299792458) / ELEMENTARY_CHARGE / 1e6, success,
    accuracyFraction: success ? 1 - error / ENERGY_TOLERANCE_MEV : 0, predictionActual: ELECTRON_ENERGY_MEV,
    feedback: success ? `pc = ${(ELECTRON_FIELD * ELECTRON_RADIUS * 299.792458).toFixed(2)} MeV, so T = √((pc)² + (mc²)²) − mc² = ${ELECTRON_ENERGY_MEV.toFixed(2)} MeV. Classical ½mv² would wrongly give ${classical.toFixed(0)} MeV.`
      : `${energy.toFixed(1)} MeV would curve with a radius of ${radius.toFixed(3)} m, not ${ELECTRON_RADIUS} m. Use T = √((pc)² + (mc²)²) − mc², not ½mv².`,
  };
}

export const particleDetective = defineNumericGame<TrackRound, TrackOutcome>({
  meta: TRACK_META,
  rounds: TRACK_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "mass" ? { label: "Your prediction of the mass", unit: "electron masses", placeholder: "e.g. 1836", step: 1 }
    : round.kind === "nucleus" ? { label: "Your prediction of the mass number", unit: "u", placeholder: "e.g. 4", step: 1 }
    : { label: "Your prediction of the kinetic energy", unit: "MeV", placeholder: "e.g. 14.5", step: 0.1 },
  evaluate: (round, values) => runTrack(round, values),
});
