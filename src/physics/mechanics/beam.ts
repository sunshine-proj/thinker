import {
  STANDARD_GRAVITY,
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
} from "../core";

/**
 * Statics of a simply supported beam (pin support at x = 0, roller at x = L).
 *
 * Model: Euler–Bernoulli beam, linear elastic, loads vertical and static.
 * Reactions follow from force and moment balance. Positions are in meters
 * from the left support; forces in newtons; moments in newton-meters; stress
 * in pascals; sagging (positive) moment means the bottom fibres are in tension.
 *
 * Limitations: no shear failure, lateral-torsional buckling, deflection limits,
 * connections, fatigue, or dynamic (moving) load effects.
 */
export interface BeamPointLoad {
  readonly forceNewtons: number;
  readonly positionMeters: number;
}

export interface SimplySupportedBeam {
  readonly lengthMeters: number;
  readonly pointLoads: readonly BeamPointLoad[];
  /** Uniform load per unit length, N/m (for example the beam's own weight). */
  readonly uniformLoadNewtonsPerMeter: number;
}

export interface BeamReactions {
  readonly leftNewtons: number;
  readonly rightNewtons: number;
}

export interface MaximumMoment {
  readonly momentNewtonMeters: number;
  readonly positionMeters: number;
}

function validateBeam(beam: SimplySupportedBeam): void {
  assertPositive(beam.lengthMeters, "lengthMeters");
  assertNonNegative(beam.uniformLoadNewtonsPerMeter, "uniformLoadNewtonsPerMeter");
  for (const load of beam.pointLoads) {
    assertNonNegative(load.forceNewtons, "forceNewtons");
    assertFiniteNumber(load.positionMeters, "positionMeters");
    if (load.positionMeters < 0 || load.positionMeters > beam.lengthMeters) {
      throw new RangeError("Point loads must lie on the beam.");
    }
  }
}

/** Support reactions from moment balance about the left support and force balance. */
export function calculateReactions(beam: SimplySupportedBeam): BeamReactions {
  validateBeam(beam);
  const length = beam.lengthMeters;
  const totalUniform = beam.uniformLoadNewtonsPerMeter * length;
  const momentAboutLeft =
    beam.pointLoads.reduce(
      (total, load) => total + load.forceNewtons * load.positionMeters,
      0,
    ) +
    (totalUniform * length) / 2;
  const rightNewtons = momentAboutLeft / length;
  const totalLoad =
    beam.pointLoads.reduce((total, load) => total + load.forceNewtons, 0) +
    totalUniform;
  return { leftNewtons: totalLoad - rightNewtons, rightNewtons };
}

/** Internal shear force just to the right of x (taking loads at x as already applied). */
export function calculateShearAt(beam: SimplySupportedBeam, x: number): number {
  validateBeam(beam);
  assertFiniteNumber(x, "x");
  const { leftNewtons } = calculateReactions(beam);
  const loadsBefore = beam.pointLoads
    .filter((load) => load.positionMeters <= x)
    .reduce((total, load) => total + load.forceNewtons, 0);
  return leftNewtons - loadsBefore - beam.uniformLoadNewtonsPerMeter * x;
}

/** Internal bending moment at x. */
export function calculateBendingMomentAt(
  beam: SimplySupportedBeam,
  x: number,
): number {
  validateBeam(beam);
  assertFiniteNumber(x, "x");
  if (x < 0 || x > beam.lengthMeters) {
    throw new RangeError("x must lie on the beam.");
  }
  const { leftNewtons } = calculateReactions(beam);
  const loadMoment = beam.pointLoads
    .filter((load) => load.positionMeters < x)
    .reduce((total, load) => total + load.forceNewtons * (x - load.positionMeters), 0);
  return (
    leftNewtons * x -
    loadMoment -
    (beam.uniformLoadNewtonsPerMeter * x * x) / 2
  );
}

/**
 * Largest bending moment. It occurs where the shear force is zero or changes
 * sign, which is under a point load or at a zero crossing within a segment.
 */
export function calculateMaximumBendingMoment(
  beam: SimplySupportedBeam,
): MaximumMoment {
  validateBeam(beam);
  const { leftNewtons } = calculateReactions(beam);
  const sorted = [...beam.pointLoads].sort(
    (a, b) => a.positionMeters - b.positionMeters,
  );
  const candidates = new Set<number>([0, beam.lengthMeters]);
  let shearBefore = leftNewtons;
  let start = 0;

  const addZeroCrossing = (segmentStart: number, segmentEnd: number, shearAtStart: number) => {
    const w = beam.uniformLoadNewtonsPerMeter;
    if (w > 0) {
      const x = segmentStart + shearAtStart / w;
      if (x > segmentStart && x < segmentEnd) {
        candidates.add(x);
      }
    }
  };

  for (const load of sorted) {
    candidates.add(load.positionMeters);
    addZeroCrossing(start, load.positionMeters, shearBefore);
    shearBefore -=
      beam.uniformLoadNewtonsPerMeter * (load.positionMeters - start) +
      load.forceNewtons;
    start = load.positionMeters;
  }
  addZeroCrossing(start, beam.lengthMeters, shearBefore);

  let best: MaximumMoment = { momentNewtonMeters: 0, positionMeters: 0 };
  for (const x of candidates) {
    const moment = calculateBendingMomentAt(beam, x);
    if (moment > best.momentNewtonMeters) {
      best = { momentNewtonMeters: moment, positionMeters: x };
    }
  }
  return best;
}

/** Second moment of area of a rectangle about its horizontal centroidal axis: I = b h³ / 12. */
export function calculateRectangularSecondMoment(
  widthMeters: number,
  heightMeters: number,
): number {
  assertPositive(widthMeters, "widthMeters");
  assertPositive(heightMeters, "heightMeters");
  return (widthMeters * heightMeters ** 3) / 12;
}

/** Flexure formula: σ = M c / I, with c the distance from the neutral axis to the extreme fibre. */
export function calculateBendingStress(
  momentNewtonMeters: number,
  secondMomentMetersToTheFourth: number,
  extremeFibreDistanceMeters: number,
): number {
  assertFiniteNumber(momentNewtonMeters, "momentNewtonMeters");
  assertPositive(secondMomentMetersToTheFourth, "secondMoment");
  assertPositive(extremeFibreDistanceMeters, "extremeFibreDistanceMeters");
  return (
    (Math.abs(momentNewtonMeters) * extremeFibreDistanceMeters) /
    secondMomentMetersToTheFourth
  );
}

/** Weight per metre of a solid rectangular member, N/m. */
export function calculateSelfWeightPerMeter(
  densityKilogramsPerCubicMeter: number,
  widthMeters: number,
  heightMeters: number,
  gravity = STANDARD_GRAVITY,
): number {
  assertPositive(densityKilogramsPerCubicMeter, "density");
  assertPositive(widthMeters, "widthMeters");
  assertPositive(heightMeters, "heightMeters");
  assertPositive(gravity, "gravity");
  return densityKilogramsPerCubicMeter * widthMeters * heightMeters * gravity;
}
