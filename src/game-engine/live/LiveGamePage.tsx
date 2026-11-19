import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Link, useInRouterContext } from "react-router-dom";
import { MeasurementGrid, RangeControl } from "../../components/common";
import { useSimulationCanvas } from "../../hooks/useSimulationCanvas";
import { playEffect } from "../../services/audio/tonePlayer";
import type { SimulationSnapshot } from "../../simulation/engine";
import { useProgressStore } from "../../store/progressStore";
import type { GameDifficulty } from "../../types/progress";
import { StarRating } from "../components";
import { createLiveModel, defaultLiveParameters, inputFromParameters } from "./liveModel";
import type { LiveEngineState, LiveGameDefinition, LiveParameters } from "./liveTypes";

const DIFFICULTIES: readonly GameDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

function drawLive<State>(
  canvas: HTMLCanvasElement,
  snapshot: SimulationSnapshot<LiveEngineState<State>, LiveParameters>,
  definition: LiveGameDefinition<State>,
): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) {
    return;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("A 2D canvas context is required to draw the game.");
  }
  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f9faff";
  context.fillRect(0, 0, width, height);
  definition.draw(context, snapshot.state.game, inputFromParameters(snapshot.parameters), width, height, snapshot.parameters.level);
}

/**
 * Page for a real-time game: canvas, live sliders, actions with keyboard and touch,
 * start/pause/reset, levels, outcome with stars, and the physics explained.
 */
