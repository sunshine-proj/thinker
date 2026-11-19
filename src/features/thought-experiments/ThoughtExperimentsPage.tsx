import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useProgressStore } from "../../store/progressStore";
import { STATEMENT_LABELS } from "./thoughtExperimentTypes";
import { THOUGHT_EXPERIMENTS } from "./thoughtExperiments";

export function ThoughtExperimentsPage() {
  const hydrate = useProgressStore((state) => state.hydrate);
  const predictions = useProgressStore((state) => state.predictions);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const statusOf = (id: string) => {
    const mine = predictions.filter((prediction) => prediction.activityId === id);
    if (mine.some((prediction) => prediction.questionId === "variation")) {
      return "COMPLETED";
    }
    return mine.length > 0 ? "IN PROGRESS" : "NEW";
  };

  return (
    <div className="worlds-page">
      <header className="worlds-page__header">
        <p className="eyebrow">What would happen if…?</p>
        <h1>Thought Experiments</h1>
        <p>
          Predict first, then run the numbers. Every statement is labeled as{" "}
          {Object.values(STATEMENT_LABELS).map((label) => label.toLowerCase()).join(", ")}, so you always
          know what is known and what is imagined.
        </p>
      </header>
      <ul className="world-section__list">
        {THOUGHT_EXPERIMENTS.map((experiment) => (
          <li key={experiment.id}>
            <Link className="world-card" to={`/thought-experiments/${experiment.id}`}>
              <span className="world-card__meta">THOUGHT EXPERIMENT · {statusOf(experiment.id)}</span>
              <strong>{experiment.title}</strong>
              <span>{experiment.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
