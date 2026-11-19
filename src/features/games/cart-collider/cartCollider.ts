import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, PredictionSpec, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateCollisionVelocities, calculateTotalKineticEnergy } from "../../../physics/mechanics";

export type CartKind = "sticky" | "elastic" | "bumper";
export interface CartRound extends NumericRound { readonly kind: CartKind }
export interface CartOutcome extends AttemptOutcome {
  readonly velocityA: number;
  readonly velocityB: number;
  readonly energyLostFraction: number;
}

export const STICKY = { massA: 2, speedA: 3, target: 1.5, tolerance: 0.05 } as const;
export const ELASTIC = { massA: 1, speedA: 3, target: -1, tolerance: 0.05 } as const;
export const BUMPER = { mass: 1, speedA: 3, target: 2.4, tolerance: 0.03 } as const;

export const CART_META: RoundGameMeta = {
  id: "cart-collider",
  title: "Cart Collider",
  eyebrow: "MECHANICS · MOMENTUM",
  modelTag: "CONSERVATION OF MOMENTUM",
  introduction: "Crash carts together on a frictionless air track. Choose a target cart so two carts that stick together move off at the right speed, make a cart bounce back after an elastic collision, and tune a springy bumper to send its partner off at a set speed.",
  instructions: "Predict, then set the mass or the bumper. In every collision the total momentum stays the same; whether kinetic energy also survives depends on how springy the collision is.",
  formula: "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂  ·  v₂ − v₁ = e (u₁ − u₂)",
  formulaCaption: "m are masses (kg), u speeds before and v after (m/s, positive to the right), and e the coefficient of restitution: 1 for a perfectly elastic bounce, 0 when the carts stick together.",
  explanation: "With no outside force along the track, the push each cart gets from the other is equal and opposite, so whatever momentum one loses the other gains: the total is conserved in every collision. Kinetic energy is a different story. Carts that stick lose as much kinetic energy as momentum allows, turned into heat and sound. In a perfectly elastic collision kinetic energy is conserved too, which is why a light cart bounces back off a heavier one and equal carts swap speeds. Real bumpers lie in between, and the coefficient of restitution e measures how much of the approach speed comes back as separation speed.",
  assumptions: "A frictionless, level air track, motion in one dimension, a collision so brief that no outside force acts during it, and a constant coefficient of restitution.",
  learningObjectives: ["Apply conservation of momentum to collisions.", "Distinguish elastic and inelastic collisions by kinetic energy.", "Use the coefficient of restitution."],
  objective: { title: "Engineer the collision", description: "Make every collision come out right.", unit: "collisions" },
  controlsHeading: "Your setup",
  submitLabel: "Crash the carts",
  solvedLabel: "Momentum mastered!",
  nextLabel: "Next collision",
};

export const CART_ROUNDS: readonly CartRound[] = Object.freeze([
  {
    id: "sticky-coupling", title: "Sticky coupling", difficulty: "Beginner", kind: "sticky",
    situation: `A ${STICKY.massA} kg cart at ${STICKY.speedA} m/s hits a cart at rest and they stick together. Choose the mass of the resting cart so the pair moves off at ${STICKY.target} m/s (± ${STICKY.tolerance} m/s).`,
    controls: [fixed("speedA", "Incoming speed", "m/s", STICKY.speedA), slider("massB", "Mass of the resting cart", "kg", 0.2, 6, 0.1, 1)],
    hint: "Momentum before = momentum after: 2 × 3 = (2 + m) × 1.5.",
  },
  {
    id: "bounce-back", title: "Bounce back", difficulty: "Intermediate", kind: "elastic",
    situation: `A ${ELASTIC.massA} kg cart at ${ELASTIC.speedA} m/s hits a resting cart with a perfectly elastic spring bumper. Choose the resting cart's mass so the incoming cart bounces back at 1 m/s (± ${ELASTIC.tolerance} m/s).`,
    controls: [fixed("speedA", "Incoming speed", "m/s", ELASTIC.speedA), slider("massB", "Mass of the resting cart", "kg", 0.2, 6, 0.1, 1)],
    hint: "In an elastic collision with a resting cart, v₁ = (m₁ − m₂)/(m₁ + m₂) × u₁.",
  },
  {
    id: "tune-the-bumper", title: "Tune the bumper", difficulty: "Advanced", kind: "bumper",
    situation: `Two identical ${BUMPER.mass} kg carts. One at ${BUMPER.speedA} m/s hits the other at rest. Choose the bumper's coefficient of restitution so the struck cart leaves at ${BUMPER.target} m/s (± ${BUMPER.tolerance} m/s).`,
    controls: [fixed("speedA", "Incoming speed", "m/s", BUMPER.speedA), slider("restitution", "Coefficient of restitution e", "", 0, 1, 0.01, 0.5)],
    hint: "For equal masses with one at rest, v₂ = (1 + e) u₁ / 2.",
  },
]);

