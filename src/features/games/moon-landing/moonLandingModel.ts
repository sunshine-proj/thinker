import { LUNAR_GRAVITY } from "../../../physics/core";
import { simulateVerticalDescent, type DescentResult } from "../../../physics/mechanics";
import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, RoundGameDefinition } from "../../../game-engine/rounds/types";
import {
  LANDER,
  LANDING_ROUNDS,
  MOON_LANDING_META,
  SAFE_TOUCHDOWN_SPEED,
  type LandingControl,
  type LandingRound,
} from "./moonLandingData";

export interface LandingOutcome extends AttemptOutcome {
  readonly descent: DescentResult;
}

export function runDescent(round: LandingRound, control: LandingControl): DescentResult {
  const { ignition, throttle } = round;
  if (control.ignitionAltitudeMeters < ignition.minimum || control.ignitionAltitudeMeters > ignition.maximum) {
    throw new RangeError(`Ignition altitude must be between ${ignition.minimum} and ${ignition.maximum} m.`);
  }
  if (control.throttle < throttle.minimum || control.throttle > throttle.maximum) {
    throw new RangeError(`Throttle must be between ${Math.round(throttle.minimum * 100)}% and ${Math.round(throttle.maximum * 100)}%.`);
  }
  return simulateVerticalDescent({
    gravityMetersPerSecondSquared: LUNAR_GRAVITY,
    dryMassKilograms: LANDER.dryMassKilograms,
    fuelMassKilograms: round.fuelKilograms,
    maximumThrustNewtons: LANDER.maximumThrustNewtons,
    specificImpulseSeconds: LANDER.specificImpulseSeconds,
    initialAltitudeMeters: round.initialAltitudeMeters,
    initialVelocityMetersPerSecond: -round.initialDownwardSpeed,
    ignitionAltitudeMeters: control.ignitionAltitudeMeters,
    throttle: control.throttle,
  });
}

export function evaluateLanding(round: LandingRound, control: LandingControl): LandingOutcome {
  const descent = runDescent(round, control);
  const speed = descent.touchdownSpeedMetersPerSecond;
  const success = descent.end === "touchdown" && speed <= SAFE_TOUCHDOWN_SPEED;

  let feedback: string;
  if (descent.end === "timeout") {
    feedback = "The lander never reached the surface.";
  } else if (success) {
    feedback = `Touchdown at ${speed.toFixed(1)} m/s after burning ${descent.fuelUsedKilograms.toFixed(1)} kg of propellant.`;
  } else if (descent.fuelExhausted) {
    feedback = `The propellant ran out before the lander stopped, and it hit the surface at ${speed.toFixed(1)} m/s. A harder burn finishes sooner and uses less fuel.`;
  } else if (descent.cutoffTimeSeconds !== null && descent.cutoffTimeSeconds < (descent.samples.at(-1)?.timeSeconds ?? 0) - 1) {
    feedback = `You ignited too early: the lander stopped above the surface, the engine cut off, and it fell the rest of the way, landing at ${speed.toFixed(1)} m/s.`;
  } else {
    feedback = `You ignited too late: the engine could not slow the lander in time, and it hit at ${speed.toFixed(1)} m/s (the legs take ${SAFE_TOUCHDOWN_SPEED} m/s). Ignite higher up.`;
  }

  return {
    success,
    accuracyFraction: success ? 1 - speed / SAFE_TOUCHDOWN_SPEED : 0,
    predictionActual: descent.fuelUsedKilograms,
    feedback,
    descent,
  };
}

export const moonLanding: RoundGameDefinition<LandingRound, LandingControl, LandingOutcome> = {
  meta: MOON_LANDING_META,
  rounds: LANDING_ROUNDS,
  createControl: (round) => ({
    ignitionAltitudeMeters: Math.round((round.ignition.minimum + round.ignition.maximum) / 2),
    throttle: round.throttle.maximum,
  }),
  parseControl: (raw, round) => {
    if (!isRecord(raw)) {
      return null;
    }
    const ignitionAltitudeMeters = readNumber(raw, "ignitionAltitudeMeters", round.ignition.minimum, round.ignition.maximum);
    const throttle = readNumber(raw, "throttle", round.throttle.minimum, round.throttle.maximum);
    return ignitionAltitudeMeters === null || throttle === null ? null : { ignitionAltitudeMeters, throttle };
  },
  prediction: () => ({
    label: "Your prediction of the propellant used",
    unit: "kg",
    placeholder: "e.g. 65",
    step: 0.1,
  }),
  evaluate: (round, control) => evaluateLanding(round, control),
};
