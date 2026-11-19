import { calculateStarEnergy, planetPosition, stepProbe, type AssistPlanet, type ProbeState } from "../../physics/astronomy";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, stars } from "./scenery";

/** Scaled units: the Sun's μ = 1000, Earth's orbit radius 10, so Earth goes round in 2π time units. */
export const SUN_MU = 1000;
export const EARTH_ORBIT = 10;
const SUN_RADIUS = 1.5;
const PLANET_RADIUS = 0.8;
const COMET_REACH = 3.5;
const MAP = 90;
const SUBSTEPS = 3;
const STEP = 1 / 60;

interface Mission { readonly title: string; readonly goal: string; readonly planets: readonly AssistPlanet[]; readonly comet: { readonly x: number; readonly y: number }; readonly maxSpeed: number; readonly timeLimit: number }
export const MISSIONS: readonly Mission[] = [
  { title: "Comet chaser", goal: "Launch from Earth and coast out to the comet. Gravity bends your path into a curve.", planets: [], comet: { x: -18, y: 6 }, maxSpeed: 14, timeLimit: 40 },
  { title: "Jupiter boost", goal: "The comet is too far for your rocket alone. Fly close behind Jupiter and let it fling you outward!", planets: [{ mu: 30, orbitRadius: 25, phase: 1.7 }], comet: { x: -40, y: -30 }, maxSpeed: 12.6, timeLimit: 80 },
  { title: "Long way out", goal: "An even farther comet. Time your launch direction so you meet Jupiter at the right moment.", planets: [{ mu: 30, orbitRadius: 25, phase: 2.6 }], comet: { x: 20, y: -62 }, maxSpeed: 12.6, timeLimit: 110 },
];

export interface SlingState { readonly probe: ProbeState | null; readonly trail: readonly { x: number; y: number }[]; readonly launches: number; readonly outcome: "aiming" | "flying" | "reached" | "sun" | "planet" | "lost" | "timeout"; readonly closest: number }

/** The probe leaves Earth (at (10, 0), moving in +y) with the chosen speed and direction. */
export function launch(speed: number, directionDegrees: number): ProbeState {
  const angle = (directionDegrees * Math.PI) / 180;
  return { x: EARTH_ORBIT, y: 0, vx: speed * Math.cos(angle), vy: speed * Math.sin(angle), t: 0 };
}

export function advanceMission(level: number, probe: ProbeState, dt: number): { probe: ProbeState; outcome: SlingState["outcome"]; cometDistance: number } {
  const mission = MISSIONS[level] as Mission;
  let next = probe;
  for (let i = 0; i < SUBSTEPS; i += 1) {
    next = stepProbe(next, dt / SUBSTEPS, SUN_MU, mission.planets);
    const cometDistance = Math.hypot(next.x - mission.comet.x, next.y - mission.comet.y);
    if (cometDistance <= COMET_REACH) return { probe: next, outcome: "reached", cometDistance };
    if (Math.hypot(next.x, next.y) < SUN_RADIUS) return { probe: next, outcome: "sun", cometDistance };
    if (mission.planets.some((planet) => { const p = planetPosition(planet, SUN_MU, next.t); return Math.hypot(next.x - p.x, next.y - p.y) < PLANET_RADIUS; })) return { probe: next, outcome: "planet", cometDistance };
    if (Math.hypot(next.x, next.y) > MAP) return { probe: next, outcome: "lost", cometDistance };
    if (next.t > mission.timeLimit) return { probe: next, outcome: "timeout", cometDistance };
  }
  return { probe: next, outcome: "flying", cometDistance: Math.hypot(next.x - mission.comet.x, next.y - mission.comet.y) };
}

