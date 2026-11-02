import { Vector2, assertFiniteNumber } from "../../../physics/core";
import {
  traceRay,
  type OpticalElement,
  type OpticalScene,
  type TraceResult,
} from "../../../physics/optics";
import { isRecord } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, RoundGameDefinition } from "../../../game-engine/rounds/types";
import {
  ARENA_CM,
  LASER_MAZE_META,
  LASER_ROUNDS,
  MIRROR_ANGLE_RANGE,
  type LaserControl,
  type LaserRound,
} from "./laserMazeData";

export interface LaserOutcome extends AttemptOutcome {
  readonly trace: TraceResult;
  readonly closestApproachCm: number | null;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function validateAngles(round: LaserRound, control: LaserControl): void {
  if (control.mirrorAnglesDegrees.length !== round.mirrors.length) {
    throw new RangeError("Set an angle for every mirror.");
  }
  for (const angle of control.mirrorAnglesDegrees) {
    assertFiniteNumber(angle, "mirror angle");
    if (angle < MIRROR_ANGLE_RANGE.minimum || angle > MIRROR_ANGLE_RANGE.maximum) {
      throw new RangeError(
        `Mirror angles must be between ${MIRROR_ANGLE_RANGE.minimum}° and ${MIRROR_ANGLE_RANGE.maximum}°.`,
      );
    }
  }
}

export function buildScene(round: LaserRound, control: LaserControl): OpticalScene {
  validateAngles(round, control);
  const mirrors: OpticalElement[] = round.mirrors.map((mirror, index) => {
    const half = Vector2.fromAngle(
      toRadians(control.mirrorAnglesDegrees[index] as number),
      mirror.lengthCm / 2,
    );
    const center = new Vector2(mirror.centerXCm, mirror.centerYCm);
    return { kind: "mirror", start: center.subtract(half), end: center.add(half) };
  });
  const blocks: OpticalElement[] = round.blocks.map((block) => ({
    kind: "block",
    min: new Vector2(block.minXCm, block.minYCm),
    max: new Vector2(block.maxXCm, block.maxYCm),
    refractiveIndex: block.refractiveIndex,
  }));
  return {
    elements: [...mirrors, ...blocks],
    width: ARENA_CM,
    height: ARENA_CM,
    target: {
      center: new Vector2(round.target.xCm, round.target.yCm),
      radius: round.target.radiusCm,
    },
  };
}

export function traceLaser(round: LaserRound, control: LaserControl): TraceResult {
  return traceRay(
    buildScene(round, control),
    new Vector2(round.laser.xCm, round.laser.yCm),
    Vector2.fromAngle(toRadians(round.laser.angleDegrees)),
  );
}

/** The angle the learner was asked to predict, taken from the beam's actual path. */
export function readPredictedQuantity(round: LaserRound, trace: TraceResult): number | null {
  const wanted = round.predictionEvent;
  const matching = trace.events.filter((event) =>
    wanted.kind === "reflection"
      ? event.kind === "reflection"
      : event.kind === "refraction",
  );
  const event = matching[wanted.occurrence - 1];
  if (!event) {
    return null;
  }
  return wanted.quantity === "incidence" ? event.incidenceDegrees : event.refractionDegrees;
}

export function evaluateLaser(round: LaserRound, control: LaserControl): LaserOutcome {
  const trace = traceLaser(round, control);
  const closestApproachCm = trace.closestApproach;
  const radius = round.target.radiusCm;
  const success = trace.hitTarget;
  const accuracyFraction =
    success && closestApproachCm !== null ? 1 - closestApproachCm / radius : 0;

  let feedback: string;
  if (success) {
    const bounces = trace.events.length;
    feedback = `The beam reached the target after ${bounces} interaction${bounces === 1 ? "" : "s"}.`;
  } else {
    const hitMirrors = new Set(
      trace.events.filter((e) => e.kind === "reflection").map((e) => e.elementIndex),
    );
    const missing = round.mirrors.findIndex((_, index) => !hitMirrors.has(index));
    feedback =
      missing >= 0
        ? `The beam never reached mirror ${missing + 1}. Check the earlier mirror's angle.`
        : `The beam missed the target by ${((closestApproachCm ?? 0) - radius).toFixed(1)} cm at its closest. Remember that turning a mirror by θ turns the beam by 2θ.`;
  }

  return {
    success,
    accuracyFraction,
    predictionActual: readPredictedQuantity(round, trace),
    feedback,
    trace,
    closestApproachCm,
  };
}

export const laserMaze: RoundGameDefinition<LaserRound, LaserControl, LaserOutcome> = {
  meta: LASER_MAZE_META,
  rounds: LASER_ROUNDS,
  createControl: (round) => ({ mirrorAnglesDegrees: round.mirrors.map(() => 90) }),
  parseControl: (raw, round) => {
    if (!isRecord(raw) || !Array.isArray(raw.mirrorAnglesDegrees)) {
      return null;
    }
    const angles = raw.mirrorAnglesDegrees;
    return angles.length === round.mirrors.length &&
      angles.every(
        (a) =>
          typeof a === "number" &&
          Number.isFinite(a) &&
          a >= MIRROR_ANGLE_RANGE.minimum &&
          a <= MIRROR_ANGLE_RANGE.maximum,
      )
      ? { mirrorAnglesDegrees: [...angles] as number[] }
      : null;
  },
  prediction: (round) => ({
    label: round.predictionEvent.label,
    unit: "degrees",
    placeholder: "e.g. 30",
    step: 0.1,
  }),
  evaluate: (round, control) => evaluateLaser(round, control),
};
