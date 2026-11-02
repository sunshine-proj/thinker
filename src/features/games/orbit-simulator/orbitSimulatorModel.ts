import { EARTH_GRAVITATIONAL_PARAMETER as MU, EARTH_MEAN_RADIUS, Vector2 } from "../../../physics/core";
import {
  calculateOrbitalElements,
  integrateOrbit,
  type OrbitIntegration,
  type OrbitalElements,
} from "../../../physics/astronomy";
import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, RoundGameDefinition } from "../../../game-engine/rounds/types";
import {
  ATMOSPHERE_ALTITUDE_KM,
  ORBIT_ROUNDS,
  ORBIT_SIMULATOR_META,
  type OrbitControl,
  type OrbitRound,
} from "./orbitSimulatorData";

export interface OrbitOutcome extends AttemptOutcome {
  readonly elements: OrbitalElements;
  readonly periapsisAltitudeKm: number;
  readonly apoapsisAltitudeKm: number | null;
  readonly periodMinutes: number | null;
  readonly reEntry: boolean;
}

const KM = 1000;

export function resolveLaunch(round: OrbitRound, control: OrbitControl): { altitudeKm: number; speedKmPerSecond: number } {
  const altitudeKm = round.altitudeKm.fixed ?? control.altitudeKm;
  if (altitudeKm < round.altitudeKm.minimum || altitudeKm > round.altitudeKm.maximum) {
    throw new RangeError(`The launch altitude must be between ${round.altitudeKm.minimum} and ${round.altitudeKm.maximum} km.`);
  }
  const { minimum, maximum } = round.speedKmPerSecond;
  if (control.speedKmPerSecond < minimum || control.speedKmPerSecond > maximum) {
    throw new RangeError(`The launch speed must be between ${minimum} and ${maximum} km/s.`);
  }
  return { altitudeKm, speedKmPerSecond: control.speedKmPerSecond };
}

export function launchState(round: OrbitRound, control: OrbitControl) {
  const { altitudeKm, speedKmPerSecond } = resolveLaunch(round, control);
  return {
    position: new Vector2(EARTH_MEAN_RADIUS + altitudeKm * KM, 0),
    velocity: new Vector2(0, speedKmPerSecond * KM),
  };
}

export function orbitElementsFor(round: OrbitRound, control: OrbitControl): OrbitalElements {
  const state = launchState(round, control);
  return calculateOrbitalElements(MU, state.position, state.velocity);
}

/** The simulated path for drawing: about one period for bound orbits, until far away if unbound. */
export function orbitPath(round: OrbitRound, control: OrbitControl, escapeRadiusMeters = 8e7): OrbitIntegration {
  const state = launchState(round, control);
  const elements = calculateOrbitalElements(MU, state.position, state.velocity);
  const duration = elements.period === null ? 1e6 : elements.period * 1.02;
  return integrateOrbit(MU, state, duration, {
    collisionRadius: EARTH_MEAN_RADIUS,
    escapeRadius: escapeRadiusMeters,
  });
}

