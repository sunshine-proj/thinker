import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "../../src/components/layout/AppShell";
import { HomePage } from "../../src/features/home/HomePage";
import { ProjectileMasterPage } from "../../src/features/games/projectile-master/ProjectileMasterPage";
import {
  PROJECTILE_MASTER_ROUNDS,
} from "../../src/features/games/projectile-master/projectileMasterData";
import {
  calculateProjectileTrajectory,
  scoreProjectileShot,
} from "../../src/features/games/projectile-master/projectileMasterModel";

function startProjectileMaster() {
  fireEvent.click(screen.getByRole("button", { name: "Start game" }));
}

describe("Projectile motion model", () => {
  it("calculates the analytical range, flight time, height, and endpoints", () => {
    const trajectory = calculateProjectileTrajectory(
      { speedMetersPerSecond: 20, angleDegrees: 45 },
      20,
    );

    expect(trajectory.horizontalRangeMeters).toBeCloseTo(400 / 9.80665, 8);
    expect(trajectory.flightTimeSeconds).toBeCloseTo(
      (2 * 20 * Math.sin(Math.PI / 4)) / 9.80665,
      8,
    );
    expect(trajectory.maximumHeightMeters).toBeCloseTo(
      20 ** 2 / (4 * 9.80665),
      8,
    );
    expect(trajectory.points).toHaveLength(21);
    expect(trajectory.points[0]?.x).toBe(0);
    expect(trajectory.points[0]?.y).toBe(0);
    expect(trajectory.points.at(-1)?.x).toBeCloseTo(
      trajectory.horizontalRangeMeters,
      8,
    );
    expect(trajectory.points.at(-1)?.y).toBe(0);
  });

  it("gives complementary launch angles the same ideal range", () => {
    const shallow = calculateProjectileTrajectory({
      speedMetersPerSecond: 18,
      angleDegrees: 30,
    });
    const steep = calculateProjectileTrajectory({
      speedMetersPerSecond: 18,
      angleDegrees: 60,
    });

    expect(shallow.horizontalRangeMeters).toBeCloseTo(
      steep.horizontalRangeMeters,
      8,
    );
  });

  it("includes launch height and lands at the surface", () => {
    const trajectory = calculateProjectileTrajectory({
      speedMetersPerSecond: 12,
      angleDegrees: 20,
      launchHeightMeters: 1.5,
    });

    expect(trajectory.flightTimeSeconds).toBeGreaterThan(0);
    expect(trajectory.points.at(-1)?.y).toBe(0);
  });

  it.each([
    [{ speedMetersPerSecond: 0, angleDegrees: 45 }],
    [{ speedMetersPerSecond: 10, angleDegrees: 91 }],
    [{ speedMetersPerSecond: 10, angleDegrees: 45, gravityMetersPerSecondSquared: 0 }],
    [{ speedMetersPerSecond: 10, angleDegrees: 45, launchHeightMeters: -1 }],
    [{ speedMetersPerSecond: 10, angleDegrees: 0 }],
  ])("rejects invalid or non-flying launch parameters: %o", (parameters) => {
    expect(() => calculateProjectileTrajectory(parameters)).toThrow(RangeError);
  });

  it("rejects an invalid trajectory sampling resolution", () => {
    expect(() =>
      calculateProjectileTrajectory(
        { speedMetersPerSecond: 10, angleDegrees: 45 },
        1,
      ),
    ).toThrow(/sampleIntervals/);
  });

  it("scores a precise hit and gives no points for a miss", () => {
    const trajectory = calculateProjectileTrajectory({
      speedMetersPerSecond: Math.sqrt(25 * 9.80665),
      angleDegrees: 45,
    });
    const hit = scoreProjectileShot(trajectory, 25, 1.5, 25);
    const miss = scoreProjectileShot(trajectory, 40, 1.5, 25);

    expect(hit.hit).toBe(true);
    expect(hit.accuracyPoints).toBeGreaterThan(0);
    expect(hit.predictionPoints).toBe(20);
    expect(hit.score).toBe(hit.accuracyPoints + hit.predictionPoints);
    expect(miss.hit).toBe(false);
    expect(miss.score).toBe(0);
  });
});

