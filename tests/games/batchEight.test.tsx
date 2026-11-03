import { describe, expect, it } from "vitest";
import { DAM_META, DAM_ROUNDS, runDam, type DamRound } from "../../src/features/games/dam-engineer/damEngineer";
import { DamEngineerPage } from "../../src/features/games/dam-engineer/DamEngineerPage";
import { BEST_GLIDE_RATIO, BEST_GLIDE_SPEED, FLIGHT_META, FLIGHT_ROUNDS, STALL_SPEED, runFlight, type FlightRound } from "../../src/features/games/flight-simulator/flightSimulator";
import { FlightSimulatorPage } from "../../src/features/games/flight-simulator/FlightSimulatorPage";
import { PIPE_META, PIPE_ROUNDS, runPipe, type PipeRound } from "../../src/features/games/pipe-puzzle/pipePuzzle";
import { PipePuzzlePage } from "../../src/features/games/pipe-puzzle/PipePuzzlePage";
import { FLOAT_META, FLOAT_ROUNDS, runFloat, type FloatRound } from "../../src/features/games/floating-challenge/floatingChallenge";
import { FloatingChallengePage } from "../../src/features/games/floating-challenge/FloatingChallengePage";
import { FISSION_Q, HELIUM_BINDING, NUCLEAR_META, NUCLEAR_ROUNDS, PEAK_VALUE, bindingPerNucleonAt, runNuclear, type NuclearRound } from "../../src/features/games/nuclear-puzzle/nuclearPuzzle";
import { NuclearPuzzlePage } from "../../src/features/games/nuclear-puzzle/NuclearPuzzlePage";
import { HALF_LIFE_META, HALF_LIFE_ROUNDS, runHalfLife, type HalfLifeRound } from "../../src/features/games/half-life-challenge/halfLifeChallenge";
import { HalfLifeChallengePage } from "../../src/features/games/half-life-challenge/HalfLifeChallengePage";
import { DT_BARRIER_KEV, DT_Q_MEV, FUSION_META, FUSION_ROUNDS, runFusion, type FusionRound } from "../../src/features/games/fusion-simulator/fusionSimulator";
import { FusionSimulatorPage } from "../../src/features/games/fusion-simulator/FusionSimulatorPage";
import { ENERGY_META, ENERGY_ROUNDS, HYDROGEN_TERAJOULES, SUN_TARGET_TONNES, runEnergy, type EnergyRound } from "../../src/features/games/energy-detective/energyDetective";
import { EnergyDetectivePage } from "../../src/features/games/energy-detective/EnergyDetectivePage";
import { ISOTOPE_META, ISOTOPE_ROUNDS, VALLEY, runIsotope, type IsotopeRound } from "../../src/features/games/isotope-explorer/isotopeExplorer";
import { IsotopeExplorerPage } from "../../src/features/games/isotope-explorer/IsotopeExplorerPage";
import { BIKE_META, BIKE_ROUNDS, runBike, type BikeRound } from "../../src/features/games/bicycle-physics/bicyclePhysics";
import { BicyclePhysicsPage } from "../../src/features/games/bicycle-physics/BicyclePhysicsPage";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { checkGuards, playThrough } from "../helpers/playthrough";

const [lake, flood, uplift] = DAM_ROUNDS as [DamRound, DamRound, DamRound];
const [takeoff, angle, glide] = FLIGHT_ROUNDS as [FlightRound, FlightRound, FlightRound];
const [nozzle, venturi, oil] = PIPE_ROUNDS as [PipeRound, PipeRound, PipeRound];
const [block, shell, egg] = FLOAT_ROUNDS as [FloatRound, FloatRound, FloatRound];
const [peak, helium, fission] = NUCLEAR_ROUNDS as [NuclearRound, NuclearRound, NuclearRound];
const [chain, readings, mixture] = HALF_LIFE_ROUNDS as [HalfLifeRound, HalfLifeRound, HalfLifeRound];
const [barrier, temperature, fuel] = FUSION_ROUNDS as [FusionRound, FusionRound, FusionRound];
const [sun, hydrogen, reaction] = ENERGY_ROUNDS as [EnergyRound, EnergyRound, EnergyRound];
const [identify, daughter, series] = ISOTOPE_ROUNDS as [IsotopeRound, IsotopeRound, IsotopeRound];
const [gear, climb, aero] = BIKE_ROUNDS as [BikeRound, BikeRound, BikeRound];

