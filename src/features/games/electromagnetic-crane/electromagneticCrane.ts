import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { STANDARD_GRAVITY } from "../../../physics/core";
import { calculateCoilResistance, calculateHeatingPower, calculateMagneticPullForce, calculateSolenoidField, IRON_SATURATION_TESLA } from "../../../physics/electromagnetism";

export interface CraneRound extends NumericRound {
  readonly loadKilograms: number;
  /** Lift force must lie between 1× and this many times the load's weight. */
  readonly maximumForceRatio: number;
  readonly maximumPowerWatts: number | null;
}

export interface CraneOutcome extends AttemptOutcome {
  readonly fieldTesla: number;
  readonly forceNewtons: number;
  readonly forceRatio: number;
  readonly powerWatts: number;
  readonly saturated: boolean;
}

export const CORE_LENGTH = 0.3;
export const RELATIVE_PERMEABILITY = 200;
export const WIRE_AREA = 1e-6;
export const MEAN_TURN_LENGTH = 0.4;

export const CRANE_META: RoundGameMeta = {
  id: "electromagnetic-crane",
  title: "Electromagnetic Crane",
  eyebrow: "ELECTRICITY & MAGNETISM · ELECTROMAGNETS",
  modelTag: "SOLENOID FIELD · MAGNETIC PULL · SATURATION",
  introduction: "Design a scrapyard crane magnet. Choose the current and the coil so the magnet lifts a steel load, without overheating or hitting the limits of iron.",
  instructions: "Predict the lifting force, set the magnet, then try to lift the load. The pull must exceed the load's weight (but not by more than the allowed margin), and the coil must stay within its power limit.",
  formula: "B = μ₀μᵣNI/L (≤ 1.6 T)  ·  F = B²A/μ₀  ·  P = I²R",
  formulaCaption: "N is the number of turns, I the current, L the 0.30 m core length, μᵣ = 200 the core's effective permeability, A the pole area and R the coil resistance. Iron saturates at 1.6 T.",
  explanation: "Current in a coil makes a magnetic field, and an iron core multiplies it. The pull on a steel load grows with the square of the field, so doubling the current quadruples the force, until the iron saturates near 1.6 T and extra current just makes heat. Beyond that, the only way to pull harder is a larger pole area. The same ampere-turns can come from many turns at low current or few turns at high current, but the heat I²R grows with current, so more turns with less current is more efficient.",
  assumptions: "A uniform field in the core with a constant effective permeability (real iron varies, and air gaps reduce it), a hard saturation limit of 1.6 T, a horseshoe magnet with two pole faces in contact with the load, and steady current. Coil wire is copper, 1 mm² with 0.4 m per turn.",
  learningObjectives: ["Find the field of a solenoid from turns, current and length.", "Use F = B²A/μ₀ to find magnetic pull and see why saturation matters.", "Trade turns against current to limit coil heating."],
  objective: { title: "Lift every load", description: "Lift each load within the limits.", unit: "loads" },
  controlsHeading: "Design the magnet",
  submitLabel: "Energise and lift",
  solvedLabel: "Load lifted!",
  nextLabel: "Next load",
};

