import { useId, useState } from "react";

export interface ChoiceOption {
  readonly id: string;
  readonly label: string;
}

interface ChoicePredictionProps {
  readonly prompt: string;
  readonly options: readonly ChoiceOption[];
  /** The locked-in answer, or null while the learner is still choosing. */
  readonly lockedAnswer: string | null;
  readonly onLock: (optionId: string) => void;
  readonly lockLabel?: string;
}

/**
 * Multiple-choice prediction made before a result is revealed. Once locked the
 * choice cannot change, so the later comparison is honest.
 */
export function ChoicePrediction({
  prompt,
  options,
  lockedAnswer,
  onLock,
  lockLabel = "Lock in my prediction",
}: ChoicePredictionProps) {
  const name = useId();
  const [choice, setChoice] = useState<string | null>(lockedAnswer);
  const selected = lockedAnswer ?? choice;
  const locked = lockedAnswer !== null;

  return (
    <form
      className="choice-prediction"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected && !locked) {
          onLock(selected);
        }
      }}
    >
      <fieldset disabled={locked}>
        <legend>{prompt}</legend>
        {options.map((option) => (
          <label className="choice-prediction__option" key={option.id}>
            <input
              checked={selected === option.id}
              name={name}
              onChange={() => setChoice(option.id)}
              type="radio"
              value={option.id}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      {locked ? (
        <p className="choice-prediction__locked" role="status">
          Prediction recorded: {options.find((option) => option.id === lockedAnswer)?.label}
        </p>
      ) : (
        <button className="lab-button lab-button--primary" disabled={!selected} type="submit">
          {lockLabel}
        </button>
      )}
    </form>
  );
}
