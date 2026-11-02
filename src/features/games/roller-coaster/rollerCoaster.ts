import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { STANDARD_GRAVITY } from "../../../physics/core";
import { calculateBottomGForce, calculateSpeedSquared, calculateTopGForce } from "../../../physics/mechanics";

export interface CoasterRound extends NumericRound {
  readonly frictionCoefficient: number;
  /** Track length (m) over which friction acts before the loop. */
  readonly frictionPathMeters: number;
  readonly maximumBottomG: number;
  readonly minimumTopG: number;
}

export interface TrackPoint { readonly label: string; readonly heightMeters: number; readonly speed: number | null; readonly gForce: number | null }

export interface CoasterOutcome extends AttemptOutcome {
  readonly points: readonly TrackPoint[];
  readonly bottomSpeed: number | null;
  readonly bottomG: number | null;
  readonly topG: number | null;
}

export const ROLLER_META: RoundGameMeta = {
  id: "roller-coaster",
  title: "Roller Coaster Engineer",
  eyebrow: "MECHANICS · ENERGY & CIRCULAR MOTION",
  modelTag: "ENERGY CONSERVATION · LOOP SAFETY",
  introduction: "Design the first hill of a roller coaster so the car has just enough energy to loop the loop, without crushing the riders at the bottom.",
  instructions: "Predict the speed at the bottom of the loop, set the hill height (and loop radius where allowed), then release the car. It must stay on the track at the top (seat force ≥ the minimum) without exceeding the g-force limit at the bottom.",
  formula: "½v² + gh = const  ·  v²_top ≥ gR  ·  N/mg = 1 + v²/(gR) (bottom)",
  formulaCaption: "Height h and speed v are linked by energy conservation (less friction loss). R is the loop radius. The g-force is the seat force divided by the rider's weight.",
  explanation: "Gravitational potential energy at the top of the first hill turns into kinetic energy at the bottom. Climbing the loop turns it back into height, so the car arrives at the top with less speed. To stay on the track the car must still move at v ≥ √(gR) there, so that gravity alone supplies the centripetal force. At the bottom of the loop the seat must supply the centripetal force and carry the rider's weight, so riders feel heavy: more speed means a larger g-force. Friction removes energy, so a real coaster needs a taller hill.",
  assumptions: "The car is a point mass on a track with constant rolling resistance (a friction coefficient over a stated track length) and no air drag. The loop is circular and entered at its lowest point.",
  learningObjectives: ["Apply conservation of energy to find speeds at different heights.", "Find the minimum speed to complete a vertical loop.", "Calculate the g-forces at the top and bottom of a loop."],
  objective: { title: "Open every coaster", description: "Pass the safety checks for each design.", unit: "coasters" },
  controlsHeading: "Design the ride",
  submitLabel: "Release the car",
  solvedLabel: "Ride approved!",
  nextLabel: "Next coaster",
};

export const COASTER_ROUNDS: readonly CoasterRound[] = Object.freeze([
  {
    id: "frictionless", title: "A first loop", difficulty: "Beginner", frictionCoefficient: 0, frictionPathMeters: 0, maximumBottomG: 6.5, minimumTopG: 0,
    situation: "A car starts from rest at the top of a hill and enters a loop of radius 10 m, with no friction. Choose the hill height so it just clears the top but riders feel at most 6.5 g at the bottom.",
    controls: [slider("height", "Hill height", "m", 5, 40, 0.1, 20), fixed("radius", "Loop radius", "m", 10)],
    hint: "The car needs v² ≥ gR at the top (height 2R). Energy: v² = 2g(h − 2R) there. Check the bottom g-force: 1 + 2h/R.",
  },
  {
    id: "with-friction", title: "Friction takes its toll", difficulty: "Intermediate", frictionCoefficient: 0.02, frictionPathMeters: 150, maximumBottomG: 6.5, minimumTopG: 0,
    situation: "The same loop (R = 10 m), but now rolling friction (μ = 0.02) acts over 150 m of track before the loop. Choose the hill height.",
    controls: [slider("height", "Hill height", "m", 5, 40, 0.1, 20), fixed("radius", "Loop radius", "m", 10)],
    hint: "Friction costs energy equal to μ g s, the same as lowering the start by μ s = 3 m. Add it to the frictionless answer.",
  },
  {
    id: "design-both", title: "Hill and loop", difficulty: "Advanced", frictionCoefficient: 0.02, frictionPathMeters: 150, maximumBottomG: 6.5, minimumTopG: 0.3,
    situation: "Choose both the hill height and the loop radius. Riders should be pressed into their seats at the top with at least 0.3 g, but feel no more than 6.5 g at the bottom (the bottom force always exceeds the top force by exactly 6 g, so this leaves a narrow window). Friction acts as before (μ = 0.02 over 150 m).",
    controls: [slider("height", "Hill height", "m", 10, 60, 0.1, 30), slider("radius", "Loop radius", "m", 5, 20, 0.5, 10)],
    hint: "At the top the seat force is v²/(gR) − 1 times weight, and the bottom g-force is 1 + v_b²/(gR). Both depend on v_b² = 2g(h − μs).",
  },
]);

