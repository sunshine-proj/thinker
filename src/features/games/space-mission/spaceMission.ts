import { defineNumericGame, slider, fixed, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateRocketDeltaV } from "../../../physics/mechanics";

export interface MissionRound extends NumericRound {
  readonly kind: "single" | "engine" | "staged";
  readonly targetDeltaV: number;
  /** Accepted overshoot above the target, as a fraction. */
  readonly overshootFraction: number;
  readonly maximumLaunchMassKilograms: number;
}

export interface StageResult { readonly label: string; readonly deltaV: number }

export interface MissionOutcome extends AttemptOutcome {
  readonly deltaV: number;
  readonly launchMassKilograms: number;
  readonly stages: readonly StageResult[];
}

export const SPACE_MISSION_META: RoundGameMeta = {
  id: "space-mission",
  title: "Space Mission",
  eyebrow: "MECHANICS · MOMENTUM & PROPULSION",
  modelTag: "TSIOLKOVSKY ROCKET EQUATION",
  introduction: "Load your spacecraft with just enough propellant to reach the speed change a mission needs, then trade engine efficiency against weight and try staging.",
  instructions: "Predict the speed change (delta-v), choose propellant (and engine or stage options), then launch. You must reach the target delta-v without exceeding the launch-mass limit.",
  formula: "Δv = Iₛₚ g₀ ln(m₀/m₁)",
  formulaCaption: "Iₛₚ is the engine's specific impulse (s), g₀ = 9.81 m/s², m₀ the mass at ignition and m₁ the mass after the propellant is burned.",
  explanation: "A rocket accelerates by throwing mass backward, so momentum is conserved. Because it must also carry the propellant it has not yet burned, the speed it gains grows only with the logarithm of the mass ratio: doubling the propellant adds far less than double the delta-v. An engine with higher specific impulse extracts more speed from each kilogram, but may be heavier. Staging discards empty tanks, so later propellant pushes a lighter vehicle.",
  assumptions: "The burn is treated as instantaneous in free space, ignoring gravity losses and drag. Specific impulse is constant, and stage and engine masses are simple game values, not real hardware.",
  learningObjectives: ["Apply the rocket equation Δv = Iₛₚ g₀ ln(m₀/m₁).", "See why more propellant gives diminishing returns.", "Understand how staging improves the mass ratio."],
  objective: { title: "Complete every mission", description: "Reach each mission's delta-v within the mass limit.", unit: "missions" },
  controlsHeading: "Load the spacecraft",
  submitLabel: "Launch the mission",
  solvedLabel: "Mission success!",
  nextLabel: "Next mission",
};

export const MISSION_ROUNDS: readonly MissionRound[] = Object.freeze([
  {
    id: "orbit-boost", title: "Orbit boost", difficulty: "Beginner", kind: "single",
    situation: "A 1,000 kg spacecraft (Iₛₚ = 320 s) must change its speed by 3,000 m/s (± 3%). How much propellant should it carry?",
    targetDeltaV: 3000, overshootFraction: 0.03, maximumLaunchMassKilograms: 6000,
    controls: [fixed("dry", "Dry mass", "kg", 1000), fixed("isp", "Specific impulse", "s", 320), slider("propellant", "Propellant mass", "kg", 200, 4000, 5, 1000)],
    hint: "Rearrange the rocket equation: m₀/m₁ = e^(Δv / (Iₛₚ g₀)), then propellant = m₁ (e^(…) − 1).",
  },
  {
    id: "engine-choice", title: "Choose the engine", difficulty: "Intermediate", kind: "engine",
    situation: "You must change speed by 5,200 m/s, up to 5% more, with a launch mass of at most 5,000 kg. A higher specific impulse engine saves propellant but is heavier: engine mass = 200 kg + 2 kg for every second of Iₛₚ above 250 s. The rest of the craft weighs 800 kg.",
    targetDeltaV: 5200, overshootFraction: 0.05, maximumLaunchMassKilograms: 5000,
    controls: [fixed("dry", "Structure and payload", "kg", 800), slider("isp", "Engine specific impulse", "s", 250, 450, 5, 300), slider("propellant", "Propellant mass", "kg", 500, 4200, 10, 2000)],
    hint: "Engine mass is 200 + 2(Iₛₚ − 250). A low-Iₛₚ engine needs more propellant than the limit allows, so try a high one.",
  },
  {
    id: "two-stage", title: "Two stages", difficulty: "Advanced", kind: "staged",
    situation: "A two-stage rocket must give a 150 kg payload 6,800 m/s of delta-v (up to 4% more) with a total launch mass of at most 5,000 kg. Stage 1: dry 500 kg, Iₛₚ 280 s. Stage 2: dry 250 kg, Iₛₚ 340 s. Choose the propellant in each stage.",
    targetDeltaV: 6800, overshootFraction: 0.04, maximumLaunchMassKilograms: 5000,
    controls: [fixed("payload", "Payload", "kg", 150), slider("propellant1", "Stage 1 propellant", "kg", 500, 4000, 10, 2500), slider("propellant2", "Stage 2 propellant", "kg", 100, 2000, 10, 1000)],
    hint: "Stage 1 burns first and then is dropped, so stage 2's rocket equation starts from payload + stage 2 dry + stage 2 propellant. Add both delta-v values.",
  },
]);

