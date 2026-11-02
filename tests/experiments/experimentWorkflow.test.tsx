import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ElectronTrajectoryLabPage } from "../../src/features/experiments/ElectronTrajectoryLabPage";
import { ExperimentsIndexPage } from "../../src/features/experiments/ExperimentsIndexPage";
import {
  collectElectronMeasurements,
  explainElectronResult,
  parseElectronParameters,
  serializeElectronParameters,
} from "../../src/features/experiments/electronExperiment";
import {
  DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
  createInitialElectronTrajectoryState,
  type ElectronTrajectoryParameters,
} from "../../src/features/experiments/electronTrajectoryModel";
import { Vector3 } from "../../src/physics/core";
import {
  compareMeasurements,
  createMeasurement,
  formatMeasurementValue,
} from "../../src/simulation/measurements";
import { useProgressStore } from "../../src/store/progressStore";

const defaults = DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS;
const withChanges = (changes: Partial<ElectronTrajectoryParameters>): ElectronTrajectoryParameters => ({
  ...defaults,
  ...changes,
});

describe("measurements", () => {
  it("creates measurements and rejects non-finite values", () => {
    expect(createMeasurement("speed", "Speed", 5, "m/s").value).toBe(5);
    expect(createMeasurement("r", "Radius", null, "m").value).toBeNull();
    expect(() => createMeasurement("x", "X", Number.NaN, "m")).toThrow(RangeError);
    expect(() => createMeasurement("", "X", 1, "m")).toThrow(RangeError);
  });

  it("formats values compactly with units", () => {
    expect(formatMeasurementValue(null, "m")).toBe("—");
    expect(formatMeasurementValue(0, "J")).toBe("0 J");
    expect(formatMeasurementValue(2e6, "m/s")).toBe("2.00e+6 m/s");
    expect(formatMeasurementValue(1.5, "N")).toBe("1.50 N");
  });

  it("compares two runs by id, with ratios", () => {
    const rows = compareMeasurements(
      [createMeasurement("r", "Radius", 2, "m"), createMeasurement("z", "Zero", 0, "m"), createMeasurement("n", "Null", null, "m")],
      [createMeasurement("r", "Radius", 6, "m"), createMeasurement("z", "Zero", 1, "m"), createMeasurement("extra", "Extra", 9, "s")],
    );

    expect(rows.find((row) => row.id === "r")?.ratio).toBe(3);
    expect(rows.find((row) => row.id === "z")?.ratio).toBeNull();
    expect(rows.find((row) => row.id === "n")?.second).toBeNull();
    expect(rows.find((row) => row.id === "extra")).toMatchObject({ first: null, second: 9 });
  });
});

