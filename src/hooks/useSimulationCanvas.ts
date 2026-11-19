import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  SimulationEngine,
  type SimulationEngineOptions,
  type SimulationModel,
  type SimulationSnapshot,
} from "../simulation/engine";
import {
  REDUCED_MOTION_RENDER_INTERVAL_SECONDS,
  usePrefersReducedMotion,
} from "./usePrefersReducedMotion";

const REACT_UPDATE_INTERVAL_MS = 100;

export interface UseSimulationCanvasOptions<State, Parameters> {
  readonly model: SimulationModel<State, Parameters>;
  readonly initialParameters: Parameters;
  readonly initialSnapshot: SimulationSnapshot<State, Parameters>;
  readonly engineOptions: Omit<
    SimulationEngineOptions<State, Parameters>,
    "onRender"
  >;
  /**
   * Seconds between frames when the learner prefers reduced motion. Defaults to one
   * second; real-time games use a shorter, still calmer interval so they stay playable.
   */
  readonly reducedMotionIntervalSeconds?: number;
  /** Draws one frame. Must not touch React state; errors are surfaced as `canvasError`. */
  readonly draw: (
    canvas: HTMLCanvasElement,
    snapshot: SimulationSnapshot<State, Parameters>,
  ) => void;
}

export interface SimulationCanvasControls<State, Parameters> {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Snapshot mirrored into React, throttled while the simulation runs. */
  readonly snapshot: SimulationSnapshot<State, Parameters>;
  readonly canvasError: string | null;
  /** True when the canvas shows stepped snapshots because the learner prefers reduced motion. */
  readonly reducedMotion: boolean;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
  readonly setParameters: (parameters: Parameters, reset?: boolean) => void;
  /** Changes the physics step and playback speed; resets the simulation. */
  readonly setTiming: (timing: { readonly fixedTimeStepSeconds: number; readonly timeScale: number }) => void;
}

/**
 * Owns a SimulationEngine for a canvas: creates it on mount, renders each
 * animation frame outside React, throttles React updates, redraws on resize,
 * and disposes everything on unmount.
 */
export function useSimulationCanvas<State, Parameters>(
  options: UseSimulationCanvasOptions<State, Parameters>,
): SimulationCanvasControls<State, Parameters> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SimulationEngine<State, Parameters> | null>(null);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });
  const [snapshot, setSnapshot] = useState(options.initialSnapshot);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const { model, initialParameters, engineOptions } = optionsRef.current;
    const engine = new SimulationEngine(model, initialParameters, {
      ...engineOptions,
      renderIntervalSeconds: reducedMotionRef.current
        ? (optionsRef.current.reducedMotionIntervalSeconds ?? REDUCED_MOTION_RENDER_INTERVAL_SECONDS)
        : (engineOptions.renderIntervalSeconds ?? 0),
      onRender: (nextSnapshot) => {
        try {
          optionsRef.current.draw(canvas, nextSnapshot);
        } catch (error) {
          setCanvasError(
            error instanceof Error
              ? error.message
              : "The simulation could not be drawn.",
          );
          throw error;
        }
      },
    });
    engineRef.current = engine;

    let lastReactUpdateTime = 0;
    let lastStatus: string | null = null;
    const unsubscribe = engine.subscribe((nextSnapshot) => {
      const currentTime = performance.now();
      if (
        nextSnapshot.status !== lastStatus ||
        nextSnapshot.status !== "running" ||
        currentTime - lastReactUpdateTime >= REACT_UPDATE_INTERVAL_MS
      ) {
        lastReactUpdateTime = currentTime;
        lastStatus = nextSnapshot.status;
        setSnapshot(nextSnapshot);
      }
    });

    const redraw = () => {
      try {
        optionsRef.current.draw(canvas, engine.getSnapshot());
      } catch (error) {
        setCanvasError(
          error instanceof Error
            ? error.message
            : "The simulation could not be drawn.",
        );
      }
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(redraw);
    if (resizeObserver) {
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", redraw);
    }
    engine.reset();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", redraw);
      unsubscribe();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    engineRef.current?.setRenderIntervalSeconds(
      reducedMotion
        ? (optionsRef.current.reducedMotionIntervalSeconds ?? REDUCED_MOTION_RENDER_INTERVAL_SECONDS)
        : (optionsRef.current.engineOptions.renderIntervalSeconds ?? 0),
    );
  }, [reducedMotion]);

  const start = useCallback(() => engineRef.current?.start(), []);
  const pause = useCallback(() => engineRef.current?.pause(), []);
  const resume = useCallback(() => engineRef.current?.resume(), []);
  const reset = useCallback(() => {
    engineRef.current?.reset();
    setCanvasError(null);
  }, []);
  const setParameters = useCallback(
    (parameters: Parameters, resetState = true) => {
      engineRef.current?.setParameters(parameters, { reset: resetState });
    },
    [],
  );

  const setTiming = useCallback(
    (timing: { readonly fixedTimeStepSeconds: number; readonly timeScale: number }) => {
      engineRef.current?.pause();
      engineRef.current?.setTiming(timing);
    },
    [],
  );

  return {
    canvasRef,
    snapshot,
    canvasError,
    reducedMotion,
    start,
    pause,
    resume,
    reset,
    setParameters,
    setTiming,
  };
}
