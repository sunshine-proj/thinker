export {
  calculateCriticalAngleDegrees,
  calculateIncidenceAngleDegrees,
  calculateRefractionAngleDegrees,
  reflect,
  refract,
} from "./rayOptics";
export {
  AIR_INDEX,
  traceRay,
  type BlockElement,
  type MirrorElement,
  type OpticalElement,
  type OpticalScene,
  type TargetDisc,
  type TraceEvent,
  type TraceResult,
} from "./rayTracer";
export {
  calculateBlurDiameter,
  calculateConjugatePositions,
  calculateFocalLength,
  calculateImageDistance,
  calculateMagnification,
} from "./thinLens";
export {
  calculateDeviation,
  calculateMinimumDeviationIncidence,
  calculateRainbowAngle,
  calculateRefractionAngle,
  calculateWaterRefractiveIndex,
} from "./rainbow";
export {
  calculateCorrectionForFarPoint,
  calculateDefocus,
  calculateFarPoint,
  calculateNearPoint,
  calculateObjectVergence,
  type Eye,
} from "./vision";
export { calculateMirrorFocalLength, calculateMirrorImage, calculatePlaneMirrorCoverage } from "./mirrors";
export {
  NEAR_POINT_METERS,
  calculateEyepieceMagnification,
  calculateMicroscopeMagnification,
  calculateObjectiveMagnification,
  calculateResolutionLimit,
  calculateSpecimenDistance,
  calculateUsefulMagnificationLimit,
} from "./microscope";
