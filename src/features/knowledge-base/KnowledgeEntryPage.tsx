import { Link, useParams } from "react-router-dom";
import { NotFoundPage } from "../../app/NotFoundPage";
import { PHYSICS_WORLDS, findEntriesForTopic } from "../../data/games/gameCatalog";
import { findKnowledgeEntry } from "../../data/knowledge";
import { findTopic } from "../../data/topics";
import { THOUGHT_EXPERIMENTS } from "../thought-experiments/thoughtExperiments";

export function KnowledgeEntryPage() {
  const { topicId = "" } = useParams();
  const topic = findTopic(topicId);
  const entry = findKnowledgeEntry(topicId);
  if (!topic || !entry) {
    return <NotFoundPage />;
  }
  const world = PHYSICS_WORLDS.find((candidate) => candidate.id === topic.worldId);
  const activities = findEntriesForTopic(topic.id);
  const thoughts = THOUGHT_EXPERIMENTS.filter((experiment) => experiment.worldId === topic.worldId);

  return (
    <article className="lab-page knowledge-entry">
      <header className="worlds-page__header">
        <p className="eyebrow">
          <Link className="text-link" to="/knowledge">Knowledge Base</Link> · {world?.title}
        </p>
        <h1>{topic.title}</h1>
        <p>{entry.introduction}</p>
      </header>

      <section aria-labelledby="ke-objectives" className="lab-panel">
        <h2 id="ke-objectives">You will learn to</h2>
        <ul>
          {entry.objectives.map((objective) => <li key={objective}>{objective}</li>)}
        </ul>
      </section>

      <section aria-labelledby="ke-explanation" className="lab-panel">
        <h2 id="ke-explanation">The idea</h2>
        <p>{entry.explanation}</p>
      </section>

      <section aria-labelledby="ke-formulas" className="lab-panel">
        <h2 id="ke-formulas">Formulas</h2>
        {entry.formulas.map((formula) => (
          <div className="knowledge-formula" key={formula.expression}>
            <p className="knowledge-formula__expression">{formula.expression}</p>
            <p>{formula.meaning}</p>
            {formula.variables.length > 0 && (
              <table className="knowledge-formula__variables">
                <caption className="visually-hidden">Symbols in {formula.expression}</caption>
                <thead>
                  <tr><th scope="col">Symbol</th><th scope="col">Meaning</th><th scope="col">Unit</th></tr>
                </thead>
                <tbody>
                  {formula.variables.map((variable) => (
                    <tr key={variable.symbol}>
                      <th scope="row">{variable.symbol}</th>
                      <td>{variable.meaning}</td>
                      <td>{variable.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </section>

      <section aria-labelledby="ke-definitions" className="lab-panel">
        <h2 id="ke-definitions">Key words</h2>
        <dl className="knowledge-definitions">
          {entry.definitions.map((definition) => (
            <div key={definition.term}>
              <dt>{definition.term}</dt>
              <dd>{definition.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="ke-examples" className="lab-panel">
        <h2 id="ke-examples">In the real world</h2>
        <ul>
          {entry.examples.map((example) => <li key={example}>{example}</li>)}
        </ul>
      </section>

      <section aria-labelledby="ke-questions" className="lab-panel">
        <h2 id="ke-questions">Test yourself</h2>
        {entry.questions.map((item) => (
          <details className="knowledge-question" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <section aria-labelledby="ke-advanced" className="lab-panel">
        <h2 id="ke-advanced">Going further</h2>
        <p>{entry.advanced}</p>
      </section>

      <section aria-labelledby="ke-try" className="lab-panel">
        <h2 id="ke-try">Try it yourself</h2>
        {activities.length === 0 ? (
          <p>No game or lab covers this topic yet.</p>
        ) : (
          <ul className="thought-page__related">
            {activities.map((activity) => (
              <li key={activity.id}>
                <Link className="text-link" to={activity.path}>
                  {activity.title} ({activity.kind === "game" ? "game" : "experiment"})
                </Link>
              </li>
            ))}
            {thoughts.map((experiment) => (
              <li key={experiment.id}>
                <Link className="text-link" to={`/thought-experiments/${experiment.id}`}>
                  {experiment.title} (thought experiment)
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
