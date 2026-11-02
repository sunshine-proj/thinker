import type { ReactNode } from "react";
import { RangeControl, type MeasurementItem } from "../../components/common";
import { RoundGamePage } from "./RoundGamePage";
import { isRecord, readNumber } from "../core/sessionParsing";
import type {
  AttemptOutcome,
  PredictionSpec,
  RoundBase,
  RoundGameDefinition,
  RoundGameMeta,
} from "./types";
import type { RoundGameState } from "./useRoundGame";

/** A slider-controlled quantity. Equal minimum and maximum means the value is fixed for the round. */
export interface NumericControlSpec {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
  readonly initial: number;
}

export interface NumericRound extends RoundBase {
  readonly controls: readonly NumericControlSpec[];
}

export type NumericControl = Readonly<Record<string, number>>;

const decimalsOf = (step: number) =>
  Math.min(6, Math.max(0, Math.ceil(-Math.log10(step) - 1e-9)));

export const isFixed = (spec: NumericControlSpec) => spec.minimum === spec.maximum;

export const formatControl = (spec: NumericControlSpec, value: number) =>
  `${value.toFixed(decimalsOf(spec.step))} ${spec.unit}`.trim();

/** Starting values for a round's controls. */
export function defaultNumericControl(round: NumericRound): NumericControl {
  return Object.fromEntries(round.controls.map((c) => [c.key, c.initial]));
}

/** Validates saved values against the round's slider ranges; fixed controls keep their value. */
export function parseNumericControl(raw: unknown, round: NumericRound): NumericControl | null {
  if (!isRecord(raw)) {
    return null;
  }
  const values: Record<string, number> = {};
  for (const spec of round.controls) {
    if (isFixed(spec)) {
      values[spec.key] = spec.initial;
      continue;
    }
    const value = readNumber(raw, spec.key, spec.minimum, spec.maximum);
    if (value === null) {
      return null;
    }
    values[spec.key] = value;
  }
  return values;
}

/** Throws a RangeError if any control is outside its range. */
export function assertControlsInRange(round: NumericRound, values: NumericControl): void {
  for (const spec of round.controls) {
    const value = values[spec.key];
    if (value === undefined || !Number.isFinite(value) || value < spec.minimum - 1e-9 || value > spec.maximum + 1e-9) {
      throw new RangeError(`${spec.label} must be between ${spec.minimum} and ${spec.maximum} ${spec.unit}.`);
    }
  }
}

interface NumericGameConfig<R extends NumericRound, O extends AttemptOutcome> {
  readonly meta: RoundGameMeta;
  readonly rounds: readonly R[];
  readonly prediction: (round: R) => PredictionSpec | null;
  readonly evaluate: (round: R, values: NumericControl, predicted: number | null, attemptNumber: number) => O;
}

/** Builds a round-game definition whose controls are all numeric sliders. */
export function defineNumericGame<R extends NumericRound, O extends AttemptOutcome>(
  config: NumericGameConfig<R, O>,
): RoundGameDefinition<R, NumericControl, O> {
  return {
    meta: config.meta,
    rounds: config.rounds,
    createControl: defaultNumericControl,
    parseControl: parseNumericControl,
    prediction: config.prediction,
    evaluate: (round, control, predicted, attempt) => {
      assertControlsInRange(round, control);
      return config.evaluate(round, control, predicted, attempt);
    },
  };
}

export function NumericControls<R extends NumericRound, O extends AttemptOutcome>({
  game,
}: {
  readonly game: RoundGameState<R, NumericControl, O>;
}) {
  return (
    <>
      {game.round.controls.map((spec) =>
        isFixed(spec) ? (
          <p className="game-instructions" key={spec.key}>
            {spec.label}: {formatControl(spec, spec.initial)} (fixed)
          </p>
        ) : (
          <RangeControl
            disabled={!game.canEdit}
            displayValue={formatControl(spec, game.control[spec.key] as number)}
            id={`control-${spec.key}`}
            key={spec.key}
            label={spec.label}
            maximum={spec.maximum}
            minimum={spec.minimum}
            onChange={(value) => game.setControl((current) => ({ ...current, [spec.key]: value }))}
            step={spec.step}
            value={game.control[spec.key] as number}
          />
        ),
      )}
    </>
  );
}

interface NumericPageConfig<R extends NumericRound, O extends AttemptOutcome> {
  readonly definition: RoundGameDefinition<R, NumericControl, O>;
  /** Visual for the current state; `outcome` is null until the learner commits. */
  readonly visual: (game: RoundGameState<R, NumericControl, O>) => ReactNode;
  readonly measurements: (game: RoundGameState<R, NumericControl, O>) => readonly MeasurementItem[];
  readonly details?: (game: RoundGameState<R, NumericControl, O>) => ReactNode;
}

export function createNumericGamePage<R extends NumericRound, O extends AttemptOutcome>(
  config: NumericPageConfig<R, O>,
) {
  return function NumericGamePage() {
    return (
      <RoundGamePage
        definition={config.definition}
        renderControls={(game) => <NumericControls game={game} />}
        renderDetails={config.details}
        renderMeasurements={config.measurements}
        renderVisual={config.visual}
      />
    );
  };
}

/** Shorthand for a slider spec; `initial` defaults to the middle of the range, snapped to the step. */
export function slider(
  key: string,
  label: string,
  unit: string,
  minimum: number,
  maximum: number,
  step: number,
  initial?: number,
): NumericControlSpec {
  const middle = minimum + Math.round((maximum - minimum) / step / 2) * step;
  return { key, label, unit, minimum, maximum, step, initial: initial ?? Number(middle.toFixed(6)) };
}

/** A quantity shown to the learner but not adjustable this round. */
export function fixed(key: string, label: string, unit: string, value: number): NumericControlSpec {
  const digits = (String(value).split(".")[1] ?? "").length;
  return { key, label, unit, minimum: value, maximum: value, step: 10 ** -digits, initial: value };
}
