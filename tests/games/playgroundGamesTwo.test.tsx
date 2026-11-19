import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { findCatalogEntry } from "../../src/data/games/gameCatalog";
import { runLiveGame } from "../../src/game-engine/live/liveModel";
import { PLAYGROUND_GAMES } from "../../src/features/playground-games";
import { PlaygroundGameRoute } from "../../src/features/playground-games/PlaygroundGameRoute";
import { PARTIES, balloonGap, balloonStaticParty, type BalloonState } from "../../src/features/playground-games/balloonStaticParty";
import { RALLIES, dominoRally, runRally } from "../../src/features/playground-games/dominoRally";
import { CEILING, COURSES, MAX_ENVELOPE_KELVIN, hotAirBalloonRace, type BalloonRaceState } from "../../src/features/playground-games/hotAirBalloonRace";
import { JOURNEYS, SOFT_CELSIUS, iceCreamRescue, iceCreamTemperature } from "../../src/features/playground-games/iceCreamRescue";
import { VAULTS, fireLaser, laserHeist } from "../../src/features/playground-games/laserHeist";
import { MAGNETIC, PONDS, currentToLift, magnetFishing, magnetReading, type FishingState } from "../../src/features/playground-games/magnetFishing";
import { NIGHTS, iglooFacts, iglooTemperature, penguinIgloo } from "../../src/features/playground-games/penguinIgloo";
import { PICTURES, colourOf, deviationFor, rainbowPainter, wavelengthAt, type PainterState } from "../../src/features/playground-games/rainbowPainter";
import { SHOWS, shadowFor, shadowPuppets } from "../../src/features/playground-games/shadowPuppets";
import { RINKS, spaceHockey, type HockeyState } from "../../src/features/playground-games/spaceHockey";
import { STANDARD_GRAVITY, COULOMB_CONSTANT, celsiusToKelvin } from "../../src/physics/core";
import { solveHangingSeparation } from "../../src/physics/electromagnetism";
import { calculateAirDensity, calculateFloatTemperature, calculateHotAirLift } from "../../src/physics/fluids";
import { calculateCrownGlassIndex, calculateLampDistanceForShadow, calculatePenumbraWidth, calculatePrismDeviation, calculateShadowSize } from "../../src/physics/optics";

const won = (result: { verdict: { status: string; message: string } }) => expect(result.verdict.status, result.verdict.message).toBe("won");
const lost = (result: { verdict: { status: string; message: string } }) => expect(result.verdict.status, result.verdict.message).toBe("lost");
const NEW_GAMES = ["domino-rally", "space-hockey", "magnet-fishing", "balloon-static-party", "ice-cream-rescue", "hot-air-balloon-race", "penguin-igloo", "laser-heist", "rainbow-painter", "shadow-puppets"];

