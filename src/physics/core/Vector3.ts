import { assertFiniteNumber, assertNonNegative } from "./numeric";

export class Vector3 {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {
    assertFiniteNumber(x, "x");
    assertFiniteNumber(y, "y");
    assertFiniteNumber(z, "z");
  }

  static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  get magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  get magnitude(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  add(other: Vector3): Vector3 {
    return new Vector3(
      this.x + other.x,
      this.y + other.y,
      this.z + other.z,
    );
  }

  subtract(other: Vector3): Vector3 {
    return new Vector3(
      this.x - other.x,
      this.y - other.y,
      this.z - other.z,
    );
  }

  scale(factor: number): Vector3 {
    assertFiniteNumber(factor, "factor");
    return new Vector3(this.x * factor, this.y * factor, this.z * factor);
  }

  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Vector3): Vector3 {
    return new Vector3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    );
  }

  distanceTo(other: Vector3): number {
    return Math.hypot(
      this.x - other.x,
      this.y - other.y,
      this.z - other.z,
    );
  }

  normalize(): Vector3 {
    const magnitude = this.magnitude;

    if (magnitude === 0) {
      throw new RangeError("A zero vector cannot be normalized.");
    }

    return this.scale(1 / magnitude);
  }

  limit(maximumMagnitude: number): Vector3 {
    assertNonNegative(maximumMagnitude, "maximumMagnitude");
    const magnitude = this.magnitude;

    return magnitude > maximumMagnitude
      ? this.scale(maximumMagnitude / magnitude)
      : this;
  }

  lerp(other: Vector3, amount: number): Vector3 {
    assertFiniteNumber(amount, "amount");

    return new Vector3(
      this.x + (other.x - this.x) * amount,
      this.y + (other.y - this.y) * amount,
      this.z + (other.z - this.z) * amount,
    );
  }

  equals(other: Vector3, tolerance = 0): boolean {
    assertNonNegative(tolerance, "tolerance");

    return (
      Math.abs(this.x - other.x) <= tolerance &&
      Math.abs(this.y - other.y) <= tolerance &&
      Math.abs(this.z - other.z) <= tolerance
    );
  }
}
