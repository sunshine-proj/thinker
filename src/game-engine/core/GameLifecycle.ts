export type GameStatus = "ready" | "playing" | "paused" | "completed";

export interface GameLifecycle {
  readonly status: GameStatus;
}

export type GameLifecycleAction =
  | "start"
  | "pause"
  | "resume"
  | "complete"
  | "reset";

const VALID_TRANSITIONS: Readonly<
  Record<GameLifecycleAction, readonly GameStatus[]>
> = {
  start: ["ready"],
  pause: ["playing"],
  resume: ["paused"],
  complete: ["playing"],
  reset: ["ready", "playing", "paused", "completed"],
};

const NEXT_STATUS: Readonly<Record<GameLifecycleAction, GameStatus>> = {
  start: "playing",
  pause: "paused",
  resume: "playing",
  complete: "completed",
  reset: "ready",
};

export function createGameLifecycle(): GameLifecycle {
  return { status: "ready" };
}

export function transitionGameLifecycle(
  lifecycle: GameLifecycle,
  action: GameLifecycleAction,
): GameLifecycle {
  if (!VALID_TRANSITIONS[action].includes(lifecycle.status)) {
    throw new Error(
      `Cannot ${action} a game while it is ${lifecycle.status}.`,
    );
  }

  return { status: NEXT_STATUS[action] };
}
