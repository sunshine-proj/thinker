import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { bottleBand } from "./bottleBand";
import { lightUpTheCity } from "./lightUpTheCity";
import { pirateCargoShip } from "./pirateCargoShip";
import { skatePark } from "./skatePark";
import { tankDuel } from "./tankDuel";

/** Phase 9 playground games for younger pupils; each has its own catalog entry. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PLAYGROUND_GAMES: readonly LiveGameDefinition<any>[] = Object.freeze([
  tankDuel,
  lightUpTheCity,
  bottleBand,
  pirateCargoShip,
  skatePark,
]);

export function findPlaygroundGame(id: string) {
  return PLAYGROUND_GAMES.find((game) => game.id === id);
}
