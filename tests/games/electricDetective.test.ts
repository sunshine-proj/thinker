import { describe, expect, it } from "vitest";
import {
  DETECTIVE_ROUNDS,
  MINIMUM_PROBE_DISTANCE_CM,
  type DetectiveControl,
  type DetectiveRound,
} from "../../src/features/games/electric-detective/electricDetectiveData";
import {
  addProbe,
  electricDetective,
  evaluateDetective,
  measureForce,
  readingFor,
} from "../../src/features/games/electric-detective/electricDetectiveModel";
import { COULOMB_CONSTANT } from "../../src/physics/core";
import { calculateDistanceFromForce } from "../../src/physics/electromagnetism";

const [where, what, mystery] = DETECTIVE_ROUNDS as [DetectiveRound, DetectiveRound, DetectiveRound];

function withProbes(round: DetectiveRound, probes: { xCm: number; yCm: number }[]): DetectiveControl {
  return { ...electricDetective.createControl(round), probes };
}

describe("force readings", () => {
  it("equal k q Q / r² with the right direction for a positive source", () => {
    const reading = readingFor(where, { xCm: 35, yCm: 20 }); // 50 cm below a +4 nC charge
    const expectedMicronewtons = (COULOMB_CONSTANT * 4e-9 * 1e-9) / 0.25 * 1e6;

    expect(reading.magnitudeMicronewtons).toBeCloseTo(expectedMicronewtons, 6);
    expect(reading.directionDegrees).toBeCloseTo(-90, 6); // pushed away: straight down
  });

  it("points toward a negative source", () => {
    const reading = readingFor(what, { xCm: 60, yCm: 80 }); // above the −6 nC charge
    expect(reading.directionDegrees).toBeCloseTo(-90, 6); // pulled down toward it
  });

  it("scale with the inverse square of the distance", () => {
    const source = { xCm: 50, yCm: 50, chargeNanocoulombs: 2 };
    const near = measureForce(source, { xCm: 60, yCm: 50 });
    const far = measureForce(source, { xCm: 70, yCm: 50 });
    expect(near.magnitudeMicronewtons / far.magnitudeMicronewtons).toBeCloseTo(4, 8);
  });
});

describe("solving the cases the way a physicist would", () => {
  it("case 1: one reading's direction and size locate the source", () => {
    const probe = { xCm: 80, yCm: 20 };
    const reading = readingFor(where, probe);
    const distanceMeters = calculateDistanceFromForce(4e-9, 1e-9, reading.magnitudeMicronewtons * 1e-6);
    const unit = reading.forceMicronewtons.scale(1 / reading.magnitudeMicronewtons);
    // A positive source pushes the test charge away, so step back against the force.
    const guess = { xCm: probe.xCm - unit.x * distanceMeters * 100, yCm: probe.yCm - unit.y * distanceMeters * 100, chargeNanocoulombs: 4 };

    const outcome = evaluateDetective(where, { ...withProbes(where, [probe]), guess });
    expect(outcome.success).toBe(true);
    expect(outcome.positionErrorCm).toBeLessThan(0.01);
    expect(outcome.accuracyFraction).toBeGreaterThan(0.99);
  });

  it("case 2: force size and distance give the charge, and the force direction its sign", () => {
    const probe = { xCm: 60, yCm: 90 };
    const reading = readingFor(what, probe);
    const r = 0.5; // known distance to (60, 40)
    const magnitude = (reading.magnitudeMicronewtons * 1e-6 * r * r) / (COULOMB_CONSTANT * 1e-9) / 1e-9;
    const pulledToward = reading.forceMicronewtons.y < 0; // charge is below the probe
    const q = pulledToward ? -magnitude : magnitude;

    const control = withProbes(what, [probe]);
    const outcome = evaluateDetective(what, { ...control, guess: { ...control.guess, chargeNanocoulombs: q } });
    expect(q).toBeCloseTo(-6, 6);
    expect(outcome.success).toBe(true);
  });

  it("case 3: two readings triangulate the position, then the force gives the charge", () => {
    const a = { xCm: 80, yCm: 30 };
    const b = { xCm: 25, yCm: 85 };
    const ra = readingFor(mystery, a);
    const rb = readingFor(mystery, b);
    // Lines from each probe along ±force direction meet at the source (negative → toward it).
    const ua = ra.forceMicronewtons.scale(1 / ra.magnitudeMicronewtons);
    const ub = rb.forceMicronewtons.scale(1 / rb.magnitudeMicronewtons);
    const det = ua.x * -ub.y - -ub.x * ua.y;
    const dx = b.xCm - a.xCm;
    const dy = b.yCm - a.yCm;
    const t = (dx * -ub.y - -ub.x * dy) / det;
    const source = { xCm: a.xCm + ua.x * t, yCm: a.yCm + ua.y * t };
    const r = Math.hypot(a.xCm - source.xCm, a.yCm - source.yCm) / 100;
    const q = -((ra.magnitudeMicronewtons * 1e-6 * r * r) / (COULOMB_CONSTANT * 1e-9)) / 1e-9;

    const outcome = evaluateDetective(mystery, { ...withProbes(mystery, [a, b]), guess: { ...source, chargeNanocoulombs: q } });
    expect(source.xCm).toBeCloseTo(25, 6);
    expect(source.yCm).toBeCloseTo(30, 6);
    expect(q).toBeCloseTo(-3, 6);
    expect(outcome.success).toBe(true);
  });
});

