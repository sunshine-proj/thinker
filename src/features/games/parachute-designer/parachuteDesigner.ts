import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateTerminalSpeed, simulateParachuteFall, type FallResult } from "../../../physics/mechanics";

export interface ParachuteRound extends NumericRound {
  readonly massKilograms: number;
  readonly initialAltitudeMeters: number;
  /** Round 1 judges the terminal speed against a target ± tolerance; others set a maximum landing speed. */
  readonly goal: { readonly targetSpeed?: number; readonly toleranceSpeed?: number; readonly maximumLandingSpeed?: number; readonly maximumFabricArea?: number; readonly maximumTotalTime?: number };
  readonly predictionKind: "terminalSpeed" | "fallTime";
}

export interface ParachuteOutcome extends AttemptOutcome {
  readonly fall: FallResult;
  readonly terminalSpeed: number;
  readonly canopyAreaSquareMeters: number;
}

export const CANOPY_DRAG_COEFFICIENT = 1.5;
export const BODY_DRAG_AREA = 0.7;

export const PARACHUTE_META: RoundGameMeta = {
  id: "parachute-designer",
  title: "Parachute Designer",
  eyebrow: "MECHANICS · FORCES & DRAG",
  modelTag: "QUADRATIC AIR DRAG",
  introduction: "Size a parachute canopy so a jumper or a crate lands at a safe speed, and decide when to open it.",
  instructions: "Predict the result, choose the canopy diameter (and when it opens), then jump. The graph shows the falling speed settling at the terminal speed.",
  formula: "F = ½ρC_dAv²  ·  v_t = √(2mg / (ρC_dA))",
  formulaCaption: "ρ = 1.225 kg/m³ is air density, C_d the drag coefficient (1.5 for the canopy), A the canopy area, m the mass. At terminal speed v_t, drag equals weight.",
  explanation: "As speed grows, air drag grows with its square, until drag equals weight and the fall stops accelerating. That terminal speed depends on the square root of mass over canopy area, so to halve the landing speed you need four times the area. Opening a canopy at high speed slows you rapidly because the drag is then huge, while a canopy opened too low has no room to slow you down.",
  assumptions: "Air density is constant, the fall is vertical, and the canopy opens instantly and fully (real canopies take seconds and add an opening shock). The jumper's body drag is a fixed C_dA of 0.7 m².",
  learningObjectives: ["Relate drag to speed, area and air density.", "Find terminal speed by balancing drag against weight.", "See how deployment height trades landing speed against time in the air."],
  objective: { title: "Land safely", description: "Meet every landing requirement.", unit: "jumps" },
  controlsHeading: "Design the parachute",
  submitLabel: "Jump!",
  solvedLabel: "Safe landing!",
  nextLabel: "Next jump",
};

export const PARACHUTE_ROUNDS: readonly ParachuteRound[] = Object.freeze([
  {
    id: "first-jump", title: "The first jump", difficulty: "Beginner", massKilograms: 80, initialAltitudeMeters: 500, predictionKind: "terminalSpeed",
    situation: "An 80 kg jumper opens a round canopy (C_d = 1.5) straight away. Choose the diameter so the terminal speed is 5.5 m/s (± 0.5 m/s).",
    goal: { targetSpeed: 5.5, toleranceSpeed: 0.5 },
    controls: [slider("diameter", "Canopy diameter", "m", 2, 12, 0.1, 7), fixed("deploy", "Deployment altitude", "m", 500)],
    hint: "Set weight equal to drag: A = 2mg/(ρ C_d v²), then d = √(4A/π).",
  },
  {
    id: "cargo-drop", title: "Cargo drop", difficulty: "Intermediate", massKilograms: 250, initialAltitudeMeters: 500, predictionKind: "terminalSpeed",
    situation: "A 250 kg crate must land at 7 m/s or slower, but the canopy fabric is limited to 70 m² (a 9.4 m diameter). Pick the diameter.",
    goal: { maximumLandingSpeed: 7, maximumFabricArea: 70 },
    controls: [slider("diameter", "Canopy diameter", "m", 4, 15, 0.1, 8), fixed("deploy", "Deployment altitude", "m", 500)],
    hint: "Heavier loads need a bigger canopy: A ≥ 2mg/(ρ C_d v²). Compare the area with the 70 m² limit.",
  },
  {
    id: "timed-descent", title: "A timed descent", difficulty: "Advanced", massKilograms: 80, initialAltitudeMeters: 1000, predictionKind: "fallTime",
    situation: "Jump from 1,000 m and land at 6.5 m/s or slower, but be on the ground within 50 s. Safety rules forbid opening below 150 m. Choose the canopy diameter and the altitude where you open it.",
    goal: { maximumLandingSpeed: 6.5, maximumTotalTime: 50 },
    controls: [slider("diameter", "Canopy diameter", "m", 3, 10, 0.1, 6), slider("deploy", "Deployment altitude", "m", 150, 800, 5, 400)],
    hint: "A smaller canopy falls faster, saving time, but must still slow you to 6.5 m/s. Opening later saves time under the slow canopy, but not below the 150 m safety floor (a real canopy needs seconds to open).",
  },
]);

