import { assertFiniteNumber, assertPositive } from "../../physics/core";

export type SimulationStatus =
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "error"
  | "disposed";

export interface SimulationModel<State, Parameters> {
  createInitialState(parameters: Parameters): State;
  step(state: State, parameters: Parameters, timeStepSeconds: number): State;
  isComplete?(state: State, parameters: Parameters): boolean;
}

export interface SimulationSnapshot<State, Parameters> {
  readonly state: State;
  readonly parameters: Parameters;
  readonly status: SimulationStatus;
  readonly timeSeconds: number;
  readonly droppedTimeSeconds: number;
  readonly error: unknown | null;
}

export type SimulationListener<State, Parameters> = (
  snapshot: SimulationSnapshot<State, Parameters>,
) => void;

export interface SimulationScheduler {
  now(): number;
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(handle: number): void;
}

export interface SimulationEngineOptions<State, Parameters> {
  /** Fixed physics integration step in seconds. Defaults to 1/60 s. */
  fixedTimeStepSeconds?: number;
  /** Simulation seconds advanced per wall-clock second. Defaults to 1. */
  timeScale?: number;
  /** Maximum simulation time accepted from one frame in seconds. Defaults to 0.25 s. */
  maxFrameDeltaSeconds?: number;
  /** Maximum integration steps performed for a single rendered frame. Defaults to 8. */
  maxSubSteps?: number;
  scheduler?: SimulationScheduler;
  onRender?: (snapshot: SimulationSnapshot<State, Parameters>) => void;
  onError?: (error: unknown) => void;
}

const browserScheduler: SimulationScheduler = {
  now: () => {
    if (typeof performance === "undefined") {
      throw new Error("A monotonic clock is required to run the simulation.");
    }

    return performance.now();
  },
  requestFrame: (callback) => {
    if (typeof requestAnimationFrame !== "function") {
      throw new Error("requestAnimationFrame is not available in this environment.");
    }

    return requestAnimationFrame(callback);
  },
  cancelFrame: (handle) => {
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(handle);
    }
  },
};

/**
 * Runs a pure physics model at a fixed timestep and renders it on animation frames.
 *
 * Model state should be treated as immutable: `step` returns the next state
 * rather than mutating the state passed to it. All time values are in SI seconds.
 */
export class SimulationEngine<State, Parameters> {
  private state: State;
  private parameters: Parameters;
  private status: SimulationStatus = "ready";
  private timeSeconds = 0;
  private droppedTimeSeconds = 0;
  private accumulatorSeconds = 0;
  private lastFrameTimestamp: number | null = null;
  private frameHandle: number | null = null;
  private error: unknown | null = null;
  private readonly fixedTimeStepSeconds: number;
  private readonly timeScale: number;
  private readonly maxFrameDeltaSeconds: number;
  private readonly maxSubSteps: number;
  private readonly scheduler: SimulationScheduler;
  private readonly onRender?: SimulationEngineOptions<State, Parameters>["onRender"];
  private readonly onError?: SimulationEngineOptions<State, Parameters>["onError"];
  private readonly listeners = new Set<
    SimulationListener<State, Parameters>
  >();

  constructor(
    private readonly model: SimulationModel<State, Parameters>,
    parameters: Parameters,
    options: SimulationEngineOptions<State, Parameters> = {},
  ) {
    this.fixedTimeStepSeconds = options.fixedTimeStepSeconds ?? 1 / 60;
    this.timeScale = options.timeScale ?? 1;
    this.maxFrameDeltaSeconds = options.maxFrameDeltaSeconds ?? 0.25;
    this.maxSubSteps = options.maxSubSteps ?? 8;
    this.scheduler = options.scheduler ?? browserScheduler;
    this.onRender = options.onRender;
    this.onError = options.onError;

    assertPositive(this.fixedTimeStepSeconds, "fixedTimeStepSeconds");
    assertPositive(this.timeScale, "timeScale");
    assertPositive(this.maxFrameDeltaSeconds, "maxFrameDeltaSeconds");

    if (!Number.isSafeInteger(this.maxSubSteps) || this.maxSubSteps < 1) {
      throw new RangeError("maxSubSteps must be a positive safe integer.");
    }

    this.parameters = parameters;
    this.state = model.createInitialState(parameters);
  }

  getSnapshot(): SimulationSnapshot<State, Parameters> {
    return {
      state: this.state,
      parameters: this.parameters,
      status: this.status,
      timeSeconds: this.timeSeconds,
      droppedTimeSeconds: this.droppedTimeSeconds,
      error: this.error,
    };
  }

  subscribe(
    listener: SimulationListener<State, Parameters>,
    emitCurrent = true,
  ): () => void {
    this.assertNotDisposed();
    this.listeners.add(listener);

    if (emitCurrent) {
      listener(this.getSnapshot());
    }

    return () => this.listeners.delete(listener);
  }

  start(): void {
    this.assertNotDisposed();

    if (this.status === "running") {
      return;
    }

    if (this.status !== "ready") {
      throw new Error(
        `Cannot start a simulation while it is ${this.status}; use resume or reset.`,
      );
    }

    if (this.model.isComplete?.(this.state, this.parameters)) {
      this.status = "completed";
      this.publish();
      this.render();
      return;
    }

    this.status = "running";
    this.lastFrameTimestamp = this.scheduler.now();
    this.publish();
    this.scheduleNextFrame();
  }

  pause(): void {
    this.assertNotDisposed();

    if (this.status !== "running") {
      return;
    }

    this.cancelScheduledFrame();
    this.lastFrameTimestamp = null;
    this.status = "paused";
    this.publish();
  }

