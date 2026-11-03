import { EARTH_FIELD_TESLA, calculateLongSolenoidField, calculateWireField } from "../../../physics/electromagnetism";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition, LabValues } from "./labTypes";

export const MAGNETIC_LAB_ID = "magnetic-field-strength";

const IRON_SATURATION = 1.6;
const isWire = (values: LabValues) => values.source === "wire";
const permeability = (values: LabValues) => (values.core === "iron" ? 200 : 1);

function solenoidField(values: LabValues, current = values.current as number): number {
  return Math.min(IRON_SATURATION, calculateLongSolenoidField(values.turns as number, current, permeability(values)));
}

export const magneticFieldLab: LabDefinition = {
  id: MAGNETIC_LAB_ID,
  name: "Magnetic Field Strength",
  eyebrow: "EXPERIMENT LAB · ELECTRICITY & MAGNETISM",
  introduction: "Measure the magnetic field around a straight current-carrying wire and inside a solenoid. Vary the current, the distance, the number of turns and an iron core, and compare the result with the Earth's own field.",
  assumptions: "An infinitely long straight wire and an infinitely long solenoid (good when the distance is much less than the length), steady current, and a field in air. The iron core is a constant relative permeability of 200 limited to a saturation field of 1.6 T; real iron varies with the field. Fields from other sources, including the Earth's, are not added.",
  controls: [
    { kind: "choice", key: "source", label: "Source", options: [{ value: "wire", label: "Straight wire" }, { value: "solenoid", label: "Solenoid (coil)" }], initial: "wire" },
    { kind: "number", key: "current", label: "Current", unit: "A", minimum: 0.1, maximum: 50, step: 0.1, initial: 5 },
    { kind: "number", key: "distance", label: "Distance from the wire", unit: "cm", minimum: 1, maximum: 100, step: 1, initial: 5, visibleWhen: isWire },
    { kind: "number", key: "turns", label: "Turns per meter", unit: "turns/m", minimum: 100, maximum: 10000, step: 100, initial: 1000, visibleWhen: (v) => !isWire(v) },
    { kind: "choice", key: "core", label: "Core", options: [{ value: "air", label: "Air" }, { value: "iron", label: "Iron (μr = 200)" }], initial: "air", visibleWhen: (v) => !isWire(v) },
  ],
  describe: (values) => (isWire(values) ? `Wire · ${values.current} A at ${values.distance} cm` : `Solenoid · ${values.turns} turns/m · ${values.current} A · ${values.core === "iron" ? "iron" : "air"} core`),
  run(values) {
    const current = values.current as number;
    if (isWire(values)) {
      const distance = (values.distance as number) / 100;
      const field = calculateWireField(current, distance);
      const points = Array.from({ length: 100 }, (_, i) => {
        const cm = 1 + (99 * i) / 99;
        return { x: cm, y: calculateWireField(current, cm / 100) * 1e6 };
      });
      return {
        measurements: [
          createMeasurement("field", "Field strength", field, "T"),
          createMeasurement("fieldMicro", "Field strength", field * 1e6, "µT"),
          createMeasurement("earthRatio", "Compared with Earth's field", field / EARTH_FIELD_TESLA, "×"),
          createMeasurement("doubleDistance", "Field at twice the distance", calculateWireField(current, 2 * distance) * 1e6, "µT"),
        ],
        charts: [{
          title: "Field of the wire against distance",
          description: `Field strength in microtesla against distance from a ${current} ampere wire: it falls as one over the distance. At ${(distance * 100).toFixed(0)} centimeters it is ${(field * 1e6).toFixed(1)} microtesla.`,
          xLabel: "Distance (cm)", yLabel: "Field (µT)",
          series: [{ label: "B = μ₀I/2πr", points }, { label: "Earth's field", dashed: true, points: [{ x: 1, y: 50 }, { x: 100, y: 50 }] }, { label: "Your distance", dashed: true, points: [{ x: distance * 100, y: 0 }, { x: distance * 100, y: Math.max(...points.map((p) => p.y)) }] }],
          xDomain: [1, 100],
        }],
        explanations: [
          { title: "A wire's field circles around it", text: `B = μ₀I/(2πr) = ${(field * 1e6).toFixed(2)} µT at ${(distance * 100).toFixed(0)} cm from ${current} A. The field lines are circles around the wire (right-hand rule: thumb along the current, fingers curl the way the field points).` },
          { title: "Inverse with distance, proportional to current", text: `Doubling the distance halves the field (${(calculateWireField(current, 2 * distance) * 1e6).toFixed(2)} µT); doubling the current doubles it. Try it and compare the saved runs: the product B × r stays equal to μ₀I/2π.` },
          { title: "Compare with the Earth", text: `The Earth's field is about 50 µT, so this wire's field is ${(field / EARTH_FIELD_TESLA).toFixed(2)} times that. A compass near a wire carrying tens of amperes is visibly deflected; household currents of a few amperes give fields much weaker than the Earth's beyond a few centimeters.` },
        ],
      };
    }
    const turns = values.turns as number;
    const field = solenoidField(values);
    const saturated = calculateLongSolenoidField(turns, current, permeability(values)) > IRON_SATURATION;
    const points = Array.from({ length: 80 }, (_, i) => {
      const a = 0.1 + (49.9 * i) / 79;
      return { x: a, y: solenoidField(values, a) * 1000 };
    });
    return {
      measurements: [
        createMeasurement("field", "Field strength", field, "T"),
        createMeasurement("fieldMilli", "Field strength", field * 1000, "mT"),
        createMeasurement("earthRatio", "Compared with Earth's field", field / EARTH_FIELD_TESLA, "×"),
        createMeasurement("airField", "Field with an air core", calculateLongSolenoidField(turns, current) * 1000, "mT"),
      ],
      charts: [{
        title: "Field of the solenoid against current",
        description: `Field in millitesla against current for ${turns} turns per meter with an ${values.core === "iron" ? "iron" : "air"} core: a straight line until the iron saturates. At ${current} amperes it is ${(field * 1000).toFixed(2)} millitesla.`,
        xLabel: "Current (A)", yLabel: "Field (mT)",
        series: [{ label: "B = μ₀μr n I", points }, { label: "Your current", dashed: true, points: [{ x: current, y: 0 }, { x: current, y: Math.max(...points.map((p) => p.y)) }] }],
        xDomain: [0.1, 50],
      }],
      explanations: [
        { title: "The field inside a coil is uniform", text: `B = μ₀ n I = ${(calculateLongSolenoidField(turns, current) * 1000).toFixed(2)} mT for n = ${turns} turns/m and I = ${current} A. It does not depend on the coil's diameter, and the field is almost zero outside a long coil.` },
        { title: "Current and turns both add up", text: `The field is proportional to the current and to the turns per meter, so doubling either doubles B. A tightly wound coil with ${turns} turns/m gives the same field as a wire with ${turns}× the current.` },
        values.core === "iron"
          ? { title: "Iron concentrates the field", text: saturated ? `An iron core would multiply the field by 200 to ${(calculateLongSolenoidField(turns, current, 200) * 1000).toFixed(0)} mT, but iron saturates near 1.6 T: all its tiny magnets are already aligned, so the field stops growing. This setup is saturated at ${(field * 1000).toFixed(0)} mT.` : `The iron core magnifies the field by its relative permeability, 200, from ${(calculateLongSolenoidField(turns, current) * 1000).toFixed(2)} mT to ${(field * 1000).toFixed(1)} mT. This is how electromagnets lift cars. At about 1.6 T the iron would saturate.` }
          : { title: "Try an iron core", text: "Switch the core to iron: its magnetic domains line up with the coil's field and multiply it by about 200, until saturation at roughly 1.6 T." },
        { title: "Compare with the Earth", text: `The field is ${(field / EARTH_FIELD_TESLA).toFixed(0)} times Earth's 50 µT.` },
      ],
    };
  },
};
