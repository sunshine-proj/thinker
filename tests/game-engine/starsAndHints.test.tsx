import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { suggestHarderChallenge } from "../../src/game-engine/progression/recommendations";
import { bestStarsByGame, calculateRoundStars, totalStars } from "../../src/game-engine/scoring/stars";
import { PHYSICS_WORLDS } from "../../src/data/games/gameCatalog";
import { PUCK_META } from "../../src/features/games/ice-puck-pilot/icePuckPilot";
import { IcePuckPilotPage } from "../../src/features/games/ice-puck-pilot/IcePuckPilotPage";
import { firstSentence, writePreferences } from "../../src/services/preferences";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

describe("stars", () => {
  it("rewards a high score with few hints and never gives less than one star for a solved round", () => {
    expect(calculateRoundStars(100, 0)).toBe(3);
    expect(calculateRoundStars(85, 1)).toBe(3);
    expect(calculateRoundStars(85, 2)).toBe(2);
    expect(calculateRoundStars(60, 0)).toBe(2);
    expect(calculateRoundStars(40, 0)).toBe(1);
    expect(calculateRoundStars(100, 3)).toBe(1);
    expect(() => calculateRoundStars(100, 4)).toThrow(RangeError);
    expect(totalStars([3, 2, 0])).toBe(5);
    expect(bestStarsByGame([
      { gameId: "a", stars: 4, completionStatus: "completed" },
      { gameId: "a", stars: 7, completionStatus: "completed" },
      { gameId: "b", completionStatus: "completed" },
    ])).toEqual({ a: 7 });
  });
});

describe("harder challenge suggestion", () => {
  it("suggests a harder game in the same world, unplayed first", () => {
    const next = suggestHarderChallenge("ice-puck-pilot", PHYSICS_WORLDS);
    expect(next).not.toBeNull();
    expect(["Intermediate", "Advanced"]).toContain(next!.difficulty);
    expect(PHYSICS_WORLDS[0]!.entries).toContain(next);
    expect(suggestHarderChallenge("unknown", PHYSICS_WORLDS)).toBeNull();
  });
});

function playRound(force: number, prediction: number) {
  setSlider("Thrust", force);
  setPrediction(String(prediction));
  press(PUCK_META.submitLabel);
}

describe("round game page with hints, stars and a celebration", () => {
  it("reveals three hint levels, lowers the stars, and celebrates completion with stars saved", async () => {
    render(<MemoryRouter><IcePuckPilotPage /></MemoryRouter>);
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "Need a nudge?" }));
    expect(screen.getByText(/Hint 1 · Nudge/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Show the formula/ }));
    expect(screen.getByText(/F = m v \/ t/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Show a worked step/ }));
    expect(screen.getByText(/works out at about 3 N/)).toBeTruthy();
    playRound(3, 3);
    expect(screen.getByRole("img", { name: "1 of 3 stars" })).toBeTruthy();
    press(PUCK_META.nextLabel);
    setSlider("Start braking at", 6);
    setPrediction("6");
    press(PUCK_META.submitLabel);
    expect(screen.getByRole("img", { name: "3 of 3 stars" })).toBeTruthy();
    press(PUCK_META.nextLabel);
    setSlider("Sled speed", 3);
    setPrediction("1");
    press(PUCK_META.submitLabel);

    const celebration = await screen.findByRole("region", { name: /every round solved/ });
    expect(celebration.textContent).toMatch(/Key idea:/);
    expect(screen.getByRole("img", { name: "7 of 9 stars" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Try a harder challenge/ })).toBeTruthy();
    await waitFor(() => expect(useProgressStore.getState().results[0]).toMatchObject({ gameId: "ice-puck-pilot", stars: 7, maxStars: 9 }));
  });

  it("shortens the text and opens the first hint on beginner rounds for younger learners", () => {
    writePreferences({ youngerLearner: true });
    render(<MemoryRouter><IcePuckPilotPage /></MemoryRouter>);
    expect(screen.getByText(firstSentence(PUCK_META.introduction))).toBeTruthy();
    expect(screen.queryByText(PUCK_META.introduction)).toBeNull();
    expect(screen.getByText(/Hint 1 · Nudge/)).toBeTruthy();
    expect(screen.getByText("Read the full explanation")).toBeTruthy();
    writePreferences({ youngerLearner: false });
  });

  it("finds the first sentence", () => {
    expect(firstSentence("One. Two.")).toBe("One.");
    expect(firstSentence("No full stop")).toBe("No full stop");
  });
});
