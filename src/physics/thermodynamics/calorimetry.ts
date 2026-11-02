import {
  LATENT_HEAT_FUSION_WATER,
  SPECIFIC_HEAT_ICE,
  SPECIFIC_HEAT_WATER,
  assertFiniteNumber,
  assertNonNegative,
} from "../core";

/**
 * Calorimetry of ice and liquid water in a perfectly insulated container.
 *
 * Energy conservation: heat lost by the warm parts equals heat gained by the
 * cold parts, with no loss to the surroundings and no heat capacity for the
 * container. Heat changes temperature as Q = m c ΔT and changes phase at
 * constant temperature as Q = m L (L = latent heat of fusion). Temperatures in
 * degrees Celsius, masses in kilograms, energies in joules, at ordinary pressure.
 *
 * Limitations: constant specific heats (they vary slightly with temperature),
 * no evaporation, no dissolved substances, and instantaneous thermal equilibrium.
 */
export interface IceWaterMixture {
  readonly iceMassKilograms: number;
  /** Must be at or below 0 °C. */
  readonly iceTemperatureCelsius: number;
  readonly waterMassKilograms: number;
  /** Must be at or above 0 °C. */
  readonly waterTemperatureCelsius: number;
}

export type MixturePhase = "liquid" | "ice-and-water" | "ice";

export interface MixtureResult {
  readonly finalTemperatureCelsius: number;
  /** Ice present at equilibrium. */
  readonly iceMassKilograms: number;
  /** Liquid water present at equilibrium. */
  readonly waterMassKilograms: number;
  readonly phase: MixturePhase;
  /** Heat given up by the water cooling to 0 °C, J. */
  readonly heatAvailableFromWaterJoules: number;
  /** Heat needed to warm the ice to 0 °C, J. */
  readonly heatToWarmIceJoules: number;
  /** Heat needed to melt all the ice at 0 °C, J. */
  readonly heatToMeltAllJoules: number;
}

/** Heat released cooling liquid water from `temperature` to 0 °C: Q = m c T. */
export function calculateHeatToChangeTemperature(
  massKilograms: number,
  specificHeat: number,
  temperatureChangeKelvin: number,
): number {
  assertNonNegative(massKilograms, "massKilograms");
  assertNonNegative(specificHeat, "specificHeat");
  assertFiniteNumber(temperatureChangeKelvin, "temperatureChangeKelvin");
  return massKilograms * specificHeat * temperatureChangeKelvin;
}

/** Heat for a phase change at constant temperature: Q = m L. */
export function calculateHeatOfFusion(massKilograms: number): number {
  assertNonNegative(massKilograms, "massKilograms");
  return massKilograms * LATENT_HEAT_FUSION_WATER;
}

/** Equilibrium state when ice and liquid water are mixed in an insulated container. */
export function solveIceWaterMixture(mixture: IceWaterMixture): MixtureResult {
  const { iceMassKilograms: mi, waterMassKilograms: mw } = mixture;
  const ti = mixture.iceTemperatureCelsius;
  const tw = mixture.waterTemperatureCelsius;
  assertNonNegative(mi, "iceMassKilograms");
  assertNonNegative(mw, "waterMassKilograms");
  assertFiniteNumber(ti, "iceTemperatureCelsius");
  assertFiniteNumber(tw, "waterTemperatureCelsius");
  if (ti > 0) {
    throw new RangeError("Ice cannot be warmer than 0 °C.");
  }
  if (tw < 0) {
    throw new RangeError("Liquid water cannot be colder than 0 °C here.");
  }
  if (mi + mw === 0) {
    throw new RangeError("There must be some ice or water.");
  }

  const heatAvailableFromWaterJoules = mw * SPECIFIC_HEAT_WATER * tw;
  const heatToWarmIceJoules = mi * SPECIFIC_HEAT_ICE * -ti;
  const heatToMeltAllJoules = mi * LATENT_HEAT_FUSION_WATER;
  const base = {
    heatAvailableFromWaterJoules,
    heatToWarmIceJoules,
    heatToMeltAllJoules,
  };
  // Heat left over (positive) or still needed (negative) once everything is at 0 °C.
  const surplus = heatAvailableFromWaterJoules - heatToWarmIceJoules;

  if (surplus >= 0) {
    if (surplus <= heatToMeltAllJoules) {
      const melted = surplus / LATENT_HEAT_FUSION_WATER;
      const iceLeft = mi - melted;
      return {
        ...base,
        finalTemperatureCelsius: 0,
        iceMassKilograms: iceLeft,
        waterMassKilograms: mw + melted,
        phase: iceLeft > 1e-12 ? (mw + melted > 1e-12 ? "ice-and-water" : "ice") : "liquid",
      };
    }
    return {
      ...base,
      finalTemperatureCelsius:
        (surplus - heatToMeltAllJoules) / ((mi + mw) * SPECIFIC_HEAT_WATER),
      iceMassKilograms: 0,
      waterMassKilograms: mi + mw,
      phase: "liquid",
    };
  }

  // Not enough heat to warm the ice to 0 °C: some or all of the water freezes.
  const deficit = -surplus;
  const freezable = mw * LATENT_HEAT_FUSION_WATER;
  if (deficit <= freezable) {
    const frozen = deficit / LATENT_HEAT_FUSION_WATER;
    return {
      ...base,
      finalTemperatureCelsius: 0,
      iceMassKilograms: mi + frozen,
      waterMassKilograms: mw - frozen,
      phase: mw - frozen > 1e-12 ? "ice-and-water" : "ice",
    };
  }
  return {
    ...base,
    finalTemperatureCelsius:
      (heatAvailableFromWaterJoules + freezable + mi * SPECIFIC_HEAT_ICE * ti) /
      ((mi + mw) * SPECIFIC_HEAT_ICE),
    iceMassKilograms: mi + mw,
    waterMassKilograms: 0,
    phase: "ice",
  };
}

