import { defineNumericGame, fixed, slider, type NumericControl, type NumericRound } from "../../../game-engine/rounds";
import type { AttemptOutcome, RoundGameMeta } from "../../../game-engine/rounds/types";
import { calculateEngine, type EngineState } from "../../../physics/thermodynamics";

export interface SteamRound extends NumericRound {
  readonly carnotFraction: number;
  readonly targetWorkKilowatts: number;
  readonly maximumBoilerCelsius: number | null;
  readonly minimumCondenserCelsius: number | null;
  readonly maximumRejectedKilowatts: number | null;
}

export interface SteamOutcome extends AttemptOutcome {
  readonly engine: EngineState;
  readonly hotKelvin: number;
  readonly coldKelvin: number;
}

export const POWER_TOLERANCE = 0.05;
const KELVIN = 273.15;

export const STEAM_META: RoundGameMeta = {
  id: "steam-engine",
  title: "Steam Engine",
  eyebrow: "THERMODYNAMICS · HEAT ENGINES",
  modelTag: "CARNOT LIMIT · SECOND LAW",
  introduction: "Run a steam engine between a hot boiler and a cool condenser. The second law caps how much of the heat can become work; choose the temperatures to reach the power you need.",
  instructions: "Predict the efficiency, set the boiler (and condenser) temperatures and fuel rate, then run the engine. Deliver the target power (± 5%) within the equipment limits.",
  formula: "η_C = 1 − T_c/T_h  ·  W = η Q_h  ·  Q_h = W + Q_c",
  formulaCaption: "Temperatures are absolute (kelvin = °C + 273.15). The real engine achieves a fixed fraction of the Carnot efficiency η_C. W is the work, Q_h the heat from the boiler and Q_c the heat rejected.",
  explanation: "A heat engine turns heat flowing from hot to cold into work, but it can never turn all of it into work: some must be rejected to the cold reservoir. The Carnot efficiency 1 − T_c/T_h is the best any engine can do between two temperatures, so a hotter boiler or a colder condenser raises it. Real engines reach only a fraction of it. Because heat is rejected at T_c and absorbed at T_h, the total entropy never decreases, which is the second law in action.",
  assumptions: "A steady engine between two constant-temperature reservoirs, achieving a constant fraction of the Carnot efficiency (60% to 75%, as stated for each round). Boiler and condenser limits are game values. Friction and heat leaks are inside the efficiency fraction.",
  learningObjectives: ["Apply the first law Q_h = W + Q_c to a heat engine.", "Use the Carnot efficiency as an upper limit between two temperatures.", "Relate rejected heat and entropy production to the second law."],
  objective: { title: "Power every plant", description: "Deliver each power target within the limits.", unit: "plants" },
  controlsHeading: "Run the engine",
  submitLabel: "Run the engine",
  solvedLabel: "Plant running!",
  nextLabel: "Next plant",
};