describe("Dam Engineer (worked by hand)", () => {
  it("round 1: a 4.6 m dam has SF 1.5; thinner tips, much thicker wastes concrete", () => {
    const ok = runDam(lake, { waterDepth: 10, damHeight: 10, thickness: 4.7 });
    expect(ok.forceNewtons).toBeCloseTo(490_332, -1);
    expect(ok.safetyFactor).toBeCloseTo(1.59, 1);
    expect(ok.success).toBe(true);
    expect(runDam(lake, { waterDepth: 10, damHeight: 10, thickness: 3 }).feedback).toMatch(/could tip over/);
    expect(runDam(lake, { waterDepth: 10, damHeight: 10, thickness: 8 }).feedback).toMatch(/wasteful/);
  });
  it("round 2: the 14 m flood needs 6.2–6.8 m", () => {
    expect(runDam(flood, { waterDepth: 14, damHeight: 15, thickness: 6.4 }).success).toBe(true);
    expect(runDam(flood, { waterDepth: 14, damHeight: 15, thickness: 5 }).success).toBe(false);
  });
  it("round 3: uplift lowers the safety factor so the same dam is weaker", () => {
    const withUplift = runDam(uplift, { waterDepth: 10, damHeight: 11, thickness: 5 });
    const without = runDam({ ...uplift, kind: "lake" }, { waterDepth: 10, damHeight: 11, thickness: 5 });
    expect(withUplift.safetyFactor).toBeLessThan(without.safetyFactor);
    expect(runDam(uplift, { waterDepth: 10, damHeight: 11, thickness: 5.5 }).success).toBe(true);
  });
  it("guards and plays through", async () => {
    checkGuards(DamEngineerPage, DAM_META, { sliders: { "Dam thickness": 3 }, prediction: 4.5, feedback: /could tip over/ });
  });
  it("completes", async () => {
    await playThrough(DamEngineerPage, DAM_META, [
      { sliders: { "Dam thickness": 4.7 }, prediction: 4.56 },
      { sliders: { "Dam thickness": 6.4 }, prediction: 6.17 },
      { sliders: { "Dam thickness": 5.5 }, prediction: 5.2 },
    ]);
  });
});

describe("Flight Simulator (worked by hand)", () => {
  it("round 1: the stall speed is 25.0 m/s so 25.5–26.5 m/s lifts off efficiently", () => {
    expect(STALL_SPEED).toBeCloseTo(25.0, 1);
    expect(runFlight(takeoff, { cl: 1.6, speed: 26 }).success).toBe(true);
    expect(runFlight(takeoff, { cl: 1.6, speed: 20 }).feedback).toMatch(/cannot leave the ground/);
    expect(runFlight(takeoff, { cl: 1.6, speed: 40 }).feedback).toMatch(/needlessly long/);
  });
  it("round 2: 7.1° gives C_L = 0.63 at 40 m/s; 20° stalls", () => {
    const ok = runFlight(angle, { speed: 40, angle: 7.1 });
    expect(ok.requiredLiftCoefficient).toBeCloseTo(0.6254, 3);
    expect(ok.success).toBe(true);
    expect(runFlight(angle, { speed: 40, angle: 3 }).feedback).toMatch(/sinks/);
    expect(runFlight(angle, { speed: 40, angle: 12 }).feedback).toMatch(/climbs/);
    const stalled = runFlight(angle, { speed: 40, angle: 20 });
    expect(stalled.stalled).toBe(true);
    expect(stalled.feedback).toMatch(/stall angle/);
  });
  it("round 3: the best glide is L/D 12.9 at 35.9 m/s; below 25 m/s the wing stalls", () => {
    expect(BEST_GLIDE_SPEED).toBeCloseTo(35.9, 1);
    expect(BEST_GLIDE_RATIO).toBeCloseTo(12.94, 1);
    expect(runFlight(glide, { speed: 36 }).success).toBe(true);
    expect(runFlight(glide, { speed: 50 }).feedback).toMatch(/too fast/);
    expect(runFlight(glide, { speed: 27 }).feedback).toMatch(/too slow/);
    expect(runFlight(glide, { speed: 22 }).feedback).toMatch(/stalls/);
  });
  it("guards and plays through", async () => {
    checkGuards(FlightSimulatorPage, FLIGHT_META, { sliders: { "Takeoff speed": 20 }, prediction: 25, feedback: /cannot leave the ground/ });
  });
  it("completes", async () => {
    await playThrough(FlightSimulatorPage, FLIGHT_META, [
      { sliders: { "Takeoff speed": 26 }, prediction: 25 },
      { sliders: { "Angle of attack": 7.1 }, prediction: 7.1 },
      { sliders: { Airspeed: 36 }, prediction: 35.9 },
    ]);
  });
});