/** Flies a whole mission without animation (for checking and for tests). */
export function flyMission(level: number, speed: number, direction: number): { outcome: SlingState["outcome"]; closest: number; energyGain: number } {
  let probe = launch(speed, direction);
  const start = calculateStarEnergy(probe, SUN_MU);
  let closest = Infinity;
  for (let i = 0; i < 1_000_000; i += 1) {
    const result = advanceMission(level, probe, STEP);
    probe = result.probe;
    closest = Math.min(closest, result.cometDistance);
    if (result.outcome !== "flying") return { outcome: result.outcome, closest, energyGain: calculateStarEnergy(probe, SUN_MU) - start };
  }
  return { outcome: "timeout", closest, energyGain: calculateStarEnergy(probe, SUN_MU) - start };
}

export const slingshotProbe: LiveGameDefinition<SlingState> = {
  id: "slingshot-probe",
  title: "Slingshot Space Probe",
  worldId: "astronomy",
  eyebrow: "PLAYGROUND · GRAVITY ASSISTS",
  modelTag: "ORBITS · GRAVITY ASSIST",
  introduction: "Launch a space probe to catch a comet! Your rocket is too weak to get there on its own, so borrow some speed from a giant planet as you fly past it.",
  howToPlay: "Set the launch speed and direction, then press Launch (Space or Enter). Watch your path; try again with small changes.",
  physics: "The Sun's gravity pulls the probe back all the time, so it flies in a curve (an orbit) and slows down as it climbs away. A giant planet moving along its own orbit can drag a probe that passes just behind it, swinging it forward and speeding it up: a gravity assist. Real probes like Voyager and Cassini used this to reach the outer planets.",
  assumptions: "Scaled units (the Sun's μ = 1000; Earth's orbit has radius 10 and takes 2π time units), a giant planet 3 % as heavy as the Sun on a circular orbit of radius 25, the probe launched from Earth's position without Earth's own gravity, a comet that stays still, and fourth-order Runge–Kutta integration.",
  levels: MISSIONS.map((mission, index) => ({ id: `mission-${index + 1}`, title: mission.title, goal: mission.goal })),
  sliders: (level) => [
    { key: "speed", label: "Launch speed", unit: "", minimum: 8, maximum: (MISSIONS[level] as Mission).maxSpeed, step: 0.01, initial: 11 },
    { key: "direction", label: "Launch direction", unit: "°", minimum: 0, maximum: 180, step: 0.5, initial: 90 },
  ],
  actions: [{ id: "launch", label: "Launch!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: STEP, timeScale: 3 },
  create: () => ({ probe: null, trail: [], launches: 0, outcome: "aiming", closest: Infinity }),
  step(state, input, dt, level) {
    if (state.outcome === "reached") return state;
    if (state.outcome !== "flying") {
      if (!input.pressed.has("launch")) return state;
      const probe = launch(input.values.speed ?? 11, input.values.direction ?? 90);
      return { probe, trail: [{ x: probe.x, y: probe.y }], launches: state.launches + 1, outcome: "flying", closest: Infinity };
    }
    const result = advanceMission(level, state.probe as ProbeState, dt);
    const trail = state.trail.length > 600 ? [...state.trail.slice(1), { x: result.probe.x, y: result.probe.y }] : [...state.trail, { x: result.probe.x, y: result.probe.y }];
    return { probe: result.probe, trail, launches: state.launches, outcome: result.outcome, closest: Math.min(state.closest, result.cometDistance) };
  },
  verdict(state) {
    switch (state.outcome) {
      case "reached":
        return { status: "won", message: `Comet reached after ${state.launches} launch${state.launches === 1 ? "" : "es"}! Science time.` };
      case "sun":
        return { status: "playing", message: "The probe fell into the Sun. Launch faster or more sideways." };
      case "planet":
        return { status: "playing", message: "Crunch, the probe hit the planet. Pass close, but not that close!" };
      case "lost":
      case "timeout":
        return { status: "playing", message: `Missed: closest approach ${state.closest.toFixed(1)} units. Adjust and launch again.` };
      case "flying":
        return { status: "playing", message: "Flying…" };
      default:
        return { status: "playing", message: "Aim, then launch." };
    }
  },
  stars: (state) => (state.launches <= 2 ? 3 : state.launches <= 5 ? 2 : 1),
  readouts: (state, input, level) => {
    const mission = MISSIONS[level] as Mission;
    const probe = state.probe ?? launch(input.values.speed ?? 11, input.values.direction ?? 90);
    const r = Math.hypot(probe.x, probe.y);
    return [
      { label: "SPEED", value: Math.hypot(probe.vx, probe.vy).toFixed(2) },
      { label: "DISTANCE FROM THE SUN", value: r.toFixed(1) },
      { label: "ENERGY AROUND THE SUN", value: `${calculateStarEnergy(probe, SUN_MU).toFixed(1)} (needs ≥ ${(-SUN_MU / Math.hypot(mission.comet.x, mission.comet.y)).toFixed(1)} to reach the comet)` },
      { label: "LAUNCHES", value: String(state.launches) },
    ];
  },
  draw(context, state, input, width, height, level) {
    const mission = MISSIONS[level] as Mission;
    context.fillStyle = "#070a1f";
    context.fillRect(0, 0, width, height);
    stars(context, width, height);
    const scale = Math.min(width, height) / (2 * 70);
    const at = (x: number, y: number) => ({ x: width / 2 + x * scale, y: height / 2 - y * scale });
    const time = state.probe?.t ?? 0;
    context.strokeStyle = "rgb(255 255 255 / 15%)";
    for (const radius of [EARTH_ORBIT, ...mission.planets.map((planet) => planet.orbitRadius)]) {
      context.beginPath();
      context.arc(width / 2, height / 2, radius * scale, 0, 2 * Math.PI);
      context.stroke();
    }
    context.fillStyle = PLAYGROUND_COLOURS.sun;
    context.beginPath();
    context.arc(width / 2, height / 2, Math.max(6, SUN_RADIUS * scale), 0, 2 * Math.PI);
    context.fill();
    const earth = at(EARTH_ORBIT * Math.cos(time), EARTH_ORBIT * Math.sin(time));
    context.fillStyle = "#4dabf7";
    context.beginPath();
    context.arc(earth.x, earth.y, 5, 0, 2 * Math.PI);
    context.fill();
    for (const planet of mission.planets) {
      const p = planetPosition(planet, SUN_MU, time);
      const screen = at(p.x, p.y);
      context.fillStyle = "#e8590c";
      context.beginPath();
      context.arc(screen.x, screen.y, Math.max(7, PLANET_RADIUS * scale * 2), 0, 2 * Math.PI);
      context.fill();
      badge(context, "Jupiter", screen.x + 10, screen.y - 8, "#d9480f");
    }
    const comet = at(mission.comet.x, mission.comet.y);
    context.fillStyle = "#c5f6fa";
    context.beginPath();
    context.arc(comet.x, comet.y, 5, 0, 2 * Math.PI);
    context.fill();
    badge(context, "comet", comet.x + 8, comet.y - 6, "#0b7285");
    context.strokeStyle = "#ffd43b";
    context.lineWidth = 2;
    context.beginPath();
    state.trail.forEach((point, index) => {
      const p = at(point.x, point.y);
      if (index === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    });
    context.stroke();
    if (!state.probe || state.outcome !== "flying") {
      const angle = ((input.values.direction ?? 90) * Math.PI) / 180;
      const start = at(EARTH_ORBIT, 0);
      context.strokeStyle = PLAYGROUND_COLOURS.white;
      context.setLineDash([4, 4]);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(start.x + Math.cos(angle) * 30, start.y - Math.sin(angle) * 30);
      context.stroke();
      context.setLineDash([]);
    }
  },
  describe: (state, input) => (state.probe ? `The probe is ${Math.hypot(state.probe.x, state.probe.y).toFixed(1)} units from the Sun.` : `Ready to launch at speed ${(input.values.speed ?? 11).toFixed(2)} toward ${input.values.direction ?? 90} degrees.`),
};
