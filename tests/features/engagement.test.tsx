import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ListenButtons } from "../../src/components/common";
import { PHYSICS_WORLDS, suggestedPath } from "../../src/data/games/gameCatalog";
import { HomePage } from "../../src/features/home/HomePage";
import { PhysicsWorldsPage } from "../../src/features/physics-worlds/PhysicsWorldsPage";
import { ProfilePage } from "../../src/features/profile/ProfilePage";
import { calculateStreak, pickSurprise } from "../../src/game-engine/progression/streak";
import * as audio from "../../src/services/audio/tonePlayer";
import { readPreferences } from "../../src/services/preferences";
import { useProgressStore } from "../../src/store/progressStore";

describe("streak", () => {
  const now = new Date(2026, 10, 19, 12);
  const day = (offset: number) => new Date(2026, 10, 19 + offset, 9).toISOString();
  it("counts consecutive days ending today or yesterday", () => {
    expect(calculateStreak([], now)).toBe(0);
    expect(calculateStreak([day(0), day(-1), day(-2)], now)).toBe(3);
    expect(calculateStreak([day(-1), day(-2)], now)).toBe(2);
    expect(calculateStreak([day(0), day(-2)], now)).toBe(1);
    expect(calculateStreak([day(-3)], now)).toBe(0);
    expect(calculateStreak(["not a date"], now)).toBe(0);
  });
});

describe("surprise me", () => {
  it("prefers unplayed games and falls back to any", () => {
    const games = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(pickSurprise(games, new Set(["a", "b"]), () => 0.9)?.id).toBe("c");
    expect(pickSurprise(games, new Set(["a", "b", "c"]), () => 0.99)?.id).toBe("c");
    expect(pickSurprise([], new Set())).toBeNull();
  });

  it("navigates from Home to a game", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<p>Game opened</p>} path="/worlds/:world/:game" />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Surprise me" }));
    expect(screen.getByText("Game opened")).toBeTruthy();
  });
});

describe("world map", () => {
  it("orders each world's path from beginner to advanced and tells its story", () => {
    for (const world of PHYSICS_WORLDS) {
      const order = { Beginner: 0, Intermediate: 1, Advanced: 2 } as const;
      const games = suggestedPath(world).filter((entry) => entry.kind === "game");
      for (let i = 1; i < games.length; i += 1) {
        expect(order[games[i]!.difficulty]).toBeGreaterThanOrEqual(order[games[i - 1]!.difficulty]);
      }
      expect(world.story.premise.length).toBeGreaterThan(60);
    }
  });

  it("highlights the next suggested game and shows stars, with nothing locked", async () => {
    const mechanics = PHYSICS_WORLDS[0]!;
    const first = suggestedPath(mechanics)[0]!;
    await useProgressStore.getState().recordGameResult({
      gameId: first.id, score: 250, difficulty: "Beginner", completionStatus: "completed", completedAt: new Date().toISOString(), stars: 6, maxStars: 9,
    });
    render(<MemoryRouter><PhysicsWorldsPage /></MemoryRouter>);
    const section = screen.getByRole("region", { name: mechanics.title });
    expect(within(section).getByText(mechanics.story.title)).toBeTruthy();
    expect(await within(section).findByRole("img", { name: "6 of 9 stars" })).toBeTruthy();
    const next = within(section).getByText(/NEXT UP/);
    expect(next.closest("a")?.getAttribute("href")).toBe(suggestedPath(mechanics)[1]!.path);
    expect(document.querySelectorAll("[aria-disabled=\"true\"]")).toHaveLength(0);
  });
});

describe("younger learner preference", () => {
  it("is switched on from the Profile page", () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("checkbox", { name: /Younger learner mode/ }));
    expect(readPreferences().youngerLearner).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: /Younger learner mode/ }));
    expect(readPreferences().youngerLearner).toBe(false);
  });
});

describe("sound", () => {
  it("plays tones on request, respects mute and explains when audio is missing", () => {
    const play = vi.spyOn(audio, "playTone").mockReturnValue(true);
    vi.spyOn(audio, "isAudioSupported").mockReturnValue(true);
    render(<ListenButtons tones={[{ label: "Play A", frequency: 440 }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Play A \(440\.0 Hz\)/ }));
    expect(play).toHaveBeenCalledWith(expect.objectContaining({ frequency: 440 }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Mute sounds" }));
    expect(audio.isMuted()).toBe(true);
    expect((screen.getByRole("button", { name: /Play A/ }) as HTMLButtonElement).disabled).toBe(true);
    audio.setMuted(false);
  });

  it("does nothing without Web Audio (as in this test browser)", () => {
    expect(audio.isAudioSupported()).toBe(false);
    expect(audio.playTone({ frequency: 440 })).toBe(false);
    expect(audio.playEffect("success")).toBe(false);
    render(<ListenButtons tones={[{ label: "Play A", frequency: 440 }]} />);
    expect(screen.getByText(/Sound is not available/)).toBeTruthy();
  });
});
