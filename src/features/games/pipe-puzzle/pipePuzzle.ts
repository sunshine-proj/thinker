import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import {
  calculateBernoulliPressureDrop,
  calculateDiameterForSpeed,
  calculatePoiseuilleFlow,
  calculateReynoldsNumber,
  calculateSpeedFromFlow,
  isLaminar,
} from "../../../physics/fluids";

export type PipeKind = "nozzle" | "venturi" | "oil";

export interface PipeRound extends NumericRound { readonly kind: PipeKind }

export interface PipeOutcome extends AttemptOutcome {
  /** Headline quantity: exit speed (m/s), pressure drop (Pa) or flow (m³/s). */
  readonly measured: number;
  readonly speed: number;
  readonly reynolds: number | null;
}

export const NOZZLE_FLOW = 0.002;
export const NOZZLE_TARGET_SPEED = 20;
export const NOZZLE_TOLERANCE = 1;
export const VENTURI_FLOW = 0.005;
export const PIPE_DIAMETER = 0.05;
export const VENTURI_TARGET_PA = 40_000;
export const VENTURI_TOLERANCE_PA = 1500;
export const OIL_DENSITY = 900;
export const OIL_VISCOSITY = 0.1;
export const OIL_LENGTH = 10;
export const OIL_PRESSURE = 50_000;
export const OIL_TARGET_FLOW = 0.001;
export const OIL_TOLERANCE = 0.05;

export const PIPE_META: RoundGameMeta = {
  id: "pipe-puzzle",
  title: "Pipe Puzzle",
  eyebrow: "FLUID MECHANICS · FLOW",
  modelTag: "CONTINUITY, BERNOULLI & POISEUILLE",
  introduction: "Route water and oil through pipes: size a fire-hose nozzle for a jet speed, narrow a pipe to create a measured pressure drop, and choose the width of an oil line that carries the right flow.",
  instructions: "Predict, set the diameter, then run the flow. Where a pipe narrows the fluid speeds up and its pressure falls; in a long thin pipe the flow is set by friction in the fluid.",
  formula: "Q = A v  ·  P₁ − P₂ = ½ρ(v₂² − v₁²)  ·  Q = πr⁴ΔP / (8μL)",
  formulaCaption: "Q is the volume flow rate, A the cross-section area, v the speed, ρ the density, μ the viscosity, r the pipe radius and L its length. The last law (Hagen–Poiseuille) holds for smooth laminar flow, with the Reynolds number ρvd/μ below 2000.",
  explanation: "What flows in must flow out: in steady flow of an incompressible fluid the same volume passes every cross-section each second, so halving the area doubles the speed. Faster fluid has more kinetic energy per kilogram, and with no friction the energy must come from pressure, so Bernoulli's principle says the pressure drops in the narrow throat. That is how a Venturi meter measures flow. A viscous fluid changes the picture: layers drag on each other and on the wall, so a pressure difference is needed even in a uniform pipe, and the flow depends on the radius to the fourth power: doubling the diameter multiplies the flow by sixteen. This law only holds while the flow stays smooth (laminar).",
  assumptions: "Steady, incompressible flow. Bernoulli neglects friction (valid in the short throat), and Hagen–Poiseuille applies only to fully developed laminar flow in a long, straight, smooth pipe, which is checked with the Reynolds number. Entrance effects and pipe bends are ignored.",
  learningObjectives: ["Apply the continuity equation to find speeds.", "Use Bernoulli's principle to find a pressure drop.", "Use Poiseuille's law and check that the flow is laminar."],
  objective: { title: "Solve the pipework", description: "Complete each pipe problem.", unit: "problems" },
  controlsHeading: "Size the pipe",
  submitLabel: "Open the valve",
  solvedLabel: "Flow correct!",
  nextLabel: "Next problem",
};

export const PIPE_ROUNDS: readonly PipeRound[] = Object.freeze([
  {
    id: "the-nozzle", title: "The nozzle", difficulty: "Beginner", kind: "nozzle",
    situation: `A hose delivers ${NOZZLE_FLOW * 1000} L/s. Choose the nozzle diameter so the water leaves at ${NOZZLE_TARGET_SPEED} m/s (± ${NOZZLE_TOLERANCE} m/s).`,
    controls: [fixed("flow", "Flow rate", "L/s", NOZZLE_FLOW * 1000), slider("diameter", "Nozzle diameter", "mm", 4, 30, 0.1, 20)],
    hint: "Continuity: Q = Av, so A = Q/v and d = √(4A/π).",
  },
  {
    id: "the-venturi", title: "The Venturi", difficulty: "Intermediate", kind: "venturi",
    situation: `Water flows at ${VENTURI_FLOW * 1000} L/s in a ${PIPE_DIAMETER * 1000} mm pipe that narrows to a throat. Choose the throat diameter so the pressure there is ${VENTURI_TARGET_PA / 1000} kPa below the pipe's (± ${VENTURI_TOLERANCE_PA / 1000} kPa).`,
    controls: [fixed("flow", "Flow rate", "L/s", VENTURI_FLOW * 1000), fixed("pipe", "Pipe diameter", "mm", PIPE_DIAMETER * 1000), slider("diameter", "Throat diameter", "mm", 10, 50, 0.1, 40)],
    hint: "Find v₁ in the pipe, then ½ρ(v₂² − v₁²) = 40 kPa gives v₂; the throat diameter follows from continuity.",
  },
  {
    id: "the-oil-line", title: "The oil line", difficulty: "Advanced", kind: "oil",
    situation: `A pump pushes oil (density ${OIL_DENSITY} kg/m³, viscosity ${OIL_VISCOSITY} Pa·s) through a ${OIL_LENGTH} m pipe with a pressure difference of ${OIL_PRESSURE / 1000} kPa. Choose the pipe diameter so that ${OIL_TARGET_FLOW * 1000} L/s flows (± ${OIL_TOLERANCE * 100} %) and the flow is laminar.`,
    controls: [fixed("length", "Pipe length", "m", OIL_LENGTH), fixed("pressure", "Pressure difference", "kPa", OIL_PRESSURE / 1000), slider("diameter", "Pipe diameter", "mm", 10, 60, 0.1, 20)],
    hint: "Q = πr⁴ΔP/(8μL) gives r⁴ = 8μLQ/(πΔP). Then check Re = ρvd/μ < 2000.",
  },
]);

