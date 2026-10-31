# Physics Playground

## Product Requirements Document

| Property | Value |
|---|---|
| Version | 1.0 |
| Status | Initial Development Specification |

## 1. Product Vision

Physics Playground is an interactive educational PWA that makes learning physics engaging through games, virtual experiments, simulations, puzzles, and scientific challenges.

Instead of passively reading theoretical explanations, users learn by interacting with physical systems.

Users should be able to experiment with physical parameters, observe the results, discover scientific relationships, and apply their knowledge to solve challenges.

### Product Slogan

> Play. Experiment. Discover.

### Core Pillars

- **Play** — Games, puzzles, missions, and challenges.
- **Experiment** — Interactive physics simulations and laboratories.
- **Discover** — Thought experiments, explanations, and scientific exploration.

## 2. Target Audience

### Students

People learning physics at school or university.

### Curious Learners

People interested in understanding how the physical world works.

### Teachers

Educators looking for interactive teaching materials.

### STEM Enthusiasts

People interested in scientific experiments, engineering, and simulations.

The platform should support different knowledge levels.

## 3. Product Goals

### Primary Goals

- Make physics accessible and entertaining.
- Teach physical concepts through interaction.
- Encourage scientific reasoning.
- Provide accurate educational simulations.
- Support independent learning.
- Encourage repeated engagement.
- Work on desktop, tablets, and smartphones.
- Support offline learning.

### Success Indicators

- Number of completed experiments.
- Number of completed games.
- Experiment replay rate.
- Learning progression.
- Challenge completion rate.
- Returning users.
- Average learning session duration.

## 4. Application Structure

### Main Navigation

- Home
- Physics Worlds
- Experiment Lab
- Challenges
- Thought Experiments
- Knowledge Base
- Achievements
- Profile

### 4.1 Home

The home page should contain:

- Welcome section.
- Continue learning.
- Daily physics challenge.
- Featured experiment.
- Recommended games.
- Learning progress.
- Recently completed activities.

### 4.2 Physics Worlds

Organize content into thematic physics categories.

#### World 1: Mechanics

**Topics:**

- Motion.
- Velocity.
- Acceleration.
- Newton's laws.
- Forces.
- Friction.
- Momentum.
- Energy.
- Work and power.
- Circular motion.
- Rotation.
- Equilibrium.

**Initial games:**

- Projectile Master.
- Race Simulator.
- Bridge Builder.
- Balance Challenge.
- Space Mission.
- Parachute Designer.
- Roller Coaster Engineer.

#### World 2: Electricity & Magnetism

**Topics:**

- Electric charge.
- Electric fields.
- Voltage.
- Current.
- Resistance.
- Ohm's law.
- Electric circuits.
- Magnetic fields.
- Lorentz force.
- Electromagnetic induction.

**Initial games:**

- Circuit Builder.
- Electric Detective.
- Magnetic Maze.
- Power Plant.
- Electromagnetic Crane.
- Electron Trajectory Lab.
- Particle Accelerator Laboratory.

#### World 3: Thermodynamics

**Topics:**

- Temperature.
- Heat.
- Thermal equilibrium.
- Heat transfer.
- Specific heat capacity.
- Thermal expansion.
- Thermodynamic laws.
- Entropy.

**Initial games:**

- Ice Melting Challenge.
- Temperature Control.
- Steam Engine.
- Refrigerator Engineer.
- Material Detective.
- Solar Cooker.

#### World 4: Optics & Light

**Topics:**

- Reflection.
- Refraction.
- Lenses.
- Mirrors.
- Light spectrum.
- Optical instruments.
- Interference.
- Diffraction.

**Initial games:**

- Laser Maze.
- Rainbow Creator.
- Lens Designer.
- Vision Simulator.
- Mirror Illusions.
- Microscope Builder.

#### World 5: Waves & Sound

**Topics:**

- Wave propagation.
- Frequency.
- Amplitude.
- Wavelength.
- Sound.
- Resonance.
- Interference.
- Doppler effect.

**Initial games:**

- Sound Creator.
- Virtual Guitar.
- Wave Simulator.
- Echo Explorer.
- Frequency Detective.
- Wave Interference.

