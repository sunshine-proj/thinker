import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { energyCurve, particleAccelerator } from "./particleAccelerator";

export const ParticleAcceleratorPage = createNumericGamePage({
  definition: particleAccelerator,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "CYCLOTRON FREQUENCY", value: o ? `${o.cyclotronFrequencyMHz.toFixed(2)} MHz` : "—" },
      { label: "RF FREQUENCY", value: game.round.rfFrequencyHertz ? `${(game.round.rfFrequencyHertz / 1e6).toFixed(0)} MHz` : "adjusts" },
      { label: "BEAM ENERGY", value: o ? `${o.energyMeV.toFixed(1)} MeV` : "—" },
      { label: "MODE", value: game.round.relativistic ? "Relativistic (advanced)" : "Classical" },
    ];
  },
  visual: (game) => {
    if (!game.last) return <p className="balance-situation">Set up the accelerator and run the beam to see the energy against radius.</p>;
    const { round } = game;
    const target = round.targetEnergyMeV;
    return (
      <LineChart
        band={target === null ? undefined : { label: `${target} MeV ± ${(round.energyTolerance * 100).toFixed(0)}%`, yMin: target * (1 - round.energyTolerance), yMax: target * (1 + round.energyTolerance) }}
        description="Kinetic energy rises with the square of the extraction radius classically. The relativistic curve bends below it at high energy."
        series={[
          { label: "Relativistic", points: energyCurve(round, game.last.control, true) },
          { label: "Classical", points: energyCurve(round, game.last.control, false), dashed: true },
        ]}
        title="Beam energy against extraction radius"
        xLabel="Extraction radius (m)"
        yLabel="Kinetic energy (MeV)"
      />
    );
  },
});