export const STEAM_ROUNDS: readonly SteamRound[] = Object.freeze([
  {
    id: "boiler-temperature", title: "Boiler temperature", difficulty: "Beginner", carnotFraction: 0.6, targetWorkKilowatts: 20, maximumBoilerCelsius: null, minimumCondenserCelsius: null, maximumRejectedKilowatts: null,
    situation: "A steam engine burns fuel at 100 kW and its condenser sits at 30 °C. The engine reaches 60% of the Carnot efficiency. Choose the boiler temperature that delivers 20 kW of work (± 5%).",
    controls: [slider("hot", "Boiler temperature", "°C", 100, 400, 1, 200), fixed("cold", "Condenser temperature", "°C", 30), fixed("heat", "Fuel heat rate", "kW", 100)],
    hint: "You need η = 20/100 = 0.2 = 0.6 η_C, so η_C = 1/3 = 1 − T_c/T_h. Solve for T_h in kelvin, then convert to °C.",
  },
  {
    id: "power-and-limits", title: "Power within limits", difficulty: "Intermediate", carnotFraction: 0.6, targetWorkKilowatts: 35, maximumBoilerCelsius: 300, minimumCondenserCelsius: null, maximumRejectedKilowatts: 100,
    situation: "Deliver 35 kW (± 5%) from a plant whose boiler steel cannot exceed 300 °C, and whose river cooling can absorb at most 100 kW of rejected heat. The condenser is at 30 °C. Choose the boiler temperature and the fuel rate.",
    controls: [slider("hot", "Boiler temperature", "°C", 100, 400, 1, 250), fixed("cold", "Condenser temperature", "°C", 30), slider("heat", "Fuel heat rate", "kW", 50, 250, 1, 120)],
    hint: "At 300 °C the efficiency is 0.6(1 − 303.15/573.15) = 0.283, so Q_h = W/η. Check that Q_c = Q_h − W stays under 100 kW.",
  },
  {
    id: "second-law", title: "Respect the second law", difficulty: "Advanced", carnotFraction: 0.75, targetWorkKilowatts: 30, maximumBoilerCelsius: 350, minimumCondenserCelsius: 40, maximumRejectedKilowatts: null,
    situation: "With fuel at 90 kW and an engine reaching 75% of Carnot, deliver 30 kW (± 5%). The boiler cannot exceed 350 °C and the condenser cannot be colder than 40 °C. Choose both temperatures.",
    controls: [slider("hot", "Boiler temperature", "°C", 100, 400, 1, 250), slider("cold", "Condenser temperature", "°C", 25, 100, 1, 50), fixed("heat", "Fuel heat rate", "kW", 90)],
    hint: "You need η = 30/90 = 1/3 = 0.75 η_C, so η_C = 4/9 and T_c/T_h = 5/9. Pick a condenser temperature allowed, then find the boiler temperature.",
  },
]);

export function runSteam(round: SteamRound, v: NumericControl): SteamOutcome {
  const hotKelvin = (v.hot as number) + KELVIN;
  const coldKelvin = (v.cold as number) + KELVIN;
  if (hotKelvin <= coldKelvin) throw new RangeError("The boiler must be hotter than the condenser.");
  const engine = calculateEngine(hotKelvin, coldKelvin, (v.heat as number) * 1000, round.carnotFraction);
  const workKw = engine.workWatts / 1000;
  const error = Math.abs(workKw - round.targetWorkKilowatts) / round.targetWorkKilowatts;
  const problems: string[] = [];
  if (error > POWER_TOLERANCE) problems.push(`The engine delivers ${workKw.toFixed(1)} kW, ${workKw < round.targetWorkKilowatts ? "short of" : "above"} the ${round.targetWorkKilowatts} kW target (efficiency ${(engine.efficiency * 100).toFixed(1)}%, Carnot limit ${(engine.carnotEfficiency * 100).toFixed(1)}%).`);
  if (round.maximumBoilerCelsius !== null && (v.hot as number) > round.maximumBoilerCelsius) problems.push(`A boiler at ${v.hot} °C exceeds the ${round.maximumBoilerCelsius} °C material limit.`);
  if (round.minimumCondenserCelsius !== null && (v.cold as number) < round.minimumCondenserCelsius) problems.push(`The condenser cannot be colder than ${round.minimumCondenserCelsius} °C.`);
  if (round.maximumRejectedKilowatts !== null && engine.rejectedHeatWatts / 1000 > round.maximumRejectedKilowatts) problems.push(`${(engine.rejectedHeatWatts / 1000).toFixed(0)} kW of heat is rejected, above the ${round.maximumRejectedKilowatts} kW the river can take.`);
  const success = problems.length === 0;
  return {
    success, engine, hotKelvin, coldKelvin,
    accuracyFraction: success ? 1 - error / POWER_TOLERANCE : 0,
    predictionActual: engine.efficiency * 100,
    feedback: success ? `${workKw.toFixed(1)} kW of work at ${(engine.efficiency * 100).toFixed(1)}% efficiency; ${(engine.rejectedHeatWatts / 1000).toFixed(0)} kW rejected.` : problems.join(" "),
  };
}

export const steamEngine = defineNumericGame<SteamRound, SteamOutcome>({
  meta: STEAM_META,
  rounds: STEAM_ROUNDS,
  prediction: () => ({ label: "Your prediction of the engine's efficiency", unit: "%", placeholder: "e.g. 20", step: 0.1 }),
  evaluate: (round, values) => runSteam(round, values),
});
