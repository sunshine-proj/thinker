import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateEmfAtTime, calculateGeneratorOutput, type GeneratorOutput } from "../../../physics/electromagnetism";

export interface PlantRound extends NumericRound {
  readonly targetPowerWatts: number;
  readonly minimumEfficiency: number | null;
  readonly gridFrequencyHertz: number | null;
}

export interface PlantOutcome extends AttemptOutcome {
  readonly output: GeneratorOutput;
}

export const COIL_AREA = 0.1;
export const LOAD_OHMS = 20;
export const COIL_OHMS_PER_TURN = 0.02;
export const POWER_TOLERANCE = 0.05;

export const POWER_PLANT_META: RoundGameMeta = {
  id: "power-plant",
  title: "Power Plant",
  eyebrow: "ELECTRICITY & MAGNETISM · INDUCTION",
  modelTag: "FARADAY'S LAW · AC GENERATOR",
  introduction: "Build a generator: a coil of wire spinning in a magnetic field. Choose the turns, field and speed to deliver exactly the power a town needs.",
  instructions: "Predict the peak voltage, set the generator, then run the turbine. The graph shows the alternating voltage. Deliver the target power (± 5%) to the 20 Ω load.",
  formula: "ε = N B A ω sin ωt  ·  P = I²R_L  ·  I = ε_rms/(R_L + r)",
  formulaCaption: "N is the number of turns, B the field, A the coil area (0.1 m²), ω = 2π·rpm/60 the angular speed, r the coil's own resistance (0.02 Ω per turn) and R_L the load (20 Ω). ε_rms = ε_peak/√2.",
  explanation: "A changing magnetic flux through a coil induces an EMF (Faraday's law). Spinning a coil in a field makes the flux oscillate, so the EMF is a sine wave whose peak grows with the number of turns, the field, the area and the speed. The coil's resistance shares the voltage with the load, so extra turns raise the voltage but also waste power as heat in the wire. A power grid also needs a steady frequency, so the rotation speed may be fixed while you tune turns and field.",
  assumptions: "A purely resistive load, a uniform field, a steady sine-wave output, no coil inductance and no mechanical losses. Coil resistance is proportional to the number of turns.",
  learningObjectives: ["Apply Faraday's law EMF = N B A ω sin ωt.", "Relate peak, RMS and delivered power for an AC source.", "Balance voltage against coil losses and a fixed grid frequency."],
  objective: { title: "Power every town", description: "Deliver each target power.", unit: "towns" },
  controlsHeading: "Build the generator",
  submitLabel: "Run the turbine",
  solvedLabel: "Power delivered!",
  nextLabel: "Next town",
};

export const PLANT_ROUNDS: readonly PlantRound[] = Object.freeze([
  {
    id: "small-town", title: "A small town", difficulty: "Beginner", targetPowerWatts: 500, minimumEfficiency: null, gridFrequencyHertz: null,
    situation: "A generator with 200 turns in a 0.8 T field must deliver 500 W to the load. Choose the rotation speed.",
    controls: [fixed("turns", "Turns", "", 200), fixed("field", "Magnetic field", "T", 0.8), slider("rpm", "Rotation speed", "rpm", 20, 400, 1, 200)],
    hint: "Work backwards: P = I²R_L gives I, then ε_rms = I(R_L + r), then ε_peak = √2 ε_rms = N B A ω.",
  },
  {
    id: "efficient-plant", title: "An efficient plant", difficulty: "Intermediate", targetPowerWatts: 800, minimumEfficiency: 0.9, gridFrequencyHertz: null,
    situation: "Deliver 800 W (± 5%) but waste no more than 10% of the power as heat in the coil. The 0.8 T field is fixed and the turbine runs at 50–300 rpm. Choose the turns and the speed.",
    controls: [slider("turns", "Turns", "", 50, 400, 5, 100), fixed("field", "Magnetic field", "T", 0.8), slider("rpm", "Rotation speed", "rpm", 50, 300, 1, 150)],
    hint: "Efficiency is R_L/(R_L + r) with r = 0.02 N, so N must be at most 111. Then pick the speed that gives 800 W.",
  },
  {
    id: "grid-connected", title: "Connect to the grid", difficulty: "Advanced", targetPowerWatts: 2000, minimumEfficiency: 0.95, gridFrequencyHertz: 50,
    situation: "The generator must run at 3,000 rpm to match the 50 Hz grid. Deliver 2,000 W (± 5%) with at least 95% efficiency by choosing the number of turns and the magnetic field.",
    controls: [slider("turns", "Turns", "", 10, 200, 1, 40), slider("field", "Magnetic field", "T", 0.1, 1.5, 0.01, 0.5), fixed("rpm", "Rotation speed", "rpm", 3000)],
    hint: "At 3,000 rpm ω = 314 rad/s. Find ε_rms for 2,000 W, then B = ε_peak/(N A ω) for a number of turns that keeps r ≤ 1.05 Ω.",
  },
]);

export function designFrom(v: NumericControl) {
  return { turns: v.turns as number, fieldTesla: v.field as number, areaSquareMeters: COIL_AREA, revolutionsPerMinute: v.rpm as number, loadOhms: LOAD_OHMS, coilOhmsPerTurn: COIL_OHMS_PER_TURN };
}

export function runPlant(round: PlantRound, v: NumericControl): PlantOutcome {
  const output = calculateGeneratorOutput(designFrom(v));
  const target = round.targetPowerWatts;
  const error = Math.abs(output.loadPowerWatts - target) / target;
  const powerOk = error <= POWER_TOLERANCE;
  const efficiencyOk = round.minimumEfficiency === null || output.efficiency >= round.minimumEfficiency;
  const success = powerOk && efficiencyOk;
  const problems: string[] = [];
  if (!powerOk) problems.push(`The load receives ${output.loadPowerWatts.toFixed(0)} W, ${output.loadPowerWatts < target ? "short of" : "above"} the ${target} W target.`);
  if (!efficiencyOk) problems.push(`Only ${(output.efficiency * 100).toFixed(0)}% of the power reaches the load; ${(round.minimumEfficiency! * 100).toFixed(0)}% is required. Fewer turns waste less in the coil.`);
  return {
    success, output,
    accuracyFraction: success ? 1 - error / POWER_TOLERANCE : 0,
    predictionActual: output.peakEmfVolts,
    feedback: success ? `${output.loadPowerWatts.toFixed(0)} W delivered at ${output.frequencyHertz.toFixed(1)} Hz, ${(output.efficiency * 100).toFixed(0)}% efficient.` : problems.join(" "),
  };
}

export function emfWaveform(output: GeneratorOutput): { x: number; y: number }[] {
  const period = output.frequencyHertz > 0 ? 1 / output.frequencyHertz : 1;
  return Array.from({ length: 121 }, (_, i) => {
    const t = (2 * period * i) / 120;
    return { x: t, y: calculateEmfAtTime(output.peakEmfVolts, output.angularSpeedRadiansPerSecond, t) };
  });
}

export const powerPlant = defineNumericGame<PlantRound, PlantOutcome>({
  meta: POWER_PLANT_META,
  rounds: PLANT_ROUNDS,
  prediction: () => ({ label: "Your prediction of the peak voltage", unit: "V", placeholder: "e.g. 170", step: 0.1 }),
  evaluate: (round, values) => runPlant(round, values),
});
