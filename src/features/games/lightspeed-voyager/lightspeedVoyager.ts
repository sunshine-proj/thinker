import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { addVelocities, calculateContractedLength, calculateLorentzFactor, calculateTwinTrip } from "../../../physics/astronomy";

export type VoyagerKind = "twins" | "hangar" | "probe";
export interface VoyagerRound extends NumericRound { readonly kind: VoyagerKind }
export interface VoyagerOutcome extends AttemptOutcome { readonly headline: number; readonly unit: string }

export const TWINS = { distance: 12, crewYears: 5, toleranceYears: 0.2 } as const;
export const HANGAR = { shipLength: 100, hangarLength: 50, minimumLength: 45 } as const;
export const PROBE = { ship: 0.6, probe: 0.6, tolerance: 0.005 } as const;

/** Speed (fraction of c) for which the crew ages the given years on the round trip. */
export function speedForCrewYears(distanceLy: number, crewYears: number): number {
  // Crew years = 2d √(1 − β²)/β, so 1/β² = 1 + (crewYears / 2d)².
  return 1 / Math.sqrt(1 + (crewYears / (2 * distanceLy)) ** 2);
}

export const VOYAGER_META: RoundGameMeta = {
  id: "lightspeed-voyager",
  title: "Lightspeed Voyager",
  eyebrow: "ASTRONOMY · SPECIAL RELATIVITY",
  modelTag: "RELATIVISTIC MODEL (SPECIAL RELATIVITY)",
  introduction: "Pilot a starship close to the speed of light, where clocks slow down and lengths shrink. Choose a speed so the crew ages only five years on a 24 light-year round trip, squeeze a 100 m ship through a 50 m hangar, and fire a probe from a fast ship.",
  instructions: "Predict, then set the speed. This game uses Einstein's special relativity, not everyday mechanics. Near the speed of light, the Lorentz factor γ grows fast: moving clocks tick slower and moving objects are shorter by that factor, and speeds never add up to more than c.",
  formula: "γ = 1/√(1 − β²)  ·  τ = t/γ  ·  L = L₀/γ  ·  w = (u + v)/(1 + uv/c²)",
  formulaCaption: "β = v/c is the speed as a fraction of light speed, τ the time on the moving clock and t on Earth, L₀ an object's length at rest and L its length while moving, and w the combined speed of u and v.",
  explanation: "In special relativity the speed of light is the same for every observer, and that forces time and space to stretch. A clock moving at speed v ticks slower by the Lorentz factor γ: a crew flying at 0.979c to a star 12 light-years away and back spends 24.5 years in Earth's frame but ages only 5. Lengths along the motion shrink by the same factor, so a fast enough ship really does fit, for an Earth observer, inside a hangar half its rest length. Speeds no longer simply add: a probe launched at 0.6c from a ship already moving at 0.6c travels at 0.88c relative to Earth, never past c. These effects are measured every day in particle accelerators, cosmic-ray muons and GPS satellite clocks.",
  assumptions: "Constant speeds in flat space (no gravity), and instantaneous turnaround for the twin trip; the travelling twin is the one who changes direction, which is why the ages differ. What the crew would actually see through the windows (Doppler shifts, aberration) is not modelled.",
  learningObjectives: ["Calculate the Lorentz factor and time dilation.", "Apply length contraction.", "Add velocities relativistically and explain why nothing reaches c."],
  objective: { title: "Fly near light speed", description: "Complete every relativistic mission.", unit: "missions" },
  controlsHeading: "Your speed",
  submitLabel: "Engage the drive",
  solvedLabel: "Relativity rules!",
  nextLabel: "Next mission",
};

