import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";

export interface LanderSpec {
  readonly dryMassKilograms: number;
  readonly maximumThrustNewtons: number;
  readonly specificImpulseSeconds: number;
}

export interface LandingRound extends RoundBase {
  readonly initialAltitudeMeters: number;
  /** Downward speed at the start, m/s. */
  readonly initialDownwardSpeed: number;
  /** Propellant in the tank, kg. */
  readonly fuelKilograms: number;
  readonly ignition: { readonly minimum: number; readonly maximum: number; readonly step: number };
  /** Throttle range as fractions of maximum thrust; fixed when minimum equals maximum. */
  readonly throttle: { readonly minimum: number; readonly maximum: number; readonly step: number };
}

export interface LandingControl {
  readonly ignitionAltitudeMeters: number;
  readonly throttle: number;
}

export const LANDER: LanderSpec = Object.freeze({
  dryMassKilograms: 1500,
  maximumThrustNewtons: 9000,
  specificImpulseSeconds: 311,
});

/** Landing legs absorb up to this impact speed. */
export const SAFE_TOUCHDOWN_SPEED = 5;

export const MOON_LANDING_META: RoundGameMeta = {
  id: "moon-landing",
  title: "Moon Landing",
  eyebrow: "ASTRONOMY & ASTROPHYSICS · SPACE MISSION",
  modelTag: "POWERED DESCENT · ROCKET EQUATION",
  introduction:
    "Land a spacecraft on the Moon. It falls freely until you light the engine, so you must choose when to ignite, and how hard to burn, to stop just as you touch the surface.",
  instructions:
    "Predict how much propellant the landing will use, set the ignition altitude (and throttle where allowed), then fire the descent. The engine cuts off when the lander stops moving down. Touch down at no more than 5 m/s.",
  formula: "a = T/m − g  ·  v² = v₀² + 2 a d  ·  ṁ = T / (Iₛₚ g₀)",
  formulaCaption:
    "T is thrust, m the lander's mass, g = 1.62 m/s² lunar gravity, d the distance covered, Iₛₚ = 311 s the engine's specific impulse and g₀ = 9.81 m/s². The lander gets lighter as propellant burns.",
  explanation:
    "On the Moon there is no air to slow the fall, so only the engine can. Falling freely, the lander gains speed at g = 1.62 m/s². The engine's thrust T pushes upward with acceleration T/m, so the net deceleration is T/m − g. To stop in the remaining distance d you need v² = 2 a d, which fixes when to ignite: too late and you hit hard, too early and you stop above the ground and fall again. Burning at full thrust late (a suicide burn) wastes the least propellant, because a long gentle burn spends more time fighting gravity. Propellant use follows the rocket equation: the engine burns T/(Iₛₚ g₀) kilograms every second.",
  assumptions:
    "The descent is vertical, with constant lunar gravity and a flat surface; there is no horizontal motion, steering or fuel slosh. The engine starts and stops instantly, with constant specific impulse. A guidance rule cuts the engine when the lander has stopped moving down, so it never climbs under power. The simulation uses fourth-order Runge–Kutta integration with a 5 ms step.",
  learningObjectives: [
    "Combine thrust and gravity into a net deceleration, a = T/m − g, and use v² = v₀² + 2 a d.",
    "Explain why timing the burn matters and why a late, strong burn saves propellant.",
    "Relate propellant use to thrust, burn time and specific impulse.",
  ],
  objective: {
    title: "Land safely",
    description: "Touch down gently on each mission.",
    unit: "landings",
  },
  controlsHeading: "Plan the burn",
  submitLabel: "Fire the descent engine",
  solvedLabel: "The Eagle has landed!",
  nextLabel: "Next mission",
};

export const LANDING_ROUNDS: readonly LandingRound[] = Object.freeze([
  {
    id: "first-landing",
    title: "First landing",
    difficulty: "Beginner",
    situation:
      "The lander is 2,000 m above the surface, falling at 40 m/s. The engine runs at full thrust (9,000 N, lander mass about 2,000 kg). Choose the altitude at which to ignite it.",
    initialAltitudeMeters: 2000,
    initialDownwardSpeed: 40,
    fuelKilograms: 500,
    ignition: { minimum: 100, maximum: 1900, step: 1 },
    throttle: { minimum: 1, maximum: 1, step: 0.01 },
    hint: "Free fall to the ignition altitude gives v² = v₀² + 2 g Δh. The engine then decelerates at about T/m − g ≈ 2.9 m/s², stopping in d = v²/(2a). Choose the altitude where the two agree.",
  },
  {
    id: "limited-fuel",
    title: "Limited fuel",
    difficulty: "Intermediate",
    situation:
      "From 2,500 m at 50 m/s downward, with only 66 kg of propellant. A gentle burn takes longer and wastes propellant fighting gravity. Choose the throttle and the ignition altitude.",
    initialAltitudeMeters: 2500,
    initialDownwardSpeed: 50,
    fuelKilograms: 66,
    ignition: { minimum: 100, maximum: 2400, step: 1 },
    throttle: { minimum: 0.5, maximum: 1, step: 0.01 },
    hint: "Fuel use is ṁ·t, and the burn lasts about v/a. A higher throttle makes a larger a, so a shorter burn and less fuel. Pick a high throttle, then find the ignition altitude for it.",
  },
  {
    id: "fast-arrival",
    title: "Fast arrival",
    difficulty: "Advanced",
    situation:
      "A faster approach: 4,000 m up and falling at 80 m/s, with just 85 kg of propellant. Only a nearly full-power burn, started at exactly the right height, will work.",
    initialAltitudeMeters: 4000,
    initialDownwardSpeed: 80,
    fuelKilograms: 85,
    ignition: { minimum: 500, maximum: 3900, step: 1 },
    throttle: { minimum: 0.6, maximum: 1, step: 0.01 },
    hint: "The speed at ignition is larger now, so the stopping distance is longer: use v² = v₀² + 2 g Δh for the speed at ignition, then d = v²/(2(T/m − g)). Check the fuel with ṁ = T/(Iₛₚ g₀) times the burn time.",
  },
]);