  resume(): void {
    this.assertNotDisposed();

    if (this.status !== "paused") {
      throw new Error(`Cannot resume a simulation while it is ${this.status}.`);
    }

    this.status = "running";
    this.lastFrameTimestamp = this.scheduler.now();
    this.publish();
    this.scheduleNextFrame();
  }

  reset(): void {
    this.assertNotDisposed();
    const initialState = this.model.createInitialState(this.parameters);

    this.cancelScheduledFrame();
    this.state = initialState;
    this.timeSeconds = 0;
    this.droppedTimeSeconds = 0;
    this.accumulatorSeconds = 0;
    this.lastFrameTimestamp = null;
    this.error = null;
    this.status = "ready";
    this.publish();
    this.render();
  }

  setParameters(
    parameters: Parameters,
    options: { reset?: boolean } = {},
  ): void {
    this.assertNotDisposed();

    if (options.reset) {
      const initialState = this.model.createInitialState(parameters);

      this.cancelScheduledFrame();
      this.parameters = parameters;
      this.state = initialState;
      this.timeSeconds = 0;
      this.droppedTimeSeconds = 0;
      this.accumulatorSeconds = 0;
      this.lastFrameTimestamp = null;
      this.error = null;
      this.status = "ready";
      this.publish();
      this.render();
      return;
    }

    this.parameters = parameters;
    this.publish();
    this.render();
  }

  dispose(): void {
    if (this.status === "disposed") {
      return;
    }

    this.cancelScheduledFrame();
    this.status = "disposed";
    this.lastFrameTimestamp = null;

    try {
      this.publish();
    } finally {
      this.listeners.clear();
    }
  }

  private scheduleNextFrame(): void {
    if (this.status !== "running" || this.frameHandle !== null) {
      return;
    }

    try {
      this.frameHandle = this.scheduler.requestFrame(this.handleFrame);
    } catch (error) {
      this.fail(error);
    }
  }

  private readonly handleFrame: FrameRequestCallback = (timestamp) => {
    this.frameHandle = null;

    if (this.status !== "running") {
      return;
    }

    try {
      assertFiniteNumber(timestamp, "frame timestamp");

      const previousTimestamp = this.lastFrameTimestamp ?? timestamp;
      const elapsedSeconds = Math.max(
        0,
        ((timestamp - previousTimestamp) / 1_000) * this.timeScale,
      );
      this.lastFrameTimestamp = timestamp;

      const acceptedSeconds = Math.min(
        elapsedSeconds,
        this.maxFrameDeltaSeconds,
      );
      this.droppedTimeSeconds += elapsedSeconds - acceptedSeconds;
      this.accumulatorSeconds += acceptedSeconds;

      let steps = 0;
      while (
        this.accumulatorSeconds + this.timeTolerance >=
          this.fixedTimeStepSeconds &&
        steps < this.maxSubSteps &&
        this.status === "running"
      ) {
        this.state = this.model.step(
          this.state,
          this.parameters,
          this.fixedTimeStepSeconds,
        );
        this.timeSeconds += this.fixedTimeStepSeconds;
        this.accumulatorSeconds -= this.fixedTimeStepSeconds;
        if (this.accumulatorSeconds < 0) {
          this.accumulatorSeconds = 0;
        }
        steps += 1;

        if (this.model.isComplete?.(this.state, this.parameters)) {
          this.status = "completed";
          this.accumulatorSeconds = 0;
        }
      }

      if (
        steps === this.maxSubSteps &&
        this.accumulatorSeconds + this.timeTolerance >=
          this.fixedTimeStepSeconds
      ) {
        const discardedSteps = Math.floor(
          (this.accumulatorSeconds + this.timeTolerance) /
            this.fixedTimeStepSeconds,
        );
        const discardedSeconds = discardedSteps * this.fixedTimeStepSeconds;
        this.droppedTimeSeconds += discardedSeconds;
        this.accumulatorSeconds -= discardedSeconds;
        if (this.accumulatorSeconds < 0) {
          this.accumulatorSeconds = 0;
        }
      }

      if (steps > 0 || this.status === "completed") {
        this.publish();
      }

      this.render();

      if (this.status === "running") {
        this.scheduleNextFrame();
      }
    } catch (error) {
      this.fail(error);
    }
  };

  private cancelScheduledFrame(): void {
    if (this.frameHandle === null) {
      return;
    }

    this.scheduler.cancelFrame(this.frameHandle);
    this.frameHandle = null;
  }

  private get timeTolerance(): number {
    return (
      Number.EPSILON *
      Math.max(
        Number.MIN_VALUE,
        this.accumulatorSeconds,
        this.fixedTimeStepSeconds,
      ) *
      8
    );
  }

  private render(): void {
    try {
      this.onRender?.(this.getSnapshot());
    } catch (error) {
      this.fail(error);
    }
  }

  private publish(): void {
    const snapshot = this.getSnapshot();

    for (const listener of [...this.listeners]) {
      if (this.listeners.has(listener)) {
        listener(snapshot);
      }
    }
  }

  private fail(error: unknown): void {
    this.cancelScheduledFrame();
    this.lastFrameTimestamp = null;
    this.status = "error";
    this.error = error;
    this.publish();

    if (this.onError) {
      this.onError(error);
    } else {
      console.error("Simulation engine stopped after an error:", error);
    }
  }

  private assertNotDisposed(): void {
    if (this.status === "disposed") {
      throw new Error("The simulation engine has been disposed.");
    }
  }
}
