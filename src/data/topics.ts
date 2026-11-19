/**
 * The physics topics of PRD §4.2, by world. Catalog entries are tagged with these
 * ids, the Knowledge Base has one entry per topic, and a test checks that every
 * topic is taught by at least one game.
 */
export interface PhysicsTopic {
  readonly id: string;
  readonly title: string;
  readonly worldId: string;
}

const topics = (worldId: string, entries: readonly (readonly [string, string])[]): PhysicsTopic[] =>
  entries.map(([id, title]) => ({ id, title, worldId }));

export const PHYSICS_TOPICS: readonly PhysicsTopic[] = Object.freeze([
  ...topics("mechanics", [
    ["motion", "Motion"], ["velocity", "Velocity"], ["acceleration", "Acceleration"],
    ["newtons-laws", "Newton's laws"], ["forces", "Forces"], ["friction", "Friction"],
    ["momentum", "Momentum"], ["energy", "Energy"], ["work-power", "Work and power"],
    ["circular-motion", "Circular motion"], ["rotation", "Rotation"], ["equilibrium", "Equilibrium"],
  ]),
  ...topics("electromagnetism", [
    ["electric-charge", "Electric charge"], ["electric-fields", "Electric fields"], ["voltage", "Voltage"],
    ["current", "Current"], ["resistance", "Resistance"], ["ohms-law", "Ohm's law"],
    ["electric-circuits", "Electric circuits"], ["magnetic-fields", "Magnetic fields"],
    ["lorentz-force", "Lorentz force"], ["electromagnetic-induction", "Electromagnetic induction"],
  ]),
  ...topics("thermodynamics", [
    ["temperature", "Temperature"], ["heat", "Heat"], ["thermal-equilibrium", "Thermal equilibrium"],
    ["heat-transfer", "Heat transfer"], ["specific-heat", "Specific heat capacity"],
    ["thermal-expansion", "Thermal expansion"], ["thermodynamic-laws", "Thermodynamic laws"], ["entropy", "Entropy"],
  ]),
  ...topics("optics", [
    ["reflection", "Reflection"], ["refraction", "Refraction"], ["lenses", "Lenses"], ["mirrors", "Mirrors"],
    ["light-spectrum", "Light spectrum"], ["optical-instruments", "Optical instruments"],
    ["optical-interference", "Interference of light"], ["diffraction", "Diffraction"],
  ]),
  ...topics("waves", [
    ["wave-propagation", "Wave propagation"], ["frequency", "Frequency"], ["amplitude", "Amplitude"],
    ["wavelength", "Wavelength"], ["sound", "Sound"], ["resonance", "Resonance"],
    ["wave-interference", "Interference of waves"], ["doppler-effect", "Doppler effect"],
  ]),
  ...topics("astronomy", [
    ["gravity", "Gravity"], ["planetary-motion", "Planetary motion"], ["orbital-mechanics", "Orbital mechanics"],
    ["escape-velocity", "Escape velocity"], ["stars", "Stars"], ["black-holes", "Black holes"], ["relativity", "Relativity"],
  ]),
  ...topics("modern-physics", [
    ["atomic-structure", "Atomic structure"], ["quantum-mechanics", "Quantum mechanics"],
    ["wave-particle-duality", "Wave-particle duality"], ["photoelectric-effect", "Photoelectric effect"],
    ["particle-physics", "Particle physics"], ["quantum-superposition", "Quantum superposition"],
  ]),
  ...topics("fluids", [
    ["density", "Density"], ["pressure", "Pressure"], ["buoyancy", "Buoyancy"], ["fluid-dynamics", "Fluid dynamics"],
    ["bernoulli", "Bernoulli's principle"], ["viscosity", "Viscosity"], ["aerodynamics", "Aerodynamics"],
  ]),
  ...topics("nuclear", [
    ["nuclear-structure", "Nuclear structure"], ["isotopes", "Isotopes"], ["radioactive-decay", "Radioactive decay"],
    ["nuclear-fusion", "Nuclear fusion"], ["nuclear-fission", "Nuclear fission"], ["mass-energy", "Mass-energy equivalence"],
  ]),
  ...topics("everyday", [
    ["sports-physics", "Sports physics"], ["transportation", "Transportation"], ["household-physics", "Household physics"],
    ["human-vision", "Human vision"], ["sensors", "Sensors"], ["engineering-applications", "Engineering applications"],
  ]),
]);

export type TopicId = (typeof PHYSICS_TOPICS)[number]["id"];

export function findTopic(id: string): PhysicsTopic | undefined {
  return PHYSICS_TOPICS.find((topic) => topic.id === id);
}