describe("Pipe Puzzle (worked by hand)", () => {
  it("round 1: 11.3 mm gives 20 m/s from 2 L/s", () => {
    const o = runPipe(nozzle, { flow: 2, diameter: 11.3 });
    expect(o.speed).toBeCloseTo(19.94, 1);
    expect(o.success).toBe(true);
    expect(runPipe(nozzle, { flow: 2, diameter: 20 }).feedback).toMatch(/too slow/);
    expect(runPipe(nozzle, { flow: 2, diameter: 6 }).feedback).toMatch(/too fast/);
  });
  it("round 2: a 26.2 mm throat drops the pressure by 40 kPa", () => {
    const o = runPipe(venturi, { flow: 5, pipe: 50, diameter: 26.2 });
    expect(o.measured / 1000).toBeCloseTo(40, 0);
    expect(o.success).toBe(true);
    expect(runPipe(venturi, { flow: 5, pipe: 50, diameter: 40 }).feedback).toMatch(/too small/);
    expect(runPipe(venturi, { flow: 5, pipe: 50, diameter: 15 }).feedback).toMatch(/too large/);
  });
  it("round 3: a 30 mm oil pipe carries 1 L/s at Re = 378; a wide pipe goes turbulent", () => {
    const o = runPipe(oil, { length: 10, pressure: 50, diameter: 30 });
    expect(o.measured * 1000).toBeCloseTo(0.99, 1);
    expect(o.reynolds).toBeCloseTo(378, -1);
    expect(o.success).toBe(true);
    expect(runPipe(oil, { length: 10, pressure: 50, diameter: 40 }).feedback).toMatch(/too much/);
    expect(runPipe(oil, { length: 10, pressure: 50, diameter: 60 }).feedback).toMatch(/turbulent/);
    expect(runPipe(oil, { length: 10, pressure: 50, diameter: 20 }).feedback).toMatch(/too little/);
  });
  it("guards and plays through", async () => {
    checkGuards(PipePuzzlePage, PIPE_META, { sliders: { "Nozzle diameter": 20 }, prediction: 11, feedback: /too slow/ });
  });
  it("completes", async () => {
    await playThrough(PipePuzzlePage, PIPE_META, [
      { sliders: { "Nozzle diameter": 11.3 }, prediction: 11.28 },
      { sliders: { "Throat diameter": 26.2 }, prediction: 26.2 },
      { sliders: { "Pipe diameter": 30 }, prediction: 30 },
    ]);
  });
});

