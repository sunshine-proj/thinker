import { Suspense, lazy, type ReactElement } from "react";
import { NotFoundPage } from "../../app/NotFoundPage";
import { LiveGamePage } from "../../game-engine/live/LiveGamePage";
import { PLAYGROUND_GAME_LOADERS } from "./loaders";

/**
 * One lazily loaded page per game, built once when this module loads: each game's code is
 * its own chunk, downloaded only when its page is first shown.
 */
const PAGES: ReadonlyMap<string, ReactElement> = new Map(
  Object.entries(PLAYGROUND_GAME_LOADERS).map(([id, load]) => {
    const Page = lazy(() => load().then((definition) => ({ default: () => <LiveGamePage definition={definition} key={definition.id} /> })));
    return [id, <Page key={id} />];
  }),
);

export function PlaygroundGameRoute({ gameId }: { readonly gameId: string }) {
  const page = PAGES.get(gameId);
  if (!page) return <NotFoundPage />;
  return <Suspense fallback={<p className="route-loading" role="status">Loading…</p>}>{page}</Suspense>;
}
