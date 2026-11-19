export interface HintStep {
  readonly title: string;
  readonly text: string;
}

interface HintLadderProps {
  readonly steps: readonly HintStep[];
  /** How many steps are revealed (0 = none). */
  readonly level: number;
  readonly disabled?: boolean;
  readonly onReveal: () => void;
}

const LABELS = ["Need a nudge?", "Show the formula", "Show a worked step"];

/**
 * Three hints that get more specific: a nudge, the relation to use, then a worked step.
 * Each extra hint lowers the stars for the round but never stops the learner finishing.
 */
export function HintLadder({ steps, level, disabled = false, onReveal }: HintLadderProps) {
  const shown = steps.slice(0, level);
  return (
    <div className="hint-ladder">
      {shown.map((step, index) => (
        <p className="game-hint" key={step.title}>
          <strong>
            Hint {index + 1} · {step.title}:
          </strong>{" "}
          {step.text}
        </p>
      ))}
      {level < steps.length && (
        <button className="game-hint-toggle" disabled={disabled} onClick={onReveal} type="button">
          {LABELS[level] ?? "Next hint"}
          {level > 0 ? " (fewer stars)" : ""}
        </button>
      )}
    </div>
  );
}
