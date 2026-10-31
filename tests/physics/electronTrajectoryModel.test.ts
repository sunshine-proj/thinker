import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/physics/core";
import { ELECTRON, PROTON } from "../../src/physics/electromagnetism";
import {
  DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
  ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
  MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND,
  MAX_TRAJECTORY_POINTS,
  TARGET_POSITION_METERS,
  TARGET_RADIUS_METERS,
  createElectronTrajectoryModel,
  createInitialElectronTrajectoryState,
  getElectricField,
  getElectronTrajectoryMeasurements,
  getMagneticField,
} from "../../src/features/experiments/electronTrajectoryModel";

describe("Electron Trajectory Lab model", () => {
  const model = createElectronTrajectoryModel();

  it("creates a perpendicular electron beam and the configured fields", () => {
    const state = model.createInitialState(
      DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
    );

    expect(state.position).toEqual(Vector3.zero());
    expect(state.velocity.x).toBeCloseTo(2e6);
    expect(state.velocity.y).toBeCloseTo(0);
    expect(state.velocity.z).toBe(0);
    expect(state.trail).toEqual([Vector3.zero()]);
    expect(
      getMagneticField(DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS).y,
    ).toBeCloseTo(1e-5);
    expect(getElectricField(DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS)).toEqual(
      Vector3.zero(),
    );
  });

  it("splits angled-entry velocity into parallel and perpendicular components", () => {
    const state = createInitialElectronTrajectoryState({
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      pitchAngleDegrees: 30,
    });

    expect(state.velocity.x).toBeCloseTo(1e6);
    expect(state.velocity.y).toBeCloseTo(Math.sqrt(3) * 1e6);
    expect(state.velocity.magnitude).toBeCloseTo(2e6);
  });

  it("reverses magnetic-field direction without changing field strength", () => {
    const reversedVelocity = model.createInitialState({
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      pitchAngleDegrees: 30,
      magneticFieldReversed: true,
    }).velocity;
    const reversed = getMagneticField({
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      magneticFieldReversed: true,
    });

    expect(reversed.y).toBeCloseTo(-1e-5);
    expect(reversed.magnitude).toBeCloseTo(1e-5);
    expect(reversedVelocity).toEqual(
      createInitialElectronTrajectoryState({
        ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
        pitchAngleDegrees: 30,
      }).velocity,
    );
    const electron = model.step(
      model.createInitialState(DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS),
      DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
    );
    const reversedParameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      magneticFieldReversed: true,
    };
    const reversedElectron = model.step(
      model.createInitialState(reversedParameters),
      reversedParameters,
      ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
    );
    expect(electron.velocity.z).toBeLessThan(0);
    expect(reversedElectron.velocity.z).toBeGreaterThan(0);
  });

  it("uses the initial position and applies the balancing electric field along -Z", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      initialPositionMeters: new Vector3(0.1, -0.2, 0.3),
      electricFieldVoltsPerMeter: 5,
    };
    const state = model.createInitialState(parameters);

    expect(state.position).toEqual(parameters.initialPositionMeters);
    expect(getElectricField(parameters)).toEqual(new Vector3(0, 0, -5));
  });

  it("balances the electron magnetic force with a crossed electric field when E = vB", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      electricFieldVoltsPerMeter:
        DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS.speedMetersPerSecond *
        getMagneticField(DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS).magnitude,
    };
    const measurements = getElectronTrajectoryMeasurements(
      model.createInitialState(parameters),
      parameters,
    );

    expect(measurements.forceNewtons.magnitude).toBeCloseTo(0, 30);
  });

  it("calculates signed Lorentz-force and energy measurements", () => {
    const parameters = DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS;
    const state = model.createInitialState(parameters);
    const measurements = getElectronTrajectoryMeasurements(state, parameters);

    expect(measurements.speedMetersPerSecond).toBeCloseTo(2e6);
    expect(measurements.forceNewtons.z).toBeLessThan(0);
    expect(measurements.orbitRadiusMeters).toBeCloseTo(
      (ELECTRON.massKilograms * 2e6) /
        (Math.abs(ELECTRON.chargeCoulombs) * 1e-5),
    );
    expect(measurements.kineticEnergyJoules).toBeCloseTo(
      0.5 * ELECTRON.massKilograms * (2e6) ** 2,
    );
  });

  it("produces circular motion for perpendicular entry with a uniform magnetic field", () => {
    const parameters = DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS;
    let state = model.createInitialState(parameters);
    const initialSpeed = state.velocity.magnitude;
    const initialEnergy = getElectronTrajectoryMeasurements(
      state,
      parameters,
    ).kineticEnergyJoules;

    for (let step = 0; step < 500; step += 1) {
      state = model.step(
        state,
        parameters,
        ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
      );
    }

    const finalEnergy = getElectronTrajectoryMeasurements(
      state,
      parameters,
    ).kineticEnergyJoules;
    const analyticRadius =
      (ELECTRON.massKilograms * initialSpeed) /
      (Math.abs(ELECTRON.chargeCoulombs) *
        getMagneticField(parameters).magnitude);
    expect(
      Math.hypot(state.position.x, state.position.z + analyticRadius),
    ).toBeCloseTo(analyticRadius, 4);
    expect(state.velocity.magnitude).toBeCloseTo(initialSpeed, 8);
    expect(finalEnergy).toBeCloseTo(initialEnergy, 8);
    expect(state.trail).toHaveLength(501);
  });

  it("produces helix motion when the entry velocity has a field-parallel component", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      pitchAngleDegrees: 45,
    };
    let state = model.createInitialState(parameters);

    for (let step = 0; step < 10; step += 1) {
      state = model.step(
        state,
        parameters,
        ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
      );
    }

    expect(state.position.y).toBeGreaterThan(0);
    expect(state.position.x).toBeGreaterThan(0);
    expect(state.position.z).toBeLessThan(0);
  });

  it("moves in a straight line with zero magnetic field", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      magneticFieldMicroteslas: 0,
      pitchAngleDegrees: 45,
    };
    let state = model.createInitialState(parameters);
    const initialVelocity = state.velocity;

    for (let step = 0; step < 50; step += 1) {
      state = model.step(
        state,
        parameters,
        ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
      );
    }

    expect(state.velocity).toEqual(initialVelocity);
    expect(state.position.x).toBeCloseTo(state.position.y);
    expect(state.position.z).toBeCloseTo(0);
    expect(
      getElectronTrajectoryMeasurements(state, parameters).orbitRadiusMeters,
    ).toBeNull();
  });

  it("keeps a zero-speed particle stationary in a magnetic-only field", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      speedMetersPerSecond: 0,
    };
    let state = model.createInitialState(parameters);

    for (let step = 0; step < 20; step += 1) {
      state = model.step(
        state,
        parameters,
        ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
      );
    }

    expect(state.position).toEqual(Vector3.zero());
    expect(state.velocity).toEqual(Vector3.zero());
    expect(
      getElectronTrajectoryMeasurements(state, parameters).orbitRadiusMeters,
    ).toBe(0);
  });

  it("converges on the target and completes only in challenge mode", () => {
    const challengeParameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      targetChallengeEnabled: true,
    };
    let state = model.createInitialState(challengeParameters);

    for (let step = 0; step < 100; step += 1) {
      state = model.step(
        state,
        challengeParameters,
        ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
      );
      if (model.isComplete?.(state, challengeParameters)) {
        break;
      }
    }
    expect(state.targetHit).toBe(true);
    expect(model.isComplete?.(state, challengeParameters)).toBe(true);
    expect(
      model.isComplete?.(state, DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS),
    ).toBe(false);
    expect(state.position.distanceTo(TARGET_POSITION_METERS)).toBeLessThan(
      TARGET_RADIUS_METERS,
    );
  });

  it("detects the target when a fast particle crosses it between integration points", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      speedMetersPerSecond: 2e6,
      pitchAngleDegrees: 0,
      magneticFieldMicroteslas: 0,
      initialPositionMeters: new Vector3(
        TARGET_POSITION_METERS.x,
        -1,
        TARGET_POSITION_METERS.z,
      ),
      targetChallengeEnabled: true,
    };
    const initial = model.createInitialState(parameters);
    const next = model.step(initial, parameters, 1e-6);

    expect(next.position.y).toBeGreaterThan(TARGET_POSITION_METERS.y);
    expect(
      next.position.distanceTo(TARGET_POSITION_METERS),
    ).toBeGreaterThan(TARGET_RADIUS_METERS);
    expect(next.targetHit).toBe(true);
    expect(model.isComplete?.(next, parameters)).toBe(true);
  });

  it("bounds stored trajectory history", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      magneticFieldMicroteslas: 0,
    };
    let state = model.createInitialState(parameters);

    for (let step = 0; step < MAX_TRAJECTORY_POINTS + 50; step += 1) {
      state = model.step(
        state,
        parameters,
        ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
      );
    }

    expect(state.trail).toHaveLength(MAX_TRAJECTORY_POINTS);
    expect(state.trail.at(-1)).toEqual(state.position);
  });

  it("rejects speeds outside the non-relativistic model", () => {
    expect(() =>
      createInitialElectronTrajectoryState({
        ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
        speedMetersPerSecond: MAX_CLASSICAL_PARTICLE_SPEED_METERS_PER_SECOND,
      }),
    ).toThrow(/below 0\.1 times the speed of light/);
    expect(() =>
      createInitialElectronTrajectoryState({
        ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
        pitchAngleDegrees: 91,
      }),
    ).toThrow(RangeError);
  });

  it("uses the proton charge and mass in comparison mode", () => {
    const parameters = {
      ...DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
      particle: "proton" as const,
    };
    const state = model.createInitialState(parameters);
    const measurements = getElectronTrajectoryMeasurements(state, parameters);

    expect(measurements.forceNewtons.z).toBeGreaterThan(0);
    expect(measurements.orbitRadiusMeters).toBeCloseTo(
      (PROTON.massKilograms * 2e6) /
        (Math.abs(PROTON.chargeCoulombs) * 1e-5),
    );
  });
});
