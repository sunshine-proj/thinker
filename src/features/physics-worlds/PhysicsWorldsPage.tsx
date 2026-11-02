import { Link } from "react-router-dom";
import { PHYSICS_WORLDS } from "../../data/games/gameCatalog";
import { useProgressStore } from "../../store/progressStore";

export function PhysicsWorldsPage() {
  const completedGames = useProgressStore(
    (state) => state.progress.completedGames,
  );

  return (
    <div className="worlds-page">
      <header className="worlds-page__header">
        <p className="eyebrow">Choose a direction</p>
        <h1>Physics Worlds</h1>
        <p>
          Explore the ideas that shape our universe, from everyday motion to
          the behavior of tiny particles.
        </p>
      </header>

      {PHYSICS_WORLDS.map((world) => (
        <section
          aria-labelledby={`world-${world.id}`}
          className="world-section"
          key={world.id}
        >
          <h2 id={`world-${world.id}`}>{world.title}</h2>
          <p className="world-section__description">{world.description}</p>
          <ul className="world-section__list">
            {world.entries.map((entry) => (
              <li key={entry.id}>
                <Link className="world-card" to={entry.path}>
                  <span className="world-card__meta">
                    {entry.kind === "game" ? "GAME" : "EXPERIMENT"} ·{" "}
                    {entry.difficulty.toUpperCase()}
                    {completedGames.includes(entry.id) && " · COMPLETED"}
                  </span>
                  <strong>{entry.title}</strong>
                  <span>{entry.summary}</span>
                </Link>
              </li>
            ))}
            {world.comingSoon.map((title) => (
              <li key={title}>
                <div aria-disabled="true" className="world-card world-card--soon">
                  <span className="world-card__meta">COMING SOON</span>
                  <strong>{title}</strong>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
