import { STANDARD_GRAVITY, assertNonNegative, assertPositive } from "../core";

/**
 * The driven, damped harmonic oscillator.
 *
 * x'' + 2ζω₀ x' + ω₀² x = (F₀/m) cos ωt. In steady state the amplitude is
 * A = (F₀/m) / √((ω₀² − ω²)² + (2ζω₀ω)²); relative to the static deflection F₀/(mω₀²)
 * the amplification is 1/√((1 − r²)² + (2ζr)²) with r = ω/ω₀, peaking at
 * 1/(2ζ√(1 − ζ²)) when r = √(1 − 2ζ²). A pendulum (swing) of length L has
 * ω₀ = √(g/L) for small swings.
 *
 * Inputs SI (Hz, s, m). Assumptions: linear restoring force, viscous damping, sinusoidal
 * driving. Real pushes on a swing are short kicks, but they resonate at the same frequency.
 */

/** Natural frequency (Hz) of a pendulum of length L for small swings. */
export function calculatePendulumFrequency(lengthMeters: number, gravity = STANDARD_GRAVITY): number {
  assertPositive(lengthMeters, "lengthMeters");
  return Math.sqrt(gravity / lengthMeters) / (2 * Math.PI);
}

/** Steady-state amplification A / A_static at driving frequency f for natural frequency f₀ and damping ratio ζ. */
export function calculateAmplification(drivingHz: number, naturalHz: number, dampingRatio: number): number {
  assertNonNegative(drivingHz, "drivingHz");
  assertPositive(naturalHz, "naturalHz");
  assertPositive(dampingRatio, "dampingRatio");
  const r = drivingHz / naturalHz;
  return 1 / Math.sqrt((1 - r * r) ** 2 + (2 * dampingRatio * r) ** 2);
}

/** Largest possible amplification for a damping ratio below 1/√2. */
export function calculatePeakAmplification(dampingRatio: number): number {
  assertPositive(dampingRatio, "dampingRatio");
  if (dampingRatio >= Math.SQRT1_2) {
    return 1;
  }
  return 1 / (2 * dampingRatio * Math.sqrt(1 - dampingRatio ** 2));
}

/** Driving frequency (Hz) of the amplitude peak, f₀ √(1 − 2ζ²). */
export function calculateResonantFrequency(naturalHz: number, dampingRatio: number): number {
  assertPositive(naturalHz, "naturalHz");
  assertPositive(dampingRatio, "dampingRatio");
  return naturalHz * Math.sqrt(Math.max(0, 1 - 2 * dampingRatio ** 2));
}

/**
 * Integrates the driven oscillator (unit F₀/m) with RK4 and returns the largest
 * displacement over the last driving periods, as a numerical check of the formula.
 */
export function simulateDrivenAmplitude(drivingHz: number, naturalHz: number, dampingRatio: number, periods = 400): number {
  const w0 = 2 * Math.PI * naturalHz;
  const w = 2 * Math.PI * drivingHz;
  const dt = Math.min(1 / drivingHz, 1 / naturalHz) / 200;
  const end = periods / drivingHz;
  const deriv = (t: number, x: number, v: number) => [v, Math.cos(w * t) - 2 * dampingRatio * w0 * v - w0 * w0 * x] as const;
  let x = 0;
  let v = 0;
  let peak = 0;
  for (let t = 0; t < end; t += dt) {
    const [k1x, k1v] = deriv(t, x, v);
    const [k2x, k2v] = deriv(t + dt / 2, x + (dt / 2) * k1x, v + (dt / 2) * k1v);
    const [k3x, k3v] = deriv(t + dt / 2, x + (dt / 2) * k2x, v + (dt / 2) * k2v);
    const [k4x, k4v] = deriv(t + dt, x + dt * k3x, v + dt * k3v);
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    if (t > end * 0.8) {
      peak = Math.max(peak, Math.abs(x));
    }
  }
  // Express relative to the static deflection 1/ω₀².
  return peak * w0 * w0;
}
