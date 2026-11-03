import { useCallback, useState, type FormEvent } from "react";
import { RangeControl } from "../../../components/common";
import { useProgressStore } from "../../../store/progressStore";
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
import {
  PROJECTILE_MASTER_GAME,
  PROJECTILE_MASTER_ROUNDS,
} from "./projectileMasterData";
import {
  calculateProjectileTrajectory,
  scoreProjectileShot,
  type ProjectileShotResult,
  type ProjectileTrajectory,
} from "./projectileMasterModel";

interface CompletedShot {
  readonly trajectory: ProjectileTrajectory;
  readonly result: ProjectileShotResult;
}

interface ProjectileSession {
  readonly roundIndex: number;
  readonly status: "playing" | "paused";
  readonly completedRounds: boolean[];
  readonly score: ScoreState;
  readonly attemptCount: number;
  readonly speedMetersPerSecond: number;
  readonly angleDegrees: number;
  readonly prediction: string;
}

function parseProjectileSession(raw: unknown): ProjectileSession | null {
  if (!isRecord(raw)) {
    return null;
  }
  const roundIndex = readInteger(raw, "roundIndex", 0, PROJECTILE_MASTER_ROUNDS.length - 1);
  const status = readPausableStatus(raw, "status");
  const completedRounds = readBooleanArray(raw, "completedRounds", PROJECTILE_MASTER_ROUNDS.length);
  const score = readScoreState(raw, "score");
  const attemptCount = readInteger(raw, "attemptCount", 0, 10_000);
  const speedMetersPerSecond = readNumber(raw, "speedMetersPerSecond", 8, 30);
  const angleDegrees = readNumber(raw, "angleDegrees", 10, 80);
  const prediction = readString(raw, "prediction");
  if (
    roundIndex === null || status === null || completedRounds === null ||
    score === null || attemptCount === null || speedMetersPerSecond === null ||
    angleDegrees === null || prediction === null
  ) {
    return null;
  }
  return { roundIndex, status, completedRounds, score, attemptCount, speedMetersPerSecond, angleDegrees, prediction };
}

const INITIAL_SPEED_METERS_PER_SECOND = 22;
const INITIAL_ANGLE_DEGREES = 45;
const PLOT = { left: 66, right: 930, top: 28, bottom: 372 } as const;
const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 420;

function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits);
}