describe("Floating Challenge (worked by hand)", () => {
  it("round 1: 300 kg/m³ floats 30 % submerged; denser sinks deeper", () => {
    expect(runFloat(block, { fluid: 1000, density: 300 }).success).toBe(true);
    expect(runFloat(block, { fluid: 1000, density: 800 }).feedback).toMatch(/too deep/);
    expect(runFloat(block, { fluid: 1000, density: 100 }).feedback).toMatch(/too high/);
    expect(runFloat(block, { fluid: 1000, density: 1100 }).feedback).toMatch(/sinks/);
  });
  it("round 2: a 10.9 mm steel shell floats half submerged; a thick shell sinks", () => {
    const ok = runFloat(shell, { fluid: 1000, thickness: 10.9 });
    expect(ok.objectDensity).toBeCloseTo(500, -1);
    expect(ok.success).toBe(true);
    expect(runFloat(shell, { fluid: 1000, thickness: 50 }).floating).toBe(false);
    expect(runFloat(shell, { fluid: 1000, thickness: 5 }).feedback).toMatch(/too high/);
  });
  it("round 3: an egg floats 90 % submerged in 1178 kg/m³ brine and sinks in fresh water", () => {
    expect(runFloat(egg, { egg: 1060, fluid: 1178 }).success).toBe(true);
    expect(runFloat(egg, { egg: 1060, fluid: 1000 }).floating).toBe(false);
    expect(runFloat(egg, { egg: 1060, fluid: 1300 }).feedback).toMatch(/too high/);
  });
  it("guards and plays through", async () => {
    checkGuards(FloatingChallengePage, FLOAT_META, { sliders: { "Block density": 800 }, prediction: 300, feedback: /too deep/ });
  });
  it("completes", async () => {
    await playThrough(FloatingChallengePage, FLOAT_META, [
      { sliders: { "Block density": 300 }, prediction: 300 },
      { sliders: { "Wall thickness": 10.9 }, prediction: 10.85 },
      { sliders: { "Salt water density": 1178 }, prediction: 1177.8 },
    ]);
  });
});

describe("Nuclear Puzzle (worked by hand)", () => {
  it("round 1: the curve peaks near A = 56–62 at about 8.8 MeV; light and heavy nuclei are far below", () => {
    expect(PEAK_VALUE).toBeGreaterThan(8.7);
    expect(PEAK_VALUE).toBeLessThan(8.9);
    expect(runNuclear(peak, { mass: 58 }).success).toBe(true);
    expect(runNuclear(peak, { mass: 20 }).feedback).toMatch(/Heavier nuclei/);
    expect(runNuclear(peak, { mass: 238 }).feedback).toMatch(/Lighter nuclei/);
    expect(bindingPerNucleonAt(4)).toBeLessThan(bindingPerNucleonAt(56));
  });
  it("round 2: helium-4 binds 28.30 MeV", () => {
    expect(HELIUM_BINDING).toBeCloseTo(28.296, 2);
    expect(runNuclear(helium, { energy: 28.3 }).success).toBe(true);
    expect(runNuclear(helium, { energy: 20 }).feedback).toMatch(/too little/);
  });
  it("round 3: a U-235 fission to Ba-141 + Kr-92 releases 173 MeV", () => {
    expect(FISSION_Q).toBeCloseTo(173.3, 0);
    expect(runNuclear(fission, { energy: 173 }).success).toBe(true);
    expect(runNuclear(fission, { energy: 250 }).feedback).toMatch(/too much/);
  });
  it("guards and plays through", async () => {
    checkGuards(NuclearPuzzlePage, NUCLEAR_META, { sliders: { "Mass number A": 20 }, prediction: 8.8, feedback: /Heavier nuclei/ });
  });
  it("completes", async () => {
    await playThrough(NuclearPuzzlePage, NUCLEAR_META, [
      { sliders: { "Mass number A": 58 }, prediction: 8.8 },
      { sliders: { "Binding energy": 28.3 }, prediction: 28.3 },
      { sliders: { "Energy released": 173 }, prediction: 173 },
    ]);
  });
});

