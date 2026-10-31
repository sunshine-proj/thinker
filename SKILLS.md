# Physics Playground — Coding Agent Skills

This document defines reusable implementation skills for coding agents working on Physics Playground.

Agents should consult the relevant skill before implementing a feature.

## Skill 1: Physics Mathematics

### Purpose

Implement reusable mathematical foundations for physics simulations.

### Required Knowledge

- Vector mathematics.
- Coordinate systems.
- Trigonometry.
- Calculus fundamentals.
- Numerical integration.
- Dimensional analysis.
- SI units.

### Implementation Requirements

Create reusable mathematical utilities:

- `Vector2`.
- `Vector3`.
- Matrix operations where needed.
- Dot product.
- Cross product.
- Vector normalization.
- Distance calculations.
- Interpolation.
- Unit conversions.

### Rules

- Avoid duplicated mathematical operations.
- Validate numerical inputs.
- Avoid division by zero.
- Handle floating-point precision appropriately.
- Document units.
- Test edge cases.

## Skill 2: Physics Model Development

### Purpose

Implement scientifically accurate physical models.

### Workflow

1. Identify the physical phenomenon.
2. Research or derive the governing equations.
3. Identify assumptions.
4. Define inputs and outputs.
5. Identify relevant physical constants.
6. Implement the model.
7. Validate against analytical examples.
8. Add automated tests.
9. Document limitations.

### Requirements

Each physics model must specify:

- Model name.
- Physical principle.
- Mathematical equations.
- Input parameters.
- Output parameters.
- SI units.
- Assumptions.
- Known limitations.
- Test cases.

Do not mix physics calculations with rendering code.

## Skill 3: Simulation Engine Development

### Purpose

Create reusable simulation infrastructure.

### Required Capabilities

- Initialization.
- Start.
- Pause.
- Resume.
- Reset.
- Update.
- Render.
- Parameter modification.
- Simulation time.
- State management.

### Architecture

Separate:

- Simulation model.
- Simulation state.
- Time management.
- Rendering.
- User interaction.

### Technical Rules

- Use `requestAnimationFrame` for rendering.
- Use a fixed or appropriately controlled physics timestep.
- Consider accumulated-time simulation updates to avoid frame-rate-dependent calculations.
- Clean up all animation loops and event listeners.
- Provide a mechanism to stop simulations.

## Skill 4: 2D Visualization

### Purpose

Create educational visualizations using Canvas and SVG.

### Suitable Applications

- Projectile motion.
- Magnetic fields.
- Electric fields.
- Wave propagation.
- Optical systems.
- Force diagrams.
- Circuit diagrams.

### Requirements

Visualizations should display relevant physical information.

Examples:

- Position.
- Velocity.
- Acceleration.
- Force.
- Direction.
- Measurement scale.
- Coordinate axes.

Additional requirements:

- Use arrows for vector quantities.
- Use clear legends.
- Ensure labels remain readable on mobile devices.
- Support zooming and scaling when appropriate.

## Skill 5: 3D Visualization

### Purpose

Implement interactive 3D educational simulations.

### Preferred Technology

Three.js.

### Suitable Applications

- Planetary systems.
- Orbital mechanics.
- Helical particle trajectories.
- Magnetic field visualization.
- Atomic models.
- Three-dimensional wave phenomena.

### Requirements

- Responsive rendering.
- Camera controls.
- Clear object identification.
- Appropriate lighting.
- Performance optimization.
- Optional animation.
- Reduced-motion support.

Avoid 3D when a simpler 2D representation explains the physics more effectively.

## Skill 6: Game Development

### Purpose

Implement reusable physics-based games.

### Standard Game Structure

Every game should have:

- Metadata.
- Introduction.
- Learning objectives.
- Instructions.
- Initial state.
- Player controls.
- Game logic.
- Scoring.
- Success conditions.
- Failure conditions.
- Results.
- Educational explanation.

### Game Lifecycle

`READY → PLAYING → PAUSED → COMPLETED`

An optional `FAILED` state may be used.

### Requirements

- Reusable game components.
- Configurable difficulty.
- Functional controls.
- Clear objectives.
- Meaningful scoring.
- Restart functionality.
- Educational feedback.

## Skill 7: Interactive Experiment Development

### Purpose

Create experiments where users discover physical relationships.

### Required Functionality

