import { describe, expect, it } from "vitest";
import { STANDARD_GRAVITY as G } from "../../src/physics/core";
import {
  TENNIS_BALL, calculateAverageCrashForce, calculateBallTerminalSpeed, calculateBrakingGForce, calculateCentripetalAcceleration,
  calculateCrashGForce, calculateCriticalAngle, calculateDistanceForIlluminance, calculateElevatorReading, calculateExactPendulumPeriod,
  calculateFallTime, calculateFreeFallSpeed, calculateFriction, calculateHeightAtDistance, calculateIlluminance, calculateImpactSpeed,
  calculateImpulseForce, calculateInelasticVelocity, calculateKineticEnergyLoss, calculateLaunchAngles, calculateLaunchSpeed,
  calculatePendulumPeriod, calculatePeriodForAcceleration, calculateReboundHeight, calculateRestitution, calculateRotationAngleDegrees,
  calculateRotorMinimumAngularSpeed, calculateSlideTime, calculateSmallAngleSwing, calculateStoppingDistanceForGForce, calculateStoppingTime,
  calculateTiltFromReading, calculateTiltedAccelerometerReading, calculateVerticalVelocityAtDistance, calculateWallGForce, simulateBallFlight, SURFACES,
  rpmToRadiansPerSecond,
} from "../../src/physics/mechanics";
import { SURFACE_BODIES, findSurfaceBody } from "../../src/physics/astronomy";
import { EARTH_FIELD_TESLA, calculateLongSolenoidField, calculateWireDistanceForField, calculateWireField } from "../../src/physics/electromagnetism";
import { calculateIcedDrink, calculateKettleTime } from "../../src/physics/thermodynamics";


describe("basketball", () => {
  it("makes a free throw at 7.18 m/s and 52°: it passes the rim while descending", () => {
    const v = calculateLaunchSpeed(52, 2.1, 4.2, 3.05);
    expect(v).toBeCloseTo(7.18, 2);
    expect(calculateHeightAtDistance(v, 52, 2.1, 4.2)).toBeCloseTo(3.05, 8);
    expect(calculateVerticalVelocityAtDistance(v, 52, 4.2)).toBeLessThan(-3);
  });
  it("finds two launch angles for a given speed that both reach the rim", () => {
    const [low, high] = calculateLaunchAngles(7.5, 2.1, 4.2, 3.05) as [number, number];
    expect(low).toBeLessThan(high);
    for (const angle of [low, high]) {
      expect(calculateHeightAtDistance(7.5, angle, 2.1, 4.2)).toBeCloseTo(3.05, 8);
    }
    expect(calculateLaunchAngles(3, 2.1, 4.2, 3.05)).toEqual([]);
  });
  it("bounces to e²h and recovers e from the heights", () => {
    expect(calculateReboundHeight(1.8, 0.8165)).toBeCloseTo(1.2, 2);
    expect(calculateRestitution(1.8, 1.2)).toBeCloseTo(0.8165, 4);
    expect(() => calculateRestitution(1, 2)).toThrow(RangeError);
    expect(() => calculateReboundHeight(1, 1.2)).toThrow(RangeError);
    expect(() => calculateLaunchSpeed(10, 2, 4, 30)).toThrow(RangeError);
  });
});

