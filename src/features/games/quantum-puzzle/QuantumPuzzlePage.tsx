import { createNumericGamePage } from "../../../game-engine/rounds";
import { quantumPuzzle, runPuzzle } from "./quantumPuzzle";

export const QuantumPuzzlePage = createNumericGamePage({
  definition: quantumPuzzle,
  measurements: (game) => {
    const o = runPuzzle(game.round, game.control);
    return [
      { label: o.labels[0].toUpperCase(), value: `${(o.probability * 100).toFixed(1)} %` },
      { label: o.labels[1].toUpperCase(), value: `${((1 - o.probability) * 100).toFixed(1)} %` },
      { label: "AMPLITUDE", value: `${Math.sqrt(o.probability).toFixed(3)}` },
      { label: "CHECK", value: "P₀ + P₁ = 1" },
    ];
  },
  visual: (game) => {
    const o = runPuzzle(game.round, game.control);
    const bars = [o.probability, 1 - o.probability];
    return (
      <svg aria-label={`${o.labels[0]} ${(bars[0]! * 100).toFixed(1)} percent, ${o.labels[1]} ${(bars[1]! * 100).toFixed(1)} percent.`} className="balance-plot" role="img" viewBox="0 0 700 250">
        <rect fill="#f9faff" height="250" rx="10" width="700" />
        {bars.map((p, i) => (
          <g key={o.labels[i]}>
            <rect fill={i === 0 ? "#596be0" : "#d98a1f"} height={p * 170} width="120" x={190 + i * 220} y={200 - p * 170} />
            <text className="balance-plot__pivot-label" textAnchor="middle" x={250 + i * 220} y="222">{o.labels[i]}</text>
            <text className="balance-plot__pivot-label" textAnchor="middle" x={250 + i * 220} y={192 - p * 170}>{(p * 100).toFixed(1)} %</text>
          </g>
        ))}
      </svg>
    );
  },
});