describe("new playground physics", () => {
  it("prism: deviation is smallest for a symmetric ray, violet bends more, and steep rays are trapped", () => {
    expect(calculateCrownGlassIndex(589)).toBeCloseTo(1.5167, 3);
    const n = calculateCrownGlassIndex(550);
    const symmetric = (Math.asin(n * Math.sin(Math.PI / 6)) * 180) / Math.PI;
    const minimum = 2 * symmetric - 60;
    expect(calculatePrismDeviation(symmetric, 60, n)).toBeCloseTo(minimum, 9);
    for (const incidence of [symmetric - 5, symmetric + 5]) expect(calculatePrismDeviation(incidence, 60, n)!).toBeGreaterThan(minimum);
    expect(deviationFor(50, 400)!).toBeGreaterThan(deviationFor(50, 700)!);
    expect(calculatePrismDeviation(20, 60, n)).toBeNull();
  });

  it("shadows follow similar triangles; a point lamp gives no blur", () => {
    expect(calculateShadowSize(0.1, 0.5, 3)).toBeCloseTo(0.6, 12);
    expect(calculateLampDistanceForShadow(0.1, 0.6, 3)).toBeCloseTo(0.5, 12);
    expect(calculatePenumbraWidth(0.02, 1, 3)).toBeCloseTo(0.04, 12);
    expect(calculatePenumbraWidth(0, 1, 3)).toBe(0);
    expect(() => calculateShadowSize(0.1, 3, 2)).toThrow(RangeError);
    expect(() => calculatePenumbraWidth(0.02, 3, 2)).toThrow(RangeError);
  });

  it("hot air: ideal-gas density, and lift equals the load at the float temperature", () => {
    expect(calculateAirDensity(288.15)).toBeCloseTo(1.225, 2);
    const float = calculateFloatTemperature(2800, 500, 288.15);
    expect(calculateHotAirLift(2800, float, 288.15)).toBeCloseTo(500 * STANDARD_GRAVITY, 6);
    expect(() => calculateFloatTemperature(10, 1000, 288.15)).toThrow(RangeError);
  });

  it("charged balloons hang where Coulomb's push balances gravity", () => {
    const q = 100e-9;
    const d = solveHangingSeparation(-q, -q, 0.003, 0.5);
    const angle = Math.asin(d / 2 / 0.5);
    expect(Math.tan(angle)).toBeCloseTo((COULOMB_CONSTANT * q * q) / d ** 2 / (0.003 * STANDARD_GRAVITY), 6);
    expect(solveHangingSeparation(q, -q, 0.003, 0.5)).toBe(0);
    expect(balloonGap(-4, -4)).toBeGreaterThan(balloonGap(-3, -3));
    expect(() => solveHangingSeparation(q, q, 0, 0.5)).toThrow(RangeError);
  });

  it("electromagnet: more turns give the same pull with less heat", () => {
    const few = currentToLift(500, 2)!;
    const many = currentToLift(1000, 2)!;
    expect(magnetReading(500, few).pull).toBeCloseTo(magnetReading(1000, many).pull, 3);
    expect(magnetReading(1000, many).watts).toBeLessThan(magnetReading(500, few).watts);
  });

  it("collisions pass momentum along a chain, losing a little each bump", () => {
    const one = runRally(0, 0.5, 0.2);
    expect(one.ballSpeed).toBeCloseTo(Math.sqrt(2 * STANDARD_GRAVITY * 0.5), 12);
    expect(one.blockSpeed).toBeCloseTo(0.95 * one.ballSpeed, 12);
    expect(runRally(1, 0.5, 0.2).blockSpeed).toBeCloseTo(0.95 ** 3 * one.ballSpeed, 12);
    expect(runRally(2, 0.8, 0.4).blockSpeed).toBeGreaterThan(runRally(2, 0.8, 0.2).blockSpeed);
  });

  it("insulation: foam beats steel, and thicker walls keep things colder", () => {
    expect(iceCreamTemperature(0, 3, 2, 0.5)).toBeLessThan(iceCreamTemperature(0, 0, 2, 0.5));
    expect(iceCreamTemperature(1, 3, 8, 2)).toBeLessThan(iceCreamTemperature(1, 3, 4, 2));
    expect(iceCreamTemperature(0, 3, 2, 0)).toBeCloseTo(-18, 12);
  });

  it("igloo: a smaller dome or thicker walls settle warmer, at T_out + P/U", () => {
    const small = iglooFacts(0, { radius: 1, wallCm: 10 });
    expect(small.steady).toBeCloseTo(NIGHTS[0]!.outsideCelsius + small.heat / small.conductance, 12);
    expect(small.steady).toBeGreaterThan(iglooFacts(0, { radius: 1.5, wallCm: 10 }).steady);
    expect(iglooFacts(0, { radius: 1, wallCm: 20 }).steady).toBeGreaterThan(small.steady);
  });
});

