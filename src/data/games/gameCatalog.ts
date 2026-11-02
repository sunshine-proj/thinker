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
    ],
    comingSoon: ["Bridge Builder"],
  },
  {
    id: "electromagnetism",
    title: "Electricity & Magnetism",
    description: "Charges, fields and circuits.",
    entries: [
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
    ],
    comingSoon: ["Electric Detective"],
  },
  {
    id: "optics",
    title: "Optics & Light",
    description: "Reflection, refraction and lenses.",
    entries: [],
    comingSoon: ["Laser Maze", "Lens Designer"],
  },
  {
    id: "thermodynamics",
    title: "Thermodynamics",
    description: "Heat, temperature and energy transfer.",
    entries: [],
    comingSoon: ["Ice Melting Challenge", "Temperature Control"],
  },
  {
    id: "astronomy",
    title: "Astronomy & Astrophysics",
    description: "Gravity, orbits and space missions.",
    entries: [],
    comingSoon: ["Orbit Simulator", "Moon Landing"],
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
