import { AIR_DENSITY, STANDARD_GRAVITY, assertPositive } from "../core";

/**
 * Lift and drag of a simple fixed wing in steady level flight.
 *
 * Lift L = ½ρv²S C_L and drag D = ½ρv²S C_D, where S is the wing area. Below the stall the lift coefficient is
 * proportional to the angle of attack, C_L = a α, with the finite-wing lift slope a = 2π AR/(AR + 2) per radian
 * (Prandtl, for a wing of aspect ratio AR), and it cannot exceed C_L,max. The drag is the sum of a parasitic part
 * and the induced drag of making lift, C_D = C_D0 + C_L²/(π e AR) with span-efficiency e. In level flight lift
 * equals weight, which fixes the speed for a given C_L; the best glide ratio L/D occurs when the two drag parts are
 * equal, at C_L = √(π e AR C_D0).
 *
 * Limitations: low-speed, incompressible, subsonic flow; a symmetric thin wing with zero lift at zero angle of
 * attack; a flat stall at C_L,max (real stalls are gradual); constant air density; no fuselage, thrust-line or
 * propeller effects.
 */
export function calculateLift(speed: number, wingArea: number, liftCoefficient: number, density = AIR_DENSITY): number {
  assertPositive(speed, "speed");
  assertPositive(wingArea, "wingArea");
  assertPositive(density, "density");
  return 0.5 * density * speed ** 2 * wingArea * liftCoefficient;
}

export function calculateLiftSlope(aspectRatio: number): number {
  assertPositive(aspectRatio, "aspectRatio");
  return (2 * Math.PI * aspectRatio) / (aspectRatio + 2);
}

/** C_L at angle of attack (radians), limited by the stall. Returns the unclamped value as `unstalled` too. */
export function calculateLiftCoefficient(angleRadians: number, aspectRatio: number, maximum: number): { value: number; stalled: boolean } {
  const unstalled = calculateLiftSlope(aspectRatio) * angleRadians;
  assertPositive(maximum, "maximum");
  return { value: Math.min(unstalled, maximum), stalled: unstalled > maximum };
}

export function calculateRequiredLiftCoefficient(massKg: number, speed: number, wingArea: number, density = AIR_DENSITY): number {
  assertPositive(massKg, "massKg");
  assertPositive(speed, "speed");
  assertPositive(wingArea, "wingArea");
  return (2 * massKg * STANDARD_GRAVITY) / (density * speed ** 2 * wingArea);
}

/** Speed at which lift equals weight at the given lift coefficient. */
export function calculateLevelFlightSpeed(massKg: number, wingArea: number, liftCoefficient: number, density = AIR_DENSITY): number {
  assertPositive(massKg, "massKg");
  assertPositive(wingArea, "wingArea");
  assertPositive(liftCoefficient, "liftCoefficient");
  return Math.sqrt((2 * massKg * STANDARD_GRAVITY) / (density * wingArea * liftCoefficient));
}

export function calculateDragCoefficient(liftCoefficient: number, parasiticDrag: number, aspectRatio: number, efficiency: number): number {
  assertPositive(parasiticDrag, "parasiticDrag");
  assertPositive(aspectRatio, "aspectRatio");
  assertPositive(efficiency, "efficiency");
  return parasiticDrag + liftCoefficient ** 2 / (Math.PI * efficiency * aspectRatio);
}

export function calculateBestGlideLiftCoefficient(parasiticDrag: number, aspectRatio: number, efficiency: number): number {
  assertPositive(parasiticDrag, "parasiticDrag");
  assertPositive(aspectRatio, "aspectRatio");
  assertPositive(efficiency, "efficiency");
  return Math.sqrt(Math.PI * efficiency * aspectRatio * parasiticDrag);
}

export function calculateGlideRatio(liftCoefficient: number, parasiticDrag: number, aspectRatio: number, efficiency: number): number {
  return liftCoefficient / calculateDragCoefficient(liftCoefficient, parasiticDrag, aspectRatio, efficiency);
}
