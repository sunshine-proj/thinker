import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IceMeltingPage } from "../../src/features/games/ice-melting/IceMeltingPage";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

describe("Ice Melting page", () => {
  it("keeps controls off until the game starts and shows no result before mixing", () => {
    render(<IceMeltingPage />);

    expect(screen.getByRole("heading", { name: "Ice Melting Challenge" })).toBeTruthy();
    expect((screen.getByRole("slider", { name: "Mass of ice added" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("FINAL TEMPERATURE").nextElementSibling?.textContent).toBe("—");
    expect(screen.getByText(/Energy accounting appears after you mix/)).toBeTruthy();
  });

  it("shows the energy accounting and an explanation after a wrong mixture", () => {
    render(<IceMeltingPage />);
    startGame();
    setSlider("Mass of ice added", 120);
    setPrediction("5");
    press("Mix and wait for equilibrium");

    expect(screen.getByText(/Not all the ice melted/)).toBeTruthy();
    expect(screen.getByText("Heat to melt all the ice")).toBeTruthy();
    expect(screen.getByText("STATE").nextElementSibling?.textContent).toBe("Ice + water");
  });

  it("solves all three flasks and saves the result", async () => {
    render(<IceMeltingPage />);
    startGame();

    setSlider("Mass of ice added", 47.5);
    setPrediction("10");
    press("Mix and wait for equilibrium");
    expect(screen.getByText(/Perfect mixture!/)).toBeTruthy();
    press("Next flask");

    setSlider("Mass of ice added", 212);
    setPrediction("100");
    press("Mix and wait for equilibrium");
    expect(screen.getByText(/Perfect mixture!/)).toBeTruthy();
    press("Next flask");

    setSlider("Starting water temperature", 80.5);
    setPrediction("15");
    press("Mix and wait for equilibrium");
    expect(screen.getByText(/Perfect mixture!/)).toBeTruthy();
    expect(screen.getByText("Every round complete.")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "ice-melting");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBeGreaterThan(250);
    });
  });
});
