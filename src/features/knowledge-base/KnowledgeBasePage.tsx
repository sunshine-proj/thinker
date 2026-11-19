import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PHYSICS_WORLDS } from "../../data/games/gameCatalog";
import { findKnowledgeEntry } from "../../data/knowledge";
import { PHYSICS_TOPICS } from "../../data/topics";

export function KnowledgeBasePage() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      PHYSICS_TOPICS.filter((topic) => {
        if (!needle) {
          return true;
        }
        const entry = findKnowledgeEntry(topic.id);
        return `${topic.title} ${entry?.introduction ?? ""}`.toLowerCase().includes(needle);
      }),
    [needle],
  );

  return (
    <div className="worlds-page">
      <header className="worlds-page__header">
        <p className="eyebrow">Build your understanding</p>
        <h1>Knowledge Base</h1>
        <p>
          Clear explanations of every topic in the playground, with the formulas, what each symbol means,
          worked questions and the games and labs where you can try it out.
        </p>
      </header>
      <div className="lab-control knowledge-search">
        <span className="lab-control__heading">
          <label htmlFor="knowledge-search">Search topics</label>
        </span>
        <input
          id="knowledge-search"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="e.g. pressure, lens, half-life"
          type="search"
          value={query}
        />
      </div>
      <p aria-live="polite" className="visually-hidden">{matches.length} topics shown</p>
      {PHYSICS_WORLDS.map((world) => {
        const topics = matches.filter((topic) => topic.worldId === world.id);
        if (topics.length === 0) {
          return null;
        }
        return (
          <section aria-labelledby={`knowledge-${world.id}`} className="world-section" key={world.id}>
            <h2 id={`knowledge-${world.id}`}>{world.title}</h2>
            <ul className="world-section__list">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <Link className="world-card" to={`/knowledge/${topic.id}`}>
                    <span className="world-card__meta">TOPIC</span>
                    <strong>{topic.title}</strong>
                    <span>{findKnowledgeEntry(topic.id)?.introduction}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {matches.length === 0 && <p>No topic matches “{query}”.</p>}
    </div>
  );
}
