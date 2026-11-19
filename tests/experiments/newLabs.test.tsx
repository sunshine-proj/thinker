import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ExperimentsIndexPage } from "../../src/features/experiments/ExperimentsIndexPage";
import { LABS, findLab, frictionLab, gravityComparison, magneticFieldLab, projectileLab } from "../../src/features/experiments/labs";
import { LabPage } from "../../src/features/experiments/labs/LabPage";
import { defaultLabValues, parseLabValues } from "../../src/features/experiments/labs/labTypes";
import { findCatalogEntry } from "../../src/data/games/gameCatalog";
import { useProgressStore } from "../../src/store/progressStore";

const measurement = (lab: (typeof LABS)[number], values: Record<string, number | string>, id: string) =>
  lab.run(values).measurements.find((m) => m.id === id)?.value;

describe("lab definitions", () => {
  it("are registered in the catalog as experiments with matching ids", () => {
    expect(LABS.length).toBeGreaterThanOrEqual(4);
    for (const lab of LABS) {
      expect(findCatalogEntry(lab.id)?.kind).toBe("experiment");
      expect(findLab(lab.id)).toBe(lab);
      expect(lab.run(defaultLabValues(lab)).measurements.length).toBeGreaterThan(3);
      expect(lab.run(defaultLabValues(lab)).explanations.length).toBeGreaterThan(2);
      expect(lab.run(defaultLabValues(lab)).charts.length).toBeGreaterThan(0);
    }
  });

  it("round-trip their settings and reject corrupt ones", () => {
    for (const lab of LABS) {
      const values = defaultLabValues(lab);
      expect(parseLabValues(lab, values)).toEqual(values);
      expect(parseLabValues(lab, null)).toBeNull();
      expect(parseLabValues(lab, {})).toBeNull();
    }
    expect(parseLabValues(projectileLab, { ...defaultLabValues(projectileLab), speed: 1e9 })).toBeNull();
    expect(parseLabValues(gravityComparison, { ...defaultLabValues(gravityComparison), body: "pluto" })).toBeNull();
  });
});

describe("Gravity Comparison", () => {
  const base = defaultLabValues(gravityComparison);
  it("drops 20 m in 2.02 s on Earth and 4.97 s on the Moon", () => {
    expect(measurement(gravityComparison, base, "fallTime")).toBeCloseTo(2.0196, 3);
    expect(measurement(gravityComparison, { ...base, body: "moon" }, "fallTime")).toBeCloseTo(4.969, 3);
    expect(measurement(gravityComparison, { ...base, body: "moon" }, "fallRatio")).toBeCloseTo(Math.sqrt(9.80665 / 1.62), 8);
  });
  it("swings slower where gravity is weaker, and slower at large angles", () => {
    expect(measurement(gravityComparison, base, "period")).toBeCloseTo(2.006, 3);
    expect(measurement(gravityComparison, { ...base, body: "jupiter" }, "periodRatio")).toBeCloseTo(Math.sqrt(9.80665 / 24.79), 8);
    expect(measurement(gravityComparison, { ...base, amplitude: 60 }, "exactPeriod")!).toBeGreaterThan(measurement(gravityComparison, base, "period")! * 1.06);
  });
  it("explains the impact speed and independence from mass", () => {
    const text = gravityComparison.run(base).explanations.map((e) => `${e.title} ${e.text}`).join(" ");
    expect(text).toMatch(/mass of the object cancels/);
    expect(text).toMatch(/19\.8 m\/s/);
  });
});

describe("Friction on Different Surfaces", () => {
  const base = { ...defaultLabValues(frictionLab), surface: "wood-wood", mass: 10 };
  it("holds a block below μs N and slides it above", () => {
    expect(measurement(frictionLab, { ...base, force: 40 }, "friction")).toBeCloseTo(40, 6);
    expect(measurement(frictionLab, { ...base, force: 40 }, "acceleration")).toBe(0);
    expect(measurement(frictionLab, { ...base, force: 60 }, "friction")).toBeCloseTo(29.42, 2);
    expect(measurement(frictionLab, { ...base, force: 60 }, "acceleration")).toBeCloseTo(3.06, 2);
    expect(frictionLab.run({ ...base, force: 60 }).explanations[0]!.title).toBe("The block is sliding");
    expect(frictionLab.run({ ...base, force: 40 }).explanations[0]!.title).toBe("The block stays put");
  });
  it("finds the slipping angle atan(μs) and compares surfaces", () => {
    expect(measurement(frictionLab, base, "critical")).toBeCloseTo(26.57, 1);
    expect(measurement(frictionLab, { ...base, surface: "ice-ice" }, "critical")).toBeCloseTo(5.71, 1);
    expect(measurement(frictionLab, { ...base, surface: "ice-ice", slope: 10, force: 0 }, "acceleration")!).toBeLessThan(0);
    expect(measurement(frictionLab, { ...base, mass: 20 }, "maxStatic")).toBeCloseTo(2 * measurement(frictionLab, base, "maxStatic")!, 8);
  });
});