/**
 * Enthalpy relative to liquid water at 0 °C, J. Used to check that heat is
 * conserved: liquid m c T, ice at T ≤ 0 is m (c_ice T − L).
 */
export function calculateEnthalpy(
  iceMassKilograms: number,
  iceTemperatureCelsius: number,
  waterMassKilograms: number,
  waterTemperatureCelsius: number,
): number {
  return (
    iceMassKilograms * (SPECIFIC_HEAT_ICE * iceTemperatureCelsius - LATENT_HEAT_FUSION_WATER) +
    waterMassKilograms * SPECIFIC_HEAT_WATER * waterTemperatureCelsius
  );
}

export interface ThermalBody {
  /** Heat capacity m c, in J/K. */
  readonly heatCapacityJoulesPerKelvin: number;
  readonly temperatureCelsius: number;
}

/** Common final temperature of bodies exchanging heat with no loss: T = Σ C T / Σ C. */
export function calculateEquilibriumTemperature(bodies: readonly ThermalBody[]): number {
  if (bodies.length === 0) {
    throw new RangeError("At least one body is required.");
  }
  let totalCapacity = 0;
  let weighted = 0;
  for (const body of bodies) {
    assertNonNegative(body.heatCapacityJoulesPerKelvin, "heatCapacityJoulesPerKelvin");
    assertFiniteNumber(body.temperatureCelsius, "temperatureCelsius");
    totalCapacity += body.heatCapacityJoulesPerKelvin;
    weighted += body.heatCapacityJoulesPerKelvin * body.temperatureCelsius;
  }
  if (totalCapacity === 0) {
    throw new RangeError("The bodies must have some heat capacity.");
  }
  return weighted / totalCapacity;
}

/**
 * Specific heat of a hot sample dropped into water in a calorimeter cup:
 * c_s = (m_w c_w + C_cup)(T_f − T_w) / (m_s (T_s − T_f)).
 */
export function calculateSpecificHeatFromMixing(args: {
  waterMassKilograms: number;
  waterTemperatureCelsius: number;
  cupHeatCapacityJoulesPerKelvin: number;
  sampleMassKilograms: number;
  sampleTemperatureCelsius: number;
  finalTemperatureCelsius: number;
}): number {
  assertNonNegative(args.waterMassKilograms, "waterMassKilograms");
  assertNonNegative(args.cupHeatCapacityJoulesPerKelvin, "cupHeatCapacityJoulesPerKelvin");
  assertNonNegative(args.sampleMassKilograms, "sampleMassKilograms");
  const gain = args.finalTemperatureCelsius - args.waterTemperatureCelsius;
  const drop = args.sampleTemperatureCelsius - args.finalTemperatureCelsius;
  if (args.sampleMassKilograms === 0 || drop <= 0 || gain <= 0) {
    throw new RangeError("The sample must be hotter than the final temperature, which must exceed the water's start.");
  }
  return ((args.waterMassKilograms * SPECIFIC_HEAT_WATER + args.cupHeatCapacityJoulesPerKelvin) * gain) / (args.sampleMassKilograms * drop);
}
