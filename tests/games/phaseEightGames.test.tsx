import { describe, expect, it } from "vitest";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { PHYSICS_TOPICS } from "../../src/data/topics";
import { CART_META, CART_ROUNDS, runCarts } from "../../src/features/games/cart-collider/cartCollider";
import { CartColliderPage } from "../../src/features/games/cart-collider/CartColliderPage";
import { DIFFRACTION_META, DIFFRACTION_ROUNDS, runDiffraction } from "../../src/features/games/diffraction-detective/diffractionDetective";
import { DiffractionDetectivePage } from "../../src/features/games/diffraction-detective/DiffractionDetectivePage";
import { DOPPLER_META, DOPPLER_ROUNDS, runDoppler } from "../../src/features/games/doppler-chase/dopplerChase";
import { DopplerChasePage } from "../../src/features/games/doppler-chase/DopplerChasePage";
import { LIFT_META, LIFT_ROUNDS, peakMotorPower, runLift } from "../../src/features/games/elevator-engineer/elevatorEngineer";
import { ElevatorEngineerPage } from "../../src/features/games/elevator-engineer/ElevatorEngineerPage";
import { ENTROPY_META, ENTROPY_ROUNDS, fewestParticlesBelow, runEntropy } from "../../src/features/games/entropy-shuffle/entropyShuffle";
import { EntropyShufflePage } from "../../src/features/games/entropy-shuffle/EntropyShufflePage";
import { HONEY_META, HONEY_ROUNDS, runHoney } from "../../src/features/games/honey-drop-race/honeyDropRace";
import { HoneyDropRacePage } from "../../src/features/games/honey-drop-race/HoneyDropRacePage";
import { PUCK_META, PUCK_ROUNDS, runPuck } from "../../src/features/games/ice-puck-pilot/icePuckPilot";
import { IcePuckPilotPage } from "../../src/features/games/ice-puck-pilot/IcePuckPilotPage";
import { VOYAGER_META, VOYAGER_ROUNDS, runVoyager, speedForCrewYears } from "../../src/features/games/lightspeed-voyager/lightspeedVoyager";
import { LightspeedVoyagerPage } from "../../src/features/games/lightspeed-voyager/LightspeedVoyagerPage";
import { TUNNEL_META, TUNNEL_ROUNDS, runTunnel, stmGapIncrease } from "../../src/features/games/quantum-tunnel/quantumTunnel";
import { QuantumTunnelPage } from "../../src/features/games/quantum-tunnel/QuantumTunnelPage";
import { GAP_META, GAP_ROUNDS, bimetalTipMm, runGap } from "../../src/features/games/railway-gap-engineer/railwayGapEngineer";
import { RailwayGapEngineerPage } from "../../src/features/games/railway-gap-engineer/RailwayGapEngineerPage";
import { REACTOR_META, REACTOR_ROUNDS, runReactor } from "../../src/features/games/reactor-operator/reactorOperator";
import { ReactorOperatorPage } from "../../src/features/games/reactor-operator/ReactorOperatorPage";
import { RESONANCE_META, RESONANCE_ROUNDS, dampingForPeak, runResonance } from "../../src/features/games/resonance-swing/resonanceSwing";
import { ResonanceSwingPage } from "../../src/features/games/resonance-swing/ResonanceSwingPage";
import { ROLL_META, ROLL_ROUNDS, hoopHeadStart, runRoll } from "../../src/features/games/rolling-race/rollingRace";
import { RollingRacePage } from "../../src/features/games/rolling-race/RollingRacePage";
import { SLED_META, SLED_ROUNDS, runSled } from "../../src/features/games/sled-slope/sledSlope";
import { SledSlopePage } from "../../src/features/games/sled-slope/SledSlopePage";
import { FILM_META, FILM_ROUNDS, runFilm } from "../../src/features/games/soap-bubble-colours/soapBubbleColours";
import { SoapBubbleColoursPage } from "../../src/features/games/soap-bubble-colours/SoapBubbleColoursPage";
import { STAR_META, STAR_ROUNDS, runStar } from "../../src/features/games/star-classifier/starClassifier";
import { StarClassifierPage } from "../../src/features/games/star-classifier/StarClassifierPage";
import { checkGuards, playThrough } from "../helpers/playthrough";

const round = <T,>(rounds: readonly T[], i: number) => rounds[i] as T;

