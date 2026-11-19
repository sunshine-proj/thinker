import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "../../src/features/home/HomePage";
import { useProgressStore } from "../../src/store/progressStore";

describe("Home page (PRD §4.1)", () => {
  it("shows recommendations, a featured experiment and an empty recent list for a new learner", async () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const recommended = await screen.findByRole("region", { name: "Recommended for you" });
    expect(within(recommended).getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Featured experiment" })).toBeTruthy();
    expect(screen.getByText(/Nothing yet/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Continue learning" })).toBeNull();
    expect(screen.getByRole("link", { name: /Follow the question/ }).getAttribute("href")).toBe("/thought-experiments/gravity-doubles");
  });

  it("offers to continue a saved game and lists completed activities", async () => {
    await useProgressStore.getState().saveSession("laser-maze", { round: 1 });
    await useProgressStore.getState().recordGameResult({
      gameId: "bridge-builder", score: 240, difficulty: "Beginner", completionStatus: "completed", completedAt: new Date().toISOString(),
    });
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const resume = await screen.findByRole("region", { name: "Continue learning" });
    expect(within(resume).getByRole("link", { name: /Resume Laser Maze/ }).getAttribute("href")).toBe("/worlds/optics/laser-maze");
    const recent = screen.getByRole("region", { name: "Recently completed" });
    expect(within(recent).getByRole("link", { name: "Bridge Builder" })).toBeTruthy();
    expect(within(recent).getByText(/240 points/)).toBeTruthy();
  });
});
