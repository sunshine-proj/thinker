import { EARTH_MEAN_RADIUS } from "../../physics/core";
import { calculatePlanetPropertiesFromEarthUnits, type PlanetProperties } from "../../physics/astronomy";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, stars } from "./scenery";

/** Take-off speed of a good standing jump, m/s: about 0.2 m high on Earth. */
export const JUMP_SPEED = 2;

interface Recipe {
  readonly title: string;
  readonly goal: string;
  readonly jump?: readonly [number, number];
  readonly gravity?: readonly [number, number];
  readonly density?: readonly [number, number];
  readonly minRadius?: number;
  readonly maxEscape?: number;
}
export const RECIPES: readonly Recipe[] = [
  { title: "Bouncy planet", goal: "Bake a planet where the astronaut jumps 1–1.5 m high.", jump: [1, 1.5] },
  { title: "Super-Earth", goal: "At least 1.5 times as wide as Earth, with Earth-like gravity (8.8–10.8 m/s²), and made of rock (3–6 g/cm³).", gravity: [8.8, 10.8], density: [3000, 6000], minRadius: 1.5 },
  { title: "Rocket port", goal: "Rockets should escape at under 5 km/s, but astronauts need at least 3 m/s² of gravity to walk, and it must be rocky (3–6 g/cm³).", gravity: [3, 100], density: [3000, 6000], maxEscape: 5000 },
];

export const jumpHeight = (planet: PlanetProperties) => JUMP_SPEED ** 2 / (2 * planet.surfaceGravity);

export function judgePlanet(level: number, earthMasses: number, earthRadii: number): { planet: PlanetProperties; problems: string[] } {
  const recipe = RECIPES[level] as Recipe;
  const planet = calculatePlanetPropertiesFromEarthUnits(earthMasses, earthRadii);
  const problems: string[] = [];
  const height = jumpHeight(planet);
  if (recipe.jump && height < recipe.jump[0]) problems.push("the jump is too low: gravity is too strong");
  if (recipe.jump && height > recipe.jump[1]) problems.push("the jump is too high: gravity is too weak");
  if (recipe.minRadius && earthRadii < recipe.minRadius) problems.push("the planet is too small");
  if (recipe.gravity && planet.surfaceGravity < recipe.gravity[0]) problems.push("gravity is too weak");
  if (recipe.gravity && planet.surfaceGravity > recipe.gravity[1]) problems.push("gravity is too strong");
  if (recipe.density && planet.meanDensity < recipe.density[0]) problems.push("it is too fluffy for rock (too little mass for its size)");
  if (recipe.density && planet.meanDensity > recipe.density[1]) problems.push("it is denser than any rock (too much mass for its size)");
  if (recipe.maxEscape && planet.escapeSpeed > recipe.maxEscape) problems.push("rockets need too much speed to escape");
  return { planet, problems };
}

export interface BakeryState { readonly bakes: number; readonly problems: readonly string[] | null }

