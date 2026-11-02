import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { deltaVCurve, spaceMission } from "./spaceMission";

export const SpaceMissionPage = createNumericGamePage({
  definition: spaceMission,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "DELTA-V ACHIEVED", value: o ? `${o.deltaV.toFixed(0)} m/s` : "—" },
      { label: "TARGET DELTA-V", value: `${game.round.targetDeltaV} m/s` },
      { label: "LAUNCH MASS", value: o ? `${o.launchMassKilograms.toFixed(0)} kg` : "—" },
      { label: "MASS LIMIT", value: `${game.round.maximumLaunchMassKilograms} kg` },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    if (!o) {
      return <p className="balance-situation">Choose your loading and launch to see how delta-v grows with propellant.</p>;
    }
    const { round } = game;
    return (
      <LineChart
        band={{ label: `${round.targetDeltaV} m/s`, yMin: round.targetDeltaV, yMax: round.targetDeltaV * (1 + round.overshootFraction) }}
        description="Delta-v rises with propellant mass but flattens: each extra kilogram adds less than the one before."
        series={[{ label: "Delta-v", points: deltaVCurve(round, game.last!.control) }]}
        title="Delta-v against propellant mass"
        xLabel={round.kind === "staged" ? "Stage 1 propellant (kg)" : "Propellant (kg)"}
        yLabel="Delta-v (m/s)"
      />
    );
  },
  details: (game) => {
    const o = game.last?.outcome;
    return o && o.stages.length > 1 ? (
      <table className="circuit-readings">
        <caption>DELTA-V BY STAGE</caption>
        <thead><tr><th scope="col">Stage</th><th scope="col">Delta-v</th></tr></thead>
        <tbody>{o.stages.map((s) => (<tr key={s.label}><td>{s.label}</td><td>{s.deltaV.toFixed(0)} m/s</td></tr>))}</tbody>
      </table>
    ) : null;
  },
});
