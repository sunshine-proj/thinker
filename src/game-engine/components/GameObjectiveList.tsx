import type { GameObjective } from "../objectives/GameObjective";

interface GameObjectiveListProps {
  readonly objectives: readonly GameObjective[];
}

export function GameObjectiveList({ objectives }: GameObjectiveListProps) {
  return (
    <section aria-label="Game objectives" className="game-objectives">
      <h2>Objectives</h2>
      <ul>
        {objectives.map((objective) => {
          const progress = Math.min(objective.progress, objective.target);

          return (
            <li className="game-objectives__item" key={objective.id}>
              <div className="game-objectives__copy">
                <strong>{objective.title}</strong>
                <span>{objective.description}</span>
              </div>
              <div className="game-objectives__progress">
                <progress
                  aria-label={objective.title}
                  max={objective.target}
                  value={progress}
                />
                <span>
                  {progress} / {objective.target}
                  {objective.unit ? ` ${objective.unit}` : ""}
                  {objective.completed ? " · Complete" : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