describe("Projectile Motion", () => {
  const base = { speed: 20, angle: 45, gravity: 9.81, height: 0 };
  it("reuses the Projectile Master model: range v²/g at 45°, and 6 times as far with 1/6 gravity", () => {
    expect(measurement(projectileLab, base, "range")).toBeCloseTo(400 / 9.81, 6);
    expect(measurement(projectileLab, { ...base, gravity: 9.81 / 6 }, "range")).toBeCloseTo(6 * (400 / 9.81), 5);
    expect(measurement(projectileLab, base, "peak")).toBeCloseTo(400 / 9.81 / 4, 6);
  });
  it("adds launch height to the flight time and impact speed", () => {
    const high = { ...base, height: 30, angle: 0 };
    expect(measurement(projectileLab, high, "time")).toBeCloseTo(Math.sqrt((2 * 30) / 9.81), 6);
    expect(measurement(projectileLab, high, "impactSpeed")).toBeCloseTo(Math.sqrt(400 + 2 * 9.81 * 30), 6);
    expect(measurement(projectileLab, high, "impactAngle")!).toBeGreaterThan(45);
  });
});

describe("Magnetic Field Strength", () => {
  it("gives 20 µT at 5 cm from a 5 A wire, halved at twice the distance", () => {
    const wire = { source: "wire", current: 5, distance: 5, turns: 1000, core: "air" };
    expect(measurement(magneticFieldLab, wire, "fieldMicro")).toBeCloseTo(20, 4);
    expect(measurement(magneticFieldLab, wire, "doubleDistance")).toBeCloseTo(10, 4);
    expect(measurement(magneticFieldLab, wire, "earthRatio")).toBeCloseTo(0.4, 4);
  });
  it("gives 6.28 mT in a 1000 turn/m solenoid at 5 A, 200× with iron until saturation", () => {
    const coil = { source: "solenoid", current: 5, distance: 5, turns: 1000, core: "air" };
    expect(measurement(magneticFieldLab, coil, "fieldMilli")).toBeCloseTo(6.283, 3);
    expect(measurement(magneticFieldLab, { ...coil, core: "iron" }, "fieldMilli")).toBeCloseTo(1256.6, 0);
    const saturated = { ...coil, core: "iron", current: 50, turns: 10000 };
    expect(measurement(magneticFieldLab, saturated, "fieldMilli")).toBeCloseTo(1600, 6);
    expect(magneticFieldLab.run(saturated).explanations.map((e) => e.text).join(" ")).toMatch(/saturat/);
  });
  it("describes setups for the notebook", () => {
    expect(magneticFieldLab.describe({ source: "wire", current: 5, distance: 5, turns: 1000, core: "air" })).toMatch(/Wire/);
  });
});

