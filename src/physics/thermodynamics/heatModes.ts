import { STEFAN_BOLTZMANN_CONSTANT, assertPositive, celsiusToKelvin } from "../core";

/**
 * The three ways heat moves, for a surface of area A between a hot side at T_h and a cold side at T_c.
 *
 * Conduction through a layer of thickness d and conductivity k: P = k A (T_h − T_c)/d (Fourier). Convection to a
 * moving fluid: P = h A (T_h − T_c) (Newton's law of cooling), with a heat-transfer coefficient h that depends on the
 * fluid and its motion. Radiation from a surface of emissivity ε to surroundings at T_c, with temperatures in
 * kelvin: P = ε σ A (T_h⁴ − T_c⁴) (Stefan–Boltzmann). Conduction and convection are linear in the temperature
 * difference, radiation grows as the fourth power of the absolute temperature, so it takes over when things are very hot.
 *
 * Limitations: steady state, a flat uniform layer, a constant h (it really depends on the temperature difference and
 * geometry), a gray surface with constant emissivity, black-body surroundings, and no absorption of radiation by air.
 */
export interface Material {
  readonly id: string;
  readonly name: string;
  /** Thermal conductivity, W/(m·K). */
  readonly conductivity: number;
}

export const CONDUCTORS: readonly Material[] = Object.freeze([
  { id: "copper", name: "Copper", conductivity: 401 },
  { id: "aluminium", name: "Aluminium", conductivity: 237 },
  { id: "steel", name: "Steel", conductivity: 50 },
  { id: "glass", name: "Glass", conductivity: 1.0 },
  { id: "brick", name: "Brick", conductivity: 0.7 },
  { id: "wood", name: "Wood", conductivity: 0.15 },
  { id: "foam", name: "Polystyrene foam", conductivity: 0.033 },
]);

export interface Fluid {
  readonly id: string;
  readonly name: string;
  /** Typical convective heat-transfer coefficient, W/(m²·K). */
  readonly coefficient: number;
}

export const CONVECTION_MEDIA: readonly Fluid[] = Object.freeze([
  { id: "still-air", name: "Still air (natural convection)", coefficient: 10 },
  { id: "fan-air", name: "Air blown by a fan", coefficient: 50 },
  { id: "water", name: "Flowing water", coefficient: 1000 },
]);

export function calculateConvectionPower(coefficient: number, areaSquareMeters: number, hotCelsius: number, coldCelsius: number): number {
  assertPositive(coefficient, "coefficient");
  assertPositive(areaSquareMeters, "areaSquareMeters");
  return coefficient * areaSquareMeters * (hotCelsius - coldCelsius);
}

export function calculateRadiationPower(emissivity: number, areaSquareMeters: number, hotCelsius: number, coldCelsius: number): number {
  if (!(emissivity > 0 && emissivity <= 1)) {
    throw new RangeError("The emissivity must be in (0, 1].");
  }
  assertPositive(areaSquareMeters, "areaSquareMeters");
  const hot = celsiusToKelvin(hotCelsius);
  const cold = celsiusToKelvin(coldCelsius);
  assertPositive(hot, "hot temperature (K)");
  assertPositive(cold, "cold temperature (K)");
  return emissivity * STEFAN_BOLTZMANN_CONSTANT * areaSquareMeters * (hot ** 4 - cold ** 4);
}

/** The conduction, convection and radiation powers together. */
export function compareHeatTransfer(args: {
  conductivity: number; thicknessMeters: number; coefficient: number; emissivity: number;
  areaSquareMeters: number; hotCelsius: number; coldCelsius: number;
}): { conduction: number; convection: number; radiation: number } {
  assertPositive(args.conductivity, "conductivity");
  assertPositive(args.thicknessMeters, "thicknessMeters");
  assertPositive(args.areaSquareMeters, "areaSquareMeters");
  return {
    conduction: (args.conductivity * args.areaSquareMeters * (args.hotCelsius - args.coldCelsius)) / args.thicknessMeters,
    convection: calculateConvectionPower(args.coefficient, args.areaSquareMeters, args.hotCelsius, args.coldCelsius),
    radiation: calculateRadiationPower(args.emissivity, args.areaSquareMeters, args.hotCelsius, args.coldCelsius),
  };
}
