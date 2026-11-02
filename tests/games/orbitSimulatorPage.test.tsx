import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrbitSimulatorPage } from "../../src/features/games/orbit-simulator/OrbitSimulatorPage";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

describe("Orbit Simulator page", () => {
  it("draws the orbit live and hides the period until the launch is locked in", () => {
    render(<OrbitSimulatorPage />);

    expect(screen.getByRole("heading", { name: "Orbit Simulator" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Orbit view.*a closed orbit/ })).toBeTruthy();
    expect(screen.getByText("PERIOD").nextElementSibling?.textContent).toBe("—");
    expect((screen.getByRole("slider", { name: "Launch speed (sideways)" }) as HTMLInputElement).disabled).toBe(true);
  });

  it("updates the lowest point and eccentricity live as the speed changes", () => {
    render(<OrbitSimulatorPage />);
    startGame();
    setSlider("Launch speed (sideways)", 7.62);

    expect(screen.getByText("ECCENTRICITY").nextElementSibling?.textContent).toBe("0.001");
    setSlider("Launch speed (sideways)", 6.5);
    expect(screen.getByText("LOWEST POINT").nextElementSibling?.textContent).toMatch(/^-/);
    expect(screen.getByRole("img", { name: /path that hits the Earth/ })).toBeTruthy();
  });

  it("explains a failed launch and reveals the period afterwards", () => {
    render(<OrbitSimulatorPage />);
    startGame();
    setSlider("Launch speed (sideways)", 8.2);
    setPrediction("95");
    press("Lock in this launch");

    expect(screen.getByText(/The orbit is an ellipse/)).toBeTruthy();
    expect(screen.getByText("PERIOD").nextElementSibling?.textContent).toMatch(/min$/);
  });

  it("solves all three missions and saves the result", async () => {
    render(<OrbitSimulatorPage />);
    startGame();

    setSlider("Launch speed (sideways)", 7.62);
    setPrediction("94.6");
    press("Lock in this launch");
    expect(screen.getByText(/Mission accomplished!/)).toBeTruthy();
    press("Next mission");

    setSlider("Launch speed (sideways)", 8.59);
    setPrediction("150");
    press("Lock in this launch");
    expect(screen.getByText(/Mission accomplished!/)).toBeTruthy();
    press("Next mission");

    setSlider("Launch altitude", 4190);
    setSlider("Launch speed (sideways)", 6.14);
    setPrediction("180");
    press("Lock in this launch");
    expect(screen.getByText(/Mission accomplished!/)).toBeTruthy();
    expect(screen.getByText("Every round complete.")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "orbit-simulator");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBeGreaterThan(200);
    });
  });
});
