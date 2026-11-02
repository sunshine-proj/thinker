import { createNumericGamePage } from "../../../game-engine/rounds";
import { magneticMaze, traceMazePath, type MazeRound } from "./magneticMaze";

const SIZE = 400;

function Arena({ round, field, speed, solved }: { round: MazeRound; field: number; speed: number; solved: boolean }) {
  const half = round.arenaHalfSize;
  const px = (x: number) => 40 + ((x + half) / (2 * half)) * SIZE;
  const py = (y: number) => 20 + SIZE - ((y + half) / (2 * half)) * SIZE;
  const path = traceMazePath(round, { speed, field: field === 0 ? 1e-9 : field });
  const out = field > 0;
  return (
    <svg
      aria-label={`Magnetic maze arena, ${2 * half} meters across. The ${round.particle} enters at the center moving right. The target is at ${round.target.x}, ${round.target.y} meters. The field points ${field === 0 ? "nowhere" : out ? "out of" : "into"} the screen and the path ${path.hit ? "hits" : "misses"} the target.`}
      className="balance-plot"
      role="img"
      viewBox="0 0 700 440"
    >
      <rect fill="#f9faff" height="440" rx="10" width="700" />
      <rect fill="#fff" height={SIZE} stroke="#c9d0e6" width={SIZE} x="40" y="20" />
      {Array.from({ length: 7 }, (_a, i) => Array.from({ length: 7 }, (_b, j) => (
        <text className="magnetic-symbol" key={`${i}-${j}`} textAnchor="middle" x={40 + ((i + 0.5) * SIZE) / 7} y={20 + ((j + 0.5) * SIZE) / 7 + 6}>{field === 0 ? "" : out ? "•" : "×"}</text>
      )))}
      <circle className={path.hit || solved ? "laser-target laser-target--hit" : "laser-target"} cx={px(round.target.x)} cy={py(round.target.y)} r={(round.target.radius / (2 * half)) * SIZE} />
      <polyline className="laser-beam" fill="none" points={path.points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")} />
      <circle cx={px(0)} cy={py(0)} fill="#364057" r="5" />
      <g className="detective-legend">
        <text x="470" y="60">Red line: the particle's path</text>
        <text x="470" y="84">Green disc: the target</text>
        <text x="470" y="108">{field === 0 ? "No field" : out ? "• field out of the screen" : "× field into the screen"}</text>
      </g>
    </svg>
  );
}

export const MagneticMazePage = createNumericGamePage({
  definition: magneticMaze,
  measurements: (game) => {
    const o = game.last?.outcome;
    const field = game.control.field as number;
    return [
      { label: "PARTICLE", value: game.round.particle === "electron" ? "Electron (−e)" : "Proton (+e)" },
      { label: "FIELD DIRECTION", value: field === 0 ? "none" : field > 0 ? "out of screen" : "into screen" },
      { label: "CIRCLE RADIUS", value: o?.path.orbitRadius != null ? `${o.path.orbitRadius.toFixed(2)} m` : "—" },
      { label: "CLOSEST TO TARGET", value: o ? `${o.path.closestApproach.toFixed(2)} m` : "—" },
    ];
  },
  visual: (game) => (
    <Arena field={game.control.field as number} round={game.round} solved={game.roundSolved} speed={game.control.speed as number} />
  ),
});