- Adjustable variables.
- Real-time calculations.
- Visualization.
- Measurement.
- Reset.
- Experiment comparison.
- Result explanation.

### Recommended Interaction Pattern

1. Explain the experiment.
2. Ask the user to predict the result.
3. Allow parameter modification.
4. Run the experiment.
5. Display the results.
6. Explain the physics.
7. Suggest another experiment.

### Example

**Gravity experiment**

Variables:

- Planet mass.
- Planet radius.
- Object mass.
- Initial height.

Outputs:

- Gravitational acceleration.
- Gravitational force.
- Falling time.
- Impact velocity.

## Skill 8: Electron Trajectory Simulation

### Purpose

Implement the Electron Trajectory Lab.

This is a specialized skill because the simulation must correctly represent charged-particle motion.

### Physical Model

Lorentz force:

```text
F = q(E + v × B)
```

Newton's second law:

```text
a = F / m
```

For an electron:

```text
q = -1.602176634 × 10^-19 C
```

Electron mass:

```text
m = 9.1093837139 × 10^-31 kg
```

### Required Modes

#### Mode 1: Uniform Magnetic Field

Simulate electron motion in a uniform magnetic field.

#### Mode 2: Perpendicular Entry

Electron velocity is perpendicular to the magnetic field.

**Expected trajectory:** Circle.

#### Mode 3: Angled Entry

Electron velocity has parallel and perpendicular components.

**Expected trajectory:** Helix.

#### Mode 4: Crossed Fields

Include electric and magnetic fields.

Calculate the resulting Lorentz force.

#### Mode 5: Particle Comparison

Compare electron and proton motion.

### Analytical Calculations

Perpendicular orbit radius:

```text
r = mv / (|q|B)
```

Cyclotron frequency:

```text
f = |q|B / (2πm)
```

Cyclotron angular frequency:

```text
ω = |q|B / m
```

### Numerical Implementation

For charged-particle motion, consider the Boris integration algorithm.

It is particularly useful for preserving particle speed and handling magnetic rotation over many simulation steps.

Validate numerical results against analytical solutions.

### Visualization Requirements

Display:

- Electron position.
- Trajectory.
- Velocity vector.
- Magnetic force vector.
- Magnetic field direction.
- Orbit radius.
- Magnetic field strength.
- Electron velocity.
- Simulation time.

Use dots and crosses to represent magnetic field direction.

### Important Scientific Requirements

- Remember that the electron has negative charge.
- Force direction must follow the cross product and charge sign.
- Magnetic force alone must not change kinetic energy.
- A zero magnetic field must produce straight-line motion if no electric field is present.
- An angled trajectory must include both parallel and perpendicular velocity components.
- Do not use arbitrary trajectory curves.

### Testing

Test:

- Zero magnetic field.
- Zero initial velocity.
- Perpendicular entry.
- Angled entry.
- Positive and negative charge comparison.
- Magnetic field direction reversal.
- Magnetic field strength variation.
- Velocity variation.
- Numerical energy conservation.

For relativistic speeds, provide a separate relativistic model rather than applying classical equations outside their valid range.

## Skill 9: Educational Content Development

### Purpose

Create explanations and learning materials for physics games.

### Content Structure

Each topic should contain:

- Title.
- Short introduction.
- Learning objectives.
- Theoretical explanation.
- Relevant formulas.
- Definitions.
- Real-world examples.
- Experiment.
- Knowledge questions.
- Advanced material.

### Writing Principles

- Use understandable language.
- Explain scientific terms.
- Introduce equations progressively.
- Explain what each variable represents.
- Always include units.
- Connect formulas to observable phenomena.

Avoid presenting formulas without explaining their meaning.

## Skill 10: Thought Experiment Development

### Purpose

Create hypothetical physics scenarios.

### Structure

- Scenario.
- Initial assumptions.
- Prediction question.
- Possible answers.
- Explanation.
- Scientific reasoning.
- Optional simulation.
- Follow-up challenge.

### Important Distinction

Clearly identify:

- Established scientific knowledge.
- Mathematical predictions.
- Simplified assumptions.
- Speculative scenarios.

Do not present hypothetical assumptions as established scientific facts.

## Skill 11: UI/UX Development

### Purpose

Build a consistent and accessible interface.

### Requirements

