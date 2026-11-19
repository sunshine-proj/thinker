import type { SimulationModel } from "../../simulation/engine";
import type { LiveEngineState, LiveGameDefinition, LiveInput, LiveParameters } from "./liveTypes";

export function inputFromParameters(parameters: LiveParameters, pressed: ReadonlySet<string> = new Set()): LiveInput {
  return { values: parameters.values, held: new Set(parameters.held), pressed };
}

/** Wraps a live game definition as a SimulationEngine model, turning presses into one-shot inputs. */
export function createLiveModel<State>(definition: LiveGameDefinition<State>): SimulationModel<LiveEngineState<State>, LiveParameters> {
  return {
    createInitialState: (parameters) => {
      const game = definition.create(parameters.level);
      return { game, handled: { ...parameters.presses }, verdict: definition.verdict(game, parameters.level) };
    },
    step: (state, parameters, dt) => {
      const pressed = new Set(
        definition.actions
          .filter((action) => !action.hold && (parameters.presses[action.id] ?? 0) > (state.handled[action.id] ?? 0))
          .map((action) => action.id),
      );
      const game = definition.step(state.game, inputFromParameters(parameters, pressed), dt, parameters.level);
      return { game, handled: { ...parameters.presses }, verdict: definition.verdict(game, parameters.level) };
    },
    isComplete: (state) => state.verdict.status !== "playing",
  };
}

export function defaultLiveParameters<State>(definition: LiveGameDefinition<State>, level: number): LiveParameters {
  return {
    level,
    values: Object.fromEntries(definition.sliders(level).map((slider) => [slider.key, slider.initial])),
    held: [],
    presses: {},
  };
}

/** Runs a live game headlessly (for tests): applies inputs, steps until done or the time runs out. */
export function runLiveGame<State>(
  definition: LiveGameDefinition<State>,
  level: number,
  plan: (time: number, state: State) => { values?: Record<string, number>; held?: string[]; press?: string[] },
  maximumSimulatedSeconds: number,
): { state: State; verdict: ReturnType<LiveGameDefinition<State>["verdict"]>; time: number } {
  const model = createLiveModel(definition);
  let parameters = defaultLiveParameters(definition, level);
  let state = model.createInitialState(parameters);
  const dt = definition.timing.fixedTimeStepSeconds;
  let time = 0;
  while (time < maximumSimulatedSeconds && state.verdict.status === "playing") {
    const decision = plan(time, state.game);
    const presses = { ...parameters.presses };
    for (const id of decision.press ?? []) {
      presses[id] = (presses[id] ?? 0) + 1;
    }
    parameters = { ...parameters, values: { ...parameters.values, ...decision.values }, held: decision.held ?? [], presses };
    state = model.step(state, parameters, dt);
    time += dt;
  }
  return { state: state.game, verdict: state.verdict, time };
}