function collide(massA: number, massB: number, speedA: number, restitution: number) {
  const after = calculateCollisionVelocities(massA, speedA, massB, 0, restitution);
  const before = calculateTotalKineticEnergy([{ massKg: massA, speed: speedA }]);
  const kept = calculateTotalKineticEnergy([{ massKg: massA, speed: after.velocityA }, { massKg: massB, speed: after.velocityB }]);
  return { ...after, energyLostFraction: 1 - kept / before };
}

export function runCarts(round: CartRound, v: NumericControl): CartOutcome {
  if (round.kind === "sticky") {
    const massB = v.massB as number;
    const result = collide(STICKY.massA, massB, STICKY.speedA, 0);
    const truth = (STICKY.massA * STICKY.speedA) / STICKY.target - STICKY.massA;
    const error = Math.abs(result.velocityB - STICKY.target);
    const success = error <= STICKY.tolerance;
    return {
      ...result, success, accuracyFraction: success ? 1 - error / STICKY.tolerance : 0, predictionActual: truth,
      feedback: success
        ? `${STICKY.massA * STICKY.speedA} kg·m/s shared by ${(STICKY.massA + massB).toFixed(1)} kg gives ${result.velocityB.toFixed(2)} m/s. ${(result.energyLostFraction * 100).toFixed(0)} % of the kinetic energy became heat and sound.`
        : `With ${massB.toFixed(1)} kg the pair moves at ${result.velocityB.toFixed(2)} m/s, ${result.velocityB > STICKY.target ? "too fast: add mass" : "too slow: use less mass"}.`,
    };
  }
  if (round.kind === "elastic") {
    const massB = v.massB as number;
    const result = collide(ELASTIC.massA, massB, ELASTIC.speedA, 1);
    const truth = (ELASTIC.massA * (ELASTIC.speedA - ELASTIC.target)) / (ELASTIC.speedA + ELASTIC.target);
    const error = Math.abs(result.velocityA - ELASTIC.target);
    const success = error <= ELASTIC.tolerance;
    return {
      ...result, success, accuracyFraction: success ? 1 - error / ELASTIC.tolerance : 0, predictionActual: truth,
      feedback: success
        ? `The ${massB.toFixed(1)} kg cart leaves at ${result.velocityB.toFixed(2)} m/s and the light cart bounces back at ${Math.abs(result.velocityA).toFixed(2)} m/s. Momentum and kinetic energy are both conserved.`
        : result.velocityA >= 0
          ? `The incoming cart keeps moving forward at ${result.velocityA.toFixed(2)} m/s: the resting cart must be heavier than it.`
          : `The incoming cart bounces back at ${Math.abs(result.velocityA).toFixed(2)} m/s, ${Math.abs(result.velocityA) > 1 ? "too fast: use a lighter target" : "too slowly: use a heavier target"}.`,
    };
  }
  const e = v.restitution as number;
  const result = collide(BUMPER.mass, BUMPER.mass, BUMPER.speedA, e);
  const truth = (2 * BUMPER.target) / BUMPER.speedA - 1;
  const error = Math.abs(result.velocityB - BUMPER.target);
  const success = error <= BUMPER.tolerance;
  return {
    ...result, success, accuracyFraction: success ? 1 - error / BUMPER.tolerance : 0, predictionActual: truth,
    feedback: success
      ? `With e = ${e.toFixed(2)} the struck cart leaves at ${result.velocityB.toFixed(2)} m/s and the first follows at ${result.velocityA.toFixed(2)} m/s; ${(result.energyLostFraction * 100).toFixed(0)} % of the kinetic energy is lost in the bumper.`
      : `With e = ${e.toFixed(2)} the struck cart leaves at ${result.velocityB.toFixed(2)} m/s, ${result.velocityB > BUMPER.target ? "too fast" : "too slow"}.`,
  };
}

export const cartCollider = defineNumericGame<CartRound, CartOutcome>({
  meta: CART_META,
  rounds: CART_ROUNDS,
  prediction: (round): PredictionSpec =>
    round.kind === "bumper" ? { label: "Your prediction of the coefficient of restitution", unit: "", placeholder: "e.g. 0.5", step: 0.01 }
    : { label: "Your prediction of the resting cart's mass", unit: "kg", placeholder: "e.g. 1.5", step: 0.1 },
  evaluate: (round, values) => runCarts(round, values),
});
