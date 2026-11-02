import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { Vector3 } from "../../../physics/core";
import { advanceChargedParticleBoris, getParticleSpecies } from "../../../physics/electromagnetism";

export interface MazeRound extends NumericRound {
  readonly particle: "electron" | "proton";
  /** Tesla per slider unit of the field control (1e-6 for µT, 1e-3 for mT). */
  readonly fieldScale: number;
  readonly arenaHalfSize: number;
  readonly target: { readonly x: number; readonly y: number; readonly radius: number };
}

export interface MazePath {
  readonly points: readonly { readonly x: number; readonly y: number }[];
  readonly closestApproach: number;
  readonly hit: boolean;
  readonly orbitRadius: number | null;
}

export interface MazeOutcome extends AttemptOutcome {
  readonly path: MazePath;
}

export const MAZE_META: RoundGameMeta = {
  id: "magnetic-maze",
  title: "Magnetic Maze",
  eyebrow: "ELECTRICITY & MAGNETISM · MAGNETIC FORCE",
  modelTag: "LORENTZ FORCE · BORIS INTEGRATOR",
  introduction: "Steer a beam of charged particles to a target using nothing but a magnetic field. The beam enters moving to the right; the field decides how it bends.",
  instructions: "Predict the radius of the circular path, set the magnetic field (and speed where allowed), then fire. The path is computed with a Lorentz-force simulation. Hit the target disc.",
  formula: "F = qv × B  ·  r = mv/(|q|B)",
  formulaCaption: "The magnetic force is always perpendicular to the velocity, so it bends the path into a circle of radius r without changing the speed. The field points out of the screen when positive.",
  explanation: "A magnetic force acts sideways to the motion, so it changes the direction of a charged particle but never its speed: the particle circles with radius r = mv/(|q|B). Stronger fields and lighter or slower particles give tighter circles. Positive and negative charges bend in opposite directions, and reversing the field reverses the bend. To reach a target at (x, y) from the origin, the circle must pass through it, which fixes r = (x² + y²)/(2y).",
  assumptions: "A uniform magnetic field over the whole arena, no electric field, no collisions or radiation, and a non-relativistic speed. The particle enters at the origin moving along +x. The path is integrated with the Boris algorithm.",
  learningObjectives: ["Apply F = qv × B and find the direction of the force for each sign of charge.", "Use r = mv/(|q|B) to design a path.", "See that a magnetic field changes direction but not speed."],
  objective: { title: "Hit every target", description: "Steer the beam into each target.", unit: "targets" },
  controlsHeading: "Set the field",
  submitLabel: "Fire the beam",
  solvedLabel: "Target hit!",
  nextLabel: "Next maze",
};

export const MAZE_ROUNDS: readonly MazeRound[] = Object.freeze([
  {
    id: "first-bend", title: "The first bend", difficulty: "Beginner", particle: "electron", fieldScale: 1e-6, arenaHalfSize: 2, target: { x: 1, y: 0.6, radius: 0.08 },
    situation: "An electron enters at 2 × 10⁶ m/s. The target is at (1.0, 0.6) m. Choose the magnetic field (out of the screen is positive) so the circular path passes through it.",
    controls: [fixed("speed", "Speed", "Mm/s", 2), slider("field", "Magnetic field", "µT", 1, 40, 0.05, 20)],
    hint: "A circle through the origin and (x, y) has r = (x² + y²)/(2y). Then B = mv/(|q|r).",
  },
  {
    id: "speed-and-field", title: "Speed and field", difficulty: "Intermediate", particle: "electron", fieldScale: 1e-6, arenaHalfSize: 2.5, target: { x: 1.2, y: 0.9, radius: 0.08 },
    situation: "The target is at (1.2, 0.9) m. The magnet can only produce up to 12 µT, so you must also choose the electron speed. Any speed and field with the right ratio work, as long as the field is within the limit.",
    controls: [slider("speed", "Speed", "Mm/s", 1, 4, 0.1, 2), slider("field", "Magnetic field", "µT", 1, 12, 0.05, 6)],
    hint: "The radius needed is 1.25 m. Since r = mv/(eB), the field must grow in proportion to the speed: B = mv/(e·1.25 m).",
  },
  {
    id: "proton-beam", title: "A proton beam", difficulty: "Advanced", particle: "proton", fieldScale: 1e-3, arenaHalfSize: 2, target: { x: 1, y: -0.6, radius: 0.08 },
    situation: "Now a proton at 0.5 × 10⁶ m/s, and the target is below the axis, at (1.0, −0.6) m. A proton is positive and about 1,836 times heavier than an electron. Choose the field, including its sign.",
    controls: [fixed("speed", "Speed", "Mm/s", 0.5), slider("field", "Magnetic field", "mT", -20, 20, 0.05, 0)],
    hint: "A positive charge bends the opposite way to an electron in the same field. Work out which sign of B bends a proton downward, then use r = mv/(eB) with r = 1.13 m.",
  },
]);