describe("every PRD §4.2 topic is taught by at least one game (task 98)", () => {
  it.each(PHYSICS_TOPICS.map((topic) => [topic.id, topic] as const))("%s", (id) => {
    const games = PHYSICS_WORLDS.flatMap((world) => world.entries).filter((entry) => entry.kind === "game" && entry.topics.includes(id));
    expect(games.length, `no game teaches ${id}`).toBeGreaterThan(0);
  });

  it("registers the sixteen new games in their worlds", () => {
    const expected: Record<string, string> = {
      "ice-puck-pilot": "mechanics", "sled-slope": "mechanics", "cart-collider": "mechanics", "elevator-engineer": "mechanics", "rolling-race": "mechanics",
      "railway-gap-engineer": "thermodynamics", "entropy-shuffle": "thermodynamics", "soap-bubble-colours": "optics", "diffraction-detective": "optics",
      "resonance-swing": "waves", "doppler-chase": "waves", "star-classifier": "astronomy", "lightspeed-voyager": "astronomy",
      "quantum-tunnel": "modern-physics", "honey-drop-race": "fluids", "reactor-operator": "nuclear",
    };
    for (const [id, world] of Object.entries(expected)) {
      expect(findCatalogEntry(id)?.path).toBe(`/worlds/${world}/${id}`);
    }
  });
});

describe("Ice Puck Pilot", () => {
  it("needs 3 N for 3 m/s, brakes 4 m before the line and sends the sled off at 3 m/s", () => {
    expect(runPuck(round(PUCK_ROUNDS, 0), { mass: 0.5, force: 3 }).success).toBe(true);
    expect(runPuck(round(PUCK_ROUNDS, 0), { mass: 0.5, force: 4 }).feedback).toMatch(/too fast/);
    expect(runPuck(round(PUCK_ROUNDS, 1), { speed: 4, brakeStart: 6 }).headline).toBeCloseTo(10, 9);
    expect(runPuck(round(PUCK_ROUNDS, 1), { speed: 4, brakeStart: 7 }).feedback).toMatch(/past/);
    const pushoff = runPuck(round(PUCK_ROUNDS, 2), { force: 120, sledSpeed: 3 });
    expect(pushoff.success).toBe(true);
    expect(pushoff.predictionActual).toBeCloseTo(1, 12);
  });
  it("guards and plays through", async () => {
    checkGuards(IcePuckPilotPage, PUCK_META, { sliders: { Thrust: 1 }, prediction: 3, feedback: /too slow/ });
  });
  it("plays through", async () => {
    await playThrough(IcePuckPilotPage, PUCK_META, [{ sliders: { Thrust: 3 }, prediction: 3 }, { sliders: { "Start braking at": 6 }, prediction: 6 }, { sliders: { "Sled speed": 3 }, prediction: 1 }]);
  });
});

describe("Sled Slope", () => {
  it("slips just past 7.97°, stops 30 m along the flat and slides steadily at 16.7°", () => {
    expect(runSled(round(SLED_ROUNDS, 0), { angle: 8 }).success).toBe(true);
    expect(runSled(round(SLED_ROUNDS, 0), { angle: 7 }).feedback).toMatch(/still holds/);
    expect(runSled(round(SLED_ROUNDS, 0), { angle: 12 }).feedback).toMatch(/more than/);
    expect(runSled(round(SLED_ROUNDS, 1), { slope: 15, length: 7.15 }).headline).toBeCloseTo(30.1, 0);
    expect(runSled(round(SLED_ROUNDS, 1), { slope: 15, length: 7.15 }).predictionActual).toBeCloseTo(7.126, 2);
    expect(runSled(round(SLED_ROUNDS, 2), { angle: 16.7 }).success).toBe(true);
    expect(runSled(round(SLED_ROUNDS, 2), { angle: 25 }).feedback).toMatch(/speeds up/);
  });
  it("plays through", async () => {
    await playThrough(SledSlopePage, SLED_META, [{ sliders: { "Slope angle": 8 }, prediction: 8 }, { sliders: { "Slope length": 7.15 }, prediction: 7.1 }, { sliders: { "Ramp angle": 16.7 }, prediction: 16.7 }]);
  });
});

