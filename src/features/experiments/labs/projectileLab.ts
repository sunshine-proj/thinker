import { calculateProjectileTrajectory } from "../../games/projectile-master/projectileMasterModel";
import { STANDARD_GRAVITY } from "../../../physics/core";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition } from "./labTypes";

export const PROJECTILE_LAB_ID = "projectile-motion-lab";

export const projectileLab: LabDefinition = {
  id: PROJECTILE_LAB_ID,
  name: "Projectile Motion",
  eyebrow: "EXPERIMENT LAB · MECHANICS",
  introduction: "Launch a projectile with any speed, angle, gravity and launch height. See its path, range and landing, and compare it with the same launch on Earth.",
  assumptions: "The same ideal model as Projectile Master: uniform gravity, no air resistance and no wind, a flat landing surface at height zero, and a point projectile. Real objects, especially light or fast ones, are slowed noticeably by drag, so ranges are overestimates.",
  controls: [
    { kind: "number", key: "speed", label: "Launch speed", unit: "m/s", minimum: 1, maximum: 100, step: 1, initial: 20 },
    { kind: "number", key: "angle", label: "Launch angle", unit: "°", minimum: 0, maximum: 90, step: 1, initial: 45 },
    { kind: "number", key: "gravity", label: "Gravity", unit: "m/s²", minimum: 0.5, maximum: 25, step: 0.01, initial: 9.81 },
    { kind: "number", key: "height", label: "Launch height", unit: "m", minimum: 0, maximum: 100, step: 1, initial: 0 },
  ],
  describe: (values) => `${values.speed} m/s at ${values.angle}° · g ${values.gravity} m/s² · from ${values.height} m`,
  run(values) {
    const speed = values.speed as number;
    const angle = values.angle as number;
    const gravity = values.gravity as number;
    const height = values.height as number;
    const parameters = { speedMetersPerSecond: speed, angleDegrees: angle, gravityMetersPerSecondSquared: gravity, launchHeightMeters: height };
    const flight = calculateProjectileTrajectory(parameters);
    const earth = calculateProjectileTrajectory({ ...parameters, gravityMetersPerSecondSquared: STANDARD_GRAVITY });
    const vx = flight.initialVelocityMetersPerSecond.x;
    const vyLanding = -Math.sqrt(flight.initialVelocityMetersPerSecond.y ** 2 + 2 * gravity * height);
    const impactSpeed = Math.hypot(vx, vyLanding);
    const impactAngle = (Math.atan2(-vyLanding, vx) * 180) / Math.PI;
    const extent = Math.max(flight.horizontalRangeMeters, earth.horizontalRangeMeters);
    const top = Math.max(flight.maximumHeightMeters, earth.maximumHeightMeters);
    return {
      measurements: [
        createMeasurement("range", "Range", flight.horizontalRangeMeters, "m"),
        createMeasurement("time", "Flight time", flight.flightTimeSeconds, "s"),
        createMeasurement("peak", "Maximum height", flight.maximumHeightMeters, "m"),
        createMeasurement("impactSpeed", "Impact speed", impactSpeed, "m/s"),
        createMeasurement("impactAngle", "Impact angle below horizontal", impactAngle, "°"),
        createMeasurement("earthRange", "Range on Earth (same launch)", earth.horizontalRangeMeters, "m"),
      ],
      charts: [{
        title: "Path of the projectile",
        description: `Height against distance. With g = ${gravity} the projectile travels ${flight.horizontalRangeMeters.toFixed(1)} meters and peaks at ${flight.maximumHeightMeters.toFixed(1)} meters; the dashed path is the same launch on Earth.`,
        xLabel: "Distance (m)", yLabel: "Height (m)",
        series: [{ label: "Your gravity", points: flight.points.map((p) => ({ x: p.x, y: p.y })) }, { label: "Earth gravity", dashed: true, points: earth.points.map((p) => ({ x: p.x, y: p.y })) }],
        xDomain: [0, extent * 1.02], yDomain: [0, top * 1.1 || 1],
      }],
      explanations: [
        { title: "Two independent motions", text: `Sideways the projectile keeps ${vx.toFixed(1)} m/s, since nothing pushes it horizontally. Vertically it starts with ${flight.initialVelocityMetersPerSecond.y.toFixed(1)} m/s and gravity changes that by ${gravity} m/s every second. The two combine to make a parabola.` },
        { title: "Range and the 45° rule", text: height === 0 ? `Launched from the ground the range v² sin2θ / g is greatest at 45°. Your ${angle}° ${Math.abs(angle - 45) < 1 ? "is the best angle" : `gives ${((flight.horizontalRangeMeters / ((speed * speed) / gravity)) * 100).toFixed(0)} % of the best possible range`}. Angles that add up to 90° (such as 30° and 60°) land at the same point.` : `Launched from ${height} m the best angle is below 45°, because the projectile has extra time to fall. Try raising the launch height and searching for the angle with the longest range.` },
        { title: "Gravity sets the scale", text: `The range scales as 1/g: with ${gravity} m/s² the projectile travels ${(flight.horizontalRangeMeters / earth.horizontalRangeMeters).toFixed(2)} times its range on Earth, and is in the air ${(flight.flightTimeSeconds / earth.flightTimeSeconds).toFixed(2)} times as long. This is why a golf ball flies six times as far on the Moon (without air).` },
        { title: "It lands faster than it was launched when it starts high", text: `It hits the ground at ${impactSpeed.toFixed(1)} m/s, ${impactAngle.toFixed(0)}° below horizontal. By energy conservation v² = v₀² + 2gh, so from a height of ${height} m the impact speed is ${impactSpeed > speed + 1e-6 ? "greater" : "equal to"} the launch speed of ${speed} m/s.` },
      ],
    };
  },
};