export function LiveGamePage<State>({ definition }: { readonly definition: LiveGameDefinition<State> }) {
  const model = useMemo(() => createLiveModel(definition), [definition]);
  const [level, setLevel] = useState(0);
  const [parameters, setParameters] = useState<LiveParameters>(() => defaultLiveParameters(definition, 0));
  const [levelStars, setLevelStars] = useState<number[]>(() => definition.levels.map(() => 0));
  const recordGameResult = useProgressStore((state) => state.recordGameResult);
  const inRouter = useInRouterContext();
  const recordedRef = useRef<string | null>(null);

  const initialSnapshot = useMemo(
    () => ({
      state: model.createInitialState(defaultLiveParameters(definition, 0)),
      parameters: defaultLiveParameters(definition, 0),
      status: "ready" as const,
      timeSeconds: 0,
      droppedTimeSeconds: 0,
      error: null,
    }),
    [definition, model],
  );

  const { canvasRef, snapshot, canvasError, reducedMotion, start, pause, resume, reset, setParameters: setEngineParameters } =
    useSimulationCanvas({
      model,
      initialParameters: initialSnapshot.parameters,
      initialSnapshot,
      engineOptions: { ...definition.timing, maxFrameDeltaSeconds: 0.1, maxSubSteps: definition.timing.maxSubSteps ?? 64 },
      reducedMotionIntervalSeconds: 0.25,
      draw: (canvas, current) => drawLive(canvas, current, definition),
    });

  const apply = (next: LiveParameters, resetRun = false) => {
    setParameters(next);
    setEngineParameters(next, resetRun);
  };

  const verdict = snapshot.state.verdict;
  const running = snapshot.status === "running";
  const finished = snapshot.status === "completed";

  // Stars for the level just won are derived during render; they are kept when the
  // learner moves on (in event handlers), so the effect below only talks to the store.
  const currentWinStars = finished && verdict.status === "won" ? definition.stars(snapshot.state.game, snapshot.parameters.level) : 0;
  const shownStars = levelStars.map((value, index) => (index === snapshot.parameters.level ? Math.max(value, currentWinStars) : value));

  // Sounds, and the game result once every level has been won.
  useEffect(() => {
    if (!finished) {
      recordedRef.current = null;
      return;
    }
    const key = `${snapshot.parameters.level}:${snapshot.timeSeconds}`;
    if (recordedRef.current === key) {
      return;
    }
    recordedRef.current = key;
    if (verdict.status === "lost") {
      playEffect("miss");
      return;
    }
    if (shownStars.every((value) => value > 0)) {
      playEffect("complete");
      const total = shownStars.reduce((sum, value) => sum + value, 0);
      void recordGameResult({
        gameId: definition.id,
        score: total * 100,
        difficulty: DIFFICULTIES[Math.min(2, definition.levels.length - 1)] as GameDifficulty,
        completionStatus: "completed",
        completedAt: new Date().toISOString(),
        stars: total,
        maxStars: definition.levels.length * 3,
      });
    } else {
      playEffect("success");
    }
  }, [finished, verdict.status, snapshot, definition, shownStars, recordGameResult]);

  const keepStars = () => setLevelStars(shownStars);

  const chooseLevel = (index: number) => {
    keepStars();
    setLevel(index);
    apply(defaultLiveParameters(definition, index), true);
  };

  const press = (id: string) => {
    if (snapshot.status === "ready") {
      start();
    }
    apply({ ...parameters, presses: { ...parameters.presses, [id]: (parameters.presses[id] ?? 0) + 1 } });
  };

  const hold = (id: string, down: boolean) => {
    if (down && snapshot.status === "ready") {
      start();
    }
    const held = new Set(parameters.held);
    if (down) {
      held.add(id);
    } else {
      held.delete(id);
    }
    if (held.size !== parameters.held.length || down !== parameters.held.includes(id)) {
      apply({ ...parameters, held: [...held] });
    }
  };

  // Game keys work anywhere on the page except while typing in or operating a form
  // control, which keeps buttons, sliders and links fully keyboard accessible.
  const keyHandler = useRef<(event: globalThis.KeyboardEvent, down: boolean) => void>(() => undefined);
  useEffect(() => {
    keyHandler.current = (event, down) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("input, select, textarea, button, a, [contenteditable='true']")) {
        return;
      }
      const action = definition.actions.find((candidate) => candidate.keys.includes(event.key));
      if (!action || finished) {
        return;
      }
      event.preventDefault();
      if (action.hold) {
        hold(action.id, down);
      } else if (down && !event.repeat) {
        press(action.id);
      }
    };
  });
  useEffect(() => {
    const down = (event: globalThis.KeyboardEvent) => keyHandler.current(event, true);
    const up = (event: globalThis.KeyboardEvent) => keyHandler.current(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const onPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!definition.onDrag || (event.type === "pointermove" && event.buttons === 0)) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) {
      return;
    }
    const x = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, 1 - (event.clientY - box.top) / box.height));
    apply({ ...parameters, values: { ...parameters.values, ...definition.onDrag(x, y, parameters.values, level) } });
  };

  const input = inputFromParameters(snapshot.parameters);
  const totalStars = shownStars.reduce((sum, value) => sum + value, 0);
  const relatedPath = definition.relatedGameId ? `/worlds/${definition.worldId}/${definition.relatedGameId}` : null;

  return (
    <div className="game-page live-game">
      <header className="game-page__header">
        <div>
          <p className="eyebrow">{definition.eyebrow} · LIVE</p>
          <h1>{definition.title}</h1>
          <p className="game-page__intro">{definition.introduction}</p>
        </div>
        <span className="trajectory-lab__model-tag">{definition.modelTag}</span>
      </header>

      <div aria-label="Levels" className="live-game__levels" role="group">
        {definition.levels.map((candidate, index) => (
          <button
            aria-pressed={index === level}
            className={`lab-mode__option${index === level ? " lab-mode__option--active" : ""}`}
            key={candidate.id}
            onClick={() => chooseLevel(index)}
            type="button"
          >
            {index + 1}. {candidate.title} {shownStars[index] ? `(${shownStars[index]}★)` : ""}
          </button>
        ))}
        <StarRating label="stars in total" max={definition.levels.length * 3} stars={totalStars} />
      </div>

      <div className="game-page__layout">
        <section aria-labelledby="live-goal" className="trajectory-visual">
          <h2 id="live-goal">{definition.levels[level]?.title}</h2>
          <p className="balance-situation">{definition.levels[level]?.goal}</p>
          <div className="live-game__stage">
            <canvas
              aria-describedby="live-description live-help"
              aria-label={`${definition.title} simulation`}
              className="trajectory-canvas live-game__canvas"
              onPointerDown={onPointer}
              onPointerMove={onPointer}
              ref={canvasRef}
              role="img"
            />
          </div>
          <p className="visually-hidden" id="live-description">
            {definition.describe(snapshot.state.game, input, snapshot.parameters.level)}
          </p>
          {reducedMotion && (
            <p className="trajectory-lab__motion-note">
              Reduced motion is on: the picture updates four times a second. The physics is unchanged, and the
              classic round-based version plays without any animation.
            </p>
          )}
          {canvasError && <p className="lab-error" role="alert">Visualization error: {canvasError}</p>}
          <MeasurementGrid items={definition.readouts(snapshot.state.game, input, snapshot.parameters.level)} />
          {definition.extras?.(snapshot.state.game, input, snapshot.parameters.level)}
          <p aria-live="polite" className={verdict.status === "won" ? "game-result game-result--hit" : "game-result"} role="status">
            {finished
              ? `${verdict.status === "won" ? "Level complete! " : "Mission failed. "}${verdict.message}`
              : snapshot.status === "ready"
                ? "Ready. Press Start or an action to begin."
                : verdict.message}
          </p>
          {finished && verdict.status === "won" && (
            <p>
              <StarRating max={3} stars={definition.stars(snapshot.state.game, snapshot.parameters.level)} />{" "}
              {level < definition.levels.length - 1 && (
                <button className="lab-button lab-button--primary" onClick={() => chooseLevel(level + 1)} type="button">
                  Next level
                </button>
              )}
            </p>
          )}
        </section>

        <aside aria-label="Controls" className="trajectory-controls">
          <h2>Controls</h2>
          <p className="game-instructions" id="live-help">{definition.howToPlay}</p>
          <div className="game-actions">
            <button
              className="lab-button lab-button--primary"
              onClick={() => (running ? pause() : snapshot.status === "paused" ? resume() : snapshot.status === "ready" ? start() : undefined)}
              disabled={finished || snapshot.status === "error"}
              type="button"
            >
              {running ? "Pause" : snapshot.status === "paused" ? "Resume" : "Start"}
            </button>
            <button className="lab-button lab-button--secondary" onClick={() => { keepStars(); reset(); apply({ ...parameters, held: [] }, true); }} type="button">
              {verdict.status === "lost" ? "Try again" : "Reset"}
            </button>
          </div>
          {definition.sliders(level).map((slider) => (
            <RangeControl
              displayValue={`${(parameters.values[slider.key] ?? slider.initial).toFixed(Math.max(0, Math.min(4, Math.ceil(-Math.log10(slider.step) - 1e-9))))} ${slider.unit}`.trim()}
              id={`live-${slider.key}`}
              key={slider.key}
              label={slider.label}
              maximum={slider.maximum}
              minimum={slider.minimum}
              onChange={(value) => apply({ ...parameters, values: { ...parameters.values, [slider.key]: value } })}
              step={slider.step}
              value={parameters.values[slider.key] ?? slider.initial}
            />
          ))}
          <div className="live-game__actions">
            {definition.actions.map((action) =>
              action.hold ? (
                <button
                  aria-pressed={parameters.held.includes(action.id)}
                  className="lab-button live-game__action"
                  disabled={finished}
                  key={action.id}
                  onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && (event.preventDefault(), hold(action.id, true))}
                  onKeyUp={(event) => (event.key === "Enter" || event.key === " ") && hold(action.id, false)}
                  onPointerCancel={() => hold(action.id, false)}
                  onPointerDown={() => hold(action.id, true)}
                  onPointerLeave={() => hold(action.id, false)}
                  onPointerUp={() => hold(action.id, false)}
                  type="button"
                >
                  {action.label} (hold · {action.keys[0] === " " ? "Space" : action.keys[0]})
                </button>
              ) : (
                <button className="lab-button live-game__action" disabled={finished} key={action.id} onClick={() => press(action.id)} type="button">
                  {action.label} ({action.keys[0] === " " ? "Space" : action.keys[0]})
                </button>
              ),
            )}
          </div>
          {relatedPath && (
            <p className="game-instructions">
              {inRouter ? (
                <Link className="text-link" to={relatedPath}>Play the classic round-based version</Link>
              ) : (
                <a className="text-link" href={relatedPath}>Play the classic round-based version</a>
              )}
            </p>
          )}
        </aside>
      </div>

      <section aria-labelledby="live-physics" className="game-learning">
        <div>
          <p className="eyebrow">THE PHYSICS</p>
          <h2 id="live-physics">What is going on?</h2>
          <p>{definition.physics}</p>
        </div>
        <div className="game-learning__note">
          <strong>Model assumptions</strong>
          <p>{definition.assumptions}</p>
        </div>
      </section>
    </div>
  );
}