describe("Cart Collider", () => {
  it("needs a 2 kg target for sticky 1.5 m/s, 2 kg for an elastic bounce-back and e = 0.6", () => {
    const sticky = runCarts(round(CART_ROUNDS, 0), { speedA: 3, massB: 2 });
    expect(sticky.velocityB).toBeCloseTo(1.5, 12);
    expect(sticky.energyLostFraction).toBeCloseTo(0.5, 12);
    expect(runCarts(round(CART_ROUNDS, 1), { speedA: 3, massB: 2 }).velocityA).toBeCloseTo(-1, 12);
    expect(runCarts(round(CART_ROUNDS, 1), { speedA: 3, massB: 2 }).energyLostFraction).toBeCloseTo(0, 12);
    expect(runCarts(round(CART_ROUNDS, 1), { speedA: 3, massB: 0.5 }).feedback).toMatch(/heavier/);
    expect(runCarts(round(CART_ROUNDS, 2), { speedA: 3, restitution: 0.6 }).success).toBe(true);
  });
  it("plays through", async () => {
    await playThrough(CartColliderPage, CART_META, [{ sliders: { "Mass of the resting cart": 2 }, prediction: 2 }, { sliders: { "Mass of the resting cart": 2 }, prediction: 2 }, { sliders: { "Coefficient of restitution e": 0.6 }, prediction: 0.6 }]);
  });
});

describe("Elevator Engineer", () => {
  it("needs 11.8 kW, a 1300 kg counterweight and 117.7 kJ per trip", () => {
    expect(runLift(round(LIFT_ROUNDS, 0), { mass: 800, powerKw: 11.8 }).success).toBe(true);
    expect(runLift(round(LIFT_ROUNDS, 0), { mass: 800, powerKw: 5 }).feedback).toMatch(/too slow/);
    expect(peakMotorPower(1300)).toBeLessThan(peakMotorPower(1000));
    expect(peakMotorPower(1300)).toBeLessThan(peakMotorPower(1600));
    expect(runLift(round(LIFT_ROUNDS, 1), { speed: 1.5, counterweight: 1300 }).success).toBe(true);
    expect(runLift(round(LIFT_ROUNDS, 2), { efficiency: 0.75, energyKj: 117.5 }).predictionActual).toBeCloseTo(117.68, 1);
  });
  it("plays through", async () => {
    await playThrough(ElevatorEngineerPage, LIFT_META, [{ sliders: { "Motor power": 11.8 }, prediction: 11.8 }, { sliders: { Counterweight: 1300 }, prediction: 1300 }, { sliders: { "Electrical energy": 117.5 }, prediction: 117.7 }]);
  });
});

describe("Rolling Race", () => {
  it("gives the hoop a 0.75 m head start, tilts the ramp 14.7° and spins the skater at 8.75 rev/s", () => {
    expect(hoopHeadStart()).toBeCloseTo(0.75, 12);
    expect(runRoll(round(ROLL_ROUNDS, 0), { slope: 10, headStart: 0.75 }).success).toBe(true);
    expect(runRoll(round(ROLL_ROUNDS, 0), { slope: 10, headStart: 0.2 }).feedback).toMatch(/disc wins/);
    expect(runRoll(round(ROLL_ROUNDS, 1), { angle: 14.7 }).headline).toBeCloseTo(1.5, 2);
    expect(runRoll(round(ROLL_ROUNDS, 2), { inertia: 1.2, spin: 8.75 }).success).toBe(true);
  });
  it("plays through", async () => {
    await playThrough(RollingRacePage, ROLL_META, [{ sliders: { "Hoop's head start": 0.75 }, prediction: 0.75 }, { sliders: { "Ramp angle": 14.7 }, prediction: 14.7 }, { sliders: { "New spin rate": 8.75 }, prediction: 8.75 }]);
  });
});

describe("Railway Gap Engineer", () => {
  it("leaves 9 mm, allows 100.8 mm and uses an 86.5 mm strip", () => {
    expect(runGap(round(GAP_ROUNDS, 0), { length: 25, gapMm: 9 }).success).toBe(true);
    expect(runGap(round(GAP_ROUNDS, 0), { length: 25, gapMm: 4 }).feedback).toMatch(/buckles/);
    expect(runGap(round(GAP_ROUNDS, 1), { length: 120, travelMm: 101 }).predictionActual).toBeCloseTo(100.8, 6);
    expect(bimetalTipMm(86.5)).toBeCloseTo(2, 1);
    expect(runGap(round(GAP_ROUNDS, 2), { thickness: 1, lengthMm: 86.5 }).success).toBe(true);
  });
  it("plays through", async () => {
    await playThrough(RailwayGapEngineerPage, GAP_META, [{ sliders: { "Gap at laying": 9 }, prediction: 9 }, { sliders: { "Joint movement": 101 }, prediction: 100 }, { sliders: { "Strip length": 86.5 }, prediction: 86 }]);
  });
});

