import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { ATMOSPHERIC_PRESSURE, FRESH_WATER_DENSITY, SEAWATER_DENSITY } from "../../../physics/core";
import { calculateDepthForGaugePressure, calculateForceOnSurface, calculatePressure } from "../../../physics/fluids";

export type PressureKind = "diver" | "window" | "tower";

export interface PressureRound extends NumericRound { readonly kind: PressureKind }

export interface PressureOutcome extends AttemptOutcome {
  readonly absolutePa: number;
  readonly gaugePa: number;
  readonly forceNewtons: number | null;
}

export const DIVER_TARGET_ATM = 3;
export const DIVER_TOLERANCE_M = 0.5;
export const WINDOW_RADIUS = 0.15;
export const WINDOW_AREA = Math.PI * WINDOW_RADIUS ** 2;
export const WINDOW_LIMIT_N = 50_000;
export const TOWER_TARGET_PA = 300_000;
export const TOWER_TOLERANCE_M = 0.6;

export const PRESSURE_META: RoundGameMeta = {
  id: "water-pressure",
  title: "Water Pressure",
  eyebrow: "FLUID MECHANICS · PRESSURE",
  modelTag: "HYDROSTATIC PRESSURE",
  introduction: "Pressure grows steadily with depth. Find the depth where a diver feels three atmospheres, dive a submarine as deep as its window allows, and raise a water tower to the height that gives a house the right tap pressure.",
  instructions: "Predict, then set the depth or height. The pressure at a point in still water depends only on the depth below the surface, the water's density and gravity, not on the shape of the container.",
  formula: "P = P₀ + ρgh  ·  F = ρ g h_c A",
  formulaCaption: "P₀ is the pressure at the surface (101 325 Pa for air), ρ the water density, g = 9.81 m/s², h the depth. F is the force on a flat window of area A whose center is at depth h_c.",
  explanation: "Each layer of water must support the weight of all the water above it, so pressure rises linearly with depth by about 10 kPa for every meter of fresh water: after about 10 m the pressure has doubled from one atmosphere to two. This pressure pushes on every surface in contact, so a submarine window feels a force equal to the pressure at its center times its area. Pressure depends only on height, not on the volume of water, which is why a narrow pipe from a tall water tower delivers the same pressure as a wide one, and why the water level in connected pipes equalizes.",
  assumptions: "Still, incompressible water of uniform density (1000 kg/m³ fresh, 1025 kg/m³ sea), constant gravity, atmospheric pressure of 101 325 Pa at the surface, and a window small enough that the pressure at its center is a good average. Flow, waves and temperature layers are ignored.",
  learningObjectives: ["Calculate absolute and gauge pressure at a given depth.", "Find the force on a submerged surface.", "Explain why water towers work and why pressure depends only on height."],
  objective: { title: "Master pressure", description: "Solve each pressure problem.", unit: "problems" },
  controlsHeading: "Set the depth",
  submitLabel: "Measure the pressure",
  solvedLabel: "Pressure measured!",
  nextLabel: "Next problem",
};

export const PRESSURE_ROUNDS: readonly PressureRound[] = Object.freeze([
  {
    id: "the-diver", title: "The diver", difficulty: "Beginner", kind: "diver",
    situation: `In seawater (${SEAWATER_DENSITY} kg/m³) a diver feels an absolute pressure of ${DIVER_TARGET_ATM} atmospheres (${DIVER_TARGET_ATM * ATMOSPHERIC_PRESSURE} Pa). At what depth? (± ${DIVER_TOLERANCE_M} m)`,
    controls: [fixed("density", "Water density", "kg/m³", SEAWATER_DENSITY), slider("depth", "Depth", "m", 0, 100, 0.1, 10)],
    hint: "Three atmospheres in total means two atmospheres from the water: ρgh = 2 × 101 325 Pa.",
  },
  {
    id: "the-submarine-window", title: "The submarine window", difficulty: "Intermediate", kind: "window",
    situation: `A circular window of diameter 0.30 m can bear a net force of at most ${WINDOW_LIMIT_N / 1000} kN from the water. Dive as deep as you safely can in seawater: the force must be between 95 % and 100 % of the limit.`,
    controls: [fixed("density", "Water density", "kg/m³", SEAWATER_DENSITY), slider("depth", "Depth of the window", "m", 0, 150, 0.5, 30)],
    hint: "F = ρ g h A with A = π(0.15 m)². Solve F = 50 kN for h.",
  },
  {
    id: "the-water-tower", title: "The water tower", difficulty: "Advanced", kind: "tower",
    situation: `A tap at ground level should have a gauge pressure of ${TOWER_TARGET_PA / 1000} kPa. Choose the height of the water surface in the tower above the tap (± ${TOWER_TOLERANCE_M} m).`,
    controls: [fixed("density", "Water density", "kg/m³", FRESH_WATER_DENSITY), slider("depth", "Height of the water above the tap", "m", 5, 60, 0.5, 20)],
    hint: "Pressure depends only on height: ρgh = 300 000 Pa.",
  },
]);

