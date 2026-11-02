import type { GameDifficulty } from "../../types/progress";

export interface CatalogEntry {
  readonly id: string;
  readonly title: string;
  readonly kind: "game" | "experiment";
  readonly path: string;
  readonly summary: string;
  readonly difficulty: GameDifficulty;
}

export interface PhysicsWorld {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly entries: readonly CatalogEntry[];
  /** Planned activities from the product roadmap that are not playable yet. */
  readonly comingSoon: readonly string[];
}

export const PHYSICS_WORLDS: readonly PhysicsWorld[] = Object.freeze([
  {
    id: "mechanics",
    title: "Mechanics",
    description: "Motion, forces and equilibrium.",
    entries: [
      {
        id: "roller-coaster",
        title: "Roller Coaster Engineer",
        kind: "game",
        path: "/worlds/mechanics/roller-coaster",
        summary: "Choose hill and loop sizes using energy and g-forces.",
        difficulty: "Intermediate",
      },
      {
        id: "parachute-designer",
        title: "Parachute Designer",
        kind: "game",
        path: "/worlds/mechanics/parachute-designer",
        summary: "Size a canopy and choose when to open it for a safe landing.",
        difficulty: "Intermediate",
      },
      {
        id: "space-mission",
        title: "Space Mission",
        kind: "game",
        path: "/worlds/mechanics/space-mission",
        summary: "Use the rocket equation to load propellant and stage a spacecraft.",
        difficulty: "Intermediate",
      },
      {
        id: "race-simulator",
        title: "Race Simulator",
        kind: "game",
        path: "/worlds/mechanics/race-simulator",
        summary: "Tune acceleration and braking to win races and stop before a wall.",
        difficulty: "Beginner",
      },
      {
        id: "projectile-master",
        title: "Projectile Master",
        kind: "game",
        path: "/worlds/mechanics/projectile-master",
        summary: "Predict and tune a launch to hit three targets.",
        difficulty: "Beginner",
      },
      {
        id: "balance-challenge",
        title: "Balance Challenge",
        kind: "game",
        path: "/worlds/mechanics/balance-challenge",
        summary: "Use torque to balance levers, from seesaws to heavy beams.",
        difficulty: "Intermediate",
      },
      {
        id: "bridge-builder",
        title: "Bridge Builder",
        kind: "game",
        path: "/worlds/mechanics/bridge-builder",
        summary: "Choose material and depth so a beam bridge holds within budget.",
        difficulty: "Advanced",
      },
    ],
    comingSoon: [],
  },
  {
    id: "electromagnetism",
    title: "Electricity & Magnetism",
    description: "Charges, fields and circuits.",
    entries: [
      {
        id: "particle-accelerator",
        title: "Particle Accelerator Laboratory",
        kind: "game",
        path: "/worlds/electromagnetism/particle-accelerator",
        summary: "Tune a cyclotron, with an advanced relativistic mode.",
        difficulty: "Advanced",
      },
      {
        id: "electromagnetic-crane",
        title: "Electromagnetic Crane",
        kind: "game",
        path: "/worlds/electromagnetism/electromagnetic-crane",
        summary: "Design a lifting magnet within heating and saturation limits.",
        difficulty: "Intermediate",
      },
      {
        id: "power-plant",
        title: "Power Plant",
        kind: "game",
        path: "/worlds/electromagnetism/power-plant",
        summary: "Build an AC generator to deliver power using Faraday induction.",
        difficulty: "Intermediate",
      },
      {
        id: "magnetic-maze",
        title: "Magnetic Maze",
        kind: "game",
        path: "/worlds/electromagnetism/magnetic-maze",
        summary: "Steer charged particles to a target with magnetic fields.",
        difficulty: "Intermediate",
      },
      {
        id: "electron-trajectory-lab",
        title: "Electron Trajectory Lab",
        kind: "experiment",
        path: "/experiments/electron-trajectory",
        summary: "Steer charged particles with magnetic and electric fields.",
        difficulty: "Intermediate",
      },
      {
        id: "circuit-builder",
        title: "Circuit Builder",
        kind: "game",
        path: "/worlds/electromagnetism/circuit-builder",
        summary: "Combine resistors to hit a target current without overheating.",
        difficulty: "Intermediate",
      },
      {
        id: "electric-detective",
        title: "Electric Detective",
        kind: "game",
        path: "/worlds/electromagnetism/electric-detective",
        summary: "Use force readings and Coulomb's law to find a hidden charge.",
        difficulty: "Advanced",
      },
    ],
    comingSoon: [],
  },
  {
    id: "optics",
    title: "Optics & Light",
    description: "Reflection, refraction and lenses.",
    entries: [
      {
        id: "mirror-illusions",
        title: "Mirror Illusions",
        kind: "game",
        path: "/worlds/optics/mirror-illusions",
        summary: "Choose plane, concave and convex mirrors for useful illusions.",
        difficulty: "Intermediate",
      },
      {
        id: "vision-simulator",
        title: "Vision Simulator",
        kind: "game",
        path: "/worlds/optics/vision-simulator",
        summary: "Prescribe lenses for short-sighted, long-sighted and ageing eyes.",
        difficulty: "Intermediate",
      },
      {
        id: "rainbow-creator",
        title: "Rainbow Creator",
        kind: "game",
        path: "/worlds/optics/rainbow-creator",
        summary: "Trace light through a raindrop to find where rainbows appear.",
        difficulty: "Advanced",
      },
      {
        id: "laser-maze",
        title: "Laser Maze",
        kind: "game",
        path: "/worlds/optics/laser-maze",
        summary: "Steer a laser with mirrors and glass using reflection and Snell's law.",
        difficulty: "Intermediate",
      },
      {
        id: "lens-designer",
        title: "Lens Designer",
        kind: "game",
        path: "/worlds/optics/lens-designer",
        summary: "Design a lens to focus, enlarge, or magnify an image.",
        difficulty: "Intermediate",
      },
    ],
    comingSoon: ["Microscope Builder"],
  },
  {
    id: "thermodynamics",
    title: "Thermodynamics",
    description: "Heat, temperature and energy transfer.",
    entries: [
      {
        id: "solar-cooker",
        title: "Solar Cooker",
        kind: "game",
        path: "/worlds/thermodynamics/solar-cooker",
        summary: "Size and aim a reflector to boil water or bake with sunlight.",
        difficulty: "Intermediate",
      },
      {
        id: "material-detective",
        title: "Material Detective",
        kind: "game",
        path: "/worlds/thermodynamics/material-detective",
        summary: "Identify a metal by its specific heat using calorimetry.",
        difficulty: "Intermediate",
      },
      {
        id: "refrigerator-engineer",
        title: "Refrigerator Engineer",
        kind: "game",
        path: "/worlds/thermodynamics/refrigerator-engineer",
        summary: "Balance heat leak against compressor work to chill a cabinet.",
        difficulty: "Intermediate",
      },
      {
        id: "steam-engine",
        title: "Steam Engine",
        kind: "game",
        path: "/worlds/thermodynamics/steam-engine",
        summary: "Choose temperatures to get work from heat within the Carnot limit.",
        difficulty: "Intermediate",
      },
      {
        id: "ice-melting",
        title: "Ice Melting Challenge",
        kind: "game",
        path: "/worlds/thermodynamics/ice-melting",
        summary: "Balance heat flows to cool a drink or make a perfect slush.",
        difficulty: "Intermediate",
      },
      {
        id: "temperature-control",
        title: "Temperature Control",
        kind: "game",
        path: "/worlds/thermodynamics/temperature-control",
        summary: "Balance heater power against wall heat loss to keep a cabin warm.",
        difficulty: "Intermediate",
      },
    ],
    comingSoon: [],
  },
  {
    id: "astronomy",
    title: "Astronomy & Astrophysics",
    description: "Gravity, orbits and space missions.",
    entries: [
      {
        id: "orbit-simulator",
        title: "Orbit Simulator",
        kind: "game",
        path: "/worlds/astronomy/orbit-simulator",
        summary: "Choose launch speeds for circular, elliptical, and timed Earth orbits.",
        difficulty: "Advanced",
      },
      {
        id: "moon-landing",
        title: "Moon Landing",
        kind: "game",
        path: "/worlds/astronomy/moon-landing",
        summary: "Time a rocket burn to touch down gently on the Moon.",
        difficulty: "Advanced",
      },
    ],
    comingSoon: ["Planet Designer", "Solar System Builder", "Escape Velocity", "Asteroid Mission", "Black Hole Explorer"],
  },
  {
    id: "waves",
    title: "Waves & Sound",
    description: "Frequency, resonance and interference.",
    entries: [],
    comingSoon: ["Sound Creator", "Virtual Guitar", "Wave Simulator", "Echo Explorer", "Frequency Detective", "Wave Interference"],
  },
  {
    id: "modern-physics",
    title: "Modern Physics & Quantum Mechanics",
    description: "Atoms, quanta and particles.",
    entries: [],
    comingSoon: ["Atom Builder", "Particle Detective", "Wave or Particle?", "Quantum Puzzle", "Radioactive Countdown", "Photoelectric Lab"],
  },
  {
    id: "fluids",
    title: "Fluid Mechanics",
    description: "Pressure, buoyancy and flow.",
    entries: [],
    comingSoon: ["Ship Designer", "Water Pressure", "Dam Engineer", "Flight Simulator", "Pipe Puzzle", "Floating Challenge"],
  },
  {
    id: "nuclear",
    title: "Nuclear Physics",
    description: "Isotopes, decay and nuclear energy.",
    entries: [],
    comingSoon: ["Nuclear Puzzle", "Half-Life Challenge", "Fusion Simulator", "Energy Detective", "Isotope Explorer"],
  },
  {
    id: "everyday",
    title: "Physics in Everyday Life",
    description: "Sports, transport and the home.",
    entries: [],
    comingSoon: ["Bicycle Physics", "Basketball Challenge", "Tennis Physics", "Kitchen Scientist", "Car Safety Engineer", "Smartphone Detective", "Amusement Park Physics"],
  },
]);

export function getPlayableGameIds(): string[] {
  return PHYSICS_WORLDS.flatMap((world) => world.entries)
    .filter((entry) => entry.kind === "game")
    .map((entry) => entry.id);
}

export function findCatalogEntry(id: string): CatalogEntry | undefined {
  return PHYSICS_WORLDS.flatMap((world) => world.entries).find(
    (entry) => entry.id === id,
  );
}
