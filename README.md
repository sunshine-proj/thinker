
# Physics Playground

An interactive educational PWA for learning physics through games, experiments, and scientific exploration.

## Getting Started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Run the checks and production build with:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Linting uses [oxlint](https://oxc.rs/docs/guide/usage/linter) (`.oxlintrc.json`) rather than ESLint: the project uses the native TypeScript 7 compiler, which typescript-eslint does not support yet. Revisit this when typescript-eslint supports TypeScript 7.

## Architecture Notes

- Shared UI controls live in `src/components/common` (`RangeControl`, `ToggleControl`); reusable game pieces in `src/game-engine/components`; canvas simulations use the `useSimulationCanvas` hook in `src/hooks`.
- Learner progress is stored locally: `src/services/storage/progressRepository.ts` (IndexedDB, with an in-memory fallback), exposed through the Zustand store in `src/store/progressStore.ts`. Synchronization with Supabase is not implemented yet.
- Playable content is registered in `src/data/games/gameCatalog.ts`, which drives the Physics Worlds page.

## Development Roadmap

This sequence establishes the architecture before the project grows to 50+ games and experiments. Completed milestones are checked; remaining steps follow the development phases in [PRD.md](./PRD.md).

1. [x] Create the project structure.
2. [x] Implement the responsive application shell and navigation.
3. [x] Build the reusable physics calculation engine.
4. [x] Build the simulation lifecycle.
5. [x] Implement the Electron Trajectory Lab as the first fully functional scientific simulation.
6. [x] Add Projectile Master as the first physics game.
7. [x] Build reusable game lifecycle, objective, and scoring components; support ready, playing, paused, and completed states.
8. [x] Add Balance Challenge as the next playable mechanics game, with tested physics, objectives, scoring, and difficulty.
9. [ ] Add Circuit Builder as the first playable electricity game, with scientifically accurate circuit calculations and tests.
10. [ ] Complete the experiment workflow with reusable measurements, saved experiment configurations, and educational result explanations.
11. [ ] Implement the remaining MVP games and make them discoverable from Physics Worlds.
12. [ ] Add local progress persistence, resume support, challenges, and achievements. (Completed-game results are already saved in IndexedDB and shown on the Profile page; resume support, challenges, and achievements remain.)
13. [ ] Configure PWA installation and offline access to the application shell and downloaded learning content.
14. [ ] Complete accessibility, responsive-device, offline, browser-compatibility, and performance testing.
