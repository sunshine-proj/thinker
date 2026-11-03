import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateApoapsisAfterBurn, calculateHohmannTransfer } from "../../../physics/astronomy";
import { ASTRONOMICAL_UNIT as AU, SUN_GRAVITATIONAL_PARAMETER as MU } from "../../../physics/core";

export type MissionKind = "apoapsis" | "burn" | "window";

export interface MissionRound extends NumericRound { readonly kind: MissionKind }

export interface MissionOutcome extends AttemptOutcome {
  readonly apoapsisAu: number | null;
  readonly transferDays: number | null;
  readonly departureDeltaV: number;
  readonly leadAngleDegrees: number;
  readonly requiredLeadDegrees: number;
}

export const EARTH_ORBIT_AU = 1;
export const ASTEROID_ORBIT_AU = 1.5;
export const APOAPSIS_TOLERANCE_AU = 0.03;
export const BURN_TOLERANCE_AU = 0.05;
export const LEAD_TOLERANCE_DEGREES = 2;
const TRANSFER = calculateHohmannTransfer(MU, EARTH_ORBIT_AU * AU, ASTEROID_ORBIT_AU * AU);
export const EARTH_SPEED = Math.sqrt(MU / AU);
export const REQUIRED_LEAD_DEGREES = (TRANSFER.leadAngle * 180) / Math.PI;

export const MISSION_META: RoundGameMeta = {
  id: "asteroid-mission",
  title: "Asteroid Mission",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · TRANSFERS",
  modelTag: "HOHMANN TRANSFER ORBIT",
  introduction: "Send a probe from Earth's orbit to an asteroid circling the Sun at 1.5 AU. Shape the transfer ellipse, budget the engine burn, and pick the launch moment so the asteroid is there when you arrive.",
  instructions: "Predict, then plan. A Hohmann transfer is the cheapest two-burn path between circular orbits: one burn along your motion raises the far point of your orbit to the target, and you coast half an ellipse.",
  formula: "a = (r₁ + r₂)/2  ·  Δv₁ = √(μ/r₁)(√(2r₂/(r₁+r₂)) − 1)  ·  t = π√(a³/μ)  ·  θ = π − n₂t",
  formulaCaption: "r₁ and r₂ are the radii of the start and target orbits, μ the Sun's gravitational parameter, a the semi-major axis of the transfer ellipse, t the coasting time, n₂ the target's angular speed and θ the angle by which the target must lead the probe at launch.",
  explanation: "To climb to a higher orbit you speed up at the low point: the extra speed lifts the far side of your new ellipse until it touches the target orbit. Half an orbit later you arrive at the far point, travelling slower than the target, so a second burn circularizes. The coast takes half the ellipse's period by Kepler's third law. During that time the asteroid keeps moving, so you must launch when it is ahead of Earth by exactly the angle it will not have covered yet. That launch window repeats only every synodic period.",
  assumptions: "Two-body motion around the Sun only (the gravity of Earth and the asteroid is ignored), circular coplanar orbits at 1 AU and 1.5 AU, instantaneous burns and no plane change. Real missions use patched conics and fine-tune with correction burns.",
  learningObjectives: ["Describe the transfer ellipse between two circular orbits.", "Find the departure burn from the vis-viva equation.", "Time a launch window using the target's orbital motion."],
  objective: { title: "Plan the mission", description: "Complete each stage.", unit: "stages" },
  controlsHeading: "Plan the transfer",
  submitLabel: "Launch the probe",
  solvedLabel: "Probe on course!",
  nextLabel: "Next stage",
};

export const MISSION_ROUNDS: readonly MissionRound[] = Object.freeze([
  {
    id: "shape-the-orbit", title: "Shape the orbit", difficulty: "Beginner", kind: "apoapsis",
    situation: `The probe leaves Earth's orbit at 1 AU. Choose the farthest point of its transfer ellipse so that it just reaches the asteroid's orbit at 1.5 AU (± ${APOAPSIS_TOLERANCE_AU} AU).`,
    controls: [slider("apoapsis", "Far point of the transfer orbit", "AU", 1.05, 3, 0.01, 2)],
    hint: "The ellipse must touch both orbits, so its far point equals the asteroid's orbit radius.",
  },
  {
    id: "budget-the-burn", title: "Budget the burn", difficulty: "Intermediate", kind: "burn",
    situation: `Earth moves at ${(EARTH_SPEED / 1000).toFixed(2)} km/s. Choose the extra speed to add along its motion so that the far point of the new orbit lands on the asteroid's orbit at 1.5 AU (± ${BURN_TOLERANCE_AU} AU).`,
    controls: [slider("burn", "Departure burn", "km/s", 0, 14, 0.01, 1)],
    hint: "Use vis-viva: v² = μ(2/r − 1/a) at r = 1 AU with a = 1.25 AU, then subtract Earth's speed.",
  },
  {
    id: "wait-for-the-window", title: "Wait for the window", difficulty: "Advanced", kind: "window",
    situation: `The probe will coast about ${(TRANSFER.transferTime / 86400).toFixed(0)} days on the transfer ellipse. Choose the angle by which the asteroid must lead Earth at launch so the two meet at arrival (within ${LEAD_TOLERANCE_DEGREES}°).`,
    controls: [fixed("apoapsis", "Far point of the transfer orbit", "AU", ASTEROID_ORBIT_AU), slider("lead", "Asteroid's lead angle at launch", "°", 0, 180, 0.5, 90)],
    hint: "In the coasting time the asteroid moves through n₂t radians, where n₂ = 2π/T of its orbit. It must start ahead of the probe's half-turn (180°) by exactly that.",
  },
]);

