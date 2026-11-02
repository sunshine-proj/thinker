import {
  STANDARD_GRAVITY,
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
} from "../core";

/**
 * Vertical powered descent of a rocket lander in uniform gravity.
 *
 * Equations of motion (up is positive): dh/dt = v, dv/dt = −g + T/m, and the
 * mass falls as dm/dt = −T / (I_sp g₀) while the engine burns, where T is
 * thrust, I_sp the specific impulse (s) and g₀ = 9.80665 m/s². Integrating a
 * burn gives the Tsiolkovsky rocket equation Δv = I_sp g₀ ln(m₀/m₁). Integration
 * uses classical fourth-order Runge–Kutta with a fixed step.
 *
 * Guidance rule (a modelling choice): the engine ignites when the lander falls
 * to the ignition altitude and cuts off when the vertical velocity reaches
 * zero, so the lander never hovers or climbs under power.
 *
 * Limitations: one dimension only (no horizontal motion or attitude), constant
 * gravity (valid for a few kilometers above the surface), instant ignition and
 * cut-off, constant specific impulse, and a flat surface.
 */
export interface DescentParameters {
  readonly gravityMetersPerSecondSquared: number;
  readonly dryMassKilograms: number;
  readonly fuelMassKilograms: number;
  readonly maximumThrustNewtons: number;
  readonly specificImpulseSeconds: number;
  readonly initialAltitudeMeters: number;
  /** Negative when moving down. */
  readonly initialVelocityMetersPerSecond: number;
  readonly ignitionAltitudeMeters: number;
  /** Fraction of maximum thrust, in (0, 1]. */
  readonly throttle: number;
  readonly timeStepSeconds?: number;
  readonly maximumTimeSeconds?: number;
}

export interface DescentSample {
  readonly timeSeconds: number;
  readonly altitudeMeters: number;
  readonly velocityMetersPerSecond: number;
  readonly massKilograms: number;
  readonly engineOn: boolean;
}

export type DescentEnd = "touchdown" | "timeout";

export interface DescentResult {
  readonly samples: readonly DescentSample[];
  readonly end: DescentEnd;
  /** Downward speed at touchdown, m/s (0 if the lander never landed). */
  readonly touchdownSpeedMetersPerSecond: number;
  readonly fuelUsedKilograms: number;
  readonly fuelExhausted: boolean;
  readonly ignitionTimeSeconds: number | null;
  readonly cutoffTimeSeconds: number | null;
  /** Downward speed when the engine ignited, m/s. */
  readonly ignitionSpeedMetersPerSecond: number | null;
}

/** Tsiolkovsky: Δv = I_sp g₀ ln(m₀ / m₁). */
export function calculateRocketDeltaV(
  specificImpulseSeconds: number,
  initialMassKilograms: number,
  finalMassKilograms: number,
): number {
  assertPositive(specificImpulseSeconds, "specificImpulseSeconds");
  assertPositive(finalMassKilograms, "finalMassKilograms");
  if (initialMassKilograms < finalMassKilograms) {
    throw new RangeError("The initial mass must not be less than the final mass.");
  }
  return (
    specificImpulseSeconds * STANDARD_GRAVITY *
    Math.log(initialMassKilograms / finalMassKilograms)
  );
}

/** Propellant mass flow rate, ṁ = T / (I_sp g₀), in kg/s. */
export function calculateMassFlowRate(
  thrustNewtons: number,
  specificImpulseSeconds: number,
): number {
  assertNonNegative(thrustNewtons, "thrustNewtons");
  assertPositive(specificImpulseSeconds, "specificImpulseSeconds");
  return thrustNewtons / (specificImpulseSeconds * STANDARD_GRAVITY);
}

function validate(p: DescentParameters): void {
  assertNonNegative(p.gravityMetersPerSecondSquared, "gravity");
  assertPositive(p.dryMassKilograms, "dryMassKilograms");
  assertNonNegative(p.fuelMassKilograms, "fuelMassKilograms");
  assertPositive(p.maximumThrustNewtons, "maximumThrustNewtons");
  assertPositive(p.specificImpulseSeconds, "specificImpulseSeconds");
  assertPositive(p.initialAltitudeMeters, "initialAltitudeMeters");
  assertFiniteNumber(p.initialVelocityMetersPerSecond, "initialVelocityMetersPerSecond");
  assertNonNegative(p.ignitionAltitudeMeters, "ignitionAltitudeMeters");
  assertFiniteNumber(p.throttle, "throttle");
  if (p.throttle <= 0 || p.throttle > 1) {
    throw new RangeError("throttle must be greater than 0 and at most 1.");
  }
}

