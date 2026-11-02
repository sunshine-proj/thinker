import { Vector2, assertFiniteNumber } from "../../../physics/core";
import {
  calculateElectricField,
  calculateForceOnCharge,
  type PointCharge,
} from "../../../physics/electromagnetism";
import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, RoundGameDefinition } from "../../../game-engine/rounds/types";
import {
  ARENA_SIZE_CM,
  DETECTIVE_ROUNDS,
  ELECTRIC_DETECTIVE_META,
  MINIMUM_PROBE_DISTANCE_CM,
  TEST_CHARGE_NANOCOULOMBS,
  type DetectiveControl,
  type DetectiveRound,
  type Point,
} from "./electricDetectiveData";

const CM = 0.01;
const NANO = 1e-9;

export interface ForceReading {
  readonly probe: Point;
  /** Force on the test charge in micronewtons. */
  readonly forceMicronewtons: Vector2;
  readonly magnitudeMicronewtons: number;
  /** Direction of the force, degrees counter-clockwise from +x. */
  readonly directionDegrees: number;
}

export interface DetectiveOutcome extends AttemptOutcome {
  readonly positionErrorCm: number;
  readonly chargeErrorNanocoulombs: number;
}

function toCharge(point: Point, chargeNanocoulombs: number): PointCharge {
  return {
    chargeCoulombs: chargeNanocoulombs * NANO,
    position: new Vector2(point.xCm * CM, point.yCm * CM),
  };
}

/** The force a +1 nC test charge at `probe` would feel from a charge at `source`. */
export function measureForce(
  source: Point & { chargeNanocoulombs: number },
  probe: Point,
): ForceReading {
  const field = calculateElectricField(
    [toCharge(source, source.chargeNanocoulombs)],
    new Vector2(probe.xCm * CM, probe.yCm * CM),
  );
  const force = calculateForceOnCharge(TEST_CHARGE_NANOCOULOMBS * NANO, field);
  const forceMicronewtons = force.scale(1e6);
  return {
    probe,
    forceMicronewtons,
    magnitudeMicronewtons: forceMicronewtons.magnitude,
    directionDegrees: (forceMicronewtons.angleRadians * 180) / Math.PI,
  };
}

export function readingFor(round: DetectiveRound, probe: Point): ForceReading {
  return measureForce(
    {
      xCm: round.hidden.xCm,
      yCm: round.hidden.yCm,
      chargeNanocoulombs: round.hidden.chargeNanocoulombs,
    },
    probe,
  );
}

function validatePoint(point: Point, name: string): void {
  assertFiniteNumber(point.xCm, `${name} x`);
  assertFiniteNumber(point.yCm, `${name} y`);
  if (
    point.xCm < 0 || point.xCm > ARENA_SIZE_CM ||
    point.yCm < 0 || point.yCm > ARENA_SIZE_CM
  ) {
    throw new RangeError(`The ${name} must be inside the ${ARENA_SIZE_CM} cm arena.`);
  }
}

/** Places the test charge at the next probe point, if allowed. */
export function addProbe(round: DetectiveRound, control: DetectiveControl): DetectiveControl {
  validatePoint(control.nextProbe, "probe");
  if (control.probes.length >= round.maxProbes) {
    throw new RangeError(`You have used all ${round.maxProbes} readings.`);
  }
  const distance = Math.hypot(
    control.nextProbe.xCm - round.hidden.xCm,
    control.nextProbe.yCm - round.hidden.yCm,
  );
  if (distance < MINIMUM_PROBE_DISTANCE_CM) {
    throw new RangeError(
      `That probe is within ${MINIMUM_PROBE_DISTANCE_CM} cm of the hidden charge, where the force is too extreme to measure. Move it away.`,
    );
  }
  if (control.probes.some((p) => p.xCm === control.nextProbe.xCm && p.yCm === control.nextProbe.yCm)) {
    throw new RangeError("You already took a reading there. Try a different point.");
  }
  return { ...control, probes: [...control.probes, control.nextProbe] };
}

function describeCharge(nanocoulombs: number): string {
  return `${nanocoulombs > 0 ? "+" : "−"}${Math.abs(nanocoulombs).toFixed(1)} nC`;
}

