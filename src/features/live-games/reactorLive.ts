import { DELAYED_NEUTRON_FRACTION, advancePointKinetics, calculateReactorPeriod, steadyKineticsState, type KineticsState } from "../../physics/nuclear";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { label, line } from "./drawing";

/** Reactivity with the rods fully withdrawn and the total rod worth. Critical at about 33 % insertion. */
const RHO_WITHDRAWN = 0.01;
const ROD_WORTH = 0.03;
const CRITICAL_INSERTION = (RHO_WITHDRAWN / ROD_WORTH) * 100;
const TRIP_POWER = 1.2;
const MIN_PERIOD = 10;
const HOLD_BAND = 0.05;

interface ReactorLevel { readonly title: string; readonly goal: string; readonly start: number; readonly target: number; readonly hold: number }
const LEVELS: readonly ReactorLevel[] = [
  { title: "Power up", goal: "Raise the power from 10 % to 50 % and hold it there (± 5 %) for 10 s.", start: 0.1, target: 0.5, hold: 10 },
  { title: "Full power", goal: "Bring the reactor from 10 % to full power (100 % ± 5 %) and hold it for 15 s, without tripping.", start: 0.1, target: 1, hold: 15 },
  { title: "Power down", goal: "Reduce the power from 100 % to 20 % and hold it there for 10 s.", start: 1, target: 0.2, hold: 10 },
];

interface ReactorState extends KineticsState {
  readonly time: number;
  readonly held: number;
  readonly peak: number;
  readonly tripped: string | null;
  readonly periodSeconds: number;
  readonly history: readonly { t: number; p: number }[];
}

export const reactivityFor = (insertion: number) => RHO_WITHDRAWN - (ROD_WORTH * insertion) / 100;