export const VOYAGER_ROUNDS: readonly VoyagerRound[] = Object.freeze([
  {
    id: "younger-twin", title: "The younger twin", difficulty: "Beginner", kind: "twins",
    situation: `A star is ${TWINS.distance} light-years away. Choose the ship's speed so the crew ages only ${TWINS.crewYears} years on the round trip (± ${TWINS.toleranceYears} years).`,
    controls: [fixed("distance", "Distance to the star", "ly", TWINS.distance), slider("beta", "Ship speed", "c", 0.5, 0.999, 0.001, 0.9)],
    hint: "Earth time is 2d/β; the crew's time is that divided by γ.",
  },
  {
    id: "fit-the-hangar", title: "Fit the hangar", difficulty: "Intermediate", kind: "hangar",
    situation: `A ${HANGAR.shipLength} m ship flies through a ${HANGAR.hangarLength} m hangar. Choose a speed at which, for an observer in the hangar, the ship fits inside: between ${HANGAR.minimumLength} m and ${HANGAR.hangarLength} m long.`,
    controls: [fixed("length", "Ship's rest length", "m", HANGAR.shipLength), slider("beta", "Ship speed", "c", 0.5, 0.999, 0.001, 0.7)],
    hint: "L = L₀/γ ≤ 50 m means γ ≥ 2.",
  },
  {
    id: "launch-a-probe", title: "Launch a probe", difficulty: "Advanced", kind: "probe",
    situation: `A ship moving at ${PROBE.ship}c fires a probe forward at ${PROBE.probe}c relative to the ship. How fast does the probe move relative to Earth? (± ${PROBE.tolerance}c)`,
    controls: [fixed("ship", "Ship speed", "c", PROBE.ship), slider("beta", "Probe speed relative to Earth", "c", 0.5, 0.999, 0.001, 0.95)],
    hint: "w = (u + v)/(1 + uv) in units of c.",
  },
]);

export function runVoyager(round: VoyagerRound, v: NumericControl): VoyagerOutcome {
  const beta = v.beta as number;
  if (round.kind === "twins") {
    const trip = calculateTwinTrip(TWINS.distance, beta);
    const truth = speedForCrewYears(TWINS.distance, TWINS.crewYears);
    const error = Math.abs(trip.travellerYears - TWINS.crewYears);
    const success = error <= TWINS.toleranceYears;
    return {
      headline: trip.travellerYears, unit: "years", success, accuracyFraction: success ? 1 - error / TWINS.toleranceYears : 0, predictionActual: truth,
      feedback: success
        ? `At ${beta.toFixed(3)}c (γ = ${trip.lorentzFactor.toFixed(2)}) the crew ages ${trip.travellerYears.toFixed(2)} years while ${trip.homeYears.toFixed(1)} years pass on Earth.`
        : `At ${beta.toFixed(3)}c the crew ages ${trip.travellerYears.toFixed(1)} years, ${trip.travellerYears > TWINS.crewYears ? "too many: go faster" : "fewer than planned: you can go a little slower"}.`,
    };
  }
  if (round.kind === "hangar") {
    const length = calculateContractedLength(HANGAR.shipLength, beta);
    const success = length <= HANGAR.hangarLength && length >= HANGAR.minimumLength;
    return {
      headline: length, unit: "m", success, accuracyFraction: success ? (HANGAR.hangarLength - length) / (HANGAR.hangarLength - HANGAR.minimumLength) : 0, predictionActual: Math.sqrt(1 - (HANGAR.hangarLength / HANGAR.shipLength) ** 2),
      feedback: success
        ? `At ${beta.toFixed(3)}c (γ = ${calculateLorentzFactor(beta).toFixed(2)}) the ship measures ${length.toFixed(1)} m in the hangar's frame: it fits. In the ship's own frame the hangar is the one that shrinks.`
        : length > HANGAR.hangarLength ? `At ${beta.toFixed(3)}c the ship is still ${length.toFixed(1)} m long: faster.` : `At ${beta.toFixed(3)}c the ship shrinks to ${length.toFixed(1)} m, shorter than the ${HANGAR.minimumLength} m asked for.`,
    };
  }
  const truth = addVelocities(PROBE.ship, PROBE.probe);
  const error = Math.abs(beta - truth);
  const success = error <= PROBE.tolerance;
  return {
    headline: truth, unit: "c", success, accuracyFraction: success ? 1 - error / PROBE.tolerance : 0, predictionActual: truth,
    feedback: success
      ? `(0.6 + 0.6)/(1 + 0.36) = ${truth.toFixed(3)}c, not 1.2c: relativistic speeds never add up to the speed of light.`
      : `${beta.toFixed(3)}c is ${beta > truth ? "too fast" : "too slow"}: simple addition would give 1.2c, which is impossible.`,
  };
}

export const lightspeedVoyager = defineNumericGame<VoyagerRound, VoyagerOutcome>({
  meta: VOYAGER_META,
  rounds: VOYAGER_ROUNDS,
  prediction: (): PredictionSpec => ({ label: "Your prediction of the speed", unit: "c", placeholder: "e.g. 0.9", step: 0.001 }),
  evaluate: (round, values) => runVoyager(round, values),
});
