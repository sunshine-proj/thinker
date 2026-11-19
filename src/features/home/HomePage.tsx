import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppIcon } from "../../components/common/AppIcon";
import { LevelCard } from "../../components/common";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../data/games/gameCatalog";
import {
  continueLearning,
  featuredExperiment,
  recentActivities,
  recommendGames,
  type ContinueItem,
} from "../../game-engine/progression/recommendations";
import { calculateStreak, pickSurprise } from "../../game-engine/progression/streak";
import { useProgressStore } from "../../store/progressStore";
import { useChallengeStatus } from "../challenges/useChallengeStatus";
import { useProgressLevel } from "../profile/useProgressLevel";
import { findThoughtExperimentTitle } from "../../data/thoughtExperimentTitles";

const ALL_EXPERIMENTS = PHYSICS_WORLDS.flatMap((world) => world.entries).filter((entry) => entry.kind === "experiment");

function formatWhen(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Home sections that depend on the learner's own progress (PRD §4.1). */
function useHomeProgress() {
  const results = useProgressStore((state) => state.results);
  const predictions = useProgressStore((state) => state.predictions);
  const experiments = useProgressStore((state) => state.experiments);
  const status = useProgressStore((state) => state.status);
  const listSessions = useProgressStore((state) => state.listSessions);
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);
  const [today] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    void listSessions().then((sessions) => {
      if (!cancelled) {
        setContinueItems(continueLearning(sessions, findCatalogEntry));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listSessions]);

  const streak = calculateStreak(
    [
      ...results.map((result) => result.completedAt),
      ...experiments.map((experiment) => experiment.createdAt),
      ...predictions.map((prediction) => prediction.recordedAt),
    ],
    today,
  );

  return {
    ready: status === "ready",
    streak,
    playedIds: new Set(results.map((result) => result.gameId)),
    continueItems,
    recommended: recommendGames(results, PHYSICS_WORLDS),
    featured: featuredExperiment(ALL_EXPERIMENTS, today),
    recent: recentActivities(results, predictions, findCatalogEntry, findThoughtExperimentTitle),
  };
}

const learningSteps = [
  {
    number: "01",
    title: "Predict",
    description: "What do you think will happen?",
  },
  {
    number: "02",
    title: "Experiment",
    description: "Change a variable and see for yourself.",
  },
  {
    number: "03",
    title: "Understand",
    description: "Connect what you saw to the physics.",
  },
];

export function HomePage() {
  const { ready, daily } = useChallengeStatus();
  const level = useProgressLevel();
  const { ready: progressReady, streak, playedIds, continueItems, recommended, featured, recent } = useHomeProgress();
  const navigate = useNavigate();
  const surprise = () => {
    const games = PHYSICS_WORLDS.flatMap((world) => world.entries).filter((entry) => entry.kind === "game");
    const pick = pickSurprise(games, playedIds);
    if (pick) {
      void navigate(pick.path);
    }
  };
  return (
    <div className="home-page">
      <section aria-labelledby="welcome-title" className="welcome-panel">
        <div className="welcome-panel__content">
          <p className="eyebrow">
            <span className="eyebrow__spark" aria-hidden="true">
              ✦
            </span>
            A curious mind starts here
          </p>
          <h1 id="welcome-title">
            Physics is not just something to learn.
            <span>It’s something to explore.</span>
          </h1>
          <p className="welcome-panel__description">
            Play with big ideas, experiment with the rules of nature, and
            discover how the world works — one question at a time.
          </p>
          <div className="welcome-panel__actions">
            <Link className="button button--primary" to="/experiments">
              Explore the Experiment Lab
              <AppIcon name="arrowRight" />
            </Link>
            <Link className="button button--quiet" to="/worlds">
              Browse Physics Worlds
            </Link>
            <button className="button button--quiet" onClick={surprise} type="button">
              Surprise me
            </button>
          </div>
          {progressReady && streak > 0 && (
            <p className="home-streak" role="status">
              <span aria-hidden="true">🔥 </span>
              {streak}-day streak. Missing a day only resets the streak; your progress is always kept.
            </p>
          )}
        </div>
        <div aria-hidden="true" className="welcome-panel__art">
          <div className="welcome-panel__orbit welcome-panel__orbit--outer" />
          <div className="welcome-panel__orbit welcome-panel__orbit--middle" />
          <div className="welcome-panel__orbit welcome-panel__orbit--inner" />
          <div className="welcome-panel__planet">
            <span />
          </div>
          <span className="welcome-panel__star welcome-panel__star--one">✦</span>
          <span className="welcome-panel__star welcome-panel__star--two">✧</span>
          <span className="welcome-panel__star welcome-panel__star--three">·</span>
          <span className="welcome-panel__art-label">STAY CURIOUS</span>
        </div>
        <span aria-hidden="true" className="welcome-panel__decoration">
          +
        </span>
      </section>

      {continueItems.length > 0 && (
        <section aria-labelledby="continue-title" className="home-strip">
          <h2 id="continue-title">Continue learning</h2>
          <ul className="world-section__list">
            {continueItems.map(({ entry, savedAt }) => (
              <li key={entry.id}>
                <Link className="world-card" to={entry.path}>
                  <span className="world-card__meta">IN PROGRESS · SAVED {formatWhen(savedAt).toUpperCase()}</span>
                  <strong>Resume {entry.title}</strong>
                  <span>{entry.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="start-title" className="start-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A good place to begin</p>
            <h2 id="start-title">Where will your curiosity take you?</h2>
          </div>
          <span className="section-heading__aside">PICK YOUR NEXT STEP</span>
        </div>

        <div className="start-grid">
          <Link className="start-card start-card--experiment" to="/experiments">
            <span className="start-card__icon">
              <AppIcon name="experiments" />
            </span>
            <span className="start-card__body">
              <span className="start-card__eyebrow">TRY IT YOURSELF</span>
              <strong>Experiment Lab</strong>
              <span>Change the rules. Observe what happens.</span>
            </span>
            <AppIcon className="start-card__arrow" name="arrowRight" />
          </Link>

          <Link className="start-card start-card--worlds" to="/worlds">
            <span className="start-card__icon">
              <AppIcon name="worlds" />
            </span>
            <span className="start-card__body">
              <span className="start-card__eyebrow">FIND YOUR WORLD</span>
              <strong>Explore Physics</strong>
              <span>From motion and energy to stars and atoms.</span>
            </span>
            <AppIcon className="start-card__arrow" name="arrowRight" />
          </Link>

          <Link className="start-card start-card--challenge" to="/challenges">
            <span className="start-card__icon">
              <AppIcon name="challenges" />
            </span>
            <span className="start-card__body">
              <span className="start-card__eyebrow">PUT IT TO THE TEST</span>
              <strong>Take a Challenge</strong>
              <span>Use physics to solve a problem.</span>
            </span>
            <AppIcon className="start-card__arrow" name="arrowRight" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="daily-home-title" className="home-progress">
        <div className="daily-challenge">
          <p className="eyebrow">DAILY PHYSICS CHALLENGE</p>
          <h2 id="daily-home-title">{daily.challenge.title}</h2>
          <p>{daily.challenge.description}</p>
          <p className="daily-challenge__status">
            {ready && daily.completeToday ? "Done for today." : "Not done yet today."}
          </p>
          <Link className="text-link" to={daily.challenge.path}>
            Start this challenge
            <AppIcon name="arrowRight" />
          </Link>
        </div>
        <LevelCard status={level} />
      </section>

      <section aria-labelledby="recommended-title" className="home-strip">
        <h2 id="recommended-title">Recommended for you</h2>
        <p className="world-section__description">
          {progressReady && recommended.length > 0 ? "Games from worlds you have not explored yet." : "You have played every game. Try beating your best scores."}
        </p>
        <ul className="world-section__list">
          {recommended.map((entry) => (
            <li key={entry.id}>
              <Link aria-label={`Play ${entry.title}`} className="world-card" to={entry.path}>
                <span className="world-card__meta">
                  {PHYSICS_WORLDS.find((world) => world.entries.includes(entry))?.title.toUpperCase()} · {entry.difficulty.toUpperCase()}
                </span>
                <strong>{entry.title}</strong>
                <span>{entry.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured && (
        <section aria-labelledby="featured-title" className="home-strip">
          <h2 id="featured-title">Featured experiment</h2>
          <Link className="world-card world-card--featured" to={featured.path}>
            <span className="world-card__meta">TODAY IN THE LAB</span>
            <strong>{featured.title}</strong>
            <span>{featured.summary}</span>
          </Link>
        </section>
      )}

      <section aria-labelledby="recent-title" className="home-strip">
        <h2 id="recent-title">Recently completed</h2>
        {recent.length === 0 ? (
          <p className="world-section__description">Nothing yet. Finish a game or a thought experiment and it will appear here.</p>
        ) : (
          <ol className="recent-list">
            {recent.map((activity) => (
              <li key={`${activity.path}-${activity.at}`}>
                <Link className="text-link" to={activity.path}>{activity.title}</Link>
                <span>{activity.detail} · {formatWhen(activity.at)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="approach-title" className="approach-section">
        <div className="approach-section__intro">
          <p className="eyebrow">The Physics Playground way</p>
          <h2 id="approach-title">Discover by doing.</h2>
          <p>
            The best way to understand a physical idea is to get curious and
            explore it.
          </p>
        </div>
        <ol className="learning-steps">
          {learningSteps.map((step) => (
            <li className="learning-step" key={step.number}>
              <span className="learning-step__number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Thought experiment" className="question-card">
        <span className="question-card__icon" aria-hidden="true">
          ?
        </span>
        <div>
          <p className="eyebrow">A question to get you thinking</p>
          <h2>What would happen if gravity suddenly doubled?</h2>
        </div>
        <Link className="text-link" to="/thought-experiments/gravity-doubles">
          Follow the question
          <AppIcon name="arrowRight" />
        </Link>
      </section>
    </div>
  );
}
