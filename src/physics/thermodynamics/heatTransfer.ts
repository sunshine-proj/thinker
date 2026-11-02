import {
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
} from "../core";

/**
 * Heat conduction through a wall and the warming of a well-mixed room.
 *
 * Fourier's law for a flat wall: power Q = k A ΔT / d, with k the thermal
 * conductivity (W/m·K), A the area (m²), d the thickness (m) and ΔT the
 * temperature difference (K). The thermal conductance is U = k A / d (W/K).
 *
 * Lumped-capacitance room: C dT/dt = P − U (T − T_out), where C is the heat
 * capacity (J/K) and P the heater power (W). The exact solution is
 * T(t) = T_ss + (T₀ − T_ss) e^(−t/τ) with steady state T_ss = T_out + P/U and
 * time constant τ = C/U.
 *
 * Limitations: the room is at one uniform temperature, conductivity and heat
 * capacity are constant, and only conduction through the walls loses heat (no
 * drafts, radiation, or windows).
 */
export function calculateConductionPower(
  conductivityWattsPerMeterKelvin: number,
  areaSquareMeters: number,
  thicknessMeters: number,
  temperatureDifferenceKelvin: number,
): number {
  assertPositive(conductivityWattsPerMeterKelvin, "conductivity");
  assertPositive(areaSquareMeters, "areaSquareMeters");
  assertPositive(thicknessMeters, "thicknessMeters");
  assertFiniteNumber(temperatureDifferenceKelvin, "temperatureDifferenceKelvin");
  return (
    (conductivityWattsPerMeterKelvin * areaSquareMeters * temperatureDifferenceKelvin) /
    thicknessMeters
  );
}

/** Thermal conductance U = k A / d, in W/K. */
export function calculateThermalConductance(
  conductivityWattsPerMeterKelvin: number,
  areaSquareMeters: number,
  thicknessMeters: number,
): number {
  return calculateConductionPower(
    conductivityWattsPerMeterKelvin,
    areaSquareMeters,
    thicknessMeters,
    1,
  );
}

export interface RoomHeating {
  readonly outsideTemperatureCelsius: number;
  readonly heaterPowerWatts: number;
  readonly conductanceWattsPerKelvin: number;
  readonly heatCapacityJoulesPerKelvin: number;
  readonly initialTemperatureCelsius: number;
}

function validateRoom(room: RoomHeating): void {
  assertFiniteNumber(room.outsideTemperatureCelsius, "outsideTemperatureCelsius");
  assertNonNegative(room.heaterPowerWatts, "heaterPowerWatts");
  assertPositive(room.conductanceWattsPerKelvin, "conductanceWattsPerKelvin");
  assertPositive(room.heatCapacityJoulesPerKelvin, "heatCapacityJoulesPerKelvin");
  assertFiniteNumber(room.initialTemperatureCelsius, "initialTemperatureCelsius");
}

/** Temperature the room settles at: T_out + P / U. */
export function calculateSteadyStateTemperature(room: RoomHeating): number {
  validateRoom(room);
  return room.outsideTemperatureCelsius + room.heaterPowerWatts / room.conductanceWattsPerKelvin;
}

/** Time constant τ = C / U, in seconds. */
export function calculateTimeConstant(room: RoomHeating): number {
  validateRoom(room);
  return room.heatCapacityJoulesPerKelvin / room.conductanceWattsPerKelvin;
}

/** Exact room temperature at time t (seconds). */
export function calculateRoomTemperature(room: RoomHeating, timeSeconds: number): number {
  assertNonNegative(timeSeconds, "timeSeconds");
  const steady = calculateSteadyStateTemperature(room);
  return (
    steady +
    (room.initialTemperatureCelsius - steady) *
      Math.exp(-timeSeconds / calculateTimeConstant(room))
  );
}

/**
 * Time (s) for the room to first reach `targetCelsius`, or null if it never
 * does (the target lies beyond the steady state, or is where it already is).
 */
export function calculateTimeToReach(
  room: RoomHeating,
  targetCelsius: number,
): number | null {
  assertFiniteNumber(targetCelsius, "targetCelsius");
  const steady = calculateSteadyStateTemperature(room);
  const start = room.initialTemperatureCelsius;
  if (start === targetCelsius) {
    return 0;
  }
  const ratio = (targetCelsius - steady) / (start - steady);
  // The room moves monotonically from the start toward the steady state.
  return ratio > 0 && ratio < 1 ? -calculateTimeConstant(room) * Math.log(ratio) : null;
}
