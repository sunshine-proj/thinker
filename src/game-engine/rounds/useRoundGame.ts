import { useCallback, useState } from "react";
import { useGameSession, type GameSessionControls } from "../../hooks/useGameSession";
import { useProgressStore } from "../../store/progressStore";
import { transitionGameLifecycle, createGameLifecycle } from "../core/GameLifecycle";
import {
  isRecord,
  readBooleanArray,
  readInteger,
  readPausableStatus,
  readScoreState,
  readString,
} from "../core/sessionParsing";
import { createGameObjective, updateGameObjective } from "../objectives/GameObjective";
import {
  createScoreState,
  recordScore,
  type ScoreState,
} from "../scoring/ScoringSystem";
import { scoreStandardAttempt, type StandardScore } from "../scoring/standardScoring";
import { MAX_HINT_LEVEL, MAX_STARS_PER_ROUND, calculateRoundStars, totalStars } from "../scoring/stars";
import type {
  AttemptOutcome,
  PredictionSpec,
  RoundBase,
  RoundGameDefinition,
} from "./types";

export interface AttemptRecord<Control, Outcome extends AttemptOutcome> {
  readonly control: Control;
  readonly outcome: Outcome;
  readonly points: StandardScore;
  /** Stars for this attempt when it solved the round. */
  readonly stars: number | null;
}

interface RoundSession<Control> {
  readonly roundIndex: number;
  readonly status: "playing" | "paused";
  readonly completedRounds: boolean[];
  readonly score: ScoreState;
  readonly totalAttempts: number;
  readonly roundAttempts: number;
  readonly control: Control;
  readonly prediction: string;
  readonly starsByRound?: number[];
}

export function useRoundGame<
  Round extends RoundBase,
  Control,
  Outcome extends AttemptOutcome,
