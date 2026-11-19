import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { findCatalogEntry } from "../../src/data/games/gameCatalog";
import { runLiveGame } from "../../src/game-engine/live/liveModel";
import { PLAYGROUND_GAMES } from "../../src/features/playground-games";
import { PlaygroundGameRoute } from "../../src/features/playground-games/PlaygroundGameRoute";
import { IONISE, absorb, atomDisco, ionisationEdge, lineFor } from "../../src/features/playground-games/atomDisco";
import { CAVES, batNightHunt, mothEcho, soundSpeedIn } from "../../src/features/playground-games/batNightHunt";
import { HILLS, bikeDownhill, cornerLimit, gearFacts, nextBend, pieceAt, type BikeState } from "../../src/features/playground-games/bikeDownhill";
import { CASES, CLOCKS, dateFind, fossilDetective, type FossilState } from "../../src/features/playground-games/fossilDetective";
import { MAZES, fireGhosts, ghostParticleMaze, passChance } from "../../src/features/playground-games/ghostParticleMaze";
import { PUZZLES, isotopePuzzle, type IsotopeState } from "../../src/features/playground-games/isotopePuzzle";
import { CONTESTS, glide, paperPlaneContest } from "../../src/features/playground-games/paperPlaneContest";
import { judgePlanet, planetBakery } from "../../src/features/playground-games/planetBakery";
import { DELIVERY_ROCKET, STOPS, rocketDelivery, type DeliveryState } from "../../src/features/playground-games/rocketDelivery";
import { EARTH_ORBIT, MISSIONS, SUN_MU, flyMission, slingshotProbe } from "../../src/features/playground-games/slingshotProbe";
import { panelOutput, solarPowerPlant } from "../../src/features/playground-games/solarPowerPlant";
import { CLASSICAL_KELVIN, STAR_ORDERS, fusionRate, starFurnace } from "../../src/features/playground-games/starFurnace";
import { DIVES, NEUTRAL_BALLAST, submarineExplorer, type SubState } from "../../src/features/playground-games/submarineExplorer";
import { POOLS, WAVE_SPEED, surfTheWave, waveHeightAt } from "../../src/features/playground-games/surfTheWave";
import { GARDENS, simulateThrow, waterBalloonFight, type WaterState } from "../../src/features/playground-games/waterBalloonFight";
import { STANDARD_GRAVITY } from "../../src/physics/core";
import { calculateStarEnergy, planetPosition, stepProbe } from "../../src/physics/astronomy";
import { calculateCoulombBarrierMeV, calculateGamowEnergyKeV, calculateGamowPeakKeV, calculateTunnellingRateFactor, classifyLightNucleus, elementSymbol } from "../../src/physics/nuclear";

const won = (result: { verdict: { status: string; message: string } }) => expect(result.verdict.status, result.verdict.message).toBe("won");
const lost = (result: { verdict: { status: string; message: string } }) => expect(result.verdict.status, result.verdict.message).toBe("lost");
const NEW_GAMES = ["bat-night-hunt", "surf-the-wave", "slingshot-probe", "planet-bakery", "rocket-delivery", "atom-disco", "ghost-particle-maze", "solar-power-plant", "submarine-explorer", "paper-plane-contest", "isotope-puzzle", "fossil-detective", "star-furnace", "bike-downhill", "water-balloon-fight"];

