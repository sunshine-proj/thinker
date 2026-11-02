import { assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * A rotating-coil AC generator (Faraday's law of induction).
 *
 * A coil of N turns and area A rotating at angular speed ω in a uniform field B has
 * flux Φ = B A cos ωt, so the induced EMF is ε = −N dΦ/dt = N B A ω sin ωt, with peak
 * N B A ω and RMS value peak/√2. The coil has resistance r in series with the load R_L:
 * I_rms = ε_rms / (R_L + r), load power P = I_rms² R_L, and the coil dissipates I_rms² r.
 *
 * Limitations: a steady sinusoidal output, a purely resistive load, no coil inductance or
 * mechanical losses, and a uniform magnetic field.
 */
export interface GeneratorDesign {
  readonly turns: number;
  readonly fieldTesla: number;
  readonly areaSquareMeters: number;
  readonly revolutionsPerMinute: number;
  readonly loadOhms: number;
  /** Coil resistance per turn, ohms. */
  readonly coilOhmsPerTurn: number;
}

export interface GeneratorOutput {
  readonly angularSpeedRadiansPerSecond: number;
  readonly frequencyHertz: number;
  readonly peakEmfVolts: number;
  readonly rmsEmfVolts: number;
  readonly coilResistanceOhms: number;
  readonly rmsCurrentAmperes: number;
  readonly loadPowerWatts: number;
  readonly coilLossWatts: number;
  /** Load power divided by total electrical power. */
  readonly efficiency: number;
}

export function calculatePeakEmf(turns: number, fieldTesla: number, areaSquareMeters: number, angularSpeed: number): number {
  assertPositive(turns, "turns");
  assertNonNegative(fieldTesla, "fieldTesla");
  assertPositive(areaSquareMeters, "areaSquareMeters");
  assertNonNegative(angularSpeed, "angularSpeed");
  return turns * fieldTesla * areaSquareMeters * angularSpeed;
}

/** Instantaneous EMF ε = ε_peak sin ωt. */
export function calculateEmfAtTime(peakEmfVolts: number, angularSpeed: number, timeSeconds: number): number {
  assertFiniteNumber(peakEmfVolts, "peakEmfVolts");
  assertFiniteNumber(angularSpeed, "angularSpeed");
  assertNonNegative(timeSeconds, "timeSeconds");
  return peakEmfVolts * Math.sin(angularSpeed * timeSeconds);
}

export function calculateGeneratorOutput(design: GeneratorDesign): GeneratorOutput {
  assertPositive(design.loadOhms, "loadOhms");
  assertNonNegative(design.coilOhmsPerTurn, "coilOhmsPerTurn");
  assertNonNegative(design.revolutionsPerMinute, "revolutionsPerMinute");
  const angularSpeed = (2 * Math.PI * design.revolutionsPerMinute) / 60;
  const peak = calculatePeakEmf(design.turns, design.fieldTesla, design.areaSquareMeters, angularSpeed);
  const rms = peak / Math.SQRT2;
  const coilResistance = design.turns * design.coilOhmsPerTurn;
  const current = rms / (design.loadOhms + coilResistance);
  const loadPower = current ** 2 * design.loadOhms;
  const coilLoss = current ** 2 * coilResistance;
  return {
    angularSpeedRadiansPerSecond: angularSpeed,
    frequencyHertz: design.revolutionsPerMinute / 60,
    peakEmfVolts: peak,
    rmsEmfVolts: rms,
    coilResistanceOhms: coilResistance,
    rmsCurrentAmperes: current,
    loadPowerWatts: loadPower,
    coilLossWatts: coilLoss,
    efficiency: loadPower + coilLoss === 0 ? 0 : loadPower / (loadPower + coilLoss),
  };
}
