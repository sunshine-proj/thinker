export interface ProjectileMasterRound {
  readonly id: string;
  readonly title: string;
  readonly targetDistanceMeters: number;
  readonly targetRadiusMeters: number;
  readonly hint: string;
}

export const PROJECTILE_MASTER_GAME = Object.freeze({
  id: "projectile-master",
  title: "Projectile Master",
  category: "Mechanics",
  difficulty: "Beginner" as const,
  introduction:
    "Predict how far a launched projectile will travel, then tune its speed and angle to hit each target.",
  learningObjectives: [
    "Relate launch speed and angle to horizontal range.",
    "Use the vertical motion under gravity to predict flight time.",
    "Compare a prediction with a measured result and refine a launch.",
  ],
  instructions:
    "Enter your predicted range before each launch. Adjust the controls, fire, and land inside the target to move on. Your best score for each target contributes to your total.",
  formula: "R = (v² sin(2θ)) / g",
  explanation:
    "With a launch and landing at the same height and no air resistance, the flight time is 2v sin(θ) / g. Multiplying it by the horizontal speed v cos(θ) gives the range formula. At a fixed speed, a 45° launch maximizes range in this ideal model.",
  assumptions:
    "This game uses ideal two-dimensional projectile motion: constant Earth gravity, level launch and landing, and no air resistance or wind.",
});

export const PROJECTILE_MASTER_ROUNDS: readonly ProjectileMasterRound[] =
  Object.freeze([
    {
      id: "near-target",
      title: "Find your range",
      targetDistanceMeters: 25,
      targetRadiusMeters: 1.5,
      hint: "A steeper angle gives the projectile more time in the air, but less horizontal speed.",
    },
    {
      id: "middle-target",
      title: "Adjust your aim",
      targetDistanceMeters: 35,
      targetRadiusMeters: 1.5,
      hint: "For equal launch and landing heights, complementary angles have the same ideal range.",
    },
    {
      id: "far-target",
      title: "Reach the horizon",
      targetDistanceMeters: 45,
      targetRadiusMeters: 1.5,
      hint: "At a fixed speed, the ideal range is greatest at 45°.",
    },
  ]);
