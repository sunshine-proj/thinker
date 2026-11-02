import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { expect } from "vitest";
import type { RoundGameMeta } from "../../src/game-engine/rounds/types";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "./roundGame";

export interface RoundSolution {
  /** Slider label → value. */
  readonly sliders: Record<string, number>;
  /** Prediction to enter; omit for games without one. */
  readonly prediction?: number;
}

/** Plays every round with the given settings, checks the result text, and checks the score is saved. */
export async function playThrough(
  Page: ComponentType,
  meta: RoundGameMeta,
  solutions: readonly RoundSolution[],
  minimumTotal = 150,
) {
  render(<Page />);
  expect(screen.getByRole("heading", { name: meta.title })).toBeTruthy();
  startGame();

  for (const [index, solution] of solutions.entries()) {
    for (const [label, value] of Object.entries(solution.sliders)) {
      setSlider(label, value);
    }
    if (solution.prediction !== undefined) {
      setPrediction(String(solution.prediction));
    }
    press(meta.submitLabel);
    expect(screen.getByText(new RegExp(meta.solvedLabel.replace(/[!?]/g, "")))).toBeTruthy();
    if (index < solutions.length - 1) {
      press(meta.nextLabel);
    }
  }

  expect(screen.getByText("Every round complete.")).toBeTruthy();
  await waitFor(() => {
    const saved = useProgressStore.getState().results.filter((r) => r.gameId === meta.id);
    expect(saved).toHaveLength(1);
    expect(saved[0]?.score).toBeGreaterThanOrEqual(minimumTotal);
  });
}

/** Common checks: controls locked before Start, prediction required, a wrong setting gives feedback. */
export function checkGuards(
  Page: ComponentType,
  meta: RoundGameMeta,
  wrong: { sliders: Record<string, number>; prediction?: number; feedback: RegExp },
) {
  render(<Page />);
  expect((screen.getByRole("button", { name: meta.submitLabel }) as HTMLButtonElement).disabled).toBe(true);
  startGame();
  const hasPrediction = wrong.prediction !== undefined;
  if (hasPrediction) {
    press(meta.submitLabel);
    expect(screen.getByRole("alert").textContent).toMatch(/prediction/i);
  }
  for (const [label, value] of Object.entries(wrong.sliders)) {
    setSlider(label, value);
  }
  if (hasPrediction) {
    setPrediction(String(wrong.prediction));
  }
  press(meta.submitLabel);
  expect(screen.getAllByText(wrong.feedback).length).toBeGreaterThan(0);
}
