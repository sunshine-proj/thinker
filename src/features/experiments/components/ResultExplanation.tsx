import type { ResultExplanation as Explanation } from "../electronExperiment";

/** Plain-language reasons for what the current setup does, shown beside the results. */
export function ResultExplanation({
  explanations,
  heading = "What this setup shows",
}: {
  readonly explanations: readonly Explanation[];
  readonly heading?: string;
}) {
  return (
    <section aria-labelledby="result-explanation-title" className="result-explanation">
      <p className="eyebrow">UNDERSTAND THE RESULT</p>
      <h2 id="result-explanation-title">{heading}</h2>
      <ul>
        {explanations.map((explanation) => (
          <li key={explanation.title}>
            <strong>{explanation.title}</strong>
            <p>{explanation.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
