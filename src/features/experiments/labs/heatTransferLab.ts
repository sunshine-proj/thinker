import { CONDUCTORS, CONVECTION_MEDIA, compareHeatTransfer } from "../../../physics/thermodynamics";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition, LabValues } from "./labTypes";

export const HEAT_LAB_ID = "heat-transfer-modes";

const material = (v: LabValues) => CONDUCTORS.find((m) => m.id === v.material) ?? CONDUCTORS[0]!;
const medium = (v: LabValues) => CONVECTION_MEDIA.find((m) => m.id === v.medium) ?? CONVECTION_MEDIA[0]!;

function powers(v: LabValues, hot = v.hot as number) {
  return compareHeatTransfer({
    conductivity: material(v).conductivity, thicknessMeters: (v.thickness as number) / 100, coefficient: medium(v).coefficient,
    emissivity: v.emissivity as number, areaSquareMeters: v.area as number, hotCelsius: hot, coldCelsius: v.cold as number,
  });
}

export const heatTransferLab: LabDefinition = {
  id: HEAT_LAB_ID,
  name: "Heat Transfer",
  eyebrow: "EXPERIMENT LAB · THERMODYNAMICS",
  introduction: "A hot surface loses heat three ways at once. Compare conduction through a wall, convection to the air or water around it, and radiation, and watch which one wins as the temperature, the material or the surface changes.",
  assumptions: "Steady state with the same area and temperature difference for all three modes. Conduction goes through a flat layer of the chosen material; convection uses a fixed typical heat-transfer coefficient for each fluid (real values depend on shape and flow); radiation is from a gray surface to black-body surroundings at the cold temperature, ignoring absorption by the air. The three flows are compared side by side, not added, because in a real object they act on different paths.",
  controls: [
    { kind: "number", key: "hot", label: "Hot side temperature", unit: "°C", minimum: 30, maximum: 600, step: 5, initial: 100 },
    { kind: "number", key: "cold", label: "Cold side temperature", unit: "°C", minimum: -20, maximum: 25, step: 1, initial: 20 },
    { kind: "number", key: "area", label: "Area", unit: "m²", minimum: 0.01, maximum: 2, step: 0.01, initial: 0.5 },
    { kind: "choice", key: "material", label: "Wall material (conduction)", options: CONDUCTORS.map((m) => ({ value: m.id, label: `${m.name} (k = ${m.conductivity} W/m·K)` })), initial: "glass" },
    { kind: "number", key: "thickness", label: "Wall thickness", unit: "cm", minimum: 0.5, maximum: 30, step: 0.5, initial: 1 },
    { kind: "choice", key: "medium", label: "Surrounding fluid (convection)", options: CONVECTION_MEDIA.map((m) => ({ value: m.id, label: `${m.name} (h = ${m.coefficient} W/m²·K)` })), initial: "still-air" },
    { kind: "number", key: "emissivity", label: "Surface emissivity (radiation)", unit: "", minimum: 0.05, maximum: 1, step: 0.05, initial: 0.9 },
  ],
  describe: (v) => `${v.hot} °C to ${v.cold} °C · ${material(v).name} ${v.thickness} cm · ${medium(v).name} · ε ${v.emissivity}`,
  run(v) {
    const p = powers(v);
    const total = p.conduction + p.convection + p.radiation;
    const entries = [["Conduction", p.conduction], ["Convection", p.convection], ["Radiation", p.radiation]] as const;
    const leader = [...entries].sort((a, b) => b[1] - a[1])[0]!;
    const sweep = (mode: "conduction" | "convection" | "radiation") =>
      Array.from({ length: 60 }, (_, i) => {
        const hot = (v.cold as number) + 5 + ((600 - (v.cold as number) - 5) * i) / 59;
        return { x: hot, y: powers(v, hot)[mode] };
      });
    return {
      measurements: [
        createMeasurement("conduction", "Conduction through the wall", p.conduction, "W"),
        createMeasurement("convection", "Convection to the fluid", p.convection, "W"),
        createMeasurement("radiation", "Radiation", p.radiation, "W"),
        createMeasurement("radiationShare", "Radiation share of the three", (p.radiation / total) * 100, "%"),
        createMeasurement("conductionShare", "Conduction share of the three", (p.conduction / total) * 100, "%"),
        createMeasurement("deltaT", "Temperature difference", (v.hot as number) - (v.cold as number), "K"),
      ],
      charts: [{
        title: "Heat flow against the hot-side temperature",
        description: `Power carried by conduction, convection and radiation as the hot side warms from the cold temperature to 600 degrees Celsius. At ${v.hot} °C ${leader[0].toLowerCase()} leads with ${leader[1].toFixed(0)} watts. Conduction and convection are straight lines; radiation curves upward.`,
        xLabel: "Hot-side temperature (°C)", yLabel: "Power (W)",
        series: [{ label: "Conduction", points: sweep("conduction") }, { label: "Convection", points: sweep("convection") }, { label: "Radiation", points: sweep("radiation") }, { label: "Your temperature", dashed: true, points: [{ x: v.hot as number, y: 0 }, { x: v.hot as number, y: Math.max(p.conduction, p.convection, p.radiation) * 1.1 }] }],
        xDomain: [(v.cold as number) + 5, 600],
      }],
      explanations: [
        { title: `${leader[0]} carries the most heat here`, text: `At ${v.hot} °C, conduction through ${(v.thickness as number)} cm of ${material(v).name.toLowerCase()} moves ${p.conduction.toFixed(0)} W, convection into ${medium(v).name.toLowerCase()} ${p.convection.toFixed(0)} W and radiation ${p.radiation.toFixed(0)} W. Change one thing at a time and watch which bar changes: that shows which law governs it.` },
        { title: "Conduction: material and thickness", text: `P = kAΔT/d is proportional to the conductivity (${material(v).conductivity} W/m·K here) and inversely to the thickness. Switching to foam cuts it by a factor of ${(material(v).conductivity / 0.033).toFixed(0)}; that is why insulation is mostly trapped air.` },
        { title: "Convection: the fluid and its motion", text: `P = hAΔT with h = ${medium(v).coefficient} W/m²·K. Moving fluid carries heat away faster: blowing a fan or running water over a surface multiplies h by 5 to 100. Still air next to a surface acts as a thin insulating layer.` },
        { title: "Radiation grows as T⁴", text: `P = εσA(T_h⁴ − T_c⁴) needs no material at all; it works across a vacuum. It is ${((p.radiation / Math.max(p.convection, 1e-9)) * 100).toFixed(0)} % of the convection here, but at 600 °C it is ${(powers(v, 600).radiation / powers(v, 600).convection).toFixed(1)} times the convection because of the fourth power. A shiny surface (low ε) radiates less: ε = ${v.emissivity} at this setting.` },
      ],
    };
  },
};
