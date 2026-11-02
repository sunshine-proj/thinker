import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LaserMazePage } from "../../src/features/games/laser-maze/LaserMazePage";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

describe("Laser Maze page", () => {
  it("draws the live beam and keeps the submit control off until the game starts", () => {
    render(<LaserMazePage />);

    expect(screen.getByRole("heading", { name: "Laser Maze" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Laser bench.*The beam misses the target/ })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Lock in this setting" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("updates the beam and readings as a mirror is turned", () => {
    render(<LaserMazePage />);
    startGame();
    setSlider("Mirror 1 angle", 34);

    expect(screen.getByText("INCIDENCE AT FIRST MIRROR").nextElementSibling?.textContent).toBe("56.0°");
    expect(screen.getByText("BEAM").nextElementSibling?.textContent).toBe("On target");
    expect(screen.getByRole("img", { name: /The beam hits the target/ })).toBeTruthy();
  });

  it("requires a prediction and explains a miss", () => {
    render(<LaserMazePage />);
    startGame();
    press("Lock in this setting");
    expect(screen.getByRole("alert").textContent).toMatch(/prediction/i);

    setPrediction("45");
    press("Lock in this setting");
    expect(screen.getByText(/missed the target by/)).toBeTruthy();
  });

  it("solves all three mazes and saves the result", async () => {
    render(<LaserMazePage />);
    startGame();

    setSlider("Mirror 1 angle", 34);
    setPrediction("56");
    press("Lock in this setting");
    expect(screen.getByText(/Target hit!/)).toBeTruthy();
    press("Next maze");

    setSlider("Mirror 1 angle", 135);
    setSlider("Mirror 2 angle", 45);
    setPrediction("45");
    press("Lock in this setting");
    expect(screen.getByText(/Target hit!/)).toBeTruthy();
    press("Next maze");

    // Round 3: the glass bends the beam to 19.47° inside; find the working mirror angle.
    const { LASER_ROUNDS } = await import("../../src/features/games/laser-maze/laserMazeData");
    const { evaluateLaser } = await import("../../src/features/games/laser-maze/laserMazeModel");
    const glass = LASER_ROUNDS[2]!;
    let best = 0;
    let bestFraction = -1;
    for (let a = 0; a <= 180; a += 0.5) {
      const outcome = evaluateLaser(glass, { mirrorAnglesDegrees: [a] });
      if (outcome.success && outcome.accuracyFraction > bestFraction) {
        best = a;
        bestFraction = outcome.accuracyFraction;
      }
    }
    setSlider("Mirror 1 angle", best);
    setPrediction("19.5");
    press("Lock in this setting");
    expect(screen.getByText(/Target hit!/)).toBeTruthy();
    expect(screen.getByText("Every round complete.")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "laser-maze");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBeGreaterThan(200);
    });
  });
});