describe("Entropy Shuffle", () => {
  it("needs 7 particles, finds the 5–5 split and a rise of ln 184 756 = 12.13 k", () => {
    expect(fewestParticlesBelow(0.01)).toBe(7);
    expect(runEntropy(round(ENTROPY_ROUNDS, 0), { particles: 7 }).success).toBe(true);
    expect(runEntropy(round(ENTROPY_ROUNDS, 0), { particles: 9 }).feedback).toMatch(/fewer would do/);
    expect(runEntropy(round(ENTROPY_ROUNDS, 1), { particles: 10, left: 5 }).headline).toBe(252);
    expect(runEntropy(round(ENTROPY_ROUNDS, 1), { particles: 10, left: 3 }).success).toBe(false);
    expect(runEntropy(round(ENTROPY_ROUNDS, 2), { particles: 20, deltaS: 12.15 }).predictionActual).toBeCloseTo(12.127, 3);
  });
  it("plays through", async () => {
    await playThrough(EntropyShufflePage, ENTROPY_META, [{ sliders: { "Number of particles": 7 }, prediction: 7 }, { sliders: { "Particles on the left": 5 }, prediction: 5 }, { sliders: { "Entropy rise ΔS": 12.15 }, prediction: 12 }]);
  });
});

describe("Soap Bubble Colours", () => {
  it("glows green at 103 nm, cancels at 100 nm and colours a 300 nm film at 532 nm", () => {
    expect(runFilm(round(FILM_ROUNDS, 0), { index: 1.33, thickness: 103.5 }).success).toBe(true);
    expect(runFilm(round(FILM_ROUNDS, 0), { index: 1.33, thickness: 103.5 }).headline).toBeGreaterThan(0.99);
    expect(runFilm(round(FILM_ROUNDS, 1), { index: 1.38, thickness: 99.5 }).headline).toBeLessThan(0.01);
    expect(runFilm(round(FILM_ROUNDS, 2), { thickness: 300, wavelength: 532 }).predictionActual).toBeCloseTo(532, 0);
    expect(runFilm(round(FILM_ROUNDS, 2), { thickness: 300, wavelength: 650 }).success).toBe(false);
  });
  it("plays through", async () => {
    await playThrough(SoapBubbleColoursPage, FILM_META, [{ sliders: { "Film thickness": 103.5 }, prediction: 103 }, { sliders: { "Coating thickness": 99.5 }, prediction: 100 }, { sliders: { Wavelength: 532 }, prediction: 532 }]);
  });
});

describe("Diffraction Detective", () => {
  it("identifies a 632.6 nm laser, 1.60 µm tracks and a 106 µm hair", () => {
    expect(runDiffraction(round(DIFFRACTION_ROUNDS, 0), { angle: 22.31, wavelength: 632.5 }).predictionActual).toBeCloseTo(632.6, 0);
    expect(runDiffraction(round(DIFFRACTION_ROUNDS, 0), { angle: 22.31, wavelength: 532 }).feedback).toMatch(/longer/);
    expect(runDiffraction(round(DIFFRACTION_ROUNDS, 1), { wavelength: 650, spacing: 1.6 }).success).toBe(true);
    expect(runDiffraction(round(DIFFRACTION_ROUNDS, 2), { distance: 2, width: 106.5 }).headline).toBeCloseTo(2, 2);
  });
  it("plays through", async () => {
    await playThrough(DiffractionDetectivePage, DIFFRACTION_META, [{ sliders: { Wavelength: 632.5 }, prediction: 633 }, { sliders: { "Track spacing": 1.6 }, prediction: 1.6 }, { sliders: { "Hair width": 106.5 }, prediction: 106 }]);
  });
});