export function engineMass(isp: number): number {
  return 200 + 2 * (isp - 250);
}

export function runMission(round: MissionRound, v: NumericControl): MissionOutcome {
  let deltaV: number;
  let launchMass: number;
  let stages: StageResult[];
  if (round.kind === "staged") {
    const payload = v.payload as number;
    const m2Start = payload + 250 + (v.propellant2 as number);
    const m1Start = m2Start + 500 + (v.propellant1 as number);
    const d1 = calculateRocketDeltaV(280, m1Start, m1Start - (v.propellant1 as number));
    const d2 = calculateRocketDeltaV(340, m2Start, m2Start - (v.propellant2 as number));
    deltaV = d1 + d2;
    launchMass = m1Start;
    stages = [{ label: "Stage 1", deltaV: d1 }, { label: "Stage 2", deltaV: d2 }];
  } else {
    const isp = v.isp as number;
    const dry = (v.dry as number) + (round.kind === "engine" ? engineMass(isp) : 0);
    const prop = v.propellant as number;
    deltaV = calculateRocketDeltaV(isp, dry + prop, dry);
    launchMass = dry + prop;
    stages = [{ label: "Burn", deltaV }];
  }

  const target = round.targetDeltaV;
  // The single-stage tutorial accepts ± the tolerance; later rounds require reaching the target.
  const [low, high] = round.kind === "single"
    ? [target * (1 - round.overshootFraction), target * (1 + round.overshootFraction)]
    : [target, target * (1 + round.overshootFraction)];
  const massOk = launchMass <= round.maximumLaunchMassKilograms;
  const success = deltaV >= low && deltaV <= high && massOk;
  const error = round.kind === "single" ? Math.abs(deltaV - target) : deltaV - target;
  const window = round.kind === "single" ? target * round.overshootFraction : target * round.overshootFraction;
  return {
    success, deltaV, launchMassKilograms: launchMass, stages,
    accuracyFraction: success ? 1 - error / window : 0,
    predictionActual: deltaV,
    feedback: success
      ? `Delta-v ${deltaV.toFixed(0)} m/s from a launch mass of ${launchMass.toFixed(0)} kg.`
      : !massOk
        ? `The launch mass of ${launchMass.toFixed(0)} kg exceeds the ${round.maximumLaunchMassKilograms} kg limit. Carry less, or use a more efficient design.`
        : deltaV < low ? `Only ${deltaV.toFixed(0)} m/s: ${(target - deltaV).toFixed(0)} m/s short of the target. More propellant (or a better engine) is needed.` : `${deltaV.toFixed(0)} m/s overshoots the target window. Carry less propellant.`,
  };
}

/** Delta-v as the first propellant control sweeps its range, for the chart. */
export function deltaVCurve(round: MissionRound, v: NumericControl): { x: number; y: number }[] {
  const spec = round.controls.find((c) => c.key.startsWith("propellant")) as NonNullable<MissionRound["controls"][number]>;
  return Array.from({ length: 41 }, (_, i) => {
    const x = spec.minimum + ((spec.maximum - spec.minimum) * i) / 40;
    return { x, y: runMission(round, { ...v, [spec.key]: x }).deltaV };
  });
}

export const spaceMission = defineNumericGame<MissionRound, MissionOutcome>({
  meta: SPACE_MISSION_META,
  rounds: MISSION_ROUNDS,
  prediction: () => ({ label: "Your prediction of the delta-v", unit: "m/s", placeholder: "e.g. 3000", step: 1 }),
  evaluate: (round, values) => runMission(round, values),
});
