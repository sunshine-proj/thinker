import { Link } from "react-router-dom";
import { useChallengeStatus } from "./useChallengeStatus";

export function ChallengesPage() {
  const { ready, all, daily } = useChallengeStatus();

  return (
    <div className="worlds-page">
      <header className="worlds-page__header">
        <p className="eyebrow">Put your ideas to work</p>
        <h1>Challenges</h1>
        <p>
          Take on focused physics problems. Challenges are checked against the
          games and experiments you complete on this device.
        </p>
      </header>

      <section aria-labelledby="daily-title" className="daily-challenge">
        <p className="eyebrow">DAILY PHYSICS CHALLENGE</p>
        <h2 id="daily-title">{daily.challenge.title}</h2>
        <p>{daily.challenge.description}</p>
        <p className="daily-challenge__status" role="status">
          {!ready
            ? "Checking your progress…"
            : daily.completeToday
              ? "Done for today. Come back tomorrow for a new one."
              : "Not done yet today."}
        </p>
        <Link className="text-link" to={daily.challenge.path}>
          Start this challenge
        </Link>
      </section>

      <section aria-labelledby="all-challenges-title" className="world-section">
        <h2 id="all-challenges-title">All challenges</h2>
        <ul className="world-section__list">
          {all.map(({ challenge, complete }) => (
            <li key={challenge.id}>
              <Link className="world-card" to={challenge.path}>
                <span className="world-card__meta">
                  {ready && complete ? "COMPLETED" : "TO DO"}
                </span>
                <strong>{challenge.title}</strong>
                <span>{challenge.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