interface State {
  readonly h: number;
  readonly v: number;
  readonly m: number;
}

/** Simulates the descent with RK4 until touchdown (or a time limit). */
export function simulateVerticalDescent(parameters: DescentParameters): DescentResult {
  validate(parameters);
  const dt = parameters.timeStepSeconds ?? 0.005;
  const maximumTime = parameters.maximumTimeSeconds ?? 900;
  assertPositive(dt, "timeStepSeconds");
  const g = parameters.gravityMetersPerSecondSquared;
  const thrust = parameters.maximumThrustNewtons * parameters.throttle;
  const flow = calculateMassFlowRate(thrust, parameters.specificImpulseSeconds);
  const startMass = parameters.dryMassKilograms + parameters.fuelMassKilograms;

  let state: State = {
    h: parameters.initialAltitudeMeters,
    v: parameters.initialVelocityMetersPerSecond,
    m: startMass,
  };
  let time = 0;
  let engineOn = false;
  let hasBurned = false;
  let ignitionTime: number | null = null;
  let cutoffTime: number | null = null;
  let ignitionSpeed: number | null = null;
  let fuelExhausted = false;
  const samples: DescentSample[] = [
    { timeSeconds: 0, altitudeMeters: state.h, velocityMetersPerSecond: state.v, massKilograms: state.m, engineOn },
  ];
  const sampleEvery = Math.max(1, Math.round(0.25 / dt));
  let step = 0;

  const derivative = (s: State, burning: boolean): State => ({
    h: s.v,
    v: -g + (burning ? thrust / s.m : 0),
    m: burning ? -flow : 0,
  });
  const advance = (s: State, d: State, factor: number): State => ({
    h: s.h + d.h * factor,
    v: s.v + d.v * factor,
    m: s.m + d.m * factor,
  });

  while (time < maximumTime) {
    if (!engineOn && !hasBurned && state.h <= parameters.ignitionAltitudeMeters && state.m > parameters.dryMassKilograms) {
      engineOn = true;
      hasBurned = true;
      ignitionTime = time;
      ignitionSpeed = -state.v;
    }
    if (engineOn && (state.v >= 0 || state.m <= parameters.dryMassKilograms)) {
      engineOn = false;
      cutoffTime = time;
      fuelExhausted = state.m <= parameters.dryMassKilograms;
    }

    const k1 = derivative(state, engineOn);
    const k2 = derivative(advance(state, k1, dt / 2), engineOn);
    const k3 = derivative(advance(state, k2, dt / 2), engineOn);
    const k4 = derivative(advance(state, k3, dt), engineOn);
    const next: State = {
      h: state.h + ((k1.h + 2 * k2.h + 2 * k3.h + k4.h) * dt) / 6,
      v: state.v + ((k1.v + 2 * k2.v + 2 * k3.v + k4.v) * dt) / 6,
      m: Math.max(parameters.dryMassKilograms, state.m + ((k1.m + 2 * k2.m + 2 * k3.m + k4.m) * dt) / 6),
    };
    time += dt;
    step += 1;

    if (next.h <= 0) {
      // Interpolate the touchdown moment inside the step.
      const fraction = state.h / (state.h - next.h);
      const touchdown: State = {
        h: 0,
        v: state.v + (next.v - state.v) * fraction,
        m: state.m + (next.m - state.m) * fraction,
      };
      const touchdownTime = time - dt + dt * fraction;
      samples.push({ timeSeconds: touchdownTime, altitudeMeters: 0, velocityMetersPerSecond: touchdown.v, massKilograms: touchdown.m, engineOn });
      return {
        samples,
        end: "touchdown",
        touchdownSpeedMetersPerSecond: Math.abs(touchdown.v),
        fuelUsedKilograms: startMass - touchdown.m,
        fuelExhausted,
        ignitionTimeSeconds: ignitionTime,
        cutoffTimeSeconds: engineOn ? null : cutoffTime,
        ignitionSpeedMetersPerSecond: ignitionSpeed,
      };
    }
    state = next;
    if (step % sampleEvery === 0) {
      samples.push({ timeSeconds: time, altitudeMeters: state.h, velocityMetersPerSecond: state.v, massKilograms: state.m, engineOn });
    }
  }

  return {
    samples,
    end: "timeout",
    touchdownSpeedMetersPerSecond: 0,
    fuelUsedKilograms: startMass - state.m,
    fuelExhausted,
    ignitionTimeSeconds: ignitionTime,
    cutoffTimeSeconds: cutoffTime,
    ignitionSpeedMetersPerSecond: ignitionSpeed,
  };
}
