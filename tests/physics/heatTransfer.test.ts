import { describe, expect, it } from "vitest";
import {
  calculateConductionPower,
  calculateRoomTemperature,
  calculateSteadyStateTemperature,
  calculateThermalConductance,
  calculateTimeConstant,
  calculateTimeToReach,
  type RoomHeating,
} from "../../src/physics/thermodynamics";

const room: RoomHeating = {
  outsideTemperatureCelsius: -5,
  heaterPowerWatts: 400,
  conductanceWattsPerKelvin: 16,
  heatCapacityJoulesPerKelvin: 2e5,
  initialTemperatureCelsius: 5,
};

describe("conduction", () => {
  it("follows Q = k A ΔT / d (textbook: 1 m² of 0.04 W/mK wool, 10 cm, 25 K → 10 W)", () => {
    expect(calculateConductionPower(0.04, 1, 0.1, 25)).toBeCloseTo(10, 10);
  });

  it("doubles when the area doubles and halves when the thickness doubles", () => {
    const base = calculateConductionPower(0.04, 10, 0.1, 20);
    expect(calculateConductionPower(0.04, 20, 0.1, 20)).toBeCloseTo(2 * base, 10);
    expect(calculateConductionPower(0.04, 10, 0.2, 20)).toBeCloseTo(base / 2, 10);
  });

  it("gives conductance U = kA/d and reverses sign with the temperature difference", () => {
    expect(calculateThermalConductance(0.04, 40, 0.1)).toBeCloseTo(16, 10);
    expect(calculateConductionPower(0.04, 1, 0.1, -10)).toBeLessThan(0);
  });

  it("rejects non-physical values", () => {
    expect(() => calculateConductionPower(0, 1, 0.1, 5)).toThrow(RangeError);
    expect(() => calculateConductionPower(0.04, 1, 0, 5)).toThrow(RangeError);
  });
});

describe("room heating", () => {
  it("settles where heater power equals the heat lost: P = U (T − T_out)", () => {
    const steady = calculateSteadyStateTemperature(room);
    expect(steady).toBeCloseTo(20, 10);
    expect(room.conductanceWattsPerKelvin * (steady - room.outsideTemperatureCelsius)).toBeCloseTo(
      room.heaterPowerWatts,
      10,
    );
  });

  it("stays at the outside temperature with no heater", () => {
    expect(calculateSteadyStateTemperature({ ...room, heaterPowerWatts: 0 })).toBe(-5);
  });

  it("covers 63.2% of the gap in one time constant", () => {
    const tau = calculateTimeConstant(room);
    const t = calculateRoomTemperature(room, tau);
    expect((t - 5) / (20 - 5)).toBeCloseTo(1 - Math.exp(-1), 10);
  });

  it("starts at the initial temperature and approaches the steady state", () => {
    expect(calculateRoomTemperature(room, 0)).toBe(5);
    expect(calculateRoomTemperature(room, 1e7)).toBeCloseTo(20, 8);
  });

  it("matches a fine numerical integration of C dT/dt = P − U (T − T_out)", () => {
    let temperature = room.initialTemperatureCelsius;
    const dt = 1;
    for (let t = 0; t < 20_000; t += dt) {
      const rate = (room.heaterPowerWatts - room.conductanceWattsPerKelvin * (temperature - room.outsideTemperatureCelsius)) / room.heatCapacityJoulesPerKelvin;
      temperature += rate * dt;
    }
    expect(temperature).toBeCloseTo(calculateRoomTemperature(room, 20_000), 3);
  });

  it("cools toward the steady state when starting warmer", () => {
    const warm = { ...room, initialTemperatureCelsius: 30 };
    expect(calculateRoomTemperature(warm, 3000)).toBeLessThan(30);
    expect(calculateRoomTemperature(warm, 3000)).toBeGreaterThan(20);
  });

  it("round-trips: the time to reach a temperature gives back that temperature", () => {
    const t = calculateTimeToReach(room, 18) as number;
    expect(calculateRoomTemperature(room, t)).toBeCloseTo(18, 8);
  });

  it("never reaches a temperature beyond the steady state or on the wrong side", () => {
    expect(calculateTimeToReach(room, 25)).toBeNull();
    expect(calculateTimeToReach(room, 20)).toBeNull();
    expect(calculateTimeToReach(room, 0)).toBeNull();
    expect(calculateTimeToReach(room, 5)).toBe(0);
  });

  it("validates inputs", () => {
    expect(() => calculateSteadyStateTemperature({ ...room, conductanceWattsPerKelvin: 0 })).toThrow(RangeError);
    expect(() => calculateSteadyStateTemperature({ ...room, heaterPowerWatts: -1 })).toThrow(RangeError);
    expect(() => calculateRoomTemperature(room, -1)).toThrow(RangeError);
  });
});