describe("Half-Life Challenge (worked by hand)", () => {
  it("round 1: the Tc-99m peaks at 22.9 h", () => {
    const ok = runHalfLife(chain, { parent: 66, daughter: 6.01, time: 23 });
    expect(ok.truth).toBeCloseTo(22.86, 1);
    expect(ok.success).toBe(true);
    expect(runHalfLife(chain, { parent: 66, daughter: 6.01, time: 8 }).feedback).toMatch(/too early/);
    expect(runHalfLife(chain, { parent: 66, daughter: 6.01, time: 60 }).feedback).toMatch(/too late/);
  });
  it("round 2: 640 → 40 Bq in 14 h is a 3.5 h half-life", () => {
    expect(runHalfLife(readings, { start: 640, end: 40, halfLife: 3.5 }).success).toBe(true);
    expect(runHalfLife(readings, { start: 640, end: 40, halfLife: 5 }).feedback).toMatch(/Bq in 14 h, not 40 Bq/);
  });
  it("round 3: a half-and-half mixture falls to 30 % after about 5.9 days", () => {
    const o = runHalfLife(mixture, { long: 8.02, short: 0.25, days: 5.9 });
    expect(o.truth).toBeGreaterThan(5.5);
    expect(o.truth).toBeLessThan(6.5);
    expect(o.success).toBe(true);
    expect(runHalfLife(mixture, { long: 8.02, short: 0.25, days: 1 }).feedback).toMatch(/more than 30 %/);
    expect(runHalfLife(mixture, { long: 8.02, short: 0.25, days: 15 }).feedback).toMatch(/less than 30 %/);
  });
  it("guards and plays through", async () => {
    checkGuards(HalfLifeChallengePage, HALF_LIFE_META, { sliders: { "Time of maximum": 8 }, prediction: 23, feedback: /too early/ });
  });
  it("completes", async () => {
    await playThrough(HalfLifeChallengePage, HALF_LIFE_META, [
      { sliders: { "Time of maximum": 23 }, prediction: 22.9 },
      { sliders: { "Half-life": 3.5 }, prediction: 3.5 },
      { sliders: { Time: 5.9 }, prediction: 5.9 },
    ]);
  });
});

describe("Fusion Simulator (worked by hand)", () => {
  it("round 1: the D–T barrier is 444 keV", () => {
    expect(DT_BARRIER_KEV).toBeCloseTo(444, 0);
    expect(runFusion(barrier, { energy: 444 }).success).toBe(true);
    expect(runFusion(barrier, { energy: 100 }).feedback).toMatch(/not enough/);
    expect(runFusion(barrier, { energy: 900 }).feedback).toMatch(/more than needed/);
  });
  it("round 2: 10 keV is 116 million kelvin", () => {
    expect(runFusion(temperature, { temperature: 116 }).success).toBe(true);
    expect(runFusion(temperature, { temperature: 15 }).feedback).toMatch(/cooler/);
    expect(runFusion(temperature, { temperature: 300 }).feedback).toMatch(/hotter/);
  });
  it("round 3: 2.97 g of D–T gives 1 TJ because each reaction releases 17.6 MeV", () => {
    expect(DT_Q_MEV).toBeCloseTo(17.59, 1);
    const o = runFusion(fuel, { energy: 1, grams: 2.97 });
    expect(o.truth).toBeCloseTo(2.97, 1);
    expect(o.success).toBe(true);
    expect(runFusion(fuel, { energy: 1, grams: 6 }).feedback).toMatch(/more than 1 TJ/);
  });
  it("guards and plays through", async () => {
    checkGuards(FusionSimulatorPage, FUSION_META, { sliders: { "Energy to reach contact": 100 }, prediction: 440, feedback: /not enough/ });
  });
  it("completes", async () => {
    await playThrough(FusionSimulatorPage, FUSION_META, [
      { sliders: { "Energy to reach contact": 444 }, prediction: 444 },
      { sliders: { "Plasma temperature": 116 }, prediction: 116 },
      { sliders: { "Fuel mass": 2.97 }, prediction: 2.97 },
    ]);
  });
});

