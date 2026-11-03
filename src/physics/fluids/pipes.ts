import { assertNonNegative, assertPositive } from "../core";

/**
 * Steady flow of an incompressible fluid in pipes.
 *
 * Continuity: the volume flow Q = A v is the same through every cross-section, so the speed rises where the pipe
 * narrows. Bernoulli (no friction): P + ½ρv² + ρgh is constant along a streamline, so where the speed rises the
 * pressure falls: P₁ − P₂ = ½ρ(v₂² − v₁²) at equal height. For slow viscous flow in a long round pipe of radius r,
 * length L and viscosity μ the Hagen–Poiseuille law gives Q = π r⁴ ΔP / (8 μ L); the flow is laminar only while
 * the Reynolds number Re = ρ v d / μ is below about 2000.
 *
 * Limitations: steady, incompressible flow; Bernoulli neglects viscosity and Poiseuille neglects entrance effects
 * and applies only to fully developed laminar flow, so it overestimates the flow of a turbulent pipe.
 */
export const LAMINAR_REYNOLDS_LIMIT = 2000;

export function calculateCircleArea(diameterMeters: number): number {
  assertPositive(diameterMeters, "diameterMeters");
  return (Math.PI * diameterMeters ** 2) / 4;
}

export function calculateSpeedFromFlow(flowM3PerS: number, diameterMeters: number): number {
  assertNonNegative(flowM3PerS, "flowM3PerS");
  return flowM3PerS / calculateCircleArea(diameterMeters);
}

export function calculateDiameterForSpeed(flowM3PerS: number, speed: number): number {
  assertPositive(flowM3PerS, "flowM3PerS");
  assertPositive(speed, "speed");
  return Math.sqrt((4 * flowM3PerS) / (Math.PI * speed));
}

/** Pressure drop going from speed v₁ to v₂ at the same height, Pa. */
export function calculateBernoulliPressureDrop(v1: number, v2: number, density: number): number {
  assertNonNegative(v1, "v1");
  assertNonNegative(v2, "v2");
  assertPositive(density, "density");
  return 0.5 * density * (v2 ** 2 - v1 ** 2);
}

export function calculatePoiseuilleFlow(diameterMeters: number, lengthMeters: number, viscosity: number, pressureDropPa: number): number {
  assertPositive(diameterMeters, "diameterMeters");
  assertPositive(lengthMeters, "lengthMeters");
  assertPositive(viscosity, "viscosity");
  assertNonNegative(pressureDropPa, "pressureDropPa");
  const radius = diameterMeters / 2;
  return (Math.PI * radius ** 4 * pressureDropPa) / (8 * viscosity * lengthMeters);
}

export function calculateReynoldsNumber(density: number, speed: number, diameterMeters: number, viscosity: number): number {
  assertPositive(density, "density");
  assertNonNegative(speed, "speed");
  assertPositive(diameterMeters, "diameterMeters");
  assertPositive(viscosity, "viscosity");
  return (density * speed * diameterMeters) / viscosity;
}

export function isLaminar(reynolds: number): boolean {
  return reynolds < LAMINAR_REYNOLDS_LIMIT;
}