/** Judges the learner's hypothesis against the hidden charge and the readings they took. */
export function evaluateDetective(round: DetectiveRound, control: DetectiveControl): DetectiveOutcome {
  validatePoint(control.guess, "guess");
  assertFiniteNumber(control.guess.chargeNanocoulombs, "guess charge");
  if (control.probes.length === 0) {
    throw new RangeError("Take at least one reading before you submit an answer.");
  }

  const positionErrorCm = round.knownPosition
    ? 0
    : Math.hypot(control.guess.xCm - round.hidden.xCm, control.guess.yCm - round.hidden.yCm);
  const chargeErrorNanocoulombs = round.knownCharge
    ? 0
    : Math.abs(control.guess.chargeNanocoulombs - round.hidden.chargeNanocoulombs);
  const success =
    positionErrorCm <= round.positionToleranceCm &&
    chargeErrorNanocoulombs <= round.chargeToleranceNanocoulombs;
  const accuracyFraction = success
    ? 1 -
      Math.max(
        positionErrorCm / round.positionToleranceCm,
        chargeErrorNanocoulombs / round.chargeToleranceNanocoulombs,
      )
    : 0;

  let feedback: string;
  if (success) {
    feedback = `The hidden charge was ${describeCharge(round.hidden.chargeNanocoulombs)} at (${round.hidden.xCm}, ${round.hidden.yCm}) cm.`;
  } else {
    // Test the hypothesis: would it have produced the force that was measured?
    const probe = control.probes.find((p) => {
      return Math.hypot(p.xCm - control.guess.xCm, p.yCm - control.guess.yCm) > 0.5;
    });
    if (probe === undefined) {
      feedback = "Your guess sits on top of every probe point, so it cannot be tested. Move it.";
    } else {
      const measured = readingFor(round, probe);
      const predicted = measureForce(control.guess, probe);
      const index = control.probes.indexOf(probe) + 1;
      const directionGap = Math.abs(
        ((predicted.directionDegrees - measured.directionDegrees + 540) % 360) - 180,
      );
      feedback = `Your hypothesis does not match reading ${index}: it predicts ${predicted.magnitudeMicronewtons.toFixed(3)} µN at ${predicted.directionDegrees.toFixed(0)}°, but you measured ${measured.magnitudeMicronewtons.toFixed(3)} µN at ${measured.directionDegrees.toFixed(0)}° (${directionGap.toFixed(0)}° apart). Adjust your guess and try again.`;
    }
  }

  return { success, accuracyFraction, predictionActual: null, feedback, positionErrorCm, chargeErrorNanocoulombs };
}

function parsePoint(raw: unknown): Point | null {
  if (!isRecord(raw)) {
    return null;
  }
  const xCm = readNumber(raw, "xCm", 0, ARENA_SIZE_CM);
  const yCm = readNumber(raw, "yCm", 0, ARENA_SIZE_CM);
  return xCm === null || yCm === null ? null : { xCm, yCm };
}

export const electricDetective: RoundGameDefinition<DetectiveRound, DetectiveControl, DetectiveOutcome> = {
  meta: ELECTRIC_DETECTIVE_META,
  rounds: DETECTIVE_ROUNDS,
  createControl: (round) => ({
    probes: [],
    nextProbe: { xCm: 50, yCm: 50 },
    guess: {
      xCm: round.knownPosition ? round.hidden.xCm : 50,
      yCm: round.knownPosition ? round.hidden.yCm : 50,
      chargeNanocoulombs: round.knownCharge ? round.hidden.chargeNanocoulombs : 0,
    },
  }),
  parseControl: (raw, round) => {
    if (!isRecord(raw) || !Array.isArray(raw.probes) || raw.probes.length > round.maxProbes) {
      return null;
    }
    const probes = raw.probes.map(parsePoint);
    const nextProbe = parsePoint(raw.nextProbe);
    const guessPoint = parsePoint(raw.guess);
    const charge = isRecord(raw.guess)
      ? readNumber(raw.guess, "chargeNanocoulombs", -10, 10)
      : null;
    if (probes.some((p) => p === null) || nextProbe === null || guessPoint === null || charge === null) {
      return null;
    }
    return {
      probes: probes as Point[],
      nextProbe,
      guess: {
        xCm: round.knownPosition ? round.hidden.xCm : guessPoint.xCm,
        yCm: round.knownPosition ? round.hidden.yCm : guessPoint.yCm,
        chargeNanocoulombs: round.knownCharge ? round.hidden.chargeNanocoulombs : charge,
      },
    };
  },
  prediction: () => null,
  evaluate: (round, control) => evaluateDetective(round, control),
};
