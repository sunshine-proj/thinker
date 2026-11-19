import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LevelCard } from "../../components/common";
import { useProgressLevel } from "./useProgressLevel";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../data/games/gameCatalog";
import { findLiveTitle } from "../../data/games/liveGames";
import { summarizeWorldProgress } from "../../game-engine/progression/progress";
import { StarRating } from "../../game-engine/components/StarRating";
import { bestStarsByGame } from "../../game-engine/scoring/stars";
import { useLearnerPreferences } from "../../services/preferences";
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
  const experimentCount = useProgressStore((state) => state.experiments.length);
  const achievementCount = useProgressStore((state) => state.achievements.length);
  const level = useProgressLevel();
  const results = useProgressStore((state) => state.results);
  const [preferences, setPreferences] = useLearnerPreferences();
  const stars = bestStarsByGame(results);
  const maxStars = Object.fromEntries(results.filter((result) => result.maxStars).map((result) => [result.gameId, result.maxStars as number]));

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

      {status === "ready" && (
        <>
          <LevelCard status={level} />
          <p className="world-section__description">
            {achievementCount} achievements ·{" "}
            <Link className="text-link" to="/achievements">
              view all
            </Link>{" "}
            · {experimentCount} saved experiments
          </p>
        </>
      )}

      <section aria-labelledby="preferences-title" className="world-section">
        <h2 id="preferences-title">How the app talks to you</h2>
        <div className="profile-preference">
          <input
            aria-describedby="younger-learner-help"
            checked={preferences.youngerLearner}
            id="younger-learner"
            onChange={(event) => setPreferences({ youngerLearner: event.currentTarget.checked })}
            type="checkbox"
          />
          <span>
            <label htmlFor="younger-learner">Younger learner mode</label>
            <span id="younger-learner-help">Shorter explanations, and the first hint is already open on beginner rounds. The physics and scoring stay the same.</span>
          </span>
        </div>
      </section>

      {status === "ready" && (
        <section aria-labelledby="world-progress-title" className="world-section">
          <h2 id="world-progress-title">Progress by physics world</h2>
          <ul className="world-progress">
            {summarizeWorldProgress(progress, PHYSICS_WORLDS).map((world) => (
              <li key={world.worldId}>
                <span className="world-progress__label">
                  <strong>{world.title}</strong>
                  <span>
                    {world.completedGames} of {world.totalGames} games · {world.bestScore} points
                  </span>
                </span>
                <progress
                  aria-label={`${world.title}: ${world.completedGames} of ${world.totalGames} games completed`}
                  max={world.totalGames}
                  value={world.completedGames}
                />
              </li>
            ))}
          </ul>
        </section>
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
                    <strong>{entry?.title ?? findLiveTitle(gameId) ?? gameId}</strong>
                    <span>{progress.bestScores[gameId] ?? 0} points</span>
                    {stars[gameId] !== undefined && <StarRating max={maxStars[gameId] ?? 9} stars={stars[gameId] as number} />}
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
