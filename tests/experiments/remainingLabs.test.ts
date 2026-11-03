import { describe, expect, it } from "vitest";
import { findCatalogEntry } from "../../src/data/games/gameCatalog";
import { LABS, heatTransferLab, lensFocalLab, orbitalMotionLab, waveInterferenceLab } from "../../src/features/experiments/labs";
import { defaultLabValues, parseLabValues } from "../../src/features/experiments/labs/labTypes";
import { CONDUCTORS, CONVECTION_MEDIA, calculateConvectionPower, calculateRadiationPower, compareHeatTransfer } from "../../src/physics/thermodynamics";

const m = (lab: (typeof LABS)[number], values: Record<string, number | string>, id: string) => lab.run(values).measurements.find((x) => x.id === id)?.value;

describe("heat transfer physics", () => {
  it("conducts kAΔT/d: 0.5 m² of 1 cm glass with 80 K across it carries 4 kW", () => {
    const p = compareHeatTransfer({ conductivity: 1, thicknessMeters: 0.01, coefficient: 10, emissivity: 0.9, areaSquareMeters: 0.5, hotCelsius: 100, coldCelsius: 20 });
    expect(p.conduction).toBeCloseTo(4000, 6);
    expect(p.convection).toBeCloseTo(400, 6);
    expect(p.radiation).toBeCloseTo(306, 0);
  });
  it("radiates as T⁴: from 20 to 600 °C in the surroundings at 20 °C", () => {
    expect(calculateRadiationPower(1, 1, 20, 20)).toBeCloseTo(0, 8);
    expect(calculateRadiationPower(1, 1, 100, 0) / 1000).toBeCloseTo(0.8, 0);
    const a = calculateRadiationPower(1, 1, 727, 0);
    const b = calculateRadiationPower(1, 1, 227, 0);
    expect(a / b).toBeCloseTo((1000.15 ** 4 - 273.15 ** 4) / (500.15 ** 4 - 273.15 ** 4), 6);
    expect(calculateRadiationPower(0.5, 1, 300, 20)).toBeCloseTo(0.5 * calculateRadiationPower(1, 1, 300, 20), 8);
  });
  it("convects hAΔT and rejects non-physical input", () => {
    expect(calculateConvectionPower(50, 0.2, 60, 20)).toBe(400);
    expect(() => calculateRadiationPower(0, 1, 100, 20)).toThrow(RangeError);
    expect(() => calculateRadiationPower(1, 1, -300, 20)).toThrow(RangeError);
    expect(CONDUCTORS.length).toBeGreaterThan(5);
    expect(CONVECTION_MEDIA.length).toBe(3);
  });
});

describe("Heat Transfer lab", () => {
  const base = defaultLabValues(heatTransferLab);
  it("compares the three modes and names the leader", () => {
    expect(m(heatTransferLab, base, "conduction")).toBeCloseTo(4000, 6);
    expect(heatTransferLab.run(base).explanations[0]!.title).toBe("Conduction carries the most heat here");
    const foam = { ...base, material: "foam", thickness: 10 };
    expect(heatTransferLab.run(foam).explanations[0]!.title).not.toBe("Conduction carries the most heat here");
    expect(m(heatTransferLab, { ...foam, medium: "water" }, "convection")!).toBeGreaterThan(m(heatTransferLab, foam, "convection")! * 90);
  });
  it("lets radiation take over when it is very hot, and shiny surfaces radiate less", () => {
    const hot = { ...base, hot: 600, material: "foam", thickness: 30, emissivity: 1 };
    expect(m(heatTransferLab, hot, "radiation")!).toBeGreaterThan(m(heatTransferLab, hot, "convection")!);
    expect(m(heatTransferLab, { ...hot, emissivity: 0.1 }, "radiation")!).toBeCloseTo(m(heatTransferLab, hot, "radiation")! / 10, 6);
    const shares = ["radiationShare", "conductionShare"].map((id) => m(heatTransferLab, base, id)!);
    expect(shares[0]! + shares[1]!).toBeLessThan(100);
  });
});

describe("Lens Focal Length lab", () => {
  const base = defaultLabValues(lensFocalLab);
  it("images an object at 60 cm in front of a 20 cm lens at 30 cm with magnification −½", () => {
    expect(m(lensFocalLab, base, "image")).toBeCloseTo(30, 8);
    expect(m(lensFocalLab, base, "magnification")).toBeCloseTo(-0.5, 8);
    expect(m(lensFocalLab, base, "imageHeight")).toBeCloseTo(1.5, 8);
    expect(m(lensFocalLab, base, "power")).toBeCloseTo(5, 8);
  });
  it("recovers f from one pair, and by Bessel's method (D = 100 cm, f = 20 cm)", () => {
    expect(m(lensFocalLab, base, "fromPair")).toBeCloseTo(20, 8);
    expect(m(lensFocalLab, base, "besselFocal")).toBeCloseTo(20, 6);
    expect(m(lensFocalLab, base, "besselShift")).toBeCloseTo(Math.sqrt(100 * (100 - 80)), 6);
    expect(m(lensFocalLab, { ...base, separation: 60 }, "besselFocal")).toBeNull();
  });
  it("makes a virtual upright image inside the focal length and none at the focal point", () => {
    const inside = { ...base, object: 10 };
    expect(m(lensFocalLab, inside, "image")).toBeCloseTo(-20, 8);
    expect(m(lensFocalLab, inside, "magnification")).toBeCloseTo(2, 8);
    expect(lensFocalLab.run(inside).explanations[0]!.title).toBe("Virtual, upright");
    expect(m(lensFocalLab, { ...base, object: 20 }, "image")).toBeNull();
    expect(lensFocalLab.run({ ...base, object: 20 }).explanations[0]!.title).toMatch(/focal point/);
  });
  it("draws the 1/v against 1/u line with intercept 1/f", () => {
    const line = lensFocalLab.run(base).charts[1]!.series[0]!.points;
    for (const p of line) expect(p.x + p.y).toBeCloseTo(5, 8);
  });
});

