import { useCallback, useState, type FormEvent } from "react";
import { RangeControl } from "../../../components/common";
import {
  GameHint,
  GameLifecycleControls,
  GameObjectiveList,
  GameProgressBar,
  GameScoreSummary,
  ResumePrompt,
} from "../../../game-engine/components";
import {
  createGameLifecycle,
  transitionGameLifecycle,
} from "../../../game-engine/core/GameLifecycle";
import {
  isRecord,
  readBooleanArray,
  readInteger,
  readNumber,
  readPausableStatus,
  readScoreState,
  readString,
} from "../../../game-engine/core/sessionParsing";
import {
  createGameObjective,
  updateGameObjective,
} from "../../../game-engine/objectives/GameObjective";
import {
  createScoreState,
  recordScore,
  type ScoreState,
} from "../../../game-engine/scoring/ScoringSystem";
import { useGameSession } from "../../../hooks/useGameSession";
import type { PointLoad } from "../../../physics/mechanics";
import { useProgressStore } from "../../../store/progressStore";
import {
  BALANCE_CHALLENGE_GAME,
  BALANCE_CHALLENGE_ROUNDS,
  type BalanceRound,
} from "./balanceChallengeData";
import {
  evaluateBalanceAttempt,
  getBackgroundLoads,
  getControlRange,
  getControlledLoad,
  summarizeTorques,
  type BalanceAttemptResult,
} from "./balanceChallengeModel";

interface Release {
  readonly controlValue: number;
  readonly result: BalanceAttemptResult;
}

interface BalanceSession {
  readonly roundIndex: number;
  readonly status: "playing" | "paused";
  readonly completedRounds: boolean[];
  readonly score: ScoreState;
  readonly totalAttempts: number;
  readonly roundAttempts: number;
  readonly controlValue: number;
  readonly prediction: string;
}

function parseBalanceSession(raw: unknown): BalanceSession | null {
  if (!isRecord(raw)) {
    return null;
  }
  const roundIndex = readInteger(raw, "roundIndex", 0, BALANCE_CHALLENGE_ROUNDS.length - 1);
  const status = readPausableStatus(raw, "status");
  const completedRounds = readBooleanArray(raw, "completedRounds", BALANCE_CHALLENGE_ROUNDS.length);
  const score = readScoreState(raw, "score");
  const totalAttempts = readInteger(raw, "totalAttempts", 0, 10_000);
  const roundAttempts = readInteger(raw, "roundAttempts", 0, 10_000);
  const prediction = readString(raw, "prediction");
  if (
    roundIndex === null || status === null || completedRounds === null ||
    score === null || totalAttempts === null || roundAttempts === null ||
    prediction === null
  ) {
    return null;
  }
  const { minimum, maximum } = getControlRange(
    BALANCE_CHALLENGE_ROUNDS[roundIndex] as BalanceRound,
  );
  const controlValue = readNumber(raw, "controlValue", minimum, maximum);
  return controlValue === null
    ? null
    : { roundIndex, status, completedRounds, score, totalAttempts, roundAttempts, controlValue, prediction };
}

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 380;
const DOMAIN_METERS = 7.5;
const PIVOT_Y = 270;
const PLOT_LEFT = 50;
const PLOT_RIGHT = 910;
const PIXELS_PER_METER = (PLOT_RIGHT - PLOT_LEFT) / (2 * DOMAIN_METERS);
const PIVOT_X = (PLOT_LEFT + PLOT_RIGHT) / 2;
const BEAM_THICKNESS = 14;
/** Largest drawn tilt, in degrees. The tilt shows direction and relative size only. */
const MAX_DRAWN_TILT_DEGREES = 9;

function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits);
}

function getInitialControlValue(round: BalanceRound): number {
  const { minimum, maximum, step } = getControlRange(round);
  const steps = Math.round((maximum - minimum) / step / 2);
  return Number((minimum + steps * step).toFixed(6));
}

function getControlUnit(round: BalanceRound): "m" | "kg" {
  return round.control.kind === "position" ? "m" : "kg";
}

function blockSize(massKilograms: number): number {
  return 18 + 9 * Math.sqrt(massKilograms);
}

function describeLoads(loads: readonly PointLoad[]): string {
  return loads
    .map((load) => {
      const side = load.positionMeters < 0 ? "left" : "right";
      return `${formatNumber(load.massKilograms)} kilograms ${formatNumber(Math.abs(load.positionMeters))} meters ${side}`;
    })
    .join("; ");
}

