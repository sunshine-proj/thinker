import { Link } from "react-router-dom";
import { AppIcon } from "../../components/common/AppIcon";

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
            <Link
              className="button button--quiet"
              to="/worlds/mechanics/projectile-master"
            >
              Play Projectile Master
            </Link>
          </div>
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
        <Link className="text-link" to="/thought-experiments">
          Follow the question
          <AppIcon name="arrowRight" />
        </Link>
      </section>
    </div>
  );
}
