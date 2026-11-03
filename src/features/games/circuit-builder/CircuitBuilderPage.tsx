import { useCallback, useState, type FormEvent } from "react";
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
import { useProgressStore } from "../../../store/progressStore";
import { CircuitDiagram } from "./CircuitDiagram";
import {
  CIRCUIT_BUILDER_GAME,
  CIRCUIT_BUILDER_ROUNDS,
  MAX_RESISTORS_PER_STAGE,
  MAX_STAGES,
  type CircuitRound,
} from "./circuitBuilderData";
import {
  describeTarget,
  evaluateCircuitAttempt,
  getTargetResistanceOhms,
  type CircuitAttemptResult,
} from "./circuitBuilderModel";

/** Stages as edited by the player; unlike a solved layout, a stage may be empty. */
type EditableLayout = number[][];

interface CircuitSession {
  readonly roundIndex: number;
  readonly status: "playing" | "paused";
  readonly completedRounds: boolean[];
  readonly score: ScoreState;
  readonly totalAttempts: number;
  readonly roundAttempts: number;
  readonly layout: EditableLayout;
  readonly prediction: string;
}

function parseLayout(raw: unknown, round: CircuitRound): EditableLayout | null {
  if (!Array.isArray(raw) || raw.length > MAX_STAGES) {
    return null;
  }
  const used = new Set<number>();
  const layout: EditableLayout = [];
  for (const stage of raw) {
    if (!Array.isArray(stage) || stage.length > MAX_RESISTORS_PER_STAGE) {
      return null;
    }
    for (const index of stage) {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= round.inventoryOhms.length ||
        used.has(index)
      ) {
        return null;
      }
      used.add(index);
    }
    layout.push([...stage]);
  }
  return layout;
}

function parseCircuitSession(raw: unknown): CircuitSession | null {
  if (!isRecord(raw)) {
    return null;
  }
  const roundIndex = readInteger(raw, "roundIndex", 0, CIRCUIT_BUILDER_ROUNDS.length - 1);
  const status = readPausableStatus(raw, "status");
  const completedRounds = readBooleanArray(raw, "completedRounds", CIRCUIT_BUILDER_ROUNDS.length);
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
  const layout = parseLayout(
    raw.layout,
    CIRCUIT_BUILDER_ROUNDS[roundIndex] as CircuitRound,
  );
  return layout === null
    ? null
    : { roundIndex, status, completedRounds, score, totalAttempts, roundAttempts, layout, prediction };
}

function formatAmperes(amperes: number): string {
  return `${(amperes * 1000).toFixed(1)} mA`;
}

function formatOhms(ohms: number): string {
  return `${Number(ohms.toFixed(1))} Ω`;
}

function describeOutcome(result: CircuitAttemptResult, round: CircuitRound): string {
  const rating = `${round.powerRatingWatts} W`;
  switch (result.outcome) {
    case "success":
      return `Circuit complete! ${result.score} points — ${result.accuracyPoints} for accuracy, ${result.predictionPoints} for your current prediction and ${result.attemptPoints} for your attempt count.`;
    case "overloaded":
      return `Overheated! ${result.overloadedResistors.length === 1 ? "A resistor" : `${result.overloadedResistors.length} resistors`} dissipated more than the ${rating} rating (P = V × I). Spread the voltage across more resistors.`;
    case "off-target":
      return `The circuit has ${formatOhms(result.solution.equivalentResistanceOhms)} but the target is ${formatOhms(result.targetResistanceOhms)} (${(result.resistanceError * 100).toFixed(1)}% off). Rearrange the resistors and try again.`;
  }
}

