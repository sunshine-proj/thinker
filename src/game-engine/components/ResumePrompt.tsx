interface ResumePromptProps {
  readonly onResume: () => void;
  readonly onDiscard: () => void;
}

/** Offered when an unfinished game was saved on this device. */
export function ResumePrompt({ onResume, onDiscard }: ResumePromptProps) {
  return (
    <section aria-label="Saved game" className="resume-prompt" role="status">
      <div>
        <strong>Pick up where you left off?</strong>
        <span>An unfinished game was saved on this device.</span>
      </div>
      <div className="resume-prompt__actions">
        <button
          className="lab-button lab-button--primary"
          onClick={onResume}
          type="button"
        >
          Resume saved game
        </button>
        <button
          className="game-lifecycle-controls__reset"
          onClick={onDiscard}
          type="button"
        >
          Start fresh
        </button>
      </div>
    </section>
  );
}