export function runMission(round: MissionRound, v: NumericControl): MissionOutcome {
  const base = { leadAngleDegrees: round.kind === "window" ? (v.lead as number) : 0, requiredLeadDegrees: REQUIRED_LEAD_DEGREES };
  if (round.kind === "burn") {
    const burn = (v.burn as number) * 1000;
    const apo = calculateApoapsisAfterBurn(MU, AU, EARTH_SPEED + burn);
    const apoAu = apo === null ? null : apo / AU;
    const transfer = apoAu === null ? null : (Math.PI * Math.sqrt((((1 + apoAu) / 2) * AU) ** 3 / MU)) / 86400;
    const error = apoAu === null ? Infinity : Math.abs(apoAu - ASTEROID_ORBIT_AU);
    const success = error <= BURN_TOLERANCE_AU;
    return {
      ...base, apoapsisAu: apoAu, transferDays: transfer, departureDeltaV: burn, success, accuracyFraction: success ? 1 - error / BURN_TOLERANCE_AU : 0, predictionActual: TRANSFER.departureDeltaV / 1000,
      feedback: success ? `Adding ${(burn / 1000).toFixed(2)} km/s gives a far point of ${apoAu?.toFixed(2)} AU, on the asteroid's orbit.`
        : apoAu === null ? "That speed is above the Sun's escape speed at 1 AU: the probe leaves the Solar System instead of transferring."
        : `Adding ${(burn / 1000).toFixed(2)} km/s takes the probe out to ${apoAu.toFixed(2)} AU, ${apoAu > ASTEROID_ORBIT_AU ? "beyond" : "short of"} the asteroid at 1.5 AU.`,
    };
  }
  const apoAu = round.kind === "apoapsis" ? (v.apoapsis as number) : ASTEROID_ORBIT_AU;
  const transfer = calculateHohmannTransfer(MU, AU, apoAu * AU);
  const days = transfer.transferTime / 86400;
  const common = { ...base, apoapsisAu: apoAu, transferDays: days, departureDeltaV: transfer.departureDeltaV };
  if (round.kind === "apoapsis") {
    const error = Math.abs(apoAu - ASTEROID_ORBIT_AU);
    const success = error <= APOAPSIS_TOLERANCE_AU;
    return {
      ...common, success, accuracyFraction: success ? 1 - error / APOAPSIS_TOLERANCE_AU : 0, predictionActual: TRANSFER.transferTime / 86400,
      feedback: success ? `The ellipse (a = ${transfer.semiMajorAxis / AU} AU) touches both orbits. The probe needs ${(transfer.departureDeltaV / 1000).toFixed(2)} km/s to leave and coasts ${days.toFixed(0)} days.`
        : `The far point is ${apoAu.toFixed(2)} AU, ${apoAu > ASTEROID_ORBIT_AU ? "past the asteroid's orbit" : "short of the asteroid's orbit"}; the probe would not meet it.`,
    };
  }
  const lead = v.lead as number;
  const error = Math.abs(lead - REQUIRED_LEAD_DEGREES);
  const success = error <= LEAD_TOLERANCE_DEGREES;
  return {
    ...common, success, accuracyFraction: success ? 1 - error / LEAD_TOLERANCE_DEGREES : 0, predictionActual: REQUIRED_LEAD_DEGREES,
    feedback: success ? `The asteroid moves ${(180 - REQUIRED_LEAD_DEGREES).toFixed(1)}° during the ${days.toFixed(0)}-day coast, so starting ${lead.toFixed(1)}° ahead it arrives at the far point together with the probe.`
      : `Starting ${lead.toFixed(1)}° ahead, the asteroid is about ${(error * AU * ASTEROID_ORBIT_AU * Math.PI / 180 / AU).toFixed(2)} AU ${lead > REQUIRED_LEAD_DEGREES ? "ahead of" : "behind"} the probe on arrival. It should start ${REQUIRED_LEAD_DEGREES.toFixed(1)}° ahead.`,
  };
}

export const asteroidMission = defineNumericGame<MissionRound, MissionOutcome>({
  meta: MISSION_META,
  rounds: MISSION_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "apoapsis" ? { label: "Your prediction of the coasting time", unit: "days", placeholder: "e.g. 255", step: 1 }
    : round.kind === "burn" ? { label: "Your prediction of the burn needed", unit: "km/s", placeholder: "e.g. 2.8", step: 0.01 }
    : { label: "Your prediction of the lead angle needed", unit: "°", placeholder: "e.g. 43", step: 0.5 },
  evaluate: (round, values) => runMission(round, values),
});
