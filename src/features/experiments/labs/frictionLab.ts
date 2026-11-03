import { SURFACES, calculateCriticalAngle, calculateFriction } from "../../../physics/mechanics";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition, LabValues } from "./labTypes";

export const FRICTION_LAB_ID = "friction-surfaces";

const surfaceOf = (values: LabValues) => SURFACES.find((surface) => surface.id === values.surface) ?? SURFACES[0]!;
const MAX_FORCE = 800;

export const frictionLab: LabDefinition = {
  id: FRICTION_LAB_ID,
  name: "Friction on Different Surfaces",
  eyebrow: "EXPERIMENT LAB · MECHANICS",
  introduction: "Push or pull a block over different pairs of surfaces, flat or on a slope. Find when it starts to slide, how hard it is to keep it moving, and the angle at which it slips on its own.",
  assumptions: "Dry Coulomb friction: the force depends on the normal force and the surface pair but not on the contact area or the sliding speed. The coefficients are typical textbook values; real ones vary with the exact materials, roughness and moisture. The block slides without tipping.",
  controls: [
    { kind: "choice", key: "surface", label: "Surface pair", options: SURFACES.map((surface) => ({ value: surface.id, label: `${surface.name} (μs ${surface.staticCoefficient}, μk ${surface.kineticCoefficient})` })), initial: "wood-wood" },
    { kind: "number", key: "mass", label: "Block mass", unit: "kg", minimum: 1, maximum: 100, step: 1, initial: 10 },
    { kind: "number", key: "slope", label: "Slope angle", unit: "°", minimum: 0, maximum: 60, step: 0.5, initial: 0 },
    { kind: "number", key: "force", label: "Pushing force up the slope", unit: "N", minimum: 0, maximum: MAX_FORCE, step: 1, initial: 0 },
  ],
  describe: (values) => `${surfaceOf(values).name} · ${values.mass} kg · slope ${values.slope}° · push ${values.force} N`,
  run(values) {
    const surface = surfaceOf(values);
    const mass = values.mass as number;
    const slope = values.slope as number;
    const force = values.force as number;
    const state = calculateFriction(surface, mass, slope, force);
    const critical = calculateCriticalAngle(surface);
    const sweep = Array.from({ length: 161 }, (_, i) => {
      const applied = (MAX_FORCE * i) / 160;
      return { x: applied, y: calculateFriction(surface, mass, slope, applied).frictionForce };
    });
    const direction = state.acceleration > 0 ? "up" : "down";
    return {
      measurements: [
        createMeasurement("normal", "Normal force", state.normalForce, "N"),
        createMeasurement("maxStatic", "Largest static friction", state.maximumStaticFriction, "N"),
        createMeasurement("kinetic", "Sliding friction", state.kineticFriction, "N"),
        createMeasurement("friction", "Friction acting now", state.frictionForce, "N"),
        createMeasurement("slopeForce", "Weight along the slope", state.slopeForce, "N"),
        createMeasurement("acceleration", "Acceleration up the slope", state.acceleration, "m/s²"),
        createMeasurement("critical", "Angle where it slips alone", critical, "°"),
      ],
      charts: [{
        title: "Friction against the pushing force",
        description: `Friction force against the force pushing the block up the slope: it matches the net push while the block is still, up to ${state.maximumStaticFriction.toFixed(0)} newtons, then drops to the sliding value ${state.kineticFriction.toFixed(0)} newtons.`,
        xLabel: "Pushing force (N)", yLabel: "Friction force (N)",
        series: [
          { label: "Friction", points: sweep },
          { label: "Largest static friction", dashed: true, points: [{ x: 0, y: state.maximumStaticFriction }, { x: MAX_FORCE, y: state.maximumStaticFriction }] },
          { label: "Your push", dashed: true, points: [{ x: force, y: 0 }, { x: force, y: Math.max(state.maximumStaticFriction * 1.2, 10) }] },
        ],
        xDomain: [0, MAX_FORCE],
      }],
      explanations: [
        state.moving
          ? { title: "The block is sliding", text: `The net push of ${Math.abs(force - state.slopeForce).toFixed(0)} N along the slope beats the largest static friction ${state.maximumStaticFriction.toFixed(0)} N, so the block slides ${direction} the slope. Friction falls to the sliding value μk N = ${state.kineticFriction.toFixed(0)} N, and the acceleration is ${Math.abs(state.acceleration).toFixed(2)} m/s².` }
          : { title: "The block stays put", text: `Static friction adjusts itself to whatever is needed, here ${state.frictionForce.toFixed(1)} N, and can rise up to μs N = ${state.maximumStaticFriction.toFixed(0)} N. The net push along the slope is smaller than that, so nothing moves.` },
        { title: "Why sliding is easier than starting", text: `For ${surface.name.toLowerCase()} the sliding coefficient (${surface.kineticCoefficient}) is ${surface.kineticCoefficient < surface.staticCoefficient ? "less than" : "equal to"} the static one (${surface.staticCoefficient}). Surface bumps interlock more while at rest, so it takes ${((1 - surface.kineticCoefficient / surface.staticCoefficient) * 100).toFixed(0)} % less force to keep the block moving than to start it.` },
        { title: "The angle of repose", text: `On a bare slope the block slips when tanθ = μs, at ${critical.toFixed(1)}° for this pair. The mass cancels: a heavier block presses harder but is also pulled harder along the slope. At ${slope}° the slope is ${slope > critical ? "steeper" : "gentler"} than that.` },
        { title: "Friction does not depend on the mass of the push", text: `The normal force is ${state.normalForce.toFixed(0)} N (mg cosθ), so doubling the mass doubles both the friction limit and the weight along the slope. Compare the saved runs to see how the surface changes the answer far more than the mass does.` },
      ],
    };
  },
};