#### World 6: Astronomy & Astrophysics

**Topics:**

- Gravity.
- Planetary motion.
- Orbital mechanics.
- Escape velocity.
- Stars.
- Black holes.
- Relativity.

**Initial games:**

- Planet Designer.
- Orbit Simulator.
- Solar System Builder.
- Escape Velocity.
- Asteroid Mission.
- Black Hole Explorer.
- Moon Landing.

#### World 7: Modern Physics & Quantum Mechanics

**Topics:**

- Atomic structure.
- Quantum mechanics.
- Wave-particle duality.
- Photoelectric effect.
- Particle physics.
- Quantum superposition.

**Initial games:**

- Atom Builder.
- Particle Detective.
- Wave or Particle?
- Quantum Puzzle.
- Radioactive Countdown.
- Photoelectric Lab.

#### World 8: Fluid Mechanics

**Topics:**

- Density.
- Pressure.
- Buoyancy.
- Fluid dynamics.
- Bernoulli's principle.
- Viscosity.
- Aerodynamics.

**Initial games:**

- Ship Designer.
- Water Pressure.
- Dam Engineer.
- Flight Simulator.
- Pipe Puzzle.
- Floating Challenge.

#### World 9: Nuclear Physics

**Topics:**

- Nuclear structure.
- Isotopes.
- Radioactive decay.
- Nuclear fusion.
- Nuclear fission.
- Mass-energy equivalence.

**Initial games:**

- Nuclear Puzzle.
- Half-Life Challenge.
- Fusion Simulator.
- Energy Detective.
- Isotope Explorer.

#### World 10: Physics in Everyday Life

**Topics:**

- Sports physics.
- Transportation.
- Household physics.
- Human vision.
- Sensors.
- Engineering applications.

**Initial games:**

- Bicycle Physics.
- Basketball Challenge.
- Tennis Physics.
- Kitchen Scientist.
- Car Safety Engineer.
- Smartphone Detective.
- Amusement Park Physics.

## 5. Game Formats

The platform should support multiple reusable gameplay formats.

### 5.1 Virtual Experiments

Users manipulate physical parameters and observe the results.

### 5.2 Physics Puzzles

Users solve problems by applying physical principles.

### 5.3 Construction Games

Users build systems that must satisfy physical constraints.

### 5.4 Target Challenges

Users adjust parameters to achieve a specific result.

### 5.5 Discovery Games

Users perform experiments to discover scientific relationships.

### 5.6 Knowledge Challenges

Users answer questions and solve theoretical problems.

### 5.7 Simulators

Users control physical systems.

### 5.8 Mystery Investigations

Users investigate a phenomenon and identify its physical explanation.

Game formats should be reusable across physics worlds.

## 6. Electron Trajectory Lab

**Priority:** High  
**Category:** Electricity & Magnetism

This is an important educational simulation and should be included in the initial development roadmap.

### 6.1 Objective

Create an interactive simulation that calculates and visualizes the trajectory of an electron moving through a magnetic field.

Users should understand how magnetic fields influence charged particle motion.

### 6.2 Basic Simulation

An electron enters a uniform magnetic field.

The player can manipulate:

- Initial velocity.
- Magnetic field strength.
- Magnetic field direction.
- Initial position.
- Initial velocity direction.

The simulation displays:

- Electron position.
- Electron trajectory.
- Velocity vector.
- Magnetic force vector.
- Magnetic field visualization.
- Orbit radius.
- Particle speed.
- Simulation time.

### 6.3 Physics Model

The magnetic Lorentz force is:

```text
F = q(v × B)
```

For an electron:

```text
q = -e
```

When velocity is perpendicular to a uniform magnetic field:

```text
r = mv / (eB)
```

Cyclotron angular frequency:

```text
ω = eB / m
```

Cyclotron period:

```text
T = 2πm / (eB)
```

Where:

- `m` = electron mass.
- `e` = elementary charge magnitude.
- `v` = electron velocity.
- `B` = magnetic field strength.

Use the negative electron charge when calculating force direction.

The magnetic field changes the direction of velocity but does not change particle kinetic energy when no electric field is present.