describe("Energy Detective (worked by hand)", () => {
  it("round 1: the Sun loses 4.26 million tonnes per second", () => {
    expect(SUN_TARGET_TONNES).toBeCloseTo(4.259, 2);
    expect(runEnergy(sun, { answer: 4.26 }).success).toBe(true);
    expect(runEnergy(sun, { answer: 1 }).feedback).toMatch(/too little/);
    expect(runEnergy(sun, { answer: 9 }).feedback).toMatch(/too much/);
  });
  it("round 2: fusing 1 kg of hydrogen converts 0.71 % of it and gives 640 TJ", () => {
    expect(HYDROGEN_TERAJOULES).toBeCloseTo(640, -1);
    const o = runEnergy(hydrogen, { answer: 640 });
    expect(o.convertedFraction).toBeCloseTo(0.00712, 4);
    expect(o.success).toBe(true);
    expect(runEnergy(hydrogen, { answer: 100 }).success).toBe(false);
  });
  it("round 3: D + T releases 17.59 MeV", () => {
    expect(runEnergy(reaction, { answer: 17.59 }).success).toBe(true);
    expect(runEnergy(reaction, { answer: 28 }).feedback).toMatch(/too much/);
  });
  it("guards and plays through", async () => {
    checkGuards(EnergyDetectivePage, ENERGY_META, { sliders: { "Mass lost per second": 1 }, prediction: 4, feedback: /too little/ });
  });
  it("completes", async () => {
    await playThrough(EnergyDetectivePage, ENERGY_META, [
      { sliders: { "Mass lost per second": 4.26 }, prediction: 4.26 },
      { sliders: { "Energy released": 640 }, prediction: 640 },
      { sliders: { "Energy released": 17.59 }, prediction: 17.59 },
    ]);
  });
});

describe("Isotope Explorer (worked by hand)", () => {
  it("round 1: cobalt-60 has 27 protons and 33 neutrons", () => {
    const ok = runIsotope(identify, { protons: 27, neutrons: 33 });
    expect(ok.symbol).toBe("Co-60");
    expect(ok.success).toBe(true);
    expect(runIsotope(identify, { protons: 26, neutrons: 34 }).feedback).toMatch(/not cobalt/);
    expect(runIsotope(identify, { protons: 27, neutrons: 30 }).feedback).toMatch(/needs 33 neutrons/);
  });
  it("round 2: beta decay of iodine-131 gives xenon-131", () => {
    const ok = runIsotope(daughter, { parentZ: 53, parentA: 131, protons: 54, mass: 131 });
    expect(ok.symbol).toBe("Xe-131");
    expect(ok.success).toBe(true);
    expect(runIsotope(daughter, { parentZ: 53, parentA: 131, protons: 54, mass: 127 }).feedback).toMatch(/mass number/);
    expect(runIsotope(daughter, { parentZ: 53, parentA: 131, protons: 52, mass: 131 }).feedback).toMatch(/raises Z by 1/);
  });
  it("round 3: 8 alphas and 6 betas turn U-238 into Pb-206", () => {
    const ok = runIsotope(series, { parentZ: 92, parentA: 238, alphas: 8, betas: 6 });
    expect(ok.symbol).toBe("Pb-206");
    expect(ok.success).toBe(true);
    expect(runIsotope(series, { parentZ: 92, parentA: 238, alphas: 7, betas: 6 }).feedback).toMatch(/only alphas change A/);
    expect(runIsotope(series, { parentZ: 92, parentA: 238, alphas: 8, betas: 2 }).feedback).toMatch(/Z = 78/);
    expect(runIsotope(series, { parentZ: 92, parentA: 238, alphas: 0, betas: 0 }).decays).toEqual({ alphas: 8, betas: 6 });
  });
  it("draws a valley of stability that bends toward more neutrons", () => {
    const light = VALLEY[10]!;
    const heavy = VALLEY[100]!;
    expect(heavy.x / heavy.y).toBeGreaterThan(light.x / light.y);
  });
  it("guards and plays through", async () => {
    checkGuards(IsotopeExplorerPage, ISOTOPE_META, { sliders: { "Protons Z": 26, "Neutrons N": 34 }, prediction: 33, feedback: /not cobalt/ });
  });
  it("completes", async () => {
    await playThrough(IsotopeExplorerPage, ISOTOPE_META, [
      { sliders: { "Protons Z": 27, "Neutrons N": 33 }, prediction: 33 },
      { sliders: { "Daughter protons Z": 54, "Daughter mass number A": 131 }, prediction: 54 },
      { sliders: { "Alpha decays": 8, "Beta-minus decays": 6 }, prediction: 8 },
    ]);
  });
});

