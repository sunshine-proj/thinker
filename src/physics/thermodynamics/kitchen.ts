import { LATENT_HEAT_FUSION_WATER, SPECIFIC_HEAT_WATER, assertNonNegative, assertPositive } from "../core";

/**
 * Cooking and cooling: heating time and cooling a drink with ice.
 *
 * Heating m kg of water through ΔT with a hob of power P and efficiency η takes t = m c ΔT/(η P), where c = 4186 J/kg·K.
 * Ice at 0 °C added to a drink first absorbs the latent heat of fusion L = 334 kJ/kg to melt and then warms as water:
 * the final temperature is T_f = (m_w c T_w − m_i L)/((m_w + m_i) c) if all the ice melts. If the drink is too warm
 * for that to be possible the mixture stays at 0 °C with ice left over.
 *
 * Limitations: no heat exchange with the glass or the room, no evaporation, uniform mixing, pure water properties
 * (sugar and alcohol change them slightly), and a constant hob efficiency.
 */
export function calculateHeatingTime(massKg: number, startCelsius: number, endCelsius: number, powerWatts: number, efficiency: number): number {
  assertPositive(massKg, "massKg");
  assertPositive(powerWatts, "powerWatts");
  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new RangeError("The efficiency must be in (0, 1].");
  }
  if (endCelsius < startCelsius) {
    throw new RangeError("The end temperature must not be below the start.");
  }
  return (massKg * SPECIFIC_HEAT_WATER * (endCelsius - startCelsius)) / (efficiency * powerWatts);
}

export interface IcedDrink {
  readonly finalCelsius: number;
  readonly iceLeftKg: number;
}

export function calculateIcedDrink(drinkMassKg: number, drinkCelsius: number, iceMassKg: number): IcedDrink {
  assertPositive(drinkMassKg, "drinkMassKg");
  assertNonNegative(iceMassKg, "iceMassKg");
  const heatAvailable = drinkMassKg * SPECIFIC_HEAT_WATER * drinkCelsius;
  const heatToMelt = iceMassKg * LATENT_HEAT_FUSION_WATER;
  if (heatAvailable <= heatToMelt) {
    return { finalCelsius: 0, iceLeftKg: iceMassKg - heatAvailable / LATENT_HEAT_FUSION_WATER };
  }
  return { finalCelsius: (heatAvailable - heatToMelt) / ((drinkMassKg + iceMassKg) * SPECIFIC_HEAT_WATER), iceLeftKg: 0 };
}
