import { NotFoundPage } from "../../app/NotFoundPage";
import { LiveGamePage } from "../../game-engine/live/LiveGamePage";
import { findPlaygroundGame } from ".";

export function PlaygroundGameRoute({ gameId }: { readonly gameId: string }) {
  const definition = findPlaygroundGame(gameId);
  return definition ? <LiveGamePage definition={definition} key={definition.id} /> : <NotFoundPage />;
}
