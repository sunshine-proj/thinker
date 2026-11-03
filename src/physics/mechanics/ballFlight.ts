import { AIR_DENSITY, STANDARD_GRAVITY, assertFiniteNumber, assertNonNegative, assertPositive } from "../core";

/**
 * A ball flying through air with quadratic drag (a tennis serve).
 *
 * The drag force is F = ½ρ C_d A v² opposing the velocity, so the acceleration is
 * a = (0, −g) − (ρ C_d A / 2m) |v| v. The equations are integrated with the classical fourth-order Runge–Kutta
 * method with a fixed small step, and the landing point is found by linear interpolation of the last step. The
 * terminal speed in a vertical fall, where drag balances weight, is v_t = √(2mg/(ρ C_d A)).
 *
 * Limitations: spin (the Magnus force and topspin dip of a real serve) is ignored, a constant drag coefficient is
 * used although it varies with speed, and the air is still with constant density.
 */
export interface BallProperties {
  readonly massKg: number;
  readonly diameterMeters: number;
  readonly dragCoefficient: number;
}

export interface BallLaunch {
  readonly speed: number;
  readonly angleDegrees: number;
  readonly height: number;
}

export interface BallFlight {
  readonly points: readonly { x: number; y: number }[];
  readonly range: number;
  readonly flightTime: number;
  readonly landingSpeed: number;
}

export const TENNIS_BALL: BallProperties = Object.freeze({ massKg: 0.057, diameterMeters: 0.067, dragCoefficient: 0.55 });

function crossSection(ball: BallProperties): number {
  return (Math.PI * ball.diameterMeters ** 2) / 4;
}

export function calculateBallTerminalSpeed(ball: BallProperties, density = AIR_DENSITY): number {
  assertPositive(ball.massKg, "massKg");
  assertPositive(ball.diameterMeters, "diameterMeters");
  assertPositive(ball.dragCoefficient, "dragCoefficient");
  return Math.sqrt((2 * ball.massKg * STANDARD_GRAVITY) / (density * ball.dragCoefficient * crossSection(ball)));
}

export function simulateBallFlight(ball: BallProperties, launch: BallLaunch, withDrag = true, step = 0.001): BallFlight {
  assertPositive(launch.speed, "speed");
  assertNonNegative(launch.height, "height");
  assertFiniteNumber(launch.angleDegrees, "angleDegrees");
  assertPositive(step, "step");
  const k = withDrag ? (AIR_DENSITY * ball.dragCoefficient * crossSection(ball)) / (2 * ball.massKg) : 0;
  const accel = (vx: number, vy: number): [number, number] => {
    const speed = Math.hypot(vx, vy);
    return [-k * speed * vx, -STANDARD_GRAVITY - k * speed * vy];
  };
  const angle = (launch.angleDegrees * Math.PI) / 180;
  let x = 0;
  let y = launch.height;
  let vx = launch.speed * Math.cos(angle);
  let vy = launch.speed * Math.sin(angle);
  let t = 0;
  const points = [{ x, y }];
  for (let i = 0; i < 200_000; i += 1) {
    const [a1x, a1y] = accel(vx, vy);
    const v2x = vx + (step / 2) * a1x;
    const v2y = vy + (step / 2) * a1y;
    const [a2x, a2y] = accel(v2x, v2y);
    const v3x = vx + (step / 2) * a2x;
    const v3y = vy + (step / 2) * a2y;
    const [a3x, a3y] = accel(v3x, v3y);
    const v4x = vx + step * a3x;
    const v4y = vy + step * a3y;
    const [a4x, a4y] = accel(v4x, v4y);
    const nvx = vx + (step / 6) * (a1x + 2 * a2x + 2 * a3x + a4x);
    const nvy = vy + (step / 6) * (a1y + 2 * a2y + 2 * a3y + a4y);
    const nx = x + (step / 6) * (vx + 2 * v2x + 2 * v3x + v4x);
    const ny = y + (step / 6) * (vy + 2 * v2y + 2 * v3y + v4y);
    if (ny <= 0) {
      const fraction = y / (y - ny);
      const range = x + fraction * (nx - x);
      const flightTime = t + fraction * step;
      points.push({ x: range, y: 0 });
      return { points, range, flightTime, landingSpeed: Math.hypot(vx + fraction * (nvx - vx), vy + fraction * (nvy - vy)) };
    }
    x = nx; y = ny; vx = nvx; vy = nvy; t += step;
    if (i % 20 === 0) points.push({ x, y });
  }
  throw new RangeError("The ball did not land within the simulated time.");
}