describe("Resonance Swing", () => {
  it("pushes at 0.315 Hz, sings 880 Hz and needs ζ ≈ 0.05 for 10×", () => {
    expect(runResonance(round(RESONANCE_ROUNDS, 0), { length: 2.5, frequency: 0.315 }).success).toBe(true);
    expect(runResonance(round(RESONANCE_ROUNDS, 0), { length: 2.5, frequency: 0.5 }).feedback).toMatch(/out of step/);
    expect(runResonance(round(RESONANCE_ROUNDS, 1), { natural: 880, frequency: 880 }).success).toBe(true);
    expect(runResonance(round(RESONANCE_ROUNDS, 1), { natural: 880, frequency: 879 }).success).toBe(false);
    expect(dampingForPeak(10)).toBeCloseTo(0.05, 3);
    expect(runResonance(round(RESONANCE_ROUNDS, 2), { natural: 1.9, damping: 0.052 }).success).toBe(true);
    expect(runResonance(round(RESONANCE_ROUNDS, 2), { natural: 1.9, damping: 0.01 }).feedback).toMatch(/add damping/);
  });
  it("plays through", async () => {
    await playThrough(ResonanceSwingPage, RESONANCE_META, [{ sliders: { "Push frequency": 0.315 }, prediction: 0.315 }, { sliders: { "Your note": 880 }, prediction: 880 }, { sliders: { "Damping ratio ζ": 0.052 }, prediction: 0.05 }]);
  });
});

describe("Doppler Chase", () => {
  it("finds 27.1 m/s, 24.5 m/s and 13.7 m/s", () => {
    const approach = runDoppler(round(DOPPLER_ROUNDS, 0), { siren: 700, speed: 27.1 });
    expect(approach.heardHz).toBeCloseTo(760, 0);
    expect(approach.success).toBe(true);
    expect(runDoppler(round(DOPPLER_ROUNDS, 1), { speed: 24.5 }).predictionActual).toBeCloseTo(24.5, 1);
    expect(runDoppler(round(DOPPLER_ROUNDS, 1), { speed: 24.5 }).sourceHz).toBeCloseTo(696.4, 1);
    expect(runDoppler(round(DOPPLER_ROUNDS, 2), { siren: 500, speed: 13.75 }).success).toBe(true);
  });
  it("plays through", async () => {
    await playThrough(DopplerChasePage, DOPPLER_META, [{ sliders: { "Ambulance speed": 27.1 }, prediction: 27 }, { sliders: { "Car speed": 24.5 }, prediction: 24.5 }, { sliders: { "Cyclist speed": 13.75 }, prediction: 13.7 }]);
  });
});

describe("Star Classifier", () => {
  it("reads 9992 K, 813 R☉ and 0.0248 L☉", () => {
    expect(runStar(round(STAR_ROUNDS, 0), { peak: 290, temperature: 9990 }).success).toBe(true);
    expect(runStar(round(STAR_ROUNDS, 0), { peak: 290, temperature: 5000 }).feedback).toMatch(/hotter/);
    expect(runStar(round(STAR_ROUNDS, 1), { temperature: 3600, radius: 813 }).predictionActual).toBeCloseTo(812.9, 0);
    expect(runStar(round(STAR_ROUNDS, 2), { radius: 0.0084, luminosity: 0.0248 }).success).toBe(true);
  });
  it("plays through", async () => {
    await playThrough(StarClassifierPage, STAR_META, [{ sliders: { "Surface temperature": 9990 }, prediction: 10000 }, { sliders: { Radius: 813 }, prediction: 800 }, { sliders: { Luminosity: 0.0248 }, prediction: 0.025 }]);
  });
});

describe("Lightspeed Voyager", () => {
  it("flies at 0.979c, fits the hangar at 0.866–0.893c and adds 0.6c + 0.6c to 0.882c", () => {
    expect(speedForCrewYears(12, 5)).toBeCloseTo(0.97898, 4);
    expect(runVoyager(round(VOYAGER_ROUNDS, 0), { distance: 12, beta: 0.979 }).headline).toBeCloseTo(5, 1);
    expect(runVoyager(round(VOYAGER_ROUNDS, 1), { length: 100, beta: 0.88 }).success).toBe(true);
    expect(runVoyager(round(VOYAGER_ROUNDS, 1), { length: 100, beta: 0.8 }).feedback).toMatch(/faster/);
    expect(runVoyager(round(VOYAGER_ROUNDS, 2), { ship: 0.6, beta: 0.882 }).predictionActual).toBeCloseTo(0.88235, 4);
  });
  it("is labeled as a relativistic model", () => {
    expect(VOYAGER_META.modelTag).toMatch(/RELATIVISTIC/);
  });
  it("plays through", async () => {
    await playThrough(LightspeedVoyagerPage, VOYAGER_META, [{ sliders: { "Ship speed": 0.979 }, prediction: 0.98 }, { sliders: { "Ship speed": 0.88 }, prediction: 0.87 }, { sliders: { "Probe speed relative to Earth": 0.882 }, prediction: 0.882 }]);
  });
});

