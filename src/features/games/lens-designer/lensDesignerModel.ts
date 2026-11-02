import {
  calculateBlurDiameter,
  calculateFocalLength,
  calculateImageDistance,
  calculateMagnification,
} from "../../../physics/optics";
import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, PredictionSpec, RoundGameDefinition } from "../../../game-engine/rounds/types";
import {
  LENS_DESIGNER_META,
  LENS_ROUNDS,
  type LensControl,
  type LensRound,
} from "./lensDesignerData";

export interface LensGeometry {
  readonly focalLengthCm: number;
  readonly objectDistanceCm: number;
  /** Null when the object sits at the focal point. */
  readonly imageDistanceCm: number | null;
  readonly magnification: number | null;
  readonly imageHeightCm: number | null;
  readonly isReal: boolean;
}

export interface LensOutcome extends AttemptOutcome {
  readonly geometry: LensGeometry;
  readonly blurCm: number | null;
}

export function resolveRadius(round: LensRound, control: LensControl): number {
  return round.radius.fixed ?? control.radiusCm;
}

/** The image the biconvex lens forms for the learner's settings. */
export function calculateLensGeometry(round: LensRound, control: LensControl): LensGeometry {
  const radius = resolveRadius(round, control);
  if (radius < round.radius.minimumCm || radius > round.radius.maximumCm) {
    throw new RangeError(`The radius must be between ${round.radius.minimumCm} and ${round.radius.maximumCm} cm.`);
  }
  if (control.positionCm < round.position.minimumCm || control.positionCm > round.position.maximumCm) {
    throw new RangeError(`The lens must be ${round.position.minimumCm}–${round.position.maximumCm} cm from the object.`);
  }

  const focalLengthCm = calculateFocalLength(round.refractiveIndex, radius, -radius);
  const imageDistanceCm = calculateImageDistance(focalLengthCm, control.positionCm);
  const magnification =
    imageDistanceCm === null ? null : calculateMagnification(control.positionCm, imageDistanceCm);
  return {
    focalLengthCm,
    objectDistanceCm: control.positionCm,
    imageDistanceCm,
    magnification,
    imageHeightCm: magnification === null ? null : magnification * round.objectHeightCm,
    isReal: imageDistanceCm !== null && imageDistanceCm > 0,
  };
}

function predictionValue(round: LensRound, geometry: LensGeometry): number | null {
  if (geometry.imageDistanceCm === null || geometry.magnification === null) {
    return null;
  }
  switch (round.predictionKind) {
    case "imageDistance":
      return Math.abs(geometry.imageDistanceCm);
    case "imageHeight":
      return Math.abs(geometry.magnification) * round.objectHeightCm;
    case "magnification":
      return Math.abs(geometry.magnification);
  }
}

