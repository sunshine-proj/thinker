/**
 * Which games have a real-time ("live") version, keyed by the classic game's id. Kept as
 * plain data so game pages can link to the live version without loading it.
 */
export const LIVE_VERSIONS: Readonly<Record<string, { readonly id: string; readonly title: string }>> = Object.freeze({
  "projectile-master": { id: "projectile-master-live", title: "Projectile Master Live" },
  "magnetic-maze": { id: "magnetic-maze-live", title: "Magnetic Maze Live" },
  "temperature-control": { id: "temperature-control-live", title: "Temperature Control Live" },
  "laser-maze": { id: "laser-maze-live", title: "Laser Maze Live" },
  "resonance-swing": { id: "resonance-swing-live", title: "Resonance Swing Live" },
  "moon-landing": { id: "moon-landing-live", title: "Moon Landing Live" },
  "atom-builder": { id: "atom-builder-live", title: "Atom Builder Live" },
  "ship-designer": { id: "ship-designer-live", title: "Ship Designer Live" },
  "reactor-operator": { id: "reactor-operator-live", title: "Reactor Operator Live" },
  "basketball-challenge": { id: "basketball-challenge-live", title: "Basketball Challenge Live" },
});

export const livePathFor = (gamePath: string) => `${gamePath}/live`;

/** Title of any activity id, including live versions, for lists of results. */
export function findLiveTitle(id: string): string | undefined {
  return Object.values(LIVE_VERSIONS).find((entry) => entry.id === id)?.title;
}