describe("Projectile Master game", () => {
  it("asks for a prediction and launches a shot with visible results", () => {
    render(<ProjectileMasterPage />);

    expect(
      screen.getByRole("heading", { name: "Projectile Master" }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: /projectile target at 25 meters/i }))
      .toBeTruthy();

    startProjectileMaster();
    fireEvent.change(screen.getByRole("spinbutton", { name: /range prediction/i }), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Launch projectile" }));

    expect(screen.getByText(/Missed by/)).toBeTruthy();
    expect(screen.getByText("RANGE")).toBeTruthy();
    expect(screen.getByText("Playing")).toBeTruthy();
  });

  it("records a hit and allows the player to advance to the next target", () => {
    render(<ProjectileMasterPage />);
    startProjectileMaster();

    fireEvent.change(screen.getByRole("slider", { name: /Launch speed/ }), {
      target: { value: "15.5" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /range prediction/i }), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Launch projectile" }));

    expect(screen.getByText(/Target hit!/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next target" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next target" }));
    expect(screen.getByRole("heading", { name: "Adjust your aim" })).toBeTruthy();
    expect(
      screen.getByRole("spinbutton", { name: /Your range prediction/ }),
    ).toBeTruthy();
  });

  it("completes all rounds and can be replayed", () => {
    render(<ProjectileMasterPage />);
    startProjectileMaster();
    const speeds = [15.5, 18.5, 21];

    PROJECTILE_MASTER_ROUNDS.forEach((round, index) => {
      fireEvent.change(screen.getByRole("slider", { name: /Launch speed/ }), {
        target: { value: String(speeds[index]) },
      });
      fireEvent.change(
        screen.getByRole("spinbutton", { name: /range prediction/i }),
        { target: { value: String(round.targetDistanceMeters) } },
      );
      fireEvent.click(screen.getByRole("button", { name: "Launch projectile" }));

      expect(screen.getByText(/Target hit!/)).toBeTruthy();
      if (index < PROJECTILE_MASTER_ROUNDS.length - 1) {
        fireEvent.click(screen.getByRole("button", { name: "Next target" }));
      }
    });

    expect(screen.getByText("Challenge complete")).toBeTruthy();
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play again" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText("Find your range")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start game" })).toBeTruthy();
  });

  it("pauses and resumes play, disabling game inputs while paused", () => {
    render(<ProjectileMasterPage />);
    startProjectileMaster();

    fireEvent.click(screen.getByRole("button", { name: "Pause game" }));
    expect(screen.getByText("Paused")).toBeTruthy();
    expect(
      screen
        .getByRole("spinbutton", { name: /range prediction/i })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Launch projectile" })
        .hasAttribute("disabled"),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Resume game" }));
    expect(screen.getByText("Playing")).toBeTruthy();
    expect(
      screen
        .getByRole("spinbutton", { name: /range prediction/i })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("shows measurable objectives and a score summary", () => {
    render(<ProjectileMasterPage />);

    expect(screen.getByRole("region", { name: "Game objectives" })).toBeTruthy();
    expect(screen.getByText("0 / 3 targets")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Game score" })).toBeTruthy();
    expect(screen.getByText("0 pts")).toBeTruthy();
  });

  it("links to Projectile Master from home and activates the Physics Worlds navigation", () => {
    const gamePath = "/worlds/mechanics/projectile-master";
    const view = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path={gamePath} element={<ProjectileMasterPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Play Projectile Master" }).getAttribute("href"),
    ).toBe(gamePath);

    view.unmount();
    render(
      <MemoryRouter initialEntries={[gamePath]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path={gamePath} element={<ProjectileMasterPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen
        .getAllByRole("link", { name: "Physics Worlds" })
        .some((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
  });
});
