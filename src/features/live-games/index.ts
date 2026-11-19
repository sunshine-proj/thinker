import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { atomLive } from "./atomLive";
import { basketballLive } from "./basketballLive";
import { landerLive } from "./landerLive";
import { laserLive } from "./laserLive";
import { magneticMazeLive } from "./magneticMazeLive";
import { projectileLive } from "./projectileLive";
import { reactorLive } from "./reactorLive";
import { shipLive } from "./shipLive";
import { swingLive } from "./swingLive";
import { thermostatLive } from "./thermostatLive";

/** One real-time flagship game per physics world (ROADMAP task 116). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LIVE_GAMES: readonly LiveGameDefinition<any>[] = Object.freeze([
  projectileLive,
  magneticMazeLive,
  thermostatLive,
  laserLive,
  swingLive,
  landerLive,
  atomLive,
  shipLive,
  reactorLive,
  basketballLive,
]);

export function findLiveGameFor(relatedGameId: string) {
  return LIVE_GAMES.find((game) => game.relatedGameId === relatedGameId);
}

export function findLiveGame(id: string) {
  return LIVE_GAMES.find((game) => game.id === id);
}
