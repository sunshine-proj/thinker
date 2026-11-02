import { useEffect } from "react";
import { Link } from "react-router-dom";
import { findCatalogEntry } from "../../data/games/gameCatalog";
import { useProgressStore } from "../../store/progressStore";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProfilePage() {
  const status = useProgressStore((state) => state.status);
  const progress = useProgressStore((state) => state.progress);
  const persistenceError = useProgressStore((state) => state.persistenceError);
  const hydrate = useProgressStore((state) => state.hydrate);
  const clearProgress = useProgressStore((state) => state.clearProgress);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <div className="profile-page">
      <header className="worlds-page__header">
        <p className="eyebrow">Your learning space</p>
        <h1>Your Profile</h1>
        <p>
          Your progress is stored on this device, so it is available offline.
        </p>
      </header>

      {persistenceError && (
        <p className="lab-error" role="alert">
          {persistenceError} Progress from this session is still shown.
        </p>
      )}

      {status !== "ready" ? (
        <p role="status">Loading your progress…</p>
      ) : progress.completedGames.length === 0 ? (
        <section className="world-section">
          <h2>No games completed yet</h2>
          <p className="world-section__description">
            Finish a game and your best score will appear here.
          </p>
          <Link className="text-link" to="/worlds">
            Browse Physics Worlds
          </Link>
        </section>
      ) : (
        <section aria-labelledby="progress-title" className="world-section">
          <h2 id="progress-title">Completed games</h2>
          <p className="world-section__description">
            Total best score: {progress.totalBestScore}
            {progress.lastActivity &&
              ` · Last activity ${formatDate(progress.lastActivity)}`}
          </p>
          <ul className="world-section__list">
            {progress.completedGames.map((gameId) => {
              const entry = findCatalogEntry(gameId);
              return (
                <li key={gameId}>
                  <div className="world-card">
                    <span className="world-card__meta">BEST SCORE</span>
                    <strong>{entry?.title ?? gameId}</strong>
                    <span>{progress.bestScores[gameId] ?? 0} points</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {status === "ready" && progress.completedGames.length > 0 && (
        <button
          className="game-hint-toggle"
          onClick={() => void clearProgress()}
          type="button"
        >
          Clear saved progress
        </button>
      )}
    </div>
  );
}