/** A simple autopilot: puff toward each star, then brake to a stop in the goal. */
function hockeyPlan(level: number) {
  const rink = RINKS[level]!;
  const kick = 1 / rink.massKg;
  return (_t: number, s: HockeyState) => {
    const target = rink.gates[s.next] ?? rink.goalAt;
    const dx = target.x - s.x;
    const dy = target.y - s.y;
    const distance = Math.hypot(dx, dy);
    const final = s.next >= rink.gates.length;
    const speed = final ? Math.min(1.5, distance * 0.6) : 1.5;
    const want = { x: distance ? (dx / distance) * speed : 0, y: distance ? (dy / distance) * speed : 0 };
    const press: string[] = [];
    if (want.x - s.vx > kick * 0.75) press.push("right");
    if (s.vx - want.x > kick * 0.75) press.push("left");
    if (want.y - s.vy > kick * 0.75) press.push("up");
    if (s.vy - want.y > kick * 0.75) press.push("down");
    return { press };
  };
}

/** The middle of the widest run of slider settings that put the wanted colour on the spot. */
function rainbowSolution(level: number): number[] {
  return PICTURES[level]!.spots.map((spot) => {
    let best: [number, number] = [0, 0];
    let start: number | null = null;
    for (let i = 0; i <= 1000; i += 1) {
      const incidence = 30 + i * 0.05;
      const wavelength = wavelengthAt(incidence, spot.deviation);
      const good = wavelength !== null && colourOf(wavelength) === spot.colour;
      if (good && start === null) start = i;
      if ((!good || i === 1000) && start !== null) {
        if (i - start > best[1] - best[0]) best = [start, i];
        start = null;
      }
    }
    expect(best[1] - best[0], `${spot.label} must be reachable`).toBeGreaterThan(0);
    return 30 + Math.floor((best[0] + best[1]) / 2) * 0.05;
  });
}

const balloonTargets: readonly ((x: number) => number)[] = [
  (x) => (x < 650 ? 170 : 60),
  (x) => (x < 480 ? 180 : x < 1060 ? 60 : 180),
  (x) => (x < 520 ? 170 : x < 1000 ? 40 : 0),
];
/** Autopilot: choose a climb rate toward the target height and burn or vent to hold the matching air temperature. */
function balloonPlan(level: number) {
  const float = calculateFloatTemperature(2800, 500, celsiusToKelvin(15));
  return (_t: number, s: BalloonRaceState) => {
    const target = balloonTargets[level]!(s.x + 120);
    const want = Math.max(-3, Math.min(2.5, (target - s.altitude) / 15));
    const set = float + 1.2 * Math.sign(want) * want * want + 3 * (want - s.climb);
    return { held: s.insideKelvin < set ? ["burn"] : s.insideKelvin > set + 6 ? ["vent"] : [] };
  };
}

