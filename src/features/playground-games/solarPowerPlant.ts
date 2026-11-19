import { calculateMaximumKineticEnergyEv, calculatePhotonEnergyEv } from "../../physics/quantum";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, sky, sun } from "./scenery";

/** Fraction of photons that knock out an electron which reaches the battery. */
export const QUANTUM_EFFICIENCY = 0.1;

interface Panel { readonly name: string; readonly workFunctionEv: number }
interface Robot { readonly title: string; readonly goal: string; readonly panel: Panel; readonly batteryVolts: number; readonly needMilliamps: number; readonly fixedWatts: number | null; readonly visibleOnly: boolean }
export const ROBOTS: readonly Robot[] = [
  { title: "Wake up, robot!", goal: "Charge the 0.5 V robot with the sodium panel. Try a very bright red lamp first, then other colours.", panel: { name: "sodium", workFunctionEv: 2.28 }, batteryVolts: 0.5, needMilliamps: 5, fixedWatts: null, visibleOnly: false },
  { title: "Zinc panel", goal: "A zinc panel holds on to its electrons more tightly. Charge the 1 V robot.", panel: { name: "zinc", workFunctionEv: 4.3 }, batteryVolts: 1, needMilliamps: 5, fixedWatts: null, visibleOnly: false },
  { title: "Most current", goal: "Caesium panel, 0.6 V robot, a 1 W lamp with visible colours only. It needs at least 36 mA: more photons per watt means more current.", panel: { name: "caesium", workFunctionEv: 2.1 }, batteryVolts: 0.6, needMilliamps: 36, fixedWatts: 1, visibleOnly: true },
];

export function panelOutput(level: number, wavelengthNm: number, watts: number) {
  const robot = ROBOTS[level] as Robot;
  const photon = calculatePhotonEnergyEv(wavelengthNm);
  const kinetic = calculateMaximumKineticEnergyEv(wavelengthNm, robot.panel.workFunctionEv);
  // Photons per second = P / (E_photon · e); each electron carries e, so I = η P / E_photon(eV).
  const milliamps = kinetic > 0 ? ((QUANTUM_EFFICIENCY * watts) / photon) * 1000 : 0;
  return { photon, kinetic, milliamps, charges: kinetic >= robot.batteryVolts && milliamps >= robot.needMilliamps };
}

export interface SolarState { readonly shines: number; readonly result: ReturnType<typeof panelOutput> | null }

