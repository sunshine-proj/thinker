import { describe, expect, it } from "vitest";
import {
  HEAT_TO_BOIL,
  POT_BASE_AREA,
  baseTemperatureDrop,
  meltingHeatOfCubes,
  waterTemperatureAfter,
} from "../../src/features/games/kitchen-scientist/kitchenScientist";

describe("Kitchen Scientist model helpers", () => {
  it("needs Q = m c ΔT = 2 × 4186 × 80 J to boil the water", () => {
    expect(HEAT_TO_BOIL).toBeCloseTo(2 * 4186 * 80, 6);
  });

  it("warms the water linearly at 1.6 kW and stops at boiling", () => {
    expect(waterTemperatureAfter(0)).toBe(20);
    expect(waterTemperatureAfter(1)).toBeCloseTo(20 + (1600 * 60) / (2 * 4186), 9);
    expect(waterTemperatureAfter(60)).toBe(100);
  });

  it("uses L = 334 kJ/kg for melting 20 g cubes", () => {
    expect(meltingHeatOfCubes(3)).toBeCloseTo(3 * 0.02 * 334_000, 6);
  });

  it("gives Fourier's law ΔT = P d / (k A) for a 20 cm aluminium base", () => {
    expect(POT_BASE_AREA).toBeCloseTo(Math.PI * 0.01, 12);
    expect(baseTemperatureDrop(10)).toBeCloseTo((1500 * 0.01) / (237 * Math.PI * 0.01), 12);
  });
});