function BalancePlot({
  round,
  controlValue,
  release,
}: {
  round: BalanceRound;
  controlValue: number;
  release: Release | null;
}) {
  const x = (meters: number) => PIVOT_X + meters * PIXELS_PER_METER;
  const toleranceReference = release
    ? Math.max(release.result.toleranceNewtonMeters * 6, 1)
    : 1;
  const tiltDegrees = release
    ? release.result.balanced
      ? 0
      : Math.max(
          -MAX_DRAWN_TILT_DEGREES,
          Math.min(
            MAX_DRAWN_TILT_DEGREES,
            (release.result.netTorqueNewtonMeters / toleranceReference) *
              MAX_DRAWN_TILT_DEGREES,
          ),
        )
    : 0;
  const controlled = getControlledLoad(round, controlValue);
  const beamTop = PIVOT_Y - BEAM_THICKNESS;
  const ticks = Array.from(
    { length: Math.floor(round.beamRightMeters - round.beamLeftMeters) + 1 },
    (_, index) => Math.ceil(round.beamLeftMeters) + index,
  ).filter((tick) => tick <= round.beamRightMeters);

  const renderBlock = (
    load: PointLoad,
    key: string,
    className: string,
    label: string,
  ) => {
    const size = blockSize(load.massKilograms);
    return (
      <g className={className} key={key}>
        <rect
          height={size}
          rx="4"
          width={size}
          x={x(load.positionMeters) - size / 2}
          y={beamTop - size}
        />
        <text
          textAnchor="middle"
          x={x(load.positionMeters)}
          y={beamTop - size / 2 + 4}
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg
      aria-label={`Lever with the pivot at 0 meters. Fixed loads: ${describeLoads(getBackgroundLoads(round))}. Your mass: ${describeLoads([controlled])}. ${release ? (release.result.balanced ? "The lever is balanced." : release.result.state === "clockwise" ? "The lever tips down on the right." : "The lever tips down on the left.") : "The lever is held level until you release it."}`}
      className="balance-plot"
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <rect
        fill="#f9faff"
        height={VIEWBOX_HEIGHT}
        rx="10"
        width={VIEWBOX_WIDTH}
      />
      <line
        stroke="#d9deea"
        x1={PLOT_LEFT}
        x2={PLOT_RIGHT}
        y1={PIVOT_Y + 52}
        y2={PIVOT_Y + 52}
      />
      <polygon
        className="balance-plot__pivot"
        points={`${PIVOT_X - 34},${PIVOT_Y + 52} ${PIVOT_X + 34},${PIVOT_Y + 52} ${PIVOT_X},${PIVOT_Y}`}
      />
      <g
        style={{
          transform: `rotate(${tiltDegrees}deg)`,
          transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px`,
          transition: "transform 450ms ease-out",
        }}
      >
        <rect
          className="balance-plot__beam"
          height={BEAM_THICKNESS}
          rx="3"
          width={(round.beamRightMeters - round.beamLeftMeters) * PIXELS_PER_METER}
          x={x(round.beamLeftMeters)}
          y={beamTop}
        />
        {ticks.map((tick) => (
          <g className="balance-plot__tick" key={`tick-${tick}`}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={PIVOT_Y}
              y2={PIVOT_Y + 6}
            />
            <text textAnchor="middle" x={x(tick)} y={PIVOT_Y + 20}>
              {tick}
            </text>
          </g>
        ))}
        {round.fixedLoads.map((load, index) =>
          renderBlock(
            load,
            `fixed-${index}`,
            "balance-plot__block",
            `${formatNumber(load.massKilograms, 0)} kg`,
          ),
        )}
        {renderBlock(
          controlled,
          "controlled",
          "balance-plot__block balance-plot__block--yours",
          `${formatNumber(controlled.massKilograms, round.control.kind === "mass" ? 1 : 0)} kg`,
        )}
        {round.beamMassKilograms > 0 && (
          <g className="balance-plot__centre">
            <circle
              cx={x((round.beamLeftMeters + round.beamRightMeters) / 2)}
              cy={beamTop + BEAM_THICKNESS / 2}
              r="4"
            />
            <text
              textAnchor="middle"
              x={x((round.beamLeftMeters + round.beamRightMeters) / 2)}
              y={beamTop + BEAM_THICKNESS + 34}
            >
              beam {formatNumber(round.beamMassKilograms, 0)} kg
            </text>
          </g>
        )}
      </g>
      <text className="balance-plot__pivot-label" textAnchor="middle" x={PIVOT_X} y={PIVOT_Y + 74}>
        pivot · 0 m
      </text>
    </svg>
  );
}

export function BalanceChallengePage() {
  const recordGameResult = useProgressStore((state) => state.recordGameResult);
  const [roundIndex, setRoundIndex] = useState(0);
  const [controlValue, setControlValue] = useState(() =>
    getInitialControlValue(BALANCE_CHALLENGE_ROUNDS[0] as BalanceRound),
  );
  const [prediction, setPrediction] = useState("");
  const [lifecycle, setLifecycle] = useState(createGameLifecycle);
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [completedRounds, setCompletedRounds] = useState<boolean[]>(() =>
    BALANCE_CHALLENGE_ROUNDS.map(() => false),
  );
  const [score, setScore] = useState(createScoreState);
  const [release, setRelease] = useState<Release | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const round = BALANCE_CHALLENGE_ROUNDS[roundIndex] as BalanceRound;
  const range = getControlRange(round);
  const unit = getControlUnit(round);
  const roundIsBalanced = completedRounds[roundIndex] === true;
  const completedRoundCount = completedRounds.filter(Boolean).length;
  const isPlaying = lifecycle.status === "playing";
  const isLastRound = roundIndex === BALANCE_CHALLENGE_ROUNDS.length - 1;
  const objective = updateGameObjective(
    createGameObjective({
      id: "balance-levers",
      title: "Balance every lever",
      description: "Release each lever and have it settle level.",
      target: BALANCE_CHALLENGE_ROUNDS.length,
      unit: "levers",
    }),
    completedRoundCount,
  );
  const torques = release ? summarizeTorques(round, release.controlValue) : null;

  const sessionSnapshot: BalanceSession | null =
    lifecycle.status === "playing" || lifecycle.status === "paused"
      ? {
          roundIndex,
          status: lifecycle.status,
          completedRounds,
          score,
          totalAttempts,
          roundAttempts,
          controlValue,
          prediction,
        }
      : null;
  const restoreSession = useCallback((saved: BalanceSession) => {
    setRoundIndex(saved.roundIndex);
    setCompletedRounds(saved.completedRounds);
    setScore(saved.score);
    setTotalAttempts(saved.totalAttempts);
    setRoundAttempts(saved.roundAttempts);
    setControlValue(saved.controlValue);
    setPrediction(saved.prediction);
    setRelease(null);
    setShowHint(false);
    setErrorMessage(null);
    // Resumed games wait for the learner to press Resume.
    setLifecycle({ status: "paused" });
  }, []);
  const session = useGameSession({
    gameId: BALANCE_CHALLENGE_GAME.id,
    snapshot: sessionSnapshot,
    parse: parseBalanceSession,
    onRestore: restoreSession,
  });

  const changeControl = (value: number) => {
    setControlValue(value);
    setRelease(null);
    setErrorMessage(null);
  };

  const handleRelease = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPlaying || roundIsBalanced) {
      return;
    }

    const predictedValue = Number(prediction);
    if (
      prediction.trim() === "" ||
      !Number.isFinite(predictedValue) ||
      predictedValue < 0
    ) {
      setErrorMessage(
        `Enter a non-negative prediction in ${unit === "m" ? "meters" : "kilograms"} before releasing the lever.`,
      );
      return;
    }

    try {
      const attemptNumber = roundAttempts + 1;
      const result = evaluateBalanceAttempt(
        round,
        controlValue,
        predictedValue,
        attemptNumber,
      );
      setRelease({ controlValue, result });
      setRoundAttempts(attemptNumber);
      setTotalAttempts((count) => count + 1);
      setErrorMessage(null);

      if (result.balanced) {
        const nextScore = recordScore(
          score,
          { id: round.id, label: round.title, points: result.score },
          "best",
        );
        setScore(nextScore);
        setCompletedRounds((rounds) =>
          rounds.map((done, index) => (index === roundIndex ? true : done)),
        );
        if (isLastRound) {
          setLifecycle((current) => transitionGameLifecycle(current, "complete"));
          void recordGameResult({
            gameId: BALANCE_CHALLENGE_GAME.id,
            score: nextScore.totalPoints,
            difficulty: round.difficulty,
            completionStatus: "completed",
            completedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The lever could not be evaluated.",
      );
    }
  };

  const startRound = (index: number) => {
    const next = BALANCE_CHALLENGE_ROUNDS[index] as BalanceRound;
    setRoundIndex(index);
    setControlValue(getInitialControlValue(next));
    setPrediction("");
    setRelease(null);
    setRoundAttempts(0);
    setShowHint(false);
    setErrorMessage(null);
  };

  const handleNextRound = () => {
    if (roundIsBalanced && !isLastRound) {
      startRound(roundIndex + 1);
    }
  };

  const handleReset = () => {
    startRound(0);
    setLifecycle((current) => transitionGameLifecycle(current, "reset"));
    setTotalAttempts(0);
    setCompletedRounds(BALANCE_CHALLENGE_ROUNDS.map(() => false));
    setScore(createScoreState());
  };

  const handleLifecycleAction = (action: "start" | "pause" | "resume") => {
    setLifecycle((current) => transitionGameLifecycle(current, action));
  };

  return (
    <div className="game-page">
      <header className="game-page__header">
        <div>
          <p className="eyebrow">MECHANICS · EQUILIBRIUM</p>
          <h1>{BALANCE_CHALLENGE_GAME.title}</h1>
          <p className="game-page__intro">
            {BALANCE_CHALLENGE_GAME.introduction}
          </p>
        </div>
        <span className="trajectory-lab__model-tag">STATIC TORQUE BALANCE</span>
      </header>

      {session.hasSavedGame && (
        <ResumePrompt onDiscard={session.discard} onResume={session.resume} />
      )}

      <GameProgressBar
        items={[
          {
            label: "ROUND",
            value:
              lifecycle.status === "completed"
                ? BALANCE_CHALLENGE_ROUNDS.length
                : roundIndex + 1,
            total: BALANCE_CHALLENGE_ROUNDS.length,
          },
          {
            label: "OBJECTIVES",
            value: completedRoundCount,
            total: BALANCE_CHALLENGE_ROUNDS.length,
          },
          { label: "RELEASES", value: totalAttempts },
        ]}
        status={lifecycle.status}
      />

      <div className="game-engine-overview">
        <GameObjectiveList objectives={[objective]} />
        <GameScoreSummary score={score} title="Best score" />
      </div>

      <div className="game-page__layout">
        <section
          aria-labelledby="balance-plot-title"
          className="trajectory-visual"
        >
          <div className="trajectory-visual__heading">
            <div>
              <span className="trajectory-visual__eyebrow">
                {lifecycle.status === "completed"
                  ? "ALL LEVERS BALANCED"
                  : `ROUND ${roundIndex + 1} · ${round.difficulty.toUpperCase()}`}
              </span>
              <h2 id="balance-plot-title">
                {lifecycle.status === "completed"
                  ? "Challenge complete"
                  : round.title}
              </h2>
            </div>
          </div>
          <p className="balance-situation">{round.situation}</p>
          {lifecycle.status === "paused" && (
            <p className="game-paused-message" role="status">
              Game paused. Resume when you are ready to continue.
            </p>
          )}
          <div className="balance-plot-wrap">
            <BalancePlot
              controlValue={controlValue}
              release={release}
              round={round}
            />
          </div>

          <div aria-live="polite" className="game-measurements">
            <div className="game-measurement">
              <span>CLOCKWISE TORQUE</span>
              <strong>
                {torques ? `${formatNumber(torques.clockwiseNewtonMeters)} N·m` : "—"}
              </strong>
            </div>
            <div className="game-measurement">
              <span>COUNTER-CLOCKWISE</span>
              <strong>
                {torques
                  ? `${formatNumber(torques.counterClockwiseNewtonMeters)} N·m`
                  : "—"}
              </strong>
            </div>
            <div className="game-measurement">
              <span>NET TORQUE</span>
              <strong>
                {release
                  ? `${formatNumber(release.result.netTorqueNewtonMeters)} N·m`
                  : "—"}
              </strong>
            </div>
            <div className="game-measurement">
              <span>PIVOT SUPPORT FORCE</span>
              <strong>
                {release
                  ? `${formatNumber(release.result.supportForceNewtons)} N`
                  : "—"}
              </strong>
            </div>
          </div>

          {release && (
            <p
              className={
                release.result.balanced
                  ? "game-result game-result--hit"
                  : "game-result"
              }
              role="status"
            >
              {release.result.balanced
                ? `Balanced! ${release.result.score} points — ${release.result.accuracyPoints} for accuracy, ${release.result.predictionPoints} for your prediction and ${release.result.attemptPoints} for your attempt count.`
                : `The lever tips ${release.result.state === "clockwise" ? "down on the right" : "down on the left"}: the net torque is ${formatNumber(Math.abs(release.result.netTorqueNewtonMeters))} N·m ${release.result.state === "clockwise" ? "clockwise" : "counter-clockwise"}. Adjust your mass and try again.`}
            </p>
          )}
          {lifecycle.status === "completed" && (
            <div className="game-complete" role="status">
              <strong>Every lever balanced.</strong>
              <span>
                You scored {score.totalPoints} points over {totalAttempts}{" "}
                releases.
              </span>
            </div>
          )}
        </section>

        <aside aria-label="Game controls" className="trajectory-controls">
          <div className="trajectory-controls__heading">
            <div>
              <span className="trajectory-visual__eyebrow">YOUR MASS</span>
              <h2>Balance the lever</h2>
            </div>
            <span aria-hidden="true" className="trajectory-controls__spark">
              ⚖
            </span>
          </div>

          <p className="game-instructions">
            {BALANCE_CHALLENGE_GAME.instructions}
          </p>
          <GameLifecycleControls
            onPause={() => handleLifecycleAction("pause")}
            onReset={handleReset}
            onResume={() => handleLifecycleAction("resume")}
            onStart={() => handleLifecycleAction("start")}
            resetLabel="Play again"
            status={lifecycle.status}
          />
          <form onSubmit={handleRelease}>
            <label className="lab-control" htmlFor="balance-prediction">
              <span className="lab-control__heading">
                <span>
                  {round.control.kind === "position"
                    ? "Your position prediction"
                    : "Your mass prediction"}
                </span>
                <output htmlFor="balance-prediction">Before the release</output>
              </span>
              <span className="game-number-input">
                <input
                  aria-label={
                    round.control.kind === "position"
                      ? "Your position prediction in meters"
                      : "Your mass prediction in kilograms"
                  }
                  disabled={!isPlaying}
                  id="balance-prediction"
                  inputMode="decimal"
                  max="100"
                  min="0"
                  onChange={(event) => {
                    setPrediction(event.currentTarget.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. 3.5"
                  step="0.1"
                  type="number"
                  value={prediction}
                />
                <span>{unit}</span>
              </span>
            </label>
            <RangeControl
              disabled={!isPlaying || roundIsBalanced}
              displayValue={`${formatNumber(controlValue)} ${unit}`}
              id="balance-control"
              label={
                round.control.kind === "position"
                  ? `Position of the ${formatNumber(round.control.massKilograms, 0)} kg block`
                  : `Mass of the block at ${formatNumber(round.control.positionMeters)} m`
              }
              maximum={range.maximum}
              minimum={range.minimum}
              onChange={changeControl}
              step={range.step}
              value={controlValue}
            />
            {errorMessage && (
              <p className="game-error" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="game-actions">
              <button
                className="lab-button lab-button--primary"
                disabled={!isPlaying || roundIsBalanced}
                type="submit"
              >
                {roundIsBalanced ? "Balanced" : "Release lever"}
              </button>
              {roundIsBalanced && !isLastRound && (
                <button
                  className="lab-button lab-button--secondary"
                  onClick={handleNextRound}
                  type="button"
                >
                  Next lever
                </button>
              )}
            </div>
          </form>

          {!roundIsBalanced && lifecycle.status !== "completed" && (
            <GameHint
              disabled={!isPlaying}
              hint={round.hint}
              onToggle={() => setShowHint((visible) => !visible)}
              visible={showHint}
            />
          )}

          <div className="game-formula">
            <span>TORQUE BALANCE</span>
            <strong>{BALANCE_CHALLENGE_GAME.formula}</strong>
            <p>
              <i>m</i> is mass, <i>g</i> is gravity, and <i>d</i> is the
              distance from the pivot.
            </p>
          </div>
        </aside>
      </div>

      <section
        aria-labelledby="balance-learning-title"
        className="game-learning"
      >
        <div>
          <p className="eyebrow">THE PHYSICS</p>
          <h2 id="balance-learning-title">Why does the lever balance?</h2>
          <p>{BALANCE_CHALLENGE_GAME.explanation}</p>
          <ul className="game-objectives-list">
            {BALANCE_CHALLENGE_GAME.learningObjectives.map((objectiveText) => (
              <li key={objectiveText}>{objectiveText}</li>
            ))}
          </ul>
        </div>
        <div className="game-learning__note">
          <strong>Model assumptions</strong>
          <p>{BALANCE_CHALLENGE_GAME.assumptions}</p>
        </div>
      </section>
    </div>
  );
}
