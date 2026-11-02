
# Physics Playground

An interactive educational PWA for learning physics through games, experiments, and scientific exploration.

## Getting Started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Run the tests and production build with:

```bash
npm test
npm run build
```

## Development Roadmap

This sequence establishes the architecture before the project grows to 50+ games and experiments. Completed milestones are checked; remaining steps follow the development phases in [PRD.md](./PRD.md).

1. [x] Create the project structure.
2. [x] Implement the responsive application shell and navigation.
3. [x] Build the reusable physics calculation engine.
4. [x] Build the simulation lifecycle.
5. [x] Implement the Electron Trajectory Lab as the first fully functional scientific simulation.
6. [x] Add Projectile Master as the first physics game.
7. [x] Build reusable game lifecycle, objective, and scoring components; support ready, playing, paused, and completed states.
8. [ ] Add Balance Challenge as the next playable mechanics game, with tested physics, objectives, scoring, and difficulty.
9. [ ] Add Circuit Builder as the first playable electricity game, with scientifically accurate circuit calculations and tests.
10. [ ] Complete the experiment workflow with reusable measurements, saved experiment configurations, and educational result explanations.
11. [ ] Implement the remaining MVP games and make them discoverable from Physics Worlds.
12. [ ] Add local progress persistence, resume support, challenges, and achievements.
13. [ ] Configure PWA installation and offline access to the application shell and downloaded learning content.
14. [ ] Complete accessibility, responsive-device, offline, browser-compatibility, and performance testing.
