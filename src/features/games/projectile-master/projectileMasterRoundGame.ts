import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, RoundGameDefinition, RoundGameMeta } from "../../../game-engine/rounds/types";
import type { GameDifficulty } from "../../../types/progress";
import { PROJECTILE_MASTER_GAME, PROJECTILE_MASTER_ROUNDS, type ProjectileMasterRound } from "./projectileMasterData";
import { calculateProjectileTrajectory, type ProjectileTrajectory } from "./projectileMasterModel";
import { INITIAL_ANGLE_DEGREES, INITIAL_SPEED_METERS_PER_SECOND, formatNumber } from "./ProjectilePlot";

export interface LaunchControl {
  readonly speed: number;
  readonly angle: number;
}

export interface ShotOutcome extends AttemptOutcome {
  readonly trajectory: ProjectileTrajectory;
  readonly missDistanceMeters: number;
}

export const SPEED_RANGE = { minimum: 8, maximum: 30, step: 0.5 } as const;
export const ANGLE_RANGE = { minimum: 10, maximum: 80, step: 1 } as const;
const DIFFICULTIES: readonly GameDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

export interface ProjectileRound extends ProjectileMasterRound {
  readonly difficulty: GameDifficulty;
  readonly situation: string;
}

export const PROJECTILE_ROUNDS: readonly ProjectileRound[] = PROJECTILE_MASTER_ROUNDS.map((round, index) => ({
  ...round,
  difficulty: DIFFICULTIES[Math.min(index, 2)] as GameDifficulty,
  situation: `Land the projectile within ${round.targetRadiusMeters} m of the target ${round.targetDistanceMeters} m away. Predict the range of your launch before you fire.`,
}));

export const PROJECTILE_META: RoundGameMeta = {
  id: PROJECTILE_MASTER_GAME.id,
  title: PROJECTILE_MASTER_GAME.title,
  eyebrow: "MECHANICS · PROJECTILE MOTION",
  modelTag: "IDEAL PROJECTILE MOTION",
  introduction: PROJECTILE_MASTER_GAME.introduction,
  instructions: PROJECTILE_MASTER_GAME.instructions,
  formula: PROJECTILE_MASTER_GAME.formula,
  formulaCaption: "v is the launch speed (m/s), θ the launch angle and g = 9.81 m/s². The flight time is 2v sinθ / g.",
  explanation: PROJECTILE_MASTER_GAME.explanation,
  assumptions: PROJECTILE_MASTER_GAME.assumptions,
  learningObjectives: PROJECTILE_MASTER_GAME.learningObjectives,
  objective: { title: "Hit every target", description: "Land a projectile inside each target zone.", unit: "targets" },
  controlsHeading: "Aim and launch",
  submitLabel: "Launch projectile",
  solvedLabel: "Target hit!",
  nextLabel: "Next target",
};

/** Projectile Master on the shared round framework (ROADMAP task 129). */
export const projectileMaster: RoundGameDefinition<ProjectileRound, LaunchControl, ShotOutcome> = {
  meta: PROJECTILE_META,
  rounds: PROJECTILE_ROUNDS,
  createControl: () => ({ speed: INITIAL_SPEED_METERS_PER_SECOND, angle: INITIAL_ANGLE_DEGREES }),
  parseControl: (raw) => {
    if (!isRecord(raw)) {
      return null;
    }
    const speed = readNumber(raw, "speed", SPEED_RANGE.minimum, SPEED_RANGE.maximum);
    const angle = readNumber(raw, "angle", ANGLE_RANGE.minimum, ANGLE_RANGE.maximum);
    return speed === null || angle === null ? null : { speed, angle };
  },
  prediction: () => ({ label: "Your range prediction", unit: "m", placeholder: "e.g. 25", step: 0.1 }),
  evaluate: (round, control) => {
    const trajectory = calculateProjectileTrajectory({ speedMetersPerSecond: control.speed, angleDegrees: control.angle });
    const missDistanceMeters = Math.abs(trajectory.horizontalRangeMeters - round.targetDistanceMeters);
    const success = missDistanceMeters <= round.targetRadiusMeters;
    return {
      trajectory,
      missDistanceMeters,
      success,
      accuracyFraction: success ? 1 - missDistanceMeters / round.targetRadiusMeters : 0,
      predictionActual: trajectory.horizontalRangeMeters,
      feedback: success
        ? `The projectile landed at ${formatNumber(trajectory.horizontalRangeMeters)} m after ${formatNumber(trajectory.flightTimeSeconds, 2)} s in the air.`
        : `Missed by ${formatNumber(missDistanceMeters)} m: it landed at ${formatNumber(trajectory.horizontalRangeMeters)} m. Adjust your launch and try again.`,
    };
  },
};
