import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { raceSimulator } from "./raceSimulator";

export const RaceSimulatorPage = createNumericGamePage({
  definition: raceSimulator,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "FINISH TIME", value: o?.timeSeconds != null ? `${o.timeSeconds.toFixed(2)} s` : "—" },
      { label: "STOPPING DISTANCE", value: o?.stoppingDistanceMeters != null ? `${o.stoppingDistanceMeters.toFixed(1)} m` : "—" },
      { label: "GAP TO WALL", value: o?.gapMeters != null ? `${o.gapMeters.toFixed(1)} m` : "—" },
      { label: "DISTANCE", value: `${game.round.distanceMeters} m` },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    if (!o) {
      return <p className="balance-situation">Set your tuning, then start the race to see position against time.</p>;
    }
    const wall = game.round.kind === "brake";
    const series = [
      { label: "Your car", points: o.curve },
      ...(o.rivalCurve.length ? [{ label: "Rival", points: o.rivalCurve, dashed: true }] : []),
      ...(wall ? [{ label: "Wall", points: o.curve.map((p) => ({ x: p.x, y: game.round.distanceMeters })), dashed: true }] : []),
    ];
    return (
      <LineChart
        description={`Your car's position rises from zero over ${o.curve.at(-1)?.x.toFixed(1)} seconds. ${o.feedback}`}
        series={series}
        title="Position against time"
        xLabel="Time (s)"
        yLabel="Position (m)"
      />
    );
  },
});