export function runPressure(round: PressureRound, v: NumericControl): PressureOutcome {
  const density = v.density as number;
  const depth = v.depth as number;
  const absolute = calculatePressure(depth, density);
  const gauge = absolute - ATMOSPHERIC_PRESSURE;
  if (round.kind === "diver") {
    const target = calculateDepthForGaugePressure((DIVER_TARGET_ATM - 1) * ATMOSPHERIC_PRESSURE, density);
    const error = Math.abs(depth - target);
    const success = error <= DIVER_TOLERANCE_M;
    return {
      absolutePa: absolute, gaugePa: gauge, forceNewtons: null, success, accuracyFraction: success ? 1 - error / DIVER_TOLERANCE_M : 0, predictionActual: target,
      feedback: success ? `At ${depth.toFixed(1)} m the water adds ${(gauge / 1000).toFixed(0)} kPa to the atmosphere: ${(absolute / ATMOSPHERIC_PRESSURE).toFixed(2)} atm.`
        : `At ${depth.toFixed(1)} m the diver feels ${(absolute / ATMOSPHERIC_PRESSURE).toFixed(2)} atm, ${absolute > DIVER_TARGET_ATM * ATMOSPHERIC_PRESSURE ? "more" : "less"} than ${DIVER_TARGET_ATM}.`,
    };
  }
  if (round.kind === "window") {
    const force = calculateForceOnSurface(depth, WINDOW_AREA, density);
    const maxDepth = calculateDepthForGaugePressure(WINDOW_LIMIT_N / WINDOW_AREA, density);
    const success = force <= WINDOW_LIMIT_N && force >= 0.95 * WINDOW_LIMIT_N;
    return {
      absolutePa: absolute, gaugePa: gauge, forceNewtons: force, success, accuracyFraction: success ? (force / WINDOW_LIMIT_N - 0.95) / 0.05 : 0, predictionActual: maxDepth,
      feedback: success ? `At ${depth} m the net force on the window is ${(force / 1000).toFixed(1)} kN, just under the ${WINDOW_LIMIT_N / 1000} kN limit. The deepest safe depth is ${maxDepth.toFixed(1)} m.`
        : force > WINDOW_LIMIT_N ? `The force ${(force / 1000).toFixed(1)} kN exceeds the limit of ${WINDOW_LIMIT_N / 1000} kN: the window would fail.`
        : `The window is safe at ${(force / 1000).toFixed(1)} kN, but you can dive deeper: the limit is ${maxDepth.toFixed(1)} m.`,
    };
  }
  const target = calculateDepthForGaugePressure(TOWER_TARGET_PA, density);
  const error = Math.abs(depth - target);
  const success = error <= TOWER_TOLERANCE_M;
  return {
    absolutePa: absolute, gaugePa: gauge, forceNewtons: null, success, accuracyFraction: success ? 1 - error / TOWER_TOLERANCE_M : 0, predictionActual: target,
    feedback: success ? `A ${depth} m column gives ${(gauge / 1000).toFixed(0)} kPa at the tap, whatever the width of the pipe.`
      : `${depth} m gives ${(gauge / 1000).toFixed(0)} kPa at the tap, ${gauge > TOWER_TARGET_PA ? "too high" : "too low"} for the ${TOWER_TARGET_PA / 1000} kPa needed.`,
  };
}

export const waterPressure = defineNumericGame<PressureRound, PressureOutcome>({
  meta: PRESSURE_META,
  rounds: PRESSURE_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "tower" ? { label: "Your prediction of the height needed", unit: "m", placeholder: "e.g. 30.6", step: 0.1 }
    : round.kind === "window" ? { label: "Your prediction of the deepest safe depth", unit: "m", placeholder: "e.g. 70", step: 0.1 }
    : { label: "Your prediction of the depth", unit: "m", placeholder: "e.g. 20", step: 0.1 },
  evaluate: (round, values) => runPressure(round, values),
});
