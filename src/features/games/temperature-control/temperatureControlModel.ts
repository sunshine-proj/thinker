import {
  calculateRoomTemperature,
  calculateSteadyStateTemperature,
  calculateThermalConductance,
  calculateTimeConstant,
  calculateTimeToReach,
  type RoomHeating,
} from "../../../physics/thermodynamics";
import { isRecord, readNumber } from "../../../game-engine/core/sessionParsing";
import type { AttemptOutcome, RoundGameDefinition } from "../../../game-engine/rounds/types";
import {
  HEAT_ROUNDS,
  SIMULATION_HOURS,
  TEMPERATURE_CONTROL_META,
  type HeatControl,
  type HeatRound,
} from "./temperatureControlData";

export interface HeatOutcome extends AttemptOutcome {
  readonly room: RoomHeating;
  readonly conductanceWattsPerKelvin: number;
  readonly steadyStateCelsius: number;
  readonly riseAboveOutsideKelvin: number;
  readonly timeConstantHours: number;
  /** Hours to reach the warm-up temperature, or null if not required or never reached. */
  readonly timeToWarmUpHours: number | null;
}

export function resolveSettings(round: HeatRound, control: HeatControl): { heaterWatts: number; insulationCentimeters: number } {
  const heaterWatts = round.heater.fixedWatts ?? control.heaterWatts;
  const insulationCentimeters = round.insulation.fixedCentimeters ?? control.insulationCentimeters;
  if (heaterWatts < round.heater.minimum || heaterWatts > round.heater.maximum) {
    throw new RangeError(`Heater power must be between ${round.heater.minimum} and ${round.heater.maximum} W.`);
  }
  if (insulationCentimeters < round.insulation.minimum || insulationCentimeters > round.insulation.maximum) {
    throw new RangeError(`Insulation must be between ${round.insulation.minimum} and ${round.insulation.maximum} cm.`);
  }
  return { heaterWatts, insulationCentimeters };
}

export function buildRoom(round: HeatRound, control: HeatControl): RoomHeating {
  const { heaterWatts, insulationCentimeters } = resolveSettings(round, control);
  return {
    outsideTemperatureCelsius: round.outsideTemperatureCelsius,
    heaterPowerWatts: heaterWatts,
    conductanceWattsPerKelvin: calculateThermalConductance(round.conductivity, round.wallAreaSquareMeters, insulationCentimeters / 100),
    heatCapacityJoulesPerKelvin: round.heatCapacityJoulesPerKelvin,
    initialTemperatureCelsius: round.initialTemperatureCelsius,
  };
}

/** Temperature curve over the night, sampled every 15 minutes. */
export function temperatureCurve(room: RoomHeating): { x: number; y: number }[] {
  return Array.from({ length: SIMULATION_HOURS * 4 + 1 }, (_, index) => {
    const hours = index / 4;
    return { x: hours, y: calculateRoomTemperature(room, hours * 3600) };
  });
}

export function evaluateHeating(round: HeatRound, control: HeatControl): HeatOutcome {
  const room = buildRoom(round, control);
  const { goal } = round;
  const steadyStateCelsius = calculateSteadyStateTemperature(room);
  const error = Math.abs(steadyStateCelsius - goal.targetCelsius);
  const timeConstantHours = calculateTimeConstant(room) / 3600;
  const warmSeconds = goal.warmUp ? calculateTimeToReach(room, goal.warmUp.reachCelsius) : null;
  const timeToWarmUpHours = warmSeconds === null ? null : warmSeconds / 3600;

  const temperatureOk = error <= goal.toleranceKelvin;
  const powerOk = goal.maximumPowerWatts === null || room.heaterPowerWatts <= goal.maximumPowerWatts;
  const warmUpOk =
    goal.warmUp === null ||
    (timeToWarmUpHours !== null && timeToWarmUpHours <= goal.warmUp.withinHours);
  const success = temperatureOk && powerOk && warmUpOk;

  const problems: string[] = [];
  if (!temperatureOk) {
    problems.push(
      `The cabin settles at ${steadyStateCelsius.toFixed(1)} °C, ${error.toFixed(1)} K ${steadyStateCelsius < goal.targetCelsius ? "too cold" : "too warm"} (heater power ${room.heaterPowerWatts} W against a loss of ${(room.conductanceWattsPerKelvin * (goal.targetCelsius - round.outsideTemperatureCelsius)).toFixed(0)} W at the target).`,
    );
  }
  if (!powerOk) {
    problems.push(`The heater is rated ${room.heaterPowerWatts} W but only ${goal.maximumPowerWatts} W is allowed.`);
  }
  if (goal.warmUp && !warmUpOk) {
    problems.push(
      timeToWarmUpHours === null
        ? `The cabin never reaches ${goal.warmUp.reachCelsius} °C.`
        : `The cabin takes ${timeToWarmUpHours.toFixed(1)} h to reach ${goal.warmUp.reachCelsius} °C, longer than the ${goal.warmUp.withinHours} h allowed. Its time constant is ${timeConstantHours.toFixed(1)} h; less insulation shortens it.`,
    );
  }
  const feedback = success
    ? `The cabin settles at ${steadyStateCelsius.toFixed(1)} °C${timeToWarmUpHours !== null ? `, reaching ${goal.warmUp?.reachCelsius} °C after ${timeToWarmUpHours.toFixed(1)} h` : ""}.`
    : problems.join(" ");

  return {
    success,
    accuracyFraction: success ? 1 - error / goal.toleranceKelvin : 0,
    predictionActual: room.heaterPowerWatts / room.conductanceWattsPerKelvin,
    feedback,
    room,
    conductanceWattsPerKelvin: room.conductanceWattsPerKelvin,
    steadyStateCelsius,
    riseAboveOutsideKelvin: room.heaterPowerWatts / room.conductanceWattsPerKelvin,
    timeConstantHours,
    timeToWarmUpHours,
  };
}

export const temperatureControl: RoundGameDefinition<HeatRound, HeatControl, HeatOutcome> = {
  meta: TEMPERATURE_CONTROL_META,
  rounds: HEAT_ROUNDS,
  createControl: (round) => ({
    heaterWatts: round.heater.fixedWatts ?? round.heater.minimum,
    insulationCentimeters: round.insulation.fixedCentimeters ?? round.insulation.minimum,
  }),
  parseControl: (raw, round) => {
    if (!isRecord(raw)) {
      return null;
    }
    const heaterWatts = readNumber(raw, "heaterWatts", round.heater.minimum, round.heater.maximum);
    const insulationCentimeters = readNumber(raw, "insulationCentimeters", round.insulation.minimum, round.insulation.maximum);
    return heaterWatts === null || insulationCentimeters === null ? null : { heaterWatts, insulationCentimeters };
  },
  prediction: () => ({
    label: "Your prediction of the temperature rise above outside",
    unit: "K",
    placeholder: "e.g. 25",
    step: 0.1,
  }),
  evaluate: (round, control) => evaluateHeating(round, control),
};
