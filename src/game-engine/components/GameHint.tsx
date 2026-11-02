interface GameHintProps {
  readonly hint: string;
  readonly visible: boolean;
  readonly disabled?: boolean;
  readonly onToggle: () => void;
}

/** Hints stay hidden until requested so learners try the problem first. */
export function GameHint({
  hint,
  visible,
  disabled = false,
  onToggle,
}: GameHintProps) {
  return (
    <>
      <button
        aria-expanded={visible}
        className="game-hint-toggle"
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        {visible ? "Hide hint" : "Need a hint?"}
      </button>
      {visible && <p className="game-hint">{hint}</p>}
    </>
  );
}
