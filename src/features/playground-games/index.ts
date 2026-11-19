import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { balloonStaticParty } from "./balloonStaticParty";
import { bottleBand } from "./bottleBand";
import { dominoRally } from "./dominoRally";
import { hotAirBalloonRace } from "./hotAirBalloonRace";
import { iceCreamRescue } from "./iceCreamRescue";
import { laserHeist } from "./laserHeist";
import { lightUpTheCity } from "./lightUpTheCity";
import { magnetFishing } from "./magnetFishing";
import { penguinIgloo } from "./penguinIgloo";
import { pirateCargoShip } from "./pirateCargoShip";
import { rainbowPainter } from "./rainbowPainter";
import { shadowPuppets } from "./shadowPuppets";
import { skatePark } from "./skatePark";
import { spaceHockey } from "./spaceHockey";
import { tankDuel } from "./tankDuel";

/** Phase 9 playground games for younger pupils; each has its own catalog entry. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PLAYGROUND_GAMES: readonly LiveGameDefinition<any>[] = Object.freeze([
  tankDuel,
  lightUpTheCity,
  bottleBand,
  pirateCargoShip,
  skatePark,
  dominoRally,
  spaceHockey,
  magnetFishing,
  balloonStaticParty,
  iceCreamRescue,
  hotAirBalloonRace,
  penguinIgloo,
  laserHeist,
  rainbowPainter,
  shadowPuppets,
]);

export function findPlaygroundGame(id: string) {
  return PLAYGROUND_GAMES.find((game) => game.id === id);
}