export function runCoaster(round: CoasterRound, v: NumericControl): CoasterOutcome {
  const h = v.height as number;
  const R = v.radius as number;
  const g = STANDARD_GRAVITY;
  const bottomSquared = calculateSpeedSquared(0, h, 0, round.frictionCoefficient, round.frictionPathMeters);
  const base = { points: [] as TrackPoint[], bottomSpeed: null, bottomG: null, topG: null, predictionActual: null as number | null };

  if (bottomSquared <= 0) {
    return { ...base, success: false, accuracyFraction: 0, predictionActual: 0, feedback: "Friction uses up all the energy before the car reaches the loop. Build a taller hill.",
      points: [{ label: "Top of hill", heightMeters: h, speed: 0, gForce: null }] };
  }
  const bottomSpeed = Math.sqrt(bottomSquared);
  const topSquared = bottomSquared - 4 * g * R;
  const bottomG = calculateBottomGForce(bottomSpeed, R);
  const reachesTop = topSquared > 0;
  const topSpeed = reachesTop ? Math.sqrt(topSquared) : 0;
  const topG = reachesTop ? calculateTopGForce(topSpeed, R) : -1;
  const points: TrackPoint[] = [
    { label: "Top of hill", heightMeters: h, speed: 0, gForce: null },
    { label: "Bottom of loop", heightMeters: 0, speed: bottomSpeed, gForce: bottomG },
    { label: "Top of loop", heightMeters: 2 * R, speed: reachesTop ? topSpeed : null, gForce: reachesTop ? topG : null },
  ];
  const topOk = reachesTop && topG >= round.minimumTopG;
  const bottomOk = bottomG <= round.maximumBottomG;
  const success = topOk && bottomOk;
  // The seat force at the top must lie in [minimum, maximum bottom − 6]; centre of that window scores best.
  const windowLow = round.minimumTopG;
  const windowHigh = round.maximumBottomG - 6;
  const windowCentre = (windowLow + windowHigh) / 2;
  const windowHalf = (windowHigh - windowLow) / 2;
  const problems: string[] = [];
  if (!topOk) problems.push(reachesTop ? `At the top of the loop the seat force is only ${topG.toFixed(2)} g, below the required ${round.minimumTopG} g: the car is too slow there.` : "The car runs out of speed before the top of the loop and falls off the track. Build a taller hill.");
  if (!bottomOk) problems.push(`Riders feel ${bottomG.toFixed(1)} g at the bottom, above the ${round.maximumBottomG} g limit. Lower the hill or widen the loop.`);
  return {
    success, points, bottomSpeed, bottomG, topG: reachesTop ? topG : null,
    accuracyFraction: success ? Math.max(0, 1 - Math.abs(topG - windowCentre) / windowHalf) : 0,
    predictionActual: bottomSpeed,
    feedback: success ? `The car clears the loop: ${topG.toFixed(2)} g at the top and ${bottomG.toFixed(1)} g at the bottom.` : problems.join(" "),
  };
}

export const rollerCoaster = defineNumericGame<CoasterRound, CoasterOutcome>({
  meta: ROLLER_META,
  rounds: COASTER_ROUNDS,
  prediction: () => ({ label: "Your prediction of the speed at the bottom of the loop", unit: "m/s", placeholder: "e.g. 22", step: 0.1 }),
  evaluate: (round, values) => runCoaster(round, values),
});
