import { createNumericGamePage } from "../../../game-engine/rounds";
import { echoExplorer, runEcho, type EchoRound } from "./echoExplorer";
import type { NumericControl } from "../../../game-engine/rounds";

function EchoView({ round, control }: { round: EchoRound; control: NumericControl }) {
  const o = runEcho(round, control);
  const wallX = round.kind === "temperature" ? 560 : 120 + (o.distanceMeters / 700) * 440;
  return (
    <svg aria-label={`A person ${o.distanceMeters.toFixed(0)} meters from a wall. Sound at ${o.temperatureCelsius.toFixed(1)} degrees Celsius travels ${o.speedOfSound.toFixed(1)} meters per second and the echo returns after ${o.delaySeconds} seconds.`} className="balance-plot" role="img" viewBox="0 0 700 250">
      <rect fill="#f9faff" height="250" rx="10" width="700" />
      <circle cx="90" cy="130" fill="#364057" r="12" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x="90" y="165">you</text>
      <rect fill="#9aa5cf" height="110" width="14" x={wallX} y="75" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x={wallX + 7} y="205">wall</text>
      <line stroke="#d98a1f" strokeWidth="3" x1="115" x2={wallX - 8} y1="120" y2="120" />
      <line stroke="#2a6f4f" strokeDasharray="6 4" strokeWidth="3" x1={wallX - 8} x2="115" y1="140" y2="140" />
      <text className="balance-plot__pivot-label" textAnchor="middle" x={(115 + wallX) / 2} y="60">d = {o.distanceMeters.toFixed(0)} m · v = {o.speedOfSound.toFixed(1)} m/s</text>
      <text className="balance-plot__pivot-label" textAnchor="middle" x={(115 + wallX) / 2} y="235">out and back in {o.delaySeconds} s</text>
    </svg>
  );
}

export const EchoExplorerPage = createNumericGamePage({
  definition: echoExplorer,
  measurements: (game) => {
    const o = runEcho(game.round, game.control);
    return [
      { label: "SPEED OF SOUND", value: `${o.speedOfSound.toFixed(1)} m/s` },
      { label: "AIR TEMPERATURE", value: `${o.temperatureCelsius.toFixed(1)} °C` },
      { label: "ECHO DELAY", value: `${o.delaySeconds} s` },
      { label: "DISTANCE", value: `${o.distanceMeters.toFixed(0)} m` },
    ];
  },
  visual: (game) => <EchoView control={game.control} round={game.round} />,
});
