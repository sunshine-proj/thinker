import type { FormEvent, ReactNode } from "react";
import { MeasurementGrid, type MeasurementItem } from "../../components/common";
import {
  GameHint,
  GameLifecycleControls,
  GameObjectiveList,
  GameProgressBar,
  GameScoreSummary,
  ResumePrompt,
} from "../components";
import type { AttemptOutcome, RoundBase, RoundGameDefinition } from "./types";
import { useRoundGame, type RoundGameState } from "./useRoundGame";

interface RoundGamePageProps<
  Round extends RoundBase,
  Control,
  Outcome extends AttemptOutcome,
> {
  readonly definition: RoundGameDefinition<Round, Control, Outcome>;
  /** The diagram or simulation for the current state. */
  readonly renderVisual: (game: RoundGameState<Round, Control, Outcome>) => ReactNode;
  /** Readouts shown beneath the visual. */
  readonly renderMeasurements: (
    game: RoundGameState<Round, Control, Outcome>,
  ) => readonly MeasurementItem[];
  /** The game's own inputs; placed inside the form above the prediction. */
  readonly renderControls: (game: RoundGameState<Round, Control, Outcome>) => ReactNode;
  /** Extra detail under the result message, such as a table of readings. */
  readonly renderDetails?: (game: RoundGameState<Round, Control, Outcome>) => ReactNode;
}

/**
 * Shared page for round-based games: progress, objectives, score, resume
 * prompt, visual, controls, prediction, hint, formula, and explanation.
 */
export function RoundGamePage<
  Round extends RoundBase,
  Control,
  Outcome extends AttemptOutcome,
>({
  definition,
  renderVisual,
  renderMeasurements,
  renderControls,
  renderDetails,
}: RoundGamePageProps<Round, Control, Outcome>) {
  const game = useRoundGame(definition);
  const { meta, rounds } = definition;
  const { round, lifecycle, last } = game;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    game.submit();
  };

  const resultText = last
    ? last.outcome.success
      ? `${meta.solvedLabel} ${last.points.score} points — ${last.points.accuracyPoints} for accuracy${
          game.predictionSpec ? `, ${last.points.predictionPoints} for your prediction` : ""
        } and ${last.points.attemptPoints} for your attempt count. ${last.outcome.feedback}`
      : last.outcome.feedback
    : null;

  return (
    <div className="game-page">
      <header className="game-page__header">
        <div>
          <p className="eyebrow">{meta.eyebrow}</p>
          <h1>{meta.title}</h1>
          <p className="game-page__intro">{meta.introduction}</p>
        </div>
        <span className="trajectory-lab__model-tag">{meta.modelTag}</span>
      </header>

      {game.session.hasSavedGame && (
        <ResumePrompt onDiscard={game.session.discard} onResume={game.session.resume} />
      )}

      <GameProgressBar
        items={[
          {
            label: "ROUND",
            value: lifecycle.status === "completed" ? rounds.length : game.roundIndex + 1,
            total: rounds.length,
          },
          { label: "OBJECTIVES", value: game.completedCount, total: rounds.length },
          { label: "ATTEMPTS", value: game.totalAttempts },
        ]}
        status={lifecycle.status}
      />

      <div className="game-engine-overview">
        <GameObjectiveList objectives={[game.objective]} />
        <GameScoreSummary score={game.score} title="Best score" />
      </div>

      <div className="game-page__layout">
        <section aria-labelledby="round-title" className="trajectory-visual">
          <div className="trajectory-visual__heading">
            <div>
              <span className="trajectory-visual__eyebrow">
                {lifecycle.status === "completed"
                  ? "ALL ROUNDS COMPLETE"
                  : `ROUND ${game.roundIndex + 1} · ${round.difficulty.toUpperCase()}`}
              </span>
              <h2 id="round-title">
                {lifecycle.status === "completed" ? "Challenge complete" : round.title}
              </h2>
            </div>
          </div>
          <p className="balance-situation">{round.situation}</p>
          {lifecycle.status === "paused" && (
            <p className="game-paused-message" role="status">
              Game paused. Resume when you are ready to continue.
            </p>
          )}
          <div className="balance-plot-wrap">{renderVisual(game)}</div>
          <MeasurementGrid items={renderMeasurements(game)} />
          {renderDetails?.(game)}
          {resultText && (
            <p
              className={last?.outcome.success ? "game-result game-result--hit" : "game-result"}
              role="status"
            >
              {resultText}
            </p>
          )}
          {lifecycle.status === "completed" && (
            <div className="game-complete" role="status">
              <strong>Every round complete.</strong>
              <span>
                You scored {game.score.totalPoints} points over {game.totalAttempts} attempts.
              </span>
            </div>
          )}
        </section>

        <aside aria-label="Game controls" className="trajectory-controls">
          <div className="trajectory-controls__heading">
            <div>
              <span className="trajectory-visual__eyebrow">YOUR SETUP</span>
              <h2>{meta.controlsHeading}</h2>
            </div>
          </div>
          <p className="game-instructions">{meta.instructions}</p>
          <GameLifecycleControls
            onPause={() => game.lifecycleAction("pause")}
            onReset={game.reset}
            onResume={() => game.lifecycleAction("resume")}
            onStart={() => game.lifecycleAction("start")}
            resetLabel="Play again"
            status={lifecycle.status}
          />

          <form noValidate onSubmit={handleSubmit}>
            {renderControls(game)}
            {game.predictionSpec && (
              <label className="lab-control" htmlFor="round-prediction">
                <span className="lab-control__heading">
                  <span>{game.predictionSpec.label}</span>
                  <output htmlFor="round-prediction">Before you test</output>
                </span>
                <span className="game-number-input">
                  <input
                    aria-label={`${game.predictionSpec.label} in ${game.predictionSpec.unit}`}
                    disabled={!game.canEdit}
                    id="round-prediction"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => game.setPrediction(event.currentTarget.value)}
                    placeholder={game.predictionSpec.placeholder}
                    step={game.predictionSpec.step}
                    type="number"
                    value={game.prediction}
                  />
                  <span>{game.predictionSpec.unit}</span>
                </span>
              </label>
            )}
            {game.errorMessage && (
              <p className="game-error" role="alert">
                {game.errorMessage}
              </p>
            )}
            <div className="game-actions">
              <button
                className="lab-button lab-button--primary"
                disabled={!game.canEdit}
                type="submit"
              >
                {game.roundSolved ? "Solved" : meta.submitLabel}
              </button>
              {game.roundSolved && !game.isLastRound && (
                <button
                  className="lab-button lab-button--secondary"
                  onClick={game.nextRound}
                  type="button"
                >
                  {meta.nextLabel}
                </button>
              )}
            </div>
          </form>

          {!game.roundSolved && lifecycle.status !== "completed" && (
            <GameHint
              disabled={!game.isPlaying}
              hint={round.hint}
              onToggle={game.toggleHint}
              visible={game.showHint}
            />
          )}

          <div className="game-formula">
            <span>KEY RELATIONS</span>
            <strong>{meta.formula}</strong>
            <p>{meta.formulaCaption}</p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="learning-title" className="game-learning">
        <div>
          <p className="eyebrow">THE PHYSICS</p>
          <h2 id="learning-title">What is going on?</h2>
          <p>{meta.explanation}</p>
          <ul className="game-objectives-list">
            {meta.learningObjectives.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
        <div className="game-learning__note">
          <strong>Model assumptions</strong>
          <p>{meta.assumptions}</p>
        </div>
      </section>
    </div>
  );
}
