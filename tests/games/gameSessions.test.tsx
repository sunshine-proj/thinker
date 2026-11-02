import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BalanceChallengePage } from "../../src/features/games/balance-challenge/BalanceChallengePage";
import { CircuitBuilderPage } from "../../src/features/games/circuit-builder/CircuitBuilderPage";
import { ProjectileMasterPage } from "../../src/features/games/projectile-master/ProjectileMasterPage";
import { useProgressStore } from "../../src/store/progressStore";

/** Lets the page finish checking for a saved game before the learner interacts. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("resuming an unfinished game", () => {
  it("offers to resume a Balance Challenge with the saved prediction and round", async () => {
    const first = render(<BalanceChallengePage />);
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /prediction/i }), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Release lever" }));
    fireEvent.click(screen.getByRole("button", { name: "Next lever" }));
    first.unmount();

    await waitFor(async () => {
      expect(await useProgressStore.getState().loadSession("balance-challenge")).not.toBeNull();
    });

    render(<BalanceChallengePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Resume saved game" }));

    expect(screen.getByText("Three weights")).toBeTruthy();
    expect(screen.getByText("Game paused. Resume when you are ready to continue.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Resume saved game" })).toBeNull();
    expect(screen.getByText(/1 \/ 3 levers/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Resume game" }));
    expect(screen.getByText("Playing")).toBeTruthy();
  });

  it("starts fresh and forgets the saved game", async () => {
    const first = render(<ProjectileMasterPage />);
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    first.unmount();
    await waitFor(async () => {
      expect(await useProgressStore.getState().loadSession("projectile-master")).not.toBeNull();
    });

    render(<ProjectileMasterPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Start fresh" }));

    await waitFor(async () => {
      expect(await useProgressStore.getState().loadSession("projectile-master")).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Start game" })).toBeTruthy();
  });

  it("ignores a corrupt save instead of crashing", async () => {
    await useProgressStore.getState().saveSession("circuit-builder", {
      roundIndex: 99,
      status: "playing",
    });

    render(<CircuitBuilderPage />);

    await waitFor(async () => {
      expect(await useProgressStore.getState().loadSession("circuit-builder")).toBeNull();
    });
    expect(screen.queryByRole("button", { name: "Resume saved game" })).toBeNull();
    expect(screen.getByRole("button", { name: "Start game" })).toBeTruthy();
  });

  it("does not keep a finished game as resumable", async () => {
    const first = render(<ProjectileMasterPage />);
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    first.unmount();

    await waitFor(async () => {
      expect(await useProgressStore.getState().loadSession("projectile-master")).toBeNull();
    });
  });
});