describe("wrong hypotheses", () => {
  it("are tested against the measured force and the mismatch is explained", () => {
    const control = { ...withProbes(where, [{ xCm: 80, yCm: 20 }]), guess: { xCm: 10, yCm: 10, chargeNanocoulombs: 4 } };
    const outcome = evaluateDetective(where, control);

    expect(outcome.success).toBe(false);
    expect(outcome.accuracyFraction).toBe(0);
    expect(outcome.feedback).toMatch(/does not match reading 1: it predicts .* µN at .*°, but you measured .* µN at .*°/);
  });

  it("fail when the sign is wrong even if the position is right", () => {
    const control = withProbes(what, [{ xCm: 60, yCm: 90 }]);
    const outcome = evaluateDetective(what, { ...control, guess: { ...control.guess, chargeNanocoulombs: 6 } });
    expect(outcome.success).toBe(false);
    expect(outcome.chargeErrorNanocoulombs).toBeCloseTo(12, 8);
  });

  it("accept an answer inside the tolerance but with less accuracy credit", () => {
    const control = withProbes(where, [{ xCm: 80, yCm: 20 }]);
    const outcome = evaluateDetective(where, { ...control, guess: { xCm: 36.5, yCm: 70, chargeNanocoulombs: 4 } });
    expect(outcome.success).toBe(true);
    expect(outcome.accuracyFraction).toBeCloseTo(0.5, 6);
  });

  it("need at least one reading and an in-arena guess", () => {
    const empty = electricDetective.createControl(where);
    expect(() => evaluateDetective(where, empty)).toThrow(/at least one reading/);
    expect(() =>
      evaluateDetective(where, { ...withProbes(where, [{ xCm: 80, yCm: 20 }]), guess: { xCm: 120, yCm: 5, chargeNanocoulombs: 4 } }),
    ).toThrow(/inside/);
  });
});

describe("taking readings", () => {
  it("adds a probe at the chosen point", () => {
    const control = { ...electricDetective.createControl(where), nextProbe: { xCm: 80, yCm: 20 } };
    expect(addProbe(where, control).probes).toEqual([{ xCm: 80, yCm: 20 }]);
  });

  it("refuses probes next to the hidden charge, duplicates and extra readings", () => {
    const near = { ...electricDetective.createControl(where), nextProbe: { xCm: 36, yCm: 71 } };
    expect(() => addProbe(where, near)).toThrow(new RegExp(`within ${MINIMUM_PROBE_DISTANCE_CM} cm`));

    const once = addProbe(where, { ...electricDetective.createControl(where), nextProbe: { xCm: 80, yCm: 20 } });
    expect(() => addProbe(where, once)).toThrow(/already took/);

    let control = electricDetective.createControl(where);
    for (const x of [10, 20, 30]) {
      control = addProbe(where, { ...control, nextProbe: { xCm: x, yCm: 5 } });
    }
    expect(() => addProbe(where, { ...control, nextProbe: { xCm: 90, yCm: 5 } })).toThrow(/used all 3/);
  });
});

describe("rounds and saved state", () => {
  it("lock what is already known in the starting guess", () => {
    expect(electricDetective.createControl(where).guess.chargeNanocoulombs).toBe(4);
    expect(electricDetective.createControl(what).guess).toMatchObject({ xCm: 60, yCm: 40 });
  });

  it("ask for no prediction and increase in difficulty", () => {
    expect(electricDetective.prediction(where)).toBeNull();
    expect(DETECTIVE_ROUNDS.map((r) => r.difficulty)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });

  it("round-trip and reject corrupt saved controls", () => {
    const control = withProbes(mystery, [{ xCm: 80, yCm: 30 }]);
    expect(electricDetective.parseControl(JSON.parse(JSON.stringify(control)), mystery)).toEqual(control);
    expect(electricDetective.parseControl({ ...control, probes: [{ xCm: 999, yCm: 1 }] }, mystery)).toBeNull();
    expect(electricDetective.parseControl({ ...control, probes: [1, 2, 3, 4, 5] }, mystery)).toBeNull();
    expect(electricDetective.parseControl("nope", mystery)).toBeNull();
  });

  it("keep known values locked when restoring a save", () => {
    const control = electricDetective.createControl(where);
    const tampered = { ...control, guess: { ...control.guess, chargeNanocoulombs: 9 } };
    expect(electricDetective.parseControl(tampered, where)?.guess.chargeNanocoulombs).toBe(4);
  });
});
