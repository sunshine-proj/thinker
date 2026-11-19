import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { createGameLifecycle, transitionGameLifecycle } from "../../src/game-engine/core/GameLifecycle";
import { evaluateBridge } from "../../src/features/games/bridge-builder/bridgeBuilderModel";
import { BRIDGE_ROUNDS } from "../../src/features/games/bridge-builder/bridgeBuilderData";
import { DAM_ROUNDS, runDam } from "../../src/features/games/dam-engineer/damEngineer";
import { evaluateLanding } from "../../src/features/games/moon-landing/moonLandingModel";
import { LANDING_ROUNDS, MOON_LANDING_META } from "../../src/features/games/moon-landing/moonLandingData";
import { MoonLandingPage } from "../../src/features/games/moon-landing/MoonLandingPage";
import { REACTOR_ROUNDS, runReactor } from "../../src/features/games/reactor-operator/reactorOperator";
import { SHIP_ROUNDS, runShip } from "../../src/features/games/ship-designer/shipDesigner";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

describe("FAILED lifecycle state", () => {
  it("goes playing → failed → playing on retry, and resets from failed", () => {
    const playing = transitionGameLifecycle(createGameLifecycle(), "start");
    const failed = transitionGameLifecycle(playing, "fail");
    expect(failed.status).toBe("failed");
    expect(transitionGameLifecycle(failed, "retry").status).toBe("playing");
    expect(transitionGameLifecycle(failed, "reset").status).toBe("ready");
    expect(() => transitionGameLifecycle(failed, "pause")).toThrow();
    expect(() => transitionGameLifecycle(createGameLifecycle(), "fail")).toThrow();
  });
});

describe("physically catastrophic outcomes", () => {
  it("flag crashes, collapses, overturning, capsizing, sinking and prompt criticality", () => {
    const round = LANDING_ROUNDS[0]!;
    expect(evaluateLanding(round, { ignitionAltitudeMeters: round.ignition.minimum, throttle: 1 }).catastrophe?.title).toBe("Crash landing");
    const bridge = BRIDGE_ROUNDS[0]!;
    const weak = evaluateBridge(bridge, { material: "wood", heightMeters: bridge.minimumHeightMeters });
    expect(weak.catastrophe?.title).toBe("The bridge collapsed");
    const dam = DAM_ROUNDS[0]!;
    const thin = runDam(dam, Object.fromEntries(dam.controls.map((c) => [c.key, c.minimum])));
    expect(thin.safetyFactor < 1 ? thin.catastrophe?.title : "The dam tipped over").toBe("The dam tipped over");
    const stability = SHIP_ROUNDS.find((r) => r.kind === "stability")!;
    expect(runShip(stability, { density: 1025, beam: 3 }).catastrophe?.title).toBe("The barge capsized");
    expect(runReactor(REACTOR_ROUNDS[2]!, { k: 1.008 }).catastrophe?.title).toMatch(/prompt critical/);
    expect(runReactor(REACTOR_ROUNDS[2]!, { k: 1.0025 }).catastrophe).toBeUndefined();
  });

  it("locks the round after a crash until the learner retries", () => {
    render(<MemoryRouter><MoonLandingPage /></MemoryRouter>);
    startGame();
    setSlider("Ignition altitude", LANDING_ROUNDS[0]!.ignition.minimum);
    setPrediction("10");
    press(MOON_LANDING_META.submitLabel);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/Crash landing/);
    expect(alert.textContent).toMatch(/½mv²/);
    expect((screen.getByRole("button", { name: MOON_LANDING_META.submitLabel }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Retry this round" }));
    expect(screen.queryByText("Crash landing")).toBeNull();
    expect((screen.getByRole("button", { name: MOON_LANDING_META.submitLabel }) as HTMLButtonElement).disabled).toBe(false);
  });
});