export function runPipe(round: PipeRound, v: NumericControl): PipeOutcome {
  const d = (v.diameter as number) / 1000;
  if (round.kind === "nozzle") {
    const speed = calculateSpeedFromFlow(NOZZLE_FLOW, d);
    const error = Math.abs(speed - NOZZLE_TARGET_SPEED);
    const success = error <= NOZZLE_TOLERANCE;
    return {
      measured: speed, speed, reynolds: null, success, accuracyFraction: success ? 1 - error / NOZZLE_TOLERANCE : 0, predictionActual: calculateDiameterForSpeed(NOZZLE_FLOW, NOZZLE_TARGET_SPEED) * 1000,
      feedback: success ? `A ${(d * 1000).toFixed(1)} mm nozzle makes the ${NOZZLE_FLOW * 1000} L/s flow leave at v = Q/A = ${speed.toFixed(1)} m/s.`
        : `The water leaves at ${speed.toFixed(1)} m/s, ${speed > NOZZLE_TARGET_SPEED ? "too fast: widen the nozzle" : "too slow: narrow the nozzle"}.`,
    };
  }
  if (round.kind === "venturi") {
    const v1 = calculateSpeedFromFlow(VENTURI_FLOW, PIPE_DIAMETER);
    const v2 = calculateSpeedFromFlow(VENTURI_FLOW, d);
    const drop = calculateBernoulliPressureDrop(v1, v2, 1000);
    const target = calculateDiameterForSpeed(VENTURI_FLOW, Math.sqrt((2 * VENTURI_TARGET_PA) / 1000 + v1 ** 2));
    const error = Math.abs(drop - VENTURI_TARGET_PA);
    const success = d <= PIPE_DIAMETER && error <= VENTURI_TOLERANCE_PA;
    return {
      measured: drop, speed: v2, reynolds: null, success, accuracyFraction: success ? 1 - error / VENTURI_TOLERANCE_PA : 0, predictionActual: target * 1000,
      feedback: success ? `The speed rises from ${v1.toFixed(2)} to ${v2.toFixed(2)} m/s, so the pressure falls by ½ρ(v₂² − v₁²) = ${(drop / 1000).toFixed(1)} kPa.`
        : `The pressure drop is ${(drop / 1000).toFixed(1)} kPa (speed ${v2.toFixed(2)} m/s in the throat), ${drop > VENTURI_TARGET_PA ? "too large: widen the throat" : "too small: narrow the throat"}.`,
    };
  }
  const flow = calculatePoiseuilleFlow(d, OIL_LENGTH, OIL_VISCOSITY, OIL_PRESSURE);
  const speed = calculateSpeedFromFlow(flow, d);
  const reynolds = calculateReynoldsNumber(OIL_DENSITY, speed, d, OIL_VISCOSITY);
  const laminar = isLaminar(reynolds);
  const error = Math.abs(flow - OIL_TARGET_FLOW) / OIL_TARGET_FLOW;
  const success = laminar && error <= OIL_TOLERANCE;
  const targetD = 2 * ((8 * OIL_VISCOSITY * OIL_LENGTH * OIL_TARGET_FLOW) / (Math.PI * OIL_PRESSURE)) ** 0.25;
  return {
    measured: flow, speed, reynolds, success, accuracyFraction: success ? 1 - error / OIL_TOLERANCE : 0, predictionActual: targetD * 1000,
    feedback: success ? `Q = πr⁴ΔP/(8μL) = ${(flow * 1000).toFixed(3)} L/s, with Re = ${reynolds.toFixed(0)}: smooth laminar flow.`
      : !laminar ? `Re = ${reynolds.toFixed(0)} is above 2000: the flow would be turbulent, and Poiseuille's law (${(flow * 1000).toFixed(1)} L/s) overestimates it.`
      : `The flow is ${(flow * 1000).toFixed(3)} L/s, ${flow > OIL_TARGET_FLOW ? "too much: use a narrower pipe" : "too little: use a wider pipe"} (flow grows as d⁴).`,
  };
}

export const pipePuzzle = defineNumericGame<PipeRound, PipeOutcome>({
  meta: PIPE_META,
  rounds: PIPE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "nozzle" ? { label: "Your prediction of the nozzle diameter", unit: "mm", placeholder: "e.g. 11", step: 0.1 }
    : round.kind === "venturi" ? { label: "Your prediction of the throat diameter", unit: "mm", placeholder: "e.g. 26", step: 0.1 }
    : { label: "Your prediction of the pipe diameter", unit: "mm", placeholder: "e.g. 30", step: 0.1 },
  evaluate: (round, values) => runPipe(round, values),
});