The initial implementation uses a fixed-step Boris integrator with a 20 ns physics timestep for uniform, time-independent fields. It is a classical model limited to speeds below 0.1 times the speed of light and does not model radiation or collisions. The displayed playback is slowed independently of simulation time so the particle's motion can be observed.

### 6.4 Simulation Modes

#### Mode A: Perpendicular Entry

Electron velocity is perpendicular to the magnetic field.

**Expected result:** Circular trajectory.

#### Mode B: Angled Entry

Electron velocity has parallel and perpendicular components relative to the magnetic field.

**Expected result:** Helical trajectory.

#### Mode C: Crossed Electric and Magnetic Fields

Introduce electric and magnetic fields simultaneously.

Calculate:

```text
F = q(E + v × B)
```

Allow users to investigate the conditions under which electric and magnetic forces balance.

#### Mode D: Particle Comparison

Compare electrons and protons.

Show how mass and charge influence trajectories.

#### Mode E: Target Challenge

Users adjust field strength and initial velocity to guide the particle through a target.

### 6.5 Visual Design

Display:

- Magnetic field as dots and crosses.
- Electron as a clearly visible particle.
- Trajectory as a continuous line.
- Force and velocity vectors.
- Measurement indicators.
- Adjustable parameter controls.

Provide 2D and optional 3D visualization.

### 6.6 Educational Questions

Examples:

- What happens when magnetic field strength increases?
- What happens when electron velocity doubles?
- Why does an electron move in the opposite direction to a positive charge?
- Why does magnetic force not increase the electron's kinetic energy?
- What changes when the particle enters at an angle?

### 6.7 Acceptance Criteria

- Correct electron charge sign.
- Correct Lorentz force direction.
- Correct circular trajectory in perpendicular mode.
- Correct helical trajectory in angled mode.
- Correct calculated orbit radius.
- Correct behavior when magnetic field is zero.
- Adjustable parameters.
- Start, pause, and reset.
- Visible scientific measurements.
- Automated physics tests.

Use a suitable numerical integration method, such as Boris integration for charged-particle motion, where appropriate. Validate numerical accuracy against analytical solutions.

Relativistic corrections should be introduced only in an explicitly labeled advanced mode.

## 7. Experiment Lab

The Experiment Lab provides access to open-ended scientific experiments.

Users can:

- Select a physical system.
- Change parameters.
- Run simulations.
- Pause and reset.
- Measure results.
- Compare multiple experiments.
- Save experiments.

Example experiments:

- Gravity comparison between Earth and Mars.
- Friction on different surfaces.
- Projectile motion.
- Magnetic field strength.
- Electron trajectory.
- Heat transfer.
- Lens focal length.
- Wave interference.
- Orbital motion.

Provide beginner and advanced modes.

## 8. Thought Experiments

This section teaches scientific reasoning through hypothetical situations.

Examples:

- What if Earth's gravity disappeared?
- What if gravity doubled?
- What if a feather fell in a vacuum?
- What would happen near the speed of light?
- What if Earth had two moons?
- What happens near absolute zero?
- What if light traveled slower?

### Gameplay Flow

1. Present a hypothetical scenario.
2. Ask the user to predict the outcome.
3. Record the prediction.
4. Run a conceptual or numerical simulation.
5. Compare the prediction with the result.
6. Explain the physics.
7. Present a more difficult variation.

Clearly distinguish real physical predictions from hypothetical assumptions.

## 9. Challenges

Challenges provide structured objectives.

Examples:

- Hit a target with a projectile.
- Build a bridge that supports a specified weight.
- Build a working electrical circuit.
- Achieve a specified electron orbit radius.
- Land a spacecraft safely.
- Focus a laser using mirrors.
- Design a ship with maximum cargo capacity.

Scoring should consider:

- Correctness.
- Efficiency.
- Scientific understanding.
- Number of attempts.
- Optional time bonus.

Avoid making speed the primary measure of learning.

## 10. Learning System

Every game should provide:

- Introduction.
- Learning objectives.
- Relevant concepts.
- Formula explanations.
- Interactive controls.
- Experiment results.
- Scientific explanation.
- Additional challenges.

