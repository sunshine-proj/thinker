import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateCoulombPotentialMeV } from "../../../physics/nuclear";
import { DT_ENERGY_PER_KG, fusionSimulator, runFusion } from "./fusionSimulator";

export const FusionSimulatorPage = createNumericGamePage({
  definition: fusionSimulator,
  measurements: (game) => {
    const o = runFusion(game.round, game.control);
    return [
      { label: "D–T BARRIER", value: `${o.barrierKeV.toFixed(0)} keV` },
      { label: "THERMAL ENERGY kT", value: o.thermalKeV === null ? "—" : `${o.thermalKeV.toFixed(2)} keV` },
      { label: "D–T ENERGY PER KG", value: `${(o.fuelEnergyPerKg / 1e14).toFixed(2)}×10¹⁴ J` },
      { label: "FUEL YOU CHOSE", value: o.fuelGrams === null ? "—" : `${o.fuelGrams.toFixed(2)} g` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "barrier") {
      const points = Array.from({ length: 120 }, (_, i) => {
        const r = 3 + (27 * i) / 119;
        return { x: r, y: calculateCoulombPotentialMeV(1, 1, r) * 1000 };
      });
      const energy = game.control.energy as number;
      return <LineChart description="Electric potential energy of a deuteron and a triton against separation: it rises to about 444 keV at the contact distance of 3.2 femtometers. A dashed line shows your energy." series={[{ label: "Coulomb barrier", points }, { label: "Your energy", dashed: true, points: [{ x: 3, y: energy }, { x: 30, y: energy }] }]} title="The Coulomb barrier" xDomain={[3, 30]} xLabel="Separation (fm)" yDomain={[0, Math.max(500, energy * 1.1)]} yLabel="Potential energy (keV)" />;
    }
    if (game.round.kind === "temperature") {
      const points = Array.from({ length: 80 }, (_, i) => {
        const t = 1 + (499 * i) / 79;
        return { x: t, y: (t * 1e6 * 1.380649e-23) / (1.602176634e-16) };
      });
      const t = game.control.temperature as number;
      return <LineChart description="Thermal energy kT in keV against temperature in millions of kelvin; it is a straight line, 10 keV at 116 million kelvin." series={[{ label: "kT", points }, { label: "Target 10 keV", dashed: true, points: [{ x: 1, y: 10 }, { x: 500, y: 10 }] }, { label: "Your temperature", dashed: true, points: [{ x: t, y: 0 }, { x: t, y: 45 }] }]} title="Plasma temperature" xDomain={[1, 500]} xLabel="Temperature (million K)" yDomain={[0, 45]} yLabel="kT (keV)" />;
    }
    const points = Array.from({ length: 60 }, (_, i) => {
      const g = 0.1 + (9.9 * i) / 59;
      return { x: g, y: (g / 1000) * DT_ENERGY_PER_KG / 1e12 };
    });
    return <LineChart description="Energy released against mass of D–T fuel, in terajoules; 3 grams give about 1 terajoule." series={[{ label: "Energy", points }, { label: "Target 1 TJ", dashed: true, points: [{ x: 0.1, y: 1 }, { x: 10, y: 1 }] }]} title="Fuel and energy" xDomain={[0.1, 10]} xLabel="Fuel mass (g)" yDomain={[0, 4]} yLabel="Energy (TJ)" />;
  },
});

