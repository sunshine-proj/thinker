export {
  ELECTRON,
  PROTON,
  advanceChargedParticleBoris,
  calculateCyclotronAngularFrequency,
  calculateCyclotronFrequency,
  calculateCyclotronPeriod,
  calculateKineticEnergy,
  calculateLorentzForce,
  calculateOrbitRadius,
  calculateParticleAcceleration,
  calculatePerpendicularSpeed,
  getParticleSpecies,
  type ChargedParticle,
  type ChargedParticleStepParameters,
  type ElectromagneticField,
  type ParticleSpecies,
} from "./chargedParticle";
export {
  calculateCurrent,
  calculateParallelResistance,
  calculatePower,
  calculateResistance,
  calculateSeriesResistance,
  calculateVoltage,
  solveSeriesParallelCircuit,
  type CircuitSolution,
  type ResistorReading,
  type SeriesParallelCircuit,
} from "./circuit";
export {
  calculateCoulombForceMagnitude,
  calculateDistanceFromForce,
  calculateElectricField,
  calculateElectricFieldFromCharge,
  calculateForceOnCharge,
  type PointCharge,
} from "./electrostatics";
export {
  calculateClassicalExtractionEnergy,
  calculateCyclotronFrequencyHz,
  calculateLorentzFactor,
  calculateRadiusForEnergy,
  calculateRelativisticExtractionEnergy,
  calculateResonantField,
  joulesToMegaelectronvolts,
} from "./accelerator";
export {
  COPPER_RESISTIVITY,
  IRON_SATURATION_TESLA,
  calculateCoilResistance,
  calculateHeatingPower,
  calculateMagneticPullForce,
  calculateSolenoidField,
} from "./electromagnet";
export {
  calculateEmfAtTime,
  calculateGeneratorOutput,
  calculatePeakEmf,
  type GeneratorDesign,
  type GeneratorOutput,
} from "./induction";