- Mobile-first.
- Responsive.
- Touch-friendly.
- Keyboard accessible.
- Clear visual hierarchy.
- Consistent navigation.
- Readable typography.
- Accessible color contrast.

### Design Principles

The interface should feel like a modern scientific playground.

- Use visual elements to communicate physical concepts.
- Avoid decorative complexity that interferes with learning.
- Make simulation controls easy to understand.

## Skill 12: PWA Development

### Purpose

Ensure the application works as an installable offline-capable web application.

### Requirements

- Web app manifest.
- Service worker.
- Asset caching.
- Offline fallback.
- IndexedDB persistence.
- Update handling.
- Installation support.

### Offline Behavior

- Previously available games and experiments must work without internet access.
- Do not assume that all content is available offline until it has actually been cached.
- Handle synchronization conflicts carefully.

## Skill 13: Data Persistence

### Purpose

Store user progress and experiments.

### Suggested Entities

#### `UserProgress`

- `userId`
- `completedGames`
- `completedExperiments`
- `currentLevel`
- `earnedAchievements`
- `lastActivity`

#### `GameResult`

- `gameId`
- `score`
- `difficulty`
- `completionStatus`
- `completedAt`

#### `SavedExperiment`

- `experimentId`
- `experimentName`
- `parameters`
- `results`
- `createdAt`

#### `Achievement`

- `achievementId`
- `title`
- `description`
- `unlockedAt`

Support anonymous local usage and optional authenticated synchronization.

## Skill 14: Testing & Validation

### Purpose

Ensure that the application behaves correctly and teaches accurate physics.

### Physics Testing

Validate equations with known analytical results.

Test:

- Normal conditions.
- Boundary conditions.
- Extreme values.
- Invalid inputs.
- Numerical stability.

### Game Testing

Validate:

- Game initialization.
- User interaction.
- Game progression.
- Scoring.
- Completion.
- Restart.

### PWA Testing

Validate:

- Installation.
- Offline access.
- Data persistence.
- Reconnection.
- Synchronization.

### Browser Testing

Test:

- Chrome.
- Firefox.
- Safari.
- Mobile browsers.

## Skill 15: Performance Optimization

### Purpose

Maintain smooth performance during interactive simulations.

### Requirements

- Avoid unnecessary React rendering.
- Use efficient Canvas drawing.
- Optimize Three.js scenes.
- Reuse objects where possible.
- Avoid excessive allocations inside simulation loops.
- Clean up resources.
- Limit simulation complexity.
- Monitor frame rates.

Provide sensible defaults for low-powered devices.

## Skill 16: Accessibility

### Purpose

Make the application usable by a wide range of learners.

### Requirements

- Keyboard navigation.
- Screen-reader labels.
- High-contrast controls.
- Alternative descriptions for visual simulations.
- Reduced-motion options.
- Text-based explanations of visual phenomena.
- Clear error messages.

Never make color the only way to communicate physical information.

## 17. Agent Skill Selection Guide

Before implementing a feature, select the relevant skills.

| Development Task | Required Skills |
|---|---|
| New physics formula | 1, 2, 14 |
| New physics simulation | 1, 2, 3, 4, 14 |
| Electron trajectory | 1, 2, 3, 4, 8, 14 |
| 3D orbital simulation | 1, 2, 3, 5, 14 |
| New physics game | 2, 6, 9, 11, 14 |
| New experiment | 2, 3, 7, 9, 14 |
| Thought experiment | 9, 10 |
| New UI page | 11, 16 |
| Offline functionality | 12, 13, 14 |
| Performance improvement | 3, 5, 15 |
| Progress tracking | 13, 14 |

## 18. Universal Development Checklist

Before completing any feature, verify:

- The feature meets its requirements.
- Physics calculations are scientifically justified.
- Units are documented.
- Inputs are validated.
- Edge cases are handled.
- Tests are implemented.
- UI is responsive.
- Accessibility is considered.
- Performance is acceptable.
- Offline behavior is considered.
- Documentation is updated.

## 19. Final Instruction to Coding Agents

Physics Playground is an educational product first and a gaming product second.

A successful implementation must combine:

- Scientific accuracy.
- Engaging interaction.
- Clear explanations.
- Reusable architecture.
- Excellent user experience.

Every feature should help users understand physics better.

Always prioritize:

**SCIENTIFIC ACCURACY → EDUCATIONAL VALUE → USER EXPERIENCE → VISUAL POLISH**