function ProjectilePlot({
  trajectory,
  targetDistanceMeters,
  targetRadiusMeters,
  title,
}: {
  trajectory: ProjectileTrajectory | null;
  targetDistanceMeters: number;
  targetRadiusMeters: number;
  title: string;
}) {
  const maxDistanceMeters = Math.max(
    targetDistanceMeters * 1.2,
    (trajectory?.horizontalRangeMeters ?? 0) * 1.12,
    10,
  );
  const maxHeightMeters = Math.max(
    (trajectory?.maximumHeightMeters ?? 0) * 1.18,
    8,
  );
  const x = (distance: number) =>
    PLOT.left +
    (distance / maxDistanceMeters) * (PLOT.right - PLOT.left);
  const y = (height: number) =>
    PLOT.bottom -
    (height / maxHeightMeters) * (PLOT.bottom - PLOT.top);
  const path = trajectory
    ? trajectory.points
        .map(
          (point, index) =>
            `${index === 0 ? "M" : "L"} ${x(point.x)} ${y(point.y)}`,
        )
        .join(" ")
    : null;
  const tickCount = 4;

  return (
    <svg
      aria-label={title}
      className="projectile-plot"
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <rect
        fill="#f9faff"
        height={VIEWBOX_HEIGHT}
        rx="10"
        width={VIEWBOX_WIDTH}
      />
      {Array.from({ length: tickCount + 1 }, (_, index) => {
        const distance = (maxDistanceMeters * index) / tickCount;
        const tickX = x(distance);
        return (
          <g key={`x-${index}`}>
            <line
              stroke="#e9edf5"
              x1={tickX}
              x2={tickX}
              y1={PLOT.top}
              y2={PLOT.bottom}
            />
            <text
              fill="#858da0"
              fontSize="11"
              textAnchor="middle"
              x={tickX}
              y={PLOT.bottom + 22}
            >
              {formatNumber(distance, 0)} m
            </text>
          </g>
        );
      })}
      {Array.from({ length: tickCount + 1 }, (_, index) => {
        const height = (maxHeightMeters * index) / tickCount;
        const tickY = y(height);
        return (
          <g key={`y-${index}`}>
            <line
              stroke="#e9edf5"
              x1={PLOT.left}
              x2={PLOT.right}
              y1={tickY}
              y2={tickY}
            />
            <text
              fill="#858da0"
              fontSize="11"
              textAnchor="end"
              x={PLOT.left - 10}
              y={tickY + 4}
            >
              {formatNumber(height, 0)} m
            </text>
          </g>
        );
      })}
      <line
        stroke="#b9c0d0"
        strokeWidth="1.5"
        x1={PLOT.left}
        x2={PLOT.right}
        y1={PLOT.bottom}
        y2={PLOT.bottom}
      />
      <line
        stroke="#b9c0d0"
        strokeWidth="1.5"
        x1={PLOT.left}
        x2={PLOT.left}
        y1={PLOT.top}
        y2={PLOT.bottom}
      />
      <text
        fill="#677187"
        fontSize="11"
        textAnchor="middle"
        x={(PLOT.left + PLOT.right) / 2}
        y={VIEWBOX_HEIGHT - 8}
      >
        Horizontal distance
      </text>
      <circle
        cx={x(targetDistanceMeters)}
        cy={PLOT.bottom}
        fill="rgb(237 159 68 / 18%)"
        r={Math.max(
          9,
          (targetRadiusMeters / maxDistanceMeters) *
            (PLOT.right - PLOT.left),
        )}
      />
      <circle
        cx={x(targetDistanceMeters)}
        cy={PLOT.bottom}
        fill="#ed9f44"
        r="6"
      />
      <text
        fill="#b8792b"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
        x={x(targetDistanceMeters)}
        y={PLOT.bottom - 18}
      >
        TARGET
      </text>
      {trajectory && path && (
        <>
          <path
            d={path}
            fill="none"
            stroke="#596be0"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <circle
            cx={x(trajectory.horizontalRangeMeters)}
            cy={PLOT.bottom}
            fill={Math.abs(
              trajectory.horizontalRangeMeters - targetDistanceMeters,
            ) <= targetRadiusMeters
              ? "#2aab83"
              : "#596be0"}
            r="6"
            stroke="#fff"
            strokeWidth="2"
          />
        </>
      )}
      {!trajectory && (
        <text
          fill="#9aa1b1"
          fontSize="14"
          textAnchor="middle"
          x={(PLOT.left + PLOT.right) / 2}
          y={(PLOT.top + PLOT.bottom) / 2}
        >
          Enter a prediction, then launch to see your trajectory
        </text>
      )}
    </svg>
  );
}

