/**
 * Titles of the thought experiments, kept as plain data so pages in the main bundle
 * (Home) can name them without loading the experiments and their physics.
 * A test checks this list matches src/features/thought-experiments/thoughtExperiments.ts.
 */
export const THOUGHT_EXPERIMENT_TITLES: Readonly<Record<string, string>> = Object.freeze({
  "gravity-disappears": "What if Earth's gravity disappeared?",
  "gravity-doubles": "What if gravity doubled?",
  "feather-vacuum": "What if a feather fell in a vacuum?",
  "near-light-speed": "What would happen near the speed of light?",
  "two-moons": "What if Earth had two moons?",
  "absolute-zero": "What happens near absolute zero?",
  "slower-light": "What if light traveled slower?",
});

export function findThoughtExperimentTitle(id: string): { readonly title: string } | undefined {
  const title = THOUGHT_EXPERIMENT_TITLES[id];
  return title ? { title } : undefined;
}