>(definition: RoundGameDefinition<Round, Control, Outcome>) {
  const { rounds, meta } = definition;
  const recordGameResult = useProgressStore((state) => state.recordGameResult);
  const [roundIndex, setRoundIndex] = useState(0);
  const [control, setControlState] = useState<Control>(() =>
    definition.createControl(rounds[0] as Round),
  );
  const [prediction, setPredictionState] = useState("");
  const [lifecycle, setLifecycle] = useState(createGameLifecycle);
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [completedRounds, setCompletedRounds] = useState<boolean[]>(() =>
    rounds.map(() => false),
  );
  const [score, setScore] = useState(createScoreState);
  const [last, setLast] = useState<AttemptRecord<Control, Outcome> | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [starsByRound, setStarsByRound] = useState<number[]>(() => rounds.map(() => 0));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const round = rounds[roundIndex] as Round;
  const predictionSpec: PredictionSpec | null = definition.prediction(round);
  const isPlaying = lifecycle.status === "playing";
  const roundSolved = completedRounds[roundIndex] === true;
  const isLastRound = roundIndex === rounds.length - 1;
  const completedCount = completedRounds.filter(Boolean).length;
  const canEdit = isPlaying && !roundSolved;
  const objective = updateGameObjective(
    createGameObjective({
      id: `${meta.id}-objective`,
      title: meta.objective.title,
      description: meta.objective.description,
      target: rounds.length,
      unit: meta.objective.unit,
    }),
    completedCount,
  );

  const sessionSnapshot: RoundSession<Control> | null =
    lifecycle.status === "playing" || lifecycle.status === "paused"
      ? {
          roundIndex,
          status: lifecycle.status,
          completedRounds,
          score,
          totalAttempts,
          roundAttempts,
          control,
          prediction,
          starsByRound,
        }
      : null;

  const parseSession = useCallback(
    (raw: unknown): RoundSession<Control> | null => {
      if (!isRecord(raw)) {
        return null;
      }
      const index = readInteger(raw, "roundIndex", 0, rounds.length - 1);
      const status = readPausableStatus(raw, "status");
      const completed = readBooleanArray(raw, "completedRounds", rounds.length);
      const savedScore = readScoreState(raw, "score");
      const total = readInteger(raw, "totalAttempts", 0, 10_000);
      const attempts = readInteger(raw, "roundAttempts", 0, 10_000);
      const savedPrediction = readString(raw, "prediction");
      if (
        index === null || status === null || completed === null ||
        savedScore === null || total === null || attempts === null ||
        savedPrediction === null
      ) {
        return null;
      }
      const savedControl = definition.parseControl(raw.control, rounds[index] as Round);
      return savedControl === null
        ? null
        : {
            roundIndex: index,
            status,
            completedRounds: completed,
            score: savedScore,
            totalAttempts: total,
            roundAttempts: attempts,
            control: savedControl,
            prediction: savedPrediction,
            starsByRound: Array.isArray(raw.starsByRound) && raw.starsByRound.length === rounds.length && raw.starsByRound.every((value) => Number.isInteger(value) && value >= 0 && value <= MAX_STARS_PER_ROUND)
              ? (raw.starsByRound as number[])
              : rounds.map(() => 0),
          };
    },
    [definition, rounds],
  );

  const restoreSession = useCallback((saved: RoundSession<Control>) => {
    setRoundIndex(saved.roundIndex);
    setCompletedRounds(saved.completedRounds);
    setScore(saved.score);
    setTotalAttempts(saved.totalAttempts);
    setRoundAttempts(saved.roundAttempts);
    setControlState(saved.control);
    setPredictionState(saved.prediction);
    setStarsByRound(saved.starsByRound ?? rounds.map(() => 0));
    setLast(null);
    setHintLevel(0);
    setErrorMessage(null);
    // Resumed games wait for the learner to press Resume.
    setLifecycle({ status: "paused" });
  }, [rounds]);

  const session: GameSessionControls = useGameSession({
    gameId: meta.id,
    snapshot: sessionSnapshot,
    parse: parseSession,
    onRestore: restoreSession,
  });

  const setControl = (next: Control | ((current: Control) => Control)) => {
    setControlState(next);
    setLast(null);
    setErrorMessage(null);
  };

  const setPrediction = (value: string) => {
    setPredictionState(value);
    setErrorMessage(null);
  };

  const submit = () => {
    if (!canEdit) {
      return;
    }

    let predicted: number | null = null;
    if (predictionSpec) {
      predicted = Number(prediction);
      if (prediction.trim() === "" || !Number.isFinite(predicted) || predicted < 0) {
        setErrorMessage(
          `Enter a non-negative prediction in ${predictionSpec.unit} first.`,
        );
        return;
      }
    }

    try {
      const attemptNumber = roundAttempts + 1;
      const outcome = definition.evaluate(round, control, predicted, attemptNumber);
      const points = scoreStandardAttempt({
        success: outcome.success,
        accuracyFraction: outcome.accuracyFraction,
        predicted,
        predictionActual: outcome.predictionActual,
        attemptNumber,
      });
      const stars = outcome.success ? calculateRoundStars(points.score, hintLevel) : null;
      setLast({ control, outcome, points, stars });
      setRoundAttempts(attemptNumber);
      setTotalAttempts((count) => count + 1);
      setErrorMessage(null);

      if (!outcome.success && outcome.catastrophe) {
        setLifecycle((current) => transitionGameLifecycle(current, "fail"));
      }

      if (outcome.success) {
        const nextScore = recordScore(
          score,
          { id: round.id, label: round.title, points: points.score },
          "best",
        );
        setScore(nextScore);
        setCompletedRounds((done) =>
          done.map((value, index) => (index === roundIndex ? true : value)),
        );
        const nextStars = starsByRound.map((value, index) => (index === roundIndex ? Math.max(value, stars ?? 0) : value));
        setStarsByRound(nextStars);
        if (isLastRound) {
          setLifecycle((current) => transitionGameLifecycle(current, "complete"));
          void recordGameResult({
            gameId: meta.id,
            score: nextScore.totalPoints,
            difficulty: round.difficulty,
            completionStatus: "completed",
            completedAt: new Date().toISOString(),
            stars: totalStars(nextStars),
            maxStars: rounds.length * MAX_STARS_PER_ROUND,
          });
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "That setting could not be evaluated.",
      );
    }
  };

  const startRound = (index: number) => {
    setRoundIndex(index);
    setControlState(definition.createControl(rounds[index] as Round));
    setPredictionState("");
    setLast(null);
    setRoundAttempts(0);
    setHintLevel(0);
    setErrorMessage(null);
  };

  const nextRound = () => {
    if (roundSolved && !isLastRound) {
      startRound(roundIndex + 1);
    }
  };

  const reset = () => {
    startRound(0);
    setLifecycle((current) => transitionGameLifecycle(current, "reset"));
    setTotalAttempts(0);
    setCompletedRounds(rounds.map(() => false));
    setStarsByRound(rounds.map(() => 0));
    setScore(createScoreState());
  };

  const lifecycleAction = (action: "start" | "pause" | "resume" | "retry") =>
    setLifecycle((current) => transitionGameLifecycle(current, action));

  return {
    definition,
    round,
    roundIndex,
    control,
    setControl,
    prediction,
    setPrediction,
    predictionSpec,
    lifecycle,
    lifecycleAction,
    isPlaying,
    canEdit,
    roundSolved,
    isLastRound,
    completedCount,
    objective,
    roundAttempts,
    totalAttempts,
    score,
    last,
    /** Hint levels revealed this round: 0 none, 1 nudge, 2 formula, 3 worked step. */
    hintLevel,
    revealNextHint: () => setHintLevel((level) => Math.min(MAX_HINT_LEVEL, level + 1)),
    starsByRound,
    totalStars: totalStars(starsByRound),
    maxStars: rounds.length * MAX_STARS_PER_ROUND,
    errorMessage,
    submit,
    nextRound,
    reset,
    session,
  };
}

export type RoundGameState<
  Round extends RoundBase,
  Control,
  Outcome extends AttemptOutcome,
> = ReturnType<typeof useRoundGame<Round, Control, Outcome>>;
