import { useParams } from "react-router-dom";
import { NotFoundPage } from "../../app/NotFoundPage";
import { LiveGamePage } from "../../game-engine/live/LiveGamePage";
import { findLiveGameFor } from ".";

export function LiveGameRoute() {
  const { worldId = "", gameId = "" } = useParams();
  const definition = findLiveGameFor(gameId);
  return definition && definition.worldId === worldId ? <LiveGamePage definition={definition} key={definition.id} /> : <NotFoundPage />;
}