describe("Wave Interference lab", () => {
  const base = defaultLabValues(waveInterferenceLab);
  it("is loud on the center line and silent at the first minimum", () => {
    expect(m(waveInterferenceLab, { ...base, position: 0 }, "intensity")).toBeCloseTo(100, 6);
    expect(m(waveInterferenceLab, { ...base, position: 0 }, "pathDifference")).toBeCloseTo(0, 8);
    expect(m(waveInterferenceLab, { ...base, position: 1.06 }, "intensity")!).toBeLessThan(0.5);
    expect(waveInterferenceLab.run({ ...base, position: 0 }).explanations[0]!.title).toBe("At your position it is constructive");
  });
  it("makes more fringes at higher frequency and wider speaker separation", () => {
    const loud = (v: Record<string, number | string>) => m(waveInterferenceLab, v, "loudSpots")!;
    expect(loud({ ...base, frequency: 1000 })).toBeGreaterThan(loud({ ...base, frequency: 200 }));
    expect(loud({ ...base, separation: 5 })).toBeGreaterThan(loud({ ...base, separation: 1 }));
    expect(m(waveInterferenceLab, { ...base, frequency: 100, separation: 0.5 }, "loudSpots")).toBe(1);
    expect(m(waveInterferenceLab, base, "wavelength")).toBeCloseTo(1, 8);
    expect(m(waveInterferenceLab, base, "spacing")).toBeCloseTo(2, 8);
  });
});

describe("Orbital Motion lab", () => {
  const base = defaultLabValues(orbitalMotionLab);
  it("follows a circle at the circular speed with tiny energy drift (7.67 km/s at 400 km)", () => {
    const circle = { ...base, ratio: 1 };
    expect(m(orbitalMotionLab, circle, "circular")! / 1000).toBeCloseTo(7.67, 2);
    expect(m(orbitalMotionLab, circle, "eccentricity")!).toBeLessThan(1e-9);
    expect(m(orbitalMotionLab, circle, "period")! / 60).toBeCloseTo(92.4, 0);
    expect(m(orbitalMotionLab, circle, "drift")!).toBeLessThan(1e-3);
    expect(orbitalMotionLab.run(circle).explanations[0]!.title).toBe("The satellite follows a circular orbit");
  });
  it("makes an ellipse when faster, matching vis-viva apoapsis", () => {
    const fast = { ...base, ratio: 1.2 };
    const rp = 6.771e6;
    const speed = Math.sqrt(3.986004418e14 / rp) * 1.2;
    const apo = (rp * speed ** 2) / ((2 * 3.986004418e14) / rp - speed ** 2);
    expect(m(orbitalMotionLab, fast, "apoapsis")! * 1000).toBeCloseTo(apo - 6.371e6, -2);
    expect(apo).toBeGreaterThan(rp);
    expect(m(orbitalMotionLab, fast, "periapsis")!).toBeCloseTo(400, 3);
  });
  it("crashes when too slow and escapes above √2 times the circular speed", () => {
    expect(orbitalMotionLab.run({ ...base, ratio: 0.6, periods: 2 }).explanations[0]!.title).toBe("The satellite crashes into the surface");
    expect(orbitalMotionLab.run({ ...base, ratio: 1.5, periods: 3 }).explanations[0]!.title).toBe("The satellite escapes");
    expect(m(orbitalMotionLab, { ...base, ratio: 1.5 }, "apoapsis")).toBeNull();
  });
  it("works at the Moon and Mars and stays inside the chart", () => {
    for (const body of ["moon", "mars"]) {
      const result = orbitalMotionLab.run({ ...base, body, altitude: 100, ratio: 1.1 });
      expect(result.charts[0]!.series[1]!.points.length).toBeGreaterThan(20);
    }
  });
});

describe("all labs", () => {
  it("are eight in total, registered and persistable", () => {
    expect(LABS).toHaveLength(8);
    for (const lab of LABS) {
      expect(findCatalogEntry(lab.id)?.kind).toBe("experiment");
      const values = defaultLabValues(lab);
      expect(parseLabValues(lab, values)).toEqual(values);
      expect(lab.describe(values).length).toBeGreaterThan(5);
    }
  });
});
