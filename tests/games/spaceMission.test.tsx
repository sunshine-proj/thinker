import { describe, expect, it } from "vitest";
import { MISSION_ROUNDS, SPACE_MISSION_META, runMission, spaceMission, type MissionRound } from "../../src/features/games/space-mission/spaceMission";
import { SpaceMissionPage } from "../../src/features/games/space-mission/SpaceMissionPage";
import { STANDARD_GRAVITY as g } from "../../src/physics/core";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [boost, engine, staged] = MISSION_ROUNDS as [MissionRound, MissionRound, MissionRound];
const v1 = (prop: number) => ({ dry: 1000, isp: 320, propellant: prop });

describe("Space Mission (worked by hand)", () => {
  it("round 1: propellant = m₁(e^(Δv/(Iₛₚ g₀)) − 1) ≈ 1,601 kg", () => {
    const exact = 1000 * (Math.exp(3000 / (320 * g)) - 1);
    expect(exact).toBeCloseTo(1601, 0);
    const o = runMission(boost, v1(1600));
    expect(o.deltaV).toBeCloseTo(3000, -1);
    expect(o.success).toBe(true);
  });

  it("round 1: more propellant has diminishing returns", () => {
    const d = (p: number) => runMission(boost, v1(p)).deltaV;
    expect(d(2000) - d(1000)).toBeGreaterThan(d(3000) - d(2000));
    expect(runMission(boost, v1(800)).feedback).toMatch(/short of the target/);
    expect(runMission(boost, v1(3000)).feedback).toMatch(/overshoots/);
  });

  it("round 2: low-efficiency engines break the mass limit; a high-Iₛₚ engine works", () => {
    const attempt = (isp: number, propellant: number) => runMission(engine, { dry: 800, isp, propellant });
    // Isp 350 needs ~4,260 kg of propellant: total mass 5,460 kg.
    const heavy = attempt(350, 4200);
    expect(heavy.success).toBe(false);
    expect(heavy.feedback).toMatch(/short|exceeds/);
    const good = attempt(450, 3150);
    expect(good.success).toBe(true);
    expect(good.launchMassKilograms).toBeCloseTo(800 + 600 + 3150, 8);
  });

  it("round 3: Σ of two stage burns; staging beats a single stage of the same mass", () => {
    let best: ReturnType<typeof runMission> | null = null;
    for (let p1 = 500; p1 <= 4000; p1 += 10) {
      for (let p2 = 100; p2 <= 2000; p2 += 10) {
        const o = runMission(staged, { payload: 150, propellant1: p1, propellant2: p2 });
        if (o.success && (best === null || o.accuracyFraction > best.accuracyFraction)) best = o;
      }
    }
    expect(best).not.toBeNull();
    expect(best!.stages.reduce((s, x) => s + x.deltaV, 0)).toBeCloseTo(best!.deltaV, 8);
    expect(best!.launchMassKilograms).toBeLessThanOrEqual(5000);
  });

  it("round 3: specific known loading", () => {
    const o = runMission(staged, { payload: 150, propellant1: 3040, propellant2: 1000 });
    expect(o.launchMassKilograms).toBeCloseTo(4940, 8);
    expect(o.stages[0]!.deltaV).toBeCloseTo(280 * g * Math.log(4940 / 1900), 6);
  });

  it("validates controls", () => {
    expect(() => spaceMission.evaluate(boost, { dry: 1000, isp: 320, propellant: 99999 }, 1, 1)).toThrow(/between/);
    expect(MISSION_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});

describe("Space Mission page", () => {
  it("guards", () => {
    checkGuards(SpaceMissionPage, SPACE_MISSION_META, { sliders: { "Propellant mass": 800 }, prediction: 2000, feedback: /short of the target/ });
  });

  it("is solved round by round", async () => {
    await playThrough(SpaceMissionPage, SPACE_MISSION_META, [
      { sliders: { "Propellant mass": 1600 }, prediction: 3000 },
      { sliders: { "Engine specific impulse": 450, "Propellant mass": 3150 }, prediction: 5300 },
      { sliders: { "Stage 1 propellant": 3040, "Stage 2 propellant": 1000 }, prediction: 6900 },
    ]);
  });
});