export const CRANE_ROUNDS: readonly CraneRound[] = Object.freeze([
  {
    id: "scrap-bin", title: "Lift a scrap bin", difficulty: "Beginner", loadKilograms: 1000, maximumForceRatio: 1.25, maximumPowerWatts: null,
    situation: "Lift a 1,000 kg steel bin with a magnet of 1,000 turns and 0.01 m² of pole area. The pull must be between 1.0 and 1.25 times its weight. Choose the current.",
    controls: [fixed("turns", "Turns", "", 1000), fixed("area", "Pole area", "m²", 0.01), slider("current", "Coil current", "A", 0.1, 3, 0.01, 1)],
    hint: "Weight is 1000 g ≈ 9.8 kN. F = B²A/μ₀ gives the field needed, then I = B L/(μ₀ μᵣ N).",
  },
  {
    id: "power-limit", title: "Mind the heat", difficulty: "Intermediate", loadKilograms: 1800, maximumForceRatio: 1.3, maximumPowerWatts: 30,
    situation: "Lift 1,800 kg with a 0.01 m² magnet, but the coil may dissipate at most 30 W. Choose the number of turns and the current.",
    controls: [slider("turns", "Turns", "", 200, 3000, 10, 1000), fixed("area", "Pole area", "m²", 0.01), slider("current", "Coil current", "A", 0.1, 6, 0.01, 1)],
    hint: "The field depends on the product N·I (ampere-turns), but the heat is I²R with R proportional to N. For the same N·I, more turns means less current and much less heat.",
  },
  {
    id: "saturation", title: "Beat saturation", difficulty: "Advanced", loadKilograms: 3000, maximumForceRatio: 1.5, maximumPowerWatts: 40,
    situation: "Lift 3,000 kg, with 1,500 turns on the coil and a 40 W heating limit. Iron saturates at 1.6 T, so a bigger pole area is needed. Choose the area and current.",
    controls: [fixed("turns", "Turns", "", 1500), slider("area", "Pole area", "m²", 0.005, 0.03, 0.001, 0.015), slider("current", "Coil current", "A", 0.1, 4, 0.01, 1)],
    hint: "At 1.6 T the pull is 2 × 1.6² A /(2μ₀) = 2.04 MN/m² × A. Make that exceed the weight, then check the current is high enough to reach saturation but within the heating limit.",
  },
]);

export function runCrane(round: CraneRound, v: NumericControl): CraneOutcome {
  const turns = v.turns as number;
  const current = v.current as number;
  const area = v.area as number;
  const raw = calculateSolenoidField(turns, current, CORE_LENGTH, RELATIVE_PERMEABILITY, 1e9);
  const fieldTesla = Math.min(raw, IRON_SATURATION_TESLA);
  const forceNewtons = calculateMagneticPullForce(fieldTesla, area);
  const weight = round.loadKilograms * STANDARD_GRAVITY;
  const forceRatio = forceNewtons / weight;
  const powerWatts = calculateHeatingPower(current, calculateCoilResistance(turns, MEAN_TURN_LENGTH, WIRE_AREA));
  const liftOk = forceRatio >= 1 && forceRatio <= round.maximumForceRatio;
  const powerOk = round.maximumPowerWatts === null || powerWatts <= round.maximumPowerWatts;
  const success = liftOk && powerOk;
  const problems: string[] = [];
  if (forceRatio < 1) problems.push(`The magnet pulls with ${(forceNewtons / 1000).toFixed(1)} kN but the load weighs ${(weight / 1000).toFixed(1)} kN.${raw > IRON_SATURATION_TESLA ? " The iron is already saturated, so more current will not help: use a larger pole area." : ""}`);
  if (forceRatio > round.maximumForceRatio) problems.push(`The pull is ${forceRatio.toFixed(2)} times the weight, above the ${round.maximumForceRatio} allowed. Use less current.`);
  if (!powerOk) problems.push(`The coil dissipates ${powerWatts.toFixed(0)} W, above the ${round.maximumPowerWatts} W limit. More turns with less current runs cooler.`);
  return {
    success, fieldTesla, forceNewtons, forceRatio, powerWatts, saturated: raw >= IRON_SATURATION_TESLA,
    accuracyFraction: success ? Math.max(0, 1 - (forceRatio - 1) / (round.maximumForceRatio - 1)) : 0,
    predictionActual: forceNewtons / 1000,
    feedback: success ? `Lifted! ${(forceNewtons / 1000).toFixed(1)} kN of pull (${forceRatio.toFixed(2)}× the weight) at ${powerWatts.toFixed(1)} W.` : problems.join(" "),
  };
}

export function forceCurve(round: CraneRound, v: NumericControl): { x: number; y: number }[] {
  const spec = round.controls.find((c) => c.key === "current")!;
  return Array.from({ length: 41 }, (_, i) => {
    const current = spec.minimum + ((spec.maximum - spec.minimum) * i) / 40;
    return { x: current, y: runCrane(round, { ...v, current }).forceNewtons / 1000 };
  });
}

export const electromagneticCrane = defineNumericGame<CraneRound, CraneOutcome>({
  meta: CRANE_META,
  rounds: CRANE_ROUNDS,
  prediction: () => ({ label: "Your prediction of the magnetic pull", unit: "kN", placeholder: "e.g. 10", step: 0.1 }),
  evaluate: (round, values) => runCrane(round, values),
});
