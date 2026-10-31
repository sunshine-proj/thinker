# Physics Playground — Coding Agent Instructions

## 1. Project Overview

You are developing Physics Playground, an interactive Progressive Web Application (PWA) that teaches physics through games, challenges, theoretical experiments, and interactive simulations.

The application's core philosophy is:

> Learn physics by playing, experimenting, building, and discovering.

This is not a traditional educational website. The actual laws of physics must drive the gameplay.

Users should be able to:

- Play physics-based games.
- Conduct virtual scientific experiments.
- Manipulate physical parameters.
- Observe real-time simulation results.
- Solve scientific challenges.
- Learn theoretical concepts through experimentation.
- Track their learning progress.
- Use the application offline.

## 2. Development Principles

- Scientific accuracy comes before visual effects.
- Reusability comes before duplicated implementations.
- Every game should have a clear educational objective.
- Simulations should use mathematically correct physical models.
- UI must be responsive and mobile-first.
- Offline functionality is a core requirement.
- Keep physics calculations separate from UI components.
- Use TypeScript strictly.
- Prefer small, independently testable modules.
- Every interactive control must have a functional purpose.

Never implement visual-only simulations that present physically incorrect behavior as scientifically accurate.

If a simulation uses simplifications, document them clearly.

## 3. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- PWA
- `vite-plugin-pwa`
- Workbox
- IndexedDB
- Service Workers

### Graphics and Simulations

- HTML Canvas
- SVG
- Phaser for game-oriented 2D experiences when useful
- Three.js for 3D simulations
- Matter.js for suitable rigid-body simulations

Use custom mathematical physics models when they provide better scientific control than general-purpose physics libraries.

### State Management

- Zustand

### Backend

- Supabase
- PostgreSQL
- Supabase Authentication

### Testing

- Vitest
- React Testing Library
- Playwright

Use the latest mutually compatible stable versions when initializing the project. Pin dependencies and avoid unnecessary packages.

## 4. Recommended Project Structure

Maintain a modular architecture:

```text
src/
  app/
    App.tsx
    router.tsx
    providers/

  components/
    common/
    layout/
    navigation/
    feedback/

  features/
    home/
    physics-worlds/
    games/
    experiments/
    challenges/
    thought-experiments/
    knowledge-base/
    achievements/
    profile/

  physics/
    core/
      Vector2.ts
      Vector3.ts
      constants.ts
      units.ts

    mechanics/
    electromagnetism/
    thermodynamics/
    optics/
    waves/
    astronomy/
    quantum/
    fluids/
    nuclear/

  simulation/
    engine/
    renderer/
    interactions/
    measurements/

  game-engine/
    core/
    scoring/
    progression/
    objectives/

  data/
    games/
    experiments/
    challenges/

  hooks/
  services/
  store/
  types/
  utils/

public/
  icons/
  images/
  sounds/

tests/
```

Keep the architecture flexible. Introduce additional folders only when justified.

## 5. Physics Engine Rules

Physics calculations must not be embedded directly into React components.

Each physics model should be independently executable and testable.

For every model:

- Define its inputs.
- Define its outputs.
- Specify units.
- Document assumptions.
- Validate numerical boundaries.
- Handle invalid inputs.
- Add unit tests.
- Document limitations.

Use SI units internally.

Avoid unexplained numerical constants. Define physical constants in a centralized location.

Important constants include:

- Speed of light.
- Gravitational acceleration.
- Electron mass.
- Electron charge.
- Proton mass.
- Boltzmann constant.
- Planck constant.
- Elementary charge.

## 6. Simulation Architecture

Every simulation should support, where appropriate:

- Start.
- Pause.
- Resume.
- Reset.
- Change parameters.
- Real-time visualization.
- Measurement.
- Results.
- Educational explanation.

Separate:

- Physics calculations.
- Simulation state.
- Rendering.
- User interaction.
- Educational content.

Use a controlled simulation time step.

Avoid tying physics calculations directly to the browser's rendering frequency.

For simulations requiring numerical integration, choose an appropriate method and validate its accuracy.

Use `requestAnimationFrame` for visual rendering.

Clean up animation frames, timers, and event listeners when components unmount.

## 7. Game Development Rules

Each game should have a consistent structure:

- Game metadata.
- Educational objectives.
- Required physics concepts.
- Initial conditions.
- Player controls.
- Game rules.
- Success conditions.
- Failure conditions.
- Scoring.
- Hints.
- Scientific explanation.
- Difficulty levels.

Create reusable game components and mechanics.

Do not create separate implementations of identical mechanics for different physics topics.

## 8. Educational Requirements

Every game must teach something measurable.

Include:

- Short introduction.
- Learning objectives.
- Relevant formulas.
- Interactive experiment.
- Results.
- Explanation.
- Optional advanced challenge.

Encourage experimentation rather than immediately revealing answers.

Where possible, ask users to predict the outcome before running a simulation.

## 9. UI/UX Requirements

Design should feel like a modern scientific playground.

### Visual Direction

- Modern.
- Clean.
- Interactive.
- Colorful but not childish.
- Scientific.
- Visually rich.
- Responsive.

### Important UX Requirements

- Mobile-first.
- Touch-friendly controls.
- Accessible contrast.
- Keyboard accessibility.
- Clear navigation.
- Responsive simulation canvases.
- Readable formulas.
- Consistent visual language.

Avoid overcrowded interfaces.

## 10. PWA Requirements

The application must:

- Be installable.
- Support offline navigation.
- Cache essential assets.
- Cache available educational content.
- Store progress locally.
- Recover gracefully after connection loss.
- Synchronize progress when connectivity returns.

Do not require an internet connection to run previously downloaded games and experiments.

Use IndexedDB for persistent offline data.

## 11. Performance

Physics simulations should remain responsive on ordinary mobile devices.

Requirements:

- Avoid unnecessary React re-renders.
- Keep animation calculations outside React rendering.
- Use efficient Canvas rendering.
- Avoid unnecessarily expensive 3D effects.
- Optimize large simulation datasets.
- Provide reduced-motion alternatives.
- Limit simulation complexity on low-powered devices.

## 12. Testing Requirements

Every new feature must include appropriate tests.

### Physics

- Formula validation.
- Unit validation.
- Boundary conditions.
- Numerical accuracy.

### Games

- Game state transitions.
- Objectives.
- Scoring.
- Success/failure conditions.

### UI

- Component behavior.
- Accessibility.
- Responsive behavior.

### PWA

- Offline navigation.
- Local persistence.
- Data synchronization.

Never consider a feature complete merely because it renders correctly.

## 13. Development Workflow

Before implementing a feature:

1. Read this file.
2. Read `PRD.md`.
3. Read `SKILLS.md`.
4. Inspect existing architecture.
5. Identify reusable components.
6. Define implementation scope.
7. Implement the feature.
8. Add tests.
9. Run type checking.
10. Run linting.
11. Run relevant tests.
12. Update documentation.

Do not introduce architectural changes without a clear reason.

Do not silently replace existing technologies.

Do not remove working functionality while implementing unrelated features.

## 14. Definition of Done

A feature is complete when:

- It meets the acceptance criteria.
- Its physics is scientifically justified.
- Its calculations are tested.
- Its UI works on mobile and desktop.
- Its controls work.
- It handles errors.
- It follows the project architecture.
- It supports offline functionality where applicable.
- It has appropriate documentation.

## 15. Important Product Principle

Physics Playground should make users curious.

The ideal experience is:

> **PREDICT → EXPERIMENT → OBSERVE → UNDERSTAND → MASTER**

All development decisions should support this experience.
