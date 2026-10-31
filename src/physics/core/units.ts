import {
  assertFiniteNumber,
  assertNonNegative,
} from "./numeric";

export function kilometersToMeters(kilometers: number): number {
  assertFiniteNumber(kilometers, "kilometers");
  return kilometers * 1_000;
}

export function metersToKilometers(meters: number): number {
  assertFiniteNumber(meters, "meters");
  return meters / 1_000;
}

export function centimetersToMeters(centimeters: number): number {
  assertFiniteNumber(centimeters, "centimeters");
  return centimeters / 100;
}

export function millimetersToMeters(millimeters: number): number {
  assertFiniteNumber(millimeters, "millimeters");
  return millimeters / 1_000;
}

export function minutesToSeconds(minutes: number): number {
  assertFiniteNumber(minutes, "minutes");
  return minutes * 60;
}

export function hoursToSeconds(hours: number): number {
  assertFiniteNumber(hours, "hours");
  return hours * 3_600;
}

export function gramsToKilograms(grams: number): number {
  assertFiniteNumber(grams, "grams");
  return grams / 1_000;
}

export function kilogramsToGrams(kilograms: number): number {
  assertFiniteNumber(kilograms, "kilograms");
  return kilograms * 1_000;
}

export function kilometersPerHourToMetersPerSecond(
  kilometersPerHour: number,
): number {
  assertFiniteNumber(kilometersPerHour, "kilometersPerHour");
  return kilometersPerHour / 3.6;
}

export function metersPerSecondToKilometersPerHour(
  metersPerSecond: number,
): number {
  assertFiniteNumber(metersPerSecond, "metersPerSecond");
  return metersPerSecond * 3.6;
}

export function degreesToRadians(degrees: number): number {
  assertFiniteNumber(degrees, "degrees");
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  assertFiniteNumber(radians, "radians");
  return (radians * 180) / Math.PI;
}

export function celsiusToKelvin(celsius: number): number {
  assertFiniteNumber(celsius, "celsius");

  if (celsius < -273.15) {
    throw new RangeError("celsius cannot be below absolute zero.");
  }

  return celsius + 273.15;
}

export function kelvinToCelsius(kelvin: number): number {
  assertNonNegative(kelvin, "kelvin");
  return kelvin - 273.15;
}