export function CircuitBuilderPage() {
  const recordGameResult = useProgressStore((state) => state.recordGameResult);
  const [roundIndex, setRoundIndex] = useState(0);
  const [layout, setLayout] = useState<EditableLayout>([]);
  const [selectedStage, setSelectedStage] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [lifecycle, setLifecycle] = useState(createGameLifecycle);
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [completedRounds, setCompletedRounds] = useState<boolean[]>(() =>
    CIRCUIT_BUILDER_ROUNDS.map(() => false),
  );
  const [score, setScore] = useState(createScoreState);
  const [result, setResult] = useState<CircuitAttemptResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const round = CIRCUIT_BUILDER_ROUNDS[roundIndex] as CircuitRound;
  const isPlaying = lifecycle.status === "playing";
  const roundIsComplete = completedRounds[roundIndex] === true;
  const isLastRound = roundIndex === CIRCUIT_BUILDER_ROUNDS.length - 1;
  const completedRoundCount = completedRounds.filter(Boolean).length;
  const usedResistors = new Set(layout.flat());
  const canEdit = isPlaying && !roundIsComplete;
  const objective = updateGameObjective(
    createGameObjective({
      id: "build-circuits",
      title: "Build every circuit",
      description: "Match each target without overheating a resistor.",
      target: CIRCUIT_BUILDER_ROUNDS.length,
      unit: "circuits",
    }),
    completedRoundCount,
  );

  const sessionSnapshot: CircuitSession | null =
    lifecycle.status === "playing" || lifecycle.status === "paused"
      ? {
          roundIndex,
          status: lifecycle.status,
          completedRounds,
          score,
          totalAttempts,
          roundAttempts,
          layout,
          prediction,
        }
      : null;
  const restoreSession = useCallback((saved: CircuitSession) => {
    setRoundIndex(saved.roundIndex);
    setCompletedRounds(saved.completedRounds);
    setScore(saved.score);
    setTotalAttempts(saved.totalAttempts);
    setRoundAttempts(saved.roundAttempts);
    setLayout(saved.layout);
    setSelectedStage(Math.max(0, saved.layout.length - 1));
    setPrediction(saved.prediction);
    setResult(null);
    setShowHint(false);
    setErrorMessage(null);
    // Resumed games wait for the learner to press Resume.
    setLifecycle({ status: "paused" });
  }, []);
  const session = useGameSession({
    gameId: CIRCUIT_BUILDER_GAME.id,
    snapshot: sessionSnapshot,
    parse: parseCircuitSession,
    onRestore: restoreSession,
  });

  const changeLayout = (next: EditableLayout, stage = selectedStage) => {
    setLayout(next);
    setSelectedStage(Math.min(stage, Math.max(next.length - 1, 0)));
    setResult(null);
    setErrorMessage(null);
  };

  const addResistor = (inventoryIndex: number) => {
    if (!canEdit || usedResistors.has(inventoryIndex)) {
      return;
    }
    if (layout.length === 0) {
      changeLayout([[inventoryIndex]], 0);
      return;
    }
    const stage = layout[selectedStage] ?? [];
    if (stage.length >= MAX_RESISTORS_PER_STAGE) {
      setErrorMessage(`A stage can hold at most ${MAX_RESISTORS_PER_STAGE} resistors.`);
      return;
    }
    changeLayout(
      layout.map((current, index) =>
        index === selectedStage ? [...current, inventoryIndex] : current,
      ),
    );
  };

  const removeResistor = (inventoryIndex: number) => {
    if (canEdit) {
      changeLayout(
        layout.map((stage) => stage.filter((index) => index !== inventoryIndex)),
      );
    }
  };

  const addStage = () => {
    if (!canEdit) {
      return;
    }
    if (layout.length >= MAX_STAGES) {
      setErrorMessage(`A circuit can have at most ${MAX_STAGES} stages.`);
      return;
    }
    changeLayout([...layout, []], layout.length);
  };

  const removeStage = (stageIndex: number) => {
    if (canEdit) {
      changeLayout(layout.filter((_, index) => index !== stageIndex));
    }
  };

  const handleClose = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    const predictedMilliamperes = Number(prediction);
    if (
      prediction.trim() === "" ||
      !Number.isFinite(predictedMilliamperes) ||
      predictedMilliamperes < 0
    ) {
      setErrorMessage("Enter a non-negative current prediction in milliamperes before closing the switch.");
      return;
    }

    try {
      const attemptNumber = roundAttempts + 1;
      const attempt = evaluateCircuitAttempt(
        round,
        layout,
        predictedMilliamperes / 1000,
        attemptNumber,
      );
      setResult(attempt);
      setRoundAttempts(attemptNumber);
      setTotalAttempts((count) => count + 1);
      setErrorMessage(null);

      if (attempt.outcome === "success") {
        const nextScore = recordScore(
          score,
          { id: round.id, label: round.title, points: attempt.score },
          "best",
        );
        setScore(nextScore);
        setCompletedRounds((rounds) =>
          rounds.map((done, index) => (index === roundIndex ? true : done)),
        );
        if (isLastRound) {
          setLifecycle((current) => transitionGameLifecycle(current, "complete"));
          void recordGameResult({
            gameId: CIRCUIT_BUILDER_GAME.id,
            score: nextScore.totalPoints,
            difficulty: round.difficulty,
            completionStatus: "completed",
            completedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The circuit could not be solved.",
      );
    }
  };

  const startRound = (index: number) => {
    setRoundIndex(index);
    setLayout([]);
    setSelectedStage(0);
    setPrediction("");
    setResult(null);
    setRoundAttempts(0);
    setShowHint(false);
    setErrorMessage(null);
  };

  const handleReset = () => {
    startRound(0);
    setLifecycle((current) => transitionGameLifecycle(current, "reset"));
    setTotalAttempts(0);
    setCompletedRounds(CIRCUIT_BUILDER_ROUNDS.map(() => false));
    setScore(createScoreState());
  };

  const handleLifecycleAction = (action: "start" | "pause" | "resume") => {
    setLifecycle((current) => transitionGameLifecycle(current, action));
  };

  const diagramLayout = layout;
  const solution = result?.solution ?? null;

  return (
    <div className="game-page">
      <header className="game-page__header">
        <div>
          <p className="eyebrow">ELECTRICITY & MAGNETISM · CIRCUITS</p>
          <h1>{CIRCUIT_BUILDER_GAME.title}</h1>
          <p className="game-page__intro">{CIRCUIT_BUILDER_GAME.introduction}</p>
        </div>
        <span className="trajectory-lab__model-tag">STEADY DC · IDEAL BATTERY</span>
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
                ? CIRCUIT_BUILDER_ROUNDS.length
                : roundIndex + 1,
            total: CIRCUIT_BUILDER_ROUNDS.length,
          },
          {
            label: "OBJECTIVES",
            value: completedRoundCount,
            total: CIRCUIT_BUILDER_ROUNDS.length,
          },
          { label: "SWITCH CLOSINGS", value: totalAttempts },
        ]}
        status={lifecycle.status}
      />

      <div className="game-engine-overview">
        <GameObjectiveList objectives={[objective]} />
        <GameScoreSummary score={score} title="Best score" />
      </div>

      <div className="game-page__layout">
        <section aria-labelledby="circuit-title" className="trajectory-visual">
          <div className="trajectory-visual__heading">
            <div>
              <span className="trajectory-visual__eyebrow">
                {lifecycle.status === "completed"
                  ? "ALL CIRCUITS BUILT"
                  : `ROUND ${roundIndex + 1} · ${round.difficulty.toUpperCase()}`}
              </span>
              <h2 id="circuit-title">
                {lifecycle.status === "completed" ? "Challenge complete" : round.title}
              </h2>
            </div>
            <span className="projectile-target-label">
              Target: {describeTarget(round)}
            </span>
          </div>
          <p className="balance-situation">{round.situation}</p>
          {lifecycle.status === "paused" && (
            <p className="game-paused-message" role="status">
              Game paused. Resume when you are ready to continue.
            </p>
          )}
          <div className="balance-plot-wrap">
            <CircuitDiagram
              layout={diagramLayout}
              overloaded={result?.overloadedResistors ?? []}
              round={round}
              solution={solution}
            />
          </div>

          <div aria-live="polite" className="game-measurements">
            <div className="game-measurement">
              <span>EQUIVALENT RESISTANCE</span>
              <strong>{solution ? formatOhms(solution.equivalentResistanceOhms) : "—"}</strong>
            </div>
            <div className="game-measurement">
              <span>TARGET RESISTANCE</span>
              <strong>{formatOhms(getTargetResistanceOhms(round))}</strong>
            </div>
            <div className="game-measurement">
              <span>TOTAL CURRENT</span>
              <strong>{solution ? formatAmperes(solution.totalCurrentAmperes) : "—"}</strong>
            </div>
            <div className="game-measurement">
              <span>TOTAL POWER</span>
              <strong>{solution ? `${solution.totalPowerWatts.toFixed(2)} W` : "—"}</strong>
            </div>
          </div>

          {solution && (
            <table className="circuit-readings">
              <caption>
                RESISTOR READINGS · RATING {round.powerRatingWatts} W EACH
              </caption>
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col">Resistance</th>
                  <th scope="col">Voltage</th>
                  <th scope="col">Current</th>
                  <th scope="col">Power</th>
                </tr>
              </thead>
              <tbody>
                {solution.resistors.map((reading, position) => (
                  <tr key={position}>
                    <td>{reading.stageIndex + 1}</td>
                    <td>{formatOhms(reading.resistanceOhms)}</td>
                    <td>{reading.voltageVolts.toFixed(2)} V</td>
                    <td>{formatAmperes(reading.currentAmperes)}</td>
                    <td>
                      {reading.powerWatts.toFixed(3)} W
                      {reading.powerWatts > round.powerRatingWatts * (1 + 1e-9)
                        ? " (over rating)"
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {result && (
            <p
              className={
                result.outcome === "success"
                  ? "game-result game-result--hit"
                  : "game-result"
              }
              role="status"
            >
              {describeOutcome(result, round)}
            </p>
          )}
          {lifecycle.status === "completed" && (
            <div className="game-complete" role="status">
              <strong>Every circuit built.</strong>
              <span>
                You scored {score.totalPoints} points over {totalAttempts} switch closings.
              </span>
            </div>
          )}
        </section>

        <aside aria-label="Game controls" className="trajectory-controls">
          <div className="trajectory-controls__heading">
            <div>
              <span className="trajectory-visual__eyebrow">YOUR CIRCUIT</span>
              <h2>Build and test</h2>
            </div>
            <span aria-hidden="true" className="trajectory-controls__spark">
              ⚡
            </span>
          </div>

          <p className="game-instructions">{CIRCUIT_BUILDER_GAME.instructions}</p>
          <GameLifecycleControls
            onPause={() => handleLifecycleAction("pause")}
            onReset={handleReset}
            onResume={() => handleLifecycleAction("resume")}
            onStart={() => handleLifecycleAction("start")}
            resetLabel="Play again"
            status={lifecycle.status}
          />

          <h3 className="circuit-heading" id="resistor-box-title">
            Resistor box
          </h3>
          <ul aria-labelledby="resistor-box-title" className="circuit-inventory">
            {round.inventoryOhms.map((ohms, inventoryIndex) => (
              <li key={inventoryIndex}>
                <button
                  aria-label={`Add ${ohms} ohm resistor`}
                  disabled={!canEdit || usedResistors.has(inventoryIndex)}
                  onClick={() => addResistor(inventoryIndex)}
                  type="button"
                >
                  {ohms} Ω
                </button>
              </li>
            ))}
          </ul>

          <h3 className="circuit-heading" id="stages-title">
            Series stages
          </h3>
          <ol aria-labelledby="stages-title" className="circuit-builder-stages">
            {layout.map((stage, stageIndex) => (
              <li
                className={
                  stageIndex === selectedStage
                    ? "circuit-stage circuit-stage--selected"
                    : "circuit-stage"
                }
                key={stageIndex}
              >
                <label>
                  <input
                    checked={stageIndex === selectedStage}
                    disabled={!canEdit}
                    name="target-stage"
                    onChange={() => setSelectedStage(stageIndex)}
                    type="radio"
                  />
                  Stage {stageIndex + 1}
                </label>
                {stage.length === 0 && <span>empty</span>}
                {stage.map((inventoryIndex) => (
                  <button
                    aria-label={`Remove ${round.inventoryOhms[inventoryIndex]} ohm resistor from stage ${stageIndex + 1}`}
                    className="circuit-chip"
                    disabled={!canEdit}
                    key={inventoryIndex}
                    onClick={() => removeResistor(inventoryIndex)}
                    type="button"
                  >
                    {round.inventoryOhms[inventoryIndex]} Ω ×
                  </button>
                ))}
                {stage.length === 0 && (
                  <button
                    aria-label={`Remove empty stage ${stageIndex + 1}`}
                    className="circuit-chip"
                    disabled={!canEdit}
                    onClick={() => removeStage(stageIndex)}
                    type="button"
                  >
                    Remove stage
                  </button>
                )}
              </li>
            ))}
          </ol>
          <button
            className="lab-button lab-button--secondary"
            disabled={!canEdit}
            onClick={addStage}
            type="button"
          >
            Add series stage
          </button>

          <form onSubmit={handleClose}>
            <label className="lab-control" htmlFor="circuit-prediction">
              <span className="lab-control__heading">
                <span>Your current prediction</span>
                <output htmlFor="circuit-prediction">Before closing the switch</output>
              </span>
              <span className="game-number-input">
                <input
                  aria-label="Your total current prediction in milliamperes"
                  disabled={!canEdit}
                  id="circuit-prediction"
                  inputMode="decimal"
                  max="10000"
                  min="0"
                  onChange={(event) => {
                    setPrediction(event.currentTarget.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. 30"
                  step="0.1"
                  type="number"
                  value={prediction}
                />
                <span>mA</span>
              </span>
            </label>
            {errorMessage && (
              <p className="game-error" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="game-actions">
              <button
                className="lab-button lab-button--primary"
                disabled={!canEdit}
                type="submit"
              >
                {roundIsComplete ? "Circuit complete" : "Close switch"}
              </button>
              {roundIsComplete && !isLastRound && (
                <button
                  className="lab-button lab-button--secondary"
                  onClick={() => startRound(roundIndex + 1)}
                  type="button"
                >
                  Next circuit
                </button>
              )}
            </div>
          </form>

          {!roundIsComplete && lifecycle.status !== "completed" && (
            <GameHint
              disabled={!isPlaying}
              hint={round.hint}
              onToggle={() => setShowHint((visible) => !visible)}
              visible={showHint}
            />
          )}

          <div className="game-formula">
            <span>OHM'S LAW AND POWER</span>
            <strong>{CIRCUIT_BUILDER_GAME.formula}</strong>
            <p>
              <i>V</i> is voltage in volts, <i>I</i> is current in amperes, <i>R</i> is
              resistance in ohms, and power is <i>P</i> = <i>V I</i> in watts.
            </p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="circuit-learning-title" className="game-learning">
        <div>
          <p className="eyebrow">THE PHYSICS</p>
          <h2 id="circuit-learning-title">Why do series and parallel behave differently?</h2>
          <p>{CIRCUIT_BUILDER_GAME.explanation}</p>
          <ul className="game-objectives-list">
            {CIRCUIT_BUILDER_GAME.learningObjectives.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
        <div className="game-learning__note">
          <strong>Model assumptions</strong>
          <p>{CIRCUIT_BUILDER_GAME.assumptions}</p>
        </div>
      </section>
    </div>
  );
}
