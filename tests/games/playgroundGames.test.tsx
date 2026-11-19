import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { runLiveGame } from "../../src/game-engine/live/liveModel";
import { PLAYGROUND_GAMES } from "../../src/features/playground-games";
import { PlaygroundGameRoute } from "../../src/features/playground-games/PlaygroundGameRoute";
import { SONGS, bottleBand, jarFrequency, waterForNote } from "../../src/features/playground-games/bottleBand";
import { TOWNS, checkCity, lightUpTheCity } from "../../src/features/playground-games/lightUpTheCity";
import { VOYAGES, pirateCargoShip, shipCondition } from "../../src/features/playground-games/pirateCargoShip";
import { COURSES, dropInSpeed, skatePark } from "../../src/features/playground-games/skatePark";
import { BATTLEFIELDS, simulateShot, solveShotSpeed, tankDuel } from "../../src/features/playground-games/tankDuel";
import { STANDARD_GRAVITY } from "../../src/physics/core";
import { wireCity } from "../../src/physics/electromagnetism";
import { advanceProjectile, launchProjectile } from "../../src/physics/mechanics";
import { calculateClosedPipeFrequency, calculateWaterDepthForFrequency } from "../../src/physics/waves";

const won = (result: { verdict: { status: string; message: string } }) => expect(result.verdict.status, result.verdict.message).toBe("won");

describe("playground physics", () => {
  it("adds wind exactly: x = v t + ½ a t²", () => {
    let state = launchProjectile(0, 0, 10, 0);
    for (let i = 0; i < 100; i += 1) state = advanceProjectile(state, 0.01, 0, 2);
    expect(state.x).toBeCloseTo(10 + 1, 9);
    expect(state.vx).toBeCloseTo(12, 9);
  });

  it("tunes a closed pipe: f = v / 4(L + 0.6 r), more water → higher note", () => {
    expect(calculateClosedPipeFrequency(0.25, 0, 343)).toBeCloseTo(343, 9);
    const depth = calculateWaterDepthForFrequency(0.25, 0.03, 343, 440);
    expect(calculateClosedPipeFrequency(0.25 - depth, 0.03, 343)).toBeCloseTo(440, 9);
    expect(jarFrequency(10)).toBeGreaterThan(jarFrequency(5));
  });

  it("wires bulbs: series streets share the voltage, parallel streets add current", () => {
    const city = wireCity(24, 24, 6, 2);
    expect(city.streets).toHaveLength(3);
    expect(city.streets[0]?.currentAmperes).toBeCloseTo(0.5, 12);
    expect(city.streets[0]?.bulbPowerWatts).toBeCloseTo(6, 12);
    expect(city.totalCurrentAmperes).toBeCloseTo(1.5, 12);
    expect(wireCity(24, 24, 5, 2).streets.map((street) => street.bulbs)).toEqual([2, 2, 1]);
    expect(() => wireCity(12, 24, 4, 0)).toThrow(RangeError);
  });

  it("aims shells with the terrain and wind included", () => {
    for (const level of [0, 1, 2]) {
      const speed = solveShotSpeed(level, 10, 85, 55);
      expect(Math.abs(simulateShot(level, 10, speed, 55, 1).x - 85)).toBeLessThan(0.5);
    }
    // The Moon's weaker gravity needs a much gentler shot on flat ground.
    expect(BATTLEFIELDS[2]!.gravity).toBeLessThan(BATTLEFIELDS[0]!.gravity / 5);
  });
});

