import type { GameStatus } from "../core/GameLifecycle";

export interface GameProgressItem {
  readonly label: string;
  readonly value: number;
  /** When set, rendered as "value / total". */
  readonly total?: number;
}

interface GameProgressBarProps {
  readonly items: readonly GameProgressItem[];
  readonly status: GameStatus;
}

/** Round, objective and attempt counters with the lifecycle status badge. */
export function GameProgressBar({ items, status }: GameProgressBarProps) {
  return (
    <section aria-label="Game progress" className="game-progress">
      {items.map((item) => (
        <div className="game-progress__item" key={item.label}>
          <span>{item.label}</span>
          <strong>
            {item.value}
            {item.total !== undefined && <span> / {item.total}</span>}
          </strong>
        </div>
      ))}
      <span aria-live="polite" className={`game-status game-status--${status}`}>
        <span aria-hidden="true" />
        {status[0]?.toUpperCase()}
        {status.slice(1)}
      </span>
    </section>
  );
}