describe("electron experiment helpers", () => {
  it("collects measurements that match the analytic gyroradius", () => {
    const state = createInitialElectronTrajectoryState(defaults);
    const measurements = collectElectronMeasurements(state, defaults, 0);
    const radius = measurements.find((m) => m.id === "gyroradius")?.value as number;
    const period = measurements.find((m) => m.id === "period")?.value as number;

    // r = m v / (e B) = 9.109e-31 · 2e6 / (1.602e-19 · 1e-5)
    expect(radius).toBeCloseTo((9.1093837139e-31 * 2e6) / (1.602176634e-19 * 1e-5), 6);
    expect(period).toBeCloseTo((2 * Math.PI * 9.1093837139e-31) / (1.602176634e-19 * 1e-5), 12);
    expect(measurements.map((m) => m.id)).toEqual(["speed", "force", "gyroradius", "period", "energy", "time"]);
  });

  it("reports undefined radius and period with no magnetic field", () => {
    const parameters = withChanges({ magneticFieldMicroteslas: 0 });
    const measurements = collectElectronMeasurements(createInitialElectronTrajectoryState(parameters), parameters, 0);

    expect(measurements.find((m) => m.id === "gyroradius")?.value).toBeNull();
    expect(measurements.find((m) => m.id === "period")?.value).toBeNull();
  });

  it("round-trips parameters through JSON", () => {
    const parameters = withChanges({
      particle: "proton", pitchAngleDegrees: 40, magneticFieldReversed: true,
      initialPositionMeters: new Vector3(0.1, -0.2, 0.3), electricFieldVoltsPerMeter: -3,
    });
    const restored = parseElectronParameters(JSON.parse(JSON.stringify(serializeElectronParameters(parameters))));

    expect(restored).toEqual(parameters);
    expect(restored?.initialPositionMeters).toBeInstanceOf(Vector3);
  });

  it.each([
    ["not an object", 5],
    ["unknown particle", { ...serializeElectronParameters(defaults), particle: "neutron" }],
    ["speed above the classical limit", { ...serializeElectronParameters(defaults), speedMetersPerSecond: 1e9 }],
    ["negative field", { ...serializeElectronParameters(defaults), magneticFieldMicroteslas: -1 }],
    ["missing position", { ...serializeElectronParameters(defaults), initialPositionMeters: undefined }],
    ["NaN angle", { ...serializeElectronParameters(defaults), pitchAngleDegrees: Number.NaN }],
  ])("rejects saved parameters with %s", (_label, raw) => {
    expect(parseElectronParameters(raw)).toBeNull();
  });

  describe("explanations use the learner's numbers and the right physics", () => {
    const titles = (parameters: ElectronTrajectoryParameters) =>
      explainElectronResult(parameters).map((e) => e.title);

    it("explains circular motion and why speed is constant", () => {
      const text = explainElectronResult(defaults).map((e) => e.text).join(" ");
      expect(titles(defaults)).toContain("Circular motion");
      expect(titles(defaults)).toContain("Why the speed does not change");
      expect(text).toContain("r = mv/(|q|B)");
      expect(text).toContain("r = mv/(|q|B) = 1.14 m");
    });

    it("explains helical motion for an angled entry", () => {
      expect(titles(withChanges({ pitchAngleDegrees: 45 }))).toContain("Helical motion");
    });

    it("explains straight-line motion with no field and with velocity along B", () => {
      expect(titles(withChanges({ magneticFieldMicroteslas: 0 }))).toEqual(["Straight line"]);
      expect(titles(withChanges({ pitchAngleDegrees: 0 }))).toContain("Moving along the field");
    });

    it("explains a particle at rest and the proton comparison", () => {
      expect(titles(withChanges({ speedMetersPerSecond: 0 }))).toEqual(["Nothing pushes the particle"]);
      const proton = explainElectronResult(withChanges({ particle: "proton" })).map((e) => e.text).join(" ");
      expect(proton).toContain("1836");
    });

    it("recognises when electric and magnetic forces balance (E = vB)", () => {
      // v = 2e6 m/s, B = 10 µT → E = 20 V/m
      expect(titles(withChanges({ electricFieldVoltsPerMeter: 20 }))).toContain("Forces balance");
      // Opposite sign adds the forces instead.
      expect(titles(withChanges({ electricFieldVoltsPerMeter: -20 }))).not.toContain("Forces balance");
      // Reversing B also reverses the balance condition.
      expect(titles(withChanges({ electricFieldVoltsPerMeter: 20, magneticFieldReversed: true }))).not.toContain("Forces balance");
      expect(titles(withChanges({ electricFieldVoltsPerMeter: -20, magneticFieldReversed: true }))).toContain("Forces balance");
    });
  });
});

function renderLab() {
  return render(
    <MemoryRouter>
      <ElectronTrajectoryLabPage />
    </MemoryRouter>,
  );
}

