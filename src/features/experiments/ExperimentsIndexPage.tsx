import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PHYSICS_WORLDS } from "../../data/games/gameCatalog";
import { useProgressStore } from "../../store/progressStore";

const LAB_PATH = "/experiments/electron-trajectory";

export function ExperimentsIndexPage() {
  const experiments = useProgressStore((state) => state.experiments);
  const hydrate = useProgressStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const available = PHYSICS_WORLDS.flatMap((world) =>
    world.entries
      .filter((entry) => entry.kind === "experiment")
      .map((entry) => ({ ...entry, world: world.title })),
  );
  const recent = [...experiments]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  return (
    <div className="worlds-page">
      <header className="worlds-page__header">
        <p className="eyebrow">Experiment Lab</p>
        <h1>Open-ended experiments</h1>
        <p>
          Change the conditions, measure what happens, save your runs and
          compare them.
        </p>
      </header>

      <section aria-labelledby="available-experiments" className="world-section">
        <h2 id="available-experiments">Available experiments</h2>
        <ul className="world-section__list">
          {available.map((entry) => (
            <li key={entry.id}>
              <Link className="world-card" to={entry.path}>
                <span className="world-card__meta">
                  {entry.world.toUpperCase()} · {entry.difficulty.toUpperCase()}
                </span>
                <strong>{entry.title}</strong>
                <span>{entry.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-experiments" className="world-section">
        <h2 id="recent-experiments">Your saved experiments</h2>
        {recent.length === 0 ? (
          <p className="world-section__description">
            Nothing saved yet. Run an experiment and use “Save experiment” to
            keep it here.
          </p>
        ) : (
          <ul className="world-section__list">
            {recent.map((experiment) => (
              <li key={experiment.id}>
                <Link
                  className="world-card"
                  to={`${LAB_PATH}?saved=${encodeURIComponent(experiment.id)}`}
                >
                  <span className="world-card__meta">
                    {experiment.experimentName.toUpperCase()}
                  </span>
                  <strong>{experiment.runName}</strong>
                  <span>
                    Saved{" "}
                    {new Date(experiment.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                    {" · open in the lab"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
