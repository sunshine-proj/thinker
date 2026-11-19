import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";

/**
 * One loader per playground game, so a game page downloads only its own definition and
 * physics instead of all thirty. Tests check that this list matches `PLAYGROUND_GAMES`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PLAYGROUND_GAME_LOADERS: Readonly<Record<string, () => Promise<LiveGameDefinition<any>>>> = Object.freeze({
  "atom-disco": () => import("./atomDisco").then((module) => module.atomDisco),
  "balloon-static-party": () => import("./balloonStaticParty").then((module) => module.balloonStaticParty),
  "bat-night-hunt": () => import("./batNightHunt").then((module) => module.batNightHunt),
  "bike-downhill": () => import("./bikeDownhill").then((module) => module.bikeDownhill),
  "bottle-band": () => import("./bottleBand").then((module) => module.bottleBand),
  "domino-rally": () => import("./dominoRally").then((module) => module.dominoRally),
  "fossil-detective": () => import("./fossilDetective").then((module) => module.fossilDetective),
  "ghost-particle-maze": () => import("./ghostParticleMaze").then((module) => module.ghostParticleMaze),
  "hot-air-balloon-race": () => import("./hotAirBalloonRace").then((module) => module.hotAirBalloonRace),
  "ice-cream-rescue": () => import("./iceCreamRescue").then((module) => module.iceCreamRescue),
  "isotope-puzzle": () => import("./isotopePuzzle").then((module) => module.isotopePuzzle),
  "laser-heist": () => import("./laserHeist").then((module) => module.laserHeist),
  "light-up-the-city": () => import("./lightUpTheCity").then((module) => module.lightUpTheCity),
  "magnet-fishing": () => import("./magnetFishing").then((module) => module.magnetFishing),
  "paper-plane-contest": () => import("./paperPlaneContest").then((module) => module.paperPlaneContest),
  "penguin-igloo": () => import("./penguinIgloo").then((module) => module.penguinIgloo),
  "pirate-cargo-ship": () => import("./pirateCargoShip").then((module) => module.pirateCargoShip),
  "planet-bakery": () => import("./planetBakery").then((module) => module.planetBakery),
  "rainbow-painter": () => import("./rainbowPainter").then((module) => module.rainbowPainter),
  "rocket-delivery": () => import("./rocketDelivery").then((module) => module.rocketDelivery),
  "shadow-puppets": () => import("./shadowPuppets").then((module) => module.shadowPuppets),
  "skate-park": () => import("./skatePark").then((module) => module.skatePark),
  "slingshot-probe": () => import("./slingshotProbe").then((module) => module.slingshotProbe),
  "solar-power-plant": () => import("./solarPowerPlant").then((module) => module.solarPowerPlant),
  "space-hockey": () => import("./spaceHockey").then((module) => module.spaceHockey),
  "star-furnace": () => import("./starFurnace").then((module) => module.starFurnace),
  "submarine-explorer": () => import("./submarineExplorer").then((module) => module.submarineExplorer),
  "surf-the-wave": () => import("./surfTheWave").then((module) => module.surfTheWave),
  "tank-duel": () => import("./tankDuel").then((module) => module.tankDuel),
  "water-balloon-fight": () => import("./waterBalloonFight").then((module) => module.waterBalloonFight),
});