export function evaluateOrbit(round: OrbitRound, control: OrbitControl): OrbitOutcome {
  const elements = orbitElementsFor(round, control);
  const periapsisAltitudeKm = (elements.periapsis - EARTH_MEAN_RADIUS) / KM;
  const apoapsisAltitudeKm = elements.apoapsis === null ? null : (elements.apoapsis - EARTH_MEAN_RADIUS) / KM;
  const periodMinutes = elements.period === null ? null : elements.period / 60;
  const reEntry = periapsisAltitudeKm < ATMOSPHERE_ALTITUDE_KM;
  const { goal } = round;
  const base = { elements, periapsisAltitudeKm, apoapsisAltitudeKm, periodMinutes, reEntry };
  const predictionActual = periodMinutes;

  if (!elements.bound) {
    return { ...base, success: false, accuracyFraction: 0, predictionActual, feedback: "That speed is at or above escape speed, so the satellite leaves the Earth for good. Slow it down." };
  }
  if (reEntry) {
    return {
      ...base,
      success: false,
      accuracyFraction: 0,
      predictionActual,
      feedback: `The orbit dips to ${periapsisAltitudeKm.toFixed(0)} km, inside the atmosphere, and the satellite re-enters. Launching below circular speed lowers the opposite side of the orbit.`,
    };
  }

  let success = false;
  let accuracyFraction = 0;
  let feedback: string;
  if (goal.kind === "circular") {
    success = elements.eccentricity <= goal.maximumEccentricity;
    accuracyFraction = success ? 1 - elements.eccentricity / goal.maximumEccentricity : 0;
    feedback = success
      ? `The orbit is nearly circular (eccentricity ${elements.eccentricity.toFixed(3)}) with a period of ${(periodMinutes as number).toFixed(1)} minutes.`
      : `The orbit is an ellipse (eccentricity ${elements.eccentricity.toFixed(3)}) between ${periapsisAltitudeKm.toFixed(0)} and ${(apoapsisAltitudeKm as number).toFixed(0)} km. Adjust the speed toward √(μ/r).`;
  } else if (goal.kind === "apoapsis") {
    const error = Math.abs((apoapsisAltitudeKm as number) - goal.targetAltitudeKm);
    success = error <= goal.toleranceKm;
    accuracyFraction = success ? 1 - error / goal.toleranceKm : 0;
    feedback = success
      ? `The highest point is ${(apoapsisAltitudeKm as number).toFixed(0)} km above the Earth.`
      : `The highest point is ${(apoapsisAltitudeKm as number).toFixed(0)} km, not ${goal.targetAltitudeKm} km. ${(apoapsisAltitudeKm as number) < goal.targetAltitudeKm ? "Launch faster" : "Launch slower"}.`;
  } else {
    const periodError = Math.abs((periodMinutes as number) - goal.targetMinutes) / goal.targetMinutes;
    const circularOk = elements.eccentricity <= goal.maximumEccentricity;
    success = periodError <= goal.toleranceFraction && circularOk;
    accuracyFraction = success
      ? 1 - Math.max(periodError / goal.toleranceFraction, elements.eccentricity / goal.maximumEccentricity)
      : 0;
    feedback = success
      ? `A circular orbit with a period of ${(periodMinutes as number).toFixed(1)} minutes.`
      : !circularOk
        ? `The orbit is too elliptical (eccentricity ${elements.eccentricity.toFixed(3)}): the speed does not match this altitude. Use v = √(μ/r).`
        : `The period is ${(periodMinutes as number).toFixed(1)} minutes, ${(periodError * 100).toFixed(1)}% from the ${goal.targetMinutes} minute target. ${(periodMinutes as number) < goal.targetMinutes ? "A higher orbit takes longer" : "A lower orbit is quicker"}.`;
  }

  return { ...base, success, accuracyFraction, predictionActual, feedback };
}

export const orbitSimulator: RoundGameDefinition<OrbitRound, OrbitControl, OrbitOutcome> = {
  meta: ORBIT_SIMULATOR_META,
  rounds: ORBIT_ROUNDS,
  createControl: (round) => ({
    altitudeKm: round.altitudeKm.fixed ?? 1000,
    speedKmPerSecond: Number(((round.speedKmPerSecond.minimum + round.speedKmPerSecond.maximum) / 2).toFixed(2)),
  }),
  parseControl: (raw, round) => {
    if (!isRecord(raw)) {
      return null;
    }
    const altitudeKm = readNumber(raw, "altitudeKm", round.altitudeKm.minimum, round.altitudeKm.maximum);
    const speedKmPerSecond = readNumber(raw, "speedKmPerSecond", round.speedKmPerSecond.minimum, round.speedKmPerSecond.maximum);
    return altitudeKm === null || speedKmPerSecond === null
      ? null
      : { altitudeKm: round.altitudeKm.fixed ?? altitudeKm, speedKmPerSecond };
  },
  prediction: () => ({
    label: "Your prediction of the orbital period",
    unit: "minutes",
    placeholder: "e.g. 95",
    step: 0.1,
  }),
  evaluate: (round, control) => evaluateOrbit(round, control),
};
