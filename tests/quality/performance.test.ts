import { describe, expect, it } from "vitest";
import { LABS } from "../../src/features/experiments/labs";
import { defaultLabValues } from "../../src/features/experiments/labs/labTypes";
import { runSystem, SYSTEM_ROUNDS } from "../../src/features/games/solar-system-builder/solarSystemBuilder";
import { runTennis, TENNIS_ROUNDS } from "../../src/features/games/tennis-physics/tennisPhysics";
import { runFrequency, FREQUENCY_ROUNDS } from "../../src/features/games/frequency-detective/frequencyDetective";
import { runWave, WAVE_ROUNDS } from "../../src/features/games/wave-simulator/waveSimulator";
import { integrateOrbit } from "../../src/physics/astronomy";
import { EARTH_GRAVITATIONAL_PARAMETER as MU, EARTH_MEAN_RADIUS as R, Vector2 } from "../../src/physics/core";

/** Wall-clock milliseconds of the slowest of a few runs. Budgets are about 10x the typical time to stay stable on slow CI. */
function slowest(run: () => unknown, repeats = 3): number {
  let worst = 0;
  for (let i = 0; i < repeats; i += 1) {
    const start = performance.now();
    run();
    worst = Math.max(worst, performance.now() - start);
  }
  return worst;
}

describe("simulation cost stays small enough for phones", () => {
  it("evaluates every lab setting in a few milliseconds, so sliders respond immediately", () => {
    for (const lab of LABS) {
      expect(slowest(() => lab.run(defaultLabValues(lab))), lab.id).toBeLessThan(150);
    }
  });

  it("runs the heaviest game models well inside one second", () => {
    expect(slowest(() => runSystem(SYSTEM_ROUNDS[2]!, { star: 1, distance: 1, speed: 39.4 })), "N-body comet").toBeLessThan(500);
    expect(slowest(() => runTennis(TENNIS_ROUNDS[0]!, { angle: -6, speed: 56.7 })), "tennis drag").toBeLessThan(250);
    expect(slowest(() => runFrequency(FREQUENCY_ROUNDS[2]!, { rate: 2048, duration: 0.6 })), "FFT").toBeLessThan(250);
    expect(slowest(() => runWave(WAVE_ROUNDS[0]!, { speed: 12 })), "wave equation").toBeLessThan(250);
  });

  it("bounds the orbit integrator so a bad setting cannot hang the page", () => {
    const start = performance.now();
    const result = integrateOrbit(MU, { position: new Vector2(R + 2e5, 0), velocity: new Vector2(0, 1_000) }, 1e9, { collisionRadius: R, maximumSteps: 50_000 });
    expect(performance.now() - start).toBeLessThan(1000);
    expect(["collision", "step-limit", "duration"]).toContain(result.stoppedBy);
  });
});
