import { summarizeScore, type ScoreState } from "../scoring/ScoringSystem";

interface GameScoreSummaryProps {
  readonly score: ScoreState;
  readonly title?: string;
}

export function GameScoreSummary({
  score,
  title = "Score",
}: GameScoreSummaryProps) {
  const summary = summarizeScore(score);

  return (
    <section aria-label="Game score" className="game-score-summary">
      <div className="game-score-summary__heading">
        <h2>{title}</h2>
        <strong>{summary.totalPoints} pts</strong>
      </div>
      {summary.entries.length > 0 && (
        <ul>
          {summary.entries.map((entry) => (
            <li key={entry.id}>
              <span>{entry.label}</span>
              <strong>{entry.points} pts</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
