import { STANDARD_GRAVITY, assertPositive } from "../core";

/**
 * Slow motion of a small sphere through a viscous fluid (Stokes' law).
 *
 * Drag F = 6π μ r v. Balancing weight minus buoyancy gives the terminal speed
 * v_t = 2 (ρ_s − ρ_f) g r² / (9 μ), so timing a falling ball measures the viscosity:
 * μ = 2 (ρ_s − ρ_f) g r² / (9 v). The law holds when the Reynolds number
 * Re = ρ_f v (2r) / μ is below about 1.
 *
 * Inputs SI (kg/m³, m, Pa·s, m/s). Assumptions: a smooth rigid sphere far from walls,
 * a Newtonian fluid at constant temperature. Limitations: wall effects in narrow tubes
 * and the rise of viscosity as honey cools are not modelled.
 */

export interface ViscousFluid {
  readonly id: string;
  readonly name: string;
  readonly density: number;
  /** Dynamic viscosity at about 20 °C, Pa·s. */
  readonly viscosity: number;
}

export const VISCOUS_FLUIDS: readonly ViscousFluid[] = Object.freeze([
  { id: "water", name: "Water", density: 998, viscosity: 1.0e-3 },
  { id: "olive-oil", name: "Olive oil", density: 910, viscosity: 0.084 },
  { id: "glycerol", name: "Glycerol", density: 1260, viscosity: 1.41 },
  { id: "honey", name: "Honey", density: 1420, viscosity: 8 },
]);

/** Stokes terminal speed (m/s) of a sphere; negative means it rises. */
export function calculateStokesTerminalSpeed(sphereDensity: number, fluidDensity: number, radiusMeters: number, viscosity: number, gravity = STANDARD_GRAVITY): number {
  assertPositive(sphereDensity, "sphereDensity");
  assertPositive(fluidDensity, "fluidDensity");
  assertPositive(radiusMeters, "radiusMeters");
  assertPositive(viscosity, "viscosity");
  return (2 * (sphereDensity - fluidDensity) * gravity * radiusMeters ** 2) / (9 * viscosity);
}

/** Viscosity (Pa·s) from a measured terminal speed. */
export function calculateViscosityFromFall(sphereDensity: number, fluidDensity: number, radiusMeters: number, terminalSpeed: number, gravity = STANDARD_GRAVITY): number {
  assertPositive(radiusMeters, "radiusMeters");
  assertPositive(terminalSpeed, "terminalSpeed");
  return (2 * (sphereDensity - fluidDensity) * gravity * radiusMeters ** 2) / (9 * terminalSpeed);
}

/** Reynolds number of a sphere moving at speed v. */
export function calculateSphereReynolds(fluidDensity: number, speed: number, radiusMeters: number, viscosity: number): number {
  assertPositive(fluidDensity, "fluidDensity");
  assertPositive(radiusMeters, "radiusMeters");
  assertPositive(viscosity, "viscosity");
  return (fluidDensity * Math.abs(speed) * 2 * radiusMeters) / viscosity;
}

/** Radius (m) of the sphere whose Stokes fall has a given Reynolds number. Re ∝ r³. */
export function calculateRadiusForReynolds(sphereDensity: number, fluidDensity: number, viscosity: number, reynolds: number, gravity = STANDARD_GRAVITY): number {
  assertPositive(reynolds, "reynolds");
  const perCube = (4 * fluidDensity * (sphereDensity - fluidDensity) * gravity) / (9 * viscosity ** 2);
  assertPositive(perCube, "density difference");
  return Math.cbrt(reynolds / perCube);
}