describe("Quantum Tunnel", () => {
  it("sizes a 0.739 nm dot, a 0.27 nm barrier and a 0.106 nm STM change", () => {
    expect(runTunnel(round(TUNNEL_ROUNDS, 0), { width: 0.739 }).success).toBe(true);
    expect(runTunnel(round(TUNNEL_ROUNDS, 0), { width: 0.5 }).feedback).toMatch(/too blue/);
    expect(runTunnel(round(TUNNEL_ROUNDS, 1), { height: 5, width: 0.2705 }).headline).toBeCloseTo(0.01, 3);
    expect(stmGapIncrease()).toBeCloseTo(0.106, 2);
    const stm = runTunnel(round(TUNNEL_ROUNDS, 2), { gap: 0.5, increase: Math.round(stmGapIncrease() * 1000) / 1000 });
    expect(stm.headline).toBeCloseTo(10, 0);
  });
  it("plays through", async () => {
    await playThrough(QuantumTunnelPage, TUNNEL_META, [{ sliders: { "Box width": 0.739 }, prediction: 0.74 }, { sliders: { "Barrier width": 0.2705 }, prediction: 0.27 }, { sliders: { "Gap increase": Math.round(stmGapIncrease() * 1000) / 1000 }, prediction: 0.1 }]);
  });
});

describe("Honey Drop Race", () => {
  it("falls 10 cm in 9.8 s, measures 7.9 Pa·s and keeps Re < 1 below 3.8 mm", () => {
    expect(runHoney(round(HONEY_ROUNDS, 0), { radius: 1, time: 9.8 }).predictionActual).toBeCloseTo(9.82, 1);
    expect(runHoney(round(HONEY_ROUNDS, 1), { radius: 1.5, viscosity: 7.9 }).predictionActual).toBeCloseTo(7.88, 1);
    expect(runHoney(round(HONEY_ROUNDS, 1), { radius: 1.5, viscosity: 7.9 }).success).toBe(true);
    expect(runHoney(round(HONEY_ROUNDS, 2), { viscosity: 1.41, radius: 3.75 }).success).toBe(true);
    expect(runHoney(round(HONEY_ROUNDS, 2), { viscosity: 1.41, radius: 5 }).feedback).toMatch(/smaller ball/);
  });
  it("plays through", async () => {
    await playThrough(HoneyDropRacePage, HONEY_META, [{ sliders: { "Time between the marks": 9.8 }, prediction: 10 }, { sliders: { Viscosity: 7.9 }, prediction: 8 }, { sliders: { "Ball radius": 3.75 }, prediction: 3.8 }]);
  });
});

describe("Reactor Operator", () => {
  it("is critical at 50 %, doubles in about a minute at k = 1.0008 and keeps a 20 s period at k = 1.0025", () => {
    expect(runReactor(round(REACTOR_ROUNDS, 0), { withdrawn: 1.05, insertion: 50 }).success).toBe(true);
    expect(runReactor(round(REACTOR_ROUNDS, 0), { withdrawn: 1.05, insertion: 30 }).feedback).toMatch(/grows/);
    expect(runReactor(round(REACTOR_ROUNDS, 1), { k: 1.0008 }).success).toBe(true);
    expect(runReactor(round(REACTOR_ROUNDS, 2), { k: 1.0025 }).success).toBe(true);
    expect(runReactor(round(REACTOR_ROUNDS, 2), { k: 1.004 }).feedback).toMatch(/too short/);
    const prompt = runReactor(round(REACTOR_ROUNDS, 2), { k: 1.008 });
    expect(prompt.periodSeconds).toBeNull();
    expect(prompt.feedback).toMatch(/prompt criticality/);
  });
  it("plays through", async () => {
    await playThrough(ReactorOperatorPage, REACTOR_META, [{ sliders: { "Rod insertion": 50 }, prediction: 50 }, { sliders: { "Multiplication factor k": 1.0008 }, prediction: 1.0008 }, { sliders: { "Multiplication factor k": 1.0025 }, prediction: 1.0025 }]);
  });
});
