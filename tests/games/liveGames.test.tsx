import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LIVE_VERSIONS } from "../../src/data/games/liveGames";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { runLiveGame } from "../../src/game-engine/live/liveModel";
import { LiveGameRoute } from "../../src/features/live-games/LiveGameRoute";
import { LIVE_GAMES } from "../../src/features/live-games";
import { atomLive } from "../../src/features/live-games/atomLive";
import { basketballLive } from "../../src/features/live-games/basketballLive";
import { landerLive } from "../../src/features/live-games/landerLive";
import { laserLive, traceLevel } from "../../src/features/live-games/laserLive";
import { magneticMazeLive } from "../../src/features/live-games/magneticMazeLive";
import { projectileLive } from "../../src/features/live-games/projectileLive";
import { reactorLive, reactivityFor } from "../../src/features/live-games/reactorLive";
import { bargeCondition, shipLive } from "../../src/features/live-games/shipLive";
import { fewestPushes, swingLive } from "../../src/features/live-games/swingLive";
import { thermostatLive } from "../../src/features/live-games/thermostatLive";
import { PROTON_MASS, ELEMENTARY_CHARGE, STANDARD_GRAVITY } from "../../src/physics/core";
import { calculateTransitionWavelengthNm } from "../../src/physics/quantum";

describe("live games registry", () => {
  it("has one flagship live game per physics world, each linked from its classic game", () => {
    expect(new Set(LIVE_GAMES.map((game) => game.worldId))).toEqual(new Set(PHYSICS_WORLDS.map((world) => world.id)));
    for (const game of LIVE_GAMES) {
      expect(findCatalogEntry(game.relatedGameId)?.path).toBe(`/worlds/${game.worldId}/${game.relatedGameId}`);
      expect(LIVE_VERSIONS[game.relatedGameId]).toEqual({ id: game.id, title: game.title });
      expect(game.levels.length).toBeGreaterThanOrEqual(3);
      expect(game.assumptions.length).toBeGreaterThan(40);
    }
  });
});

const expectWin = (result: { verdict: { status: string; message: string } }) => {
  expect(result.verdict.status, result.verdict.message).toBe("won");
};