Use progressive difficulty:

### Beginner

Simple interactions and guided instructions.

### Intermediate

Multiple variables and independent problem solving.

### Advanced

More complex systems and mathematical reasoning.

## 11. Progression & Achievements

### Player Levels

- Physics Explorer.
- Experimenter.
- Junior Scientist.
- Physics Engineer.
- Master Physicist.
- Research Scientist.

### Achievements

- Gravity Master.
- Circuit Genius.
- Space Engineer.
- Wave Master.
- Particle Explorer.
- Scientific Mind.

Include:

- Completed games.
- Completed experiments.
- Earned badges.
- Learning statistics.
- Progress by physics world.

## 12. Offline Functionality

PWA requirements:

- Installable application.
- Offline navigation.
- Cached game assets.
- Cached educational content.
- Offline simulations.
- Local progress storage.
- Synchronization when online.

The core learning experience must not depend on an active internet connection.

## 13. Technical Architecture

### Preferred Stack

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Zustand.
- React Router.
- Three.js.
- Canvas API.
- Phaser where appropriate.
- Matter.js where appropriate.
- Supabase.
- IndexedDB.
- `vite-plugin-pwa`.

### Architecture Layers

- Presentation.
- Game engine.
- Simulation engine.
- Physics calculations.
- Educational content.
- Persistence.

Keep physics models independent from the UI.

## 14. MVP Scope

Do not implement all physics worlds simultaneously.

### Initial MVP Games

#### Mechanics

- Projectile Master.
- Balance Challenge.
- Bridge Builder.

#### Electricity & Magnetism

- Circuit Builder.
- Electric Detective.
- Electron Trajectory Lab.

#### Optics

- Laser Maze.
- Lens Designer.

#### Thermodynamics

- Ice Melting Challenge.
- Temperature Control.

#### Astronomy

- Orbit Simulator.
- Moon Landing.

**Total:** 12 initial games.

Also implement:

- Home.
- Physics Worlds.
- Experiment Lab.
- Challenges.
- Basic Knowledge Base.
- Basic Achievements.
- Local progress persistence.
- PWA installation and offline support.

## 15. Development Phases

### Phase 1: Foundation

- Initialize project.
- Configure TypeScript.
- Create application layout.
- Implement routing.
- Implement design system.
- Configure PWA.
- Implement local persistence.

### Phase 2: Physics Core

- Vector mathematics.
- Physical constants.
- Unit handling.
- Simulation lifecycle.
- Rendering architecture.
- Physics testing infrastructure.

### Phase 3: First Games

Implement:

- Projectile Master.
- Balance Challenge.
- Circuit Builder.
- Electron Trajectory Lab.

### Phase 4: Experiment System

- Parameter controls.
- Simulation measurements.
- Experiment saving.
- Educational explanations.

### Phase 5: Remaining MVP Games

Implement the other eight games.

### Phase 6: Learning & Gamification

- Achievements.
- Levels.
- Challenges.
- Progress tracking.

### Phase 7: PWA & Quality

- Offline testing.
- Performance optimization.
- Accessibility.
- Mobile testing.
- Browser compatibility.

## 16. Global Acceptance Criteria

The MVP is ready when:

- Users can navigate all primary sections.
- Initial games are playable.
- Simulations respond to parameter changes.
- Physics calculations pass automated tests.
- Users can save and resume progress.
- Core functionality works offline.
- The application is installable.
- Responsive layouts work on mobile and desktop.
- Educational explanations accompany simulations.
- No major interaction or calculation errors remain.

## 17. Future Opportunities

Potential future features:

- Teacher accounts.
- Classroom challenges.
- Shared experiments.
- User-created experiments.
- Multiplayer competitions.
- Advanced 3D simulations.
- Scientific experiment reports.
- AI-assisted explanations.
- Personalized learning paths.
- Additional physics worlds.

These are future opportunities, not MVP requirements.

## 18. Product Success Principle

The application must not become a collection of unrelated mini-games.

All activities should connect to a coherent educational experience.

The desired learning cycle is:

> **PREDICT → EXPERIMENT → OBSERVE → UNDERSTAND → APPLY**
