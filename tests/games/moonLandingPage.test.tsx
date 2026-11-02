import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MoonLandingPage } from "../../src/features/games/moon-landing/MoonLandingPage";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

const fire = () => press("Fire the descent engine");

describe("Moon Landing page", () => {
  it("shows the setup before the burn and keeps controls off until the game starts", () => {
    render(<MoonLandingPage />);

    expect(screen.getByRole("heading", { name: "Moon Landing" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Lunar descent.*starts 2000 meters above/ })).toBeTruthy();
    expect((screen.getByRole("slider", { name: "Ignition altitude" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/Engine fixed at full thrust/)).toBeTruthy();
  });

  it("charts a crash and explains why it happened", () => {
    render(<MoonLandingPage />);
    startGame();
    setSlider("Ignition altitude", 700);
    setPrediction("60");
    fire();

    expect(screen.getByText(/ignited too late/)).toBeTruthy();
    expect(screen.getByRole("img", { name: /Altitude during the descent/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Vertical velocity during the descent/ })).toBeTruthy();
    expect(screen.getByText("TOUCHDOWN SPEED").nextElementSibling?.textContent).toMatch(/m\/s$/);
  });

  it("solves all three landings and saves the result", async () => {
    render(<MoonLandingPage />);
    startGame();

    setSlider("Ignition altitude", 888);
    setPrediction("72");
    fire();
    expect(screen.getByText(/The Eagle has landed!/)).toBeTruthy();
    press("Next mission");

    setSlider("Ignition altitude", 912);
    setSlider("Throttle", 100);
    setPrediction("61");
    fire();
    expect(screen.getByText(/The Eagle has landed!/)).toBeTruthy();
    press("Next mission");

    setSlider("Ignition altitude", 1677);
    setSlider("Throttle", 100);
    setPrediction("83");
    fire();
    expect(screen.getByText(/The Eagle has landed!/)).toBeTruthy();
    expect(screen.getByText("Every round complete.")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "moon-landing");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBeGreaterThan(200);
    });
  });
});