describe("every live level can be won by a sensible player", () => {
  it("Projectile Master Live: v = √(D g) at 45°", () => {
    [20, 35, 50].forEach((distance, level) => {
      expectWin(runLiveGame(projectileLive, level, (t) => ({ values: { angle: 45, speed: Math.sqrt(distance * STANDARD_GRAVITY) }, press: t === 0 ? ["launch"] : [] }), 10));
    });
    const miss = runLiveGame(projectileLive, 0, (_t, state) => ({ values: { angle: 45, speed: 10 }, press: state.ball ? [] : ["launch"] }), 60);
    expect(miss.verdict.status).toBe("lost");
  });

  it("Magnetic Maze Live: a fixed field for level 1, a steering controller for 2, a U-turn for 3", () => {
    const radius = 0.567;
    const field = -((PROTON_MASS * 1e5) / (ELEMENTARY_CHARGE * radius)) * 1000;
    expectWin(runLiveGame(magneticMazeLive, 0, () => ({ values: { field } }), 1e-4));
    expectWin(runLiveGame(magneticMazeLive, 1, (_t, s) => {
      const heading = Math.atan2(s.velocity.y, s.velocity.x);
      const desired = Math.atan2(0.1 - s.position.y, 0.08);
      return { values: { field: Math.max(-10, Math.min(10, -20 * (desired - heading))) } };
    }, 1e-4));
    expectWin(runLiveGame(magneticMazeLive, 2, (_t, s) => ({ values: { field: s.position.x < 0.55 && s.velocity.x > 0 ? 0 : s.velocity.x < 0 && s.velocity.y <= 0 ? 0 : -9.49 } }), 1e-4));
    expect(runLiveGame(magneticMazeLive, 0, () => ({ values: { field: 0 } }), 1e-4).verdict.status).toBe("lost");
  });

  it("Temperature Control Live: a proportional thermostat survives every night", () => {
    for (const level of [0, 1, 2]) {
      expectWin(runLiveGame(thermostatLive, level, (_t, s) => ({ values: { heater: Math.max(0, Math.min(5000, 2500 + 4000 * (21 - s.temperature))) } }), 7 * 3600));
    }
    expect(runLiveGame(thermostatLive, 1, () => ({ values: { heater: 0 } }), 7 * 3600).verdict.status).toBe("lost");
  });

  it("Laser Maze Live: some mirror setting reaches every target", () => {
    for (const level of [0, 1, 2]) {
      const mirrors = level === 1 ? 2 : 1;
      let found: Record<string, number> | null = null;
      for (let a = 0; a <= 180 && !found; a += 0.5) {
        for (let b = 0; b <= (mirrors === 2 ? 180 : 0) && !found; b += 0.5) {
          const values: Record<string, number> = mirrors === 2 ? { mirror1: a, mirror2: b } : { mirror1: a };
          if (traceLevel(level, values).hitTarget) found = values;
        }
      }
      expect(found, `level ${level}`).not.toBeNull();
      expectWin(runLiveGame(laserLive, level, () => ({ values: found! }), 2));
    }
  });

  it("Resonance Swing Live: pushing once per pass at the bottom works; random timing wastes pushes", () => {
    for (const level of [0, 1, 2]) {
      let last = 0;
      const result = runLiveGame(swingLive, level, (_t, s) => {
        const crossed = Math.sign(s.angle) !== Math.sign(last) || (s.angularVelocity === 0 && s.angle === last);
        last = s.angle;
        return { press: crossed ? [level === 2 ? "brake" : "push"] : [] };
      }, 300);
      expectWin(result);
      expect(swingLive.stars(result.state, level)).toBeGreaterThanOrEqual(2);
      expect(Math.abs(result.state.pushes - fewestPushes(level))).toBeLessThanOrEqual(2);
    }
  });

  it("Moon Landing Live: brake along v = √(5h) and land softly with fuel left", () => {
    for (const level of [0, 1, 2]) {
      const result = runLiveGame(landerLive, level, (_t, s) => ({ held: s.velocity < -(1 + Math.sqrt(5 * Math.max(0, s.altitude))) ? ["thrust"] : [] }), 200);
      expectWin(result);
      expect(result.state.touchdownSpeed!).toBeLessThan(3);
    }
    expect(runLiveGame(landerLive, 0, () => ({ held: [] }), 200).verdict.status).toBe("lost");
  });

  it("Atom Builder Live: hydrogen absorbs exactly the right lines and emits 656 nm on the way down", () => {
    const shots = [calculateTransitionWavelengthNm(1, 2, 1), calculateTransitionWavelengthNm(1, 4, 1), calculateTransitionWavelengthNm(1, 3, 1)];
    shots.forEach((wavelength, level) => {
      const result = runLiveGame(atomLive, level, (t) => ({ values: { wavelength }, press: t === 0 ? ["fire"] : [] }), 10);
      expectWin(result);
      expect(atomLive.stars(result.state, level)).toBe(3);
    });
    const ionise = runLiveGame(atomLive, 0, (t) => ({ values: { wavelength: 85 }, press: t === 0 ? ["fire"] : [] }), 2);
    expect(ionise.verdict.status).toBe("lost");
  });

  it("Ship Designer Live: balanced loading wins; one-sided loading capsizes", () => {
    [30, 80, 120].forEach((tonnes, level) => {
      let loaded = 0;
      const result = runLiveGame(shipLive, level, () => {
        const press = loaded < tonnes ? ["load"] : [];
        loaded += press.length ? 10 : 0;
        return { values: { mass: 10, offset: 0 }, press };
      }, 30);
      expectWin(result);
    });
    expect(bargeCondition([{ massKg: 15_000, offset: 2.5 }, { massKg: 15_000, offset: 2.5 }]).heel).toBeGreaterThan(5);
    let count = 0;
    const tipped = runLiveGame(shipLive, 2, () => ({ values: { mass: 15, offset: 2.5 }, press: count++ < 20 ? ["load"] : [] }), 30);
    expect(tipped.verdict.status).toBe("lost");
  });

  it("Reactor Operator Live: withdraw to a 20 s period, then trim to critical", () => {
    const critical = 100 / 3;
    const insertionFor = (rho: number) => ((0.01 - rho) / 0.03) * 100;
    [{ level: 0, target: 0.5 }, { level: 1, target: 1 }, { level: 2, target: 0.2 }].forEach(({ level, target }) => {
      const result = runLiveGame(reactorLive, level, (_t, s) => {
        const ratio = s.power / target;
        const rods = ratio < 0.85 ? insertionFor(0.0025) : ratio > 1.15 ? insertionFor(-0.003) : critical + 60 * (ratio - 1);
        return { values: { rods } };
      }, 400);
      expectWin(result);
    });
    expect(reactivityFor(critical)).toBeCloseTo(0, 12);
    const tripped = runLiveGame(reactorLive, 0, () => ({ values: { rods: 20 } }), 30);
    expect(tripped.verdict.status).toBe("lost");
    expect(tripped.verdict.message).toMatch(/Period trip/);
    expect(runLiveGame(reactorLive, 0, () => ({ values: { rods: 10 } }), 30).verdict.message).toMatch(/Prompt-critical/);
  });

  it("Basketball Challenge Live: the exact release speed scores from every spot", () => {
    const speedFor = (distance: number, angle: number) => {
      const t = (angle * Math.PI) / 180;
      return Math.sqrt((STANDARD_GRAVITY * distance ** 2) / (2 * Math.cos(t) ** 2 * (distance * Math.tan(t) - 1.05)));
    };
    [{ d: 4.2, a: 50 }, { d: 6.75, a: 50 }, { d: 5, a: 60 }].forEach(({ d, a }, level) => {
      expectWin(runLiveGame(basketballLive, level, (t) => ({ values: { angle: a, speed: speedFor(d, a) }, press: t === 0 ? ["shoot"] : [] }), 5));
    });
    const blocked = runLiveGame(basketballLive, 2, (t) => ({ values: { angle: 25, speed: 9 }, press: t === 0 ? ["shoot"] : [] }), 5);
    expect(blocked.state.lastResult).toMatch(/Blocked/);
  });
});

