import { assertFiniteNumber, assertNonNegative } from "./numeric";

export class Vector2 {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    assertFiniteNumber(x, "x");
    assertFiniteNumber(y, "y");
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static fromAngle(angleRadians: number, magnitude = 1): Vector2 {
    assertFiniteNumber(angleRadians, "angleRadians");
    assertFiniteNumber(magnitude, "magnitude");

    return new Vector2(
      magnitude * Math.cos(angleRadians),
      magnitude * Math.sin(angleRadians),
    );
  }

  get magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  get magnitude(): number {
    return Math.hypot(this.x, this.y);
  }

  get angleRadians(): number {
    return Math.atan2(this.y, this.x);
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  scale(factor: number): Vector2 {
    assertFiniteNumber(factor, "factor");
    return new Vector2(this.x * factor, this.y * factor);
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  cross(other: Vector2): number {
    return this.x * other.y - this.y * other.x;
  }

  distanceTo(other: Vector2): number {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }

  normalize(): Vector2 {
    const magnitude = this.magnitude;

    if (magnitude === 0) {
      throw new RangeError("A zero vector cannot be normalized.");
    }

    return this.scale(1 / magnitude);
  }

  limit(maximumMagnitude: number): Vector2 {
    assertNonNegative(maximumMagnitude, "maximumMagnitude");
    const magnitude = this.magnitude;

    return magnitude > maximumMagnitude
      ? this.scale(maximumMagnitude / magnitude)
      : this;
  }

  lerp(other: Vector2, amount: number): Vector2 {
    assertFiniteNumber(amount, "amount");

    return new Vector2(
      this.x + (other.x - this.x) * amount,
      this.y + (other.y - this.y) * amount,
    );
  }

  equals(other: Vector2, tolerance = 0): boolean {
    assertNonNegative(tolerance, "tolerance");

    return (
      Math.abs(this.x - other.x) <= tolerance &&
      Math.abs(this.y - other.y) <= tolerance
    );
  }
}
