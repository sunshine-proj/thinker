import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ElectronTrajectoryLabPage, describeFieldDirection } from "../../src/features/experiments/ElectronTrajectoryLabPage";
import { explainElectronResult, parseElectronParameters, serializeElectronParameters } from "../../src/features/experiments/electronExperiment";
import {
  DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS as DEFAULTS,
  createElectronTrajectoryModel,
  getElectronTrajectoryMeasurements,
  getFieldDirection,
  getMagneticField,
  getSimulationTiming,
} from "../../src/features/experiments/electronTrajectoryModel";
import { SPEED_OF_LIGHT } from "../../src/physics/core";

const model = createElectronTrajectoryModel();

describe("field direction", () => {
  it("points along +Y by default and anywhere with tilt and azimuth", () => {
    expect(getFieldDirection(DEFAULTS).y).toBeCloseTo(1, 12);
    const x = getFieldDirection({ fieldPolarDegrees: 90, fieldAzimuthDegrees: 0 });
    expect(x.x).toBeCloseTo(1, 12);
    const z = getFieldDirection({ fieldPolarDegrees: 90, fieldAzimuthDegrees: 90 });
    expect(z.z).toBeCloseTo(1, 12);
    const tilted = getMagneticField({ ...DEFAULTS, fieldPolarDegrees: 45, magneticFieldMicroteslas: 10 });
    expect(tilted.magnitude).toBeCloseTo(1e-5, 15);
  });

  it("launches perpendicular to a tilted field at 90° and circles with r = mv/(|q|B)", () => {
    const parameters = { ...DEFAULTS, fieldPolarDegrees: 60, fieldAzimuthDegrees: 30 };
    const state = model.createInitialState(parameters);
    const field = getMagneticField(parameters);
    expect(Math.abs(state.velocity.dot(field)) / (state.velocity.magnitude * field.magnitude)).toBeLessThan(1e-12);
    const radius = getElectronTrajectoryMeasurements(state, parameters).orbitRadiusMeters!;
    expect(radius).toBeCloseTo((9.1093837139e-31 * 2e6) / (1.602176634e-19 * 1e-5), 9);
    // After half a period the particle is one diameter away from where it started.
    let current = state;
    const halfPeriod = Math.PI * 9.1093837139e-31 / (1.602176634e-19 * 1e-5);
    for (let t = 0; t < halfPeriod; t += 2e-8) {
      current = model.step(current, parameters, 2e-8);
    }
    expect(current.position.magnitude / (2 * radius)).toBeCloseTo(1, 2);
  });

  it("describes the direction in words", () => {
    expect(describeFieldDirection(DEFAULTS)).toBe("+Y");
    expect(describeFieldDirection({ ...DEFAULTS, magneticFieldReversed: true })).toBe("−Y");
    expect(describeFieldDirection({ ...DEFAULTS, fieldPolarDegrees: 180 })).toBe("−Y");
    expect(describeFieldDirection({ ...DEFAULTS, fieldPolarDegrees: 45, fieldAzimuthDegrees: 90 })).toMatch(/tilted 45°/);
  });
});

describe("relativistic mode", () => {
  const relativistic = { ...DEFAULTS, relativistic: true, speedMetersPerSecond: 0.9 * SPEED_OF_LIGHT, magneticFieldMicroteslas: 5000 };

  it("accepts speeds the classical model rejects and uses γ in the radius", () => {
    expect(() => model.createInitialState({ ...DEFAULTS, speedMetersPerSecond: 0.5 * SPEED_OF_LIGHT })).toThrow(/classical/);
    const state = model.createInitialState(relativistic);
    const measured = getElectronTrajectoryMeasurements(state, relativistic);
    const classical = getElectronTrajectoryMeasurements(state, { ...relativistic, relativistic: false });
    expect(measured.orbitRadiusMeters! / classical.orbitRadiusMeters!).toBeCloseTo(1 / Math.sqrt(1 - 0.81), 9);
    expect(measured.kineticEnergyJoules).toBeGreaterThan(classical.kineticEnergyJoules);
  });

  it("keeps the speed constant while stepping at the relativistic time step", () => {
    const { fixedTimeStepSeconds, timeScale } = getSimulationTiming(relativistic);
    expect(fixedTimeStepSeconds).toBe(2e-11);
    expect(timeScale).toBe(1e-9);
    let state = model.createInitialState(relativistic);
    for (let i = 0; i < 5000; i += 1) {
      state = model.step(state, relativistic, fixedTimeStepSeconds);
    }
    expect(state.velocity.magnitude / (0.9 * SPEED_OF_LIGHT)).toBeCloseTo(1, 10);
  });

  it("explains the relativistic correction", () => {
    const text = explainElectronResult(relativistic).map((item) => item.text).join(" ");
    expect(text).toMatch(/γ = 2\.294/);
  });
});

describe("saved runs", () => {
  it("round-trips the new settings and still opens runs saved before them", () => {
    const parameters = { ...DEFAULTS, fieldPolarDegrees: 30, fieldAzimuthDegrees: 120, relativistic: true, speedMetersPerSecond: 1e8, magneticFieldMicroteslas: 3000 };
    expect(parseElectronParameters(serializeElectronParameters(parameters))).toEqual(parameters);
    const legacy = serializeElectronParameters(DEFAULTS) as Record<string, unknown>;
    delete legacy.fieldPolarDegrees;
    delete legacy.fieldAzimuthDegrees;
    delete legacy.relativistic;
    expect(parseElectronParameters(legacy)).toEqual(DEFAULTS);
    expect(parseElectronParameters({ ...serializeElectronParameters(DEFAULTS), speedMetersPerSecond: 1e8 })).toBeNull();
    expect(parseElectronParameters({ ...serializeElectronParameters(DEFAULTS), fieldPolarDegrees: 200 })).toBeNull();
  });
});

describe("Electron Trajectory Lab advanced controls", () => {
  it("switches to the labeled relativistic model and the top view", () => {
    render(<MemoryRouter><ElectronTrajectoryLabPage /></MemoryRouter>);
    expect(screen.getByText("CLASSICAL MODEL")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: /Relativistic mode/ }));
    expect(screen.getByText("RELATIVISTIC MODEL · ADVANCED")).toBeTruthy();
    expect(screen.getByText(/1,000,000,000×/)).toBeTruthy();
    expect((screen.getByRole("slider", { name: "Initial speed" }) as HTMLInputElement).max).toBe(String(Math.floor(SPEED_OF_LIGHT * 0.99)));
    fireEvent.change(screen.getByLabelText("View"), { target: { value: "top" } });
    expect(screen.getByText(/Field pointing toward you is drawn as dots/)).toBeTruthy();
    expect((screen.getByRole("slider", { name: /Tilt direction/ }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("slider", { name: "Field tilt from +Y" }), { target: { value: "45" } });
    expect((screen.getByRole("slider", { name: /Tilt direction/ }) as HTMLInputElement).disabled).toBe(false);
  });
});