describe("every playground level can be won, and the failures happen", () => {
  it("Tank Duel: an exact shot each turn wins; feeble shots lose", () => {
    for (const level of [0, 1, 2]) {
      const speed = solveShotSpeed(level, 10, 85, 55);
      const result = runLiveGame(tankDuel, level, (_t, s) => ({ values: { angle: 55, power: speed }, press: s.phase === "aim" ? ["fire"] : [] }), 120);
      won(result);
      expect(tankDuel.stars(result.state, level)).toBe(3);
    }
    const lost = runLiveGame(tankDuel, 0, (_t, s) => ({ values: { angle: 45, power: 5 }, press: s.phase === "aim" ? ["fire"] : [] }), 600);
    expect(lost.verdict.status).toBe("lost");
  });

  it("Light Up the City: 1, 2 and 3 houses per street light the three towns", () => {
    [1, 2, 3].forEach((perStreet, level) => {
      expect(checkCity(level, perStreet).result).toBe("lit");
      won(runLiveGame(lightUpTheCity, level, (t) => ({ values: { perStreet }, press: t === 0 ? ["switch"] : [] }), 1));
    });
    expect(checkCity(1, 1).result).toBe("fuse-blown");
    expect(checkCity(1, 3).result).toBe("dim");
    expect(checkCity(1, 4).result).toBe("dim");
    expect(TOWNS[2]!.houses).toBe(9);
  });

  it("Bottle Band: the calculated water depths tune every jar", () => {
    SONGS.forEach((song, level) => {
      const values = Object.fromEntries(song.notes.map((note, index) => [`jar${index + 1}`, Math.round(waterForNote(note.hz) * 10) / 10]));
      song.notes.forEach((note) => expect(waterForNote(note.hz)).toBeGreaterThan(0));
      won(runLiveGame(bottleBand, level, (t) => ({ values, press: t === 0 ? ["check"] : [] }), 1));
    });
    const flat = runLiveGame(bottleBand, 0, (t) => ({ values: { jar1: 0 }, press: t === 0 ? ["check"] : [] }), 1);
    expect(flat.verdict.message).toMatch(/out of tune/);
  });

  it("Pirate Cargo Ship: balancing each item wins; piling everything on one side capsizes", () => {
    VOYAGES.forEach((voyage, level) => {
      const result = runLiveGame(pirateCargoShip, level, (_t, s) => {
        const next = voyage.cargo[s.placed.length];
        if (!next) return {};
        const moment = s.placed.reduce((sum, entry) => sum + entry.item.tonnes * entry.offset, 0);
        return { values: { offset: Math.max(-3, Math.min(3, -moment / next.tonnes)) }, press: ["load"] };
      }, 5);
      won(result);
      expect(Math.abs(shipCondition(result.state.placed).heel)).toBeLessThan(0.5);
    });
    const capsized = runLiveGame(pirateCargoShip, 2, () => ({ values: { offset: 3 }, press: ["load"] }), 5);
    expect(capsized.verdict.status).toBe("lost");
  });

  it("Skate Park: heights from energy conservation land the jump, the spin and the loop", () => {
    const heightFor = (speed: number) => {
      let low = 0.5;
      let high = 6;
      for (let i = 0; i < 60; i += 1) {
        const mid = (low + high) / 2;
        if (dropInSpeed(mid) < speed) low = mid;
        else high = mid;
      }
      return (low + high) / 2;
    };
    const jump = heightFor(Math.sqrt((4 * STANDARD_GRAVITY) / Math.sin(Math.PI / 3)));
    won(runLiveGame(skatePark, 0, (t) => ({ values: { height: jump, kicker: 30 }, press: t === 0 ? ["go"] : [] }), 10));
    const spin = heightFor(Math.sqrt(5.5 * STANDARD_GRAVITY));
    won(runLiveGame(skatePark, 1, (t) => ({ values: { height: spin, kicker: 45 }, press: t === 0 ? ["go"] : [] }), 10));
    const loop = heightFor(Math.sqrt(5.5 * STANDARD_GRAVITY * 1.5));
    won(runLiveGame(skatePark, 2, (t) => ({ values: { height: loop }, press: t === 0 ? ["go"] : [] }), 10));
    expect(runLiveGame(skatePark, 2, (t) => ({ values: { height: 2 }, press: t === 0 ? ["go"] : [] }), 10).verdict.message).toMatch(/Fell off/);
    expect(runLiveGame(skatePark, 2, (t) => ({ values: { height: 6 }, press: t === 0 ? ["go"] : [] }), 10).verdict.message).toMatch(/Too fast/);
    expect(runLiveGame(skatePark, 1, (t) => ({ values: { height: spin, kicker: 15 }, press: t === 0 ? ["go"] : [] }), 10).verdict.status).toBe("lost");
    expect(COURSES).toHaveLength(3);
  });
});

describe("playground catalog and pages", () => {
  it("registers each game in its world with topics, and none needs a classic version", () => {
    for (const game of PLAYGROUND_GAMES) {
      const entry = findCatalogEntry(game.id);
      expect(entry?.path).toBe(`/worlds/${game.worldId}/${game.id}`);
      expect(entry?.topics.length).toBeGreaterThan(0);
      expect(PHYSICS_WORLDS.find((world) => world.id === game.worldId)?.entries).toContain(entry);
      expect(game.relatedGameId).toBeUndefined();
      expect(game.levels).toHaveLength(3);
    }
  });

  it("renders a playground game with levels, controls and sound buttons", () => {
    render(<MemoryRouter><PlaygroundGameRoute gameId="bottle-band" /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: "Bottle Band" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /classic round-based version/ })).toBeNull();
    expect(screen.getByRole("group", { name: "Listen" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /2\. Happy chord/ }));
    expect(screen.getAllByRole("slider")).toHaveLength(3);
  });

  it("shows not-found for an unknown playground game", () => {
    render(<MemoryRouter><PlaygroundGameRoute gameId="nope" /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: /Start/ })).toBeNull();
  });
});