describe("ball flight with drag", () => {
  const launch = { speed: 40, angleDegrees: 20, height: 0 };
  it("matches the analytic range without drag", () => {
    const flight = simulateBallFlight(TENNIS_BALL, launch, false);
    expect(flight.range).toBeCloseTo((40 ** 2 * Math.sin((40 * Math.PI) / 180)) / G, 1);
    expect(flight.landingSpeed).toBeCloseTo(40, 2);
  });
  it("is shorter and slower with drag, and a heavier ball loses less", () => {
    const free = simulateBallFlight(TENNIS_BALL, launch, false);
    const drag = simulateBallFlight(TENNIS_BALL, launch, true);
    expect(drag.range).toBeLessThan(free.range * 0.75);
    expect(drag.landingSpeed).toBeLessThan(40);
    const heavy = simulateBallFlight({ ...TENNIS_BALL, massKg: 0.5 }, launch, true);
    expect(heavy.range).toBeGreaterThan(drag.range);
  });
  it("converges as the step shrinks", () => {
    const coarse = simulateBallFlight(TENNIS_BALL, launch, true, 0.004).range;
    const fine = simulateBallFlight(TENNIS_BALL, launch, true, 0.0005).range;
    expect(Math.abs(coarse - fine)).toBeLessThan(1e-3);
  });
  it("has a terminal speed near 21.7 m/s for a tennis ball", () => {
    expect(calculateBallTerminalSpeed(TENNIS_BALL)).toBeCloseTo(21.7, 1);
    const fall = simulateBallFlight(TENNIS_BALL, { speed: 0.001, angleDegrees: 90, height: 2000 }, true, 0.005);
    expect(fall.landingSpeed).toBeCloseTo(calculateBallTerminalSpeed(TENNIS_BALL), 1);
  });
});

describe("kitchen physics", () => {
  it("heats 2 kg of water from 20 to 100 °C in 7 minutes on a 2 kW, 80 % hob", () => {
    expect(calculateKettleTime(2, 20, 100, 2000, 0.8) / 60).toBeCloseTo(6.98, 2);
    expect(() => calculateKettleTime(2, 100, 20, 2000, 0.8)).toThrow(RangeError);
  });
  it("cools a drink: two 20 g ice cubes take 250 g of water from 25 to 10.5 °C", () => {
    expect(calculateIcedDrink(0.25, 25, 0.04).finalCelsius).toBeCloseTo(10.55, 1);
    expect(calculateIcedDrink(0.25, 25, 0.04).iceLeftKg).toBe(0);
    const much = calculateIcedDrink(0.25, 25, 0.2);
    expect(much.finalCelsius).toBe(0);
    expect(much.iceLeftKg).toBeGreaterThan(0.1);
    expect(calculateIcedDrink(0.25, 25, 0).finalCelsius).toBe(25);
  });
});

describe("car safety", () => {
  it("gives F = mv²/2s and a g-force v²/(2sg)", () => {
    expect(calculateAverageCrashForce(1200, 15, 0.574) / 1000).toBeCloseTo(235, 0);
    expect(calculateCrashGForce(15, 0.574)).toBeCloseTo(20, 1);
    expect(calculateStoppingDistanceForGForce(15, 20)).toBeCloseTo(0.5736, 3);
    expect(calculateAverageCrashForce(1200, 15, 1.148)).toBeCloseTo(calculateAverageCrashForce(1200, 15, 0.574) / 2, -2);
    expect(calculateStoppingTime(15, 0.574)).toBeCloseTo(0.0765, 3);
  });
  it("gives the impulse force m Δv/Δt: 70 kg stopped from 15 m/s in 0.105 s is 10 kN", () => {
    expect(calculateImpulseForce(70, 15, 0.105)).toBeCloseTo(10_000, -1);
  });
  it("conserves momentum in a sticking collision and loses kinetic energy", () => {
    expect(calculateInelasticVelocity(1500, 20, 1000, -15)).toBeCloseTo(6, 10);
    expect(calculateInelasticVelocity(1500, 20, 1000, -30)).toBeCloseTo(0, 10);
    expect(calculateKineticEnergyLoss(1500, 20, 1000, -30)).toBeCloseTo(0.5 * 1500 * 400 + 0.5 * 1000 * 900, 4);
    expect(calculateKineticEnergyLoss(1000, 5, 1000, 5)).toBeCloseTo(0, 8);
  });
});