describe("Phase 9 physics, part three", () => {
  it("gravity assist: energy is conserved around the star alone, and a flyby can raise it", () => {
    let probe = { x: EARTH_ORBIT, y: 0, vx: 0, vy: 11, t: 0 };
    const start = calculateStarEnergy(probe, SUN_MU);
    for (let i = 0; i < 6000; i += 1) probe = stepProbe(probe, 1 / 60, SUN_MU, []);
    expect(calculateStarEnergy(probe, SUN_MU)).toBeCloseTo(start, 6);
    // A circular orbit stays circular, with period 2π√(r³/μ).
    let circle = { x: EARTH_ORBIT, y: 0, vx: 0, vy: Math.sqrt(SUN_MU / EARTH_ORBIT), t: 0 };
    for (let i = 0; i < Math.round(2 * Math.PI * 60); i += 1) circle = stepProbe(circle, 1 / 60, SUN_MU, []);
    expect(Math.hypot(circle.x - EARTH_ORBIT, circle.y)).toBeLessThan(0.05);
    const planet = { mu: 30, orbitRadius: 25, phase: 0 };
    expect(Math.hypot(planetPosition(planet, SUN_MU, 0).x, planetPosition(planet, SUN_MU, 0).y)).toBeCloseTo(25, 12);
    expect(flyMission(1, 12, 92).energyGain).toBeGreaterThan(5);
  });

  it("Gamow tunnelling: 2 protons need ~490 keV, and the rate climbs steeply with temperature", () => {
    expect(calculateGamowEnergyKeV(1, 1, 0.5)).toBeGreaterThan(480);
    expect(calculateGamowEnergyKeV(1, 1, 0.5)).toBeLessThan(500);
    expect(calculateGamowEnergyKeV(2, 2, 2)).toBeCloseTo(calculateGamowEnergyKeV(1, 1, 0.5) * 64, 6);
    expect(calculateTunnellingRateFactor(490, 18e6)).toBeGreaterThan(calculateTunnellingRateFactor(490, 15e6));
    // The Sun's protons fuse at a few keV, far below the ~550 keV barrier.
    expect(calculateGamowPeakKeV(490, 15.7e6)).toBeGreaterThan(4);
    expect(calculateGamowPeakKeV(490, 15.7e6)).toBeLessThan(8);
    expect(calculateCoulombBarrierMeV(1, 1, 1, 1)).toBeGreaterThan(0.5);
    expect(CLASSICAL_KELVIN).toBeGreaterThan(5e9);
    expect(fusionRate(15.7e6)).toBeCloseTo(1, 12);
    expect(fusionRate(18.8e6)).toBeGreaterThan(1.8);
  });

  it("light nuclei: the measured stable ones, and the decay direction of the rest", () => {
    expect(classifyLightNucleus(6, 6)).toBe("stable");
    expect(classifyLightNucleus(6, 8)).toBe("beta-minus");
    expect(classifyLightNucleus(7, 6)).toBe("beta-plus");
    expect(classifyLightNucleus(4, 4)).toBe("falls-apart");
    expect(classifyLightNucleus(2, 3)).toBe("falls-apart");
    expect(elementSymbol(10)).toBe("Ne");
    expect(() => classifyLightNucleus(13, 13)).toThrow(RangeError);
  });

  it("echoes, interference, hydrogen lines, tunnelling and the photoelectric threshold", () => {
    expect(mothEcho(0, 0)).toBeCloseTo((2 * 3.4) / soundSpeedIn(0), 12);
    expect(soundSpeedIn(2)).toBeGreaterThan(soundSpeedIn(0));
    expect(waveHeightAt(1, 0.5, WAVE_SPEED / 2, 0)).toBeCloseTo(2, 12);
    expect(waveHeightAt(1, 0.5, WAVE_SPEED / 2, 3)).toBeLessThan(1e-9);
    expect(lineFor(2, 3)).toBeCloseTo(656.1, 0);
    expect(ionisationEdge(1)).toBeCloseTo(91.1, 0);
    expect(absorb(2, 600)).toBeNull();
    expect(passChance(0, 0.3)).toBeLessThan(passChance(0, 0.2));
    expect(passChance(2, 0.02)).toBeLessThan(passChance(0, 0.02));
    const red = panelOutput(0, 650, 2);
    expect(red.kinetic).toBe(0);
    expect(red.milliamps).toBe(0);
    expect(panelOutput(0, 400, 2).milliamps).toBeCloseTo(2 * panelOutput(0, 400, 1).milliamps, 9);
  });

  it("gliding: distance = height × L/D; too steep stalls", () => {
    const flight = glide(0, 5, 6);
    expect(flight.distance).toBeCloseTo(CONTESTS[0]!.launchHeight * flight.ratio, 12);
    expect(glide(0, 5, 18).stalled).toBe(true);
    expect(glide(1, 8, 7).ratio).toBeGreaterThan(glide(1, 2, 7).ratio);
  });

  it("corners: v = √(μgR); gears trade force for speed", () => {
    expect(cornerLimit(0.7, 15)).toBeCloseTo(Math.sqrt(0.7 * STANDARD_GRAVITY * 15), 12);
    expect(gearFacts(1).maxForce).toBeGreaterThan(gearFacts(3).maxForce);
    expect(gearFacts(1).topSpeed).toBeLessThan(gearFacts(3).topSpeed);
    expect(pieceAt(HILLS[0]!, 310).piece.cornerRadius).toBe(15);
  });
});

