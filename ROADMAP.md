# Physics Playground — Roadmap

Steps 1–80 (the MVP and the first 63 games and labs) are complete and listed in [README.md](./README.md#development-roadmap).
This file holds the next development phase. Task numbers continue from the README.

## Phase 8: Completion and Engagement

**Goal:** close the gaps between the code and [PRD.md](./PRD.md). Then make sure every physics topic in PRD §4.2 has at least one game, and make the games fun enough that pupils return to them on their own.

Each task follows the workflow and Definition of Done in [AGENTS.md](./AGENTS.md):

- a tested physics module in `src/physics`,
- documented assumptions and limitations,
- an entry in the catalog,
- tests for the UI and the game states,
- offline support.

A task is ticked only when typecheck, lint, tests, build and `verify:pwa` all pass.

### Status (2026-11-19)

Done except **125** (a playtest with pupils, which needs real pupils; the protocol is in [docs/PLAYTEST.md](./docs/PLAYTEST.md)) and **131** (the manual device and browser checklist in [docs/TESTING.md](./docs/TESTING.md)). Notes where the work differs from the plan:

- **98:** with honest topic tags, the existing games already covered 7 of the 16 topics listed in 8.5 (for example, Moon Landing uses F = ma and Car Safety Engineer covers momentum). All 16 planned games were still built, and the coverage test passes for all 78 topics.
- **116:** the flagship games are separate live versions at `/worlds/<world>/<game>/live`, linked from the classic game and the world map. The classic round-based games stay, as the version without animation.
- **126:** Supabase sync is implemented and tested against mocked endpoints. It needs a Supabase project (URL, anon key, the migration in `supabase/migrations`, anonymous sign-ins enabled) before it runs for real.
- **128:** decided to keep plain CSS and Canvas/SVG; the reasons are recorded in AGENTS.md under "Stack decisions".
- **129:** Projectile Master now uses the standard 60/20/20 scoring, like every other game, so its scores are not comparable with results saved before the change.
- **130:** Circuit Builder's overheated resistor also counts as a failure ("a resistor burned out"), alongside the planned crash, collapse, capsize and reactor cases.

### 8.1 Correctness and honesty fixes

These come first, because they make the app say or show something that is not true.

- [x] 81. Make the offline message in `src/components/feedback/PwaStatus.tsx` match reality. Do not promise that progress "will sync" while no remote sync is configured; say that progress is saved on this device. Update `tests/pwa.test.tsx`.
- [x] 82. Respect `prefers-reduced-motion` in canvas simulations. Add a shared `usePrefersReducedMotion` hook. With reduced motion on, `useSimulationCanvas` and every animated game show the final or stepped state instead of continuous animation. Add tests.
- [x] 83. Move physics out of React components:
  - the double-slit intensity in `WaveOrParticlePage.tsx` should use `calculateScreenIntensity` and `SLIT_SEPARATION_M`;
  - the Kepler radius in `OrbitSimulatorPage.tsx` should be a function in `src/physics/astronomy`;
  - the pot area in `KitchenScientistPage.tsx` should come from the model.
- [x] 84. Put every constant in `src/physics/core/constants.ts` on one CODATA release (2022), including ε₀, μ₀, the neutron mass and the atomic mass unit. Fix the comments that say "CODATA 2018", and re-run the physics tests.
- [x] 85. Make the g shown in hints and captions match the g used in calculations: either show 9.81 m/s² as a rounded 9.80665, or derive the text from `STANDARD_GRAVITY`.
- [x] 86. Remove the `info.txt` agent transcript from the repository root, or move anything worth keeping into `docs/`.

### 8.2 Missing MVP sections (PRD §4, §8, §14)

- [x] 87. **Thought Experiments**, following the PRD §8 flow: scenario → prediction → recorded prediction → conceptual or numerical simulation → comparison → explanation → harder variation.
  - Build the seven PRD scenarios: gravity disappears, gravity doubles, a feather in a vacuum, near the speed of light, Earth with two moons, near absolute zero, slower light.
  - Label each statement as established science, a mathematical prediction, a simplified assumption or speculation (SKILLS §10).
  - Store predictions in IndexedDB.
- [x] 88. **Knowledge Base:** one entry per PRD topic, using the SKILLS §9 structure (introduction, objectives, formulas with every variable and unit explained, examples, questions). Each entry links to the games and labs that teach its topic. It works offline.
- [x] 89. **Home page**, adding the PRD §4.1 sections that are missing:
  - continue learning (resume in-progress sessions from `useGameSession`),
  - a featured experiment,
  - recommended games (based on worlds not yet played),
  - recently completed activities.
- [x] 90. Point the Home page's "What if gravity doubled?" card to the real thought experiment.

### 8.3 Progression, achievements and challenges (PRD §9, §11)

- [x] 91. Add the missing PRD achievements: **Space Engineer** (Astronomy games) and **Wave Master** (Waves & Sound games).
- [x] 92. Add one achievement per physics world, for completing every game in that world, plus achievements for experiments and thought experiments.
- [x] 93. Add at least one challenge per world in `src/data/challenges/challengeCatalog.ts`, including the PRD examples "Achieve a specified electron orbit radius" and "Design a ship with maximum cargo capacity". Score correctness, efficiency, understanding and attempts; speed is never the main measure.
- [x] 94. Show progress by physics world on the Profile page (PRD §11).

### 8.4 Experiment Lab (PRD §6–7)

- [x] 95. Add beginner and advanced modes to the generic `LabPage`: fewer controls and guided steps in beginner mode, all variables and raw data in advanced mode.
- [x] 96. Add a prediction step to every data-driven lab before its first run, and compare the prediction with the result afterwards (SKILLS §7).
- [x] 97. Electron Trajectory Lab:
  - draw the magnetic field as dots and crosses when it is perpendicular to the view (PRD §6.5);
  - let the field point in any direction, not only ±Y;
  - add an explicitly labeled relativistic advanced mode with a separate relativistic Boris integrator and tests (PRD §6.7).

### 8.5 A game for every physics topic

Each PRD §4.2 topic should be taught by at least one game, not only by a lab. The table maps the topics that have no game yet to new games. Every other topic already has a game.

| World | Topic without a game | New game |
|---|---|---|
| Mechanics | Newton's laws | Ice Puck Pilot |
| Mechanics | Friction | Sled Slope |
| Mechanics | Momentum | Cart Collider |
| Mechanics | Work and power | Elevator Engineer |
| Mechanics | Rotation | Rolling Race |
| Thermodynamics | Thermal expansion | Railway Gap Engineer |
| Thermodynamics | Entropy | Entropy Shuffle |
| Optics & Light | Interference | Soap Bubble Colours |
| Optics & Light | Diffraction | Diffraction Detective |
| Waves & Sound | Resonance | Resonance Swing |
| Waves & Sound | Doppler effect | Doppler Chase |
| Astronomy | Stars | Star Classifier |
| Astronomy | Relativity (special) | Lightspeed Voyager |
| Modern Physics | Quantum mechanics (quantisation, tunnelling) | Quantum Tunnel |
| Fluid Mechanics | Viscosity | Honey Drop Race |
| Nuclear Physics | Nuclear fission | Reactor Operator |

- [x] 98. Add a `topics` field to `CatalogEntry` and tag every game and lab with its PRD topics. Add a test that fails when a PRD §4.2 topic has no game. This test is the acceptance check for this section.
- [x] 99. **Ice Puck Pilot** (Mechanics, Newton's laws). Push a puck on frictionless ice with short thrusts and stop it in a goal zone.
  - Physics: F = ma, the first law (constant velocity with no net force) and the third law (thrust reaction).
  - It uses `SimulationEngine` with a fixed time step.
- [x] 100. **Sled Slope** (Mechanics, friction). Choose a surface and a slope angle so a sled starts sliding and stops inside a target zone.
  - Physics: static and kinetic friction.
  - It reuses `calculateFriction`, `calculateCriticalAngle` and `calculateSlideTime`.
- [x] 101. **Cart Collider** (Mechanics, momentum). Set masses, speeds and bumpers (elastic, sticky or spring) on an air track to reach a target outcome.
  - Physics: momentum conservation, and kinetic energy conserved or lost depending on the bumper.
  - It reuses `calculateInelasticVelocity`.
- [x] 102. **Elevator Engineer** (Mechanics, work and power). Choose a motor and gearing to lift loads to given floors within a time and energy budget.
  - Physics: W = F·d, P = W/t, efficiency.
- [x] 103. **Rolling Race** (Mechanics, rotation). Predict which wins a race down a ramp: a hoop, a disc, a solid sphere or a hollow sphere. Then design a winner.
  - Physics: moment of inertia, rolling without slipping (a = g sinθ / (1 + I/mr²)), conservation of angular momentum in a bonus spinning-skater round.
- [x] 104. **Railway Gap Engineer** (Thermodynamics, thermal expansion). Size rail and bridge expansion gaps for hot and cold seasons, and set a bimetal-strip thermostat.
  - Physics: ΔL = αLΔT with tabulated α.
- [x] 105. **Entropy Shuffle** (Thermodynamics, entropy). Release gas particles between two boxes and predict how likely it is that they all return to one side.
  - Physics: microstates, S = k ln Ω, a seeded stochastic simulation.
  - Its claim that probability is why heat flows from hot to cold is labeled as the statistical interpretation.
- [x] 106. **Soap Bubble Colours** (Optics, interference). Match a soap film's thickness to the colour it reflects, and find the thickness of a dark film.
  - Physics: thin-film interference with a phase change on reflection, 2nt = (m + ½)λ.
- [x] 107. **Diffraction Detective** (Optics, diffraction). Use a laser and a grating or slit pattern to find an unknown wavelength, a CD track spacing and the width of a hair.
  - Physics: d sinθ = mλ and single-slit minima a sinθ = mλ, with a resolution limit.
- [x] 108. **Resonance Swing** (Waves, resonance). Push a swing, then a wine glass and a bridge model, at the right frequency, and avoid a resonance disaster.
  - Physics: a driven damped harmonic oscillator, with the analytic steady-state amplitude checked against a numerical integration.
- [x] 109. **Doppler Chase** (Waves, Doppler effect). Hear a passing siren and work out the source's speed and direction from the pitch shift.
  - Physics: f′ = f (v ± v_o)/(v ∓ v_s), below the speed of sound.
  - Audio uses the Web Audio API, works offline and has a visual alternative.
- [x] 110. **Star Classifier** (Astronomy, stars). Sort stars by colour, temperature, luminosity and radius, and place them on a Hertzsprung–Russell diagram.
  - Physics: Wien's law and L = 4πR²σT⁴, with blackbody assumptions documented.
- [x] 111. **Lightspeed Voyager** (Astronomy, special relativity). Plan trips near light speed: ship clocks against Earth clocks, contracted distances and the twin paradox.
  - Physics: the Lorentz factor, time dilation and length contraction.
  - It is clearly labeled as a relativistic model, separate from the classical games. It also supports thought experiment 87.
- [x] 112. **Quantum Tunnel** (Modern physics, quantum mechanics). Tune a particle's energy, a barrier's height and its width to hit a target transmission probability, then fit electrons into a quantum well.
  - Physics: the exact rectangular-barrier transmission and particle-in-a-box levels Eₙ = n²h²/(8mL²).
- [x] 113. **Honey Drop Race** (Fluids, viscosity). Drop balls through honey, oil and water to rank and measure viscosity.
  - Physics: Stokes' law and terminal velocity, with a check of the validity range (Re < 1).
- [x] 114. **Reactor Operator** (Nuclear, fission). Move control rods to keep a reactor critical (k = 1), ramp up power safely and avoid supercritical runaway.
  - Physics: a neutron multiplication model with delayed neutrons. It is simplified point kinetics, documented as such; no weapons physics.
- [x] 115. Add the new games to PRD §4.2 under their worlds and to the README architecture notes.

### 8.6 Making the games fun for pupils

Most games are slider-and-submit rounds. That works for learning, but it is not what makes a pupil come back the next day. The changes below keep physics as the rule of the game (AGENTS §1) while adding direct play.

- [x] 116. **One real-time flagship game per world.** It uses direct manipulation (drag, aim, steer or throttle) on `SimulationEngine`, with keyboard and touch controls and prediction before the run:
  - Mechanics: Projectile Master (drag to aim);
  - Electricity & Magnetism: Magnetic Maze (steer the field live);
  - Thermodynamics: Temperature Control (live thermostat);
  - Optics & Light: Laser Maze (drag and rotate mirrors);
  - Waves & Sound: Resonance Swing;
  - Astronomy: Moon Landing (live throttle);
  - Modern Physics: Atom Builder (fire photons and see spectral lines);
  - Fluid Mechanics: Ship Designer (drag cargo and watch it heel);
  - Nuclear Physics: Reactor Operator;
  - Everyday Life: Basketball Challenge (swipe to shoot).
- [x] 117. **Stars per level.** Each round earns 1–3 stars for correctness, prediction accuracy and efficiency (never speed alone). The stars are shown on the world cards and the Profile page.
- [x] 118. **World map.** Physics Worlds becomes a visual map with a suggested path through each world, beginner to advanced, with nothing locked. The next suggested game is highlighted.
- [x] 119. **Mission stories.** Each world gets a short framing narrative and characters, original to this app: a rescue mission, a space agency, a research station. The games in a world become chapters of that story.
- [x] 120. **Sound and feedback.** Add short, original sound effects and real audio in the waves games (Sound Creator, Virtual Guitar, Doppler Chase) through Web Audio. Sound comes with a mute toggle, works offline and is never the only feedback.
- [x] 121. **Hint ladder.** Replace the single hint with three levels (a nudge, the relevant formula, a worked step), so a stuck pupil keeps playing instead of quitting. Using more hints lowers the stars, not the ability to finish.
- [x] 122. **"Surprise me" and the daily challenge.** Add a random game button on Home and a gentle daily streak. A missed day resets only the streak, never progress.
- [x] 123. **Celebrations.** Show a completion screen with stars, the key physics insight in one sentence, and a "try the advanced version" call to action. It has a reduced-motion variant.
- [x] 124. **Age-appropriate language.** Add a "younger learner" option that uses simpler wording and gentler beginner rounds. The physics stays the same.
- [ ] 125. **Playtest with pupils.** Run a playtest of the flagship games with pupils aged about 11–16. Record where they get stuck, quit or replay, and turn the findings into follow-up tasks here.

### 8.7 Stack and infrastructure

- [x] 126. **Supabase sync:** a `ProgressSyncAdapter` with Supabase authentication (anonymous use remains the default), conflict handling and tests. Then update the offline message from task 81.
- [x] 127. **Playwright:** end-to-end tests for offline navigation, installation, resuming a game after a reload, and a flagship game on a phone viewport.
- [x] 128. **Stack decision for Tailwind CSS and Three.js:** either adopt them where they clearly help (Three.js for a 3D electron helix and the Solar System Builder), or record in AGENTS.md why the project uses plain CSS and Canvas or SVG.
- [x] 129. **Migrate the early games:** move Projectile Master, Balance Challenge and Circuit Builder onto the shared round framework (AGENTS §7: no duplicated mechanics).
- [x] 130. **Failure states:** where it is physically meaningful (a crash landing, a bridge collapse, a reactor runaway), use the optional FAILED lifecycle state with a clear explanation and a retry, instead of only a low score.

### 8.8 Release checks

- [ ] 131. Run the manual checklist in [docs/TESTING.md](./docs/TESTING.md) on real devices and browsers: screen readers, keyboard, zoom, phones and tablets, offline, a mid-range phone and colour vision. Record the results.
- [x] 132. Check performance budgets after the new games are added. The budget is 60 kB gzip per page chunk, and the entry script must stay within its budget.
- [x] 133. Update the README, PRD and this roadmap once the phase is complete.
