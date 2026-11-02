import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TemperatureControlPage } from "../../src/features/games/temperature-control/TemperatureControlPage";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

const run = () => press("Run the winter night");

describe("Temperature Control page", () => {
  it("keeps controls off until the game starts and shows locked settings", () => {
    render(<TemperatureControlPage />);

    expect(screen.getByRole("heading", { name: "Temperature Control" })).toBeTruthy();
    expect((screen.getByRole("slider", { name: "Heater power" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/Insulation fixed at 10 cm/)).toBeTruthy();
    expect(screen.queryByRole("img", { name: /Cabin temperature/ })).toBeNull();
  });

  it("charts the night and explains a cabin that is too cold", () => {
    render(<TemperatureControlPage />);
    startGame();
    setSlider("Heater power", 300);
    setPrediction("19");
    run();

    expect(screen.getByText(/too cold/)).toBeTruthy();
    expect(screen.getByRole("img", { name: /Cabin temperature through the night/ })).toBeTruthy();
    expect(screen.getByText("EQUILIBRIUM").nextElementSibling?.textContent).toBe("13.8 °C");
  });

  it("solves all three cabins and saves the result", async () => {
    render(<TemperatureControlPage />);
    startGame();

    setSlider("Heater power", 400);
    setPrediction("25");
    run();
    expect(screen.getByText(/Cabin comfortable!/)).toBeTruthy();
    press("Next cabin");

    setSlider("Insulation thickness", 13.3);
    setPrediction("25");
    run();
    expect(screen.getByText(/Cabin comfortable!/)).toBeTruthy();
    press("Next cabin");

    // Round 3: U = 24.6 W/K (6.5 cm) needs 738 W; rise above outside is 30 K.
    setSlider("Heater power", 740);
    setSlider("Insulation thickness", 6.5);
    setPrediction("30");
    run();
    expect(screen.getByText(/Cabin comfortable!/)).toBeTruthy();
    expect(screen.getByText("Every round complete.")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "temperature-control");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBeGreaterThan(250);
    });
  });
});
