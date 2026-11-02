import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BalanceChallengePage } from "../../src/features/games/balance-challenge/BalanceChallengePage";
import { useProgressStore } from "../../src/store/progressStore";

function setPrediction(value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name: /prediction/i }), {
    target: { value },
  });
}

function setControl(value: string) {
  fireEvent.change(screen.getByRole("slider"), { target: { value } });
}

function release() {
  fireEvent.click(screen.getByRole("button", { name: "Release lever" }));
}

describe("Balance Challenge game", () => {
  it("keeps controls disabled until the game starts", () => {
    render(<BalanceChallengePage />);

    expect(screen.getByRole("heading", { name: "Balance Challenge" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Release lever" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect((screen.getByRole("slider") as HTMLInputElement).disabled).toBe(true);
  });

  it("requires a prediction before releasing the lever", () => {
    render(<BalanceChallengePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    release();

    expect(screen.getByRole("alert").textContent).toMatch(/prediction/i);
    expect(screen.queryByText("NET TORQUE")?.nextElementSibling?.textContent).toBe(
      "—",
    );
  });

  it("tips the lever and reports the net torque when the setting is wrong", () => {
    render(<BalanceChallengePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    setPrediction("5");
    setControl("5");
    release();

    expect(screen.getByText(/The lever tips down on the right/)).toBeTruthy();
    expect(screen.getByText("19.6 N·m", { selector: "strong" })).toBeTruthy();
    expect(screen.getByText("Playing")).toBeTruthy();
  });

  it("clears the result when the control moves after a release", () => {
    render(<BalanceChallengePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    setPrediction("5");
    setControl("5");
    release();
    setControl("4.5");

    expect(screen.queryByText(/The lever tips/)).toBeNull();
  });

  it("can be paused and resumed", () => {
    render(<BalanceChallengePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause game" }));

    expect(screen.getByText(/Game paused/)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Release lever" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Resume game" }));
    expect(screen.getByText("Playing")).toBeTruthy();
  });

  it("hides the hint until requested", () => {
    render(<BalanceChallengePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));

    expect(screen.queryByText(/Multiply mass by distance/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Need a hint?" }));
    expect(screen.getByText(/Multiply mass by distance/)).toBeTruthy();
  });

  it("completes all three levers, scores them, and saves the result locally", async () => {
    render(<BalanceChallengePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));

    const solutions: [string, string][] = [
      ["4", "4"],
      ["3", "3"],
      ["5.5", "5.5"],
    ];
    solutions.forEach(([prediction, control], index) => {
      setPrediction(prediction);
      setControl(control);
      release();
      expect(screen.getByText(/Balanced! 100 points/)).toBeTruthy();
      if (index < solutions.length - 1) {
        fireEvent.click(screen.getByRole("button", { name: "Next lever" }));
      }
    });

    expect(screen.getByText("Every lever balanced.")).toBeTruthy();
    expect(screen.getByText(/You scored 300 points over 3 releases/)).toBeTruthy();
    expect(screen.getByText("Completed")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore
        .getState()
        .results.filter((result) => result.gameId === "balance-challenge");
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({
        score: 300,
        difficulty: "Advanced",
        completionStatus: "completed",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(screen.getByRole("button", { name: "Start game" })).toBeTruthy();
    expect(screen.getByText("The classic seesaw")).toBeTruthy();
  });

  it("gives fewer attempt points after a wrong release", () => {
    render(<BalanceChallengePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    setPrediction("4");
    setControl("5");
    release();
    setControl("4");
    release();

    expect(screen.getByText(/Balanced! 90 points/)).toBeTruthy();
  });
});