describe("phone sensors", () => {
  it("reads g sinθ when tilted and recovers θ", () => {
    expect(calculateTiltedAccelerometerReading(30)).toBeCloseTo(4.903, 3);
    expect(calculateTiltFromReading(4.9)).toBeCloseTo(29.99, 1);
    expect(() => calculateTiltFromReading(12)).toThrow(RangeError);
  });
  it("reads g + a in an elevator and zero in free fall", () => {
    expect(calculateElevatorReading(2.2)).toBeCloseTo(12.0, 1);
    expect(calculateElevatorReading(-G)).toBeCloseTo(0, 12);
  });
  it("integrates the gyroscope rate: 90°/s for 2 s is 180°", () => {
    expect(calculateRotationAngleDegrees(90, 2)).toBe(180);
    expect(() => calculateRotationAngleDegrees(90, -1)).toThrow(RangeError);
  });
  it("follows the inverse-square law for light: 400 lx at 1 m is 100 lx at 2 m, and falls with cos of the angle", () => {
    expect(calculateIlluminance(400, 2)).toBeCloseTo(100, 10);
    expect(calculateIlluminance(400, 1, 60)).toBeCloseTo(200, 8);
    expect(calculateDistanceForIlluminance(400, 100)).toBeCloseTo(2, 10);
    expect(() => calculateIlluminance(400, 1, 90)).toThrow(RangeError);
  });
});

describe("amusement park circular motion", () => {
  it("gives 0.5 g for riders 5 m out with a 6.35 s period", () => {
    const period = calculatePeriodForAcceleration(5, 0.5 * G);
    expect(period).toBeCloseTo(6.345, 2);
    expect(calculateCentripetalAcceleration(5, period)).toBeCloseTo(0.5 * G, 10);
  });
  it("brakes a drop tower: 40 m of free fall braked over 20 m gives 3 g", () => {
    expect(calculateFreeFallSpeed(40)).toBeCloseTo(28.01, 2);
    expect(calculateBrakingGForce(calculateFreeFallSpeed(40), 20)).toBeCloseTo(3, 10);
  });
  it("keeps riders on the Rotor above ω = √(g/μr): 29.9 rpm for μ = 0.4, r = 2.5 m", () => {
    const omega = calculateRotorMinimumAngularSpeed(2.5, 0.4);
    expect(omega).toBeCloseTo(3.1316, 3);
    expect((omega * 60) / (2 * Math.PI)).toBeCloseTo(29.9, 1);
    expect(calculateWallGForce(2.5, omega)).toBeCloseTo(2.5, 6);
    expect(rpmToRadiansPerSecond(60)).toBeCloseTo(2 * Math.PI, 12);
  });
});

describe("friction", () => {
  const wood = SURFACES.find((s) => s.id === "wood-wood")!;
  const ice = SURFACES.find((s) => s.id === "ice-ice")!;
  it("holds a block with static friction up to μ_s N", () => {
    const f = calculateFriction(wood, 10, 0, 40);
    expect(f.normalForce).toBeCloseTo(98.07, 2);
    expect(f.maximumStaticFriction).toBeCloseTo(49.03, 2);
    expect(f.moving).toBe(false);
    expect(f.frictionForce).toBeCloseTo(40, 10);
  });
  it("slides with kinetic friction and acceleration (F − μ_k N)/m once the limit is passed", () => {
    const f = calculateFriction(wood, 10, 0, 60);
    expect(f.moving).toBe(true);
    expect(f.frictionForce).toBeCloseTo(29.42, 2);
    expect(f.acceleration).toBeCloseTo((60 - 29.42) / 10, 2);
  });
  it("begins to slip down a slope at atan(μ_s)", () => {
    expect(calculateCriticalAngle(wood)).toBeCloseTo(26.57, 1);
    expect(calculateFriction(wood, 5, 26, 0).moving).toBe(false);
    const slip = calculateFriction(wood, 5, 28, 0);
    expect(slip.moving).toBe(true);
    expect(slip.acceleration).toBeLessThan(0);
    expect(slip.acceleration).toBeCloseTo(-G * (Math.sin((28 * Math.PI) / 180) - 0.3 * Math.cos((28 * Math.PI) / 180)), 6);
    expect(calculateFriction(ice, 5, 10, 0).moving).toBe(true);
  });
  it("moves up the slope when pushed hard enough", () => {
    expect(calculateFriction(wood, 10, 20, 200).acceleration).toBeGreaterThan(0);
    expect(calculateSlideTime(2, 4)).toBeCloseTo(Math.sqrt(1), 10);
    expect(() => calculateFriction(wood, 0, 0, 0)).toThrow(RangeError);
    expect(() => calculateFriction(wood, 1, 90, 0)).toThrow(RangeError);
  });
});

