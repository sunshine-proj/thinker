import type { GameStatus } from "../core/GameLifecycle";

interface GameLifecycleControlsProps {
  readonly status: GameStatus;
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onReset: () => void;
  readonly resetLabel?: string;
}

export function GameLifecycleControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  resetLabel = "Restart game",
}: GameLifecycleControlsProps) {
  return (
    <div aria-label="Game controls" className="game-lifecycle-controls">
      {status === "ready" && (
        <button
          className="lab-button lab-button--primary"
          onClick={onStart}
          type="button"
        >
          Start game
        </button>
      )}
      {status === "playing" && (
        <>
          <button
            className="lab-button lab-button--secondary"
            onClick={onPause}
            type="button"
          >
            Pause game
          </button>
          <button
            className="game-lifecycle-controls__reset"
            onClick={onReset}
            type="button"
          >
            Restart
          </button>
        </>
      )}
      {status === "paused" && (
        <>
          <button
            className="lab-button lab-button--primary"
            onClick={onResume}
            type="button"
          >
            Resume game
          </button>
          <button
            className="game-lifecycle-controls__reset"
            onClick={onReset}
            type="button"
          >
            Restart
          </button>
        </>
      )}
      {status === "completed" && (
        <button
          className="lab-button lab-button--secondary"
          onClick={onReset}
          type="button"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}
