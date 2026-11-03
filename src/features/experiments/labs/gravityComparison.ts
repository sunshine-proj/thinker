import { SURFACE_BODIES, findSurfaceBody } from "../../../physics/astronomy";
import { STANDARD_GRAVITY } from "../../../physics/core";
import { calculateExactPendulumPeriod, calculateFallTime, calculateImpactSpeed, calculatePendulumPeriod, calculateSmallAngleSwing } from "../../../physics/mechanics";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition, LabValues } from "./labTypes";

export const GRAVITY_LAB_ID = "gravity-comparison";

const bodyOf = (values: LabValues) => findSurfaceBody(values.body as string);

export const gravityComparison: LabDefinition = {
  id: GRAVITY_LAB_ID,
  name: "Gravity Comparison",
  eyebrow: "EXPERIMENT LAB · MECHANICS",
  introduction: "Drop an object and swing a pendulum on Earth, the Moon, Mars and other worlds. Compare how long things take to fall, how hard they land, and how the pendulum's rhythm changes with gravity.",
  assumptions: "Free fall without air resistance (a real feather would fall slower on Earth, but not on the Moon) from a height much smaller than the body's radius; a point-mass pendulum on a massless, inextensible string. Surface gravity values are rounded NASA figures; Jupiter's is at its cloud tops.",
  controls: [
    { kind: "choice", key: "body", label: "Where are you?", options: SURFACE_BODIES.map((body) => ({ value: body.id, label: `${body.name} (${body.surfaceGravity} m/s²)` })), initial: "earth" },
    { kind: "number", key: "height", label: "Drop height", unit: "m", minimum: 0.5, maximum: 100, step: 0.5, initial: 20 },
    { kind: "number", key: "length", label: "Pendulum length", unit: "m", minimum: 0.1, maximum: 5, step: 0.05, initial: 1 },
    { kind: "number", key: "amplitude", label: "Release angle", unit: "°", minimum: 1, maximum: 60, step: 1, initial: 10 },
  ],
  describe: (values) => `${bodyOf(values).name} · drop ${values.height} m · pendulum ${values.length} m at ${values.amplitude}°`,
  run(values) {
    const body = bodyOf(values);
    const g = body.surfaceGravity;
    const height = values.height as number;
    const length = values.length as number;
    const amplitude = values.amplitude as number;
    const fallTime = calculateFallTime(height, g);
    const earthFall = calculateFallTime(height, STANDARD_GRAVITY);
    const smallPeriod = calculatePendulumPeriod(length, g);
    const exactPeriod = calculateExactPendulumPeriod(length, g, amplitude);
    const earthPeriod = calculatePendulumPeriod(length, STANDARD_GRAVITY);
    const fallSamples = (gravity: number, until: number) =>
      Array.from({ length: 60 }, (_, i) => {
        const t = (until * i) / 59;
        return { x: t, y: Math.max(0, height - 0.5 * gravity * t * t) };
      });
    const longest = Math.max(fallTime, earthFall);
    const swing = (gravity: number) =>
      Array.from({ length: 120 }, (_, i) => {
        const t = (2 * Math.max(smallPeriod, earthPeriod) * i) / 119;
        return { x: t, y: calculateSmallAngleSwing(length, gravity, amplitude, t) };
      });
    return {
      measurements: [
        createMeasurement("g", "Surface gravity", g, "m/s²"),
        createMeasurement("fallTime", "Fall time", fallTime, "s"),
        createMeasurement("impactSpeed", "Impact speed", calculateImpactSpeed(height, g), "m/s"),
        createMeasurement("weight", "Weight of a 1 kg mass", g, "N"),
        createMeasurement("period", "Pendulum period (small swing)", smallPeriod, "s"),
        createMeasurement("exactPeriod", "Pendulum period at your angle", exactPeriod, "s"),
        createMeasurement("fallRatio", "Fall time ÷ Earth's", fallTime / earthFall, ""),
        createMeasurement("periodRatio", "Period ÷ Earth's", smallPeriod / earthPeriod, ""),
      ],
      charts: [
        {
          title: "Height of the falling object",
          description: `Height against time for a drop from ${height} meters on ${body.name} (solid) and on Earth (dashed). It takes ${fallTime.toFixed(2)} seconds here and ${earthFall.toFixed(2)} on Earth.`,
          xLabel: "Time (s)", yLabel: "Height (m)",
          series: [{ label: body.name, points: fallSamples(g, fallTime) }, { label: "Earth", dashed: true, points: fallSamples(STANDARD_GRAVITY, earthFall) }],
          xDomain: [0, longest], yDomain: [0, height * 1.05],
        },
        {
          title: "The pendulum swing",
          description: `Angle of the pendulum against time on ${body.name} and on Earth: the swing is slower where gravity is weaker.`,
          xLabel: "Time (s)", yLabel: "Angle (°)",
          series: [{ label: body.name, points: swing(g) }, { label: "Earth", dashed: true, points: swing(STANDARD_GRAVITY) }],
          yDomain: [-amplitude * 1.1, amplitude * 1.1],
        },
      ],
      explanations: [
        { title: "Fall time depends on gravity, not on mass", text: `Dropping from ${height} m takes t = √(2h/g) = ${fallTime.toFixed(2)} s on ${body.name}, ${(fallTime / earthFall).toFixed(2)} times as long as on Earth (${earthFall.toFixed(2)} s). The mass of the object cancels out: a hammer and a feather fall together without air, as the Apollo 15 astronauts showed on the Moon.` },
        { title: "The impact is harder where gravity is strong", text: `It lands at v = √(2gh) = ${calculateImpactSpeed(height, g).toFixed(1)} m/s. The fall time scales as 1/√g, so ${g < STANDARD_GRAVITY ? "weaker gravity means a longer, gentler fall" : "stronger gravity means a quicker, harder landing"}.` },
        { title: "A pendulum's rhythm follows √(L/g)", text: `A ${length} m pendulum swings once in T = 2π√(L/g) = ${smallPeriod.toFixed(2)} s on ${body.name} (${earthPeriod.toFixed(2)} s on Earth). Its mass does not matter. The pendulum clock is therefore a gravity meter: this one would run ${(smallPeriod / earthPeriod).toFixed(2)} times slower than on Earth.` },
        { title: "Large swings are slightly slower", text: `At ${amplitude}° the exact period is ${exactPeriod.toFixed(3)} s, ${((exactPeriod / smallPeriod - 1) * 100).toFixed(2)} % longer than the small-swing formula, because the restoring force grows less than in proportion to the angle.` },
      ],
    };
  },
};
