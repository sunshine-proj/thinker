import type { ReactNode } from "react";
import type { MeasurementItem } from "../../components/common";

/**
 * Real-time ("live") games: the learner steers a running simulation directly with
 * sliders, drags on the canvas and action buttons or keys. Physics runs in pure step
 * functions at a fixed time step through SimulationEngine; drawing is separate.
 */

export interface LiveSlider {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
  readonly initial: number;
}

export interface LiveAction {
  readonly id: string;
  readonly label: string;
  /** Keyboard keys (KeyboardEvent.key values) that trigger the action. */
  readonly keys: readonly string[];
  /** Held actions act while pressed (a throttle); others fire once per press. */
  readonly hold?: boolean;
}

export interface LiveInput {
  readonly values: Readonly<Record<string, number>>;
  readonly held: ReadonlySet<string>;
  /** One-shot actions pressed since the last step. */
  readonly pressed: ReadonlySet<string>;
}

export type LiveStatus = "playing" | "won" | "lost";

export interface LiveLevel {
  readonly id: string;
  readonly title: string;
  readonly goal: string;
}

export interface LiveVerdict {
  readonly status: LiveStatus;
  readonly message: string;
}

export interface LiveGameDefinition<State> {
  readonly id: string;
  readonly title: string;
  readonly worldId: string;
  /** The round-based game this is the live version of; omitted for stand-alone playground games. */
  readonly relatedGameId?: string;
  readonly eyebrow: string;
  readonly modelTag: string;
  readonly introduction: string;
  /** How to play with a keyboard, a mouse or a touch screen. */
  readonly howToPlay: string;
  readonly physics: string;
  readonly assumptions: string;
  readonly levels: readonly LiveLevel[];
  readonly sliders: (level: number) => readonly LiveSlider[];
  readonly actions: readonly LiveAction[];
  readonly timing: { readonly fixedTimeStepSeconds: number; readonly timeScale: number; readonly maxSubSteps?: number };
  /** Maps a drag on the canvas (0–1 from left, 0–1 from bottom) to slider values. */
  readonly onDrag?: (x: number, y: number, values: Readonly<Record<string, number>>, level: number) => Readonly<Record<string, number>>;
  create(level: number): State;
  step(state: State, input: LiveInput, dt: number, level: number): State;
  verdict(state: State, level: number): LiveVerdict;
  /** Stars (1–3) for a won level. */
  stars(state: State, level: number): 1 | 2 | 3;
  readouts(state: State, input: LiveInput, level: number): readonly MeasurementItem[];
  draw(context: CanvasRenderingContext2D, state: State, input: LiveInput, width: number, height: number, level: number): void;
  /** A text description of the scene for screen readers. */
  describe(state: State, input: LiveInput, level: number): string;
  /** Optional extra panel under the readouts, for example buttons that play sounds. */
  readonly extras?: (state: State, input: LiveInput, level: number) => ReactNode;
}

/** Parameters handed to the simulation engine. */
export interface LiveParameters {
  readonly level: number;
  readonly values: Readonly<Record<string, number>>;
  readonly held: readonly string[];
  /** Number of times each one-shot action has been pressed. */
  readonly presses: Readonly<Record<string, number>>;
}

export interface LiveEngineState<State> {
  readonly game: State;
  /** Presses already handed to the game. */
  readonly handled: Readonly<Record<string, number>>;
  readonly verdict: LiveVerdict;
}
