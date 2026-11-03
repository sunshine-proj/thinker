import { AIR_DENSITY, STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * A bicycle: gearing, wheel torque and the power needed to ride.
 *
 * The chain links the chainring (front, Tf teeth) to the sprocket on the rear wheel (Tr teeth), so one pedal turn
 * spins the wheel Tf/Tr times and the speed is v = cadence × (Tf/Tr) × wheel circumference. The same ratio
 * multiplies the speed and divides the torque: wheel torque = pedal torque × Tf/Tr (less chain losses). The rider
 * must supply the power to overcome rolling resistance C_rr m g cosθ, gravity m g sinθ on a slope, and air drag
 * ½ρ C_dA v²: P = v (C_rr m g cosθ + m g sinθ + ½ρ C_dA v²)/η, where η is the drivetrain efficiency.
 *
 * Limitations: steady speed (no acceleration), still air (no wind), constant rolling-resistance coefficient and
 * drivetrain efficiency, and a gradient small enough that the road slope is well approximated by atan(grade).
 */
export function calculateBicycleSpeed(cadenceRpm: number, frontTeeth: number, rearTeeth: number, wheelCircumferenceMeters: number): number {
  assertPositive(cadenceRpm, "cadenceRpm");
  assertPositive(frontTeeth, "frontTeeth");
  assertPositive(rearTeeth, "rearTeeth");
  assertPositive(wheelCircumferenceMeters, "wheelCircumferenceMeters");
  return (cadenceRpm / 60) * (frontTeeth / rearTeeth) * wheelCircumferenceMeters;
}

/** Torque at the rear wheel for a given pedal torque, ignoring chain losses. */
export function calculateWheelTorque(pedalTorque: number, frontTeeth: number, rearTeeth: number): number {
  assertNonNegative(pedalTorque, "pedalTorque");
  assertPositive(frontTeeth, "frontTeeth");
  assertPositive(rearTeeth, "rearTeeth");
  return (pedalTorque * frontTeeth) / rearTeeth;
}

/** Forward force at the road for a wheel torque and wheel radius. */
export function calculateDriveForce(wheelTorque: number, wheelRadiusMeters: number): number {
  assertNonNegative(wheelTorque, "wheelTorque");
  assertPositive(wheelRadiusMeters, "wheelRadiusMeters");
  return wheelTorque / wheelRadiusMeters;
}

export interface RideParameters {
  readonly massKg: number;
  readonly rollingResistance: number;
  readonly dragArea: number;
  readonly grade: number;
  readonly efficiency?: number;
  readonly airDensity?: number;
}

/** Force the rider must overcome at steady speed v, N. */
export function calculateResistiveForce(speed: number, ride: RideParameters): number {
  assertNonNegative(speed, "speed");
  assertPositive(ride.massKg, "massKg");
  assertNonNegative(ride.rollingResistance, "rollingResistance");
  assertNonNegative(ride.dragArea, "dragArea");
  const angle = Math.atan(ride.grade);
  const rolling = ride.rollingResistance * ride.massKg * STANDARD_GRAVITY * Math.cos(angle);
  const slope = ride.massKg * STANDARD_GRAVITY * Math.sin(angle);
  const drag = 0.5 * (ride.airDensity ?? AIR_DENSITY) * ride.dragArea * speed ** 2;
  return rolling + slope + drag;
}

/** Pedalling power in watts at steady speed v. */
export function calculateRiderPower(speed: number, ride: RideParameters): number {
  const efficiency = ride.efficiency ?? 0.97;
  assertPositive(efficiency, "efficiency");
  return (speed * calculateResistiveForce(speed, ride)) / efficiency;
}

/** Steady speed reached with a given pedalling power, by bisection (m/s). */
export function calculateSpeedForPower(power: number, ride: RideParameters): number {
  assertPositive(power, "power");
  let low = 0;
  let high = 60;
  if (calculateRiderPower(high, ride) < power) {
    throw new RangeError("That power would exceed 60 m/s.");
  }
  for (let i = 0; i < 100; i += 1) {
    const middle = (low + high) / 2;
    if (calculateRiderPower(middle, ride) < power) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
