import { describe, expect, it } from "vitest";
import { STEAM_META, STEAM_ROUNDS, runSteam, type SteamRound } from "../../src/features/games/steam-engine/steamEngine";
import { SteamEnginePage } from "../../src/features/games/steam-engine/SteamEnginePage";
import { FRIDGE_META, FRIDGE_ROUNDS, runFridge, type FridgeRound } from "../../src/features/games/refrigerator-engineer/refrigeratorEngineer";
import { RefrigeratorEngineerPage } from "../../src/features/games/refrigerator-engineer/RefrigeratorEngineerPage";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [boiler, limits, secondLaw] = STEAM_ROUNDS as [SteamRound, SteamRound, SteamRound];
const [kitchen, freezer, efficient] = FRIDGE_ROUNDS as [FridgeRound, FridgeRound, FridgeRound];

describe("Steam Engine (worked by hand)", () => {
  it("round 1: η_C = 1/3 needs T_h = 454.7 K = 181.5 °C", () => {
    const o = runSteam(boiler, { hot: 182, cold: 30, heat: 100 });
    expect(o.engine.workWatts / 1000).toBeCloseTo(20.04, 1);
    expect(o.success).toBe(true);
    expect(o.predictionActual).toBeCloseTo(20.04, 1);
    expect(runSteam(boiler, { hot: 150, cold: 30, heat: 100 }).feedback).toMatch(/short of/);
    expect(runSteam(boiler, { hot: 300, cold: 30, heat: 100 }).feedback).toMatch(/above/);
  });

  it("never beats the Carnot limit and always produces entropy", () => {
    for (const hot of [120, 200, 300, 400]) {
      const o = runSteam(boiler, { hot, cold: 30, heat: 100 });
      expect(o.engine.efficiency).toBeLessThan(o.engine.carnotEfficiency);
      expect(o.engine.entropyProductionWattsPerKelvin).toBeGreaterThan(0);
    }
  });

  it("round 2: 300 °C needs about 124 kW of fuel, and the limits are enforced", () => {
    expect(runSteam(limits, { hot: 300, cold: 30, heat: 124 }).success).toBe(true);
    expect(runSteam(limits, { hot: 350, cold: 30, heat: 110 }).feedback).toMatch(/exceeds the 300 °C material limit/);
    expect(runSteam(limits, { hot: 200, cold: 30, heat: 180 }).feedback).toMatch(/rejected, above the 100 kW/);
  });

  it("round 3: a line of boiler and condenser temperatures with T_c/T_h = 5/9", () => {
    expect(runSteam(secondLaw, { hot: 291, cold: 40, heat: 90 }).success).toBe(true);
    expect(runSteam(secondLaw, { hot: 327, cold: 60, heat: 90 }).success).toBe(true);
    expect(runSteam(secondLaw, { hot: 360, cold: 80, heat: 90 }).feedback).toMatch(/exceeds the 350/);
    expect(runSteam(secondLaw, { hot: 291, cold: 25, heat: 90 }).feedback).toMatch(/cannot be colder than 40/);
  });
});

describe("Refrigerator Engineer (worked by hand)", () => {
  it("round 1: about 8 W holds 4 °C", () => {
    const o = runFridge(kitchen, { power: 8, leak: 2, quality: 0.4 });
    expect(o.coldCelsius).toBeCloseTo(3.96, 1);
    expect(o.success).toBe(true);
    expect(o.state.coolingWatts).toBeCloseTo(2 * (25 - o.coldCelsius), 6);
    expect(runFridge(kitchen, { power: 3, leak: 2, quality: 0.4 }).feedback).toMatch(/too warm/);
    expect(runFridge(kitchen, { power: 20, leak: 2, quality: 0.4 }).feedback).toMatch(/too cold/);
  });

  it("the COP is lower when the gap is bigger (a freezer needs more work per watt of cooling)", () => {
    const fridge = runFridge(kitchen, { power: 8, leak: 2, quality: 0.4 });
    const frozen = runFridge(freezer, { power: 27, thickness: 6, quality: 0.4 });
    expect(frozen.state.cop).toBeLessThan(fridge.state.cop);
  });

  it("round 2: thicker insulation lowers the leak and the power needed", () => {
    expect(runFridge(freezer, { power: 27, thickness: 6, quality: 0.4 }).leakWattsPerKelvin).toBeCloseTo(1.5, 8);
    expect(runFridge(freezer, { power: 27, thickness: 6, quality: 0.4 }).success).toBe(true);
    expect(runFridge(freezer, { power: 50, thickness: 6, quality: 0.4 }).feedback).toMatch(/above the 40 W limit|too cold/);
    expect(runFridge(freezer, { power: 27, thickness: 3, quality: 0.4 }).success).toBe(false);
  });

  it("round 3: good insulation and a good compressor meet the 5 W limit", () => {
    expect(runFridge(efficient, { power: 3.7, thickness: 10, quality: 0.6 }).success).toBe(true);
    const poor = runFridge(efficient, { power: 5, thickness: 4, quality: 0.4 });
    expect(poor.success).toBe(false);
    expect(poor.feedback).toMatch(/too warm/);
  });
});

describe("pages", () => {
  it("Steam Engine guards", () => {
    checkGuards(SteamEnginePage, STEAM_META, { sliders: { "Boiler temperature": 150 }, prediction: 15, feedback: /short of/ });
  });
  it("Steam Engine is solved round by round", async () => {
    await playThrough(SteamEnginePage, STEAM_META, [
      { sliders: { "Boiler temperature": 182 }, prediction: 20 },
      { sliders: { "Boiler temperature": 300, "Fuel heat rate": 124 }, prediction: 28 },
      { sliders: { "Boiler temperature": 291, "Condenser temperature": 40 }, prediction: 33 },
    ]);
  });
  it("Refrigerator guards", () => {
    checkGuards(RefrigeratorEngineerPage, FRIDGE_META, { sliders: { "Compressor power": 3 }, prediction: 5, feedback: /too warm/ });
  });
  it("Refrigerator is solved round by round", async () => {
    await playThrough(RefrigeratorEngineerPage, FRIDGE_META, [
      { sliders: { "Compressor power": 8 }, prediction: 5 },
      { sliders: { "Compressor power": 27, "Insulation thickness": 6 }, prediction: 2.4 },
      { sliders: { "Compressor power": 3.7, "Insulation thickness": 10, "Compressor quality": 0.6 }, prediction: 6.4 },
    ]);
  });
});