export function runJump(round: ParachuteRound, v: NumericControl): ParachuteOutcome {
  const diameter = v.diameter as number;
  const area = (Math.PI * diameter ** 2) / 4;
  const canopyDragArea = CANOPY_DRAG_COEFFICIENT * area;
  const fall = simulateParachuteFall({
    massKilograms: round.massKilograms, bodyDragAreaSquareMeters: BODY_DRAG_AREA, canopyDragAreaSquareMeters: canopyDragArea,
    initialAltitudeMeters: round.initialAltitudeMeters, deployAltitudeMeters: v.deploy as number,
  });
  const terminalSpeed = calculateTerminalSpeed(round.massKilograms, canopyDragArea);
  const { goal } = round;
  const landing = fall.touchdownSpeedMetersPerSecond;
  const problems: string[] = [];
  let accuracy = 1;

  if (goal.targetSpeed !== undefined) {
    const error = Math.abs(landing - goal.targetSpeed);
    if (error > (goal.toleranceSpeed as number)) problems.push(`Landing at ${landing.toFixed(1)} m/s, ${landing > goal.targetSpeed ? "too fast" : "too slow"} for the ${goal.targetSpeed} m/s target.`);
    accuracy = 1 - error / (goal.toleranceSpeed as number);
  }
  if (goal.maximumLandingSpeed !== undefined) {
    if (landing > goal.maximumLandingSpeed) problems.push(`Landing at ${landing.toFixed(1)} m/s, above the ${goal.maximumLandingSpeed} m/s limit. A bigger canopy, or opening higher, slows you more.`);
    accuracy = Math.min(accuracy, landing / goal.maximumLandingSpeed);
  }
  if (goal.maximumFabricArea !== undefined && area > goal.maximumFabricArea) {
    problems.push(`The canopy needs ${area.toFixed(0)} m² of fabric, over the ${goal.maximumFabricArea} m² limit.`);
  }
  if (goal.maximumTotalTime !== undefined && fall.totalTimeSeconds > goal.maximumTotalTime) {
    problems.push(`The descent takes ${fall.totalTimeSeconds.toFixed(0)} s, longer than ${goal.maximumTotalTime} s. A smaller canopy or a later opening is quicker.`);
  }
  const success = problems.length === 0;
  return {
    success, fall, terminalSpeed, canopyAreaSquareMeters: area,
    accuracyFraction: success ? Math.max(0, Math.min(1, accuracy)) : 0,
    predictionActual: round.predictionKind === "terminalSpeed" ? terminalSpeed : fall.totalTimeSeconds,
    feedback: success ? `Landed at ${landing.toFixed(1)} m/s after ${fall.totalTimeSeconds.toFixed(0)} s.` : problems.join(" "),
  };
}

export const parachuteDesigner = defineNumericGame<ParachuteRound, ParachuteOutcome>({
  meta: PARACHUTE_META,
  rounds: PARACHUTE_ROUNDS,
  prediction: (round) =>
    round.predictionKind === "terminalSpeed"
      ? { label: "Your prediction of the terminal speed under the canopy", unit: "m/s", placeholder: "e.g. 6", step: 0.1 }
      : { label: "Your prediction of the total time in the air", unit: "s", placeholder: "e.g. 50", step: 1 },
  evaluate: (round, values) => runJump(round, values),
});
