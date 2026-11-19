import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { atomDisco } from "./atomDisco";
import { balloonStaticParty } from "./balloonStaticParty";
import { batNightHunt } from "./batNightHunt";
import { bikeDownhill } from "./bikeDownhill";
import { bottleBand } from "./bottleBand";
import { dominoRally } from "./dominoRally";
import { fossilDetective } from "./fossilDetective";
import { ghostParticleMaze } from "./ghostParticleMaze";
import { hotAirBalloonRace } from "./hotAirBalloonRace";
import { iceCreamRescue } from "./iceCreamRescue";
import { isotopePuzzle } from "./isotopePuzzle";
import { laserHeist } from "./laserHeist";
import { lightUpTheCity } from "./lightUpTheCity";
import { magnetFishing } from "./magnetFishing";
import { paperPlaneContest } from "./paperPlaneContest";
import { penguinIgloo } from "./penguinIgloo";
import { pirateCargoShip } from "./pirateCargoShip";
import { planetBakery } from "./planetBakery";
import { rainbowPainter } from "./rainbowPainter";
import { rocketDelivery } from "./rocketDelivery";
import { shadowPuppets } from "./shadowPuppets";
import { skatePark } from "./skatePark";
import { slingshotProbe } from "./slingshotProbe";
import { solarPowerPlant } from "./solarPowerPlant";
import { spaceHockey } from "./spaceHockey";
import { starFurnace } from "./starFurnace";
import { submarineExplorer } from "./submarineExplorer";
import { surfTheWave } from "./surfTheWave";
import { tankDuel } from "./tankDuel";
import { waterBalloonFight } from "./waterBalloonFight";

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
  batNightHunt,
  surfTheWave,
  slingshotProbe,
  planetBakery,
  rocketDelivery,
  atomDisco,
  ghostParticleMaze,
  solarPowerPlant,
  submarineExplorer,
  paperPlaneContest,
  isotopePuzzle,
  fossilDetective,
  starFurnace,
  bikeDownhill,
  waterBalloonFight,
]);

export function findPlaygroundGame(id: string) {
  return PLAYGROUND_GAMES.find((game) => game.id === id);
}