export const planetBakery: LiveGameDefinition<BakeryState> = {
  id: "planet-bakery",
  title: "Planet Bakery",
  worldId: "astronomy",
  eyebrow: "PLAYGROUND · GRAVITY",
  modelTag: "g = G M / R²",
  introduction: "Welcome to the Planet Bakery! Mix in mass, choose the size, and bake a planet. Then send an astronaut to test it with a big jump.",
  howToPlay: "Set the planet's mass and radius (in Earths), then press Bake (Space or Enter).",
  physics: "Gravity at the surface is g = GM/R²: more mass pulls harder, but a bigger planet puts you farther from its middle, so the pull is weaker. On weak-gravity worlds you jump much higher (height = v²/2g). The density, mass ÷ volume, tells you what the planet is made of: rock is 3–6 g/cm³, ice and gas much less. The escape speed √(2GM/R) is how fast a rocket must go to leave.",
  assumptions: "A round, non-spinning planet of uniform make-up, no atmosphere, an astronaut taking off at 2 m/s (about 20 cm high on Earth) whatever the gravity, and Earth's mass and mean radius as the units.",
  levels: RECIPES.map((recipe, index) => ({ id: `recipe-${index + 1}`, title: recipe.title, goal: recipe.goal })),
  sliders: () => [
    { key: "mass", label: "Mass", unit: "Earths", minimum: 0.005, maximum: 10, step: 0.005, initial: 1 },
    { key: "radius", label: "Radius", unit: "Earths", minimum: 0.1, maximum: 3, step: 0.01, initial: 1 },
  ],
  actions: [{ id: "bake", label: "Bake!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ bakes: 0, problems: null }),
  step(state, input, _dt, level) {
    if (!input.pressed.has("bake")) return state;
    return { bakes: state.bakes + 1, problems: judgePlanet(level, input.values.mass ?? 1, input.values.radius ?? 1).problems };
  },
  verdict(state) {
    if (!state.problems) return { status: "playing", message: "Mix the ingredients, then bake." };
    if (state.problems.length === 0) return { status: "won", message: `Ding! A perfect planet after ${state.bakes} bake${state.bakes === 1 ? "" : "s"}.` };
    return { status: "playing", message: `Not quite: ${state.problems.join("; ")}.` };
  },
  stars: (state) => (state.bakes <= 1 ? 3 : state.bakes <= 3 ? 2 : 1),
  readouts: (_state, input) => {
    const planet = calculatePlanetPropertiesFromEarthUnits(input.values.mass ?? 1, input.values.radius ?? 1);
    return [
      { label: "GRAVITY g", value: `${planet.surfaceGravity.toFixed(2)} m/s²` },
      { label: "ASTRONAUT'S JUMP", value: `${jumpHeight(planet).toFixed(2)} m` },
      { label: "DENSITY", value: `${(planet.meanDensity / 1000).toFixed(2)} g/cm³` },
      { label: "ESCAPE SPEED", value: `${(planet.escapeSpeed / 1000).toFixed(2)} km/s` },
    ];
  },
  draw(context, state, input, width, height) {
    context.fillStyle = "#0b0d26";
    context.fillRect(0, 0, width, height);
    stars(context, width, height);
    const mass = input.values.mass ?? 1;
    const radius = input.values.radius ?? 1;
    const planet = calculatePlanetPropertiesFromEarthUnits(mass, radius);
    const r = Math.min(height * 0.32, 20 + radius * 50);
    const cx = width / 2;
    const cy = height + r * 0.35;
    const density = planet.meanDensity;
    context.fillStyle = density > 6000 ? "#868e96" : density >= 3000 ? "#d9480f" : density > 1500 ? "#74c0fc" : "#ffd8a8";
    context.beginPath();
    context.arc(cx, cy, r * 1.6, 0, 2 * Math.PI);
    context.fill();
    const surface = cy - r * 1.6;
    const jump = Math.min(jumpHeight(planet), 4);
    const astronautY = surface - 20 - jump * 40;
    context.fillStyle = PLAYGROUND_COLOURS.white;
    context.fillRect(cx - 6, astronautY, 12, 20);
    context.beginPath();
    context.arc(cx, astronautY - 6, 7, 0, 2 * Math.PI);
    context.fill();
    badge(context, `jump ${jumpHeight(planet).toFixed(2)} m`, cx + 14, astronautY, "#5f3dc4");
    badge(context, `${(radius * EARTH_MEAN_RADIUS / 1000).toFixed(0)} km radius`, 12, 24, "#364fc7");
    if (state.problems && state.problems.length === 0) badge(context, "PERFECT PLANET!", cx - 60, 50, "#2b8a3e");
  },
  describe: (_state, input) => {
    const planet = calculatePlanetPropertiesFromEarthUnits(input.values.mass ?? 1, input.values.radius ?? 1);
    return `A planet of ${(input.values.mass ?? 1).toFixed(3)} Earth masses and ${(input.values.radius ?? 1).toFixed(2)} Earth radii: gravity ${planet.surfaceGravity.toFixed(2)} metres per second squared, a jump of ${jumpHeight(planet).toFixed(2)} metres, density ${(planet.meanDensity / 1000).toFixed(2)} grams per cubic centimetre.`;
  },
};
