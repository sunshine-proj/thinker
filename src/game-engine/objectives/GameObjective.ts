export interface GameObjectiveDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly target: number;
  readonly unit?: string;
}

export interface GameObjective extends GameObjectiveDefinition {
  readonly progress: number;
  readonly completed: boolean;
}

export function createGameObjective(
  definition: GameObjectiveDefinition,
): GameObjective {
  if (!definition.id.trim()) {
    throw new RangeError("Objective id must not be empty.");
  }
  if (!definition.title.trim()) {
    throw new RangeError("Objective title must not be empty.");
  }
  if (!definition.description.trim()) {
    throw new RangeError("Objective description must not be empty.");
  }
  if (!Number.isFinite(definition.target) || definition.target <= 0) {
    throw new RangeError("Objective target must be a positive finite number.");
  }

  return { ...definition, progress: 0, completed: false };
}

export function updateGameObjective(
  objective: GameObjective,
  progress: number,
): GameObjective {
  if (!Number.isFinite(progress) || progress < 0) {
    throw new RangeError("Objective progress must be a non-negative number.");
  }

  return {
    ...objective,
    progress,
    completed: progress >= objective.target,
  };
}