describe("Electron Trajectory Lab workflow", () => {
  it("explains the current setup and updates when it changes", () => {
    renderLab();
    expect(screen.getByRole("heading", { name: "What this electron experiment shows" })).toBeTruthy();
    expect(screen.getByText("Circular motion")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Angle to magnetic field"), { target: { value: "45" } });
    expect(screen.getByText("Helical motion")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Particle"), { target: { value: "proton" } });
    expect(screen.getByRole("heading", { name: "What this proton experiment shows" })).toBeTruthy();
  });

  it("saves, compares, loads and deletes experiments", async () => {
    renderLab();
    fireEvent.change(screen.getByLabelText("Name this run"), { target: { value: "Baseline" } });
    fireEvent.click(screen.getByRole("button", { name: "Save experiment" }));
    expect(await screen.findByText("Saved “Baseline”.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Magnetic field strength"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save experiment" }));
    expect(await screen.findByText("Saved “Run 2”.")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "Compare Baseline" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Compare Run 2" }));
    const table = screen.getByRole("table", { name: /comparison/i });
    const radiusRow = within(table).getByRole("row", { name: /Gyroradius/ });
    // Doubling B halves the radius.
    expect(within(radiusRow).getByText("× 0.500")).toBeTruthy();

    // Load the baseline back into the controls.
    fireEvent.click(screen.getAllByRole("button", { name: "Load setup" })[0] as HTMLElement);
    expect(screen.getByText(/Setup loaded/)).toBeTruthy();
    expect((screen.getByLabelText("Magnetic field strength") as HTMLInputElement).value).toBe("10");

    fireEvent.click(screen.getByRole("button", { name: "Delete Baseline" }));
    await waitFor(() => expect(screen.queryByText("Baseline")).toBeNull());
    expect(useProgressStore.getState().experiments).toHaveLength(1);
  });

  it("unlocks Particle Explorer when an experiment is saved", async () => {
    renderLab();
    fireEvent.click(screen.getByRole("button", { name: "Save experiment" }));

    await waitFor(() => {
      expect(useProgressStore.getState().achievements.map((a) => a.achievementId)).toContain("particle-explorer");
    });
  });

  it("restores a saved setup when opened from the saved list", async () => {
    const saved = await useProgressStore.getState().saveExperiment({
      experimentId: "electron-trajectory-lab",
      experimentName: "Electron Trajectory Lab",
      runName: "Strong field",
      parameters: serializeElectronParameters(withChanges({ magneticFieldMicroteslas: 17 })),
      results: [],
    });

    render(
      <MemoryRouter>
        <ElectronTrajectoryLabPage savedExperimentId={saved.id} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect((screen.getByLabelText("Magnetic field strength") as HTMLInputElement).value).toBe("17");
    });
  });

  it("refuses to load a corrupted saved setup", async () => {
    await useProgressStore.getState().saveExperiment({
      experimentId: "electron-trajectory-lab",
      experimentName: "Electron Trajectory Lab",
      runName: "Broken",
      parameters: { particle: "neutron" },
      results: [],
    });
    renderLab();

    fireEvent.click(await screen.findByRole("button", { name: "Load setup" }));
    expect(screen.getByText(/no longer valid/)).toBeTruthy();
    expect(screen.getByText("Setup unavailable")).toBeTruthy();
  });
});

describe("Experiment Lab index", () => {
  it("lists the experiments and links saved runs back to the lab", async () => {
    const saved = await useProgressStore.getState().saveExperiment({
      experimentId: "electron-trajectory-lab",
      experimentName: "Electron Trajectory Lab",
      runName: "Run A",
      parameters: serializeElectronParameters(defaults),
      results: [],
    });

    render(
      <MemoryRouter>
        <ExperimentsIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Electron Trajectory Lab/ }).getAttribute("href")).toBe(
      "/experiments/electron-trajectory",
    );
    const link = await screen.findByRole("link", { name: /Run A/ });
    expect(link.getAttribute("href")).toBe(`/experiments/electron-trajectory?saved=${saved.id}`);
  });

  it("explains how to save when nothing is saved yet", () => {
    render(
      <MemoryRouter>
        <ExperimentsIndexPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Nothing saved yet/)).toBeTruthy();
  });
});