/** Brake for each bend in time, pedal otherwise, and shift gears with the speed. */
function bikePlan(level: number) {
  const hill = HILLS[level]!;
  return (_t: number, s: BikeState) => {
    const bend = nextBend(hill, s.distance);
    const { piece } = pieceAt(hill, s.distance);
    const decel = hill.brakeGrip * STANDARD_GRAVITY + (piece.gradePercent / 100) * STANDARD_GRAVITY;
    const limit = bend ? 0.9 * cornerLimit(hill.grip, bend.radius) : Infinity;
    const toBend = bend ? Math.max(0, bend.start - s.distance) : Infinity;
    const brake = s.speed > limit && (s.speed ** 2 - limit ** 2) / (2 * decel) + 3 * s.speed * (1 / 60) + 1 >= toBend;
    const gear = s.speed < gearFacts(1).topSpeed * 0.9 ? 1 : s.speed < gearFacts(2).topSpeed * 0.9 ? 2 : 3;
    return { values: { gear }, held: brake ? ["brake"] : ["pedal"] };
  };
}

function rocketPlan(level: number) {
  const stop = STOPS[level]!;
  return (_t: number, s: DeliveryState) => {
    const net = DELIVERY_ROCKET.maximumThrustNewtons / (DELIVERY_ROCKET.dryMassKilograms + s.fuelKg) - stop.gravity;
    const target = -Math.max(0.8, Math.sqrt(2 * 0.6 * net * s.altitude));
    return { held: s.velocity < target ? ["thrust"] : [] };
  };
}

function submarinePlan(level: number) {
  const dive = DIVES[level]!;
  return (_t: number, s: SubState) => {
    const target = dive.stations[Math.min(s.station, dive.stations.length - 1)]!.depth;
    const want = Math.max(-0.8, Math.min(0.8, (target - s.depth) / 8));
    const set = NEUTRAL_BALLAST + 157 * Math.sign(want) * want * want + 300 * (want - s.velocity);
    return { held: s.ballast < set - 2 ? ["flood"] : s.ballast > set + 2 ? ["blow"] : [] };
  };
}

/** A throw that lands on each bucket: for each angle, bisect on speed. */
function throwFor(level: number, target: number): { angle: number; speed: number } {
  for (const angle of [45, 50, 55, 60, 65, 70, 40, 35]) {
    let low = 2;
    let high = 14;
    for (let i = 0; i < 50; i += 1) {
      const middle = (low + high) / 2;
      const landing = simulateThrow(level, middle, angle);
      if (landing.kind === "fence" || landing.x < target) low = middle;
      else high = middle;
    }
    const landing = simulateThrow(level, high, angle);
    if (landing.kind === "ground" && Math.abs(landing.x - target) < 0.3) return { angle, speed: high };
  }
  throw new Error(`no throw for ${target}`);
}