/** Follows the particle with the Boris algorithm until it leaves the arena or hits the target. */
export function traceMazePath(round: MazeRound, v: NumericControl): MazePath {
  const species = getParticleSpecies(round.particle);
  const speed = (v.speed as number) * 1e6;
  const B = (v.field as number) * round.fieldScale;
  const magnetic = new Vector3(0, 0, B);
  const dt = 0.004 / speed;
  let particle = { position: Vector3.zero(), velocity: new Vector3(speed, 0, 0) };
  const points = [{ x: 0, y: 0 }];
  let closest = Math.hypot(round.target.x, round.target.y);
  let hit = false;

  for (let step = 0; step < 4000; step += 1) {
    particle = advanceChargedParticleBoris(particle, { chargeCoulombs: species.chargeCoulombs, massKilograms: species.massKilograms, electric: Vector3.zero(), magnetic, timeStepSeconds: dt });
    const { x, y } = particle.position;
    points.push({ x, y });
    closest = Math.min(closest, Math.hypot(x - round.target.x, y - round.target.y));
    if (closest <= round.target.radius) {
      hit = true;
      break;
    }
    if (Math.abs(x) > round.arenaHalfSize || Math.abs(y) > round.arenaHalfSize) break;
  }
  const orbitRadius = B === 0 ? null : (species.massKilograms * speed) / (Math.abs(species.chargeCoulombs) * Math.abs(B));
  return { points, closestApproach: closest, hit, orbitRadius };
}

export function runMaze(round: MazeRound, v: NumericControl): MazeOutcome {
  const path = traceMazePath(round, v);
  const bend = (v.field as number) * (round.particle === "electron" ? 1 : -1);
  const wanted = round.target.y > 0 ? "up" : "down";
  const bends = bend > 0 ? "up" : bend < 0 ? "down" : "straight";
  return {
    success: path.hit, path,
    accuracyFraction: path.hit ? 1 - path.closestApproach / round.target.radius : 0,
    predictionActual: path.orbitRadius,
    feedback: path.hit
      ? `The beam reaches the target (circle radius ${path.orbitRadius?.toFixed(2)} m).`
      : bends !== wanted && bends !== "straight"
        ? `The beam curves ${bends}, away from the target, which lies ${wanted}. A ${round.particle} bends the other way with this field direction: reverse the field.`
        : `The beam misses the target by ${(path.closestApproach - round.target.radius).toFixed(2)} m at its closest. ${bends === "straight" ? "With no field it travels straight." : "Change the field strength: a stronger field gives a tighter circle."}`,
  };
}

export const magneticMaze = defineNumericGame<MazeRound, MazeOutcome>({
  meta: MAZE_META,
  rounds: MAZE_ROUNDS,
  prediction: () => ({ label: "Your prediction of the radius of the circular path", unit: "m", placeholder: "e.g. 1.2", step: 0.01 }),
  evaluate: (round, values) => {
    if (values.field === 0) throw new RangeError("Choose a non-zero field so the beam bends.");
    return runMaze(round, values);
  },
});