describe("live game page", () => {
  const renderLive = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<LiveGameRoute />} path="/worlds/:worldId/:gameId/live" />
        </Routes>
      </MemoryRouter>,
    );

  it("renders levels, controls, keyboard help and a link back to the classic game", () => {
    renderLive("/worlds/astronomy/moon-landing/live");
    expect(screen.getByRole("heading", { level: 1, name: "Moon Landing Live" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Thrust \(hold · Space\)/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /classic round-based version/ }).getAttribute("href")).toBe("/worlds/astronomy/moon-landing");
    fireEvent.click(screen.getByRole("button", { name: /2\. Low fuel/ }));
    expect(screen.getByRole("heading", { level: 2, name: "Low fuel" })).toBeTruthy();
    expect(screen.getByText(/Ready\. Press Start/)).toBeTruthy();
  });

  it("starts with an action and updates live sliders", () => {
    renderLive("/worlds/mechanics/projectile-master/live");
    fireEvent.change(screen.getByRole("slider", { name: "Launch speed" }), { target: { value: "14" } });
    expect(screen.getByText("14.0 m/s")).toBeTruthy();
    expect(screen.getByText(/PREDICTED RANGE/).parentElement?.textContent).toMatch(/20\.0 m/);
  });

  it("shows not-found for a game without a live version or a wrong world", () => {
    renderLive("/worlds/mechanics/bridge-builder/live");
    expect(screen.queryByRole("heading", { name: /Live/ })).toBeNull();
  });
});
