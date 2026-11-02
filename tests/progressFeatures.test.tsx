import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AchievementNotice } from "../src/components/feedback/AchievementNotice";
import { AchievementsPage } from "../src/features/achievements/AchievementsPage";
import { ChallengesPage } from "../src/features/challenges/ChallengesPage";
import { HomePage } from "../src/features/home/HomePage";
import { ProfilePage } from "../src/features/profile/ProfilePage";
import { useProgressStore } from "../src/store/progressStore";
import type { GameResult } from "../src/types/progress";

const now = new Date().toISOString();
const gameResult = (gameId: string, score: number): GameResult => ({
  gameId, score, difficulty: "Advanced", completionStatus: "completed", completedAt: now,
});
const wrap = (node: React.ReactNode) => <MemoryRouter>{node}</MemoryRouter>;

describe("achievement flow", () => {
  it("unlocks, persists and announces achievements when a game is completed", async () => {
    render(wrap(<AchievementNotice />));
    expect(screen.queryByRole("status")).toBeNull();

    await act(async () => {
      await useProgressStore.getState().recordGameResult(gameResult("balance-challenge", 285));
    });

    const notice = await screen.findByRole("status");
    expect(notice.textContent).toContain("2 achievements unlocked");
    expect(notice.textContent).toContain("First Steps");
    expect(notice.textContent).toContain("Balanced Mind");
    expect(useProgressStore.getState().achievements).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not unlock the same achievement twice", async () => {
    await useProgressStore.getState().recordGameResult(gameResult("projectile-master", 100));
    await useProgressStore.getState().recordGameResult(gameResult("projectile-master", 120));

    expect(
      useProgressStore.getState().achievements.filter((a) => a.achievementId === "first-steps"),
    ).toHaveLength(1);
  });

  it("shows locked and unlocked achievements without relying on colour", async () => {
    await useProgressStore.getState().recordGameResult(gameResult("circuit-builder", 290));
    render(wrap(<AchievementsPage />));

    expect(await screen.findByText(/2 of 7 unlocked/)).toBeTruthy();
    expect(screen.getAllByText("LOCKED").length).toBe(5);
    expect(screen.getAllByText(/^UNLOCKED/).length).toBe(2);
    expect(screen.getByRole("region", { name: "Player level" }).textContent).toContain("Experimenter");
  });
});

describe("level and profile", () => {
  it("raises the level as scores accumulate", async () => {
    await useProgressStore.getState().recordGameResult(gameResult("projectile-master", 150));
    await useProgressStore.getState().recordGameResult(gameResult("balance-challenge", 160));
    render(wrap(<ProfilePage />));

    const level = await screen.findByRole("region", { name: "Player level" });
    expect(level.textContent).toContain("Junior Scientist");
    expect(level.textContent).toContain("310 learning points");
  });

  it("clears saved progress including achievements", async () => {
    await useProgressStore.getState().recordGameResult(gameResult("projectile-master", 150));
    render(wrap(<ProfilePage />));

    fireEvent.click(await screen.findByRole("button", { name: "Clear saved progress" }));
    await waitFor(() => expect(screen.getByText("No games completed yet")).toBeTruthy());
    expect(useProgressStore.getState().achievements).toHaveLength(0);
  });
});

describe("challenges", () => {
  it("shows a daily challenge and marks standing challenges done", async () => {
    await useProgressStore.getState().recordGameResult(gameResult("projectile-master", 250));
    render(wrap(<ChallengesPage />));

    expect(screen.getByRole("heading", { name: "Challenges" })).toBeTruthy();
    expect(screen.getByText("DAILY PHYSICS CHALLENGE")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Sharpshooter/ }).textContent).toContain("COMPLETED");
    });
    expect(screen.getByRole("link", { name: /Perfect balance/ }).textContent).toContain("TO DO");
  });

  it("shows the daily challenge on the home page", () => {
    render(wrap(<HomePage />));
    expect(screen.getByText("DAILY PHYSICS CHALLENGE")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Player level" })).toBeTruthy();
  });
});