describe("Bicycle Physics (worked by hand)", () => {
  it("round 1: 22 or 21 teeth gives about 25 km/h at 90 rpm; the torque is 87 N·m", () => {
    const o = runBike(gear, { front: 48, rear: 22 });
    expect(o.speedKmh).toBeCloseTo(24.74, 1);
    expect(o.wheelTorque).toBeCloseTo(87.3, 0);
    expect(o.success).toBe(true);
    expect(runBike(gear, { front: 48, rear: 21 }).success).toBe(true);
    expect(runBike(gear, { front: 48, rear: 15 }).feedback).toMatch(/too fast/);
    expect(runBike(gear, { front: 48, rear: 30 }).feedback).toMatch(/too slow/);
    expect(runBike(gear, { front: 48, rear: 11 }).driveForce).toBeGreaterThan(runBike(gear, { front: 48, rear: 30 }).driveForce);
  });
  it("round 2: about 12.4 km/h on a 6 % hill takes 200 W", () => {
    expect(runBike(climb, { grade: 6, speed: 12.4 }).success).toBe(true);
    expect(runBike(climb, { grade: 6, speed: 25 }).feedback).toMatch(/more than the 200 W/);
    expect(runBike(climb, { grade: 6, speed: 6 }).feedback).toMatch(/less than the 200 W/);
  });
  it("round 3: C_dA 0.25 m² holds 40 km/h on 250 W; a sprawled position cannot", () => {
    const ok = runBike(aero, { speed: 40, dragArea: 0.25 });
    expect(ok.powerWatts).toBeCloseTo(252, -1);
    expect(ok.success).toBe(true);
    expect(runBike(aero, { speed: 40, dragArea: 0.4 }).feedback).toMatch(/tuck in tighter/);
  });
  it("guards and plays through", async () => {
    checkGuards(BicyclePhysicsPage, BIKE_META, { sliders: { "Rear sprocket teeth": 15 }, prediction: 22, feedback: /too fast/ });
  });
  it("completes", async () => {
    await playThrough(BicyclePhysicsPage, BIKE_META, [
      { sliders: { "Rear sprocket teeth": 22 }, prediction: 21.8 },
      { sliders: { Speed: 12.4 }, prediction: 12.4 },
      { sliders: { "Drag area C_dA": 0.25 }, prediction: 0.247 },
    ]);
  });
});

describe("catalog", () => {
  it("lists all ten new games and drops them from coming soon", () => {
    for (const id of ["dam-engineer", "flight-simulator", "pipe-puzzle", "floating-challenge", "nuclear-puzzle", "half-life-challenge", "fusion-simulator", "energy-detective", "isotope-explorer", "bicycle-physics"]) {
      expect(findCatalogEntry(id)?.kind).toBe("game");
    }
    expect(PHYSICS_WORLDS.find((w) => w.id === "fluids")!.comingSoon).toEqual([]);
    expect(PHYSICS_WORLDS.find((w) => w.id === "nuclear")!.comingSoon).toEqual([]);
    expect(PHYSICS_WORLDS.find((w) => w.id === "everyday")!.comingSoon).toEqual([]);
  });
});