export function ProjectileMasterPage() {
  const recordGameResult = useProgressStore((state) => state.recordGameResult);
  const [speedMetersPerSecond, setSpeedMetersPerSecond] = useState(
    INITIAL_SPEED_METERS_PER_SECOND,
  );
  const [angleDegrees, setAngleDegrees] = useState(INITIAL_ANGLE_DEGREES);
  const [prediction, setPrediction] = useState("");
  const [roundIndex, setRoundIndex] = useState(0);
  const [lifecycle, setLifecycle] = useState(createGameLifecycle);
  const [attemptCount, setAttemptCount] = useState(0);
  const [completedRounds, setCompletedRounds] = useState<boolean[]>(
    () => PROJECTILE_MASTER_ROUNDS.map(() => false),
  );
  const [score, setScore] = useState(createScoreState);
  const [lastShot, setLastShot] = useState<CompletedShot | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const round = PROJECTILE_MASTER_ROUNDS[roundIndex];
  const roundHasBeenHit = completedRounds[roundIndex];
  const completedRoundCount = completedRounds.filter(Boolean).length;
  const objective = updateGameObjective(
    createGameObjective({
      id: "hit-targets",
      title: "Reach every target",
      description: "Land a projectile inside each target zone.",
      target: PROJECTILE_MASTER_ROUNDS.length,
      unit: "targets",
    }),
    completedRoundCount,
  );
  const isPlaying = lifecycle.status === "playing";

  const sessionSnapshot: ProjectileSession | null =
    lifecycle.status === "playing" || lifecycle.status === "paused"
      ? {
          roundIndex,
          status: lifecycle.status,
          completedRounds,
          score,
          attemptCount,
          speedMetersPerSecond,
          angleDegrees,
          prediction,
        }
      : null;
  const restoreSession = useCallback((saved: ProjectileSession) => {
    setRoundIndex(saved.roundIndex);
    setCompletedRounds(saved.completedRounds);
    setScore(saved.score);
    setAttemptCount(saved.attemptCount);
    setSpeedMetersPerSecond(saved.speedMetersPerSecond);
    setAngleDegrees(saved.angleDegrees);
    setPrediction(saved.prediction);
    setLastShot(null);
    setShowHint(false);
    setErrorMessage(null);
    // Resumed games wait for the learner to press Resume.
    setLifecycle({ status: "paused" });
  }, []);
  const session = useGameSession({
    gameId: PROJECTILE_MASTER_GAME.id,
    snapshot: sessionSnapshot,
    parse: parseProjectileSession,
    onRestore: restoreSession,
  });

  const handleLaunch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPlaying) {
      return;
    }

    const predictedRangeMeters = Number(prediction);

    if (
      prediction.trim() === "" ||
      !Number.isFinite(predictedRangeMeters) ||
      predictedRangeMeters < 0
    ) {
      setErrorMessage("Enter a non-negative range prediction before launching.");
      return;
    }

    try {
      const trajectory = calculateProjectileTrajectory({
        speedMetersPerSecond,
        angleDegrees,
      });
      const result = scoreProjectileShot(
        trajectory,
        round.targetDistanceMeters,
        round.targetRadiusMeters,
        predictedRangeMeters,
      );
      setLastShot({ trajectory, result });
      setAttemptCount((count) => count + 1);
      setErrorMessage(null);

      if (result.hit) {
        setCompletedRounds((rounds) =>
          rounds.map((isComplete, index) =>
            index === roundIndex ? true : isComplete,
          ),
        );
        const nextScore = recordScore(
          score,
          {
            id: round.id,
            label: round.title,
            points: result.score,
          },
          "best",
        );
        setScore(nextScore);
        if (roundIndex === PROJECTILE_MASTER_ROUNDS.length - 1) {
          setLifecycle((current) =>
            transitionGameLifecycle(current, "complete"),
          );
          void recordGameResult({
            gameId: PROJECTILE_MASTER_GAME.id,
            score: nextScore.totalPoints,
            difficulty: PROJECTILE_MASTER_GAME.difficulty,
            completionStatus: "completed",
            completedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The projectile trajectory could not be calculated.",
      );
    }
  };

  const handleNextRound = () => {
    if (!roundHasBeenHit || roundIndex >= PROJECTILE_MASTER_ROUNDS.length - 1) {
      return;
    }
    setRoundIndex((index) => index + 1);
    setLastShot(null);
    setPrediction("");
    setShowHint(false);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setSpeedMetersPerSecond(INITIAL_SPEED_METERS_PER_SECOND);
    setAngleDegrees(INITIAL_ANGLE_DEGREES);
    setPrediction("");
    setRoundIndex(0);
    setLifecycle((current) => transitionGameLifecycle(current, "reset"));
    setAttemptCount(0);
    setCompletedRounds(PROJECTILE_MASTER_ROUNDS.map(() => false));
    setScore(createScoreState());
    setLastShot(null);
    setShowHint(false);
    setErrorMessage(null);
  };

  const handleLifecycleAction = (action: "start" | "pause" | "resume") => {
    setLifecycle((current) => transitionGameLifecycle(current, action));
  };

  return (
    <div className="game-page">
      <header className="game-page__header">
        <div>
          <p className="eyebrow">MECHANICS · TARGET CHALLENGE</p>
          <h1>{PROJECTILE_MASTER_GAME.title}</h1>
          <p className="game-page__intro">
            {PROJECTILE_MASTER_GAME.introduction}
          </p>
        </div>
        <span className="trajectory-lab__model-tag">
          IDEAL PROJECTILE MOTION
        </span>
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
                ? PROJECTILE_MASTER_ROUNDS.length
                : roundIndex + 1,
            total: PROJECTILE_MASTER_ROUNDS.length,
          },
          {
            label: "OBJECTIVES",
            value: completedRoundCount,
            total: PROJECTILE_MASTER_ROUNDS.length,
          },
          { label: "SHOTS", value: attemptCount },
        ]}
        status={lifecycle.status}
      />

      <div className="game-engine-overview">
        <GameObjectiveList objectives={[objective]} />
        <GameScoreSummary score={score} title="Best score" />
      </div>

      <div className="game-page__layout">
        <section
          aria-labelledby="projectile-plot-title"
          className="trajectory-visual projectile-visual"
        >
          <div className="trajectory-visual__heading">
            <div>
              <span className="trajectory-visual__eyebrow">
                {lifecycle.status === "completed"
                  ? "ALL TARGETS CLEARED"
                  : `ROUND ${roundIndex + 1}`}
              </span>
              <h2 id="projectile-plot-title">
                {lifecycle.status === "completed"
                  ? "Challenge complete"
                  : round.title}
              </h2>
            </div>
            <span
              aria-label={`Target at ${round.targetDistanceMeters} meters`}
              className="projectile-target-label"
            >
              {round.targetDistanceMeters} m target
            </span>
          </div>
          {lifecycle.status === "paused" && (
            <p className="game-paused-message" role="status">
              Game paused. Resume when you are ready to continue.
            </p>
          )}
          <div className="projectile-plot-wrap">
            <ProjectilePlot
              targetDistanceMeters={round.targetDistanceMeters}
              targetRadiusMeters={round.targetRadiusMeters}
              title={
                lastShot
                  ? `Projectile trajectory, range ${formatNumber(lastShot.trajectory.horizontalRangeMeters)} meters, target at ${round.targetDistanceMeters} meters`
                  : `Projectile target at ${round.targetDistanceMeters} meters; launch a shot to reveal its trajectory`
              }
              trajectory={lastShot?.trajectory ?? null}
            />
          </div>

          <div aria-live="polite" className="game-measurements">
            <div className="game-measurement">
              <span>RANGE</span>
              <strong>
                {lastShot
                  ? `${formatNumber(lastShot.trajectory.horizontalRangeMeters)} m`
                  : "—"}
              </strong>
            </div>
            <div className="game-measurement">
              <span>FLIGHT TIME</span>
              <strong>
                {lastShot
                  ? `${formatNumber(lastShot.trajectory.flightTimeSeconds, 2)} s`
                  : "—"}
              </strong>
            </div>
            <div className="game-measurement">
              <span>MAX HEIGHT</span>
              <strong>
                {lastShot
                  ? `${formatNumber(lastShot.trajectory.maximumHeightMeters)} m`
                  : "—"}
              </strong>
            </div>
            <div className="game-measurement">
              <span>MISS DISTANCE</span>
              <strong>
                {lastShot
                  ? `${formatNumber(lastShot.result.missDistanceMeters)} m`
                  : "—"}
              </strong>
            </div>
          </div>

          {lastShot && (
            <p
              aria-live="polite"
              className={
                lastShot.result.hit
                  ? "game-result game-result--hit"
                  : "game-result"
              }
              role="status"
            >
              {lastShot.result.hit
                ? `Target hit! ${lastShot.result.score} points — ${lastShot.result.accuracyPoints} for accuracy and ${lastShot.result.predictionPoints} for your prediction.`
                : `Missed by ${formatNumber(lastShot.result.missDistanceMeters)} m. Adjust your launch and try again.`}
            </p>
          )}
          {lifecycle.status === "completed" && (
            <div className="game-complete" role="status">
              <strong>Every target reached.</strong>
              <span>
                You scored {score.totalPoints} points across {attemptCount}{" "}
                shots.
              </span>
            </div>
          )}
        </section>

        <aside aria-label="Game controls" className="trajectory-controls projectile-controls">
          <div className="trajectory-controls__heading">
            <div>
              <span className="trajectory-visual__eyebrow">YOUR LAUNCH</span>
              <h2>Set up the shot</h2>
            </div>
            <span aria-hidden="true" className="trajectory-controls__spark">
              ↗
            </span>
          </div>

          <p className="game-instructions">
            {PROJECTILE_MASTER_GAME.instructions}
          </p>
          <GameLifecycleControls
            onPause={() => handleLifecycleAction("pause")}
            onReset={handleReset}
            onResume={() => handleLifecycleAction("resume")}
            onStart={() => handleLifecycleAction("start")}
            resetLabel="Play again"
            status={lifecycle.status}
          />
          <form onSubmit={handleLaunch}>
            <label className="lab-control" htmlFor="projectile-prediction">
              <span className="lab-control__heading">
                <span>Your range prediction</span>
                <output htmlFor="projectile-prediction">
                  Before the launch
                </output>
              </span>
              <span className="game-number-input">
                <input
                  aria-label="Your range prediction in meters"
                  disabled={!isPlaying}
                  id="projectile-prediction"
                  inputMode="decimal"
                  max="200"
                  min="0"
                  onChange={(event) => {
                    setPrediction(event.currentTarget.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. 32"
                  step="0.1"
                  type="number"
                  value={prediction}
                />
                <span>m</span>
              </span>
            </label>
            <RangeControl
              displayValue={`${angleDegrees}°`}
              disabled={!isPlaying}
              id="projectile-angle"
              label="Launch angle"
              maximum={80}
              minimum={10}
              onChange={setAngleDegrees}
              step={1}
              value={angleDegrees}
            />
            <RangeControl
              displayValue={`${formatNumber(speedMetersPerSecond)} m/s`}
              disabled={!isPlaying}
              id="projectile-speed"
              label="Launch speed"
              maximum={30}
              minimum={8}
              onChange={setSpeedMetersPerSecond}
              step={0.5}
              value={speedMetersPerSecond}
            />
            {errorMessage && (
              <p className="game-error" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="game-actions">
              <button
                className="lab-button lab-button--primary"
                disabled={!isPlaying || roundHasBeenHit}
                type="submit"
              >
                {roundHasBeenHit ? "Target reached" : "Launch projectile"}
              </button>
              {roundHasBeenHit &&
                roundIndex < PROJECTILE_MASTER_ROUNDS.length - 1 && (
                  <button
                    className="lab-button lab-button--secondary"
                    onClick={handleNextRound}
                    type="button"
                  >
                    Next target
                  </button>
                )}
            </div>
          </form>

          {!roundHasBeenHit && lifecycle.status !== "completed" && (
            <GameHint
              disabled={!isPlaying}
              hint={round.hint}
              onToggle={() => setShowHint((visible) => !visible)}
              visible={showHint}
            />
          )}

          <div className="game-formula">
            <span>RANGE FORMULA</span>
            <strong>{PROJECTILE_MASTER_GAME.formula}</strong>
            <p>
              <i>v</i> is launch speed, <i>θ</i> is launch angle, and{" "}
              <i>g</i> is gravity.
            </p>
          </div>
        </aside>
      </div>

      <section
        aria-labelledby="projectile-learning-title"
        className="game-learning"
      >
        <div>
          <p className="eyebrow">THE PHYSICS</p>
          <h2 id="projectile-learning-title">Why does the range change?</h2>
          <p>{PROJECTILE_MASTER_GAME.explanation}</p>
        </div>
        <div className="game-learning__note">
          <strong>Model assumptions</strong>
          <p>{PROJECTILE_MASTER_GAME.assumptions}</p>
        </div>
      </section>
    </div>
  );
}
