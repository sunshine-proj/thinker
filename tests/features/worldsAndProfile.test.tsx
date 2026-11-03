import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PHYSICS_WORLDS } from "../../src/data/games/gameCatalog";
import { PhysicsWorldsPage } from "../../src/features/physics-worlds/PhysicsWorldsPage";
import { ProfilePage } from "../../src/features/profile/ProfilePage";
import { router } from "../../src/app/router";
import { useProgressStore } from "../../src/store/progressStore";

describe("Physics Worlds", () => {
  it("links every playable game and experiment", () => {
    render(
      <MemoryRouter>
        <PhysicsWorldsPage />
      </MemoryRouter>,
    );

    for (const entry of PHYSICS_WORLDS.flatMap((world) => world.entries)) {
      const link = screen.getByRole("link", { name: new RegExp(entry.title) });
      expect(link.getAttribute("href")).toBe(entry.path);
    }
    // Every planned game is playable now, so no world lists anything as coming soon.
    expect(PHYSICS_WORLDS.every((world) => world.comingSoon.length === 0)).toBe(true);
    expect(screen.queryAllByText("COMING SOON")).toHaveLength(0);
  });

  it("only lists paths that exist in the router", () => {
    const routePaths = new Set(
      router.routes[0]?.children?.flatMap((child) => [
        child.path,
        ...(child.children?.map((nested) => `${child.path}/${nested.path}`) ?? []),
      ]),
    );

    for (const entry of PHYSICS_WORLDS.flatMap((world) => world.entries)) {
      expect(routePaths.has(entry.path.slice(1))).toBe(true);
    }
  });
});

describe("Profile", () => {
  it("shows saved best scores after loading", async () => {
    await useProgressStore.getState().recordGameResult({
      gameId: "balance-challenge",
      score: 275,
      difficulty: "Advanced",
      completionStatus: "completed",
      completedAt: "2026-11-02T10:00:00.000Z",
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const card = screen.getByText("Balance Challenge").closest(".world-card");
      expect(card).toBeTruthy();
      expect(within(card as HTMLElement).getByText("275 points")).toBeTruthy();
    });
  });
});