describe("every new playground level can be won, and the failures happen", () => {
  it("Domino Rally: the right ramp height or ball mass rings the bell", () => {
    won(runLiveGame(dominoRally, 0, () => ({ values: { height: 0.58 }, press: ["go"] }), 10));
    won(runLiveGame(dominoRally, 1, () => ({ values: { height: 0.92 }, press: ["go"] }), 10));
    won(runLiveGame(dominoRally, 2, () => ({ values: { ball: 0.27 }, press: ["go"] }), 10));
    lost(runLiveGame(dominoRally, 0, () => ({ values: { height: 0.2 }, press: ["go"] }), 10));
    lost(runLiveGame(dominoRally, 1, () => ({ values: { height: 1.5 }, press: ["go"] }), 10));
    expect(RALLIES).toHaveLength(3);
  });

  it("Space Hockey: steering by puffs wins every rink; never braking hits the wall", () => {
    for (const level of [0, 1, 2]) {
      const result = runLiveGame(spaceHockey, level, hockeyPlan(level), 150);
      won(result);
      expect(result.state.puffs).toBeGreaterThanOrEqual(0);
    }
    lost(runLiveGame(spaceHockey, 0, (t) => ({ press: t < 0.1 ? ["right"] : [] }), 150));
  });

  it("Magnet Fishing: just enough current catches the magnetic fish; too much burns out the coil", () => {
    for (const level of [0, 1, 2]) {
      const pond = PONDS[level]!;
      const result = runLiveGame(magnetFishing, level, (_t, s: FishingState) => {
        const spot = pond.items.findIndex((item, index) => MAGNETIC.has(item.material) && !s.caught[index]);
        return { values: { spot: spot + 1, turns: 1000, amps: currentToLift(1000, pond.items[spot]!.massKg)! * 1.02 }, press: ["catch"] };
      }, 10);
      won(result);
      expect(magnetFishing.stars(result.state, level)).toBe(3);
    }
    lost(runLiveGame(magnetFishing, 0, () => ({ values: { spot: 1, turns: 1000, amps: 5 }, press: ["catch"] }), 2));
    const brass = runLiveGame(magnetFishing, 0, () => ({ values: { spot: 2, turns: 1000, amps: 2 }, press: ["catch"] }), 0.2);
    expect(brass.verdict.message).toMatch(/brass/);
  });

  it("Balloon Static Party: like charges push apart, opposite charges stick, and over-rubbing loses", () => {
    const rubTo = (a: number, b: number) => (_t: number, s: BalloonState) => ({ press: s.a > a ? ["hairA"] : s.b > b ? ["hairB"] : s.b < b ? ["bagB"] : [] });
    won(runLiveGame(balloonStaticParty, 0, rubTo(-3, -3), 10));
    won(runLiveGame(balloonStaticParty, 1, rubTo(-1, 1), 10));
    won(runLiveGame(balloonStaticParty, 2, rubTo(-6, -6), 10));
    lost(runLiveGame(balloonStaticParty, 0, () => ({ press: ["hairA"] }), 10));
    expect(PARTIES[2]!.startB).toBe(-2);
  });

  it("Ice Cream Rescue: good insulation delivers frozen ice cream; steel melts it", () => {
    won(runLiveGame(iceCreamRescue, 0, () => ({ values: { material: 3, thickness: 7 }, press: ["drive"] }), 12));
    won(runLiveGame(iceCreamRescue, 1, () => ({ values: { material: 4, thickness: 7 }, press: ["drive"] }), 12));
    won(runLiveGame(iceCreamRescue, 2, () => ({ values: { material: 4, thickness: 16 }, press: ["drive"] }), 12));
    lost(runLiveGame(iceCreamRescue, 0, () => ({ values: { material: 1, thickness: 2 }, press: ["drive"] }), 12));
    // The thickest wall the van allows on the seaside trip is not enough with wood.
    expect(iceCreamTemperature(1, 2, JOURNEYS[1]!.maxThicknessCm, JOURNEYS[1]!.hours)).toBeGreaterThan(SOFT_CELSIUS);
  });

  it("Hot Air Balloon Race: an autopilot flies every course; burning nonstop overheats", () => {
    for (const level of [0, 1, 2]) won(runLiveGame(hotAirBalloonRace, level, balloonPlan(level), 900));
    const always = runLiveGame(hotAirBalloonRace, 0, () => ({ held: ["burn"] }), 900);
    lost(always);
    expect(always.state.insideKelvin > MAX_ENVELOPE_KELVIN || always.state.altitude > CEILING).toBe(true);
    lost(runLiveGame(hotAirBalloonRace, 0, (t) => ({ held: t < 60 ? ["burn"] : [] }), 900));
    expect(COURSES[2]!.landing).toBeDefined();
  });

  it("Penguin Igloo Builder: a snug igloo wins; too warm melts; too small does not fit", () => {
    won(runLiveGame(penguinIgloo, 0, () => ({ values: { radius: 0.8, wall: 6 }, press: ["night"] }), 12));
    won(runLiveGame(penguinIgloo, 1, () => ({ values: { radius: 0.6, wall: 11 }, press: ["night"] }), 12));
    won(runLiveGame(penguinIgloo, 2, () => ({ values: { radius: 1.6, wall: 6 }, press: ["night"] }), 12));
    lost(runLiveGame(penguinIgloo, 2, () => ({ values: { radius: 1.3, wall: 10 }, press: ["night"] }), 12));
    lost(runLiveGame(penguinIgloo, 1, () => ({ values: { radius: 0.9, wall: 5 }, press: ["night"] }), 12));
    const tiny = runLiveGame(penguinIgloo, 0, () => ({ values: { radius: 0.5, wall: 10 }, press: ["night"] }), 1);
    expect(tiny.verdict.message).toMatch(/do not fit/);
    expect(iglooTemperature(0, { radius: 0.8, wallCm: 6 }, 0)).toBe(NIGHTS[0]!.outsideCelsius);
  });

  it("Laser Heist: 45° mirrors reach the gem; a beam past a guard sets off the alarm", () => {
    won(runLiveGame(laserHeist, 0, () => ({ values: { m1: 45 }, press: ["fire"] }), 1));
    won(runLiveGame(laserHeist, 1, () => ({ values: { m1: 45, m2: 45 }, press: ["fire"] }), 1));
    won(runLiveGame(laserHeist, 2, () => ({ values: { m1: 45, m2: 45, m3: 135 }, press: ["fire"] }), 1));
    lost(runLiveGame(laserHeist, 0, () => ({ values: { m1: 70 }, press: ["fire"] }), 1));
    expect(fireLaser(0, [135]).trace.hitTarget).toBe(false);
    // Turning a mirror by 1° turns the beam by 2°.
    const beam = (angle: number) => {
      const points = fireLaser(0, [angle]).trace.points;
      const [a, b] = [points[1]!, points[2]!];
      return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    };
    expect(beam(40) - beam(39)).toBeCloseTo(2, 6);
    expect(VAULTS).toHaveLength(3);
  });

  it("Rainbow Painter: every spot can be painted; painting blind runs out of paint", () => {
    for (const level of [0, 1, 2]) {
      const solution = rainbowSolution(level);
      won(runLiveGame(rainbowPainter, level, (_t, s: PainterState) => ({ values: { incidence: solution[s.painted] ?? 60 }, press: ["paint"] }), 2));
    }
    lost(runLiveGame(rainbowPainter, 0, () => ({ values: { incidence: 60 }, press: ["paint"] }), 2));
    // Below violet's minimum deviation only the less-bent colours arrive.
    const lowest = Math.min(...Array.from({ length: 1001 }, (_, i) => deviationFor(30 + i * 0.05, 400) ?? Infinity));
    expect(lowest).toBeGreaterThan(PICTURES[2]!.spots[0]!.deviation);
  });

  it("Shadow Puppet Theatre: the right lamp distance and size win; a big lamp blurs", () => {
    won(runLiveGame(shadowPuppets, 0, () => ({ values: { distance: 0.5 }, press: ["lights"] }), 1));
    won(runLiveGame(shadowPuppets, 1, () => ({ values: { distance: 1.5, lamp: 1 }, press: ["lights"] }), 1));
    won(runLiveGame(shadowPuppets, 2, () => ({ values: { distance: 0.95 }, press: ["lights"] }), 1));
    const blurry = runLiveGame(shadowPuppets, 1, () => ({ values: { distance: 1.5, lamp: 5 }, press: ["lights"] }), 0.5);
    expect(blurry.verdict.status).toBe("playing");
    expect(blurry.verdict.message).toMatch(/blurred/);
    expect(shadowFor(2, 0.95, 4).blurCm).toBeLessThanOrEqual(SHOWS[2]!.maxBlurCm!);
  });
});

describe("new playground games are wired in", () => {
  it("each has a catalog entry in its own world and a working page", () => {
    for (const id of NEW_GAMES) {
      const game = PLAYGROUND_GAMES.find((entry) => entry.id === id);
      expect(game, id).toBeDefined();
      const entry = findCatalogEntry(id);
      expect(entry?.path).toBe(`/worlds/${game!.worldId}/${id}`);
      expect(game!.levels).toHaveLength(3);
    }
  });

  it("renders a game page with its controls", () => {
    render(<MemoryRouter><PlaygroundGameRoute gameId="laser-heist" /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Laser Heist" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Fire laser/ })).toBeTruthy();
  });
});
