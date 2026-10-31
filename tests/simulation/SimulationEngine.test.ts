import { describe, expect, it, vi } from "vitest";
import {
  SimulationEngine,
  type SimulationScheduler,
} from "../../src/simulation/engine";

interface TestState {
  position: number;
}

interface TestParameters {
  speed: number;
  finishAt?: number;
}

class FakeScheduler implements SimulationScheduler {
  private timestamp = 0;
  private nextHandle = 1;
  private readonly callbacks = new Map<number, FrameRequestCallback>();

  now(): number {
    return this.timestamp;
  }

  requestFrame(callback: FrameRequestCallback): number {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    return handle;
  }

  cancelFrame(handle: number): void {
    this.callbacks.delete(handle);
  }

  advanceBy(milliseconds: number): void {
    this.timestamp += milliseconds;
    const pending = [...this.callbacks.entries()];
    this.callbacks.clear();

    for (const [, callback] of pending) {
      callback(this.timestamp);
    }
  }

  get pendingFrames(): number {
    return this.callbacks.size;
  }
}

function createEngine(
  parameters: TestParameters = { speed: 1 },
  options: ConstructorParameters<
    typeof SimulationEngine<TestState, TestParameters>
  >[2] = {},
) {
  const scheduler = new FakeScheduler();
  const model = {
    createInitialState: (): TestState => ({ position: 0 }),
    step: (state: TestState, current: TestParameters, dt: number) => ({
      position: state.position + current.speed * dt,
    }),
    isComplete: (state: TestState, current: TestParameters) =>
      current.finishAt !== undefined && state.position >= current.finishAt,
  };

  return {
    engine: new SimulationEngine(model, parameters, {
      scheduler,
      ...options,
    }),
    scheduler,
  };
}

