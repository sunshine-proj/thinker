import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ElectricDetectivePage } from "../../src/features/games/electric-detective/ElectricDetectivePage";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setSlider, startGame } from "../helpers/roundGame";

const takeReading = (x: number, y: number) => {
  setSlider("Probe x", x);
  setSlider("Probe y", y);
  press(/Take reading/);
};

describe("Electric Detective page", () => {
  it("keeps controls disabled until the game starts and shows no hidden charge", () => {
    render(<ElectricDetectivePage />);

    expect(screen.getByRole("heading", { name: "Electric Detective" })).toBeTruthy();
    expect((screen.getByRole("button", { name: /Take reading/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("The hidden charge is not shown")).toBeTruthy();
    expect(screen.queryByRole("spinbutton")).toBeNull(); // no prediction in this game
  });

  it("requires a reading before an answer and tests a wrong hypothesis", () => {
    render(<ElectricDetectivePage />);
    startGame();
    press("Submit your answer");
    expect(screen.getByRole("alert").textContent).toMatch(/at least one reading/);

    takeReading(80, 20);
    setSlider("Guess x", 10);
    setSlider("Guess y", 10);
    press("Submit your answer");

    expect(screen.getByText(/does not match reading 1/)).toBeTruthy();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(2);
  });

  it("refuses a probe next to the hidden charge and caps the readings", () => {
    render(<ElectricDetectivePage />);
    startGame();
    takeReading(36, 71);
    expect(screen.getByRole("alert").textContent).toMatch(/within 5 cm/);

    takeReading(10, 10);
    takeReading(20, 10);
    takeReading(30, 10);
    expect((screen.getByRole("button", { name: /Take reading \(3\/3\)/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("solves all three cases and saves the result", async () => {
    render(<ElectricDetectivePage />);
    startGame();

    // Case 1: the source is found from one reading.
    takeReading(80, 20);
    setSlider("Guess x", 35);
    setSlider("Guess y", 70);
    press("Submit your answer");
    expect(screen.getByText(/Case solved!/)).toBeTruthy();
    expect(screen.getByText(/The hidden charge was \+4.0 nC at \(35, 70\) cm/)).toBeTruthy();
    press("Next case");

    // Case 2: the position is given; find the charge (negative, 6 nC).
    expect(screen.getByText(/Position is known: \(60, 40\) cm/)).toBeTruthy();
    takeReading(60, 90);
    setSlider("Guess charge", -6);
    press("Submit your answer");
    expect(screen.getByText(/Case solved!/)).toBeTruthy();
    press("Next case");

    // Case 3: nothing is known; two readings triangulate the source.
    takeReading(80, 30);
    takeReading(25, 85);
    setSlider("Guess x", 25);
    setSlider("Guess y", 30);
    setSlider("Guess charge", -3);
    press("Submit your answer");
    expect(screen.getByText(/Case solved!/)).toBeTruthy();
    expect(screen.getByText("Every round complete.")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "electric-detective");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBeGreaterThanOrEqual(270);
    });
  });
});