describe("LabPage", () => {
  it("shows live measurements, hides irrelevant controls and resets", () => {
    render(<MemoryRouter><LabPage definition={magneticFieldLab} /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Magnetic Field Strength" })).toBeTruthy();
    expect(screen.getByLabelText("Distance from the wire")).toBeTruthy();
    expect(screen.queryByLabelText("Turns per meter")).toBeNull();
    fireEvent.change(screen.getByLabelText("Source"), { target: { value: "solenoid" } });
    expect(screen.getByLabelText("Turns per meter")).toBeTruthy();
    expect(screen.queryByLabelText("Distance from the wire")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(screen.getByLabelText("Distance from the wire")).toBeTruthy();
  });

  it("updates the measurements when a control changes and lists the explanation", () => {
    render(<MemoryRouter><LabPage definition={gravityComparison} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Run without a prediction" }));
    expect(screen.getByText("2.02 s")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Where are you?"), { target: { value: "moon" } });
    expect(screen.getByText("4.97 s")).toBeTruthy();
    expect(screen.getByText(/fall time depends on gravity/i)).toBeTruthy();
    expect(screen.getAllByRole("img").length).toBeGreaterThanOrEqual(2);
  });

  it("saves, lists, compares and reloads runs, and opens a saved run from the index", async () => {
    const { unmount } = render(<MemoryRouter><LabPage definition={projectileLab} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Run without a prediction" }));
    fireEvent.click(screen.getByRole("button", { name: "Save experiment" }));
    await waitFor(() => expect(useProgressStore.getState().experiments).toHaveLength(1));
    const first = useProgressStore.getState().experiments[0]!;
    expect(first.experimentId).toBe("projectile-motion-lab");
    fireEvent.change(screen.getByLabelText("Launch angle"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Name this run"), { target: { value: "Low shot" } });
    fireEvent.click(screen.getByRole("button", { name: "Save experiment" }));
    await waitFor(() => expect(useProgressStore.getState().experiments).toHaveLength(2));
    fireEvent.click(screen.getByLabelText("Compare Run 1"));
    fireEvent.click(screen.getByLabelText("Compare Low shot"));
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Range")).toBeTruthy();
    unmount();

    render(<MemoryRouter><LabPage definition={projectileLab} savedExperimentId={first.id} /></MemoryRouter>);
    await waitFor(() => expect((screen.getByLabelText("Launch angle") as HTMLInputElement).value).toBe("45"));

    render(<MemoryRouter><ExperimentsIndexPage /></MemoryRouter>);
    const links = await screen.findAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === `/experiments/projectile-motion?saved=${encodeURIComponent(first.id)}`)).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/experiments/friction")).toBe(true);
  });
});

describe("LabPage predictions and modes", () => {
  it("hides results until the learner predicts, then compares and records the prediction", async () => {
    render(<MemoryRouter><LabPage definition={gravityComparison} /></MemoryRouter>);
    expect(screen.queryByRole("heading", { name: "Measurements" })).toBeNull();
    const input = screen.getByLabelText(/How long will the object take to fall/);
    const lock = screen.getByRole("button", { name: "Lock in and run" });
    expect((lock as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.click(lock);
    expect(await screen.findByText(/Your prediction was within 10 %/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Measurements" })).toBeTruthy();
    await waitFor(() => expect(useProgressStore.getState().predictions).toHaveLength(1));
    expect(useProgressStore.getState().predictions[0]).toMatchObject({
      activityId: "gravity-comparison", activityKind: "experiment", questionId: "fallTime", answer: "2", correct: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Make a new prediction" }));
    fireEvent.change(screen.getByLabelText(/How long will the object take to fall/), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Lock in and run" }));
    expect(await screen.findByText(/more than 10 %/)).toBeTruthy();
  });

  it("shows fewer controls and guided steps in beginner mode, and raw data in advanced mode", () => {
    render(<MemoryRouter><LabPage definition={projectileLab} /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "How to run this experiment" })).toBeTruthy();
    expect(screen.queryByLabelText("Gravity")).toBeNull();
    expect(screen.getByLabelText("Launch angle")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.getByLabelText("Gravity")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "How to run this experiment" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Run without a prediction" }));
    expect(screen.getByRole("heading", { name: "Raw data" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Beginner" }));
    expect(screen.queryByRole("heading", { name: "Raw data" })).toBeNull();
  });

  it("gives every lab a prediction it can measure and valid advanced controls", () => {
    for (const lab of LABS) {
      const values = defaultLabValues(lab);
      const id = typeof lab.prediction.measurementId === "function" ? lab.prediction.measurementId(values) : lab.prediction.measurementId;
      expect(lab.run(values).measurements.some((m) => m.id === id), lab.id).toBe(true);
      const keys = new Set(lab.controls.map((control) => control.key));
      lab.modes.advancedControls.forEach((key) => expect(keys, `${lab.id}.${key}`).toContain(key));
      expect(lab.modes.beginnerSteps.length).toBeGreaterThanOrEqual(2);
      expect(lab.controls.length - lab.modes.advancedControls.length).toBeGreaterThan(0);
    }
  });
});