export const reactorLive: LiveGameDefinition<ReactorState> = {
  id: "reactor-operator-live",
  title: "Reactor Operator Live",
  worldId: "nuclear",
  relatedGameId: "reactor-operator",
  eyebrow: "NUCLEAR PHYSICS · FISSION CONTROL",
  modelTag: "POINT KINETICS, ONE DELAYED GROUP (SIMPLIFIED)",
  introduction: "Take the controls of a research reactor. Move the control rods to change the power, and settle it at the target without tripping the safety systems.",
  howToPlay: "Move the rod slider (arrow keys give fine steps). Withdrawing rods raises reactivity and the power climbs; inserting them lowers it. The reactor trips if the power rises with a period shorter than 10 s, or above 120 %.",
  physics: "Each fission releases neutrons that cause more fissions. With the rods at about 33 % the chain reaction is exactly self-sustaining. Pull them out a little and the power rises, but slowly, because 0.65 % of the neutrons are delayed by seconds; that is what lets operators control a reactor. Pull them too far, beyond the delayed-neutron fraction, and the power would rise in milliseconds, which is why reactors trip automatically long before that.",
  assumptions: "Point kinetics with one delayed-neutron group (β = 0.0065, λ = 0.08 s⁻¹, generation time 0.1 ms), rod worth proportional to insertion, no temperature feedback or poisons, and the clock running twice as fast as real time. A teaching model of reactor control only.",
  levels: LEVELS.map((entry, index) => ({ id: `reactor-${index + 1}`, title: entry.title, goal: entry.goal })),
  sliders: () => [{ key: "rods", label: "Control rod insertion", unit: "%", minimum: 0, maximum: 100, step: 0.1, initial: Math.round(CRITICAL_INSERTION * 10) / 10 }],
  actions: [],
  timing: { fixedTimeStepSeconds: 0.005, timeScale: 2, maxSubSteps: 64 },
  onDrag: (_x, y) => ({ rods: Math.round((1 - y) * 1000) / 10 }),
  create: (level) => ({ ...steadyKineticsState((LEVELS[level] as ReactorLevel).start), time: 0, held: 0, peak: (LEVELS[level] as ReactorLevel).start, tripped: null, periodSeconds: Number.POSITIVE_INFINITY, history: [] }),
  step(state, input, dt, level) {
    if (state.tripped) {
      return state;
    }
    const goal = LEVELS[level] as ReactorLevel;
    const rho = reactivityFor(input.values.rods ?? CRITICAL_INSERTION);
    const next = advancePointKinetics(state, rho, dt);
    const time = state.time + dt;
    // Like a reactor's period meter, use the stable period set by the reactivity, not the
    // millisecond prompt jump that follows every rod movement.
    const periodSeconds = rho > 0 && rho < DELAYED_NEUTRON_FRACTION ? calculateReactorPeriod(rho) : Number.POSITIVE_INFINITY;
    const tripped = rho >= DELAYED_NEUTRON_FRACTION ? "Prompt-critical reactivity: automatic shutdown." : next.power > TRIP_POWER ? "Overpower trip above 120 %." : periodSeconds < MIN_PERIOD ? `Period trip: the power was rising too fast (period ${periodSeconds.toFixed(1)} s).` : null;
    const inBand = Math.abs(next.power - goal.target) <= HOLD_BAND * goal.target;
    const history = Math.floor(time / 0.5) > Math.floor(state.time / 0.5) ? [...state.history.slice(-400), { t: time, p: next.power }] : state.history;
    return { ...next, time, held: inBand ? state.held + dt : 0, peak: Math.max(state.peak, next.power), tripped, periodSeconds, history };
  },
  verdict(state, level) {
    const goal = LEVELS[level] as ReactorLevel;
    if (state.tripped) {
      return { status: "lost", message: state.tripped };
    }
    if (state.held >= goal.hold) {
      return { status: "won", message: `Held at ${(state.power * 100).toFixed(1)} % for ${goal.hold} s.` };
    }
    return { status: "playing", message: `Power ${(state.power * 100).toFixed(1)} %${state.held > 0 ? ` · on target for ${state.held.toFixed(1)} s` : ""}.` };
  },
  stars: (state, level) => {
    const goal = LEVELS[level] as ReactorLevel;
    const overshoot = goal.target > goal.start ? (state.peak - goal.target) / goal.target : 0;
    return overshoot <= 0.02 ? 3 : overshoot <= 0.05 ? 2 : 1;
  },
  readouts: (state, input) => {
    const rho = reactivityFor(input.values.rods ?? CRITICAL_INSERTION);
    return [
      { label: "POWER", value: `${(state.power * 100).toFixed(1)} %` },
      { label: "REACTIVITY ρ", value: `${rho.toFixed(5)} (β = ${DELAYED_NEUTRON_FRACTION})` },
      { label: "MULTIPLICATION k", value: (1 / (1 - rho)).toFixed(5) },
      { label: "PERIOD", value: Number.isFinite(state.periodSeconds) ? `${state.periodSeconds.toFixed(0)} s` : "steady or falling" },
    ];
  },
  draw(context, state, _input, width, height, level) {
    const goal = LEVELS[level] as ReactorLevel;
    const toY = (p: number) => height - 24 - (Math.min(1.25, p) / 1.25) * (height - 48);
    const toX = (t: number) => 40 + ((t - Math.max(0, state.time - 120)) / 120) * (width - 60);
    context.fillStyle = "rgb(42 171 131 / 18%)";
    context.fillRect(40, toY(goal.target * (1 + HOLD_BAND)), width - 60, toY(goal.target * (1 - HOLD_BAND)) - toY(goal.target * (1 + HOLD_BAND)));
    line(context, [{ x: 40, y: toY(TRIP_POWER) }, { x: width - 20, y: toY(TRIP_POWER) }], "#d6304f", 1.5, true);
    label(context, "TRIP 120 %", 44, toY(TRIP_POWER) - 4, "#a3122f", 10);
    label(context, `TARGET ${(goal.target * 100).toFixed(0)} %`, 44, toY(goal.target) - 8, "#1f7d5d", 10);
    line(context, state.history.filter((point) => point.t >= state.time - 120).map((point) => ({ x: toX(point.t), y: toY(point.p) })), "#5365d5", 2.5);
    label(context, `${(state.power * 100).toFixed(1)} %`, width - 80, toY(state.power) - 6, "#364057");
  },
  describe: (state, input) => `Reactor power ${(state.power * 100).toFixed(1)} percent with the rods ${(input.values.rods ?? CRITICAL_INSERTION).toFixed(1)} percent inserted.${state.tripped ? ` ${state.tripped}` : ""}`,
};