export const solarPowerPlant: LiveGameDefinition<SolarState> = {
  id: "solar-power-plant",
  title: "Solar Power Plant",
  worldId: "modern-physics",
  eyebrow: "PLAYGROUND · THE PHOTOELECTRIC EFFECT",
  modelTag: "K = hf − φ",
  introduction: "The robot's battery is flat! Shine a lamp on the metal panel: if the light knocks electrons out, they flow into the robot and charge it.",
  howToPlay: "Choose the lamp's colour (wavelength) and brightness, then press Shine (Space or Enter).",
  physics: "Light arrives as photons, each with energy E = hc/λ. One photon can knock out one electron, but only if its energy is bigger than the work function φ, the energy that holds electrons in the metal. Below that, nothing happens, however bright the lamp! Each escaping electron keeps the spare energy K = hf − φ, and it needs enough to push into the battery (K in eV must beat the battery's voltage). A brighter lamp sends more photons, so more current, but not faster electrons.",
  assumptions: "Typical work functions (sodium 2.28 eV, zinc 4.3 eV, caesium 2.1 eV), one colour at a time, 10 % of photons giving an electron that reaches the battery, and the fastest electrons judged against the battery voltage.",
  levels: ROBOTS.map((robot, index) => ({ id: `robot-${index + 1}`, title: robot.title, goal: robot.goal })),
  sliders: (level) => {
    const robot = ROBOTS[level] as Robot;
    return [
      { key: "wavelength", label: "Lamp colour (wavelength)", unit: "nm", minimum: robot.visibleOnly ? 400 : 150, maximum: 700, step: 1, initial: 650 },
      ...(robot.fixedWatts === null ? [{ key: "watts", label: "Lamp brightness", unit: "W", minimum: 0.1, maximum: 2, step: 0.1, initial: 1 }] : []),
    ];
  },
  actions: [{ id: "shine", label: "Shine!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ shines: 0, result: null }),
  step(state, input, _dt, level) {
    if (!input.pressed.has("shine")) return state;
    const robot = ROBOTS[level] as Robot;
    return { shines: state.shines + 1, result: panelOutput(level, input.values.wavelength ?? 650, robot.fixedWatts ?? input.values.watts ?? 1) };
  },
  verdict(state, level) {
    const robot = ROBOTS[level] as Robot;
    const result = state.result;
    if (!result) return { status: "playing", message: "Pick a lamp and shine it on the panel." };
    if (result.charges) return { status: "won", message: `Beep boop! The robot is charging with ${result.milliamps.toFixed(1)} mA.` };
    if (result.kinetic <= 0) return { status: "playing", message: `Nothing! Each ${result.photon.toFixed(2)} eV photon is weaker than ${robot.panel.name}'s ${robot.panel.workFunctionEv} eV grip. A brighter lamp will not help.` };
    if (result.kinetic < robot.batteryVolts) return { status: "playing", message: `Electrons escape with ${result.kinetic.toFixed(2)} eV, not enough to push into the ${robot.batteryVolts} V battery.` };
    return { status: "playing", message: `Only ${result.milliamps.toFixed(1)} mA; the robot needs ${robot.needMilliamps} mA.` };
  },
  stars: (state) => (state.shines <= 2 ? 3 : state.shines <= 4 ? 2 : 1),
  readouts: (_state, input, level) => {
    const robot = ROBOTS[level] as Robot;
    const output = panelOutput(level, input.values.wavelength ?? 650, robot.fixedWatts ?? input.values.watts ?? 1);
    return [
      { label: "PHOTON ENERGY", value: `${output.photon.toFixed(2)} eV` },
      { label: `${robot.panel.name.toUpperCase()} WORK FUNCTION φ`, value: `${robot.panel.workFunctionEv} eV` },
      { label: "ELECTRON ENERGY K = hf − φ", value: `${output.kinetic.toFixed(2)} eV (battery ${robot.batteryVolts} V)` },
      { label: "CURRENT", value: `${output.milliamps.toFixed(1)} mA (needs ${robot.needMilliamps} mA)` },
    ];
  },
  draw(context, state, input, width, height, level) {
    const robot = ROBOTS[level] as Robot;
    sky(context, width, height);
    sun(context, 40, 40);
    const wavelength = input.values.wavelength ?? 650;
    const colour = wavelength < 400 ? "#cc5de8" : `hsl(${Math.max(0, Math.min(270, 270 - ((wavelength - 400) / 300) * 270))} 90% 55%)`;
    context.fillStyle = "#adb5bd";
    context.fillRect(width * 0.4, height * 0.3, width * 0.25, 16);
    badge(context, `${robot.panel.name} panel`, width * 0.4, height * 0.3 + 34, "#495057");
    context.strokeStyle = colour;
    context.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      context.beginPath();
      context.moveTo(width * 0.1 + i * 12, 70);
      context.lineTo(width * 0.42 + i * 24, height * 0.3);
      context.stroke();
    }
    const charging = state.result?.charges ?? false;
    if (state.result && state.result.kinetic > 0) {
      context.fillStyle = "#74c0fc";
      for (let i = 0; i < Math.min(12, Math.ceil(state.result.milliamps / 4)); i += 1) {
        context.beginPath();
        context.arc(width * 0.45 + i * 14, height * 0.3 - 14 - (i % 3) * 10, 4, 0, 2 * Math.PI);
        context.fill();
      }
    }
    const rx = width * 0.78;
    const ry = height * 0.55;
    context.fillStyle = charging ? "#51cf66" : "#868e96";
    context.fillRect(rx, ry, 60, 70);
    context.fillStyle = PLAYGROUND_COLOURS.white;
    context.fillRect(rx + 12, ry + 16, 10, 10);
    context.fillRect(rx + 38, ry + 16, 10, 10);
    badge(context, charging ? "CHARGING!" : `${robot.batteryVolts} V robot`, rx - 10, ry - 10, charging ? "#2b8a3e" : PLAYGROUND_COLOURS.ink);
  },
  describe: (state, input, level) => {
    const robot = ROBOTS[level] as Robot;
    const output = panelOutput(level, input.values.wavelength ?? 650, robot.fixedWatts ?? input.values.watts ?? 1);
    return `Lamp at ${input.values.wavelength ?? 650} nanometres: photons of ${output.photon.toFixed(2)} electronvolts on a ${robot.panel.name} panel give electrons ${output.kinetic.toFixed(2)} electronvolts and ${output.milliamps.toFixed(1)} milliamperes. ${state.result?.charges ? "The robot is charging." : ""}`;
  },
};
