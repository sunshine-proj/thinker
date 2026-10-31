export function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

export function assertNonNegative(value: number, name: string): void {
  assertFiniteNumber(value, name);

  if (value < 0) {
    throw new RangeError(`${name} must be greater than or equal to zero.`);
  }
}

export function assertPositive(value: number, name: string): void {
  assertFiniteNumber(value, name);

  if (value <= 0) {
    throw new RangeError(`${name} must be greater than zero.`);
  }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  assertFiniteNumber(value, "value");
  assertFiniteNumber(minimum, "minimum");
  assertFiniteNumber(maximum, "maximum");

  if (minimum > maximum) {
    throw new RangeError("minimum must not be greater than maximum.");
  }

  return Math.min(Math.max(value, minimum), maximum);
}

export function lerp(start: number, end: number, amount: number): number {
  assertFiniteNumber(start, "start");
  assertFiniteNumber(end, "end");
  assertFiniteNumber(amount, "amount");

  return start + (end - start) * amount;
}

export function nearlyEqual(
  first: number,
  second: number,
  tolerance = Number.EPSILON * 8,
): boolean {
  assertFiniteNumber(first, "first");
  assertFiniteNumber(second, "second");
  assertNonNegative(tolerance, "tolerance");

  return Math.abs(first - second) <= tolerance;
}
