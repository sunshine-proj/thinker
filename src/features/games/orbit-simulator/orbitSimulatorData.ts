import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";

export type OrbitGoal =
  | { readonly kind: "circular"; readonly maximumEccentricity: number }
  | { readonly kind: "apoapsis"; readonly targetAltitudeKm: number; readonly toleranceKm: number }
  | {
      readonly kind: "period";
      readonly targetMinutes: number;
      readonly toleranceFraction: number;
      readonly maximumEccentricity: number;
    };

export interface OrbitRound extends RoundBase {
  /** Altitude above Earth's surface where the satellite is released, moving horizontally. */
  readonly altitudeKm: { readonly fixed: number | null; readonly minimum: number; readonly maximum: number; readonly step: number };
  readonly speedKmPerSecond: { readonly minimum: number; readonly maximum: number; readonly step: number };
  readonly goal: OrbitGoal;
}

export interface OrbitControl {
  readonly altitudeKm: number;
  readonly speedKmPerSecond: number;
}

/** Orbits that dip below this altitude meet the atmosphere and decay quickly. */
export const ATMOSPHERE_ALTITUDE_KM = 100;

export const ORBIT_SIMULATOR_META: RoundGameMeta = {
  id: "orbit-simulator",
  title: "Orbit Simulator",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · ORBITS",
  modelTag: "TWO-BODY GRAVITY · VELOCITY VERLET",
  introduction:
    "Launch a satellite sideways from above the Earth and choose its speed. Gravity alone decides whether it circles, swings out on an ellipse, crashes, or escapes.",
  instructions:
    "Predict the orbital period, then set the launch speed (and altitude where allowed). The orbit is drawn live from a numerical simulation. Lock in your launch when it meets the mission goal.",
  formula: "v = √(μ/r)  ·  T = 2π √(a³/μ)  ·  v² = μ (2/r − 1/a)",
  formulaCaption:
    "μ = GM = 3.986 × 10¹⁴ m³/s² for Earth, r the distance from Earth's center, a the semi-major axis, v the speed and T the period. Launching horizontally puts the launch point at the orbit's closest or farthest point.",
  explanation:
    "A satellite is always falling toward the Earth; it stays up because it also moves sideways fast enough to keep missing it. At exactly v = √(μ/r) the path is a circle. Faster, and it climbs to a higher point on the far side (an ellipse); slower, and its far side dips lower, even into the atmosphere. Beyond the escape speed √2 times larger, gravity can no longer bring it back. Kepler's third law links the size of the orbit to its period: a bigger orbit takes longer, in proportion to a^(3/2).",
  assumptions:
    "Earth is a point mass, so there is no oblateness, atmosphere or drag beyond a simple rule that orbits dipping below 100 km count as re-entering. There is no Moon or Sun, and no engine thrust after launch. The path is integrated numerically with velocity Verlet and a step that shrinks near the planet; scoring uses the exact orbital elements.",
  learningObjectives: [
    "Relate launch speed to the shape of the orbit using v = √(μ/r) and vis-viva.",
    "Use Kepler's third law to find the period from the size of the orbit.",
    "Recognise circular, elliptical, re-entry and escape trajectories.",
  ],
  objective: {
    title: "Complete every mission",
    description: "Place the satellite in each required orbit.",
    unit: "missions",
  },
  controlsHeading: "Plan the launch",
  submitLabel: "Lock in this launch",
  solvedLabel: "Mission accomplished!",
  nextLabel: "Next mission",
};

export const ORBIT_ROUNDS: readonly OrbitRound[] = Object.freeze([
  {
    id: "low-earth-orbit",
    title: "Low Earth orbit",
    difficulty: "Beginner",
    situation:
      "Release the satellite 500 km above the Earth, moving sideways. Choose the speed that puts it in a circular orbit.",
    altitudeKm: { fixed: 500, minimum: 500, maximum: 500, step: 1 },
    speedKmPerSecond: { minimum: 6, maximum: 9, step: 0.01 },
    goal: { kind: "circular", maximumEccentricity: 0.02 },
    hint: "Circular orbit speed is v = √(μ/r), where r is the distance from Earth's center: Earth's radius (6371 km) plus the altitude.",
  },
  {
    id: "transfer-ellipse",
    title: "Reach out to 5,000 km",
    difficulty: "Intermediate",
    situation:
      "Release the satellite 400 km up, moving sideways, so that its orbit swings out to a highest point 5,000 km above the Earth (± 250 km).",
    altitudeKm: { fixed: 400, minimum: 400, maximum: 400, step: 1 },
    speedKmPerSecond: { minimum: 7, maximum: 10, step: 0.01 },
    goal: { kind: "apoapsis", targetAltitudeKm: 5000, toleranceKm: 250 },
    hint: "The launch point is the closest point of the ellipse. Its far point is at r = 6371 + 5000 km, so the semi-major axis is the average of the two radii. Then apply vis-viva: v² = μ (2/r − 1/a).",
  },
  {
    id: "three-hour-orbit",
    title: "A three-hour orbit",
    difficulty: "Advanced",
    situation:
      "Put the satellite in a circular orbit with a period of exactly 3 hours (± 1.5%). Both the altitude and the speed are yours to choose.",
    altitudeKm: { fixed: null, minimum: 300, maximum: 8000, step: 10 },
    speedKmPerSecond: { minimum: 5, maximum: 9, step: 0.01 },
    goal: { kind: "period", targetMinutes: 180, toleranceFraction: 0.015, maximumEccentricity: 0.03 },
    hint: "Kepler's third law gives the orbit size: a = (μ T² / 4π²)^(1/3) with T = 10,800 s. A circular orbit has r = a, so the altitude is a − 6371 km, and the speed is √(μ/a).",
  },
]);
