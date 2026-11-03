import { CONCRETE_DENSITY, STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * A gravity dam of rectangular cross-section holding back still water, per meter of dam length.
 *
 * Water of depth h pushes horizontally with the total force F = ½ρ g h² (the pressure rises linearly from zero at
 * the surface to ρgh at the base), acting at h/3 above the base, so it tries to tip the dam about its downstream
 * toe with the overturning moment M_o = F h/3 = ρ g h³/6. The dam resists with its weight W = ρ_c g b H (thickness
 * b, height H) acting at b/2 from the toe, M_r = W b/2. Water seeping under the dam adds an uplift pressure that
 * falls linearly from ρgh at the heel to zero at the toe: U = ½ρ g h b acting 2b/3 from the toe, which reduces the
 * resisting moment by U·2b/3. The safety factor against overturning is SF = M_r / M_o, normally required to be at
 * least 1.5.
 *
 * Limitations: rectangular section, rigid foundation, no sliding check, no ice or earthquake loads, and a simple
 * linear uplift model. Real dams are tapered, and tipping about the toe is only one of several failure modes.
 */
export interface DamDesign {
  readonly waterDepth: number;
  readonly damHeight: number;
  readonly thickness: number;
  readonly concreteDensity?: number;
  readonly uplift?: boolean;
}

export function calculateWaterForce(waterDepthMeters: number, waterDensity = 1000): number {
  assertNonNegative(waterDepthMeters, "waterDepthMeters");
  assertPositive(waterDensity, "waterDensity");
  return 0.5 * waterDensity * STANDARD_GRAVITY * waterDepthMeters ** 2;
}

/** Height above the base at which the resultant water force acts: h/3. */
export function calculateCenterOfPressureHeight(waterDepthMeters: number): number {
  assertNonNegative(waterDepthMeters, "waterDepthMeters");
  return waterDepthMeters / 3;
}

export function calculateOverturningMoment(waterDepthMeters: number, waterDensity = 1000): number {
  return calculateWaterForce(waterDepthMeters, waterDensity) * calculateCenterOfPressureHeight(waterDepthMeters);
}

export function calculateResistingMoment(design: DamDesign, waterDensity = 1000): number {
  assertPositive(design.thickness, "thickness");
  assertPositive(design.damHeight, "damHeight");
  const weight = (design.concreteDensity ?? CONCRETE_DENSITY) * STANDARD_GRAVITY * design.thickness * design.damHeight;
  let moment = (weight * design.thickness) / 2;
  if (design.uplift) {
    const uplift = 0.5 * waterDensity * STANDARD_GRAVITY * design.waterDepth * design.thickness;
    moment -= uplift * ((2 * design.thickness) / 3);
  }
  return moment;
}

export function calculateOverturningSafetyFactor(design: DamDesign, waterDensity = 1000): number {
  if (design.waterDepth > design.damHeight) {
    throw new RangeError("The water would flow over the top of the dam.");
  }
  return calculateResistingMoment(design, waterDensity) / calculateOverturningMoment(design.waterDepth, waterDensity);
}

/** Thickness that gives exactly `safetyFactor`, since SF is proportional to b². */
export function calculateThicknessForSafetyFactor(design: Omit<DamDesign, "thickness">, safetyFactor: number, waterDensity = 1000): number {
  assertPositive(safetyFactor, "safetyFactor");
  const unit = calculateOverturningSafetyFactor({ ...design, thickness: 1 }, waterDensity);
  if (unit <= 0) {
    throw new RangeError("The uplift removes all resistance for this design.");
  }
  return Math.sqrt(safetyFactor / unit);
}
