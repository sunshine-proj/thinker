import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PHYSICS_WORLDS, suggestedPath } from "../../data/games/gameCatalog";
import { LIVE_VERSIONS, livePathFor } from "../../data/games/liveGames";
import { StarRating } from "../../game-engine/components/StarRating";
import { bestStarsByGame } from "../../game-engine/scoring/stars";
import { useProgressStore } from "../../store/progressStore";

/**
 * Physics Worlds as a map: each world has an original story and a suggested path from
 * beginner to advanced. Nothing is locked; the next suggested game is highlighted.
 */
export function PhysicsWorldsPage() {
  const completedGames = useProgressStore((state) => state.progress.completedGames);
  const results = useProgressStore((state) => state.results);
  const hydrate = useProgressStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  const stars = bestStarsByGame(results);
  const maxStarsByGame = Object.fromEntries(results.filter((result) => result.maxStars).map((result) => [result.gameId, result.maxStars as number]));

  return (
    <div className="worlds-page">
      <header className="worlds-page__header">
        <p className="eyebrow">Choose a direction</p>
        <h1>Physics Worlds</h1>
        <p>
          Explore the ideas that shape our universe, from everyday motion to
          the behavior of tiny particles. Every world tells a story; follow the
          suggested path or jump in anywhere, nothing is locked.
        </p>
      </header>

      {PHYSICS_WORLDS.map((world) => {
        const path = suggestedPath(world);
        const nextUp = path.find((entry) => entry.kind === "game" && !completedGames.includes(entry.id));
        const gameCount = path.filter((entry) => entry.kind === "game").length;
        const done = path.filter((entry) => entry.kind === "game" && completedGames.includes(entry.id)).length;
        return (
          <section aria-labelledby={`world-${world.id}`} className="world-section world-map" key={world.id}>
            <div className="world-map__story">
              <h2 id={`world-${world.id}`}>{world.title}</h2>
              <p className="world-map__story-title">
                <strong>{world.story.title}</strong> · with {world.story.guide}
              </p>
              <p className="world-section__description">{world.story.premise}</p>
              <p className="world-map__progress">
                {done} of {gameCount} chapters complete
              </p>
            </div>
            <ol className="world-map__path">
              {path.map((entry, index) => {
                const isNext = entry.id === nextUp?.id;
                const completed = completedGames.includes(entry.id);
                return (
                  <li className={`world-map__step${isNext ? " world-map__step--next" : ""}${completed ? " world-map__step--done" : ""}`} key={entry.id}>
                    <Link className="world-card" to={entry.path}>
                      <span className="world-card__meta">
                        {entry.kind === "game" ? `CHAPTER ${index + 1}` : "LAB"} · {entry.difficulty.toUpperCase()}
                        {completed && " · COMPLETED"}
                        {isNext && " · NEXT UP"}
                      </span>
                      <strong>{entry.title}</strong>
                      <span>{entry.summary}</span>
                      {stars[entry.id] !== undefined && (
                        <StarRating max={maxStarsByGame[entry.id] ?? 9} stars={stars[entry.id] as number} />
                      )}
                    </Link>
                    {LIVE_VERSIONS[entry.id] && (
                      <Link className="world-map__live" to={livePathFor(entry.path)}>
                        ▶ Live version: {LIVE_VERSIONS[entry.id]?.title}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
            {world.comingSoon.length > 0 && (
              <ul className="world-section__list">
                {world.comingSoon.map((title) => (
                  <li key={title}>
                    <div aria-disabled="true" className="world-card world-card--soon">
                      <span className="world-card__meta">COMING SOON</span>
                      <strong>{title}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