describe("SimulationEngine", () => {
  it("initializes, starts, and advances at a fixed timestep", () => {
    const onRender = vi.fn();
    const { engine, scheduler } = createEngine({ speed: 2 }, { onRender });

    expect(engine.getSnapshot()).toMatchObject({
      state: { position: 0 },
      status: "ready",
      timeSeconds: 0,
    });

    engine.start();
    scheduler.advanceBy(100);

    expect(engine.getSnapshot().state.position).toBeCloseTo(0.2);
    expect(engine.getSnapshot().status).toBe("running");
    expect(engine.getSnapshot().timeSeconds).toBeCloseTo(0.1);
    expect(onRender).toHaveBeenCalled();
    expect(scheduler.pendingFrames).toBe(1);
  });

  it("produces equivalent simulation time at different render rates", () => {
    const at30Hz = createEngine();
    const at120Hz = createEngine();

    at30Hz.engine.start();
    at120Hz.engine.start();

    for (let frame = 0; frame < 30; frame += 1) {
      at30Hz.scheduler.advanceBy(1_000 / 30);
    }

    for (let frame = 0; frame < 120; frame += 1) {
      at120Hz.scheduler.advanceBy(1_000 / 120);
    }

    expect(at30Hz.engine.getSnapshot().timeSeconds).toBeCloseTo(1);
    expect(at120Hz.engine.getSnapshot().timeSeconds).toBeCloseTo(1);
    expect(at30Hz.engine.getSnapshot().state.position).toBeCloseTo(1);
    expect(at120Hz.engine.getSnapshot().state.position).toBeCloseTo(1);
  });

  it("supports a time scale for slow-motion visualization without changing the model timestep", () => {
    const { engine, scheduler } = createEngine(
      { speed: 1 },
      {
        fixedTimeStepSeconds: 0.01,
        timeScale: 0.1,
        maxSubSteps: 16,
      },
    );

    engine.start();
    scheduler.advanceBy(1_000);

    expect(engine.getSnapshot().timeSeconds).toBeCloseTo(0.1);
    expect(engine.getSnapshot().state.position).toBeCloseTo(0.1);
  });

  it("pauses without advancing time and resumes without integrating the paused interval", () => {
    const { engine, scheduler } = createEngine();

    engine.start();
    scheduler.advanceBy(100);
    engine.pause();
    const pausedSnapshot = engine.getSnapshot();

    scheduler.advanceBy(5_000);
    expect(engine.getSnapshot()).toEqual(pausedSnapshot);
    expect(scheduler.pendingFrames).toBe(0);

    engine.resume();
    scheduler.advanceBy(100);

    expect(engine.getSnapshot().timeSeconds).toBeCloseTo(0.2);
    expect(engine.getSnapshot().status).toBe("running");
  });

  it("resets state, time, and lifecycle when running", () => {
    const { engine, scheduler } = createEngine();

    engine.start();
    scheduler.advanceBy(100);
    engine.reset();

    expect(engine.getSnapshot()).toMatchObject({
      state: { position: 0 },
      status: "ready",
      timeSeconds: 0,
      droppedTimeSeconds: 0,
      error: null,
    });
    expect(scheduler.pendingFrames).toBe(0);
  });

  it("changes parameters while preserving state or resets using new parameters", () => {
    const { engine, scheduler } = createEngine({ speed: 1 });

    engine.start();
    scheduler.advanceBy(100);
    engine.setParameters({ speed: 3 });
    expect(engine.getSnapshot().state.position).toBeCloseTo(0.1);
    expect(engine.getSnapshot().parameters).toEqual({ speed: 3 });
    expect(engine.getSnapshot().status).toBe("running");

    scheduler.advanceBy(100);
    expect(engine.getSnapshot().state.position).toBeCloseTo(0.4);

    engine.setParameters({ speed: 4 }, { reset: true });
    expect(engine.getSnapshot()).toMatchObject({
      state: { position: 0 },
      parameters: { speed: 4 },
      status: "ready",
      timeSeconds: 0,
    });
  });

  it("completes when the model condition is met and stops scheduling frames", () => {
    const { engine, scheduler } = createEngine({ speed: 2, finishAt: 0.1 });

    engine.start();
    scheduler.advanceBy(100);

    expect(engine.getSnapshot().state.position).toBeCloseTo(0.1);
    expect(engine.getSnapshot().status).toBe("completed");
    expect(engine.getSnapshot().timeSeconds).toBeCloseTo(0.05);
    expect(scheduler.pendingFrames).toBe(0);
  });

  it("completes immediately when the initial state already meets the model condition", () => {
    const { engine, scheduler } = createEngine({ speed: 1, finishAt: 0 });

    engine.start();

    expect(engine.getSnapshot().status).toBe("completed");
    expect(engine.getSnapshot().timeSeconds).toBe(0);
    expect(scheduler.pendingFrames).toBe(0);
  });

  it("limits catch-up work and records dropped time", () => {
    const { engine, scheduler } = createEngine(
      { speed: 1 },
      {
        fixedTimeStepSeconds: 0.01,
        maxFrameDeltaSeconds: 0.5,
        maxSubSteps: 3,
      },
    );

    engine.start();
    scheduler.advanceBy(1_000);

    expect(engine.getSnapshot().timeSeconds).toBeCloseTo(0.03);
    expect(engine.getSnapshot().droppedTimeSeconds).toBeCloseTo(0.97);
  });

  it("notifies and unsubscribes lifecycle listeners", () => {
    const { engine, scheduler } = createEngine();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ready" }),
    );

    engine.start();
    scheduler.advanceBy(100);
    const callsBeforeUnsubscribe = listener.mock.calls.length;
    unsubscribe();
    engine.pause();

    expect(listener).toHaveBeenCalledTimes(callsBeforeUnsubscribe);
  });

  it("surfaces model errors and can recover through reset", () => {
    const onError = vi.fn();
    const scheduler = new FakeScheduler();
    const engine = new SimulationEngine(
      {
        createInitialState: () => ({ position: 0 }),
        step: () => {
          throw new Error("Physics step failed.");
        },
      },
      { speed: 1 },
      { scheduler, onError },
    );

    engine.start();
    scheduler.advanceBy(100);

    expect(engine.getSnapshot().status).toBe("error");
    expect(engine.getSnapshot().error).toEqual(
      new Error("Physics step failed."),
    );
    expect(onError).toHaveBeenCalledWith(engine.getSnapshot().error);
    expect(scheduler.pendingFrames).toBe(0);
  });

  it("surfaces renderer errors without throwing out of reset", () => {
    const renderError = new Error("Canvas renderer failed.");
    const onError = vi.fn();
    const { engine } = createEngine(
      { speed: 1 },
      {
        onRender: () => {
          throw renderError;
        },
        onError,
      },
    );

    expect(() => engine.reset()).not.toThrow();
    expect(engine.getSnapshot().status).toBe("error");
    expect(engine.getSnapshot().error).toBe(renderError);
    expect(onError).toHaveBeenCalledWith(renderError);
  });

  it("disposes safely and rejects later operations", () => {
    const { engine, scheduler } = createEngine();

    engine.start();
    engine.dispose();
    engine.dispose();

    expect(engine.getSnapshot().status).toBe("disposed");
    expect(scheduler.pendingFrames).toBe(0);
    expect(() => engine.start()).toThrow("disposed");
    expect(() => engine.reset()).toThrow("disposed");
    expect(() => engine.subscribe(() => undefined)).toThrow("disposed");
  });

  it("validates timestep and substep configuration", () => {
    const scheduler = new FakeScheduler();
    const model = {
      createInitialState: () => ({ position: 0 }),
      step: (state: TestState) => state,
    };

    expect(
      () =>
        new SimulationEngine(model, { speed: 1 }, {
          scheduler,
          fixedTimeStepSeconds: 0,
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new SimulationEngine(model, { speed: 1 }, {
          scheduler,
          maxSubSteps: 1.5,
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new SimulationEngine(model, { speed: 1 }, {
          scheduler,
          timeScale: 0,
        }),
    ).toThrow(RangeError);
  });
});
