import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "../../src/components/layout/AppShell";
import { ElectronTrajectoryLabPage } from "../../src/features/experiments/ElectronTrajectoryLabPage";

function renderLab() {
  return render(
    <MemoryRouter initialEntries={["/experiments/electron-trajectory"]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="/experiments/electron-trajectory"
            element={<ElectronTrajectoryLabPage />}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Electron Trajectory Lab page", () => {
  it("renders the simulation, measurements, and relevant experiment controls", () => {
    renderLab();

    expect(
      screen.getByRole("heading", { name: "Electron Trajectory Lab" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", { name: /charged particle trajectory/i }),
    ).toBeTruthy();
    expect(screen.getAllByText("2.00e+6 m/s")).toHaveLength(2);
    expect(
      screen.getByRole("slider", { name: /Angle to magnetic field/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: /Reverse magnetic field/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("slider", { name: /Crossed electric field/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: /Target challenge/ }),
    ).toBeTruthy();
  });

  it("resets the model and updates measurements when parameters change", () => {
    renderLab();

    fireEvent.change(
      screen.getByRole("slider", { name: /Magnetic field strength/ }),
      {
        target: { value: "0" },
      },
    );

    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText("GYRORADIUS")).toBeTruthy();
    expect(screen.getAllByText("—")).toHaveLength(1);

    fireEvent.change(screen.getByLabelText("Particle"), {
      target: { value: "proton" },
    });

    expect(screen.getByRole("combobox", { name: "Particle" })).toHaveProperty(
      "value",
      "proton",
    );
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("supports start, pause, resume, and reset controls", () => {
    let nextHandle = 0;
    vi.stubGlobal("requestAnimationFrame", () => ++nextHandle);
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    const app = renderLab();

    try {
      fireEvent.click(screen.getByRole("button", { name: "Start experiment" }));
      expect(screen.getByText("In motion")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Pause experiment" }));
      expect(screen.getByText("Paused")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Resume experiment" }));
      expect(screen.getByText("In motion")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      expect(screen.getByText("Ready")).toBeTruthy();
      expect(screen.getByText("0 s")).toBeTruthy();
    } finally {
      app.unmount();
      vi.unstubAllGlobals();
    }
  });

  it("exposes the experiment from the responsive primary navigation", () => {
    renderLab();

    expect(
      screen.getAllByRole("link", { name: "Experiment Lab" }).some(
        (link) =>
          link.getAttribute("href") === "/experiments/electron-trajectory" &&
          link.getAttribute("aria-current") === "page",
      ),
    ).toBe(true);
  });
});
