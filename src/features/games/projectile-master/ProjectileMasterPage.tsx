import { useState, type FormEvent } from "react";
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

function RangeControl({
  id,
  label,
  value,
  minimum,
  maximum,
  step,
  displayValue,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
  readonly displayValue: string;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label className="lab-control" htmlFor={id}>
      <span className="lab-control__heading">
        <span>{label}</span>
        <output htmlFor={id}>{displayValue}</output>
      </span>
      <input
        id={id}
        max={maximum}
        min={minimum}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="range"
        value={value}
      />
      <span aria-hidden="true" className="lab-control__bounds">
        <span>{minimum}</span>
        <span>{maximum}</span>
      </span>
    </label>
  );
}

export function ProjectileMasterPage() {
  const [speedMetersPerSecond, setSpeedMetersPerSecond] = useState(
    INITIAL_SPEED_METERS_PER_SECOND,
  );
  const [angleDegrees, setAngleDegrees] = useState(INITIAL_ANGLE_DEGREES);
  const [prediction, setPrediction] = useState("");
  const [roundIndex, setRoundIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [completedRounds, setCompletedRounds] = useState<boolean[]>(
    () => PROJECTILE_MASTER_ROUNDS.map(() => false),
  );
  const [bestScores, setBestScores] = useState<number[]>(
    () => PROJECTILE_MASTER_ROUNDS.map(() => 0),
  );
  const [lastShot, setLastShot] = useState<CompletedShot | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const round = PROJECTILE_MASTER_ROUNDS[roundIndex];
  const roundHasBeenHit = completedRounds[roundIndex];
  const totalScore = bestScores.reduce((total, score) => total + score, 0);

  const handleLaunch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        setBestScores((scores) =>
          scores.map((score, index) =>
            index === roundIndex ? Math.max(score, result.score) : score,
          ),
        );
        if (roundIndex === PROJECTILE_MASTER_ROUNDS.length - 1) {
          setCompleted(true);
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
    setCompleted(false);
    setAttemptCount(0);
    setCompletedRounds(PROJECTILE_MASTER_ROUNDS.map(() => false));
    setBestScores(PROJECTILE_MASTER_ROUNDS.map(() => 0));
    setLastShot(null);
    setShowHint(false);
    setErrorMessage(null);
  };

  const status = completed
    ? "Completed"
    : attemptCount > 0
      ? "In progress"
      : "Ready";

  return (
    <div className="projectile-game">
      <header className="projectile-game__header">
        <div>
          <p className="eyebrow">MECHANICS · TARGET CHALLENGE</p>
          <h1>{PROJECTILE_MASTER_GAME.title}</h1>
          <p className="projectile-game__intro">
            {PROJECTILE_MASTER_GAME.introduction}
          </p>
        </div>
        <span className="trajectory-lab__model-tag">
          IDEAL PROJECTILE MOTION
        </span>
      </header>

      <section aria-label="Game progress" className="projectile-progress">
        <div className="projectile-progress__item">
          <span>ROUND</span>
          <strong>
            {completed
              ? PROJECTILE_MASTER_ROUNDS.length
              : roundIndex + 1}{" "}
            <span>/ {PROJECTILE_MASTER_ROUNDS.length}</span>
          </strong>
        </div>
        <div className="projectile-progress__item">
          <span>BEST SCORE</span>
          <strong>{totalScore}</strong>
        </div>
        <div className="projectile-progress__item">
          <span>SHOTS</span>
          <strong>{attemptCount}</strong>
        </div>
        <span
          aria-live="polite"
          className={`projectile-status projectile-status--${status.toLowerCase().replace(" ", "-")}`}
        >
          <span aria-hidden="true" />
          {status}
        </span>
      </section>

      <div className="projectile-game__layout">
        <section
          aria-labelledby="projectile-plot-title"
          className="trajectory-visual projectile-visual"
        >
          <div className="trajectory-visual__heading">
            <div>
              <span className="trajectory-visual__eyebrow">
                {completed ? "ALL TARGETS CLEARED" : `ROUND ${roundIndex + 1}`}
              </span>
              <h2 id="projectile-plot-title">
                {completed ? "Challenge complete" : round.title}
              </h2>
            </div>
            <span
              aria-label={`Target at ${round.targetDistanceMeters} meters`}
              className="projectile-target-label"
            >
              {round.targetDistanceMeters} m target
            </span>
          </div>
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

          <div aria-live="polite" className="projectile-measurements">
            <div className="projectile-measurement">
              <span>RANGE</span>
              <strong>
                {lastShot
                  ? `${formatNumber(lastShot.trajectory.horizontalRangeMeters)} m`
                  : "—"}
              </strong>
            </div>
            <div className="projectile-measurement">
              <span>FLIGHT TIME</span>
              <strong>
                {lastShot
                  ? `${formatNumber(lastShot.trajectory.flightTimeSeconds, 2)} s`
                  : "—"}
              </strong>
            </div>
            <div className="projectile-measurement">
              <span>MAX HEIGHT</span>
              <strong>
                {lastShot
                  ? `${formatNumber(lastShot.trajectory.maximumHeightMeters)} m`
                  : "—"}
              </strong>
            </div>
            <div className="projectile-measurement">
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
                  ? "projectile-result projectile-result--hit"
                  : "projectile-result"
              }
              role="status"
            >
              {lastShot.result.hit
                ? `Target hit! ${lastShot.result.score} points — ${lastShot.result.accuracyPoints} for accuracy and ${lastShot.result.predictionPoints} for your prediction.`
                : `Missed by ${formatNumber(lastShot.result.missDistanceMeters)} m. Adjust your launch and try again.`}
            </p>
          )}
          {completed && (
            <div className="projectile-complete" role="status">
              <strong>Every target reached.</strong>
              <span>
                You scored {totalScore} points across {attemptCount} shots.
                Reset to play again.
              </span>
            </div>
          )}
        </section>

        <aside className="trajectory-controls projectile-controls">
          <div className="trajectory-controls__heading">
            <div>
              <span className="trajectory-visual__eyebrow">YOUR LAUNCH</span>
              <h2>Set up the shot</h2>
            </div>
            <span aria-hidden="true" className="trajectory-controls__spark">
              ↗
            </span>
          </div>

          <p className="projectile-instructions">
            {PROJECTILE_MASTER_GAME.instructions}
          </p>
          <form onSubmit={handleLaunch}>
            <label className="lab-control" htmlFor="projectile-prediction">
              <span className="lab-control__heading">
                <span>Your range prediction</span>
                <output htmlFor="projectile-prediction">
                  Before the launch
                </output>
              </span>
              <span className="projectile-number-input">
                <input
                  aria-label="Your range prediction in meters"
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
              id="projectile-speed"
              label="Launch speed"
              maximum={30}
              minimum={8}
              onChange={setSpeedMetersPerSecond}
              step={0.5}
              value={speedMetersPerSecond}
            />
            {errorMessage && (
              <p className="projectile-error" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="projectile-actions">
              <button
                className="lab-button lab-button--primary"
                disabled={completed || roundHasBeenHit}
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
              {completed && (
                <button
                  className="lab-button lab-button--secondary"
                  onClick={handleReset}
                  type="button"
                >
                  Play again
                </button>
              )}
            </div>
          </form>

          {!roundHasBeenHit && !completed && (
            <button
              aria-expanded={showHint}
              className="projectile-hint-toggle"
              onClick={() => setShowHint((visible) => !visible)}
              type="button"
            >
              {showHint ? "Hide hint" : "Need a hint?"}
            </button>
          )}
          {showHint && !roundHasBeenHit && (
            <p className="projectile-hint">{round.hint}</p>
          )}

          <div className="projectile-formula">
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
        className="projectile-learning"
      >
        <div>
          <p className="eyebrow">THE PHYSICS</p>
          <h2 id="projectile-learning-title">Why does the range change?</h2>
          <p>{PROJECTILE_MASTER_GAME.explanation}</p>
        </div>
        <div className="projectile-learning__note">
          <strong>Model assumptions</strong>
          <p>{PROJECTILE_MASTER_GAME.assumptions}</p>
        </div>
      </section>
    </div>
  );
}
