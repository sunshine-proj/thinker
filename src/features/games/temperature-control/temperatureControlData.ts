import type { RoundBase, RoundGameMeta } from "../../../game-engine/rounds/types";

export interface HeatRound extends RoundBase {
  readonly wallAreaSquareMeters: number;
  /** Conductivity of the insulation, W/(m·K): mineral wool. */
  readonly conductivity: number;
  readonly outsideTemperatureCelsius: number;
  readonly initialTemperatureCelsius: number;
  readonly heatCapacityJoulesPerKelvin: number;
  readonly heater: { readonly fixedWatts: number | null; readonly minimum: number; readonly maximum: number; readonly step: number };
  readonly insulation: { readonly fixedCentimeters: number | null; readonly minimum: number; readonly maximum: number; readonly step: number };
  readonly goal: {
    readonly targetCelsius: number;
    readonly toleranceKelvin: number;
    /** The heater may not be rated above this. */
    readonly maximumPowerWatts: number | null;
    /** The room must reach this temperature within the time. */
    readonly warmUp: { readonly reachCelsius: number; readonly withinHours: number } | null;
  };
}

export interface HeatControl {
  readonly heaterWatts: number;
  readonly insulationCentimeters: number;
}

export const SIMULATION_HOURS = 12;

export const TEMPERATURE_CONTROL_META: RoundGameMeta = {
  id: "temperature-control",
  title: "Temperature Control",
  eyebrow: "THERMODYNAMICS · HEAT TRANSFER",
  modelTag: "CONDUCTION · THERMAL EQUILIBRIUM",
  introduction:
    "Keep a cold-weather cabin comfortable. Balance the heat the heater supplies against the heat leaking through the walls, and find the temperature where the two are equal.",
  instructions:
    "Predict how far above the outside temperature the room will settle, choose the heater power and insulation thickness, then run the winter night. The chart shows the room warming toward its equilibrium.",
  formula: "Q = k A ΔT / d  ·  P = U (T − T_out)  ·  τ = C / U",
  formulaCaption:
    "k is the insulation's conductivity, A the wall area, d the thickness, U = kA/d the conductance in W/K, P the heater power, C the room's heat capacity, and τ the time constant of warming.",
  explanation:
    "Heat leaks out through the walls at a rate proportional to the temperature difference, so the room cools faster the warmer it gets. It stops warming at the equilibrium temperature where the heater power equals the heat loss, P = U (T − T_out). Thicker insulation lowers U, so the same heater reaches a higher temperature, but it also makes the room respond more slowly because the time constant τ = C/U is longer. Reaching the equilibrium is exponential: after one time constant the room has covered about 63% of the way.",
  assumptions:
    "The room is a single well-mixed lump with a constant heat capacity. Heat is lost only by conduction through the insulated walls, with constant conductivity: there are no drafts, windows, radiation or wind, and the outside temperature stays fixed.",
  learningObjectives: [
    "Apply Fourier's law Q = k A ΔT / d to heat loss through a wall.",
    "Find thermal equilibrium by setting heater power equal to heat loss.",
    "Understand the exponential approach to equilibrium and the role of the time constant.",
  ],
  objective: {
    title: "Keep every cabin warm",
    description: "Hold each cabin at its target temperature.",
    unit: "cabins",
  },
  controlsHeading: "Set up the heating",
  submitLabel: "Run the winter night",
  solvedLabel: "Cabin comfortable!",
  nextLabel: "Next cabin",
};

export const HEAT_ROUNDS: readonly HeatRound[] = Object.freeze([
  {
    id: "choose-the-heater",
    title: "Choose the heater",
    difficulty: "Beginner",
    situation:
      "A cabin has 40 m² of walls insulated with 10 cm of mineral wool (k = 0.04 W/m·K). It is −5 °C outside. Pick the heater power that holds the cabin at 20 °C (± 1 °C).",
    wallAreaSquareMeters: 40,
    conductivity: 0.04,
    outsideTemperatureCelsius: -5,
    initialTemperatureCelsius: 5,
    heatCapacityJoulesPerKelvin: 2e5,
    heater: { fixedWatts: null, minimum: 0, maximum: 1000, step: 10 },
    insulation: { fixedCentimeters: 10, minimum: 10, maximum: 10, step: 1 },
    goal: { targetCelsius: 20, toleranceKelvin: 1, maximumPowerWatts: null, warmUp: null },
    hint: "At equilibrium the heater power equals the heat lost through the walls: P = (k A / d)(T_in − T_out). Work out U = kA/d first.",
  },
  {
    id: "choose-the-insulation",
    title: "Choose the insulation",
    difficulty: "Intermediate",
    situation:
      "The heater is stuck at 300 W. Choose the thickness of mineral wool so the cabin settles at 20 °C (± 1 °C) when it is −5 °C outside.",
    wallAreaSquareMeters: 40,
    conductivity: 0.04,
    outsideTemperatureCelsius: -5,
    initialTemperatureCelsius: 5,
    heatCapacityJoulesPerKelvin: 2e5,
    heater: { fixedWatts: 300, minimum: 300, maximum: 300, step: 1 },
    insulation: { fixedCentimeters: null, minimum: 2, maximum: 30, step: 0.1 },
    goal: { targetCelsius: 20, toleranceKelvin: 1, maximumPowerWatts: null, warmUp: null },
    hint: "You need U = P / ΔT = 300 / 25. Then d = k A / U.",
  },
  {
    id: "warm-and-frugal",
    title: "Warm, quick, and frugal",
    difficulty: "Advanced",
    situation:
      "On a −10 °C night the cabin starts at 5 °C. Hold it at 20 °C (± 1 °C), with a heater rated for no more than 800 W, and get it up to 18 °C within 5 hours. Both heater power and insulation are yours to choose.",
    wallAreaSquareMeters: 40,
    conductivity: 0.04,
    outsideTemperatureCelsius: -10,
    initialTemperatureCelsius: 5,
    heatCapacityJoulesPerKelvin: 2e5,
    heater: { fixedWatts: null, minimum: 100, maximum: 1500, step: 10 },
    insulation: { fixedCentimeters: null, minimum: 2, maximum: 20, step: 0.1 },
    goal: {
      targetCelsius: 20,
      toleranceKelvin: 1,
      maximumPowerWatts: 800,
      warmUp: { reachCelsius: 18, withinHours: 5 },
    },
    hint: "The power limit forces U ≤ 800/30 W/K (so thick enough insulation), but a small U makes τ = C/U long and the warm-up slow. Thinner insulation with the most power you are allowed is fastest; find the thickness where both limits are met.",
  },
]);
