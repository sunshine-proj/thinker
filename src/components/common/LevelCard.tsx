import type { LevelStatus } from "../../game-engine/progression/levels";

/** Current player level with progress toward the next one. */
export function LevelCard({ status }: { readonly status: LevelStatus }) {
  const percent = Math.round(status.progressToNext * 100);

  return (
    <section aria-label="Player level" className="level-card">
      <span className="world-card__meta">LEVEL {status.levelNumber}</span>
      <strong>{status.level.title}</strong>
      <span>{status.points} learning points</span>
      {status.nextLevel ? (
        <>
          <progress
            aria-label={`Progress to ${status.nextLevel.title}`}
            max={100}
            value={percent}
          />
          <span>
            {status.nextLevel.minimumPoints - status.points} points to{" "}
            {status.nextLevel.title}
          </span>
        </>
      ) : (
        <span>Highest level reached.</span>
      )}
    </section>
  );
}
