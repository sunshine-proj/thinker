import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateConductionPower, calculateFridgeSteadyState, type FridgeSteadyState } from "../../../physics/thermodynamics";

export interface FridgeRound extends NumericRound {
  readonly roomCelsius: number;
  readonly targetCelsius: number;
  readonly toleranceKelvin: number;
  readonly maximumCompressorWatts: number | null;
}

export interface FridgeOutcome extends AttemptOutcome {
  readonly state: FridgeSteadyState;
  readonly coldCelsius: number;
  readonly leakWattsPerKelvin: number;
}

export const FRIDGE_CONDUCTIVITY = 0.03;
export const FRIDGE_AREA = 3;
const KELVIN = 273.15;

export const FRIDGE_META: RoundGameMeta = {
  id: "refrigerator-engineer",
  title: "Refrigerator Engineer",
  eyebrow: "THERMODYNAMICS · SECOND LAW",
  modelTag: "COEFFICIENT OF PERFORMANCE",
  introduction: "Design a refrigerator: insulation to slow the heat leaking in, and a compressor to pump it back out. The second law says pumping heat uphill costs work, and the colder you go the more it costs.",
  instructions: "Predict the coefficient of performance, set the compressor power (and insulation or compressor quality where allowed), then switch it on. The cold space settles where the cooling equals the heat leak.",
  formula: "COP = Q_c/W ≤ T_c/(T_h − T_c)  ·  Q_leak = U (T_h − T_c)",
  formulaCaption: "Q_c is the heat removed from the cold space, W the compressor work, T in kelvin and U = kA/d the wall's conductance (k = 0.03 W/m·K, A = 3 m²). A real fridge reaches a fraction of the Carnot COP.",
  explanation: "A refrigerator uses work to move heat from the cold space to the warm room, against the natural direction. The best possible coefficient of performance, T_c/(T_h − T_c), shrinks as the temperature gap grows, so a freezer needs far more work per watt of cooling than a fridge. Heat continually leaks in through the walls; the cold space settles at the temperature where the cooling power equals the leak. Better insulation lowers the leak, and a better compressor raises the COP, both reducing the electricity needed.",
  assumptions: "Steady operation in a constant-temperature room, heat leaking only by conduction through the insulation, and a compressor achieving a fixed fraction of the Carnot COP. The cold space is at one uniform temperature.",
  learningObjectives: ["Use COP = Q_c/W and the Carnot limit T_c/(T_h − T_c).", "Find the steady temperature where cooling equals heat leak.", "See how insulation and compressor efficiency cut running power."],
  objective: { title: "Chill every cabinet", description: "Reach each target temperature.", unit: "cabinets" },
  controlsHeading: "Design the fridge",
  submitLabel: "Switch on",
  solvedLabel: "Perfectly chilled!",
  nextLabel: "Next cabinet",
};

export const FRIDGE_ROUNDS: readonly FridgeRound[] = Object.freeze([
  {
    id: "kitchen-fridge", title: "The kitchen fridge", difficulty: "Beginner", roomCelsius: 25, targetCelsius: 4, toleranceKelvin: 1, maximumCompressorWatts: null,
    situation: "A fridge in a 25 °C kitchen leaks 2 W for every kelvin of temperature difference, and its compressor reaches 40% of the Carnot COP. Choose the compressor power that holds 4 °C (± 1 K).",
    controls: [slider("power", "Compressor power", "W", 1, 40, 0.1, 15), fixed("leak", "Wall conductance", "W/K", 2), fixed("quality", "Compressor quality", "", 0.4)],
    hint: "In steady state, cooling = heat leak = 2 × (25 − 4) = 42 W. COP = 0.4 × T_c/(T_h − T_c). Then W = Q_c/COP.",
  },
  {
    id: "freezer", title: "The freezer", difficulty: "Intermediate", roomCelsius: 25, targetCelsius: -18, toleranceKelvin: 1, maximumCompressorWatts: 40,
    situation: "A freezer must hold −18 °C (± 1 K) in a 25 °C room using at most 40 W. The leak depends on the insulation thickness (k = 0.03 W/m·K, 3 m² of wall). Choose the insulation thickness and the compressor power.",
    controls: [slider("power", "Compressor power", "W", 1, 60, 0.5, 20), slider("thickness", "Insulation thickness", "cm", 2, 15, 0.1, 6), fixed("quality", "Compressor quality", "", 0.4)],
    hint: "Thicker insulation lowers U = kA/d, so less heat must be pumped. The COP is lower in a freezer: 0.4 × 255/43.",
  },
  {
    id: "efficient", title: "A+++ efficiency", difficulty: "Advanced", roomCelsius: 30, targetCelsius: 4, toleranceKelvin: 1, maximumCompressorWatts: 5,
    situation: "In a 30 °C room, hold 4 °C (± 1 K) using no more than 5 W. You can choose the insulation thickness, the compressor quality (its fraction of Carnot, up to 70%), and the compressor power.",
    controls: [slider("power", "Compressor power", "W", 1, 20, 0.1, 5), slider("thickness", "Insulation thickness", "cm", 2, 15, 0.1, 6), slider("quality", "Compressor quality", "", 0.3, 0.7, 0.01, 0.4)],
    hint: "Minimise the running power: thick insulation (small U) and a high-quality compressor. W = U(T_h − T_c)/(f × T_c/(T_h − T_c)).",
  },
]);

export function runFridge(round: FridgeRound, v: NumericControl): FridgeOutcome {
  const leak = v.leak !== undefined
    ? (v.leak as number)
    : calculateConductionPower(FRIDGE_CONDUCTIVITY, FRIDGE_AREA, (v.thickness as number) / 100, 1);
  const state = calculateFridgeSteadyState(round.roomCelsius + KELVIN, leak, v.quality as number, v.power as number);
  const coldCelsius = state.coldKelvin - KELVIN;
  const error = Math.abs(coldCelsius - round.targetCelsius);
  const problems: string[] = [];
  if (error > round.toleranceKelvin) problems.push(`The cold space settles at ${coldCelsius.toFixed(1)} °C, ${coldCelsius > round.targetCelsius ? "too warm" : "too cold"} for the ${round.targetCelsius} °C target. The cooling (${state.coolingWatts.toFixed(0)} W) balances a leak of ${leak.toFixed(2)} W/K there.`);
  if (round.maximumCompressorWatts !== null && (v.power as number) > round.maximumCompressorWatts) problems.push(`The compressor draws ${v.power} W, above the ${round.maximumCompressorWatts} W limit.`);
  const success = problems.length === 0;
  return {
    success, state, coldCelsius, leakWattsPerKelvin: leak,
    accuracyFraction: success ? 1 - error / round.toleranceKelvin : 0,
    predictionActual: state.cop,
    feedback: success ? `Settles at ${coldCelsius.toFixed(1)} °C with a COP of ${state.cop.toFixed(1)} (Carnot limit ${state.carnotCop.toFixed(1)}).` : problems.join(" "),
  };
}

export const refrigeratorEngineer = defineNumericGame<FridgeRound, FridgeOutcome>({
  meta: FRIDGE_META,
  rounds: FRIDGE_ROUNDS,
  prediction: () => ({ label: "Your prediction of the coefficient of performance", unit: "", placeholder: "e.g. 5", step: 0.1 }),
  evaluate: (round, values) => runFridge(round, values),
});