export function evaluateLens(round: LensRound, control: LensControl): LensOutcome {
  const geometry = calculateLensGeometry(round, control);
  const { goal } = round;
  const noImage: LensOutcome = {
    success: false,
    accuracyFraction: 0,
    predictionActual: null,
    feedback: `The object is exactly at the focal point (${geometry.focalLengthCm.toFixed(1)} cm), so the rays leave the lens parallel and no image forms. Move the lens or change the curvature.`,
    geometry,
    blurCm: null,
  };
  if (geometry.imageDistanceCm === null || geometry.magnification === null) {
    return noImage;
  }

  const predictionActual = predictionValue(round, geometry);
  const { imageDistanceCm, magnification } = geometry;

  if (goal.kind === "screen") {
    if (!geometry.isReal) {
      return {
        ...noImage,
        feedback: `The object is inside the focal length (f = ${geometry.focalLengthCm.toFixed(1)} cm), so the lens makes a virtual image that cannot be caught on a screen. Move the lens further from the object.`,
        predictionActual,
      };
    }
    const screenDistance = (round.screenDistanceCm as number) - control.positionCm;
    const blurCm = calculateBlurDiameter(round.apertureCm, imageDistanceCm, screenDistance);
    const sharp = blurCm <= goal.maximumBlurCm;
    let magnificationError = 0;
    let magnificationOk = true;
    if (goal.magnification) {
      magnificationError = Math.abs(Math.abs(magnification) - goal.magnification.target) / goal.magnification.target;
      magnificationOk = magnificationError <= goal.magnification.toleranceFraction;
    }
    const success = sharp && magnificationOk;
    const accuracyFraction = success
      ? 1 -
        Math.max(
          blurCm / goal.maximumBlurCm,
          goal.magnification ? magnificationError / goal.magnification.toleranceFraction : 0,
        )
      : 0;

    let feedback: string;
    if (success) {
      feedback = `The image forms ${imageDistanceCm.toFixed(1)} cm behind the lens, inverted, ${Math.abs(magnification).toFixed(2)} times the object size, with a blur of only ${(blurCm * 10).toFixed(2)} mm.`;
    } else if (!sharp) {
      feedback = `The image forms ${imageDistanceCm.toFixed(1)} cm behind the lens but the screen is ${screenDistance.toFixed(1)} cm behind it, so the picture is blurred (${(blurCm * 10).toFixed(1)} mm blur circle). Move the lens until the image distance matches the screen.`;
    } else {
      feedback = `The image is sharp but ${Math.abs(magnification).toFixed(2)} times the object size, not ${goal.magnification?.target}. A different focal length is needed.`;
    }
    return { success, accuracyFraction, predictionActual, feedback, geometry, blurCm };
  }

  // Magnifier: a virtual, upright image at the requested distance and magnification.
  if (geometry.isReal) {
    return {
      ...noImage,
      feedback: `The object is outside the focal length (f = ${geometry.focalLengthCm.toFixed(1)} cm), so the image is real and inverted. A magnifier needs the object inside the focal length.`,
      predictionActual,
    };
  }
  const distanceError = Math.abs(Math.abs(imageDistanceCm) - goal.imageDistanceCm) / goal.imageDistanceCm;
  const magnificationError = Math.abs(magnification - goal.magnification) / goal.magnification;
  const success = distanceError <= goal.toleranceFraction && magnificationError <= goal.toleranceFraction;
  const feedback = success
    ? `A virtual, upright image appears ${Math.abs(imageDistanceCm).toFixed(1)} cm in front of the lens, magnified ${magnification.toFixed(2)} times.`
    : `The virtual image is ${Math.abs(imageDistanceCm).toFixed(1)} cm away and magnified ${magnification.toFixed(2)} times; you need ${goal.imageDistanceCm} cm and ${goal.magnification} times.`;
  return {
    success,
    accuracyFraction: success
      ? 1 - Math.max(distanceError, magnificationError) / goal.toleranceFraction
      : 0,
    predictionActual,
    feedback,
    geometry,
    blurCm: null,
  };
}

const PREDICTION_SPECS: Record<LensRound["predictionKind"], PredictionSpec> = {
  imageDistance: { label: "Your prediction of the image distance", unit: "cm", placeholder: "e.g. 47", step: 0.1 },
  imageHeight: { label: "Your prediction of the image height", unit: "cm", placeholder: "e.g. 6", step: 0.1 },
  magnification: { label: "Your prediction of the magnification", unit: "×", placeholder: "e.g. 5", step: 0.1 },
};

export const lensDesigner: RoundGameDefinition<LensRound, LensControl, LensOutcome> = {
  meta: LENS_DESIGNER_META,
  rounds: LENS_ROUNDS,
  createControl: (round) => ({
    radiusCm: round.radius.fixed ?? Number(((round.radius.minimumCm + round.radius.maximumCm) / 2).toFixed(2)),
    positionCm: Number(((round.position.minimumCm + round.position.maximumCm) / 2).toFixed(2)),
  }),
  parseControl: (raw, round) => {
    if (!isRecord(raw)) {
      return null;
    }
    const radiusCm = readNumber(raw, "radiusCm", round.radius.minimumCm, round.radius.maximumCm);
    const positionCm = readNumber(raw, "positionCm", round.position.minimumCm, round.position.maximumCm);
    return radiusCm === null || positionCm === null
      ? null
      : { radiusCm: round.radius.fixed ?? radiusCm, positionCm };
  },
  prediction: (round) => PREDICTION_SPECS[round.predictionKind],
  evaluate: (round, control) => evaluateLens(round, control),
};