describe("gravity and the pendulum", () => {
  it("falls 20 m in 2.02 s on Earth and 4.97 s on the Moon, hitting at 19.8 and 8.05 m/s", () => {
    expect(calculateFallTime(20, G)).toBeCloseTo(2.0196, 3);
    expect(calculateFallTime(20, 1.62)).toBeCloseTo(4.969, 3);
    expect(calculateImpactSpeed(20, G)).toBeCloseTo(19.806, 2);
    expect(calculateImpactSpeed(20, 1.62)).toBeCloseTo(8.05, 2);
  });
  it("swings a 1 m pendulum in 2.006 s on Earth, slower by √(g ratio) on the Moon", () => {
    expect(calculatePendulumPeriod(1, G)).toBeCloseTo(2.006, 3);
    expect(calculatePendulumPeriod(1, 1.62) / calculatePendulumPeriod(1, G)).toBeCloseTo(Math.sqrt(G / 1.62), 10);
  });
  it("lengthens the period at large amplitude: +1.7 % at 20°, +7.4 % at 40°", () => {
    const t0 = calculatePendulumPeriod(1, G);
    expect(calculateExactPendulumPeriod(1, G, 0.5) / t0).toBeCloseTo(1, 4);
    expect(calculateExactPendulumPeriod(1, G, 20) / t0).toBeCloseTo(1.0077, 3);
    expect(calculateExactPendulumPeriod(1, G, 40) / t0).toBeCloseTo(1.0317, 3);
    expect(calculateExactPendulumPeriod(1, G, 90) / t0).toBeCloseTo(1.1803, 3);
    expect(() => calculateExactPendulumPeriod(1, G, 180)).toThrow(RangeError);
  });
  it("swings back to the release angle after one period", () => {
    const t = calculatePendulumPeriod(1, G);
    expect(calculateSmallAngleSwing(1, G, 10, 0)).toBe(10);
    expect(calculateSmallAngleSwing(1, G, 10, t)).toBeCloseTo(10, 8);
    expect(calculateSmallAngleSwing(1, G, 10, t / 4)).toBeCloseTo(0, 8);
  });
  it("lists the bodies with their surface gravity", () => {
    expect(SURFACE_BODIES.length).toBeGreaterThanOrEqual(6);
    expect(findSurfaceBody("mars").surfaceGravity).toBe(3.71);
    expect(() => findSurfaceBody("pluto")).toThrow(RangeError);
  });
});

describe("magnetic fields of wires and solenoids", () => {
  it("gives 2 µT at 10 cm from a 1 A wire and falls as 1/r", () => {
    expect(calculateWireField(1, 0.1) * 1e6).toBeCloseTo(2, 3);
    expect(calculateWireField(1, 0.2) / calculateWireField(1, 0.1)).toBeCloseTo(0.5, 12);
    expect(calculateWireField(10, 0.1) / calculateWireField(1, 0.1)).toBeCloseTo(10, 12);
  });
  it("reaches Earth's field 50 µT at 4 cm from a 10 A wire", () => {
    expect(calculateWireDistanceForField(10, EARTH_FIELD_TESLA)).toBeCloseTo(0.04, 4);
  });
  it("gives μ₀nI inside a solenoid: 12.6 mT for 1000 turns/m and 10 A, 100 times more with iron of μ_r = 100", () => {
    expect(calculateLongSolenoidField(1000, 10) * 1000).toBeCloseTo(12.566, 2);
    expect(calculateLongSolenoidField(1000, 10, 100) / calculateLongSolenoidField(1000, 10)).toBeCloseTo(100, 10);
    expect(() => calculateLongSolenoidField(0, 1)).toThrow(RangeError);
    expect(() => calculateWireField(1, 0)).toThrow(RangeError);
  });
});
