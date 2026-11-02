import type { ChallengeDefinition } from "../../game-engine/progression/challenges";

export const CHALLENGES: readonly ChallengeDefinition[] = Object.freeze([
  {
    id: "tour-of-physics",
    title: "Tour of physics",
    description: "Complete any game.",
    requirement: { kind: "any-game" },
    path: "/worlds",
  },
  {
    id: "sharpshooter",
    title: "Sharpshooter",
    description: "Score at least 240 in Projectile Master.",
    requirement: { kind: "game-score", gameId: "projectile-master", minimumScore: 240 },
    path: "/worlds/mechanics/projectile-master",
  },
  {
    id: "perfect-balance",
    title: "Perfect balance",
    description: "Score at least 240 in Balance Challenge.",
    requirement: { kind: "game-score", gameId: "balance-challenge", minimumScore: 240 },
    path: "/worlds/mechanics/balance-challenge",
  },
  {
    id: "safe-circuit",
    title: "Safe circuits",
    description: "Score at least 240 in Circuit Builder.",
    requirement: { kind: "game-score", gameId: "circuit-builder", minimumScore: 240 },
    path: "/worlds/electromagnetism/circuit-builder",
  },
  {
    id: "lab-notes",
    title: "Lab notes",
    description: "Save two experiments in the Experiment Lab.",
    requirement: { kind: "saved-experiments", count: 2 },
    path: "/experiments",
  },
]);