describe("every level of the last fifteen games can be won, and failures happen", () => {
  it("Bat Night Hunt: d = v t / 2 catches every moth; three misses lose", () => {
    for (const level of [0, 1, 2]) {
      won(runLiveGame(batNightHunt, level, (_t, s) => ({ values: { distance: Math.round(CAVES[level]!.moths[s.caught]! * 10) / 10 }, press: s.heard ? ["pounce"] : ["click"] }), 5));
    }
    // Forgetting to halve the round trip overshoots.
    const doubled = runLiveGame(batNightHunt, 0, (_t, s) => ({ values: { distance: Math.min(20, mothEcho(0, s.caught) * soundSpeedIn(0)) }, press: s.heard ? ["pounce"] : ["click"] }), 5);
    lost(doubled);
  });

  it("Surf the Wave: amplitude, then a frequency that cancels at the swimmers", () => {
    won(runLiveGame(surfTheWave, 0, () => ({ values: { amplitude: 0.9, frequency: 1 }, press: ["surf"] }), 1));
    won(runLiveGame(surfTheWave, 1, () => ({ values: { amplitude: 0.5, frequency: 0.78 }, press: ["surf"] }), 1));
    won(runLiveGame(surfTheWave, 2, () => ({ values: { amplitude: 0.5, frequency: 0.78 }, press: ["surf"] }), 1));
    lost(runLiveGame(surfTheWave, 0, () => ({ values: { amplitude: 1.5, frequency: 1 }, press: ["surf"] }), 1));
    expect(runLiveGame(surfTheWave, 1, () => ({ values: { amplitude: 0.5, frequency: 1 }, press: ["surf"] }), 0.2).verdict.message).toMatch(/swimmers/);
    expect(POOLS[2]!.swimmerPath).toBe(5);
  });

  it("Slingshot Space Probe: each comet is reachable; Jupiter's boost is needed for the far ones", () => {
    const solutions = [[11.1, 80], [12, 92], [12.1, 91]] as const;
    for (const level of [0, 1, 2]) {
      const [speed, direction] = solutions[level]!;
      won(runLiveGame(slingshotProbe, level, () => ({ values: { speed, direction }, press: ["launch"] }), 120));
    }
    // Without a planet, the fastest launch cannot climb out to the far comets.
    for (const level of [1, 2]) {
      const mission = MISSIONS[level]!;
      expect(mission.maxSpeed ** 2 / 2 - SUN_MU / EARTH_ORBIT).toBeLessThan(-SUN_MU / Math.hypot(mission.comet.x, mission.comet.y));
    }
  });

  it("Planet Bakery: each recipe can be baked; Earth fails the bouncy recipe", () => {
    const recipes = [{ mass: 0.15, radius: 1 }, { mass: 2.56, radius: 1.6 }, { mass: 0.075, radius: 0.45 }];
    recipes.forEach((values, level) => {
      expect(judgePlanet(level, values.mass, values.radius).problems).toEqual([]);
      won(runLiveGame(planetBakery, level, () => ({ values, press: ["bake"] }), 1));
    });
    expect(judgePlanet(0, 1, 1).problems[0]).toMatch(/too low/);
    expect(judgePlanet(1, 4, 2).problems.join()).toMatch(/fluffy/);
  });

  it("Rocket Delivery: a well-timed burn lands softly everywhere; no thrust crashes; too much on Vesta flies away", () => {
    for (const level of [0, 1, 2]) won(runLiveGame(rocketDelivery, level, rocketPlan(level), 300));
    lost(runLiveGame(rocketDelivery, 0, () => ({}), 300));
    lost(runLiveGame(rocketDelivery, 2, () => ({ held: ["thrust"] }), 300));
  });

  it("Atom Disco: the exact line colours win; wrong colours just pass through", () => {
    const shots = [[lineFor(2, 3)], [lineFor(2, 4), lineFor(2, 5)], [lineFor(1, 2), lineFor(1, 3), 85]];
    for (const level of [0, 1, 2]) {
      const result = runLiveGame(atomDisco, level, (_t, s) => ({ values: { wavelength: Math.round(shots[level]![s.done]! * 10) / 10 }, press: ["fire"] }), 2);
      won(result);
      expect(atomDisco.stars(result.state, level)).toBe(3);
    }
    lost(runLiveGame(atomDisco, 0, () => ({ values: { wavelength: 550 }, press: ["fire"] }), 2));
    expect(absorb(1, 85)).toBe(IONISE);
  });

  it("Ghost Particle Maze: the right wall thickness lets the right number through", () => {
    const solve = (level: number, wanted: number) => {
      let low = 0.005;
      let high = level === 2 ? 0.1 : 1;
      for (let i = 0; i < 60; i += 1) {
        const middle = (low + high) / 2;
        if (passChance(level, middle) > wanted) low = middle;
        else high = middle;
      }
      return (low + high) / 2;
    };
    const wanted = [0.1, 0.05, 0.1];
    for (const level of [0, 1, 2]) {
      const width = solve(level, wanted[level]!);
      const step = level === 2 ? 0.0002 : 0.002;
      won(runLiveGame(ghostParticleMaze, level, () => ({ values: { width: Math.round(width / step) * step }, press: ["fire"] }), 1));
    }
    expect(fireGhosts(0, 1, 1)).toBe(0);
    expect(MAZES[2]!.particle).toBe("muon");
  });

  it("Solar Power Plant: short enough light charges the robot; a bright red lamp never does", () => {
    won(runLiveGame(solarPowerPlant, 0, () => ({ values: { wavelength: 400, watts: 1 }, press: ["shine"] }), 1));
    won(runLiveGame(solarPowerPlant, 1, () => ({ values: { wavelength: 200, watts: 1 }, press: ["shine"] }), 1));
    won(runLiveGame(solarPowerPlant, 2, () => ({ values: { wavelength: 450 }, press: ["shine"] }), 1));
    const red = runLiveGame(solarPowerPlant, 0, () => ({ values: { wavelength: 650, watts: 2 }, press: ["shine"] }), 0.2);
    expect(red.verdict.message).toMatch(/brighter lamp will not help/);
    // Too short a wavelength on level 3 gives fewer photons per watt, so too little current.
    expect(panelOutput(2, 400, 1).charges).toBe(false);
  });

  it("Submarine Explorer: steady ballast control visits every creature; flooding nonstop is crushed or bumps", () => {
    for (const level of [0, 1, 2]) won(runLiveGame(submarineExplorer, level, submarinePlan(level), 600));
    lost(runLiveGame(submarineExplorer, 2, () => ({ held: ["flood"] }), 600));
    lost(runLiveGame(submarineExplorer, 0, () => ({ held: ["flood"] }), 600));
  });

  it("Paper Plane Contest: good wings reach each target; a stall drops short", () => {
    const pick = (level: number) => {
      for (let aspect = 1; aspect <= 8; aspect += 0.1) for (let angle = 0; angle <= 20; angle += 0.1) {
        const distance = glide(level, aspect, angle).distance;
        const zone = CONTESTS[level]!.zone;
        if (distance >= zone[0] + 0.3 && distance <= zone[1] - 0.3) return { aspect: Math.round(aspect * 10) / 10, angle: Math.round(angle * 10) / 10 };
      }
      throw new Error("no plane");
    };
    for (const level of [0, 1, 2]) {
      const values = pick(level);
      won(runLiveGame(paperPlaneContest, level, () => ({ values, press: ["throw"] }), 5));
    }
    expect(glide(1, 2, 7).distance).toBeLessThan(CONTESTS[1]!.zone[0]);
    const stall = runLiveGame(paperPlaneContest, 0, (_t, s) => ({ values: { aspect: 5, angle: 19 }, press: s.flight ? [] : ["throw"] }), 4);
    expect(stall.verdict.message).toMatch(/stalled/);
  });

  it("Isotope Puzzle: balanced nuclei are stable; too many pops lose", () => {
    const builds = [[[2, 2], [6, 6]], [[8, 8], [10, 10]], [[6, 7], [7, 8]]];
    for (const level of [0, 1, 2]) {
      const result = runLiveGame(isotopePuzzle, level, (_t, s: IsotopeState) => {
        const [p, n] = builds[level]![s.done]!;
        const press = [s.protons < p! ? "addP" : s.protons > p! ? "removeP" : "", s.neutrons < n! ? "addN" : s.neutrons > n! ? "removeN" : ""].filter(Boolean);
        return { press: press.length ? press : ["test"] };
      }, 5);
      won(result);
      expect(result.state.pops).toBe(0);
    }
    lost(runLiveGame(isotopePuzzle, 0, (_t, s: IsotopeState) => ({ press: s.protons < 2 ? ["addP"] : ["test"] }), 5));
    expect(PUZZLES[2]!.orders[1]!.massNumber).toBe(15);
  });

  it("Fossil Detective: half-lives date every find; carbon-14 cannot date a dinosaur", () => {
    for (const level of [0, 1, 2]) {
      const result = runLiveGame(fossilDetective, level, (_t, s: FossilState) => {
        const find = CASES[level]!.finds[s.dated]!;
        const clock = find.ageYears > 1e6 ? 1 : 0;
        return { values: { clock: clock + 1, halfLives: Math.round((find.ageYears / CLOCKS[clock].halfLifeYears) * 1000) / 1000 }, press: ["date"] };
      }, 2);
      won(result);
    }
    expect(dateFind(2, 0, 0, 3)).toBe("all-gone");
    expect(dateFind(1, 0, 1, 0.001)).toBe("barely-changed");
  });

  it("Star Furnace: a temperature for each star; cold cores barely fuse", () => {
    for (const level of [0, 1, 2]) {
      const band = STAR_ORDERS[level]!.brightness;
      let megakelvin = 1;
      while (megakelvin < 60 && !(fusionRate(megakelvin * 1e6) >= band[0] && fusionRate(megakelvin * 1e6) <= band[1])) megakelvin = Math.round((megakelvin + 0.1) * 10) / 10;
      won(runLiveGame(starFurnace, level, () => ({ values: { megakelvin }, press: ["ignite"] }), 1));
    }
    expect(fusionRate(5e6)).toBeLessThan(0.01);
  });

  it("Bike Downhill Race: braking before the bends wins; never braking skids off", () => {
    for (const level of [0, 1, 2]) won(runLiveGame(bikeDownhill, level, bikePlan(level), 120));
    lost(runLiveGame(bikeDownhill, 0, () => ({ held: ["pedal"] }), 120));
    lost(runLiveGame(bikeDownhill, 2, () => ({ held: ["pedal"] }), 120));
  });

  it("Water Balloon Fight: a solved throw splashes each bucket; a flat throw hits the fence", () => {
    for (const level of [0, 1, 2]) {
      const throws = GARDENS[level]!.targets.map((target) => throwFor(level, target));
      won(runLiveGame(waterBalloonFight, level, (_t, s: WaterState) => {
        const next = s.splashed.findIndex((done) => !done);
        return { values: throws[Math.max(0, next)]!, press: s.balloon ? [] : ["throw"] };
      }, 30));
    }
    expect(simulateThrow(1, 10, 15).kind).toBe("fence");
    lost(runLiveGame(waterBalloonFight, 1, (_t, s: WaterState) => ({ values: { angle: 15, speed: 10 }, press: s.balloon ? [] : ["throw"] }), 30));
  });
});

describe("the last fifteen playground games are wired in", () => {
  it("each has a catalog entry in its world and three levels", () => {
    for (const id of NEW_GAMES) {
      const game = PLAYGROUND_GAMES.find((entry) => entry.id === id);
      expect(game, id).toBeDefined();
      expect(findCatalogEntry(id)?.path).toBe(`/worlds/${game!.worldId}/${id}`);
      expect(game!.levels).toHaveLength(3);
    }
    expect(PLAYGROUND_GAMES).toHaveLength(30);
  });

  it("renders a game page", async () => {
    await act(async () => {
      render(<MemoryRouter><PlaygroundGameRoute gameId="atom-disco" /></MemoryRouter>);
    });
    expect(await screen.findByRole("heading", { name: "Atom Disco" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Fire photon/ })).toBeTruthy();
  });
});
