import { useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { MeasurementGrid, type MeasurementItem } from "../../components/common";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../data/games/gameCatalog";
import { LIVE_VERSIONS, livePathFor } from "../../data/games/liveGames";
import { Link, useInRouterContext } from "react-router-dom";
import { playEffect } from "../../services/audio/tonePlayer";
import { firstSentence, useLearnerPreferences } from "../../services/preferences";
import { useProgressStore } from "../../store/progressStore";
import { suggestHarderChallenge } from "../progression/recommendations";
import {
  GameCelebration,
  GameLifecycleControls,
  HintLadder,
  StarRating,
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
  const [{ youngerLearner }] = useLearnerPreferences();
  const results = useProgressStore((state) => state.results);
  const completed = lifecycle.status === "completed";

  // Younger learners see the first hint straight away on beginner rounds (no star penalty).
  const freeHint = youngerLearner && round.difficulty === "Beginner" ? 1 : 0;
  const hintLevel = Math.max(game.hintLevel, freeHint);
  const hintSteps = useMemo(() => {
    const steps = [
      { title: "Nudge", text: `Think about the key relation: ${meta.formula}. Which quantity are you solving for, and which do you know?` },
      { title: "The method", text: round.hint },
    ];
    const spec = definition.prediction(round);
    if (spec) {
      try {
        const actual = definition.evaluate(round, game.control, null, 1).predictionActual;
        if (actual !== null && Number.isFinite(actual)) {
          steps.push({ title: "Worked step", text: `${spec.label.replace(/^Your prediction of /, "The ")} works out at about ${Number(actual.toPrecision(3))} ${spec.unit}. Check that your setting gives this.`.replace(/\s+\./, ".") });
        }
      } catch {
        // No worked step for settings the model cannot evaluate.
      }
    }
    return steps;
    // The worked step depends on the round, not on every slider movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, meta.formula, definition]);

  useEffect(() => {
    if (!last) {
      return;
    }
    playEffect(completed ? "complete" : last.outcome.success ? "success" : "miss");
  }, [last, completed]);

  const live = LIVE_VERSIONS[meta.id];
  const gamePath = findCatalogEntry(meta.id)?.path;
  const inRouter = useInRouterContext();
  const harder = completed
    ? suggestHarderChallenge(meta.id, PHYSICS_WORLDS, new Set(results.map((result) => result.gameId)))
    : null;

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
          <p className="game-page__intro">{youngerLearner ? firstSentence(meta.introduction) : meta.introduction}</p>
          {live && gamePath && (
            <p className="game-page__live-link">
              {inRouter ? (
                <Link className="text-link" to={livePathFor(gamePath)}>Play the live version: {live.title}</Link>
              ) : (
                <a className="text-link" href={livePathFor(gamePath)}>Play the live version: {live.title}</a>
              )}
            </p>
          )}
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
          { label: "STARS", value: game.totalStars, total: game.maxStars },
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
          {lifecycle.status === "failed" && last?.outcome.catastrophe && (
            <div className="game-failure" role="alert">
              <strong>{last.outcome.catastrophe.title}</strong>
              <p>{last.outcome.catastrophe.explanation}</p>
              <button className="lab-button lab-button--primary" onClick={() => game.lifecycleAction("retry")} type="button">
                Retry this round
              </button>
            </div>
          )}
          {resultText && (
            <p
              className={last?.outcome.success ? "game-result game-result--hit" : "game-result"}
              role="status"
            >
              {last?.stars ? (
                <>
                  <StarRating max={3} stars={last.stars} />{" "}
                </>
              ) : null}
              {resultText}
            </p>
          )}
          {completed && (
            <GameCelebration
              attempts={game.totalAttempts}
              insight={firstSentence(meta.explanation)}
              maxStars={game.maxStars}
              next={harder ? { title: harder.title, path: harder.path } : null}
              onPlayAgain={game.reset}
              points={game.score.totalPoints}
              stars={game.totalStars}
              title={meta.title}
            />
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
            <HintLadder
              disabled={!game.isPlaying}
              level={hintLevel}
              onReveal={game.revealNextHint}
              steps={hintSteps}
            />
          )}

          <div className="game-formula">
            <span>KEY RELATIONS</span>
            <strong>{meta.formula}</strong>
            {youngerLearner ? (
              <details>
                <summary>What do the symbols mean?</summary>
                <p>{meta.formulaCaption}</p>
              </details>
            ) : (
              <p>{meta.formulaCaption}</p>
            )}
          </div>
        </aside>
      </div>

      <section aria-labelledby="learning-title" className="game-learning">
        <div>
          <p className="eyebrow">THE PHYSICS</p>
          <h2 id="learning-title">What is going on?</h2>
          {youngerLearner ? (
            <>
              <p>{firstSentence(meta.explanation)}</p>
              <details>
                <summary>Read the full explanation</summary>
                <p>{meta.explanation}</p>
              </details>
            </>
          ) : (
            <p>{meta.explanation}</p>
          )}
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
