import { STANDARD_GRAVITY, assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/** Air density at sea level, 15 °C, kg/m³. */
export const SEA_LEVEL_AIR_DENSITY = 1.225;

/**
 * Falling through air with quadratic drag.
 *
 * Drag force F = ½ ρ C_d A v². Taking downward speed u: m du/dt = m g − ½ ρ (C_d A) u².
 * The speed approaches the terminal speed v_t = √(2 m g / (ρ C_d A)), where drag equals
 * weight, and has the exact form u(t) = v_t tanh(g t / v_t) from rest.
 * The fall is integrated with fourth-order Runge–Kutta. A canopy opens instantly at a chosen altitude.
 *
 * Limitations: constant air density (no altitude change), vertical fall only, and instant,
 * fully-inflated canopy (no opening shock or oscillation).
 */
export function calculateDragForce(airDensity: number, dragCoefficient: number, areaSquareMeters: number, speed: number): number {
  assertPositive(airDensity, "airDensity");
  assertNonNegative(dragCoefficient, "dragCoefficient");
  assertNonNegative(areaSquareMeters, "areaSquareMeters");
  assertFiniteNumber(speed, "speed");
  return 0.5 * airDensity * dragCoefficient * areaSquareMeters * speed * Math.abs(speed);
}

/** Terminal speed for a given mass and drag area C_d·A (m²). */
export function calculateTerminalSpeed(
  massKilograms: number,
  dragAreaSquareMeters: number,
  airDensity = SEA_LEVEL_AIR_DENSITY,
  gravity = STANDARD_GRAVITY,
): number {
  assertPositive(massKilograms, "massKilograms");
  assertPositive(dragAreaSquareMeters, "dragAreaSquareMeters");
  assertPositive(airDensity, "airDensity");
  assertPositive(gravity, "gravity");
  return Math.sqrt((2 * massKilograms * gravity) / (airDensity * dragAreaSquareMeters));
}

export interface ParachuteFall {
  readonly massKilograms: number;
  readonly bodyDragAreaSquareMeters: number;
  readonly canopyDragAreaSquareMeters: number;
  readonly initialAltitudeMeters: number;
  /** The canopy opens when the fall reaches this altitude. */
  readonly deployAltitudeMeters: number;
  readonly airDensity?: number;
  readonly gravity?: number;
  readonly timeStepSeconds?: number;
}

export interface FallSample {
  readonly timeSeconds: number;
  readonly altitudeMeters: number;
  readonly downwardSpeedMetersPerSecond: number;
}

export interface FallResult {
  readonly samples: readonly FallSample[];
  readonly touchdownSpeedMetersPerSecond: number;
  readonly totalTimeSeconds: number;
  readonly deploymentTimeSeconds: number | null;
}

export function simulateParachuteFall(p: ParachuteFall): FallResult {
  assertPositive(p.massKilograms, "massKilograms");
  assertPositive(p.bodyDragAreaSquareMeters, "bodyDragArea");
  assertNonNegative(p.canopyDragAreaSquareMeters, "canopyDragArea");
  assertPositive(p.initialAltitudeMeters, "initialAltitudeMeters");
  assertNonNegative(p.deployAltitudeMeters, "deployAltitudeMeters");
  const rho = p.airDensity ?? SEA_LEVEL_AIR_DENSITY;
  const g = p.gravity ?? STANDARD_GRAVITY;
  const dt = p.timeStepSeconds ?? 0.01;
  assertPositive(dt, "timeStepSeconds");

  let altitude = p.initialAltitudeMeters;
  let speed = 0;
  let time = 0;
  let deployed: number | null = null;
  const samples: FallSample[] = [{ timeSeconds: 0, altitudeMeters: altitude, downwardSpeedMetersPerSecond: 0 }];
  let step = 0;

  while (altitude > 0 && time < 3600) {
    if (deployed === null && altitude <= p.deployAltitudeMeters) {
      deployed = time;
    }
    const area = deployed === null ? p.bodyDragAreaSquareMeters : p.canopyDragAreaSquareMeters + 0;
    const k = (0.5 * rho * area) / p.massKilograms;
    const accel = (u: number) => g - k * u * u;
    const k1 = accel(speed);
    const k2 = accel(speed + (k1 * dt) / 2);
    const k3 = accel(speed + (k2 * dt) / 2);
    const k4 = accel(speed + k3 * dt);
    const next = speed + ((k1 + 2 * k2 + 2 * k3 + k4) * dt) / 6;
    const drop = ((speed + next) / 2) * dt;
    if (drop >= altitude) {
      const fraction = altitude / drop;
      const touchdownTime = time + dt * fraction;
      const touchdownSpeed = speed + (next - speed) * fraction;
      samples.push({ timeSeconds: touchdownTime, altitudeMeters: 0, downwardSpeedMetersPerSecond: touchdownSpeed });
      return { samples, touchdownSpeedMetersPerSecond: touchdownSpeed, totalTimeSeconds: touchdownTime, deploymentTimeSeconds: deployed };
    }
    altitude -= drop;
    speed = next;
    time += dt;
    step += 1;
    if (step % 50 === 0) {
      samples.push({ timeSeconds: time, altitudeMeters: altitude, downwardSpeedMetersPerSecond: speed });
    }
  }
  return { samples, touchdownSpeedMetersPerSecond: speed, totalTimeSeconds: time, deploymentTimeSeconds: deployed };
}
