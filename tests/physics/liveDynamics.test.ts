import { describe, expect, it } from "vitest";
import { ELECTRON_MASS, LUNAR_GRAVITY, STANDARD_GRAVITY } from "../../src/physics/core";
import { calculateDraft, calculateHeelAngle, calculateMetacentricHeight } from "../../src/physics/fluids";
import { advanceLander, advanceProjectile, launchProjectile } from "../../src/physics/mechanics";
import {
  DELAYED_DECAY_CONSTANT,
  DELAYED_NEUTRON_FRACTION,
  advancePointKinetics,
  calculateReactorPeriod,
  steadyKineticsState,
} from "../../src/physics/nuclear";
import { calculateTransitionEnergy, findAbsorption } from "../../src/physics/quantum";
import { advanceDampedPendulum, calculateSwingAmplitude, pushPendulum } from "../../src/physics/waves";

describe("projectile steps", () => {
  it("land at the analytic range v² sin 2θ / g", () => {
    let state = launchProjectile(0, 0, 20, 45);
    const dt = 1 / 120;
    let previous = state;
    while (state.y >= 0) {
      previous = state;
      state = advanceProjectile(state, dt);
    }
    const fraction = previous.y / (previous.y - state.y);
    const x = previous.x + fraction * (state.x - previous.x);
    // Interpolating between steps is approximate; the steps themselves are exact (below).
    expect(x).toBeCloseTo(400 / STANDARD_GRAVITY, 3);
  });

  it("is exact for constant gravity at every step", () => {
    let state = launchProjectile(0, 0, 20, 30);
    for (let i = 0; i < 100; i += 1) state = advanceProjectile(state, 0.01);
    const vy = 20 * Math.sin(Math.PI / 6);
    expect(state.y).toBeCloseTo(vy * 1 - 0.5 * STANDARD_GRAVITY, 9);
    expect(state.x).toBeCloseTo(20 * Math.cos(Math.PI / 6), 9);
  });
});

describe("lander steps", () => {
  const spec = { dryMassKilograms: 1500, maximumThrustNewtons: 9000, specificImpulseSeconds: 311 };
  it("free-falls exactly at lunar gravity and burns fuel at T/(Isp g₀)", () => {
    const fall = advanceLander({ altitude: 100, velocity: 0, fuelKg: 100 }, false, spec, LUNAR_GRAVITY, 2);
    expect(fall.altitude).toBeCloseTo(100 - 0.5 * LUNAR_GRAVITY * 4, 9);
    expect(fall.fuelKg).toBe(100);
    const burn = advanceLander({ altitude: 100, velocity: 0, fuelKg: 100 }, true, spec, LUNAR_GRAVITY, 1);
    expect(burn.fuelKg).toBeCloseTo(100 - 9000 / (311 * STANDARD_GRAVITY), 9);
    expect(burn.velocity).toBeGreaterThan(0);
  });

  it("matches the rocket equation over a long burn", () => {
    let state = { altitude: 0, velocity: 0, fuelKg: 300 };
    for (let i = 0; i < 1000; i += 1) {
      state = advanceLander(state, true, spec, 1e-9, 0.01);
    }
    const burned = 300 - state.fuelKg;
    const expected = 311 * STANDARD_GRAVITY * Math.log(1800 / (1800 - burned));
    expect(state.velocity / expected).toBeCloseTo(1, 6);
  });

  it("stops thrusting when the fuel runs out mid-step", () => {
    const state = advanceLander({ altitude: 50, velocity: 0, fuelKg: 0.5 }, true, spec, LUNAR_GRAVITY, 1);
    expect(state.fuelKg).toBe(0);
  });
});

describe("damped pendulum", () => {
  it("swings at 2π√(L/g) for small angles and keeps energy without damping", () => {
    let state = { angle: 0.02, angularVelocity: 0 };
    let t = 0;
    const dt = 0.001;
    let crossings = 0;
    let last = state.angle;
    while (crossings < 2) {
      state = advanceDampedPendulum(state, 2.5, 0, dt);
      t += dt;
      if (Math.sign(state.angle) !== Math.sign(last)) crossings += 1;
      last = state.angle;
    }
    expect(t).toBeCloseTo(2 * Math.PI * Math.sqrt(2.5 / STANDARD_GRAVITY) * 0.75, 1);
    expect(calculateSwingAmplitude(state, 2.5)).toBeCloseTo(0.02, 4);
  });

  it("gains amplitude when pushed with the motion and loses it when damped", () => {
    const moving = { angle: 0, angularVelocity: 0.3 };
    expect(calculateSwingAmplitude(pushPendulum(moving, 0.1), 2.5)).toBeGreaterThan(calculateSwingAmplitude(moving, 2.5));
    let state = { angle: 0.3, angularVelocity: 0 };
    for (let i = 0; i < 10_000; i += 1) state = advanceDampedPendulum(state, 2.5, 0.05, 0.001);
    expect(calculateSwingAmplitude(state, 2.5)).toBeLessThan(0.3);
  });
});

describe("point kinetics", () => {
  it("stays steady at ρ = 0 and grows with the stable period for small ρ", () => {
    let state = steadyKineticsState(1);
    for (let i = 0; i < 1000; i += 1) state = advancePointKinetics(state, 0, 0.005);
    expect(state.power).toBeCloseTo(1, 9);
    const rho = 0.001;
    state = steadyKineticsState(1);
    for (let i = 0; i < 6000; i += 1) state = advancePointKinetics(state, rho, 0.005);
    const p30 = state.power;
    for (let i = 0; i < 2000; i += 1) state = advancePointKinetics(state, rho, 0.005);
    const measuredPeriod = 10 / Math.log(state.power / p30);
    // The one-group period (β − ρ)/(λρ) neglects the prompt term, so agree within 5 %.
    expect(measuredPeriod / calculateReactorPeriod(rho, DELAYED_NEUTRON_FRACTION, DELAYED_DECAY_CONSTANT)).toBeCloseTo(1, 1);
  });

  it("shows the prompt jump when reactivity is added", () => {
    let state = steadyKineticsState(1);
    for (let i = 0; i < 100; i += 1) state = advancePointKinetics(state, 0.002, 0.001);
    // Prompt jump ≈ β/(β − ρ) = 1.44.
    expect(state.power).toBeGreaterThan(1.35);
    expect(state.power).toBeLessThan(1.6);
  });
});

describe("heel and absorption", () => {
  it("heels a barge by atan(m d / (Δ GM)) and capsizes it when GM ≤ 0", () => {
    const draft = calculateDraft(40_000, 20, 6, 1000);
    const gm = calculateMetacentricHeight(draft, 6, 1);
    expect(calculateHeelAngle(2000, 1, 40_000, gm)).toBeCloseTo((Math.atan(2000 / (40_000 * gm)) * 180) / Math.PI, 12);
    expect(calculateHeelAngle(2000, 1, 40_000, -0.1)).toBe(90);
  });

  it("absorbs Lyman-α (10.2 eV) from n = 1 and ionises above 13.6 eV", () => {
    const lymanAlpha = calculateTransitionEnergy(1, 2, 1);
    expect(findAbsorption(1, 1, lymanAlpha)).toBe(2);
    expect(findAbsorption(1, 1, lymanAlpha * 1.02)).toBeNull();
    expect(findAbsorption(1, 1, calculateTransitionEnergy(1, 3, 1))).toBe(3);
    expect(findAbsorption(1, 1, 14)).toBe("ionised");
    expect(findAbsorption(1, 2, calculateTransitionEnergy(1, 3, 2))).toBe(3);
    expect(ELECTRON_MASS).toBeGreaterThan(0);
  });
});
